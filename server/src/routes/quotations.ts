import { Router } from 'express';
import {
  getQuotations,
  getQuotation,
  createQuotation,
  approveQuotation,
  rejectQuotation,
} from '../controllers/quotationController';
import { auth, authorize } from '../middleware/auth';

const router = Router();

router.get('/', auth, getQuotations);
router.get('/:id', auth, getQuotation);
router.post('/', auth, authorize('VENDOR'), createQuotation);
router.post('/:id/approve', auth, authorize('ADMIN', 'MANAGER'), approveQuotation);
router.post('/:id/reject', auth, authorize('ADMIN', 'MANAGER'), rejectQuotation);

export default router;
