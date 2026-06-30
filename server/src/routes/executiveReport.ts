import { Router } from 'express';
import { downloadExecutiveReportPdf } from '../controllers/executiveReportController';
import { auth, authorize } from '../middleware/auth';

const router = Router();

router.get(
  '/pdf',
  auth,
  authorize('ADMIN', 'FINANCE', 'PROCUREMENT_OFFICER', 'MANAGER'),
  downloadExecutiveReportPdf
);

export default router;