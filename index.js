/**
 * Title: index.js
 * Author: Tango Hunter
 * Date Created: 5/11/26
 * Date Modified: 5/13/26
 * Description: Discord Bot messaging service.
 */

require('dotenv').config();

const express = require('express');

const { Client, GatewayIntentBits } = require('discord.js');

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
    sendToN8N
} = require('./services/webhook-service');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const app = express();

app.use(express.json());

const PORT = process.env.PORT || 3000;

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

    app.post('/send-message', async (req, res) => {

        try {

            const {
                channelId,
                message
            } = req.body;

            const channel = await client.channels.fetch(channelId);

            if (!channel) {

                return res.status(404).json({
                    error: 'Channel not found'
                });
            }

            await channel.send(message);

            return res.status(200).json({
                success: true
            });

        } catch (error) {

            console.error(error);

            return res.status(500).json({
                error: 'Failed to send message'
            });
        }
    });
});

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

        const aiResponse = await sendToN8N(
            process.env.N8N_WEBHOOK_URL,
            {
                content: message.content,
                author: message.author.username,
                channelId: message.channel.id
            }
        );

        await message.reply(aiResponse);

    } catch (error) {

        console.error(error);

        await message.reply(
            'System interruption detected.'
        );
    }
});

client.login(process.env.DISCORD_TOKEN);

app.listen(PORT, () => {

    console.log(
        `API server running on port ${PORT}`
    );
});
