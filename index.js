/**
 * Title: index.js
 * Author: Tango Hunter
 * Date Created: 5/11/26
 * Date Modified: 5/15/26
 * Description: Discord Bot messaging service.
 */

// ===============================
// Creates server requirements
// ===============================
require('dotenv').config();
const express = require('express');
const { Client, GatewayIntentBits } = require('discord.js');

// ===============================
// Imported variables from compartmentalized files
// ===============================
const {
    cooldownSeconds,
    allowedChannels
} = require('./config/settings');
const {
    isOnCooldown
} = require('./utils/cooldowns');
const {
    shouldIgnoreMessage
} = require('./utils/self-protection');
const {
    isAllowedChannel
} = require('./utils/allowed-channels');
const {
    sanitizeMessage
} = require('./utils/sanitize-message');
const {
    splitIntoChunks
} = require('./utils/response-manager');
const {
    logError
} = require('./utils/logger');
const {
    sendToN8N
} = require('./services/webhook-service');
const createMessageRoutes = require('./routes/messages');

// ===============================
// Establishes server requirements
// ===============================
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});
const app = express();
app.use(express.json());
app.use(
    '/',
    createMessageRoutes(client)
);
const PORT = process.env.PORT || 3000;

// ===============================
// Listens to Allowed Channels for @SYNARA mentions
// ===============================
client.once('clientReady', () => {

    console.log(`SYNARA online as ${client.user.tag}`);

    client.user.setPresence({
        activities: [
          {
            name: 'over the network',
            type: 3
          }
        ],
        status: 'online'
    });
});

// ===============================
// Sends Reply to @SYNARA mentions
// ===============================
client.on('messageCreate', async (message) => {

    // Self-protection
    if (shouldIgnoreMessage(message, client)) {
        return;
    }

    // Allowed channels only
    if (!isAllowedChannel(
        message.channel.id,
        allowedChannels
    )) {
        return;
    }

    // Must mention SYNARA
    if (!message.mentions.has(client.user)) {
        return;
    }

    // Cooldown protection
    if (isOnCooldown(
        message.author.id,
        cooldownSeconds
    )) {

        await message.reply(
            'Request cooldown active.'
        );

        return;
    }

    try {

        const cleanedMessage = sanitizeMessage(
            message.content,
            client
        );

        let aiResponse = await sendToN8N(
            process.env.N8N_WEBHOOK_URL,
            {
                content: cleanedMessage,
                author: message.author.username,
                channelId: message.channel.id
            }
        );

        if (!aiResponse || !aiResponse.trim()) {

            aiResponse = 'Signal clarity insufficient.';
        }

        const responseChunks =
            splitIntoChunks(aiResponse);

        for (let i = 0; i < responseChunks.length; i++) {

            const chunk = responseChunks[i];

            // Add sequence indicator if multiple chunks
            const formattedChunk =
                responseChunks.length > 1
                    ? `[${i + 1}/${responseChunks.length}]\n\n${chunk}`
                    : chunk;

            await message.reply(formattedChunk);

            // Small delay for natural pacing
            if (i < responseChunks.length - 1) {

                await new Promise(resolve =>
                    setTimeout(resolve, 1200)
                );
            }
        }

    } catch (error) {

        logError(
            'SYNARA ERROR',
            {
                user: message.author.username,
                channel: message.channel.id,
                error: error.message
            }
        );

        await message.reply(
            'System interruption detected.'
        );
    }
});

// ===============================
// Initialization
// ===============================
client.login(process.env.DISCORD_TOKEN);

app.listen(PORT, () => {

    console.log(
        `API server running on port ${PORT}`
    );
});
