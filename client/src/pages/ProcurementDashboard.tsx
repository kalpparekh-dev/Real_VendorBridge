import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  Plus,
  Eye,
  Send,
  Clock,
  Search,
  Filter,
  Download,
  CheckCircle,
  Layers,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Inbox,
} from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import Label from '../components/ui/Label';
import { getRFQs, createRFQ, publishRFQ } from '../api/rfqs';
import { getQuotations } from '../api/quotations';
import { formatDate, getStatusBadge } from '../utils/formatters';
import Toast from '../components/ui/Toast';

const ITEMS_PER_PAGE = 5;

const ProcurementDashboard = () => {
  const [rfqs, setRfqs] = useState<any[]>([]);
  const [quotations, setQuotations] = useState<any[]>([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedRFQ, setSelectedRFQ] = useState<any>(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);

  const [rfqForm, setRfqForm] = useState({
    title: '',
    description: '',
    deadline: '',
    items: [{ name: '', description: '', quantity: 1, unit: 'units' }],
  });

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, sortBy]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [rfqsData, quotationsData] = await Promise.all([getRFQs(), getQuotations()]);
      setRfqs(Array.isArray(rfqsData) ? rfqsData : []);
      setQuotations(Array.isArray(quotationsData) ? quotationsData : []);
    } catch (error) {
      console.error('Error loading data:', error);
      setToast({ message: 'Failed to load RFQ data', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const getQuotationCount = (rfqId: string) => {
    return quotations.filter((q: any) => q.rfqId === rfqId || q.rfq?.id === rfqId).length;
  };

  const stats = useMemo(() => {
    return {
      total: rfqs.length,
      draft: rfqs.filter((r) => r.status === 'DRAFT').length,
      published: rfqs.filter((r) => r.status === 'PUBLISHED').length,
      quotations: quotations.length,
    };
  }, [rfqs, quotations]);

  const filteredRFQs = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    let result = rfqs.filter((rfq) => {
      const itemText =
        rfq.items
          ?.map((item: any) => `${item.name || ''} ${item.description || ''}`)
          .join(' ')
          .toLowerCase() || '';

      const matchesSearch =
        keyword.length === 0 ||
        rfq.title?.toLowerCase().includes(keyword) ||
        rfq.description?.toLowerCase().includes(keyword) ||
        itemText.includes(keyword);

      const matchesStatus = statusFilter === 'ALL' || rfq.status === statusFilter;

      return matchesSearch && matchesStatus;
    });

    result = [...result].sort((a, b) => {
      const aCreated = new Date(a.createdAt || a.deadline || 0).getTime();
      const bCreated = new Date(b.createdAt || b.deadline || 0).getTime();
      const aDeadline = new Date(a.deadline || 0).getTime();
      const bDeadline = new Date(b.deadline || 0).getTime();
      const aQuotes = getQuotationCount(a.id);
      const bQuotes = getQuotationCount(b.id);

      if (sortBy === 'newest') return bCreated - aCreated;
      if (sortBy === 'oldest') return aCreated - bCreated;
      if (sortBy === 'deadline') return aDeadline - bDeadline;
      if (sortBy === 'title-az') return String(a.title || '').localeCompare(String(b.title || ''));
      if (sortBy === 'title-za') return String(b.title || '').localeCompare(String(a.title || ''));
      if (sortBy === 'most-quotes') return bQuotes - aQuotes;
      if (sortBy === 'least-quotes') return aQuotes - bQuotes;

      return 0;
    });

    return result;
  }, [rfqs, quotations, search, statusFilter, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredRFQs.length / ITEMS_PER_PAGE));

  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedRFQs = filteredRFQs.slice(
    (safeCurrentPage - 1) * ITEMS_PER_PAGE,
    safeCurrentPage * ITEMS_PER_PAGE
  );

  const paginationPages = useMemo(() => {
    const pages: number[] = [];
    const maxVisiblePages = 5;

    let start = Math.max(1, safeCurrentPage - 2);
    const end = Math.min(totalPages, start + maxVisiblePages - 1);

    if (end - start < maxVisiblePages - 1) {
      start = Math.max(1, end - maxVisiblePages + 1);
    }

    for (let page = start; page <= end; page += 1) {
      pages.push(page);
    }

    return pages;
  }, [safeCurrentPage, totalPages]);

  const addItem = () => {
    setRfqForm({
      ...rfqForm,
      items: [...rfqForm.items, { name: '', description: '', quantity: 1, unit: 'units' }],
    });
  };

  const removeItem = (index: number) => {
    setRfqForm({
      ...rfqForm,
      items: rfqForm.items.filter((_, i) => i !== index),
    });
  };

  const handleItemChange = (index: number, field: string, value: string | number) => {
    const updated = [...rfqForm.items];
    updated[index] = { ...updated[index], [field]: value };
    setRfqForm({ ...rfqForm, items: updated });
  };

  const resetRFQForm = () => {
    setRfqForm({
      title: '',
      description: '',
      deadline: '',
      items: [{ name: '', description: '', quantity: 1, unit: 'units' }],
    });
  };

  const validateRFQForm = () => {
    if (!rfqForm.title.trim()) {
      setToast({ message: 'RFQ title is required', type: 'error' });
      return false;
    }

    if (!rfqForm.description.trim()) {
      setToast({ message: 'RFQ description is required', type: 'error' });
      return false;
    }

    if (!rfqForm.deadline) {
      setToast({ message: 'RFQ deadline is required', type: 'error' });
      return false;
    }

    const invalidItem = rfqForm.items.some(
      (item) => !item.name.trim() || Number(item.quantity) <= 0 || !item.unit.trim()
    );

    if (invalidItem) {
      setToast({ message: 'Every item needs name, valid quantity and unit', type: 'error' });
      return false;
    }

    return true;
  };

  const handleSubmitRFQ = async () => {
    if (!validateRFQForm()) return;

    setSubmitting(true);

    try {
      await createRFQ(rfqForm);
      setToast({ message: 'RFQ created successfully', type: 'success' });
      setModalOpen(false);
      resetRFQForm();
      await loadData();
    } catch (error: any) {
      setToast({ message: error.response?.data?.error || 'Failed to create RFQ', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handlePublish = async (id: string) => {
    try {
      await publishRFQ(id);
      setToast({ message: 'RFQ published successfully', type: 'success' });
      await loadData();
    } catch (error: any) {
      setToast({ message: error.response?.data?.error || 'Failed to publish RFQ', type: 'error' });
    }
  };

  const viewRFQDetails = (rfq: any) => {
    setSelectedRFQ(rfq);
    setViewModalOpen(true);
  };

  const exportCSV = () => {
    const rows = filteredRFQs.map((rfq) => ({
      Title: rfq.title || '',
      Description: rfq.description || '',
      Status: rfq.status || '',
      Deadline: rfq.deadline || '',
      Items: rfq.items?.length || 0,
      Quotations: getQuotationCount(rfq.id),
    }));

    if (rows.length === 0) {
      setToast({ message: 'No RFQs available to export', type: 'error' });
      return;
    }

    const headers = Object.keys(rows[0]);
    const csvHeader = headers.join(',');

    const csvBody = rows
      .map((row: any) =>
        headers
          .map((header) => {
            const value = String(row[header] ?? '');
            return `"${value.replace(/"/g, '""')}"`;
          })
          .join(',')
      )
      .join('\n');

    const csv = `${csvHeader}\n${csvBody}`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const today = new Date().toISOString().split('T')[0];
    const link = document.createElement('a');

    link.href = url;
    link.download = `VendorBridge_RFQs_${today}.csv`;
    link.click();

    URL.revokeObjectURL(url);
    setToast({ message: 'RFQs exported successfully', type: 'success' });
  };

  const statCards = [
    { label: 'Total RFQs', value: stats.total, icon: FileText, color: 'text-accent' },
    { label: 'Draft RFQs', value: stats.draft, icon: Layers, color: 'text-warning' },
    { label: 'Published RFQs', value: stats.published, icon: CheckCircle, color: 'text-success' },
    { label: 'Quotations', value: stats.quotations, icon: Send, color: 'text-accent' },
  ];

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 skeleton rounded-card" />
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
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-text-secondary">Procurement Center</p>
            <h1 className="mt-1 text-2xl font-semibold text-text-primary">
              Request for Quotations
            </h1>
            <p className="mt-2 text-sm text-text-secondary">
              Create, publish, track and compare RFQs across your vendor network.
            </p>
          </div>

          <Button size="sm" onClick={() => setModalOpen(true)}>
            <Plus size={16} className="mr-2" />
            Create RFQ
          </Button>
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
              <CardTitle>RFQ Workspace</CardTitle>
              <p className="mt-1 text-sm text-text-muted">
                Showing {filteredRFQs.length} of {rfqs.length} RFQs
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:flex xl:flex-wrap">
              <div className="flex items-center gap-2 rounded-lg border border-border bg-bg-elevated px-3 py-2">
                <Search size={16} className="text-text-muted" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search RFQs..."
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
                  <option value="ALL">All Status</option>
                  <option value="DRAFT">Draft</option>
                  <option value="PUBLISHED">Published</option>
                  <option value="CLOSED">Closed</option>
                </select>
              </div>

              <div className="flex items-center gap-2 rounded-lg border border-border bg-bg-elevated px-3 py-2">
                <ArrowUpDown size={16} className="text-text-muted" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full bg-transparent text-sm text-text-primary outline-none"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="deadline">Deadline</option>
                  <option value="title-az">Title A-Z</option>
                  <option value="title-za">Title Z-A</option>
                  <option value="most-quotes">Most Quotations</option>
                  <option value="least-quotes">Least Quotations</option>
                </select>
              </div>

              <button
                onClick={exportCSV}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-2 text-sm text-text-secondary hover:bg-bg-elevated hover:text-text-primary"
              >
                <Download size={16} />
                Export CSV
              </button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {filteredRFQs.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-bg-elevated/30 p-8 text-center sm:p-10">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-bg-surface">
                <Inbox size={34} className="text-text-muted" />
              </div>

              <p className="font-medium text-text-primary">No RFQs found</p>

              <p className="mx-auto mt-2 max-w-md text-sm text-text-muted">
                Try changing your search or filter. If this is your first procurement cycle,
                create a new RFQ and publish it to vendors.
              </p>

              <div className="mt-5 flex justify-center">
                <Button size="sm" onClick={() => setModalOpen(true)}>
                  <Plus size={16} className="mr-2" />
                  Create RFQ
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {paginatedRFQs.map((rfq, index) => {
                  const quoteCount = getQuotationCount(rfq.id);

                  return (
                    <motion.div
                      key={rfq.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.04 }}
                      className="rounded-xl border border-border bg-bg-elevated/40 p-4 transition hover:bg-bg-elevated"
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-3">
                            <h3 className="break-words font-medium text-text-primary">
                              {rfq.title}
                            </h3>

                            <Badge variant={rfq.status === 'PUBLISHED' ? 'success' : 'default'}>
                              {getStatusBadge(rfq.status)}
                            </Badge>
                          </div>

                          <p className="mt-2 max-w-3xl break-words text-sm text-text-secondary">
                            {rfq.description}
                          </p>

                          <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-text-muted">
                            <span className="flex items-center gap-1">
                              <Clock size={14} />
                              Deadline: {formatDate(rfq.deadline)}
                            </span>

                            <span>{rfq.items?.length || 0} items</span>
                            <span>{quoteCount} quotations</span>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 sm:flex-row lg:justify-end">
                          <Button size="sm" variant="ghost" onClick={() => viewRFQDetails(rfq)}>
                            <Eye size={16} className="mr-2" />
                            View
                          </Button>

                          {rfq.status === 'DRAFT' && (
                            <Button size="sm" onClick={() => handlePublish(rfq.id)}>
                              <Send size={16} className="mr-2" />
                              Publish
                            </Button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {totalPages > 1 && (
                <div className="mt-6 flex flex-col gap-4 border-t border-border pt-4 lg:flex-row lg:items-center lg:justify-between">
                  <p className="text-sm text-text-muted">
                    Showing {(safeCurrentPage - 1) * ITEMS_PER_PAGE + 1} to{' '}
                    {Math.min(safeCurrentPage * ITEMS_PER_PAGE, filteredRFQs.length)} of{' '}
                    {filteredRFQs.length} RFQs
                  </p>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      disabled={safeCurrentPage === 1}
                      onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                      className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-sm text-text-secondary hover:bg-bg-elevated disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ChevronLeft size={16} />
                      Previous
                    </button>

                    {paginationPages.map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`rounded-lg border px-3 py-2 text-sm transition ${
                          page === safeCurrentPage
                            ? 'border-accent bg-accent text-white'
                            : 'border-border text-text-secondary hover:bg-bg-elevated hover:text-text-primary'
                        }`}
                      >
                        {page}
                      </button>
                    ))}

                    <button
                      disabled={safeCurrentPage === totalPages}
                      onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                      className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-sm text-text-secondary hover:bg-bg-elevated disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Next
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Create RFQ" size="lg">
        <div className="space-y-4">
          <div>
            <Label>Title</Label>
            <Input
              value={rfqForm.title}
              onChange={(e) => setRfqForm({ ...rfqForm, title: e.target.value })}
              placeholder="RFQ title"
            />
          </div>

          <div>
            <Label>Description</Label>
            <Input
              value={rfqForm.description}
              onChange={(e) => setRfqForm({ ...rfqForm, description: e.target.value })}
              placeholder="Brief description"
            />
          </div>

          <div>
            <Label>Deadline</Label>
            <Input
              type="date"
              value={rfqForm.deadline}
              onChange={(e) => setRfqForm({ ...rfqForm, deadline: e.target.value })}
            />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <Label>Items</Label>

              <Button size="sm" variant="ghost" onClick={addItem}>
                <Plus size={16} />
              </Button>
            </div>

            <div className="mt-2 space-y-3">
              {rfqForm.items.map((item, index) => (
                <div key={index} className="rounded-lg border border-border bg-bg-elevated p-3">
                  <div className="grid gap-2 md:grid-cols-2">
                    <Input
                      placeholder="Item name"
                      value={item.name}
                      onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                    />

                    <Input
                      placeholder="Description"
                      value={item.description}
                      onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                    />

                    <Input
                      type="number"
                      min="1"
                      placeholder="Quantity"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', Number(e.target.value))}
                    />

                    <Input
                      placeholder="Unit"
                      value={item.unit}
                      onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                    />
                  </div>

                  {rfqForm.items.length > 1 && (
                    <Button
                      size="sm"
                      variant="danger"
                      className="mt-2"
                      onClick={() => removeItem(index)}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <Button className="w-full" onClick={handleSubmitRFQ} disabled={submitting}>
            {submitting ? 'Creating...' : 'Create RFQ'}
          </Button>
        </div>
      </Modal>

      <Modal
        isOpen={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        title="RFQ Details"
        size="lg"
      >
        {selectedRFQ && (
          <div className="space-y-4">
            <div>
              <Label>Title</Label>
              <p className="mt-1 text-sm text-text-primary">{selectedRFQ.title}</p>
            </div>

            <div>
              <Label>Description</Label>
              <p className="mt-1 text-sm text-text-secondary">{selectedRFQ.description}</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Deadline</Label>
                <p className="mt-1 text-sm text-text-primary">
                  {formatDate(selectedRFQ.deadline)}
                </p>
              </div>

              <div>
                <Label>Status</Label>
                <div className="mt-1">
                  <Badge variant={selectedRFQ.status === 'PUBLISHED' ? 'success' : 'default'}>
                    {getStatusBadge(selectedRFQ.status)}
                  </Badge>
                </div>
              </div>
            </div>

            <div>
              <Label>Items</Label>

              <div className="mt-2 space-y-2">
                {selectedRFQ.items?.length > 0 ? (
                  selectedRFQ.items.map((item: any, index: number) => (
                    <div
                      key={item.id || index}
                      className="rounded-lg border border-border bg-bg-elevated p-3"
                    >
                      <p className="text-sm text-text-primary">{item.name}</p>
                      <p className="text-xs text-text-muted">{item.description}</p>
                      <p className="mt-1 text-xs text-text-secondary">
                        Qty: {item.quantity} {item.unit}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="rounded-lg border border-border bg-bg-elevated p-3 text-sm text-text-muted">
                    No line items found for this RFQ.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </motion.div>
  );
};

export default ProcurementDashboard;