/**
 * Title: index.js
 * Author: Tango Hunter
 * Date Created: 5/11/26
 * Date Modified: 5/11/26
 * Description: Discord Bot messaging service.
 */

require('dotenv').config();

const { Client, GatewayIntentBits } = require('discord.js');
const axios = require('axios');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

client.once('ready', () => {
    console.log(`SYNARA online as ${client.user.tag}`);
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
