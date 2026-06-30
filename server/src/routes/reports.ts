import { Router } from 'express';
import {
  getSpendByCategory,
  getRFQVolume,
  getVendorPerformance,
} from '../controllers/reportController';
import { auth, authorize } from '../middleware/auth';

const router = Router();

router.get(
  '/spend',
  auth,
  authorize('ADMIN', 'FINANCE', 'PROCUREMENT_OFFICER'),
  getSpendByCategory
);

router.get(
  '/rfq-volume',
  auth,
  authorize('ADMIN', 'PROCUREMENT_OFFICER', 'FINANCE'),
  getRFQVolume
);

router.get(
  '/vendor-performance',
  auth,
  authorize('ADMIN', 'PROCUREMENT_OFFICER', 'FINANCE'),
  getVendorPerformance
);

export default router;