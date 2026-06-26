import { Router } from 'express';
import {
  getInvoices,
  getInvoice,
  createInvoice,
  payInvoice,
} from '../controllers/invoiceController';
import { auth, authorize } from '../middleware/auth';

const router = Router();

router.get('/', auth, getInvoices);
router.get('/:id', auth, getInvoice);
router.post('/', auth, authorize('VENDOR', 'FINANCE'), createInvoice);
router.post('/:id/pay', auth, authorize('FINANCE'), payInvoice);

export default router;
