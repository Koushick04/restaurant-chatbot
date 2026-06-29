import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

type ToastVariant = 'success' | 'error' | 'info';

type ToastMessage = {
  id: string;
  title: string;
  description?: string;
  variant?: ToastVariant;
};

type ToastInput = Omit<ToastMessage, 'id'>;

const eventName = 'app-toast';

export function toast(input: ToastInput) {
  window.dispatchEvent(new CustomEvent<ToastInput>(eventName, { detail: input }));
}

const icons = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
};

export function Toaster() {
  const [messages, setMessages] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const onToast = (event: Event) => {
      const detail = (event as CustomEvent<ToastInput>).detail;
      const id = crypto.randomUUID();
      const nextMessage: ToastMessage = { id, variant: detail.variant || 'info', title: detail.title, description: detail.description };
      setMessages(current => [...current, nextMessage].slice(-4));
      window.setTimeout(() => {
        setMessages(current => current.filter(message => message.id !== id));
      }, 4200);
    };

    window.addEventListener(eventName, onToast);
    return () => window.removeEventListener(eventName, onToast);
  }, []);

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[100] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-3 sm:right-6 sm:top-6">
      <AnimatePresence initial={false}>
        {messages.map(message => {
          const Icon = icons[message.variant || 'info'];
          return (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, x: 24, scale: 0.98 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 24, scale: 0.98 }}
              className={cn(
                'pointer-events-auto glass-card flex items-start gap-3 rounded-xl p-4 shadow-2xl',
                message.variant === 'error' && 'border-destructive/30',
                message.variant === 'success' && 'border-emerald-500/30'
              )}
              role="status"
            >
              <Icon className={cn(
                'mt-0.5 h-5 w-5 shrink-0',
                message.variant === 'error' ? 'text-destructive' : message.variant === 'success' ? 'text-emerald-500' : 'text-primary'
              )} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{message.title}</p>
                {message.description && <p className="mt-1 text-sm text-muted-foreground">{message.description}</p>}
              </div>
              <button
                type="button"
                className="rounded-md p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                onClick={() => setMessages(current => current.filter(item => item.id !== message.id))}
                aria-label="Dismiss notification"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

