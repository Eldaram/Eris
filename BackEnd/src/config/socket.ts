import { Server as HTTPServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import {
  Notification,
  ServerToClientEvents,
  ClientToServerEvents,
  InterServerEvents,
  SocketData,
} from "../types/notifications";
import { isAllowedOrigin } from "./cors";
import prisma from "./prisma";
import { UserService } from "../services/user.service";

let io: SocketIOServer<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
> | null = null;

const socketUserMap = new Map<string, string>();
const userSocketCountMap = new Map<string, number>();

function getTokenFromSocket(socket: any): string | null {
  const authToken = socket.handshake?.auth?.token;
  if (typeof authToken === "string" && authToken.trim()) {
    return authToken;
  }

  const authorizationHeader = socket.handshake?.headers?.authorization;
  if (
    typeof authorizationHeader === "string" &&
    authorizationHeader.startsWith("Bearer ")
  ) {
    const token = authorizationHeader.slice("Bearer ".length).trim();
    if (token) {
      return token;
    }
  }

  return null;
}

async function resolveSocketUserId(socket: any): Promise<string | null> {
  const token = getTokenFromSocket(socket);
  if (!token) {
    return null;
  }

  try {
    const { user } = await UserService.verifyAuthToken(token);
    return user?.id ?? null;
  } catch {
    return null;
  }
}

async function getServerIdsForUser(userId: string): Promise<string[]> {
  const memberships = await prisma.userPerServer.findMany({
    where: { userId },
    select: { serverId: true },
  });

  return memberships.map((membership) => membership.serverId);
}

function markUserConnected(userId: string): boolean {
  const currentCount = userSocketCountMap.get(userId) ?? 0;
  userSocketCountMap.set(userId, currentCount + 1);
  return currentCount === 0;
}

function markUserDisconnected(userId: string): boolean {
  const currentCount = userSocketCountMap.get(userId) ?? 0;
  const nextCount = Math.max(0, currentCount - 1);

  if (nextCount === 0) {
    userSocketCountMap.delete(userId);
  } else {
    userSocketCountMap.set(userId, nextCount);
  }

  return currentCount > 0 && nextCount === 0;
}

function emitPresenceNotifications(
  serverIds: string[],
  userId: string,
  isOnline: boolean,
): void {
  if (!io) {
    return;
  }

  for (const serverId of serverIds) {
    const notification: Notification = {
      type: "server:user-presence-changed",
      timestamp: Date.now(),
      data: {
        serverId,
        userId,
        isOnline,
      },
    };

    io.to(`server:${serverId}`).emit("notification", notification);
  }
}

/**
 * Initialize Socket.IO server
 * @param httpServer - The HTTP server to attach Socket.IO to
 * @returns The initialized Socket.IO server instance
 */
export function initializeSocket(httpServer: HTTPServer): SocketIOServer {
  io = new SocketIOServer<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  >(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (isAllowedOrigin(origin)) {
          callback(null, true);
          return;
        }
        callback(new Error("Not allowed by Socket.IO CORS"));
      },
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // Connection handler
  io.on("connection", (socket: any) => {
    console.log(`Client connected: ${socket.id}`);
    const s = socket as any;

    (async () => {
      const userId = await resolveSocketUserId(s);

      if (!userId || !s.connected) {
        return;
      }

      s.data.userId = userId;
      socketUserMap.set(socket.id, userId);
      s.join(`user:${userId}`);

      try {
        const becameOnline = markUserConnected(userId);
        if (!becameOnline) {
          return;
        }

        const serverIds = await getServerIdsForUser(userId);
        emitPresenceNotifications(serverIds, userId, true);
      } catch (error) {
        console.error(
          `[Socket] Failed to process user connect presence for ${userId}:`,
          error,
        );
      }
    })();

    // Handle ping event
    s.on("ping", () => {
      console.log(`Ping received from ${socket.id}`);
    });

    // Handle joining rooms
    s.on("join", (data: { room: string }) => {
      if (data?.room) {
        s.join(data.room);
        console.log(`[Socket] Client ${socket.id} joined room: ${data.room}`);
      }
    });

    // Handle leaving rooms
    s.on("leave", (data: { room: string }) => {
      if (data?.room) {
        s.leave(data.room);
        console.log(`[Socket] Client ${socket.id} left room: ${data.room}`);
      }
    });

    // Handle disconnection
    s.on("disconnect", (reason: any) => {
      console.log(`Client disconnected: ${socket.id}, reason: ${reason}`);

      const userId = socketUserMap.get(socket.id) || s.data?.userId;
      socketUserMap.delete(socket.id);

      if (!userId) {
        return;
      }

      const becameOffline = markUserDisconnected(userId);
      if (!becameOffline) {
        return;
      }

      getServerIdsForUser(userId)
        .then((serverIds) => {
          emitPresenceNotifications(serverIds, userId, false);
        })
        .catch((error) => {
          console.error(
            `[Socket] Failed to process user disconnect presence for ${userId}:`,
            error,
          );
        });
    });
  });

  console.log("Socket.IO server initialized");
  return io;
}

/**
 * Get the Socket.IO server instance
 * Throws an error if the server hasn't been initialized
 */
export function getSocketIO(): SocketIOServer {
  if (!io) {
    throw new Error(
      "Socket.IO has not been initialized. Call initializeSocket() first.",
    );
  }
  return io;
}

/**
 * Close the Socket.IO server
 */
export function closeSocket(): Promise<void> {
  return new Promise((resolve) => {
    if (io) {
      io.close(() => {
        io = null;
        socketUserMap.clear();
        userSocketCountMap.clear();
        resolve();
      });
    } else {
      socketUserMap.clear();
      userSocketCountMap.clear();
      resolve();
    }
  });
}

export function isUserOnline(userId: string): boolean {
  return (userSocketCountMap.get(userId) ?? 0) > 0;
}

export default { initializeSocket, getSocketIO, closeSocket };
