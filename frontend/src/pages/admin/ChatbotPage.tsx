import { useEffect, useState } from 'react';
import { Save, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api, type ChatbotConfig } from '@/lib/api';

export function ChatbotPage() {
  const [config, setConfig] = useState<ChatbotConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [newPrompt, setNewPrompt] = useState('');

  useEffect(() => {
    api.getChatbotConfig().then(setConfig).catch(console.error);
  }, []);

  const handleSave = async () => {
    if (!config) return;
    setSaving(true);
    try {
      await api.updateChatbotConfig(config);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const addPrompt = () => {
    if (!newPrompt.trim() || !config) return;
    setConfig({ ...config, suggested_prompts: [...config.suggested_prompts, newPrompt.trim()] });
    setNewPrompt('');
  };

  const removePrompt = (index: number) => {
    if (!config) return;
    setConfig({ ...config, suggested_prompts: config.suggested_prompts.filter((_, i) => i !== index) });
  };

  if (!config) return <div className="flex justify-center py-20"><div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Chatbot Configuration</h1>
          <p className="text-muted-foreground">Customize AI personality and behavior</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4" />
          {saved ? 'Saved!' : saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="glass-card">
          <CardHeader><CardTitle>Personality</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>System Prompt / Personality</Label>
              <Textarea
                value={config.personality}
                onChange={e => setConfig({ ...config, personality: e.target.value })}
                rows={5}
                placeholder="Describe how the AI should behave..."
              />
            </div>
            <div>
              <Label>Welcome Message</Label>
              <Textarea
                value={config.welcome_message}
                onChange={e => setConfig({ ...config, welcome_message: e.target.value })}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader><CardTitle>Suggested Prompts</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {config.suggested_prompts.map((prompt, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input value={prompt} onChange={e => {
                  const updated = [...config.suggested_prompts];
                  updated[i] = e.target.value;
                  setConfig({ ...config, suggested_prompts: updated });
                }} />
                <Button variant="ghost" size="icon" onClick={() => removePrompt(i)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <div className="flex gap-2">
              <Input value={newPrompt} onChange={e => setNewPrompt(e.target.value)} placeholder="Add new prompt..." onKeyDown={e => e.key === 'Enter' && addPrompt()} />
              <Button variant="outline" onClick={addPrompt}><Plus className="h-4 w-4" /></Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
