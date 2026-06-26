import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, FileText, CheckSquare, AlertTriangle, TrendingUp, Activity } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import Card, { CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { getVendors } from "../api/vendors";
import { getRFQs } from "../api/rfqs";
import { getQuotations } from "../api/quotations";
import { getInvoices } from "../api/invoices";
import { getActivities } from "../api/activities";
import { formatCurrency, formatDate, getStatusBadge, getStatusColor } from '../utils/formatters';
import Skeleton from '../components/ui/Skeleton';

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>({
    vendors: 0,
    rfqs: 0,
    pendingApprovals: 0,
    overdueInvoices: 0,
    spendData: [],
    rfqVolumeData: [],
    activities: [],
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [vendors, rfqs, quotations, invoices, activities] = await Promise.all([
        getVendors(),
        getRFQs(),
        getQuotations(),
        getInvoices(),
        getActivities(),
      ]);

      const pendingApprovals = quotations.filter((q: any) => q.status === 'SUBMITTED' || q.status === 'UNDER_REVIEW').length;
      const overdueInvoices = invoices.filter((i: any) => i.status === 'OVERDUE').length;

      // Mock chart data
      const spendData = [
        { category: 'Technology', amount: 2500000 },
        { category: 'Office', amount: 1800000 },
        { category: 'Industrial', amount: 1200000 },
      ];

      const rfqVolumeData = [
        { month: 'Jan', count: 5 },
        { month: 'Feb', count: 8 },
        { month: 'Mar', count: 12 },
        { month: 'Apr', count: 10 },
        { month: 'May', count: 15 },
        { month: 'Jun', count: 18 },
      ];

      setData({
        vendors: vendors.length,
        rfqs: rfqs.length,
        pendingApprovals,
        overdueInvoices,
        spendData,
        rfqVolumeData,
        activities: activities.slice(0, 5),
      });
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const kpis = [
    { title: 'Total Vendors', value: data.vendors, icon: Users, color: 'text-accent' },
    { title: 'Active RFQs', value: data.rfqs, icon: FileText, color: 'text-success' },
    { title: 'Pending Approvals', value: data.pendingApprovals, icon: CheckSquare, color: 'text-warning' },
    { title: 'Overdue Invoices', value: data.overdueInvoices, icon: AlertTriangle, color: 'text-danger' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi, index) => (
          <motion.div
            key={kpi.title}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.06 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-text-secondary">{kpi.title}</p>
                    <p className="mt-2 text-2xl font-semibold text-text-primary">{kpi.value}</p>
                  </div>
                  <div className={`rounded-lg bg-bg-elevated p-3 ${kpi.color}`}>
                    <kpi.icon size={24} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Spend by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.spendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="category" stroke="var(--text-secondary)" />
                <YAxis stroke="var(--text-secondary)" tickFormatter={(value) => `₹${(value / 100000).toFixed(0)}L`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--bg-elevated)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Bar dataKey="amount" fill="var(--accent)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>RFQ Volume Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.rfqVolumeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" stroke="var(--text-secondary)" />
                <YAxis stroke="var(--text-secondary)" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--bg-elevated)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="var(--accent)"
                  strokeWidth={2}
                  dot={{ fill: 'var(--accent)' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.activities.map((activity: any) => (
              <div key={activity.id} className="flex items-start gap-3 border-b border-border pb-4 last:border-0">
                <div className="rounded-lg bg-bg-elevated p-2">
                  <Activity size={16} className="text-accent" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-text-primary">
                    {activity.action} {activity.entity}
                  </p>
                  <p className="text-xs text-text-muted">{formatDate(activity.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default AdminDashboard;
