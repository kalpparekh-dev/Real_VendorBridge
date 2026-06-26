import { Router } from 'express';
import {
  getRFQs,
  getRFQ,
  createRFQ,
  updateRFQ,
  publishRFQ,
} from '../controllers/rfqController';
import { auth, authorize } from '../middleware/auth';

const router = Router();

router.get('/', auth, getRFQs);
router.get('/:id', auth, getRFQ);
router.post('/', auth, authorize('ADMIN', 'PROCUREMENT_OFFICER'), createRFQ);
router.put('/:id', auth, authorize('ADMIN', 'PROCUREMENT_OFFICER'), updateRFQ);
router.post('/:id/publish', auth, authorize('ADMIN', 'PROCUREMENT_OFFICER'), publishRFQ);

export default router;
