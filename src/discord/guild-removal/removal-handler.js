/**
 * Title: removal-handler.js
 * Author: Tango Hunter
 * Date Created: 7/11/26
 * Description: Removes all guild-specific data when SYNARA leaves a Discord server.
 */

const {
    removeGuildData
} = require("./removal-service");

const {
    logFeature
} = require("../../core/logging/logger");


async function handleGuildRemoval(
    guild
) {

    logFeature({

        category:
            "GUILD_REMOVAL",

        message:
            "Beginning guild data removal.",

        details: {

            guildId:
                guild.id,

            guildName:
                guild.name

        }
    });

    await removeGuildData(guild);

    logFeature({

        category:
            "GUILD_REMOVAL",

        message:
            "Guild data removal completed.",

        details: {

            guildId:
                guild.id,

            guildName:
                guild.name

        }
    });

}

module.exports = {
    handleGuildRemoval
};
