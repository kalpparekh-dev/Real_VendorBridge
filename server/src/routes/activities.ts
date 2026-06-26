import { Router } from 'express';
import { getActivities } from '../controllers/activityController';
import { auth } from '../middleware/auth';

const router = Router();

router.get('/', auth, getActivities);

export default router;
