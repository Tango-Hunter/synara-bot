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

const createMessageRoutes =
    require('./discord/routes/messages');
const {
    discordMessageHandler
} = require('./discord/handlers/message-handler');
const {
    startDailyQuestionScheduler
} = require('./discord/scheduler/qotd-scheduler');
const {
    startNightlyMessageScheduler
} = require('./discord/scheduler/motivational-scheduler');

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
// Listens to Allowed Channels for SYNARA mentions
// ===============================
client.once('clientReady', () => {

    console.log(`SYNARA online as ${client.user.tag}`);

    startDailyQuestionScheduler();
    startNightlyMessageScheduler();

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
// Sends SYNARA responses
// ===============================
discordMessageHandler(client);

// ===============================
// Initialization
// ===============================
client.login(process.env.DISCORD_TOKEN);

app.listen(PORT, () => {

    console.log(
        `API server running on port ${PORT}`
    );
});
