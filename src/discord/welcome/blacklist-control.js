/**
 * Title: blacklist-control.js
 * Author: Tango Hunter
 * Date Created: 8/25/26
 * Description: Controls SYNARA's access to Discord guilds based on the installer and guild blacklist.
 *
 * IMPORTANT:
 *
 * This control runs BEFORE guild feature flags, guild settings,
 * welcome messages, or any other guild initialization occurs.
 *
 * If either the guild or the installer is blacklisted, SYNARA
 * leaves the guild immediately and the normal guildCreate workflow
 * is stopped.
 */

const {
    AuditLogEvent
} = require("discord.js");

const {
    isUserBlacklisted,
    isGuildBlacklisted
} = require("../../core/database/blacklisted-installers-repository");

const {
    logFeature,
    logError
} = require("../../core/logging/logger");

const {
    ERROR_TYPES
} = require("../../core/logging/error-types");


/*
====================================
CONSTANTS
====================================
*/

const MAX_INSTALLER_LOOKUP_ATTEMPTS =
    3;

const INSTALLER_LOOKUP_RETRY_DELAY_MS =
    2 * 1000;

const INSTALLER_AUDIT_LOG_MAX_AGE_MS =
    5 * 60 * 1000;


/*
====================================
WAIT HELPER
====================================
*/

function wait(
    milliseconds
) {

    return new Promise(
        resolve =>
            setTimeout(
                resolve,
                milliseconds
            )
    );
}


/*
====================================
FIND SYNARA INSTALLER
====================================
*/

/**
 * Attempts to identify the Discord user who
 * installed SYNARA into the guild.
 *
 * The audit log may not be immediately available
 * when guildCreate fires, so this function performs
 * several short retries.
 *
 * @param {Guild} guild
 * @returns {Promise<User|null>}
 */
async function findGuildInstaller(
    guild
) {

    for (
        let attempt = 1;
        attempt <=
        MAX_INSTALLER_LOOKUP_ATTEMPTS;
        attempt++
    ) {

        try {

            const auditLogs =
                await guild.fetchAuditLogs({

                    type:
                        AuditLogEvent.BotAdd,

                    limit:
                        10

                });

            const installationEntry =
                auditLogs.entries.find(
                    entry => {

                        /*
                        ====================================
                        VERIFY TARGET
                        ====================================
                        */
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
                        VERIFY RECENCY
                        ====================================

                        This prevents an old BOT_ADD entry
                        from being incorrectly associated
                        with the current guildCreate event.
                        */
                        const ageMs =
                            Date.now()
                            -
                            entry.createdTimestamp;


                        return (

                            ageMs >= 0

                            &&

                            ageMs <=
                            INSTALLER_AUDIT_LOG_MAX_AGE_MS

                        );
                    }
                );

            if (
                installationEntry
            ) {
                return (
                    installationEntry.executor
                    ??
                    null
                );
            }

            /*
            ====================================
            RETRY
            ====================================
            */
            if (
                attempt <
                MAX_INSTALLER_LOOKUP_ATTEMPTS
            ) {
                await wait(
                    INSTALLER_LOOKUP_RETRY_DELAY_MS
                );
            }
        }

        catch (
            error
        ) {

            /*
            ====================================
            RETRY AFTER AUDIT LOG ERROR
            ====================================
            */
            if (
                attempt <
                MAX_INSTALLER_LOOKUP_ATTEMPTS
            ) {
                await wait(
                    INSTALLER_LOOKUP_RETRY_DELAY_MS
                );

                continue;
            }

            /*
            ====================================
            FINAL LOOKUP FAILURE
            ====================================
            */
            logError({

                type:
                    ERROR_TYPES.DISCORD_ERROR,

                source:
                    "blacklist-control",

                message:
                    "Unable to determine the SYNARA installer from the Discord audit log.",

                details: {

                    guildId:
                        guild.id,

                    guildName:
                        guild.name,

                    attempts:
                        MAX_INSTALLER_LOOKUP_ATTEMPTS,

                    error:
                        error.message

                }
            });
        }
    }

    return null;
}


/*
====================================
BLACKLIST CONTROL
====================================
*/

/**
 * Determines whether SYNARA is allowed to
 * remain in a newly joined guild.
 *
 * This function MUST be called before any
 * guild initialization takes place.
 *
 * @param {Guild} guild
 * @returns {Promise<boolean>}
 *
 * true  = SYNARA may continue onboarding
 * false = SYNARA must stop onboarding
 */
async function enforceBlacklistControl(
    guild
) {

    try {

        /*
        ====================================
        CHECK GUILD BLACKLIST FIRST
        ====================================
        */
        const guildBlacklisted =
            await isGuildBlacklisted(
                guild.id
            );

        if (
            guildBlacklisted
        ) {

            logFeature({

                category:
                    "INSTALLER_BLACKLIST",

                message:
                    "Blacklisted guild detected. SYNARA will leave the server before guild initialization.",

                details: {

                    guildId:
                        guild.id,

                    guildName:
                        guild.name,

                    blacklistType:
                        "guild",

                    action:
                        "leave_guild"

                }
            });

            /*
            ====================================
            LEAVE GUILD
            ====================================

            No feature flags, guild settings,
            welcome messages, or other guild
            initialization should occur before
            this point.
            */

            await guild.leave();

            logFeature({

                category:
                    "INSTALLER_BLACKLIST",

                message:
                    "SYNARA left blacklisted guild.",

                details: {

                    guildId:
                        guild.id,

                    guildName:
                        guild.name,

                    blacklistType:
                        "guild"

                }
            });

            return false;
        }

        /*
        ====================================
        IDENTIFY INSTALLER
        ====================================
        */
        const installer =
            await findGuildInstaller(
                guild
            );

        /*
        ====================================
        INSTALLER COULD NOT BE IDENTIFIED
        ====================================
        */

        if (
            !installer
        ) {

            /*
            ====================================
            FAIL OPEN
            ====================================

            If Discord does not provide the
            audit-log information, do NOT
            automatically remove SYNARA from
            a legitimate server.

            The guild itself has already been
            checked above, so only the user
            blacklist check is unavailable.
            */

            logFeature({

                category:
                    "INSTALLER_BLACKLIST",

                message:
                    "SYNARA installer could not be identified. Continuing guild initialization because the guild itself is not blacklisted.",

                details: {

                    guildId:
                        guild.id,

                    guildName:
                        guild.name,

                    installerId:
                        null,

                    installerUsername:
                        null,

                    action:
                        "continue",

                    reason:
                        "Discord audit-log information was unavailable."

                }
            });

            return true;
        }

        /*
        ====================================
        CHECK INSTALLER BLACKLIST
        ====================================
        */
        const userBlacklisted =
            await isUserBlacklisted(
                installer.id
            );

        if (
            userBlacklisted
        ) {
            logFeature({

                category:
                    "INSTALLER_BLACKLIST",

                message:
                    "Blacklisted installer detected. SYNARA will leave the server before guild initialization.",

                details: {

                    guildId:
                        guild.id,

                    guildName:
                        guild.name,

                    installerId:
                        installer.id,

                    installerUsername:
                        installer.username,

                    installerGlobalName:
                        installer.globalName
                        ??
                        null,

                    blacklistType:
                        "user",

                    action:
                        "leave_guild"

                }
            });

            /*
            ====================================
            LEAVE GUILD
            ====================================
            */
            await guild.leave();

            logFeature({

                category:
                    "INSTALLER_BLACKLIST",

                message:
                    "SYNARA left guild because the installer is blacklisted.",

                details: {

                    guildId:
                        guild.id,

                    guildName:
                        guild.name,

                    installerId:
                        installer.id,

                    installerUsername:
                        installer.username,

                    blacklistType:
                        "user"

                }
            });

            return false;
        }

        /*
        ====================================
        CLEAR
        ====================================
        */
        logFeature({

            category:
                "INSTALLER_BLACKLIST",

            message:
                "Blacklist control passed. SYNARA may continue guild initialization.",

            details: {

                guildId:
                    guild.id,

                guildName:
                    guild.name,

                installerId:
                    installer.id,

                installerUsername:
                    installer.username,

                installerGlobalName:
                    installer.globalName
                    ??
                    null

            }
        });

        return true;
    }

    catch (
        error
    ) {

        /*
        ====================================
        BLACKLIST CONTROL FAILURE
        ====================================
        */
        logError({

            type:
                ERROR_TYPES.DISCORD_ERROR,

            source:
                "blacklist-control",

            message:
                "Blacklist control failed before guild initialization.",

            details: {

                guildId:
                    guild.id,

                guildName:
                    guild.name,

                error:
                    error.message,

                stack:
                    error.stack

            }
        });

        /*
        ====================================
        FAIL CLOSED
        ====================================

        This is intentionally different from
        an unavailable audit log.

        If the blacklist database itself
        cannot be checked, we do NOT want to
        initialize a potentially prohibited
        guild.

        SYNARA leaves the guild and prevents
        all normal guild initialization.
        */

        try {

            await guild.leave();

            logFeature({

                category:
                    "INSTALLER_BLACKLIST",

                message:
                    "SYNARA left guild because blacklist enforcement could not be completed.",

                details: {

                    guildId:
                        guild.id,

                    guildName:
                        guild.name,

                    action:
                        "leave_guild",

                    reason:
                        "Blacklist control encountered an error."

                }
            });
        }

        catch (
            leaveError
        ) {
            logError({

                type:
                    ERROR_TYPES.DISCORD_ERROR,

                source:
                    "blacklist-control",

                message:
                    "SYNARA could not leave guild after blacklist control failed.",

                details: {

                    guildId:
                        guild.id,

                    guildName:
                        guild.name,

                    originalError:
                        error.message,

                    leaveError:
                        leaveError.message

                }
            });
        }

        return false;
    }
}


/*
====================================
EXPORTS
====================================
*/

module.exports = {
    enforceBlacklistControl
};
