import { Router } from 'express';
import {
  getVendors,
  getVendor,
  createVendor,
  updateVendor,
  deleteVendor,
} from '../controllers/vendorController';
import { auth, authorize } from '../middleware/auth';

const router = Router();

router.get('/', auth, getVendors);
router.get('/:id', auth, getVendor);
router.post('/', auth, authorize('ADMIN'), createVendor);
router.put('/:id', auth, authorize('ADMIN'), updateVendor);
router.delete('/:id', auth, authorize('ADMIN'), deleteVendor);

export default router;
