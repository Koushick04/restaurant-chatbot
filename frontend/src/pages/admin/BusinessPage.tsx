import { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api, type BusinessSettings } from '@/lib/api';

export function BusinessPage() {
  const [form, setForm] = useState<BusinessSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.getBusiness().then(setForm).catch(console.error);
  }, []);

  const update = (field: string, value: string) => {
    setForm(f => f ? { ...f, [field]: value } : f);
  };

  const updateHour = (day: string, value: string) => {
    setForm(f => f ? { ...f, hours: { ...f.hours, [day]: value } } : f);
  };

  const handleSave = async () => {
    if (!form) return;
    setSaving(true);
    try {
      await api.updateBusiness(form);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (!form) return <div className="flex justify-center py-20"><div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" /></div>;

  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Business Information</h1>
          <p className="text-muted-foreground">Edit your restaurant details</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4" />
          {saved ? 'Saved!' : saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="glass-card">
          <CardHeader><CardTitle>Basic Info</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div><Label>Restaurant Name</Label><Input value={form.name} onChange={e => update('name', e.target.value)} /></div>
            <div><Label>Tagline</Label><Input value={form.tagline} onChange={e => update('tagline', e.target.value)} /></div>
            <div><Label>Description</Label><Textarea value={form.description} onChange={e => update('description', e.target.value)} rows={3} /></div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader><CardTitle>Contact</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div><Label>Phone</Label><Input value={form.phone} onChange={e => update('phone', e.target.value)} /></div>
            <div><Label>Email</Label><Input value={form.email} onChange={e => update('email', e.target.value)} /></div>
            <div><Label>WhatsApp</Label><Input value={form.whatsapp} onChange={e => update('whatsapp', e.target.value)} /></div>
            <div><Label>Address</Label><Input value={form.address} onChange={e => update('address', e.target.value)} /></div>
            <div><Label>Google Maps URL</Label><Input value={form.google_maps_url} onChange={e => update('google_maps_url', e.target.value)} /></div>
          </CardContent>
        </Card>

        <Card className="glass-card lg:col-span-2">
          <CardHeader><CardTitle>Hours of Operation</CardTitle></CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 gap-4">
              {days.map(day => (
                <div key={day}>
                  <Label className="capitalize">{day}</Label>
                  <Input value={form.hours[day] || ''} onChange={e => updateHour(day, e.target.value)} placeholder="11:00 AM - 10:00 PM" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
