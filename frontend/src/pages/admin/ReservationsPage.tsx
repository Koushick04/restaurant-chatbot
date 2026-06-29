import { useEffect, useState } from 'react';
import { Calendar, Users, Clock, DollarSign, Download, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { api, type Reservation, type ReservationStats } from '@/lib/api';
import { formatDate, cn } from '@/lib/utils';

const statusColors: Record<string, string> = {
  confirmed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  completed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  no_show: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
};

const paymentColors: Record<string, string> = {
  paid: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  refunded: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [stats, setStats] = useState<ReservationStats | null>(null);
  const [loading, setLoading] = useState(true);

  const loadReservations = () => {
    api.getAllReservations()
      .then(response => setReservations(response.reservations))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  const loadStats = () => {
    api.getReservationStats()
      .then(setStats)
      .catch(console.error);
  };

  useEffect(() => {
    loadReservations();
    loadStats();
  }, []);

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await api.updateReservationStatus(id, newStatus);
      loadReservations();
      loadStats();
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const handlePaymentChange = async (id: string, newPaymentStatus: string) => {
    try {
      await api.updateReservationPayment(id, newPaymentStatus);
      loadReservations();
      loadStats();
    } catch (error) {
      console.error('Failed to update payment status:', error);
    }
  };

  const exportToCSV = () => {
    const headers = ['Reservation ID', 'Customer Name', 'Email', 'Phone', 'Date', 'Time', 'Guests', 'Special Request', 'Booking Fee', 'Reservation Status', 'Payment Status', 'Created At'];
    const rows = reservations.map(r => [
      r.reservation_id,
      r.customer_name,
      r.email,
      r.phone,
      r.reservation_date,
      r.reservation_time,
      r.guests,
      r.special_request || '',
      `₹${r.booking_fee}`,
      r.reservation_status,
      r.payment_status,
      new Date(r.created_at).toLocaleString('en-IN'),
    ]);

    const escape = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;
    const csv = [headers.map(escape).join(','), ...rows.map(row => row.map(escape).join(','))].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `reservations-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reservations</h1>
          <p className="text-muted-foreground">Manage restaurant reservations and booking fees</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={exportToCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={() => { loadReservations(); loadStats(); }}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Reservations</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <Calendar className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {stats.recent_30_days} in last 30 days
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Today's Reservations</p>
                  <p className="text-2xl font-bold">{stats.today}</p>
                </div>
                <Clock className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {stats.confirmed} confirmed, {stats.pending} pending
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Revenue</p>
                  <p className="text-2xl font-bold">₹{stats.revenue_paid}</p>
                </div>
                <DollarSign className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                ₹{stats.revenue_pending} pending
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status Overview</p>
                  <p className="text-2xl font-bold">{stats.confirmed}</p>
                </div>
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {stats.cancelled} cancelled, {stats.pending} pending
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Booking Fee Note */}
      <Card className="bg-amber-50 border-amber-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <DollarSign className="h-5 w-5 text-amber-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-amber-800">Booking Fee Information</h4>
              <p className="text-sm text-amber-700 mt-1">
                The ₹100 reservation fee is fully adjustable against the final bill. This fee helps secure the table and is deducted from the total bill amount.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reservations Table */}
      {reservations.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="py-12 text-center">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No reservations yet. They will appear when customers make reservations through the chat widget.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Reservation ID</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Customer</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Date & Time</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Guests</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Booking Fee</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Reservation Status</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Payment Status</th>
              </tr>
            </thead>
            <tbody>
              {reservations.map(reservation => (
                <tr key={reservation.id} className="border-b border-border/30 hover:bg-muted/30">
                  <td className="py-3 px-4 font-mono text-xs">{reservation.reservation_id}</td>
                  <td className="py-3 px-4">
                    <div className="font-medium">{reservation.customer_name}</div>
                    <div className="text-xs text-muted-foreground">{reservation.email}</div>
                    <div className="text-xs text-muted-foreground">{reservation.phone}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div>{formatDate(reservation.reservation_date)}</div>
                    <div className="text-xs text-muted-foreground">{reservation.reservation_time}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center">
                      <Users className="h-3 w-3 mr-1 text-muted-foreground" />
                      {reservation.guests}
                    </div>
                  </td>
                  <td className="py-3 px-4 font-medium">
                    ₹{reservation.booking_fee}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <select
                        value={reservation.reservation_status}
                        onChange={e => handleStatusChange(reservation.id, e.target.value)}
                        className={cn('text-xs px-2 py-1 rounded-full border-0 cursor-pointer', statusColors[reservation.reservation_status])}
                      >
                        <option value="confirmed">Confirmed</option>
                        <option value="pending">Pending</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="completed">Completed</option>
                        <option value="no_show">No Show</option>
                      </select>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <select
                        value={reservation.payment_status}
                        onChange={e => handlePaymentChange(reservation.id, e.target.value)}
                        className={cn('text-xs px-2 py-1 rounded-full border-0 cursor-pointer', paymentColors[reservation.payment_status])}
                      >
                        <option value="paid">Paid</option>
                        <option value="pending">Pending</option>
                        <option value="refunded">Refunded</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}