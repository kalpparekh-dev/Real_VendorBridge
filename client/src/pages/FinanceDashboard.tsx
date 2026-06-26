import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, FileText, AlertTriangle, CheckCircle } from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import Label from '../components/ui/Label';
import { getPurchaseOrders } from "../api/purchaseOrders";
import { getInvoices, payInvoice } from "../api/invoices";
import { getVendors } from "../api/vendors";
import { formatCurrency, formatDate, getStatusBadge, getStatusColor } from '../utils/formatters';
import Toast from '../components/ui/Toast';

const FinanceDashboard = () => {
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [paymentData, setPaymentData] = useState({ amount: 0, method: '', reference: '' });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [pos, invs] = await Promise.all([getPurchaseOrders(), getInvoices()]);
      setPurchaseOrders(pos);
      setInvoices(invs);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePayInvoice = async () => {
    setActionLoading(true);
    try {
      await payInvoice(selectedInvoice.id, paymentData);
      setToast({ message: 'Payment recorded successfully', type: 'success' });
      setModalOpen(false);
      loadData();
    } catch (error: any) {
      setToast({ message: error.response?.data?.error || 'Payment failed', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const openPaymentModal = (invoice: any) => {
    setSelectedInvoice(invoice);
    setPaymentData({ amount: Number(invoice.amount), method: '', reference: '' });
    setModalOpen(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary">Total POs</p>
                <p className="mt-2 text-2xl font-semibold text-text-primary">{purchaseOrders.length}</p>
              </div>
              <div className="rounded-lg bg-bg-elevated p-3 text-accent">
                <FileText size={24} />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary">Pending Invoices</p>
                <p className="mt-2 text-2xl font-semibold text-text-primary">
                  {invoices.filter((i) => i.status === 'PENDING').length}
                </p>
              </div>
              <div className="rounded-lg bg-bg-elevated p-3 text-warning">
                <DollarSign size={24} />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary">Overdue Invoices</p>
                <p className="mt-2 text-2xl font-semibold text-text-primary">
                  {invoices.filter((i) => i.status === 'OVERDUE').length}
                </p>
              </div>
              <div className="rounded-lg bg-bg-elevated p-3 text-danger">
                <AlertTriangle size={24} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Purchase Orders */}
      <Card>
        <CardHeader>
          <CardTitle>Purchase Orders</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 skeleton rounded-card" />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {purchaseOrders.map((po) => (
                <div key={po.id} className="flex items-center justify-between rounded-lg border border-border bg-bg-elevated/50 p-4">
                  <div>
                    <p className="font-medium text-text-primary mono">{po.poNumber}</p>
                    <p className="mt-1 text-sm text-text-secondary">
                      {po.quotation?.vendor?.companyName} • {formatCurrency(Number(po.quotation?.totalAmount))}
                    </p>
                  </div>
                  <Badge variant={po.status === 'ISSUED' ? 'default' : 'success'}>
                    {getStatusBadge(po.status)}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invoices */}
      <Card>
        <CardHeader>
          <CardTitle>Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 skeleton rounded-card" />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {invoices.map((invoice) => (
                <motion.div
                  key={invoice.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex items-center justify-between rounded-lg border p-4 ${
                    invoice.status === 'OVERDUE' ? 'border-danger/30 bg-danger/5' : 'border-border bg-bg-elevated/50'
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <p className="font-medium text-text-primary mono">{invoice.invoiceNumber}</p>
                      <Badge
                        variant={
                          invoice.status === 'PAID' ? 'success' : invoice.status === 'OVERDUE' ? 'danger' : 'warning'
                        }
                      >
                        {getStatusBadge(invoice.status)}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-text-secondary">
                      {invoice.purchaseOrder?.quotation?.vendor?.companyName} • {formatCurrency(Number(invoice.amount))}
                    </p>
                    <p className="mt-1 text-xs text-text-muted">Due: {formatDate(invoice.dueDate)}</p>
                  </div>
                  {invoice.status === 'PENDING' || invoice.status === 'OVERDUE' ? (
                    <Button size="sm" onClick={() => openPaymentModal(invoice)}>
                      Mark as Paid
                    </Button>
                  ) : (
                    <div className="rounded-lg bg-success/10 p-2">
                      <CheckCircle size={20} className="text-success" />
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Record Payment">
        {selectedInvoice && (
          <div className="space-y-4">
            <div>
              <Label>Invoice</Label>
              <p className="mt-1 text-sm text-text-primary mono">{selectedInvoice.invoiceNumber}</p>
            </div>
            <div>
              <Label>Amount</Label>
              <p className="mt-1 text-sm text-text-primary mono">{formatCurrency(selectedInvoice.amount)}</p>
            </div>
            <div>
              <Label>Payment Method</Label>
              <Input
                value={paymentData.method}
                onChange={(e) => setPaymentData({ ...paymentData, method: e.target.value })}
                placeholder="Bank Transfer, UPI, etc."
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

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </motion.div>
  );
};

export default FinanceDashboard;
