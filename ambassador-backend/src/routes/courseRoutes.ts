import { Router } from 'express';
import { verifyToken, grantAccess } from '../middlewares/authMiddleware';
import { courseController } from '../controllers/courseController';

const router = Router();

router.get('/', verifyToken, courseController.list);
router.post('/', verifyToken, grantAccess(['admin', 'coordinador']), courseController.create);
router.post('/:id/redeem', verifyToken, courseController.redeem);

export default router;
