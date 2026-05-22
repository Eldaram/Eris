import { Router } from "express";
import { ServerController } from "../controllers/server.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

// All server routes require authentication
router.post("/", authMiddleware, ServerController.createServer);
router.get("/", authMiddleware, ServerController.listServers);
router.get("/:serverId/channels", authMiddleware, ServerController.getChannels);
router.get("/:serverId/users", authMiddleware, ServerController.getUsers);
router.get(
  "/:serverId/ownership",
  authMiddleware,
  ServerController.getOwnership,
);
router.post("/:serverId/rooms", authMiddleware, ServerController.createRoom);
router.post(
  "/:serverId/invites",
  authMiddleware,
  ServerController.createInvite,
);

export default router;
