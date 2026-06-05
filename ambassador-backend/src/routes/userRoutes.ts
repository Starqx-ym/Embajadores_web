import { Router } from 'express';
import { verifyToken, grantAccess } from '../middlewares/authMiddleware';
import { userController } from '../controllers/userController';

const router = Router();

router.get('/me', verifyToken, userController.me);
router.get('/ranking', verifyToken, userController.ranking);
router.get('/', verifyToken, grantAccess(['admin']), userController.list);
router.put('/:id/role', verifyToken, grantAccess(['admin']), userController.updateRole);
router.post('/:id/points', verifyToken, grantAccess(['admin', 'coordinador']), userController.awardPoints);

export default router;
