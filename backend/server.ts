import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new SocketIOServer(server, { cors: { origin: '*' } });

type User = { id: string; username: string };
type Server = { id: string; name: string; memberIds: string[] };
type Channel = { id: string; name: string; serverId: string };
type Message = { id: string; content: string; userId: string; channelId: string; createdAt: number };

const db = {
    users: [] as User[],
    servers: [] as Server[],
    channels: [] as Channel[],
    messages: [] as Message[]
};

// Seed initial data
const initialServerId = uuidv4();
db.servers.push({ id: initialServerId, name: 'Olympus', memberIds: [] });
db.channels.push({ id: uuidv4(), name: 'general', serverId: initialServerId });

// API ROUTES
app.post('/api/login', (req, res) => {
    const { username } = req.body;
    if (!username) { res.status(400).json({ error: 'Username required' }); return; }

    let user = db.users.find(u => u.username === username);
    if (!user) {
        user = { id: uuidv4(), username };
        db.users.push(user);
        // Auto-join existing servers for the MVP
        db.servers.forEach(s => s.memberIds.push(user!.id));
    }
    res.json(user);
});

app.get('/api/users/:userId/servers', (req, res) => {
    const { userId } = req.params;
    const userServers = db.servers
        .filter(s => s.memberIds.includes(userId))
        .map(s => {
            const serverChannels = db.channels.filter(c => c.serverId === s.id);
            return { ...s, channels: serverChannels };
        });
    res.json(userServers);
});

app.post('/api/servers', (req, res) => {
    const { name, userId } = req.body;
    if (!name || !userId) { res.status(400).json({ error: 'Name and userId required' }); return; }

    const serverId = uuidv4();
    const newServer: Server = { id: serverId, name, memberIds: db.users.map(u => u.id) };
    db.servers.push(newServer);

    const newChannel: Channel = { id: uuidv4(), name: 'general', serverId };
    db.channels.push(newChannel);

    const serverWithChannels = { ...newServer, channels: [newChannel] };
    io.emit('server_created', serverWithChannels);
    res.json(serverWithChannels);
});

app.post('/api/servers/:serverId/channels', (req, res) => {
    const { serverId } = req.params;
    const { name } = req.body;
    if (!name) { res.status(400).json({ error: 'Name required' }); return; }

    const channel: Channel = { id: uuidv4(), name, serverId };
    db.channels.push(channel);
    io.emit('channel_created', channel);
    res.json(channel);
});

app.get('/api/channels/:channelId/messages', (req, res) => {
    const { channelId } = req.params;
    const channelMessages = db.messages
        .filter(m => m.channelId === channelId)
        .sort((a, b) => a.createdAt - b.createdAt)
        .map(m => {
            const user = db.users.find(u => u.id === m.userId);
            return { ...m, user: { id: user?.id, username: user?.username } };
        });
    res.json(channelMessages);
});

// WEBSOCKETS
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join_channel', (channelId) => {
        socket.join(channelId);
    });

    socket.on('send_message', (data) => {
        const { content, userId, channelId } = data;
        const msg: Message = { id: uuidv4(), content, userId, channelId, createdAt: Date.now() };
        db.messages.push(msg);

        const user = db.users.find(u => u.id === userId);
        const formattedMessage = { ...msg, user: { id: user?.id, username: user?.username } };

        io.to(channelId).emit('new_message', formattedMessage);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

const PORT = 4000;
server.listen(PORT, () => {
    console.log(`API and WebSocket Server running on http://localhost:${PORT}`);
});
