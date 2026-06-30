import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  DollarSign,
  FileText,
  AlertTriangle,
  CheckCircle,
  Search,
  Filter,
  Eye,
  Download,
  Printer,
  Calendar,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import Label from '../components/ui/Label';
import {
  getPurchaseOrders,
  downloadPurchaseOrderPDF,
  sendPurchaseOrderEmail,
} from '../api/purchaseOrders';

import {
  getInvoices,
  payInvoice,
  downloadInvoicePDF,
  sendInvoiceEmail,
} from '../api/invoices';
import { formatCurrency, formatDate, getStatusBadge } from '../utils/formatters';
import Toast from '../components/ui/Toast';

const INVOICES_PER_PAGE = 5;

const FinanceDashboard = () => {
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);

  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [selectedPO, setSelectedPO] = useState<any>(null);

  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [poModalOpen, setPoModalOpen] = useState(false);
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);

  const [paymentData, setPaymentData] = useState({
    amount: 0,
    method: '',
    reference: '',
  });

  const [poSearch, setPoSearch] = useState('');
  const [poStatusFilter, setPoStatusFilter] = useState('ALL');

  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState('ALL');
  const [invoiceSortBy, setInvoiceSortBy] = useState('latest');
  const [invoicePage, setInvoicePage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [emailLoadingId, setEmailLoadingId] = useState<string | null>(null);

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    setInvoicePage(1);
  }, [invoiceSearch, invoiceStatusFilter, invoiceSortBy]);

  const safeFormatDate = (date: any) => {
    if (!date) return 'N/A';

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return 'N/A';
    }

    return formatDate(date);
  };

  const loadData = async () => {
    try {
      setLoading(true);

      const [pos, invs] = await Promise.all([getPurchaseOrders(), getInvoices()]);

      setPurchaseOrders(Array.isArray(pos) ? pos : []);
      setInvoices(Array.isArray(invs) ? invs : []);
    } catch (error) {
      console.error('Error loading finance data:', error);
      setToast({ message: 'Failed to load finance data', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const getPOAmount = (po: any) => Number(po.totalAmount || po.quotation?.totalAmount || 0);

  const getPOVendorName = (po: any) =>
    po.vendor?.companyName || po.quotation?.vendor?.companyName || 'Unknown Vendor';

  const getPORfqTitle = (po: any) =>
    po.rfq?.title || po.quotation?.rfq?.title || 'Linked RFQ';

  const getInvoiceVendorName = (invoice: any) =>
    invoice.purchaseOrder?.quotation?.vendor?.companyName ||
    invoice.vendor?.companyName ||
    'Unknown Vendor';

  const getInvoicePONumber = (invoice: any) =>
    invoice.purchaseOrder?.poNumber || invoice.poNumber || 'N/A';

  const filteredPurchaseOrders = useMemo(() => {
    const keyword = poSearch.trim().toLowerCase();

    return purchaseOrders.filter((po) => {
      const matchesSearch =
        keyword.length === 0 ||
        String(po.poNumber || '').toLowerCase().includes(keyword) ||
        getPOVendorName(po).toLowerCase().includes(keyword) ||
        getPORfqTitle(po).toLowerCase().includes(keyword);

      const matchesStatus = poStatusFilter === 'ALL' || po.status === poStatusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [purchaseOrders, poSearch, poStatusFilter]);

  const filteredInvoices = useMemo(() => {
    const keyword = invoiceSearch.trim().toLowerCase();

    let result = invoices.filter((invoice) => {
      const matchesSearch =
        keyword.length === 0 ||
        String(invoice.invoiceNumber || '').toLowerCase().includes(keyword) ||
        getInvoiceVendorName(invoice).toLowerCase().includes(keyword) ||
        getInvoicePONumber(invoice).toLowerCase().includes(keyword);

      const matchesStatus = invoiceStatusFilter === 'ALL' || invoice.status === invoiceStatusFilter;

      return matchesSearch && matchesStatus;
    });

    result = [...result].sort((a, b) => {
      const amountA = Number(a.amount || 0);
      const amountB = Number(b.amount || 0);
      const dueA = new Date(a.dueDate || 0).getTime();
      const dueB = new Date(b.dueDate || 0).getTime();
      const createdA = new Date(a.createdAt || a.dueDate || 0).getTime();
      const createdB = new Date(b.createdAt || b.dueDate || 0).getTime();

      if (invoiceSortBy === 'latest') return createdB - createdA;
      if (invoiceSortBy === 'oldest') return createdA - createdB;
      if (invoiceSortBy === 'highest-amount') return amountB - amountA;
      if (invoiceSortBy === 'lowest-amount') return amountA - amountB;
      if (invoiceSortBy === 'due-soon') return dueA - dueB;

      return 0;
    });

    return result;
  }, [invoices, invoiceSearch, invoiceStatusFilter, invoiceSortBy]);

  const invoiceTotalPages = Math.max(1, Math.ceil(filteredInvoices.length / INVOICES_PER_PAGE));
  const safeInvoicePage = Math.min(invoicePage, invoiceTotalPages);

  const paginatedInvoices = filteredInvoices.slice(
    (safeInvoicePage - 1) * INVOICES_PER_PAGE,
    safeInvoicePage * INVOICES_PER_PAGE
  );

  const pendingInvoices = invoices.filter((i) => i.status === 'PENDING').length;
  const overdueInvoices = invoices.filter((i) => i.status === 'OVERDUE').length;
  const paidInvoices = invoices.filter((i) => i.status === 'PAID').length;

  const openPaymentModal = (invoice: any) => {
    setSelectedInvoice(invoice);
    setPaymentData({
      amount: Number(invoice.amount || 0),
      method: '',
      reference: '',
    });
    setPaymentModalOpen(true);
  };

  const openPOModal = (po: any) => {
    setSelectedPO(po);
    setPoModalOpen(true);
  };

  const openInvoiceModal = (invoice: any) => {
    setSelectedInvoice(invoice);
    setInvoiceModalOpen(true);
  };

  const handlePayInvoice = async () => {
    if (!selectedInvoice) return;

    if (!paymentData.method.trim()) {
      setToast({ message: 'Payment method is required', type: 'error' });
      return;
    }

    if (!paymentData.reference.trim()) {
      setToast({ message: 'Payment reference is required', type: 'error' });
      return;
    }

    setActionLoading(true);

    try {
      await payInvoice(selectedInvoice.id, paymentData);
      setToast({ message: 'Payment recorded successfully', type: 'success' });
      setPaymentModalOpen(false);
      await loadData();
    } catch (error: any) {
      setToast({ message: error.response?.data?.error || 'Payment failed', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handlePrintPO = (po: any) => {
    const printWindow = window.open('', '_blank');

    if (!printWindow) {
      setToast({ message: 'Popup blocked. Please allow popups.', type: 'error' });
      return;
    }

    printWindow.document.write(`
      <html>
        <head><title>${po.poNumber || 'Purchase Order'}</title></head>
        <body style="font-family: Arial; padding: 32px;">
          <h1>VendorBridge Purchase Order</h1>
          <p>${po.poNumber || 'N/A'}</p>
          <hr />
          <p><b>Vendor:</b> ${getPOVendorName(po)}</p>
          <p><b>RFQ:</b> ${getPORfqTitle(po)}</p>
          <p><b>Status:</b> ${po.status || 'N/A'}</p>
          <p><b>Date:</b> ${safeFormatDate(po.createdAt || po.issueDate)}</p>
          <h2>Total: ${formatCurrency(getPOAmount(po))}</h2>
          <script>window.print();</script>
        </body>
      </html>
    `);

    printWindow.document.close();
  };

  const handleDownloadPO = (po: any) => {
    const content = `
VendorBridge Purchase Order

PO Number: ${po.poNumber || 'N/A'}
Vendor: ${getPOVendorName(po)}
RFQ: ${getPORfqTitle(po)}
Status: ${po.status || 'N/A'}
Date: ${safeFormatDate(po.createdAt || po.issueDate)}
Total Amount: ${formatCurrency(getPOAmount(po))}
`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `${po.poNumber || 'purchase-order'}.txt`;
    link.click();

    URL.revokeObjectURL(url);
    setToast({ message: 'PO downloaded successfully', type: 'success' });
  };

  const handlePrintInvoice = (invoice: any) => {
    const printWindow = window.open('', '_blank');

    if (!printWindow) {
      setToast({ message: 'Popup blocked. Please allow popups.', type: 'error' });
      return;
    }

    printWindow.document.write(`
      <html>
        <head><title>${invoice.invoiceNumber || 'Invoice'}</title></head>
        <body style="font-family: Arial; padding: 32px;">
          <h1>VendorBridge Invoice</h1>
          <p>${invoice.invoiceNumber || 'N/A'}</p>
          <hr />
          <p><b>Vendor:</b> ${getInvoiceVendorName(invoice)}</p>
          <p><b>PO Number:</b> ${getInvoicePONumber(invoice)}</p>
          <p><b>Status:</b> ${invoice.status || 'N/A'}</p>
          <p><b>Due Date:</b> ${safeFormatDate(invoice.dueDate)}</p>
          <h2>Amount: ${formatCurrency(Number(invoice.amount || 0))}</h2>
          <script>window.print();</script>
        </body>
      </html>
    `);

    printWindow.document.close();
  };

  const handleDownloadInvoice = (invoice: any) => {
    const content = `
VendorBridge Invoice

Invoice Number: ${invoice.invoiceNumber || 'N/A'}
Vendor: ${getInvoiceVendorName(invoice)}
PO Number: ${getInvoicePONumber(invoice)}
Status: ${invoice.status || 'N/A'}
Due Date: ${safeFormatDate(invoice.dueDate)}
Amount: ${formatCurrency(Number(invoice.amount || 0))}
`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `${invoice.invoiceNumber || 'invoice'}.txt`;
    link.click();

    URL.revokeObjectURL(url);
    setToast({ message: 'Invoice downloaded successfully', type: 'success' });
  };

  const handleSendPOEmail = async (po: any) => {
  try {
    setEmailLoadingId(po.id);

    await sendPurchaseOrderEmail(po.id);

    setToast({
      message: 'Purchase Order emailed successfully',
      type: 'success',
    });
  } catch (error: any) {
    setToast({
      message:
        error.response?.data?.error || 'Failed to send Purchase Order email',
      type: 'error',
    });
  } finally {
    setEmailLoadingId(null);
  }
};

const handleSendInvoiceEmail = async (invoice: any) => {
  try {
    setEmailLoadingId(invoice.id);

    await sendInvoiceEmail(invoice.id);

    setToast({
      message: 'Invoice emailed successfully',
      type: 'success',
    });
  } catch (error: any) {
    setToast({
      message:
        error.response?.data?.error || 'Failed to send Invoice email',
      type: 'error',
    });
  } finally {
    setEmailLoadingId(null);
  }
};

  const exportInvoicesCSV = () => {
    const rows = filteredInvoices.map((invoice) => ({
      Invoice: invoice.invoiceNumber || '',
      Vendor: getInvoiceVendorName(invoice),
      PO: getInvoicePONumber(invoice),
      Status: invoice.status || '',
      DueDate: invoice.dueDate || '',
      Amount: invoice.amount || 0,
    }));

    if (rows.length === 0) {
      setToast({ message: 'No invoices available to export', type: 'error' });
      return;
    }

    const headers = Object.keys(rows[0]);
    const csv = [
      headers.join(','),
      ...rows.map((row: any) =>
        headers.map((header) => `"${String(row[header] ?? '').replace(/"/g, '""')}"`).join(',')
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `VendorBridge_Invoices_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    URL.revokeObjectURL(url);
    setToast({ message: 'Invoices exported successfully', type: 'success' });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-6"
    >
      <div className="rounded-2xl border border-border bg-bg-surface p-5 sm:p-6">
        <p className="text-sm text-text-secondary">Finance Center</p>
        <h1 className="mt-1 text-2xl font-semibold text-text-primary">
          Purchase Orders & Invoices
        </h1>
        <p className="mt-2 text-sm text-text-secondary">
          Track purchase orders, review invoices and record vendor payments.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="p-5">
            <p className="text-xs uppercase tracking-wide text-text-muted">Total POs</p>
            <p className="mt-2 text-2xl font-semibold text-text-primary">{purchaseOrders.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <p className="text-xs uppercase tracking-wide text-text-muted">Pending Invoices</p>
            <p className="mt-2 text-2xl font-semibold text-text-primary">{pendingInvoices}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <p className="text-xs uppercase tracking-wide text-text-muted">Overdue Invoices</p>
            <p className="mt-2 text-2xl font-semibold text-text-primary">{overdueInvoices}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <p className="text-xs uppercase tracking-wide text-text-muted">Paid Invoices</p>
            <p className="mt-2 text-2xl font-semibold text-text-primary">{paidInvoices}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Purchase Orders</CardTitle>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 skeleton rounded-card" />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPurchaseOrders.map((po) => (
                <div key={po.id} className="rounded-lg border border-border bg-bg-elevated/50 p-4">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <p className="font-medium text-text-primary mono">{po.poNumber}</p>
                        <Badge variant={po.status === 'COMPLETED' ? 'success' : 'default'}>
                          {getStatusBadge(po.status)}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-text-secondary">
                        {getPOVendorName(po)} • {formatCurrency(getPOAmount(po))}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="ghost" onClick={() => openPOModal(po)}>
                        <Eye size={16} className="mr-2" />
                        View
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => downloadPurchaseOrderPDF(po.id)}>
                        <Printer size={16} className="mr-2" />
                        Print
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => downloadPurchaseOrderPDF(po.id)}>
                        <Download size={16} className="mr-2" />
                        Download
                      </Button>
                      <Button
  size="sm"
  variant="ghost"
  onClick={() => handleSendPOEmail(po)}
  disabled={emailLoadingId === po.id}
>
  {emailLoadingId === po.id ? 'Sending...' : 'Email'}
</Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <CardTitle>Invoices</CardTitle>
              <p className="mt-1 text-sm text-text-muted">
                Showing {filteredInvoices.length} of {invoices.length} invoices
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:flex xl:flex-wrap">
              <div className="flex items-center gap-2 rounded-lg border border-border bg-bg-elevated px-3 py-2">
                <Search size={16} className="text-text-muted" />
                <input
                  value={invoiceSearch}
                  onChange={(e) => setInvoiceSearch(e.target.value)}
                  placeholder="Search invoices..."
                  className="w-full bg-transparent text-sm text-text-primary outline-none placeholder:text-text-muted xl:w-56"
                />
              </div>

              <div className="flex items-center gap-2 rounded-lg border border-border bg-bg-elevated px-3 py-2">
                <Filter size={16} className="text-text-muted" />
                <select
                  value={invoiceStatusFilter}
                  onChange={(e) => setInvoiceStatusFilter(e.target.value)}
                  className="w-full bg-transparent text-sm text-text-primary outline-none"
                >
                  <option value="ALL">All Status</option>
                  <option value="PENDING">Pending</option>
                  <option value="OVERDUE">Overdue</option>
                  <option value="PAID">Paid</option>
                </select>
              </div>

              <div className="flex items-center gap-2 rounded-lg border border-border bg-bg-elevated px-3 py-2">
                <ArrowUpDown size={16} className="text-text-muted" />
                <select
                  value={invoiceSortBy}
                  onChange={(e) => setInvoiceSortBy(e.target.value)}
                  className="w-full bg-transparent text-sm text-text-primary outline-none"
                >
                  <option value="latest">Latest</option>
                  <option value="oldest">Oldest</option>
                  <option value="highest-amount">Highest Amount</option>
                  <option value="lowest-amount">Lowest Amount</option>
                  <option value="due-soon">Due Soon</option>
                </select>
              </div>

              <button
                onClick={exportInvoicesCSV}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-2 text-sm text-text-secondary hover:bg-bg-elevated hover:text-text-primary"
              >
                <Download size={16} />
                Export CSV
              </button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 skeleton rounded-card" />
              ))}
            </div>
          ) : paginatedInvoices.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-bg-elevated/30 p-10 text-center">
              <FileText size={44} className="mx-auto mb-3 text-text-muted" />
              <p className="font-medium text-text-primary">No invoices found</p>
              <p className="mt-1 text-sm text-text-muted">
                Vendor invoices will appear here after purchase orders are issued.
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {paginatedInvoices.map((invoice, index) => (
                  <motion.div
                    key={invoice.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.04 }}
                    className={`rounded-lg border p-4 ${
                      invoice.status === 'OVERDUE'
                        ? 'border-danger/30 bg-danger/5'
                        : 'border-border bg-bg-elevated/50'
                    }`}
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <p className="font-medium text-text-primary mono">
                            {invoice.invoiceNumber}
                          </p>

                          <Badge
                            variant={
                              invoice.status === 'PAID'
                                ? 'success'
                                : invoice.status === 'OVERDUE'
                                  ? 'danger'
                                  : 'warning'
                            }
                          >
                            {getStatusBadge(invoice.status)}
                          </Badge>
                        </div>

                        <p className="mt-1 text-sm text-text-secondary">
                          {getInvoiceVendorName(invoice)} •{' '}
                          {formatCurrency(Number(invoice.amount || 0))}
                        </p>

                        <div className="mt-2 flex flex-wrap gap-4 text-xs text-text-muted">
                          <span>PO: {getInvoicePONumber(invoice)}</span>
                          <span className="flex items-center gap-1">
                            <Calendar size={14} />
                            Due: {safeFormatDate(invoice.dueDate)}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="ghost" onClick={() => openInvoiceModal(invoice)}>
                          <Eye size={16} className="mr-2" />
                          View
                        </Button>

                        <Button size="sm" variant="ghost" onClick={() => handlePrintInvoice(invoice)}>
                          <Printer size={16} className="mr-2" />
                          Print
                        </Button>

                        <Button size="sm" variant="ghost"  onClick={() => downloadInvoicePDF(invoice.id)}>
                          <Download size={16} className="mr-2" />
                          Download
                        </Button>

                        {invoice.status === 'PENDING' || invoice.status === 'OVERDUE' ? (
                          <Button size="sm" onClick={() => openPaymentModal(invoice)}>
                            Mark as Paid
                          </Button>
                        ) : (
                          <div className="flex items-center gap-2 rounded-lg bg-success/10 px-3 py-2 text-sm text-success">
                            <CheckCircle size={18} />
                            Paid
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {invoiceTotalPages > 1 && (
                <div className="mt-6 flex flex-col gap-3 border-t border-border pt-4 md:flex-row md:items-center md:justify-between">
                  <p className="text-sm text-text-muted">
                    Page {safeInvoicePage} of {invoiceTotalPages}
                  </p>

                  <div className="flex gap-2">
                    <button
                      disabled={safeInvoicePage === 1}
                      onClick={() => setInvoicePage((page) => Math.max(1, page - 1))}
                      className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-sm text-text-secondary hover:bg-bg-elevated disabled:opacity-40"
                    >
                      <ChevronLeft size={16} />
                      Previous
                    </button>

                    <button
                      disabled={safeInvoicePage === invoiceTotalPages}
                      onClick={() =>
                        setInvoicePage((page) => Math.min(invoiceTotalPages, page + 1))
                      }
                      className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-sm text-text-secondary hover:bg-bg-elevated disabled:opacity-40"
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

      <Modal
        isOpen={poModalOpen}
        onClose={() => setPoModalOpen(false)}
        title="Purchase Order Details"
        size="lg"
      >
        {selectedPO && (
          <div className="space-y-4">
            <Label>PO Number</Label>
            <p className="text-lg font-semibold text-text-primary mono">{selectedPO.poNumber}</p>

            <Label>Vendor</Label>
            <p className="text-sm text-text-primary">{getPOVendorName(selectedPO)}</p>

            <Label>Total Amount</Label>
            <p className="text-sm text-text-primary mono">{formatCurrency(getPOAmount(selectedPO))}</p>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={invoiceModalOpen}
        onClose={() => setInvoiceModalOpen(false)}
        title="Invoice Details"
        size="lg"
      >
        {selectedInvoice && (
          <div className="space-y-4">
            <Label>Invoice Number</Label>
            <p className="text-lg font-semibold text-text-primary mono">
              {selectedInvoice.invoiceNumber}
            </p>

            <Label>Vendor</Label>
            <p className="text-sm text-text-primary">{getInvoiceVendorName(selectedInvoice)}</p>

            <Label>PO Number</Label>
            <p className="text-sm text-text-primary mono">{getInvoicePONumber(selectedInvoice)}</p>

            <Label>Amount</Label>
            <p className="text-sm text-text-primary mono">
              {formatCurrency(Number(selectedInvoice.amount || 0))}
            </p>

            <Label>Due Date</Label>
            <p className="text-sm text-text-primary">{safeFormatDate(selectedInvoice.dueDate)}</p>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        title="Record Payment"
      >
        {selectedInvoice && (
          <div className="space-y-4">
            <div>
              <Label>Invoice</Label>
              <p className="mt-1 text-sm text-text-primary mono">
                {selectedInvoice.invoiceNumber}
              </p>
            </div>

            <div>
              <Label>Amount</Label>
              <p className="mt-1 text-sm text-text-primary mono">
                {formatCurrency(Number(selectedInvoice.amount || 0))}
              </p>
            </div>

            <div>
              <Label>Payment Method</Label>
              <Input
                value={paymentData.method}
                onChange={(e) => setPaymentData({ ...paymentData, method: e.target.value })}
                placeholder="Bank Transfer, UPI, Cheque, etc."
              />
            </div>

            <div>
              <Label>Reference</Label>
              <Input
                value={paymentData.reference}
                onChange={(e) => setPaymentData({ ...paymentData, reference: e.target.value })}
                placeholder="Transaction reference"
              />
            </div>

            <Button className="w-full" onClick={handlePayInvoice} disabled={actionLoading}>
              {actionLoading ? 'Processing...' : 'Record Payment'}
            </Button>
          </div>
        )}
      </Modal>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </motion.div>
  );
};

export default FinanceDashboard;