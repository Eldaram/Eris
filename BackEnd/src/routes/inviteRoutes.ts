import { Router } from 'express';
import { InviteController } from '../controllers/invite.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.get('/:code', authMiddleware, InviteController.getInvitePreview);
router.post('/:code/redeem', authMiddleware, InviteController.redeemInvite);

export default router;