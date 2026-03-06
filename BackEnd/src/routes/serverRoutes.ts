import { Router } from 'express';
import { ServerController } from '../controllers/server.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// All server routes require authentication
router.post('/', authMiddleware, ServerController.createServer);

export default router;
