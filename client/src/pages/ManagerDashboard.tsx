import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckSquare, Clock, X, FileText, Calendar } from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import Label from '../components/ui/Label';
import {
  getQuotations,
  approveQuotation,
  rejectQuotation
} from "../api/quotations";
import { formatCurrency, formatDate, getStatusBadge, getStatusColor } from '../utils/formatters';
import Toast from '../components/ui/Toast';

const ManagerDashboard = () => {
  const [quotations, setQuotations] = useState<any[]>([]);
  const [selectedQuotation, setSelectedQuotation] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [comments, setComments] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    loadQuotations();
  }, []);

  const loadQuotations = async () => {
    try {
      const data = await getQuotations();
      setQuotations(data.filter((q: any) => q.status === 'SUBMITTED' || q.status === 'UNDER_REVIEW'));
    } catch (error) {
      console.error('Error loading quotations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    setActionLoading(true);
    try {
      await approveQuotation(selectedQuotation.id, comments);
      setToast({ message: 'Quotation approved successfully', type: 'success' });
      setModalOpen(false);
      loadQuotations();
    } catch (error: any) {
      setToast({ message: error.response?.data?.error || 'Failed to approve', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    setActionLoading(true);
    try {
      await rejectQuotation(selectedQuotation.id, comments);
      setToast({ message: 'Quotation rejected', type: 'success' });
      setModalOpen(false);
      loadQuotations();
    } catch (error: any) {
      setToast({ message: error.response?.data?.error || 'Failed to reject', type: 'error' });
    } finally {
      setActionLoading(false);
    }
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
          <CardTitle>Pending Approvals</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 skeleton rounded-card" />
              ))}
            </div>
          ) : quotations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CheckSquare size={48} className="mb-4 text-text-muted" />
              <p className="text-text-secondary">No pending approvals</p>
            </div>
          ) : (
            <div className="space-y-4">
              {quotations.map((quotation) => (
                <motion.div
                  key={quotation.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-between rounded-lg border border-border bg-bg-elevated/50 p-4 hover:bg-bg-elevated"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-medium text-text-primary">{quotation.rfq?.title}</h3>
                      <Badge variant={quotation.status === 'UNDER_REVIEW' ? 'warning' : 'default'}>
                        {getStatusBadge(quotation.status)}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-text-secondary">
                      {quotation.vendor?.companyName} • {formatCurrency(Number(quotation.totalAmount))}
                    </p>
                    <div className="mt-2 flex items-center gap-4 text-xs text-text-muted">
                      <span className="flex items-center gap-1">
                        <Clock size={14} />
                        {quotation.deliveryDays} days delivery
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar size={14} />
                        Due: {formatDate(quotation.validUntil)}
                      </span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => {
                      setSelectedQuotation(quotation);
                      setComments('');
                      setModalOpen(true);
                    }}
                  >
                    Review
                  </Button>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Review Quotation"
        size="lg"
      >
        {selectedQuotation && (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>RFQ</Label>
                <p className="mt-1 text-sm text-text-primary">{selectedQuotation.rfq?.title}</p>
              </div>
              <div>
                <Label>Vendor</Label>
                <p className="mt-1 text-sm text-text-primary">{selectedQuotation.vendor?.companyName}</p>
              </div>
              <div>
                <Label>Total Amount</Label>
                <p className="mt-1 text-sm text-text-primary mono">{formatCurrency(Number(selectedQuotation.totalAmount))}</p>
              </div>
              <div>
                <Label>Delivery Days</Label>
                <p className="mt-1 text-sm text-text-primary">{selectedQuotation.deliveryDays} days</p>
              </div>
            </div>

            <div>
              <Label>Items</Label>
              <div className="mt-2 space-y-2">
                {selectedQuotation.items?.map((item: any) => (
                  <div key={item.id} className="flex justify-between rounded-lg bg-bg-elevated p-3 text-sm">
                    <span className="text-text-primary">{item.rfqItemId}</span>
                    <span className="mono text-text-primary">{formatCurrency(Number(item.totalPrice))}</span>
                  </div>
                ))}
              </div>
            </div>

            {selectedQuotation.notes && (
              <div>
                <Label>Vendor Notes</Label>
                <p className="mt-1 text-sm text-text-secondary">{selectedQuotation.notes}</p>
              </div>
            )}

            <div>
              <Label>Comments</Label>
              <Input
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Add your comments..."
              />
            </div>

            <div className="flex gap-3">
              <Button
                variant="danger"
                className="flex-1"
                onClick={handleReject}
                disabled={actionLoading}
              >
                {actionLoading ? 'Processing...' : 'Reject'}
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                onClick={handleApprove}
                disabled={actionLoading}
              >
                {actionLoading ? 'Processing...' : 'Approve'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </motion.div>
  );
};

export default ManagerDashboard;
