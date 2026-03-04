import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { connectMongo } from './config/mongo';
import { runPocketBaseMigrations } from './config/pb_migrations';
import messageRoutes from './routes/messageRoutes';

dotenv.config({ path: path.join(__dirname, '../.env') });

const app = express();
const port = process.env.PORT || 3000;

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

// only listen if not imported (e.g., when testing)
if (require.main === module) {
    app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });
}

export default app;
