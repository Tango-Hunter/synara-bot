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
        BUILD UPDATE TARGETS
        ====================================
        */

        const updateTargets = [];

        for (

            const target

            of

            targets

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

            embeds =

                renderRelease(

                    currentVersion

                );
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
                    "Failed to render release broadcast.",

                details: {

                    version:
                        currentVersion,

                    error:
                        error.message,

                    stack:
                        error.stack

                }

            });

            /*
            ====================================
            NO RELEASE BROADCAST REQUIRED
            ====================================
            */

            for (

                const guild

                of

                updateTargets

            ) {

                try {

                    await discordLog({

                        guildId:

                            guild.guildId,

                        title:
                            'Minor Version update',

                        category:

                            'Automated Maintenance Notification',
                                
                        details:

                            `Version has updated to: ${currentVersion}. Patch notes may be reviewed at https://tangohunter.com/SYNARA/patch-notes/updates.`,

                        status:
                                
                            'INFO'

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
                            "Failed to synchronize guild version.",

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

            logFeature({

                category:
                    "VERSION_UPDATE",

                message:
                    "No release broadcast found. Synchronizing guild versions only.",

                details: {

                    version:
                        currentVersion,

                    guilds:
                        updateTargets.length

                }
            });

            /*
            ====================================
            UPDATE GUILD VERSIONS
            ====================================
            */

            for (

                const guild

                of

                updateTargets

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
                            "Failed to synchronize guild version.",

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

            return;
        }

        /*
        ====================================
        BROADCAST RELEASE
        ====================================
        */

        const results =

            await broadcastEmbeds({

                embeds,

                targets:

                    updateTargets

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
