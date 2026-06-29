import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { api, type Faq } from '@/lib/api';

export function FaqsPage() {
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [editing, setEditing] = useState<Faq | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ question: '', answer: '', category: 'general' });
  const [loading, setLoading] = useState(true);

  const load = () => api.getFaqs().then(setFaqs).catch(console.error).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    await api.createFaq(form);
    setCreating(false);
    setForm({ question: '', answer: '', category: 'general' });
    load();
  };

  const handleUpdate = async () => {
    if (!editing) return;
    await api.updateFaq(editing.id, editing);
    setEditing(null);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this FAQ?')) return;
    await api.deleteFaq(id);
    load();
  };

  const toggleActive = async (faq: Faq) => {
    await api.updateFaq(faq.id, { is_active: !faq.is_active });
    load();
  };

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">FAQs</h1>
          <p className="text-muted-foreground">Manage frequently asked questions for the AI knowledge base</p>
        </div>
        <Button onClick={() => setCreating(true)}><Plus className="h-4 w-4" /> Add FAQ</Button>
      </div>

      {creating && (
        <Card className="glass-card">
          <CardContent className="pt-6 space-y-4">
            <div><Label>Question</Label><Input value={form.question} onChange={e => setForm(f => ({ ...f, question: e.target.value }))} /></div>
            <div><Label>Answer</Label><Textarea value={form.answer} onChange={e => setForm(f => ({ ...f, answer: e.target.value }))} rows={3} /></div>
            <div><Label>Category</Label><Input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} /></div>
            <div className="flex gap-2">
              <Button onClick={handleCreate}><Save className="h-4 w-4" /> Save</Button>
              <Button variant="outline" onClick={() => setCreating(false)}><X className="h-4 w-4" /> Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {faqs.map(faq => (
          <Card key={faq.id} className="glass-card">
            <CardContent className="py-4">
              {editing?.id === faq.id ? (
                <div className="space-y-3">
                  <Input value={editing.question} onChange={e => setEditing({ ...editing, question: e.target.value })} />
                  <Textarea value={editing.answer} onChange={e => setEditing({ ...editing, answer: e.target.value })} rows={3} />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleUpdate}><Save className="h-3 w-3" /> Save</Button>
                    <Button size="sm" variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-muted">{faq.category}</span>
                      <Switch checked={faq.is_active} onCheckedChange={() => toggleActive(faq)} />
                    </div>
                    <h3 className="font-medium">{faq.question}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{faq.answer}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => setEditing(faq)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(faq.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
