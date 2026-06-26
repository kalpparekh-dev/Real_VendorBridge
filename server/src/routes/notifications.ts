import { Router } from 'express';
import { getNotifications, markAsRead } from '../controllers/notificationController';
import { auth } from '../middleware/auth';

const router = Router();

router.get('/', auth, getNotifications);
router.post('/:id/read', auth, markAsRead);

export default router;
