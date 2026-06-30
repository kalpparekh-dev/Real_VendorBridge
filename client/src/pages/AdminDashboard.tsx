import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  FileText,
  CheckSquare,
  AlertTriangle,
  TrendingUp,
  Activity,
  IndianRupee,
  Clock,
  BarChart3,
  ArrowUpRight,
  Plus,
  Sparkles,
  ShieldCheck,
  CreditCard,
  Download,
  Filter,
  RotateCcw,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import { Link } from 'react-router-dom';
import Card, { CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { getExecutiveAnalytics } from '../api/analytics';
import { downloadExecutiveReportPdf } from '../api/executiveReport';
import { formatCurrency, formatDate } from '../utils/formatters';
import Skeleton from '../components/ui/Skeleton';
import { useAuthStore } from '../store/authStore';

const AdminDashboard = () => {
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({
    from: '',
    to: '',
    vendorId: '',
    category: '',
    status: '',
  });

  const [data, setData] = useState<any>({
    summary: {},
    charts: {},
    filters: {
      vendors: [],
      categories: [],
    },
    vendors: [],
    rfqs: [],
    quotations: [],
    invoices: [],
    purchaseOrders: [],
    activities: [],
    spendData: [],
    rfqVolumeData: [],
    topVendors: [],
    largestPurchaseOrders: [],
    invoiceAging: [],
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async (appliedFilters = filters) => {
    try {
      setLoading(true);

      const analytics = await getExecutiveAnalytics(appliedFilters);

      setData({
        vendors: Array.from({ length: analytics.summary?.vendors || 0 }),
        rfqs: Array.from({ length: analytics.summary?.rfqs || 0 }),
        quotations: Array.from({ length: analytics.summary?.quotations || 0 }),
        invoices: Array.from({ length: analytics.summary?.invoices || 0 }),
        purchaseOrders: Array.from({
          length: analytics.summary?.purchaseOrders || 0,
        }),
        activities: analytics.recentActivities || [],
        spendData: analytics.charts?.spendByCategory || [],
        rfqVolumeData: analytics.charts?.rfqVolume || [],
        summary: analytics.summary || {},
        charts: analytics.charts || {},
        filters: analytics.filters || {
          vendors: [],
          categories: [],
        },
        topVendors: analytics.topVendors || [],
        largestPurchaseOrders: analytics.largestPurchaseOrders || [],
        invoiceAging: analytics.invoiceAging || [],
      });
    } catch (error) {
      console.error('Error loading executive dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    loadData(filters);
  };

  const resetFilters = () => {
    const emptyFilters = {
      from: '',
      to: '',
      vendorId: '',
      category: '',
      status: '',
    };

    setFilters(emptyFilters);
    loadData(emptyFilters);
  };

  const stats = useMemo(() => {
    const summary = data.summary || {};

    return {
      totalSpend: summary.totalSpend || 0,
      pendingApprovals: summary.submittedQuotations || 0,
      pendingInvoices: summary.pendingInvoices || 0,
      overdueInvoices: summary.overdueInvoices || 0,
      paidInvoices: summary.paidInvoices || 0,
      openRFQs: summary.rfqs || 0,
      savings: summary.estimatedSavings || 0,
    };
  }, [data]);

  const exportAnalyticsCSV = () => {
    const rows = [
      ['Metric', 'Value'],
      ['Total Spend', data.summary?.totalSpend || 0],
      ['Total Paid', data.summary?.totalPaid || 0],
      ['Outstanding Amount', data.summary?.outstandingAmount || 0],
      ['Overdue Amount', data.summary?.overdueAmount || 0],
      ['Estimated Savings', data.summary?.estimatedSavings || 0],
      ['Average Invoice Amount', data.summary?.averageInvoiceAmount || 0],
      ['Average PO Amount', data.summary?.averagePOAmount || 0],
      ['Approval Rate', `${data.summary?.approvalRate || 0}%`],
      ['Payment Completion Rate', `${data.summary?.paymentCompletionRate || 0}%`],
      ['Vendors', data.summary?.vendors || 0],
      ['RFQs', data.summary?.rfqs || 0],
      ['Quotations', data.summary?.quotations || 0],
      ['Purchase Orders', data.summary?.purchaseOrders || 0],
      ['Invoices', data.summary?.invoices || 0],
      ['Payments', data.summary?.payments || 0],
      ['Pending Invoices', data.summary?.pendingInvoices || 0],
      ['Paid Invoices', data.summary?.paidInvoices || 0],
      ['Overdue Invoices', data.summary?.overdueInvoices || 0],
    ];

    const csv = rows.map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = 'vendorbridge-executive-analytics.csv';
    link.click();

    URL.revokeObjectURL(url);
  };

  const getRiskBadge = (ageDays: number) => {
    if (ageDays <= 7) return <Badge variant="success">Low</Badge>;
    if (ageDays <= 15) return <Badge variant="warning">Medium</Badge>;
    if (ageDays <= 30) return <Badge variant="warning">High</Badge>;
    return <Badge variant="danger">Critical</Badge>;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-40" />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-24" />
              </CardContent>
            </Card>
          ))}
        </div>

        <Skeleton className="h-80" />
      </div>
    );
  }

  const kpis = [
    {
      title: 'Total Procurement Spend',
      value: formatCurrency(stats.totalSpend),
      icon: IndianRupee,
      trend: '+14.2%',
      subtitle: 'Total approved PO value',
      color: 'text-accent',
    },
    {
      title: 'Outstanding Amount',
      value: formatCurrency(data.summary?.outstandingAmount || 0),
      icon: CreditCard,
      trend: 'Live',
      subtitle: 'Spend not yet fully paid',
      color: 'text-warning',
    },
    {
      title: 'Approval Rate',
      value: `${data.summary?.approvalRate || 0}%`,
      icon: ShieldCheck,
      trend: 'Workflow',
      subtitle: 'Approved quotation ratio',
      color: 'text-success',
    },
    {
      title: 'Payment Completion',
      value: `${data.summary?.paymentCompletionRate || 0}%`,
      icon: TrendingUp,
      trend: 'Finance',
      subtitle: 'Paid invoice ratio',
      color: 'text-success',
    },
    {
      title: 'Active Vendors',
      value: data.summary?.vendors || 0,
      icon: Users,
      trend: '+8.4%',
      subtitle: 'Registered suppliers',
      color: 'text-success',
    },
    {
      title: 'Open RFQs',
      value: stats.openRFQs,
      icon: FileText,
      trend: '+11.8%',
      subtitle: 'Procurement demand',
      color: 'text-warning',
    },
    {
      title: 'Overdue Amount',
      value: formatCurrency(data.summary?.overdueAmount || 0),
      icon: AlertTriangle,
      trend: 'Risk',
      subtitle: 'Invoices overdue',
      color: 'text-danger',
    },
    {
      title: 'Estimated Savings',
      value: formatCurrency(stats.savings),
      icon: TrendingUp,
      trend: '+8%',
      subtitle: 'From quote comparison',
      color: 'text-success',
    },
  ];

    return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-6"
    >
      {/* ================= HERO ================= */}

      <div className="relative overflow-hidden rounded-2xl border border-border bg-bg-surface p-6">
        <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-accent/10 blur-3xl" />

        <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-border bg-bg-elevated px-3 py-1 text-xs text-text-secondary">
              <Sparkles size={14} className="text-accent" />
              Executive Procurement Command Center
            </div>

            <h1 className="text-2xl font-semibold text-text-primary md:text-3xl">
              Good day, {user?.name || 'Admin'} 👋
            </h1>

            <p className="mt-2 max-w-2xl text-sm text-text-secondary">
              Monitor procurement spend, vendors, approvals,
              invoices, payments and executive analytics from
              one enterprise dashboard.
            </p>

            <div className="mt-5 flex flex-wrap gap-3 text-xs text-text-secondary">
              <span className="rounded-full bg-bg-elevated px-3 py-1">
                {data.vendors.length} Vendors
              </span>

              <span className="rounded-full bg-bg-elevated px-3 py-1">
                {data.rfqs.length} RFQs
              </span>

              <span className="rounded-full bg-bg-elevated px-3 py-1">
                {stats.pendingApprovals} Pending Approvals
              </span>

              <span className="rounded-full bg-bg-elevated px-3 py-1">
                {formatCurrency(stats.totalSpend)}
              </span>
            </div>
          </div>

          

            <div className="flex flex-wrap gap-3">
  <Link to="/procurement">
    <Button size="sm">
      <Plus size={16} className="mr-2" />
      Create RFQ
    </Button>
  </Link>

  <Link to="/reports">
    <Button size="sm" variant="ghost">
      <BarChart3 size={16} className="mr-2" />
      Analytics
    </Button>
  </Link>

  <Button
    size="sm"
    variant="secondary"
    onClick={downloadExecutiveReportPdf}
  >
    <Download size={16} className="mr-2" />
    Export Executive PDF
  </Button>
</div>
      </div>
      </div>

      {/* ================= FILTERS ================= */}

      <Card>

        <CardHeader>
          <CardTitle>Executive Filters</CardTitle>
        </CardHeader>

        <CardContent>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">

            <div>
              <label className="mb-2 block text-xs text-text-muted">
                From
              </label>

              <input
                type="date"
                value={filters.from}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    from: e.target.value,
                  })
                }
                className="w-full rounded-xl border border-border bg-bg-elevated px-3 py-2"
              />
            </div>

            <div>

              <label className="mb-2 block text-xs text-text-muted">
                To
              </label>

              <input
                type="date"
                value={filters.to}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    to: e.target.value,
                  })
                }
                className="w-full rounded-xl border border-border bg-bg-elevated px-3 py-2"
              />

            </div>

            <div>

              <label className="mb-2 block text-xs text-text-muted">
                Vendor
              </label>

              <select
                value={filters.vendorId}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    vendorId: e.target.value,
                  })
                }
                className="w-full rounded-xl border border-border bg-bg-elevated px-3 py-2"
              >

                <option value="">
                  All Vendors
                </option>

                {(data.filters?.vendors || []).map(
                  (vendor: any) => (
                    <option
                      key={vendor.id}
                      value={vendor.id}
                    >
                      {vendor.companyName}
                    </option>
                  )
                )}

              </select>

            </div>

            <div>

              <label className="mb-2 block text-xs text-text-muted">
                Category
              </label>

              <select
                value={filters.category}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    category: e.target.value,
                  })
                }
                className="w-full rounded-xl border border-border bg-bg-elevated px-3 py-2"
              >

                <option value="">
                  All Categories
                </option>

                {(data.filters?.categories || []).map(
                  (category: string) => (
                    <option
                      key={category}
                      value={category}
                    >
                      {category}
                    </option>
                  )
                )}

              </select>

            </div>

            <div>

              <label className="mb-2 block text-xs text-text-muted">
                Invoice Status
              </label>

              <select
                value={filters.status}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    status: e.target.value,
                  })
                }
                className="w-full rounded-xl border border-border bg-bg-elevated px-3 py-2"
              >

                <option value="">All</option>

                <option value="PENDING">
                  Pending
                </option>

                <option value="APPROVED">
                  Approved
                </option>

                <option value="PAID">
                  Paid
                </option>

                <option value="OVERDUE">
                  Overdue
                </option>

              </select>

            </div>

            <div className="flex items-end gap-2">

              <Button
                size="sm"
                onClick={applyFilters}
              >
                <Filter
                  size={16}
                  className="mr-2"
                />
                Apply
              </Button>

              <Button
                size="sm"
                variant="ghost"
                onClick={resetFilters}
              >
                <RotateCcw
                  size={16}
                  className="mr-2"
                />
                Reset
              </Button>

            </div>

          </div>

        </CardContent>

      </Card>

      {/* ================= KPI ================= */}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">

        {kpis.map((kpi, index) => (

          <motion.div
            key={kpi.title}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: index * 0.05,
            }}
            whileHover={{
              y: -5,
            }}
          >

            <Card className="overflow-hidden">

              <CardContent className="p-6">

                <div className="flex items-start justify-between">

                  <div>

                    <p className="text-xs uppercase tracking-wide text-text-muted">
                      {kpi.title}
                    </p>

                    <p className="mt-3 text-2xl font-semibold">
                      {kpi.value}
                    </p>

                  </div>

                  <div
                    className={`rounded-xl bg-bg-elevated p-3 ${kpi.color}`}
                  >
                    <kpi.icon size={22} />
                  </div>

                </div>

                <div className="mt-5 flex items-center justify-between">

                  <p className="text-xs text-text-muted">
                    {kpi.subtitle}
                  </p>

                  <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-1 text-xs text-success">

                    <ArrowUpRight size={12} />

                    {kpi.trend}

                  </span>

                </div>

                <div className="mt-4 h-1.5 rounded-full bg-bg-elevated">

                  <div className="h-full w-2/3 rounded-full bg-accent" />

                </div>

              </CardContent>

            </Card>

          </motion.div>

        ))}

      </div>

            {/* ================= CHARTS ROW 1 ================= */}

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Spend by Category</CardTitle>
          </CardHeader>

          <CardContent>
            {data.spendData.length === 0 ? (
              <div className="flex h-80 items-center justify-center text-sm text-text-muted">
                No spend data available yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={data.spendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="category" stroke="var(--text-secondary)" />
                  <YAxis
                    stroke="var(--text-secondary)"
                    tickFormatter={(value) => `₹${(value / 100000).toFixed(0)}L`}
                  />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{
                      backgroundColor: 'var(--bg-elevated)',
                      border: '1px solid var(--border)',
                      borderRadius: '12px',
                    }}
                  />
                  <Bar dataKey="amount" fill="var(--accent)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Procurement Health</CardTitle>
          </CardHeader>

          <CardContent>
            <div className="space-y-4">
              {[
                {
                  label: 'Pending approvals',
                  value: stats.pendingApprovals,
                  icon: CheckSquare,
                  color: 'text-warning',
                },
                {
                  label: 'Pending invoices',
                  value: stats.pendingInvoices,
                  icon: Clock,
                  color: 'text-accent',
                },
                {
                  label: 'Paid invoices',
                  value: stats.paidInvoices,
                  icon: ShieldCheck,
                  color: 'text-success',
                },
                {
                  label: 'Overdue invoices',
                  value: stats.overdueInvoices,
                  icon: AlertTriangle,
                  color: 'text-danger',
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-xl border border-border bg-bg-elevated/50 p-4"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-text-secondary">{item.label}</p>
                    <item.icon size={18} className={item.color} />
                  </div>

                  <p className="mt-2 text-2xl font-semibold text-text-primary">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ================= CHARTS ROW 2 ================= */}

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top Vendors by Spend</CardTitle>
          </CardHeader>

          <CardContent>
            <div className="space-y-4">
              {data.topVendors.length === 0 ? (
                <div className="flex h-72 items-center justify-center text-sm text-text-muted">
                  No vendor spend data available yet.
                </div>
              ) : (
                data.topVendors.slice(0, 5).map((vendor: any, index: number) => {
                  const maxSpend = Number(data.topVendors[0]?.spend || 1);
                  const width = Math.min(
                    (Number(vendor.spend || 0) / maxSpend) * 100,
                    100
                  );

                  return (
                    <div
                      key={vendor.id}
                      className="rounded-xl border border-border bg-bg-elevated/40 p-4"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10 text-sm font-semibold text-accent">
                            #{index + 1}
                          </div>

                          <div>
                            <p className="text-sm font-medium text-text-primary">
                              {vendor.companyName}
                            </p>

                            <p className="text-xs text-text-muted">
                              {vendor.purchaseOrders || 0} Purchase Orders
                            </p>
                          </div>
                        </div>

                        <Badge variant="success">
                          {formatCurrency(vendor.spend || 0)}
                        </Badge>
                      </div>

                      <div className="mt-3 h-2 rounded-full bg-bg-elevated">
                        <div
                          className="h-2 rounded-full bg-accent"
                          style={{ width: `${width}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Monthly Payment Trend</CardTitle>
          </CardHeader>

          <CardContent>
            {(data.charts?.paymentTrend || []).length === 0 ? (
              <div className="flex h-72 items-center justify-center text-sm text-text-muted">
                No payment trend available.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={data.charts.paymentTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="month" stroke="var(--text-secondary)" />
                  <YAxis
                    stroke="var(--text-secondary)"
                    tickFormatter={(value) => `₹${(value / 100000).toFixed(0)}L`}
                  />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{
                      backgroundColor: 'var(--bg-elevated)',
                      border: '1px solid var(--border)',
                      borderRadius: '12px',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="amount"
                    stroke="var(--accent)"
                    strokeWidth={3}
                    dot={{ fill: 'var(--accent)', r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ================= CHARTS ROW 3 ================= */}

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>RFQ Volume Trend</CardTitle>
          </CardHeader>

          <CardContent>
            {data.rfqVolumeData.length === 0 ? (
              <div className="flex h-72 items-center justify-center text-sm text-text-muted">
                No RFQ trend data available yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={data.rfqVolumeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="month" stroke="var(--text-secondary)" />
                  <YAxis stroke="var(--text-secondary)" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--bg-elevated)',
                      border: '1px solid var(--border)',
                      borderRadius: '12px',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="var(--accent)"
                    strokeWidth={3}
                    dot={{ fill: 'var(--accent)', r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Invoice Aging Buckets</CardTitle>
          </CardHeader>

          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {(data.charts?.invoiceAgingBuckets || []).map((bucket: any) => (
                <div
                  key={bucket.bucket}
                  className="rounded-xl border border-border bg-bg-elevated/40 p-4"
                >
                  <p className="text-xs uppercase tracking-wide text-text-muted">
                    {bucket.bucket}
                  </p>

                  <p className="mt-3 text-2xl font-semibold text-text-primary">
                    {bucket.count}
                  </p>

                  <p className="mt-1 text-xs text-text-muted">Invoices</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ================= INVOICE AGING TABLE ================= */}

      <Card>
        <CardHeader>
          <CardTitle>Invoice Aging Table</CardTitle>
        </CardHeader>

        <CardContent>
          {(data.invoiceAging || []).length === 0 ? (
            <div className="py-10 text-center text-sm text-text-muted">
              No invoice aging data found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-text-muted">
                    <th className="px-4 py-3">Invoice</th>
                    <th className="px-4 py-3">Vendor</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Age</th>
                    <th className="px-4 py-3">Risk</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>

                <tbody>
                  {data.invoiceAging.slice(0, 8).map((invoice: any) => (
                    <tr key={invoice.id} className="border-b border-border/70">
                      <td className="px-4 py-4 font-medium text-text-primary">
                        {invoice.invoiceNumber}
                      </td>

                      <td className="px-4 py-4 text-text-secondary">
                        {invoice.vendor}
                      </td>

                      <td className="px-4 py-4 text-text-primary">
                        {formatCurrency(invoice.amount || 0)}
                      </td>

                      <td className="px-4 py-4 text-text-secondary">
                        {invoice.ageDays} days
                      </td>

                      <td className="px-4 py-4">
                        {getRiskBadge(invoice.ageDays || 0)}
                      </td>

                      <td className="px-4 py-4">
                        <Badge
                          variant={
                            invoice.status === 'PAID'
                              ? 'success'
                              : invoice.status === 'OVERDUE'
                              ? 'danger'
                              : 'warning'
                          }
                        >
                          {invoice.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ================= PO + QUICK ACTIONS ================= */}

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Largest Purchase Orders</CardTitle>
          </CardHeader>

          <CardContent>
            <div className="space-y-4">
              {(data.largestPurchaseOrders || []).length === 0 ? (
                <div className="py-8 text-center text-sm text-text-muted">
                  No purchase orders found.
                </div>
              ) : (
                data.largestPurchaseOrders.map((po: any) => (
                  <div
                    key={po.id}
                    className="rounded-xl border border-border bg-bg-elevated/40 p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-text-primary">
                          {po.poNumber}
                        </p>

                        <p className="text-xs text-text-muted">{po.vendor}</p>
                      </div>

                      <Badge variant="success">
                        {formatCurrency(po.amount)}
                      </Badge>
                    </div>

                    <div className="mt-2 flex justify-between text-xs text-text-muted">
                      <span>{po.status}</span>
                      <span>{formatDate(po.issuedAt)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>

          <CardContent>
            <div className="space-y-3">
              {[
                {
                  to: '/procurement',
                  label: 'Create RFQ',
                  desc: 'Launch procurement workflow',
                  icon: FileText,
                },
                {
                  to: '/vendors',
                  label: 'Add Vendor',
                  desc: 'Register supplier profile',
                  icon: Users,
                },
                {
                  to: '/manager',
                  label: 'Review Approvals',
                  desc: 'Approve or reject quotations',
                  icon: CheckSquare,
                },
                {
                  to: '/finance',
                  label: 'Finance Desk',
                  desc: 'Track invoices and payments',
                  icon: FileText,
                },
              ].map((action) => (
                <Link key={action.label} to={action.to}>
                  <button className="flex w-full items-center justify-between rounded-xl border border-border bg-bg-elevated/50 p-4 text-left hover:bg-bg-elevated">
                    <span className="flex items-center gap-3">
                      <action.icon size={18} className="text-accent" />

                      <span>
                        <span className="block text-sm font-medium text-text-primary">
                          {action.label}
                        </span>

                        <span className="block text-xs text-text-muted">
                          {action.desc}
                        </span>
                      </span>
                    </span>

                    <ArrowUpRight size={16} className="text-text-muted" />
                  </button>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ================= ACTIVITY ================= */}

      <Card>
        <CardHeader>
          <CardTitle>Recent Procurement Activity</CardTitle>
        </CardHeader>

        <CardContent>
          <div className="space-y-0">
            {data.activities.length === 0 ? (
              <div className="py-10 text-center text-sm text-text-muted">
                No recent activity found.
              </div>
            ) : (
              data.activities.map((activity: any, index: number) => (
                <div key={activity.id} className="relative flex gap-4 pb-6 last:pb-0">
                  {index !== data.activities.length - 1 && (
                    <div className="absolute left-[17px] top-9 h-full w-px bg-border" />
                  )}

                  <div className="relative z-10 mt-1 flex h-9 w-9 items-center justify-center rounded-full border border-border bg-bg-elevated text-accent">
                    <Activity size={15} />
                  </div>

                  <div>
                    <p className="text-sm text-text-primary">
                      {activity.action} {activity.entity}
                    </p>

                    <p className="mt-1 text-xs text-text-muted">
                      {formatDate(activity.createdAt)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default AdminDashboard;