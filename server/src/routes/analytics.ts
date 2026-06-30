import { Router } from 'express';
import { getExecutiveDashboard } from '../controllers/analyticsController';
import { auth, authorize } from '../middleware/auth';

const router = Router();

router.get(
  '/dashboard',
  auth,
  authorize('ADMIN', 'FINANCE', 'PROCUREMENT_OFFICER', 'MANAGER'),
  getExecutiveDashboard
);

export default router;