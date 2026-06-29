import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Calendar, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/lib/api';

interface FormPanelProps {
  type: 'reservation' | 'lead';
  sessionId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function FormPanel({ type, sessionId, onClose, onSuccess }: FormPanelProps) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
    party_size: '',
    preferred_date: '',
    preferred_time: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (type === 'reservation') {
        // Use the new reservation API
        const response = await api.createReservation({
          customer_name: form.name,
          email: form.email,
          phone: form.phone,
          reservation_date: form.preferred_date,
          reservation_time: form.preferred_time,
          guests: form.party_size ? parseInt(form.party_size) : 2,
          special_request: form.message || undefined,
          session_id: sessionId,
        });
        
        // Show success message with reservation details
        alert(`Reservation created successfully!\n\nReservation ID: ${response.reservation.reservation_id}\n\n${response.note}`);
      } else {
        // Use leads API for general inquiries
        await api.createLead({
          name: form.name,
          email: form.email,
          phone: form.phone || undefined,
          type: 'general',
          message: form.message || undefined,
          party_size: form.party_size ? parseInt(form.party_size) : undefined,
          preferred_date: form.preferred_date || undefined,
          preferred_time: form.preferred_time || undefined,
          session_id: sessionId,
        });
      }
      onSuccess();
      onClose();
    } catch (error: any) {
      alert(error.message || 'Failed to submit. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const update = (field: string, value: string) => setForm(f => ({ ...f, [field]: value }));

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="absolute inset-0 z-10 flex flex-col bg-background/95 backdrop-blur-sm rounded-2xl p-4"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {type === 'reservation' ? (
              <Calendar className="h-5 w-5 text-primary" />
            ) : (
              <UserPlus className="h-5 w-5 text-primary" />
            )}
            <h3 className="font-semibold">
              {type === 'reservation' ? 'Make a Reservation' : 'Get in Touch'}
            </h3>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close form">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {type === 'reservation' && (
          <div className="mb-3 rounded-lg border border-gold/40 bg-gold/10 p-3 text-xs">
            <p className="font-semibold text-gold">₹100 Pre-Booking Fee</p>
            <p className="mt-1 text-muted-foreground">
              ₹100 reservation fee is fully adjustable against your final bill.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-3">
          <div>
            <Label htmlFor="name">Name *</Label>
            <Input id="name" required value={form.name} onChange={e => update('name', e.target.value)} />
          </div>
          <div>
            <Label htmlFor="email">Email *</Label>
            <Input id="email" type="email" required value={form.email} onChange={e => update('email', e.target.value)} />
          </div>
          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" type="tel" value={form.phone} onChange={e => update('phone', e.target.value)} />
          </div>

          {type === 'reservation' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="party_size">Party Size</Label>
                  <Input id="party_size" type="number" min="1" max="20" value={form.party_size} onChange={e => update('party_size', e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="preferred_date">Date</Label>
                  <Input id="preferred_date" type="date" value={form.preferred_date} onChange={e => update('preferred_date', e.target.value)} />
                </div>
              </div>
              <div>
                <Label htmlFor="preferred_time">Preferred Time</Label>
                <Input id="preferred_time" type="time" value={form.preferred_time} onChange={e => update('preferred_time', e.target.value)} />
              </div>
            </>
          )}

          <div>
            <Label htmlFor="message">{type === 'reservation' ? 'Special Requests' : 'Message'}</Label>
            <Textarea id="message" rows={3} value={form.message} onChange={e => update('message', e.target.value)} />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            <Send className="h-4 w-4" />
            {loading ? 'Submitting...' : type === 'reservation' ? 'Request Reservation' : 'Submit'}
          </Button>
        </form>
      </motion.div>
    </AnimatePresence>
  );
}
