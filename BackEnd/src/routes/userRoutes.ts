import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.get('/', UserController.getUsers);
router.post('/', UserController.createUser);
router.post('/login', UserController.login);
router.get('/me', authMiddleware, UserController.getMe);

export default router;
