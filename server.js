'use strict';

const { networkInterfaces } = require('os');
const express = require('express');
const cors = require('cors');
const http = require('http');
const { WebSocketServer } = require('ws');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 3001;

// --- In-memory store for paste items ---
let items = [];

// --- CORS and Static File Serving ---
app.use(cors());
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}
app.use('/uploads', express.static(uploadsDir));

// --- Helper to get local IP for logging purposes ---
const getLocalIp = () => {
    const nets = networkInterfaces();
    for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
            const familyV4Value = typeof net.family === 'string' ? 'IPv4' : 4;
            if (net.family === familyV4Value && !net.internal) {
                return net.address;
            }
        }
    }
    return 'localhost';
};
const serverIp = getLocalIp();

// --- File Uploads with Multer ---
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
        cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});
const upload = multer({ storage: storage });

app.post('/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }
    // Use the server's network IP to construct a URL accessible from other devices
    const fileUrl = `http://${serverIp}:${port}/uploads/${req.file.filename}`;
    res.json({ downloadUrl: fileUrl });
});

// --- HTTP Server Setup ---
const server = http.createServer(app);

// --- WebSocket Server Setup ---
const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
    console.log('Client connected');

    // Send initial list of items to the newly connected client
    ws.send(JSON.stringify({ type: 'INIT', payload: items }));

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            if (data.type === 'ADD_ITEM') {
                const newItem = data.payload;
                items.unshift(newItem); // Add to the beginning of the array
                // Broadcast the new item to all connected clients
                wss.clients.forEach((client) => {
                    if (client.readyState === 1) { // WebSocket.OPEN
                        client.send(JSON.stringify({ type: 'ADD_ITEM', payload: newItem }));
                    }
                });
            } else if (data.type === 'DELETE_ITEM') {
                const { id, downloadUrl } = data.payload;
                const initialLength = items.length;

                // Delete file from filesystem if it exists
                if (downloadUrl) {
                    try {
                        const filename = path.basename(downloadUrl);
                        const filePath = path.join(uploadsDir, filename);
                        if (fs.existsSync(filePath)) {
                            fs.unlinkSync(filePath);
                            console.log(`Deleted file: ${filePath}`);
                        }
                    } catch (e) {
                        console.error(`Failed to delete file for item ${id} from URL ${downloadUrl}:`, e);
                    }
                }
                
                // Remove item from in-memory store
                items = items.filter(item => item.id !== id);
                
                // If an item was actually deleted, broadcast the update
                if (items.length < initialLength) {
                    console.log(`Deleted item with id: ${id}`);
                    wss.clients.forEach((client) => {
                        if (client.readyState === 1) { // WebSocket.OPEN
                            client.send(JSON.stringify({ type: 'DELETE_ITEM', payload: { id } }));
                        }
                    });
                }
            }
        } catch (e) {
            console.error('Failed to parse message or invalid message format:', e);
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected');
    });

    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });
});

server.listen(port, '0.0.0.0', () => {
    console.log(`Server with WebSocket listening at http://${serverIp}:${port}`);
});