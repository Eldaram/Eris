import { Router } from 'express';
import { ServerController } from '../controllers/server.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// All server routes require authentication
router.post('/', authMiddleware, ServerController.createServer);
router.get('/', authMiddleware, ServerController.listServers);
router.get('/:serverId/channels', authMiddleware, ServerController.getChannels);
router.post('/:serverId/invites', authMiddleware, ServerController.createInvite);

export default router;
