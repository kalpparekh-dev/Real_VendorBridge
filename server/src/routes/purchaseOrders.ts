import { Router } from 'express';
import {
  getPurchaseOrders,
  getPurchaseOrder,
  getPurchaseOrderPDF,
  sendPurchaseOrderEmail,
} from '../controllers/purchaseOrderController';
import { auth } from '../middleware/auth';

const router = Router();

router.get('/', auth, getPurchaseOrders);
router.get('/:id/pdf', auth, getPurchaseOrderPDF);
router.post('/:id/email', auth, sendPurchaseOrderEmail);
router.get('/:id', auth, getPurchaseOrder);

export default router;