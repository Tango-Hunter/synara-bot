/**
 * Title: welcome-service.js
 * Author: Tango Hunter
 * Date Created: 7/8/26
 * Description: Sends SYNARA's welcome message when the bot joins a new Discord server.
 */

const {
    findWelcomeChannel
} = require("./welcome-channel");

const {
    renderDocument
} = require("../utils/registry-renderer");

const {
    logFeature,
    logError
} = require("../../core/logging/logger");

const {
    ERROR_TYPES
} = require("../../core/logging/error-types");

/*
====================================
WELCOME SERVICE
====================================
*/

async function sendWelcomeMessage(
    guild
) {

    try {

        /*
        ====================================
        FIND CHANNEL
        ====================================
        */

        const channel =
            findWelcomeChannel(

                guild

            );

        if (
            !channel
        ) {

            logFeature({

                category:
                    "WELCOME",

                message:
                    "No suitable welcome channel found.",

                details: {

                    guildId:
                        guild.id,

                    guildName:
                        guild.name

                }
            });

            return false;
        }

        /*
        ====================================
        RENDER DOCUMENT
        ====================================
        */

        const {
            embed
        } = renderDocument(
            "welcome"
        );

        /*
        ====================================
        SEND MESSAGE
        ====================================
        */

        await channel.send({

            embeds: [
                embed
            ]
        });

        logFeature({

            category:
                "WELCOME",

            message:
                "Welcome message sent.",

            details: {

                guildId:
                    guild.id,

                guildName:
                    guild.name,

                channelId:
                    channel.id,

                channelName:
                    channel.name

            }
        });

        return true;
    }

    catch (
        error
    ) {

        logError({

            type:
                ERROR_TYPES.DISCORD_ERROR,

            source:
                "welcome-service",

            message:
                error.message,

            details: {

                guildId:
                    guild.id,

                guildName:
                    guild.name

            }
        });

        return false;
    }
}

module.exports = {
    sendWelcomeMessage
};
