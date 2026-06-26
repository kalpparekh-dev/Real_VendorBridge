import { Router } from 'express';
import { getPurchaseOrders, getPurchaseOrder } from '../controllers/purchaseOrderController';
import { auth } from '../middleware/auth';

const router = Router();

router.get('/', auth, getPurchaseOrders);
router.get('/:id', auth, getPurchaseOrder);

export default router;
