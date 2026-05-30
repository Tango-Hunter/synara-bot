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
const twitchRoutes =
    require('./routes/twitch');

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
    initializeDatabase
} = require('./core/database/init-database');
const {
    initializeTwitchTables
} = require('./core/database/init-twitch-tables');
const {
    routeInteraction
} = require('./discord/interactions/interaction-router');
const {
    handleNewMember,
    handleOnboardingInteraction,
    finalizeOnboarding
} = require('./discord/onboarding/onboarding-handler');
const {
    getGuildConfig
} = require('./core/config/guild-config');

app.use(express.json());
app.use(
    '/',
    createMessageRoutes(client)
);
app.use(
    '/twitch',
    twitchRoutes
);


// ===============================
// Starts the SYNARA presence within Discord
// ===============================
client.once('clientReady', async () => {

    await initializeDatabase();
    await initializeTwitchTables();

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
// Starts the Interactive Services within Discord
// ===============================
client.on('interactionCreate', async interaction => {

        await handleOnboardingInteraction(
            interaction
        );

        await routeInteraction(
            interaction
        );

    }
);

// ===============================
// New member joins
// ===============================
client.on(

    'guildMemberAdd',

    async member => {

        try {

            await handleNewMember(
                member
            );
            console.log(`[ONBOARDING] New member detected: ${member.user.tag}`);

        } catch (error) {

            console.error(
                '[ONBOARDING ERROR]',
                error
            );
        }
    }
);

// ===============================
// New member completes onboarding
// ===============================
client.on(

    'guildMemberUpdate',

    async (

        oldMember,
        newMember

    ) => {

        try {

            const guildConfig =

                getGuildConfig(

                    newMember.guild.id
                );

            if (
                !guildConfig
            ) {

                return;
            }

            const hadRole =

                oldMember.roles.cache.has(

                    guildConfig
                        .onboarding
                        .verifiedRoleId
                );

            const hasRole =

                newMember.roles.cache.has(

                    guildConfig
                        .onboarding
                        .verifiedRoleId
                );

            if (
                !hadRole
                &&
                hasRole
            ) {

                await finalizeOnboarding(
                    newMember
                );
            }

        } catch (error) {

            console.error(

                '[ONBOARDING UPDATE ERROR]',

                error
            );
        }
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
