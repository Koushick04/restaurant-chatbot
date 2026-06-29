import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Users, MessagesSquare, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api, type AnalyticsSummary } from '@/lib/api';
import { formatDate } from '@/lib/utils';

const statCards = [
  { key: 'totalConversations', label: 'Conversations', icon: MessageSquare, color: 'text-primary' },
  { key: 'totalMessages', label: 'Messages', icon: MessagesSquare, color: 'text-green-500' },
  { key: 'totalLeads', label: 'Leads', icon: Users, color: 'text-orange-500' },
] as const;

export function DashboardPage() {
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getAnalytics()
      .then(setAnalytics)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your chatbot performance</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="glass-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{analytics?.[stat.key] ?? 0}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analytics?.recentEvents?.length ? (
              <div className="space-y-3">
                {analytics.recentEvents.slice(0, 8).map((event, i) => (
                  <div key={i} className="flex items-center justify-between text-sm py-2 border-b border-border/30 last:border-0">
                    <span className="capitalize">{event.event_type.replace(/_/g, ' ')}</span>
                    <span className="text-muted-foreground text-xs">{formatDate(event.created_at)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">No activity yet. Open the chat widget to generate events.</p>
            )}
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Event Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {analytics?.eventsByType && Object.keys(analytics.eventsByType).length > 0 ? (
              <div className="space-y-3">
                {Object.entries(analytics.eventsByType).map(([type, count]) => (
                  <div key={type} className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="capitalize">{type.replace(/_/g, ' ')}</span>
                        <span className="font-medium">{count}</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${Math.min(100, (count / (analytics.totalMessages || 1)) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">Events will appear here as customers interact with the chatbot.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
