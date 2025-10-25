'use strict';

const { networkInterfaces } = require('os');
const express = require('express');
const cors = require('cors');

const app = express();
const port = 3001; // A different port from the frontend

app.use(cors());

app.get('/api/ip', (req, res) => {
    const nets = networkInterfaces();
    const results = Object.create(null); // Or just '{}'

    for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
            // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
            const familyV4Value = typeof net.family === 'string' ? 'IPv4' : 4;
            if (net.family === familyV4Value && !net.internal) {
                if (!results[name]) {
                    results[name] = [];
                }
                results[name].push(net.address);
            }
        }
    }
    
    // Find the first valid IP address to send back
    // Common interface names are 'en0', 'eth0', 'Wi-Fi'
    const interfacePriority = ['en0', 'eth0', 'Wi-Fi'];
    let ipAddress = null;

    for (const iface of interfacePriority) {
        if (results[iface] && results[iface].length > 0) {
            ipAddress = results[iface][0];
            break;
        }
    }

    // Fallback to the first available IP if priority interfaces are not found
    if (!ipAddress) {
        for (const ifaceName in results) {
            if (results[ifaceName] && results[ifaceName].length > 0) {
                ipAddress = results[ifaceName][0];
                break;
            }
        }
    }

    if (ipAddress) {
        res.json({ ip: ipAddress });
    } else {
        res.status(404).json({ error: 'Local IP address not found.' });
    }
});

app.listen(port, () => {
    console.log(`IP server listening at http://localhost:${port}`);
});
