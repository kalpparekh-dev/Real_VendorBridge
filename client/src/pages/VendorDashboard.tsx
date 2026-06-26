import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, FileText, CheckSquare, Clock } from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import Label from '../components/ui/Label';
import { getRFQs } from "../api/rfqs";
import { getQuotations, createQuotation } from "../api/quotations";
import { getPurchaseOrders } from "../api/purchaseOrders";
import { useAuthStore } from '../store/authStore';
import { formatCurrency, formatDate, getStatusBadge } from '../utils/formatters';
import Toast from '../components/ui/Toast';

const VendorDashboard = () => {
  const { user } = useAuthStore();
  const [rfqs, setRfqs] = useState<any[]>([]);
  const [quotations, setQuotations] = useState<any[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [selectedRFQ, setSelectedRFQ] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [quotationItems, setQuotationItems] = useState<any[]>([]);
  const [quotationForm, setQuotationForm] = useState({
    deliveryDays: 7,
    validUntil: '',
    notes: '',
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [rfqsData, quotationsData, posData] = await Promise.all([
        getRFQs(),
        getQuotations(),
        getPurchaseOrders(),
      ]);
      
      const openRFQs = rfqsData.filter((rfq: any) => rfq.status === 'PUBLISHED');
      const myQuotations = quotationsData.filter((q: any) => q.vendorId === user?.vendor?.id);
      const myPOs = posData.filter((po: any) => po.quotation?.vendorId === user?.vendor?.id);
      
      setRfqs(openRFQs);
      setQuotations(myQuotations);
      setPurchaseOrders(myPOs);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const openQuotationModal = (rfq: any) => {
    setSelectedRFQ(rfq);
    setQuotationItems(
      rfq.items.map((item: any) => ({
        rfqItemId: item.id,
        unitPrice: 0,
        quantity: item.quantity,
        totalPrice: 0,
      }))
    );
    setQuotationForm({
      deliveryDays: 7,
      validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      notes: '',
    });
    setModalOpen(true);
  };

  const handleItemChange = (index: number, field: string, value: number) => {
    const updated = [...quotationItems];
    updated[index][field] = value;
    if (field === 'unitPrice') {
      updated[index].totalPrice = value * updated[index].quantity;
    }
    setQuotationItems(updated);
  };

  const handleSubmitQuotation = async () => {
    if (!selectedRFQ) return;

    setSubmitting(true);
    try {
      await createQuotation({
        rfqId: selectedRFQ.id,
        vendorId: user?.vendor?.id,
        items: quotationItems,
        ...quotationForm,
      });
      setToast({ message: 'Quotation submitted successfully', type: 'success' });
      setModalOpen(false);
      loadData();
    } catch (error: any) {
      setToast({ message: error.response?.data?.error || 'Failed to submit quotation', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Open RFQs */}
      <Card>
        <CardHeader>
          <CardTitle>Open RFQs</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 skeleton rounded-card" />
              ))}
            </div>
          ) : rfqs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ShoppingCart size={48} className="mb-4 text-text-muted" />
              <p className="text-text-secondary">No open RFQs available</p>
            </div>
          ) : (
            <div className="space-y-4">
              {rfqs.map((rfq) => (
                <motion.div
                  key={rfq.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-between rounded-lg border border-border bg-bg-elevated/50 p-4 hover:bg-bg-elevated"
                >
                  <div className="flex-1">
                    <h3 className="font-medium text-text-primary">{rfq.title}</h3>
                    <p className="mt-1 text-sm text-text-secondary">{rfq.description}</p>
                    <div className="mt-2 flex items-center gap-4 text-xs text-text-muted">
                      <span className="flex items-center gap-1">
                        <Clock size={14} />
                        Deadline: {formatDate(rfq.deadline)}
                      </span>
                      <span>{rfq.items.length} items</span>
                    </div>
                  </div>
                  <Button size="sm" onClick={() => openQuotationModal(rfq)}>
                    Submit Quote
                  </Button>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* My Quotations */}
      <Card>
        <CardHeader>
          <CardTitle>My Quotations</CardTitle>
        </CardHeader>
        <CardContent>
          {quotations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText size={48} className="mb-4 text-text-muted" />
              <p className="text-text-secondary">No quotations submitted yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {quotations.map((quotation) => (
                <div key={quotation.id} className="flex items-center justify-between rounded-lg border border-border bg-bg-elevated/50 p-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <p className="font-medium text-text-primary">{quotation.rfq?.title}</p>
                      <Badge variant={quotation.status === 'APPROVED' ? 'success' : quotation.status === 'REJECTED' ? 'danger' : 'default'}>
                        {getStatusBadge(quotation.status)}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-text-secondary">
                      {formatCurrency(Number(quotation.totalAmount))} • {quotation.deliveryDays} days
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* My Purchase Orders */}
      <Card>
        <CardHeader>
          <CardTitle>My Purchase Orders</CardTitle>
        </CardHeader>
        <CardContent>
          {purchaseOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CheckSquare size={48} className="mb-4 text-text-muted" />
              <p className="text-text-secondary">No purchase orders yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {purchaseOrders.map((po) => (
                <div key={po.id} className="flex items-center justify-between rounded-lg border border-border bg-bg-elevated/50 p-4">
                  <div>
                    <p className="font-medium text-text-primary mono">{po.poNumber}</p>
                    <p className="mt-1 text-sm text-text-secondary">
                      Delivery: {formatDate(po.deliveryDate)}
                    </p>
                  </div>
                  <Badge variant="success">{getStatusBadge(po.status)}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Submit Quotation" size="lg">
        {selectedRFQ && (
          <div className="space-y-4">
            <div>
              <Label>RFQ</Label>
              <p className="mt-1 text-sm text-text-primary">{selectedRFQ.title}</p>
            </div>

            <div>
              <Label>Items</Label>
              <div className="mt-2 space-y-3">
                {selectedRFQ.items.map((item: any, index: number) => (
                  <div key={item.id} className="rounded-lg border border-border bg-bg-elevated p-3">
                    <p className="text-sm text-text-primary">{item.name}</p>
                    <p className="text-xs text-text-muted">Qty: {item.quantity} {item.unit}</p>
                    <div className="mt-2">
                      <Label className="text-xs">Unit Price (₹)</Label>
                      <Input
                        type="number"
                        value={quotationItems[index]?.unitPrice || ''}
                        onChange={(e) => handleItemChange(index, 'unitPrice', Number(e.target.value))}
                        placeholder="Enter unit price"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Delivery Days</Label>
                <Input
                  type="number"
                  value={quotationForm.deliveryDays}
                  onChange={(e) => setQuotationForm({ ...quotationForm, deliveryDays: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label>Valid Until</Label>
                <Input
                  type="date"
                  value={quotationForm.validUntil}
                  onChange={(e) => setQuotationForm({ ...quotationForm, validUntil: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label>Notes</Label>
              <Input
                value={quotationForm.notes}
                onChange={(e) => setQuotationForm({ ...quotationForm, notes: e.target.value })}
                placeholder="Additional notes..."
              />
            </div>

            <Button className="w-full" onClick={handleSubmitQuotation} disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Quotation'}
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

export default VendorDashboard;
