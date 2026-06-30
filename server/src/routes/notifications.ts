import { Router } from 'express';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from '../controllers/notificationController';
import { auth } from '../middleware/auth';

const router = Router();

router.get('/', auth, getNotifications);
router.post('/:id/read', auth, markAsRead);
router.post('/read-all', auth, markAllAsRead);
router.delete('/:id', auth, deleteNotification);

export default router;
