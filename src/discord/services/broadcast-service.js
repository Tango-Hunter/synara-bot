/**
 * Title: broadcast-service.js
 * Author: Tango Hunter
 * Date Created: 7/6/26
 * Description: Shared broadcast service.
 * Responsibilities:
 * • Resolve broadcast destinations.
 * • Deliver embeds to configured channels.
 */

const {
    getGuildSetting
} = require("../../core/database/guild-settings-repository");

const {
    logFeature,
    logError
} = require("../../core/logging/logger");

const {
    ERROR_TYPES
} = require("../../core/logging/error-types");


/*
====================================
RESOLVE BROADCAST TARGETS
====================================
*/

async function resolveBroadcastTargets(
    client
) {

    const targets = [];

    for (

        const guild

        of

        client.guilds.cache.values()

    ) {

        try {

            const channelId =
                await getGuildSetting({

                    guildId:
                        guild.id,

                    settingName:
                        "channel_logs"

                });

            if (
                !channelId
            ) {
                continue;
            }

            const channel =
                guild.channels.cache.get(
                    channelId
                );

            if (
                !channel
            ) {
                continue;
            }

            targets.push({

                guildId:
                    guild.id,

                guildName:
                    guild.name,

                channelId,

                channel

            });

        }

        catch (
            error
        ) {

            logError({

                type:
                    ERROR_TYPES.SYSTEM_ERROR,

                source:
                    "broadcast-service",

                message:
                    "Failed to resolve broadcast target.",

                details: {

                    guildId:
                        guild.id,

                    guildName:
                        guild.name,

                    error:
                        error.message

                }
            });
        }
    }

    return {

        totalServers:

            targets.length,

        targets

    };
}

/*
====================================
BROADCAST EMBEDS
====================================
*/

async function broadcastEmbeds({

    embeds,

    targets

}) {

    const results = {

        attempted:

            targets.length,

        successful:

            0,

        failed:

            []

    };

    for (

        const target

        of

        targets

    ) {

        try {

            await target.channel.send({

                embeds

            });

            results.successful++;

        }

        catch (
            error
        ) {

            results.failed.push({

                guildId:
                    target.guildId,

                guildName:
                    target.guildName,

                channelId:
                    target.channelId,

                reason:
                    error.message

            });

            logError({

                type:
                    ERROR_TYPES.SYSTEM_ERROR,

                source:
                    "broadcast-service",

                message:
                    "Broadcast delivery failed.",

                details: {

                    guildId:
                        target.guildId,

                    guildName:
                        target.guildName,

                    channelId:
                        target.channelId,

                        error:
                            error.message

                }
            });
        }
    }

    logFeature({

        category:
            "BROADCAST",

        message:
            "Broadcast completed.",

        details: {

            attempted:
                results.attempted,

            successful:
                results.successful,

            failed:
                results.failed.length

        }
    });

    return results;
}

module.exports = {
    resolveBroadcastTargets,
    broadcastEmbeds
};
