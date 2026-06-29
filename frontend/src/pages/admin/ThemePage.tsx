import { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api, type ChatbotConfig } from '@/lib/api';

export function ThemePage() {
  const [theme, setTheme] = useState<ChatbotConfig['theme'] | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.getChatbotConfig().then(c => setTheme(c.theme)).catch(console.error);
  }, []);

  const update = (field: string, value: string | number) => {
    setTheme(t => t ? { ...t, [field]: value } : t);
  };

  const handleSave = async () => {
    if (!theme) return;
    setSaving(true);
    try {
      await api.updateChatbotConfig({ theme });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (!theme) return <div className="flex justify-center py-20"><div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Theme Customization</h1>
          <p className="text-muted-foreground">Customize chatbot widget appearance</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4" />
          {saved ? 'Saved!' : saving ? 'Saving...' : 'Save Theme'}
        </Button>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="glass-card">
          <CardHeader><CardTitle>Colors & Style</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Primary Color</Label>
              <div className="flex gap-2">
                <Input type="color" value={theme.primaryColor} onChange={e => update('primaryColor', e.target.value)} className="w-16 h-10 p-1" />
                <Input value={theme.primaryColor} onChange={e => update('primaryColor', e.target.value)} />
              </div>
            </div>
            <div>
              <Label>Accent Color</Label>
              <div className="flex gap-2">
                <Input type="color" value={theme.accentColor} onChange={e => update('accentColor', e.target.value)} className="w-16 h-10 p-1" />
                <Input value={theme.accentColor} onChange={e => update('accentColor', e.target.value)} />
              </div>
            </div>
            <div>
              <Label>Font Family</Label>
              <Input value={theme.fontFamily} onChange={e => update('fontFamily', e.target.value)} />
            </div>
            <div>
              <Label>Border Radius</Label>
              <Input value={theme.borderRadius} onChange={e => update('borderRadius', e.target.value)} />
            </div>
            <div>
              <Label>Glass Opacity ({theme.glassOpacity})</Label>
              <input
                type="range"
                min="0.3"
                max="1"
                step="0.1"
                value={theme.glassOpacity}
                onChange={e => update('glassOpacity', parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader><CardTitle>Preview</CardTitle></CardHeader>
          <CardContent>
            <div
              className="rounded-2xl p-6 border"
              style={{
                backgroundColor: `rgba(255,255,255,${theme.glassOpacity})`,
                borderRadius: theme.borderRadius,
                fontFamily: theme.fontFamily,
              }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-full flex items-center justify-center text-white text-lg" style={{ backgroundColor: theme.primaryColor }}>
                  🍝
                </div>
                <div>
                  <p className="font-semibold text-sm">La Bella Cucina</p>
                  <p className="text-xs opacity-60">Online</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="rounded-xl px-3 py-2 text-sm text-white" style={{ backgroundColor: theme.primaryColor, borderRadius: theme.borderRadius }}>
                  Welcome! How can I help you today?
                </div>
                <div className="rounded-xl px-3 py-2 text-sm bg-gray-100 dark:bg-gray-800" style={{ borderRadius: theme.borderRadius }}>
                  What are your hours?
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <span className="px-3 py-1 text-xs rounded-full border" style={{ borderColor: theme.primaryColor, color: theme.primaryColor }}>Menu</span>
                <span className="px-3 py-1 text-xs rounded-full border" style={{ borderColor: theme.accentColor, color: theme.accentColor }}>Reserve</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
