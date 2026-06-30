import { Router } from 'express';
import {
  getInvoices,
  getInvoice,
  getInvoicePDF,
  createInvoice,
  payInvoice,
  sendInvoiceEmail,
} from '../controllers/invoiceController';
import { auth, authorize } from '../middleware/auth';

const router = Router();

router.get('/', auth, getInvoices);
router.get('/:id', auth, getInvoice);
router.get('/:id/pdf', auth, getInvoicePDF);

router.post('/', auth, authorize('VENDOR', 'FINANCE'), createInvoice);
router.post('/:id/pay', auth, authorize('FINANCE'), payInvoice);

// NEW
router.post('/:id/email', auth, sendInvoiceEmail);

export default router;