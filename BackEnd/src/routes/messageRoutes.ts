import { Router } from 'express';
import { createMessage, getMessagesByRoom } from '../controllers/messageController';

const router = Router();

router.post('/', createMessage);
router.get('/room/:roomId', getMessagesByRoom);

export default router;
