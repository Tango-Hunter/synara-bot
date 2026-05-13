/**
 * Title: index.js
 * Author: Tango Hunter
 * Date Created: 5/11/26
 * Date Modified: 5/11/26
 * Description: Discord Bot messaging service.
 */

require('dotenv').config();

const express = require('express');

const { Client, GatewayIntentBits } = require('discord.js');
const axios = require('axios');

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

    // Ignore bots
    if (message.author.bot) return;

    // Only respond if SYNARA is mentioned
    if (!message.mentions.has(client.user)) return;

    try {

        // Send message to n8n
        const response = await axios.post(process.env.N8N_WEBHOOK_URL, {
            content: message.content,
            author: message.author.username,
            channelId: message.channel.id
        });

        // Reply with n8n response
        await message.reply(response.data);

    } catch (error) {

        console.error(error);

        await message.reply(
            "System interruption detected."
        );
    }
});

client.login(process.env.DISCORD_TOKEN);

app.listen(PORT, () => {

    console.log(
        `API server running on port ${PORT}`
    );
});
