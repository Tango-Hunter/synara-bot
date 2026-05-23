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
const app = express();

const PORT = process.env.PORT || 3000;

const client = 
    require('./core/config/discord-client');
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

const {
    routeInteraction
} = require('./discord/interactions/interaction-router');

// MOD Application import - see line 48
//const { postModApplication } = require('./discord/setup/post-mod-application');

app.use(express.json());
app.use(
    '/',
    createMessageRoutes(client)
);

// ===============================
// Starts the SYNARA presence within Discord
// ===============================
client.once('clientReady', async () => {

    console.log(`SYNARA online as ${client.user.tag}`);

    // Posts MOD application - see line 32
    //const channel = await client.channels.fetch('1504828980161810442');
    //await postModApplication(channel);

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
// Starts the Interactive Services within Discord
// ===============================
client.on('interactionCreate', async interaction => {

        await routeInteraction(
            interaction
        );
    }
);

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
