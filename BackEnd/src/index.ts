import express, { Request, Response } from 'express';
import { createServer } from 'http';
import dotenv from 'dotenv';
import path from 'path';
import { connectMongo } from './config/mongo';
import { runPocketBaseMigrations } from './config/pb_migrations';
import { initializeSocket } from './config/socket';
import { isAllowedOrigin, normalizeOrigin } from './config/cors';
import messageRoutes from './routes/messageRoutes';
import userRoutes from './routes/userRoutes';
import serverRoutes from './routes/serverRoutes';
import inviteRoutes from './routes/inviteRoutes';

dotenv.config({ path: path.join(__dirname, '../.env') });

const app = express();
const httpServer = createServer(app);
const port = process.env.PORT || 3000;

app.use((req: Request, res: Response, next) => {
    const requestOrigin = req.headers.origin;
    if (isAllowedOrigin(requestOrigin)) {
        const responseOrigin = normalizeOrigin(requestOrigin);
        if (responseOrigin) {
            res.header('Access-Control-Allow-Origin', responseOrigin);
            res.header('Vary', 'Origin');
        }
        res.header('Access-Control-Allow-Credentials', 'true');
    }

    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization');

    if (req.method === 'OPTIONS') {
        if (!isAllowedOrigin(requestOrigin)) {
            return res.sendStatus(403);
        }
        return res.sendStatus(204);
    }

    next();
});

app.use(express.json());

app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', message: 'Eris API is running' });
});

// Connect to MongoDB & Run PocketBase Migrations
if (process.env.NODE_ENV !== 'test') {
    connectMongo();
    runPocketBaseMigrations();
    initializeSocket(httpServer);
}

app.use('/api/messages', messageRoutes);
app.use('/api/users', userRoutes);
app.use('/api/servers', serverRoutes);
app.use('/api/invites', inviteRoutes);

// only listen if not imported (e.g., when testing)
if (require.main === module) {
    httpServer.listen(port, () => {
        console.log(`Server is running on port ${port}`);
        console.log(`Socket.IO is ready for real-time communication`);
    });
}

export default app;
export { httpServer };
