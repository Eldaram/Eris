import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { connectMongo } from './config/mongo';
import { runPocketBaseMigrations } from './config/pb_migrations';
import messageRoutes from './routes/messageRoutes';
import userRoutes from './routes/userRoutes';

dotenv.config({ path: path.join(__dirname, '../.env') });

const app = express();
const port = process.env.PORT || 3000;

const allowedOrigin = process.env.FRONTEND_URL || 'http://localhost:5173';

app.use((req: Request, res: Response, next) => {
    // Allow browser clients from the frontend app to call the API.
    res.header('Access-Control-Allow-Origin', allowedOrigin);
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization');

    if (req.method === 'OPTIONS') {
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
}

app.use('/api/messages', messageRoutes);
app.use('/api/users', userRoutes);

// only listen if not imported (e.g., when testing)
if (require.main === module) {
    app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });
}

export default app;
