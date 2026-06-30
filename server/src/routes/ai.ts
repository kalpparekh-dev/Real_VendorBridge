import { Router } from 'express';
import { chatWithAI } from '../controllers/aiController';
import { auth, authorize } from '../middleware/auth';

const router = Router();

router.post(
  '/chat',
  auth,
  authorize('ADMIN', 'FINANCE', 'PROCUREMENT_OFFICER', 'MANAGER'),
  chatWithAI
);

export default router;