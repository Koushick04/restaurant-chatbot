import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { authMiddleware } from '../middleware/auth.js';
import { supabase, isDbConnected } from '../config/supabase.js';
import { memoryStore } from '../services/database.js';
import { asyncHandler, badRequest, cleanString, requireUuid } from '../middleware/validate.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.join(__dirname, '../../uploads');
const allowedExtensions = new Set(['.pdf', '.txt', '.md', '.csv', '.doc', '.docx']);

if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname).toLowerCase()}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowedExtensions.has(ext)) return cb(new Error('Unsupported file type'));
    cb(null, true);
  },
});

function uploadSingle(req, res, next) {
  upload.single('file')(req, res, err => {
    if (!err) return next();
    const status = err instanceof multer.MulterError ? 400 : 415;
    return res.status(status).json({ error: err.message || 'Upload failed' });
  });
}

async function extractContent(filePath, fileType) {
  if (fileType === 'text' || fileType === 'md' || fileType === 'csv') {
    return fs.readFileSync(filePath, 'utf-8');
  }

  if (fileType === 'pdf') {
    try {
      const pdfParse = (await import('pdf-parse')).default;
      const buffer = fs.readFileSync(filePath);
      const data = await pdfParse(buffer);
      return data.text;
    } catch (err) {
      console.error('PDF parse error:', err.message);
      return '[PDF content could not be extracted]';
    }
  }

  return '[Binary file - content not extractable]';
}

const router = Router();

router.get('/', authMiddleware, asyncHandler(async (_req, res) => {
  if (!isDbConnected()) return res.json(memoryStore.documents);

  const { data, error } = await supabase
    .from('documents')
    .select('id, filename, original_name, file_type, file_size, category, is_active, created_at')
    .order('created_at', { ascending: false });
  if (error) throw error;
  res.json(data || []);
}));

router.post('/upload', authMiddleware, uploadSingle, asyncHandler(async (req, res) => {
  if (!req.file) throw badRequest('No file uploaded');

  const category = cleanString(req.body.category, 80) || 'general';
  const ext = path.extname(req.file.originalname).slice(1).toLowerCase();
  const fileType = ext === 'pdf' ? 'pdf' : ext === 'md' ? 'md' : ext === 'csv' ? 'csv' : 'text';
  const content = await extractContent(req.file.path, fileType);

  const doc = {
    filename: req.file.filename,
    original_name: req.file.originalname,
    file_type: fileType,
    file_size: req.file.size,
    content,
    category,
    is_active: true,
  };

  if (!isDbConnected()) {
    Object.assign(doc, { id: crypto.randomUUID(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
    memoryStore.documents.push(doc);
    return res.status(201).json(doc);
  }

  const { data, error } = await supabase.from('documents').insert(doc).select().single();
  if (error) throw error;
  res.status(201).json(data);
}));

router.delete('/:id', authMiddleware, asyncHandler(async (req, res) => {
  requireUuid(req.params.id, 'Document ID');

  if (!isDbConnected()) {
    const doc = memoryStore.documents.find(d => d.id === req.params.id);
    if (!doc) return res.status(404).json({ error: 'Document not found' });
    const filePath = path.join(uploadDir, doc.filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    memoryStore.documents = memoryStore.documents.filter(d => d.id !== req.params.id);
    return res.json({ success: true });
  }

  const { data: doc } = await supabase.from('documents').select('filename').eq('id', req.params.id).single();
  if (!doc) return res.status(404).json({ error: 'Document not found' });

  const filePath = path.join(uploadDir, doc.filename);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  const { error } = await supabase.from('documents').delete().eq('id', req.params.id);
  if (error) throw error;
  res.json({ success: true });
}));

router.patch('/:id', authMiddleware, asyncHandler(async (req, res) => {
  requireUuid(req.params.id, 'Document ID');
  if (typeof req.body.is_active !== 'boolean') throw badRequest('is_active must be true or false');
  const updates = { is_active: req.body.is_active, updated_at: new Date().toISOString() };

  if (!isDbConnected()) {
    const doc = memoryStore.documents.find(d => d.id === req.params.id);
    if (!doc) return res.status(404).json({ error: 'Document not found' });
    Object.assign(doc, updates);
    return res.json(doc);
  }

  const { data, error } = await supabase.from('documents').update(updates).eq('id', req.params.id).select().single();
  if (error) throw error;
  if (!data) return res.status(404).json({ error: 'Document not found' });
  res.json(data);
}));

export default router;

