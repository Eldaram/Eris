import { Router } from 'express';
import { createMessage, getMessagesByRoom } from '../controllers/messageController';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Protect all message routes with authentication
router.post('/', authMiddleware, createMessage);
router.get('/room/:roomId', authMiddleware, getMessagesByRoom);

export default router;
