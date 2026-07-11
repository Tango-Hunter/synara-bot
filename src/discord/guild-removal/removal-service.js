/**
 * Title: removal-service.js
 * Author: Tango Hunter
 * Date Created: 7/11/26
 * Description: Removes all guild-specific data when SYNARA leaves a Discord server.
 */

const {
    deleteGuildBirthdays
} = require("../../core/database/birthday-repository");

const {
    deleteGuildBonks
} = require("../../core/database/bonk-repository");

const {
    deleteGuildMessages
} = require("../../core/database/channel-messages-repository");

const {
    deleteGuildEvents
} = require("../../core/database/discord-event-announcements-repository");

const {
    deleteGuildIgnoredChannels
} = require("../../core/database/ignored-channels-repository");

const {
    deleteGuildFeatures
} = require("../../core/database/feature-flags-repository");

const {
    deleteGuildSettings
} = require("../../core/database/guild-settings-repository");

const {
    deleteGuildScheduledEvents
} = require("../../core/database/scheduled-events-repository");

const {
    removeGuildTwitchAlerts
} = require("../../core/database/twitch-repository");

const {
    logError
} = require("../../core/logging/logger");

const {
    ERROR_TYPES
} = require("../../core/logging/error-types");


/*
====================================
REMOVE GUILD DATA
====================================
*/

async function removeGuildData(
    guild
) {

    try {

        // GUILD SETTINGS
        await deleteGuildSettings(guild.id);

        // FEATURE FLAGS
        await deleteGuildFeatures(guild.id);

        // BIRTHDAYS
        await deleteGuildBirthdays(guild.id);

        // BONKS
        await deleteGuildBonks(guild.id);

        // PERSISTENT MESSAGES
        await deleteGuildMessages(guild.id);

        // DISCORD EVENTS
        await deleteGuildEvents(guild.id);

        // SCHEDULED EVENTS
        await deleteGuildScheduledEvents(guild.id);

        //IGNORED CHANNELS
        await deleteGuildIgnoredChannels(guild.id);

        // TWITCH ALERTS
        await removeGuildTwitchAlerts(guild.id);

    }

    catch (
        error
    ) {

        logError({

            type:
                ERROR_TYPES.DATABASE,

            category:
                "GUILD_REMOVAL",

            message:
                "Failed to remove guild data.",

            details: {

                guildId:
                    guild.id,

                guildName:
                    guild.name

            },

            error

        });

        throw error;

    }
}


module.exports = {
    removeGuildData
};
