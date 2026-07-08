/**
 * Title: welcome-handler.js
 * Author: Tango Hunter
 * Date Created: 7/8/26
 * Description: Handles the Guild Create event and delegates sending SYNARA's welcome message.
 */

const {
    sendWelcomeMessage
} = require("./welcome-service");

const {
    logFeature,
    logError
} = require("../../core/logging/logger");

const {
    ERROR_TYPES
} = require("../../core/logging/error-types");


/*
====================================
WELCOME HANDLER
====================================
*/

async function handleGuildCreate(
    guild
) {

    try {

        logFeature({

            category:
                "WELCOME",

            message:
                "Joined new guild.",

            details: {

                guildId:
                    guild.id,

                guildName:
                    guild.name

            }
        });

        await sendWelcomeMessage(

            guild

        );
    }

    catch (
        error
    ) {

        logError({

            type:
                ERROR_TYPES.DISCORD_ERROR,

            source:
                "welcome-handler",

            message:
                error.message,

            details: {

                guildId:
                    guild.id,

                guildName:
                    guild.name

            }
        });
    }
}

module.exports = {
    handleGuildCreate
};
