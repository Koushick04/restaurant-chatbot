import { useEffect, useState, useRef } from 'react';
import { Upload, Trash2, FileText, ToggleLeft, ToggleRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api, type Document } from '@/lib/api';
import { formatDate } from '@/lib/utils';

export function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [category, setCategory] = useState('general');
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = () => api.getDocuments().then(setDocuments).catch(console.error).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await api.uploadDocument(file, category);
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this document?')) return;
    await api.deleteDocument(id);
    load();
  };

  const toggleActive = async (doc: Document) => {
    await api.toggleDocument(doc.id, !doc.is_active);
    load();
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Documents</h1>
        <p className="text-muted-foreground">Upload PDFs and documents for the AI knowledge base</p>
      </div>

      <Card className="glass-card">
        <CardHeader><CardTitle className="text-lg">Upload Document</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label>Category</Label>
              <Input value={category} onChange={e => setCategory(e.target.value)} placeholder="menu, policy, general..." />
            </div>
            <div className="flex items-end">
              <input ref={fileRef} type="file" accept=".pdf,.txt,.md,.csv" onChange={handleUpload} className="hidden" id="file-upload" />
              <Button onClick={() => fileRef.current?.click()} disabled={uploading}>
                <Upload className="h-4 w-4" />
                {uploading ? 'Uploading...' : 'Choose File'}
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Supported: PDF, TXT, MD, CSV (max 10MB). Content is extracted and added to the AI knowledge base.</p>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {documents.length === 0 ? (
          <Card className="glass-card"><CardContent className="py-12 text-center text-muted-foreground">No documents uploaded yet.</CardContent></Card>
        ) : (
          documents.map(doc => (
            <Card key={doc.id} className="glass-card">
              <CardContent className="py-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <FileText className="h-8 w-8 text-primary shrink-0" />
                  <div>
                    <h3 className="font-medium">{doc.original_name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {doc.file_type.toUpperCase()} · {formatSize(doc.file_size)} · {doc.category} · {formatDate(doc.created_at)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => toggleActive(doc)} aria-label={doc.is_active ? 'Deactivate' : 'Activate'}>
                    {doc.is_active ? <ToggleRight className="h-6 w-6 text-primary" /> : <ToggleLeft className="h-6 w-6 text-muted-foreground" />}
                  </button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(doc.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
