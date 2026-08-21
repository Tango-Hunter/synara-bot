/**
 * Title: version-update-service.js
 * Author: Tango Hunter
 * Date Created: 7/7/26
 * Date Modified: 7/7/26
 *
 * Description:
 * Checks every guild for SYNARA version updates.
 *
 * If a guild's stored version differs from the
 * current registry version, SYNARA automatically
 * broadcasts the release notes to that guild's
 * configured log channel and updates the guild's
 * stored version after a successful broadcast.
 */

const {
    EmbedBuilder
} = require("discord.js");

const {
    getCurrentVersion,
    renderRelease
} = require("../../discord/utils/registry-renderer");

const {
    resolveBroadcastTargets,
    broadcastEmbeds
} = require("../../discord/services/broadcast-service");

const {
    getGuildSetting,
    setGuildSetting
} = require("../database/guild-settings-repository");

const {
    logFeature,
    logError
} = require("../logging/logger");

const {
    ERROR_TYPES
} = require("../logging/error-types");


/*
====================================
VERSION UPDATE SERVICE
====================================
*/

async function checkVersionUpdates(
    client
) {

    try {

        /*
        ====================================
        CURRENT SYNARA VERSION
        ====================================
        */

        const currentVersion = getCurrentVersion();

        logFeature({

            category:
                "VERSION_UPDATE",

            message:
                "Checking guild versions.",
              
            details: {

                version: currentVersion

            }
        });

        /*
        ====================================
        RESOLVE BROADCAST TARGETS
        ====================================
        */

        const {

            targets

        } = await resolveBroadcastTargets(

            client

        );

        /*
        ====================================
        BUILD GUILD UPDATE TARGETS
        ====================================

        Broadcast targets may include destinations
        that are not Discord guilds, such as the
        global SYNARA Support Server updates channel.

        Only actual guild targets participate in
        guild version synchronization.

        The support server remains a broadcast
        destination but has no guild_settings row.
        */

        const guildTargets =
            targets.filter(

                target =>
                    Boolean(
                        target.guildId
                    )
            );

        const updateTargets = [];

        for (
            const target
            of
            guildTargets
        ) {

            const guildVersion =
                await getGuildSetting({

                    guildId:
                        target.guildId,

                    settingName:
                        "current_version"

                });

            /*
            ====================================
            ALREADY CURRENT
            ====================================
            */

            if (
                guildVersion ===
                currentVersion
            ) {
                continue;
            }


            updateTargets.push(
                target
            );
        }

        /*
        ====================================
        NOTHING TO DO
        ====================================
        */

        if (
            updateTargets.length === 0
        ) {

            logFeature({

                category:
                    "VERSION_UPDATE",

                message:
                    "All guilds already running current version.",

                details: {

                    version:
                        currentVersion

                }
            });

            return;
        }

        /*
        ====================================
        LOAD RELEASE EMBEDS
        ====================================
        */

        let embeds;

        try {

            /*
            ====================================
            NORMAL RELEASE
            ====================================

            Full releases have a registry entry
            and are rendered normally.
            */

            embeds =
                renderRelease(
                    currentVersion
                );
        }

        catch (
            error
        ) {

            /*
            ====================================
            PATCH / UNREGISTERED RELEASE
            ====================================

            Not every version requires a full
            release document.

            Patch releases intentionally use the
            public SYNARA updates page instead
            of Discord release notes.

            A missing registry release is therefore
            NOT an error condition.
            */

            logFeature({

                category:
                    "VERSION_UPDATE",

                message:
                    "No Discord release notes found. Using updates page fallback.",

                details: {

                    version:
                        currentVersion,

                    updatesUrl:
                        "https://tangohunter.com/synara/updates",

                    reason:
                        error.message

                }

            });


            const patchEmbed =
                new EmbedBuilder()

                    .setColor(
                        0x00FF78
                    )

                    .setTitle(
                        `SYNARA ${currentVersion}`
                    )

                    .setDescription(
                        [
                            "SYNARA has been updated.",

                            "",

                            "This update does not include Discord release notes.",

                            "",

                            "View the latest updates and patch notes online:"
                        ].join("\n")
                    )

                    .addFields({

                        name:
                            "Updates",

                        value:
                            "https://tangohunter.com/synara/updates",

                        inline:
                            false

                    })

                    .setFooter({

                        text:
                            "SYNARA • Automated Version Update"

                    })

                    .setTimestamp();


            embeds = [
                patchEmbed
            ];

        }

        /*
        ====================================
        BROADCAST RELEASE
        ====================================

        Only guilds requiring a version update
        are eligible for the version transition.

        The support server is a global broadcast
        destination and must receive the release
        broadcast as well.

        Build the broadcast target list from the
        original resolved targets so the support
        server remains included.
        */

        const broadcastTargets =
            targets.filter(

                target =>

                    updateTargets.includes(
                        target
                    )
                    ||
                    !target.guildId

            );

        const results =
            await broadcastEmbeds({

                embeds,

                targets:
                    broadcastTargets

        });

        /*
        ====================================
        UPDATE SUCCESSFUL GUILDS
        ====================================
        */

        for (

            const guild

            of

            results.successfulGuilds

        ) {

            try {

                await setGuildSetting({

                    guildId:
                        guild.guildId,

                    guildName:
                        guild.guildName,

                    settingName:
                        "current_version",

                    settingValue:
                        currentVersion

                });
            }

            catch (
                error
            ) {

                logError({

                    type:
                        ERROR_TYPES.SYSTEM_ERROR,

                    source:
                        "version-update-service",

                    message:
                        "Failed to update guild version.",

                    details: {

                        guildId:
                            guild.guildId,

                        guildName:
                            guild.guildName,

                        version:
                            currentVersion,

                        error:
                            error.message

                    }
                });
            }
        }

        /*
        ====================================
        COMPLETE
        ====================================
        */

        logFeature({

            category:
                "VERSION_UPDATE",

            message:
                "Version update completed.",

            details: {

                version:
                    currentVersion,

                attempted:
                    results.attempted,

                successful:
                    results.successful,

                failed:
                    results.failed.length,

                updatedGuilds:
                    results.successfulGuilds.length

            }
        });
    }

    catch (
        error
    ) {

        logError({

            type:
                ERROR_TYPES.SYSTEM_ERROR,

            source:
                "version-update-service",

            message:
                "Version update service failed.",

            details: {

                error:
                    error.message,

                stack:
                    error.stack

            }
        });
    }
}

module.exports = {
    checkVersionUpdates
};
