/**
 * Title: welcome-handler.js
 * Author: Tango Hunter
 * Date Created: 7/8/26
 * Description: Handles the Guild Create event and delegates sending SYNARA's welcome message.
 */

const {
    AuditLogEvent
} = require("discord.js");

const {
    sendWelcomeMessage
} = require("./welcome-service");

const {
    getCurrentVersion
} = require("../utils/registry-renderer");

const {
    setGuildSetting
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
LOG SYNARA INSTALLATION
====================================
*/

async function logGuildInstallation(
    guild
) {

    const MAX_ATTEMPTS = 3;

    const RETRY_DELAY_MS =
        2 * 1000;

    for (
        let attempt = 1;
        attempt <= MAX_ATTEMPTS;
        attempt++
    ) {

        try {

            /*
            ====================================
            FETCH BOT ADD AUDIT LOG
            ====================================
            */
            const auditLogs =
                await guild.fetchAuditLogs({

                    type:
                        AuditLogEvent.BotAdd,

                    limit:
                        10

                });

            /*
            ====================================
            FIND SYNARA'S INSTALLATION
            ====================================
            */
            const installationEntry =
                auditLogs.entries.find(
                    entry => {

                        if (
                            !entry.target
                        ) {
                            return false;
                        }

                        if (
                            entry.target.id !==
                            guild.client.user.id
                        ) {
                            return false;
                        }

                        /*
                        ====================================
                        ONLY ACCEPT RECENT ENTRIES
                        ====================================

                        This prevents us from accidentally
                        attributing an old BotAdd audit entry
                        to a newly processed guildCreate event.
                        */

                        const ageMs =
                            Date.now()
                            -
                            entry.createdTimestamp;


                        return (
                            ageMs >= 0
                            &&
                            ageMs <=
                                5 * 60 * 1000
                        );
                    }
                );

            /*
            ====================================
            INSTALLER FOUND
            ====================================
            */
            if (
                installationEntry
            ) {

                const installer =
                    installationEntry.executor;


                const installedAt =
                    new Date(
                        installationEntry.createdTimestamp
                    );

                logFeature({

                    category:
                        "GUILD_INSTALLATION",

                    message:
                        "SYNARA installed in new Discord server.",

                    details: {

                        /*
                        ====================================
                        SERVER INFORMATION
                        ====================================
                        */
                        guildId:
                            guild.id,

                        guildName:
                            guild.name,

                        guildCreatedAt:
                            guild.createdAt
                                ?.toISOString()
                            ??
                            null,

                        /*
                        ====================================
                        INSTALLER INFORMATION
                        ====================================
                        */
                        installerId:
                            installer?.id
                            ??
                            null,

                        installerUsername:
                            installer?.username
                            ??
                            null,

                        installerGlobalName:
                            installer?.globalName
                            ??
                            null,

                        installerTag:
                            installer?.tag
                            ??
                            installer?.username
                            ??
                            null,

                        /*
                        ====================================
                        INSTALLATION TIMESTAMP
                        ====================================
                        */

                        installedAt:
                            installedAt.toISOString(),

                        installedAtUnix:
                            Math.floor(
                                installationEntry.createdTimestamp
                                /
                                1000
                            ),

                        installedAtLocal:
                            installedAt.toLocaleString(
                                "en-US",
                                {
                                    timeZone:
                                        "America/New_York"
                                }
                            ),

                        /*
                        ====================================
                        SYNARA INFORMATION
                        ====================================
                        */
                        synaraUserId:
                            guild.client.user.id,

                        synaraUsername:
                            guild.client.user.username,

                        synaraTag:
                            guild.client.user.tag,

                        auditLogEntryId:
                            installationEntry.id

                    }
                });

                return true;
            }

            /*
            ====================================
            AUDIT LOG NOT READY
            ====================================
            */
            if (
                attempt <
                MAX_ATTEMPTS
            ) {

                await new Promise(
                    resolve =>
                        setTimeout(
                            resolve,
                            RETRY_DELAY_MS
                        )
                );

                continue;
            }

            /*
            ====================================
            NO INSTALLER FOUND
            ====================================
            */
            logFeature({

                category:
                    "GUILD_INSTALLATION",

                message:
                    "SYNARA joined a new Discord server, but the installer could not be identified from the audit log.",

                details: {

                    guildId:
                        guild.id,

                    guildName:
                        guild.name,

                    attempts:
                        MAX_ATTEMPTS,

                    auditLogType:
                        "BOT_ADD",

                    reason:
                        "The audit log entry was unavailable, too old, or SYNARA does not have permission to view the audit log."

                }
            });

            return false;
        }

        catch (
            error
        ) {

            /*
            ====================================
            RETRYABLE FAILURE
            ====================================
            */
            if (
                attempt <
                MAX_ATTEMPTS
            ) {
                await new Promise(
                    resolve =>
                        setTimeout(
                            resolve,
                            RETRY_DELAY_MS
                        )
                );

                continue;
            }

            /*
            ====================================
            FINAL FAILURE
            ====================================
            */
            logError({

                type:
                    ERROR_TYPES.DISCORD_ERROR,

                source:
                    "welcome-handler",

                message:
                    "Unable to determine who installed SYNARA in the new Discord server.",

                details: {

                    guildId:
                        guild.id,

                    guildName:
                        guild.name,

                    attempts:
                        MAX_ATTEMPTS,

                    error:
                        error.message

                }
            });

            return false;
        }
    }

    return false;
}


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

        /*
        ====================================
        IDENTIFY INSTALLER
        ====================================
        */
        await logGuildInstallation(
            guild
        );

        /*
        ====================================
        INITIALIZE CURRENT VERSION
        ====================================
        */

        await setGuildSetting({

            guildId:
                guild.id,

            guildName:
                guild.name,

            settingName:
                "current_version",

            settingValue:
                getCurrentVersion()

        });

        /*
        ====================================
        SEND WELCOME MESSAGE
        ====================================
        */

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
