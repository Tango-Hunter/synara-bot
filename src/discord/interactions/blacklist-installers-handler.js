/**
 * Title: blacklist-installers-handler.js
 * Author: Tango Hunter
 * Date Created: 8/25/26
 * Description: Handles the interaction workflow for the installer blacklist command.
 */

const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    MessageFlags
} = require('discord.js');

const {
    getBlacklistedEntries,
    createBlacklistEntry,
    removeBlacklistEntry
} = require('../../core/database/blacklisted-installers-repository');


const {
    logFeature,
    logError
} = require('../../core/logging/logger');

const {
    ERROR_TYPES
} = require('../../core/logging/error-types');


/*
====================================
INTERACTION IDS
====================================
*/

/*
 * These IDs must remain synchronized with
 * installerblacklist.js.
 */

const INSTALLER_BLACKLIST_ADD_MODAL =
    'installerblacklist:add:modal';

const INSTALLER_BLACKLIST_REMOVE_SELECT =
    'installerblacklist:remove:select';

const INSTALLER_BLACKLIST_REMOVE_CONFIRM =
    'installerblacklist:remove:confirm';

const INSTALLER_BLACKLIST_REMOVE_CANCEL =
    'installerblacklist:remove:cancel';


/*
====================================
HELPER: GET TYPE DISPLAY NAME
====================================
*/

function getTypeDisplayName(
    type
) {

    return (

        type === 'user'

            ?

        'User'

            :

        'Guild'

    );
}


/*
====================================
HELPER: FIND BLACKLIST ENTRY
====================================
*/

async function findBlacklistEntry(
    entryId
) {

    const entries =
        await getBlacklistedEntries();


    return (

        entries.find(
            entry =>
                String(
                    entry.id
                )
                ===
                String(
                    entryId
                )
        )

        ||

        null

    );
}


/*
====================================
HANDLE ADD MODAL
====================================
*/

async function handleAddModal(
    interaction
) {

    /*
    ====================================
    VERIFY MODAL FORMAT
    ====================================
    */
    const customId =
        interaction.customId;

    if (
        !customId.startsWith(
            INSTALLER_BLACKLIST_ADD_MODAL
        )
    ) {
        return false;
    }

    const parts =
        customId.split(
            ':'
        );

    const type =
        parts[3];

    /*
    ====================================
    VALIDATE TYPE
    ====================================
    */
    if (
        type !== 'user'
        &&
        type !== 'guild'
    ) {

        logError({

            type:
                ERROR_TYPES.SYSTEM_ERROR,

            source:
                'blacklist-installers-handler',

            message:
                'Invalid installer blacklist modal type.',

            details: {

                customId,

                type,

                userId:
                    interaction.user?.id,

                username:
                    interaction.user?.username

            }
        });

        return await interaction.reply({

            content:
                'SYNARA could not determine whether this blacklist entry is for a user or guild.',

            flags:
                MessageFlags.Ephemeral

        });
    }

    /*
    ====================================
    READ MODAL VALUES
    ====================================
    */
    const discordId =
        interaction.fields
            .getTextInputValue(
                'discord_id'
            )
            .trim();

    const reason =
        interaction.fields
            .getTextInputValue(
                'reason'
            )
            .trim();

    /*
    ====================================
    VALIDATE DISCORD ID
    ====================================
    */
    if (
        !/^\d{17,20}$/.test(
            discordId
        )
    ) {

        return await interaction.reply({

            content:
                'The Discord ID you entered does not appear to be valid. Please provide the numeric Discord ID.',

            flags:
                MessageFlags.Ephemeral

        });
    }

    if (
        !reason
    ) {
        return await interaction.reply({

            content:
                'A reason is required when creating a blacklist entry.',

            flags:
                MessageFlags.Ephemeral

        });
    }

    try {

        /*
        ====================================
        RESOLVE DISCORD ENTITY
        ====================================
        */
        let resolvedName =  null;

        let resolvedEntity = null;

        if (
            type === 'user'
        ) {

            /*
            ====================================
            RESOLVE USER
            ====================================
            */
            try {

                resolvedEntity =
                    await interaction.client.users.fetch(
                        discordId
                    );
            }

            catch (
                error
            ) {

                logFeature({

                    category:
                        'INSTALLER_BLACKLIST',

                    message:
                        'Unable to resolve Discord user for blacklist entry.',

                    details: {

                        discordId,

                        userId:
                            interaction.user.id,

                        error:
                            error.message

                    }
                });

                return await interaction.reply({

                    content:
                        'I could not find a Discord user with that ID. Please verify the ID and try again.',

                    flags:
                        MessageFlags.Ephemeral

                });
            }

            resolvedName =
                resolvedEntity.globalName
                ||
                resolvedEntity.username;

        }

        else {

            /*
            ====================================
            RESOLVE GUILD
            ====================================

            SYNARA can only resolve a guild that
            is currently available to the client.

            This is intentional. We do not want to
            create a blacklist row with an unknown
            or fabricated guild name.
            */

            try {

                resolvedEntity =
                    await interaction.client.guilds.fetch(
                        discordId
                    );
            }

            catch (
                error
            ) {

                logFeature({

                    category:
                        'INSTALLER_BLACKLIST',

                    message:
                        'Unable to resolve Discord guild for blacklist entry.',

                    details: {

                        discordId,

                        userId:
                            interaction.user.id,

                        error:
                            error.message

                    }
                });

                return await interaction.reply({

                    content:
                        'I could not resolve that Discord server. SYNARA must currently be installed in the server so I can verify its name before adding it to the blacklist.',

                    flags:
                        MessageFlags.Ephemeral

                });
            }

            resolvedName =
                resolvedEntity.name;
        }

        /*
        ====================================
        CREATE DATABASE ENTRY
        ====================================

        The database entry is intentionally
        created BEFORE any guild removal occurs.

        This guarantees that if SYNARA is being
        removed from a blacklisted guild, the
        blacklist exists before the bot leaves.
        */

        const blacklistEntry =
            await createBlacklistEntry({

                type,

                name:
                    resolvedName,

                discordId,

                reason

            });

        /*
        ====================================
        DUPLICATE ENTRY
        ====================================
        */
        if (
            !blacklistEntry
        ) {

            logFeature({

                category:
                    'INSTALLER_BLACKLIST',

                message:
                    'Installer blacklist entry already exists.',

                details: {

                    type,

                    name:
                        resolvedName,

                    discordId,

                    requestedBy:
                        interaction.user.id,

                    reason

                }
            });

            return await interaction.reply({

                content:

                    `**Already Blacklisted**\n\n` +

                    `${getTypeDisplayName(type)}: ` +

                    `**${resolvedName}** ` +

                    `is already on the SYNARA installer blacklist.`,

                flags:
                    MessageFlags.Ephemeral

            });
        }

        /*
        ====================================
        LOG SUCCESSFUL BLACKLIST CREATION
        ====================================
        */
        logFeature({

            category:
                'INSTALLER_BLACKLIST',

            message:
                'Installer blacklist entry created.',

            details: {

                blacklistId:
                    blacklistEntry.id,

                type,

                name:
                    resolvedName,

                discordId,

                reason,

                createdAt:
                    blacklistEntry.created_at,

                createdBy:
                    interaction.user.id,

                createdByUsername:
                    interaction.user.username

            }
        });

        /*
        ====================================
        GUILD REMOVAL
        ====================================
        */
        if (
            type === 'guild'
        ) {

            /*
            ====================================
            IMPORTANT SECURITY WORKFLOW
            ====================================

            The blacklist row has already been
            successfully created above.

            SYNARA now removes herself from the
            blacklisted guild.

            This ordering is intentional:

                1. Create blacklist row
                2. Confirm database success
                3. Notify Primary Operator
                4. Leave guild

            If the leave operation fails, the
            blacklist remains active so the guild
            is still protected from future use.
            */

            const guildToLeave = resolvedEntity;

            /*
            ====================================
            ACKNOWLEDGE BEFORE LEAVING
            ====================================
            */
            await interaction.reply({

                content:

                    `**Guild Blacklisted**\n\n` +

                    `**${resolvedName}** has been added to the SYNARA installer blacklist.\n\n` +

                    `SYNARA will now leave the guild.`,

                flags:
                    MessageFlags.Ephemeral

            });

            /*
            ====================================
            LEAVE GUILD
            ====================================
            */
            if (
                guildToLeave
            ) {

                try {

                    await guildToLeave.leave();


                    logFeature({

                        category:
                            'INSTALLER_BLACKLIST',

                        message:
                            'SYNARA left blacklisted guild.',

                        details: {

                            blacklistId:
                                blacklistEntry.id,

                            guildId:
                                discordId,

                            guildName:
                                resolvedName,

                            reason,

                            requestedBy:
                                interaction.user.id,

                            requestedByUsername:
                                interaction.user.username

                        }
                    });
                }

                catch (
                    error
                ) {

                    /*
                    ====================================
                    CRITICAL CONDITION
                    ====================================

                    The blacklist row already exists,
                    so the guild is protected.

                    However, SYNARA could not leave
                    the guild automatically.
                    */

                    logError({

                        type:
                            ERROR_TYPES.DISCORD_ERROR,

                        source:
                            'blacklist-installers-handler',

                        message:
                            'Guild was successfully blacklisted, but SYNARA failed to leave the guild.',

                        details: {

                            blacklistId:
                                blacklistEntry.id,

                            guildId:
                                discordId,

                            guildName:
                                resolvedName,

                            reason,

                            error:
                                error.message,

                            stack:
                                error.stack

                        }
                    });
                }
            }

            else {

                /*
                ====================================
                GUILD NO LONGER AVAILABLE
                ====================================
                */
                logFeature({

                    category:
                        'INSTALLER_BLACKLIST',

                    message:
                        'Guild was blacklisted but is no longer available in SYNARA client cache. No leave action was required.',

                    details: {

                        blacklistId:
                            blacklistEntry.id,

                        guildId:
                            discordId,

                        guildName:
                            resolvedName

                    }
                });
            }

            return true;
        }

        /*
        ====================================
        USER BLACKLIST SUCCESS
        ====================================
        */
        return await interaction.reply({

            content:

                `**User Blacklisted**\n\n` +

                `**${resolvedName}** has been added to the SYNARA installer blacklist.\n\n` +

                `**Discord ID:** \`${discordId}\`\n` +

                `**Reason:** ${reason}`,

            flags:
                MessageFlags.Ephemeral

        });
    }

    catch (
        error
    ) {

        logError({

            type:
                ERROR_TYPES.SYSTEM_ERROR,

            source:
                'blacklist-installers-handler',

            message:
                'Failed to create installer blacklist entry.',

            details: {

                type,

                discordId,

                reason,

                userId:
                    interaction.user?.id,

                username:
                    interaction.user?.username,

                error:
                    error.message,

                stack:
                    error.stack

            }
        });

        if (
            interaction.replied
            ||
            interaction.deferred
        ) {
            return await interaction.followUp({

                content:
                    'SYNARA encountered an error while creating the blacklist entry. Check the system logs for details.',

                flags:
                    MessageFlags.Ephemeral

            });
        }

        return await interaction.reply({

            content:
                'SYNARA encountered an error while creating the blacklist entry. Check the system logs for details.',

            flags:
                MessageFlags.Ephemeral

        });
    }
}


/*
====================================
HANDLE REMOVE SELECT
====================================
*/

async function handleRemoveSelect(
    interaction
) {

    if (
        !interaction.isStringSelectMenu()
        ||
        interaction.customId !==
            INSTALLER_BLACKLIST_REMOVE_SELECT
    ) {
        return false;
    }

    const entryId =
        interaction.values[0];

    try {

        const entry =
            await findBlacklistEntry(
                entryId
            );

        /*
        ====================================
        STALE ENTRY
        ====================================
        */
        if (
            !entry
        ) {
            return await interaction.update({

                content:
                    'That blacklist entry no longer exists.',

                components: []

            });
        }

        /*
        ====================================
        CONFIRMATION BUTTONS
        ====================================
        */
        const confirmButton =
            new ButtonBuilder()

                .setCustomId(

                    `${INSTALLER_BLACKLIST_REMOVE_CONFIRM}:${entry.id}`

                )

                .setLabel(
                    'Remove'
                )

                .setStyle(
                    ButtonStyle.Danger
                );

        const cancelButton =
            new ButtonBuilder()

                .setCustomId(

                    `${INSTALLER_BLACKLIST_REMOVE_CANCEL}:${entry.id}`

                )

                .setLabel(
                    'Cancel'
                )

                .setStyle(
                    ButtonStyle.Secondary
                );

        const row =
            new ActionRowBuilder()
                .addComponents(

                    confirmButton,

                    cancelButton

                );

        /*
        ====================================
        CONFIRMATION EMBED
        ====================================
        */
        const embed =
            new EmbedBuilder()

                .setColor(
                    0xE74C3C
                )

                .setTitle(
                    'Remove Installer Blacklist Entry?'
                )

                .setDescription(

                    'Please confirm that you want to remove this entry from the SYNARA installer blacklist.'

                )

                .addFields(

                    {

                        name:
                            'Type',

                        value:
                            getTypeDisplayName(
                                entry.type
                            ),

                        inline:
                            true

                    },
                    {

                        name:
                            'Name',

                        value:
                            entry.name,

                        inline:
                            true

                    },
                    {

                        name:
                            'Discord ID',

                        value:
                            `\`${entry.discord_id}\``,

                        inline:
                            false

                    },
                    {

                        name:
                            'Reason',

                        value:
                            entry.reason
                            ||
                            'No reason recorded.',

                        inline:
                            false

                    }
                );

        return await interaction.update({

            content:
                null,

            embeds: [
                embed
            ],

            components: [
                row
            ]
        });
    }

    catch (
        error
    ) {

        logError({

            type:
                ERROR_TYPES.SYSTEM_ERROR,

            source:
                'blacklist-installers-handler',

            message:
                'Failed to prepare installer blacklist removal confirmation.',

            details: {

                entryId,

                userId:
                    interaction.user?.id,

                error:
                    error.message,

                stack:
                    error.stack

            }
        });

        return await interaction.update({

            content:
                'SYNARA encountered an error while preparing the removal confirmation.',

            embeds: [],

            components: []

        });
    }
}


/*
====================================
HANDLE REMOVE CONFIRM
====================================
*/

async function handleRemoveConfirm(
    interaction
) {

    if (
        !interaction.isButton()
        ||
        !interaction.customId.startsWith(
            `${INSTALLER_BLACKLIST_REMOVE_CONFIRM}:`
        )
    ) {
        return false;
    }

    const entryId =
        interaction.customId.split(
            ':'
        )[3];

    try {

        const entry =
            await findBlacklistEntry(
                entryId
            );

        /*
        ====================================
        STALE ENTRY
        ====================================
        */
        if (
            !entry
        ) {
            return await interaction.update({

                content:
                    'That blacklist entry no longer exists. It may have already been removed.',

                embeds: [],

                components: []

            });
        }

        /*
        ====================================
        REMOVE DATABASE ENTRY
        ====================================
        */
        const removedEntry =
            await removeBlacklistEntry({

                type:
                    entry.type,

                discordId:
                    entry.discord_id

            });

        if (
            !removedEntry
        ) {

            return await interaction.update({

                content:
                    'That blacklist entry could not be removed because it no longer exists.',

                embeds: [],

                components: []

            });
        }

        /*
        ====================================
        LOG REMOVAL
        ====================================
        */
        logFeature({

            category:
                'INSTALLER_BLACKLIST',

            message:
                'Installer blacklist entry removed.',

            details: {

                blacklistId:
                    removedEntry.id,

                type:
                    removedEntry.type,

                name:
                    removedEntry.name,

                discordId:
                    removedEntry.discord_id,

                reason:
                    removedEntry.reason,

                removedBy:
                    interaction.user.id,

                removedByUsername:
                    interaction.user.username

            }
        });

        /*
        ====================================
        SUCCESS RESPONSE
        ====================================
        */
        return await interaction.update({

            content:

                `**Blacklist Entry Removed**\n\n` +

                `${getTypeDisplayName(
                    removedEntry.type
                )}: **${removedEntry.name}** ` +

                `is no longer on the SYNARA installer blacklist.`,

            embeds: [],

            components: []

        });
    }

    catch (
        error
    ) {

        logError({

            type:
                ERROR_TYPES.SYSTEM_ERROR,

            source:
                'blacklist-installers-handler',

            message:
                'Failed to remove installer blacklist entry.',

            details: {

                entryId,

                userId:
                    interaction.user?.id,

                username:
                    interaction.user?.username,

                error:
                    error.message,

                stack:
                    error.stack

            }
        });

        return await interaction.update({

            content:
                'SYNARA encountered an error while removing the blacklist entry. Check the system logs for details.',

            embeds: [],

            components: []

        });
    }
}


/*
====================================
HANDLE REMOVE CANCEL
====================================
*/

async function handleRemoveCancel(
    interaction
) {

    if (
        !interaction.isButton()
        ||
        !interaction.customId.startsWith(
            `${INSTALLER_BLACKLIST_REMOVE_CANCEL}:`
        )
    ) {
        return false;
    }

    const entryId =
        interaction.customId.split(
            ':'
        )[3];


    logFeature({

        category:
            'INSTALLER_BLACKLIST',

        message:
            'Installer blacklist removal cancelled.',

        details: {

            entryId,

            userId:
                interaction.user?.id,

            username:
                interaction.user?.username

        }
    });

    return await interaction.update({

        content:
            'Blacklist removal cancelled. No changes were made.',

        embeds: [],

        components: []

    });
}


/*
====================================
MAIN HANDLER
====================================
*/

async function handleBlacklistInstallersInteraction(
    interaction
) {

    /*
    ====================================
    ADD MODAL
    ====================================
    */
    if (
        interaction.isModalSubmit()
        &&
        interaction.customId.startsWith(
            INSTALLER_BLACKLIST_ADD_MODAL
        )
    ) {
        return await handleAddModal(
            interaction
        );
    }

    /*
    ====================================
    REMOVE SELECT
    ====================================
    */
    if (
        interaction.isStringSelectMenu()
        &&
        interaction.customId ===
            INSTALLER_BLACKLIST_REMOVE_SELECT
    ) {
        return await handleRemoveSelect(
            interaction
        );
    }

    /*
    ====================================
    REMOVE CONFIRM
    ====================================
    */
    if (
        interaction.isButton()
        &&
        interaction.customId.startsWith(
            `${INSTALLER_BLACKLIST_REMOVE_CONFIRM}:`
        )
    ) {
        return await handleRemoveConfirm(
            interaction
        );
    }

    /*
    ====================================
    REMOVE CANCEL
    ====================================
    */
    if (
        interaction.isButton()
        &&
        interaction.customId.startsWith(
            `${INSTALLER_BLACKLIST_REMOVE_CANCEL}:`
        )
    ) {
        return await handleRemoveCancel(
            interaction
        );
    }

    return false;
}

/*
====================================
EXPORTS
====================================
*/

module.exports = {
    handleBlacklistInstallersInteraction
};
