import { Router } from 'express';
import { verifyToken } from '../middlewares/authMiddleware';
import { courseController } from '../controllers/courseController';

const router = Router();

router.get('/', verifyToken, courseController.list);
router.post('/:id/redeem', verifyToken, courseController.redeem);

export default router;
