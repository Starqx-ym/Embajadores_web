import { Router } from 'express';
import { activityController } from '../controllers/activityController';
import { verifyToken, grantAccess } from '../middlewares/authMiddleware';

const router = Router();

router.get('/', activityController.getAll);
router.post('/', verifyToken, grantAccess(['admin', 'coordinador']), activityController.create);
router.post('/:id/inscribir', verifyToken, activityController.enroll);
router.post('/:id/desinscribir', verifyToken, activityController.unsubscribe);
router.put('/:id', verifyToken, grantAccess(['admin', 'coordinador']), activityController.update);
router.delete('/:id', verifyToken, grantAccess(['admin', 'coordinador']), activityController.delete);
export default router;
