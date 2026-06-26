import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Plus, Eye, Send, Clock } from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import Label from '../components/ui/Label';
import { getRFQs, createRFQ, publishRFQ } from '../api/rfqs';
import { getQuotations } from '../api/quotations';
import { formatCurrency, formatDate, getStatusBadge } from '../utils/formatters';
import Toast from '../components/ui/Toast';

const ProcurementDashboard = () => {
  const [rfqs, setRfqs] = useState<any[]>([]);
  const [quotations, setQuotations] = useState<any[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedRFQ, setSelectedRFQ] = useState<any>(null);
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

  const loadData = async () => {
    try {
      const [rfqsData, quotationsData] = await Promise.all([getRFQs(), getQuotations()]);
      setRfqs(rfqsData);
      setQuotations(quotationsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const handleSubmitRFQ = async () => {
    setSubmitting(true);
    try {
      const rfq = await createRFQ(rfqForm);
      setToast({ message: 'RFQ created successfully', type: 'success' });
      setModalOpen(false);
      setRfqForm({
        title: '',
        description: '',
        deadline: '',
        items: [{ name: '', description: '', quantity: 1, unit: 'units' }],
      });
      loadData();
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
      loadData();
    } catch (error: any) {
      setToast({ message: error.response?.data?.error || 'Failed to publish', type: 'error' });
    }
  };

  const viewRFQDetails = (rfq: any) => {
    setSelectedRFQ(rfq);
    setViewModalOpen(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Request for Quotations</CardTitle>
            <Button size="sm" onClick={() => setModalOpen(true)}>
              <Plus size={16} className="mr-2" />
              Create RFQ
            </Button>
          </div>
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
              {rfqs.map((rfq) => (
                <motion.div
                  key={rfq.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-between rounded-lg border border-border bg-bg-elevated/50 p-4 hover:bg-bg-elevated"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-medium text-text-primary">{rfq.title}</h3>
                      <Badge variant={rfq.status === 'PUBLISHED' ? 'success' : 'default'}>
                        {getStatusBadge(rfq.status)}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-text-secondary">{rfq.description}</p>
                    <div className="mt-2 flex items-center gap-4 text-xs text-text-muted">
                      <span className="flex items-center gap-1">
                        <Clock size={14} />
                        Deadline: {formatDate(rfq.deadline)}
                      </span>
                      <span>{rfq.items.length} items</span>
                      <span>{quotations.filter((q: any) => q.rfqId === rfq.id).length} quotations</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" onClick={() => viewRFQDetails(rfq)}>
                      <Eye size={16} />
                    </Button>
                    {rfq.status === 'DRAFT' && (
                      <Button size="sm" onClick={() => handlePublish(rfq.id)}>
                        <Send size={16} className="mr-2" />
                        Publish
                      </Button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
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

      <Modal isOpen={viewModalOpen} onClose={() => setViewModalOpen(false)} title="RFQ Details" size="lg">
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
                <p className="mt-1 text-sm text-text-primary">{formatDate(selectedRFQ.deadline)}</p>
              </div>
              <div>
                <Label>Status</Label>
                <Badge variant={selectedRFQ.status === 'PUBLISHED' ? 'success' : 'default'}>
                  {getStatusBadge(selectedRFQ.status)}
                </Badge>
              </div>
            </div>
            <div>
              <Label>Items</Label>
              <div className="mt-2 space-y-2">
                {selectedRFQ.items?.map((item: any) => (
                  <div key={item.id} className="rounded-lg border border-border bg-bg-elevated p-3">
                    <p className="text-sm text-text-primary">{item.name}</p>
                    <p className="text-xs text-text-muted">{item.description}</p>
                    <p className="mt-1 text-xs text-text-secondary">
                      Qty: {item.quantity} {item.unit}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </motion.div>
  );
};

export default ProcurementDashboard;
