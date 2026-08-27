const express = require('express');
const mineflayer = require('mineflayer');
const app = express();

app.use(express.json());
app.use(express.static('public')); // Serves your website frontend

let activeBots = {};

// API endpoint triggered when you click "Deploy Bot" on the website
app.post('/api/start-bot', (req, res) => {
    const { serverIp, botName } = req.body;

    if (!serverIp) {
        return res.status(400).json({ success: false, message: "Server IP is required!" });
    }

    // Check if a bot is already running for this IP
    if (activeBots[serverIp]) {
        return res.json({ success: true, message: "Bot is already running on this server!" });
    }

    try {
        // Parse IP and port if provided (e.g., localhost:25565)
        let host = serverIp;
        let port = 25565;
        if (serverIp.includes(':')) {
            const parts = serverIp.split(':');
            host = parts[0];
            port = parseInt(parts[1]);
        }

        console.log(`Attempting to spawn bot on ${host}:${port}...`);

        const bot = mineflayer.createBot({
            host: host,
            port: port,
            username: botName || 'ArindamsBot',
            auth: 'offline' // Works for offline/cracked servers
        });

        bot.on('spawn', () => {
            console.log(`[SUCCESS] Arindam's bot spawned on ${serverIp}`);
        });

        // Anti-AFK mechanism: makes the bot jump every 30 seconds so it doesn't get kicked
        const afkInterval = setInterval(() => {
            if (bot && bot.entity) {
                bot.setControlState('jump', true);
                setTimeout(() => bot.setControlState('jump', false), 500);
            }
        }, 30000);

        bot.on('end', (reason) => {
            console.log(`[DISCONNECTED] Bot left ${serverIp}: ${reason}`);
            clearInterval(afkInterval);
            delete activeBots[serverIp];
        });

        bot.on('error', (err) => {
            console.log(`[ERROR] Bot encountered an error: ${err.message}`);
        });

        activeBots[serverIp] = { bot, afkInterval };
        res.json({ success: true, message: `Bot successfully deployed to ${serverIp}!` });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.listen(3000, () => {
    console.log('Web server running! Open http://localhost:3000 in your browser.');
});