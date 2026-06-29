import { useEffect, useState } from 'react';
import { MessageSquare, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api, type Conversation, type ChatMessage } from '@/lib/api';
import { formatDate, cn } from '@/lib/utils';

export function ConversationsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getConversations().then(setConversations).catch(console.error).finally(() => setLoading(false));
  }, []);

  const viewConversation = async (conv: Conversation) => {
    setSelected(conv);
    const msgs = await api.getConversationMessages(conv.id);
    setMessages(msgs);
  };

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Conversations</h1>
        <p className="text-muted-foreground">View customer chat history</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="glass-card lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">All Conversations ({conversations.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[600px] overflow-y-auto">
              {conversations.length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground">No conversations yet.</p>
              ) : (
                conversations.map(conv => (
                  <button
                    key={conv.id}
                    onClick={() => viewConversation(conv)}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/50 transition-colors border-b border-border/30',
                      selected?.id === conv.id && 'bg-primary/5'
                    )}
                  >
                    <MessageSquare className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{conv.visitor_name || 'Anonymous'}</p>
                      <p className="text-xs text-muted-foreground">{conv.message_count} messages · {formatDate(conv.created_at)}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </button>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">
              {selected ? `Conversation Details` : 'Select a conversation'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selected ? (
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {messages.map((msg, i) => (
                  <div key={i} className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                    <div className={cn(
                      'max-w-[80%] rounded-xl px-4 py-2 text-sm',
                      msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                    )}>
                      {msg.content}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm py-12 text-center">Select a conversation from the list to view messages.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
