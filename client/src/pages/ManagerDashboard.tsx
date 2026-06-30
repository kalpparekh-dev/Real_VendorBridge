import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  CheckSquare,
  Clock,
  Calendar,
  Search,
  Filter,
  ArrowUpDown,
  Trophy,
  XCircle,
  CheckCircle,
  Eye,
  FileText,
  IndianRupee,
  Truck,
  Star,
  MessageSquare,
} from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import Label from '../components/ui/Label';
import { getQuotations, approveQuotation, rejectQuotation } from '../api/quotations';
import { formatCurrency, formatDate, getStatusBadge } from '../utils/formatters';
import Toast from '../components/ui/Toast';

const ManagerDashboard = () => {
  const [quotations, setQuotations] = useState<any[]>([]);
  const [selectedQuotation, setSelectedQuotation] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [comments, setComments] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [sortBy, setSortBy] = useState('best-value');

  useEffect(() => {
    loadQuotations();
  }, []);

  const loadQuotations = async () => {
    try {
      setLoading(true);
      const data = await getQuotations();
      setQuotations(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading quotations:', error);
      setToast({ message: 'Failed to load quotations', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const getVendorRating = (quotation: any) => {
    return Number(quotation.vendor?.rating || quotation.vendorRating || 0);
  };

  const getRecommendationScore = (quotation: any) => {
    const amount = Number(quotation.totalAmount || 0);
    const deliveryDays = Number(quotation.deliveryDays || 0);
    const rating = getVendorRating(quotation);

    const amountScore = amount > 0 ? Math.max(0, 1000000 / amount) : 0;
    const deliveryScore = deliveryDays > 0 ? Math.max(0, 100 / deliveryDays) : 0;
    const ratingScore = rating * 10;

    return amountScore + deliveryScore + ratingScore;
  };

  const getRecommendationLabel = (quotation: any, bestQuotationId: string | null) => {
    if (quotation.id === bestQuotationId) return 'Recommended';
    if (Number(quotation.totalAmount || 0) <= 0) return 'Incomplete';
    return 'Review';
  };

  const filteredQuotations = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    let result = quotations.filter((q) => {
      const isPending = q.status === 'SUBMITTED' || q.status === 'UNDER_REVIEW';

      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'PENDING' && isPending) ||
        q.status === statusFilter;

      const matchesSearch =
        keyword.length === 0 ||
        q.rfq?.title?.toLowerCase().includes(keyword) ||
        q.vendor?.companyName?.toLowerCase().includes(keyword) ||
        q.notes?.toLowerCase().includes(keyword);

      return matchesStatus && matchesSearch;
    });

    result = [...result].sort((a, b) => {
      const amountA = Number(a.totalAmount || 0);
      const amountB = Number(b.totalAmount || 0);
      const deliveryA = Number(a.deliveryDays || 0);
      const deliveryB = Number(b.deliveryDays || 0);
      const ratingA = getVendorRating(a);
      const ratingB = getVendorRating(b);
      const scoreA = getRecommendationScore(a);
      const scoreB = getRecommendationScore(b);

      if (sortBy === 'best-value') return scoreB - scoreA;
      if (sortBy === 'lowest-price') return amountA - amountB;
      if (sortBy === 'highest-price') return amountB - amountA;
      if (sortBy === 'fastest-delivery') return deliveryA - deliveryB;
      if (sortBy === 'highest-rating') return ratingB - ratingA;
      if (sortBy === 'latest') {
        return (
          new Date(b.createdAt || b.validUntil || 0).getTime() -
          new Date(a.createdAt || a.validUntil || 0).getTime()
        );
      }

      return 0;
    });

    return result;
  }, [quotations, search, statusFilter, sortBy]);

  const pendingQuotations = quotations.filter(
    (q) => q.status === 'SUBMITTED' || q.status === 'UNDER_REVIEW'
  );

  const bestQuotationId = useMemo(() => {
    if (filteredQuotations.length === 0) return null;

    const sorted = [...filteredQuotations].sort(
      (a, b) => getRecommendationScore(b) - getRecommendationScore(a)
    );

    return sorted[0]?.id || null;
  }, [filteredQuotations]);

  const stats = useMemo(() => {
    return {
      total: quotations.length,
      pending: pendingQuotations.length,
      approved: quotations.filter((q) => q.status === 'APPROVED').length,
      rejected: quotations.filter((q) => q.status === 'REJECTED').length,
    };
  }, [quotations]);

  const openReviewModal = (quotation: any) => {
    setSelectedQuotation(quotation);
    setComments('');
    setModalOpen(true);
  };

  const handleApprove = async () => {
    if (!selectedQuotation) return;

    setActionLoading(true);

    try {
      await approveQuotation(selectedQuotation.id, comments);
      setToast({ message: 'Quotation approved successfully', type: 'success' });
      setModalOpen(false);
      await loadQuotations();
    } catch (error: any) {
      setToast({ message: error.response?.data?.error || 'Failed to approve quotation', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedQuotation) return;

    setActionLoading(true);

    try {
      await rejectQuotation(selectedQuotation.id, comments);
      setToast({ message: 'Quotation rejected successfully', type: 'success' });
      setModalOpen(false);
      await loadQuotations();
    } catch (error: any) {
      setToast({ message: error.response?.data?.error || 'Failed to reject quotation', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const statCards = [
    { label: 'Total Quotations', value: stats.total, icon: FileText, color: 'text-accent' },
    { label: 'Pending Review', value: stats.pending, icon: Clock, color: 'text-warning' },
    { label: 'Approved', value: stats.approved, icon: CheckCircle, color: 'text-success' },
    { label: 'Rejected', value: stats.rejected, icon: XCircle, color: 'text-danger' },
  ];

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 skeleton rounded-card" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-6"
    >
      <div className="rounded-2xl border border-border bg-bg-surface p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm text-text-secondary">Manager Review Center</p>
            <h1 className="mt-1 text-2xl font-semibold text-text-primary">
              Quotation Comparison
            </h1>
            <p className="mt-2 text-sm text-text-secondary">
              Compare vendor quotations by price, delivery time, rating and recommendation score.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-bg-elevated px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-text-muted">AI-style Recommendation</p>
            <p className="mt-1 text-sm text-text-primary">
              Best value is calculated using price, delivery speed and vendor rating.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ y: -4 }}
          >
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-text-muted">{stat.label}</p>
                    <p className="mt-2 text-2xl font-semibold text-text-primary">{stat.value}</p>
                  </div>
                  <div className={`rounded-xl bg-bg-elevated p-3 ${stat.color}`}>
                    <stat.icon size={22} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <CardTitle>Quotation Workspace</CardTitle>
              <p className="mt-1 text-sm text-text-muted">
                Showing {filteredQuotations.length} of {quotations.length} quotations
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:flex xl:flex-wrap">
              <div className="flex items-center gap-2 rounded-lg border border-border bg-bg-elevated px-3 py-2">
                <Search size={16} className="text-text-muted" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search quotations..."
                  className="w-full bg-transparent text-sm text-text-primary outline-none placeholder:text-text-muted xl:w-56"
                />
              </div>

              <div className="flex items-center gap-2 rounded-lg border border-border bg-bg-elevated px-3 py-2">
                <Filter size={16} className="text-text-muted" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full bg-transparent text-sm text-text-primary outline-none"
                >
                  <option value="PENDING">Pending Only</option>
                  <option value="ALL">All Status</option>
                  <option value="SUBMITTED">Submitted</option>
                  <option value="UNDER_REVIEW">Under Review</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>

              <div className="flex items-center gap-2 rounded-lg border border-border bg-bg-elevated px-3 py-2">
                <ArrowUpDown size={16} className="text-text-muted" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full bg-transparent text-sm text-text-primary outline-none"
                >
                  <option value="best-value">Best Value</option>
                  <option value="lowest-price">Lowest Price</option>
                  <option value="highest-price">Highest Price</option>
                  <option value="fastest-delivery">Fastest Delivery</option>
                  <option value="highest-rating">Highest Rating</option>
                  <option value="latest">Latest</option>
                </select>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {filteredQuotations.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-bg-elevated/30 py-12 text-center">
              <CheckSquare size={48} className="mb-4 text-text-muted" />
              <p className="font-medium text-text-primary">No quotations found</p>
              <p className="mt-1 text-sm text-text-muted">
                Change filters or wait for vendors to submit quotations.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] border-separate border-spacing-y-3">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-text-muted">
                    <th className="px-4 py-2">RFQ / Vendor</th>
                    <th className="px-4 py-2">Price</th>
                    <th className="px-4 py-2">Delivery</th>
                    <th className="px-4 py-2">Rating</th>
                    <th className="px-4 py-2">Valid Until</th>
                    <th className="px-4 py-2">Recommendation</th>
                    <th className="px-4 py-2 text-right">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredQuotations.map((quotation, index) => {
                    const isRecommended = quotation.id === bestQuotationId;
                    const recommendationLabel = getRecommendationLabel(quotation, bestQuotationId);
                    const rating = getVendorRating(quotation);

                    return (
                      <motion.tr
                        key={quotation.id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.04 }}
                        className="rounded-xl border border-border bg-bg-elevated/40"
                      >
                        <td className="rounded-l-xl border-y border-l border-border px-4 py-4">
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-text-primary">
                                {quotation.rfq?.title || 'Untitled RFQ'}
                              </p>

                              <Badge
                                variant={
                                  quotation.status === 'APPROVED'
                                    ? 'success'
                                    : quotation.status === 'REJECTED'
                                      ? 'danger'
                                      : quotation.status === 'UNDER_REVIEW'
                                        ? 'warning'
                                        : 'default'
                                }
                              >
                                {getStatusBadge(quotation.status)}
                              </Badge>
                            </div>

                            <p className="mt-1 text-sm text-text-secondary">
                              {quotation.vendor?.companyName || 'Unknown Vendor'}
                            </p>
                          </div>
                        </td>

                        <td className="border-y border-border px-4 py-4">
                          <div className="flex items-center gap-2 text-text-primary">
                            <IndianRupee size={15} className="text-text-muted" />
                            <span className="mono font-medium">
                              {formatCurrency(Number(quotation.totalAmount || 0))}
                            </span>
                          </div>
                        </td>

                        <td className="border-y border-border px-4 py-4">
                          <div className="flex items-center gap-2 text-sm text-text-secondary">
                            <Truck size={15} className="text-text-muted" />
                            {quotation.deliveryDays || 0} days
                          </div>
                        </td>

                        <td className="border-y border-border px-4 py-4">
                          <div className="flex items-center gap-2 text-sm text-text-secondary">
                            <Star size={15} className="text-warning" />
                            {rating > 0 ? rating.toFixed(1) : 'N/A'}
                          </div>
                        </td>

                        <td className="border-y border-border px-4 py-4">
                          <div className="flex items-center gap-2 text-sm text-text-secondary">
                            <Calendar size={15} className="text-text-muted" />
                            {formatDate(quotation.validUntil)}
                          </div>
                        </td>

                        <td className="border-y border-border px-4 py-4">
                          {isRecommended ? (
                            <div className="inline-flex items-center gap-2 rounded-full border border-success/30 bg-success/10 px-3 py-1 text-xs font-medium text-success">
                              <Trophy size={14} />
                              {recommendationLabel}
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-bg-surface px-3 py-1 text-xs text-text-secondary">
                              Review
                            </div>
                          )}
                        </td>

                        <td className="rounded-r-xl border-y border-r border-border px-4 py-4 text-right">
                          <Button size="sm" onClick={() => openReviewModal(quotation)}>
                            <Eye size={16} className="mr-2" />
                            Review
                          </Button>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Review Quotation" size="lg">
        {selectedQuotation && (
          <div className="space-y-6">
            <div className="rounded-xl border border-border bg-bg-elevated/40 p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-text-muted">Selected Quotation</p>
                  <h3 className="mt-1 text-lg font-semibold text-text-primary">
                    {selectedQuotation.rfq?.title || 'Untitled RFQ'}
                  </h3>
                  <p className="mt-1 text-sm text-text-secondary">
                    {selectedQuotation.vendor?.companyName || 'Unknown Vendor'}
                  </p>
                </div>

                {selectedQuotation.id === bestQuotationId && (
                  <div className="inline-flex items-center gap-2 rounded-full border border-success/30 bg-success/10 px-3 py-1 text-xs font-medium text-success">
                    <Trophy size={14} />
                    Recommended
                  </div>
                )}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border border-border bg-bg-elevated p-3">
                <Label>Total Amount</Label>
                <p className="mt-1 text-sm font-medium text-text-primary mono">
                  {formatCurrency(Number(selectedQuotation.totalAmount || 0))}
                </p>
              </div>

              <div className="rounded-lg border border-border bg-bg-elevated p-3">
                <Label>Delivery Days</Label>
                <p className="mt-1 text-sm text-text-primary">
                  {selectedQuotation.deliveryDays || 0} days
                </p>
              </div>

              <div className="rounded-lg border border-border bg-bg-elevated p-3">
                <Label>Vendor Rating</Label>
                <p className="mt-1 text-sm text-text-primary">
                  {getVendorRating(selectedQuotation) > 0
                    ? `${getVendorRating(selectedQuotation).toFixed(1)} / 5`
                    : 'Not rated'}
                </p>
              </div>

              <div className="rounded-lg border border-border bg-bg-elevated p-3">
                <Label>Valid Until</Label>
                <p className="mt-1 text-sm text-text-primary">
                  {formatDate(selectedQuotation.validUntil)}
                </p>
              </div>
            </div>

            <div>
              <Label>Quoted Items</Label>

              <div className="mt-2 space-y-2">
                {selectedQuotation.items?.length > 0 ? (
                  selectedQuotation.items.map((item: any, index: number) => (
                    <div
                      key={item.id || index}
                      className="flex flex-col gap-2 rounded-lg border border-border bg-bg-elevated p-3 text-sm sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="text-text-primary">
                          Item #{index + 1}
                        </p>
                        <p className="text-xs text-text-muted">
                          RFQ Item ID: {item.rfqItemId}
                        </p>
                      </div>

                      <span className="mono text-text-primary">
                        {formatCurrency(Number(item.totalPrice || 0))}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="rounded-lg border border-border bg-bg-elevated p-3 text-sm text-text-muted">
                    No quoted item details found.
                  </p>
                )}
              </div>
            </div>

            {selectedQuotation.notes && (
              <div>
                <Label>Vendor Notes</Label>
                <div className="mt-2 flex gap-2 rounded-lg border border-border bg-bg-elevated p-3">
                  <MessageSquare size={16} className="mt-0.5 text-text-muted" />
                  <p className="text-sm text-text-secondary">{selectedQuotation.notes}</p>
                </div>
              </div>
            )}

            <div>
              <Label>Manager Comments</Label>
              <Input
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Add approval/rejection comments..."
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Button
                variant="danger"
                className="w-full"
                onClick={handleReject}
                disabled={actionLoading}
              >
                {actionLoading ? 'Processing...' : 'Reject Quotation'}
              </Button>

              <Button
                variant="primary"
                className="w-full"
                onClick={handleApprove}
                disabled={actionLoading}
              >
                {actionLoading ? 'Processing...' : 'Approve Quotation'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </motion.div>
  );
};

export default ManagerDashboard;