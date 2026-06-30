import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, Search, Filter, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Input from '../components/ui/Input';
import { getActivities } from '../api/activities';
import { formatDate } from '../utils/formatters';

const AuditTrail = () => {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [action, setAction] = useState('');
  const [entity, setEntity] = useState('');

  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 1,
  });

  const loadActivities = async () => {
    try {
      setLoading(true);

      const response = await getActivities({
        page,
        limit: 10,
        search: search || undefined,
        action: action || undefined,
        entity: entity || undefined,
      });

      setActivities(response.data || []);
      setPagination({
        total: response.total || response.pagination?.total || 0,
        totalPages: response.totalPages || response.pagination?.totalPages || 1,
      });
    } catch (error) {
      console.error('Failed to load audit trail:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActivities();
  }, [page]);

  const handleApplyFilters = () => {
    setPage(1);
    loadActivities();
  };

  const handleResetFilters = () => {
    setSearch('');
    setAction('');
    setEntity('');
    setPage(1);
    setTimeout(loadActivities, 0);
  };

  const getBadgeVariant = (value: string) => {
    if (value.includes('EMAIL')) return 'success';
    if (value.includes('PDF')) return 'warning';
    if (value.includes('PAID')) return 'success';
    if (value.includes('CREATED')) return 'default';
    return 'default';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-6"
    >
      <div className="rounded-2xl border border-border bg-bg-surface p-5 sm:p-6">
        <p className="text-sm text-text-secondary">Enterprise Compliance</p>
        <h1 className="mt-1 text-2xl font-semibold text-text-primary">Audit Trail</h1>
        <p className="mt-2 text-sm text-text-secondary">
          Track every important procurement, finance, email, PDF and payment action.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <CardTitle>Audit Records</CardTitle>
              <p className="mt-1 text-sm text-text-muted">
                Showing {activities.length} of {pagination.total} records
              </p>
            </div>

            <Button size="sm" variant="ghost" onClick={loadActivities}>
              <RefreshCw size={16} className="mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <div className="mb-5 grid gap-3 md:grid-cols-4">
            <div className="flex items-center gap-2 rounded-lg border border-border bg-bg-elevated px-3 py-2">
              <Search size={16} className="text-text-muted" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search action..."
                className="w-full bg-transparent text-sm text-text-primary outline-none placeholder:text-text-muted"
              />
            </div>

            <div className="flex items-center gap-2 rounded-lg border border-border bg-bg-elevated px-3 py-2">
              <Filter size={16} className="text-text-muted" />
              <select
                value={action}
                onChange={(e) => setAction(e.target.value)}
                className="w-full bg-transparent text-sm text-text-primary outline-none"
              >
                <option value="">All Actions</option>
                <option value="PURCHASE_ORDER_PDF_DOWNLOADED">PO PDF Downloaded</option>
                <option value="PURCHASE_ORDER_EMAIL_SENT">PO Email Sent</option>
                <option value="INVOICE_PDF_DOWNLOADED">Invoice PDF Downloaded</option>
                <option value="INVOICE_EMAIL_SENT">Invoice Email Sent</option>
                <option value="INVOICE_PAID">Invoice Paid</option>
                <option value="INVOICE_CREATED">Invoice Created</option>
              </select>
            </div>

            <div className="flex items-center gap-2 rounded-lg border border-border bg-bg-elevated px-3 py-2">
              <Filter size={16} className="text-text-muted" />
              <select
                value={entity}
                onChange={(e) => setEntity(e.target.value)}
                className="w-full bg-transparent text-sm text-text-primary outline-none"
              >
                <option value="">All Entities</option>
                <option value="PURCHASE_ORDER">Purchase Order</option>
                <option value="INVOICE">Invoice</option>
                <option value="SYSTEM">System</option>
              </select>
            </div>

            <div className="flex gap-2">
              <Button size="sm" className="flex-1" onClick={handleApplyFilters}>
                Apply
              </Button>
              <Button size="sm" variant="ghost" className="flex-1" onClick={handleResetFilters}>
                Reset
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="h-20 rounded-xl border border-border bg-bg-elevated/40" />
              ))}
            </div>
          ) : activities.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-bg-elevated/30 p-10 text-center">
              <Activity size={44} className="mx-auto mb-3 text-text-muted" />
              <p className="font-medium text-text-primary">No audit records found</p>
              <p className="mt-1 text-sm text-text-muted">
                System actions will appear here after users perform procurement operations.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-border">
              <table className="w-full text-left text-sm">
                <thead className="bg-bg-elevated text-xs uppercase tracking-wide text-text-muted">
                  <tr>
                    <th className="px-4 py-3">Action</th>
                    <th className="px-4 py-3">Entity</th>
                    <th className="px-4 py-3">User</th>
                    <th className="px-4 py-3">Description</th>
                    <th className="px-4 py-3">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {activities.map((activity) => (
                    <tr key={activity.id} className="bg-bg-surface hover:bg-bg-elevated/50">
                      <td className="px-4 py-4">
                        <Badge variant={getBadgeVariant(activity.action)}>
                          {activity.action}
                        </Badge>
                      </td>
                      <td className="px-4 py-4 text-text-secondary">
                        <div className="font-medium text-text-primary">{activity.entity}</div>
                        <div className="text-xs text-text-muted">{activity.entityId}</div>
                      </td>
                      <td className="px-4 py-4 text-text-secondary">
                        {activity.user?.email || 'System'}
                      </td>
                      <td className="px-4 py-4 text-text-secondary">
                        {activity.meta?.description || 'No description'}
                      </td>
                      <td className="px-4 py-4 text-text-muted">
                        {formatDate(activity.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
            <p className="text-sm text-text-muted">
              Page {page} of {pagination.totalPages || 1}
            </p>

            <div className="flex gap-2">
              <Button
                size="sm"
                variant="ghost"
                disabled={page <= 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >
                <ChevronLeft size={16} className="mr-1" />
                Previous
              </Button>

              <Button
                size="sm"
                variant="ghost"
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((current) => current + 1)}
              >
                Next
                <ChevronRight size={16} className="ml-1" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default AuditTrail;