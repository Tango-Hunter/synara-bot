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
const createTwitchRoutes =
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
    startActivityScheduler
} = require('./discord/scheduler/activity-scheduler');
const {
    initializeDatabase
} = require('./core/database/init-database');
const {
    initializeTwitchTables
} = require('./core/database/init-twitch-tables');
const {
    initializeActivityTable
} = require('./core/database/init-activity-table');
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
const {
    initializeAllGuildFeatures,
    initializeGuildFeatures
} = require('./core/database/feature-flags-repository');
const {
    initializeAllGuildSettings
} = require('./core/database/guild-settings-repository');
const {
    logFeature,
    logError
} = require('./core/logging/logger');
const {
    ERROR_TYPES
} = require('./core/logging/error-types');

app.use(express.json());
app.use(
    '/',
    createMessageRoutes(client)
);
app.use(
    '/twitch',
    createTwitchRoutes(
        client
    )
);


// ===============================
// Starts the SYNARA presence within Discord
// ===============================
client.once('clientReady', async () => {

    // Databases
    await initializeDatabase();
    await initializeTwitchTables();
    await initializeActivityTable();

    logFeature({

        category:
            'SYSTEM',

        message:
            'SYNARA online',

        details: {

            bot:
                client.user.tag
        }
    });

    // Scheduled Tasks
    startDailyQuestionScheduler();
    startNightlyMessageScheduler();
    startActivityScheduler();

    // Feature Flags and Guild Settings for existing Discord Servers
    await initializeAllGuildFeatures(client);
    await initializeAllGuildSettings(client);

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
            logFeature({

                category:
                    'ONBOARDING',

                message:
                    'New member joined',

                details: {

                    guildId:
                        member.guild.id,

                    userId:
                        member.id,

                    username:
                        member.user.username
                }
            });

        } catch (error) {

            logError({

                type:
                    ERROR_TYPES.ONBOARDING_ERROR,

                source:
                    'guildMemberAdd',

                message:
                    error.message,

                details: {

                    guildId:
                        member.guild.id
                }
            });
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

            logError({

                type:
                    ERROR_TYPES.ONBOARDING_ERROR,

                source:
                    'guildMemberUpdate',

                message:
                    error.message,

                details: {

                    guildId:
                        newMember.guild.id
                }
            });
        }
    }
);

// ===============================
// Initializes feature flags when SYNARA is added to a new server
// ===============================
client.on(
    'guildCreate',

    async guild => {

        await initializeGuildFeatures({

            guildId:
                guild.id,

            guildName:
                guild.name
        });
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

    logFeature({

        category:
            'SYSTEM',

        message:
            'API server started',

        details: {

            port:
                PORT
        }
    });
});
