import { Router } from 'express';
import {
  getSpendByCategory,
  getRFQVolume,
  getVendorPerformance,
} from '../controllers/reportController';
import { auth, authorize } from '../middleware/auth';

const router = Router();

router.get('/spend', auth, authorize('ADMIN', 'FINANCE'), getSpendByCategory);
router.get('/rfq-volume', auth, authorize('ADMIN', 'PROCUREMENT_OFFICER'), getRFQVolume);
router.get('/vendor-performance', auth, authorize('ADMIN', 'PROCUREMENT_OFFICER'), getVendorPerformance);

export default router;
