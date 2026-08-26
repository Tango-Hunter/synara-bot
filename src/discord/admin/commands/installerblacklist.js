/**
 * Title: installerblacklist.js
 * Author: Tango Hunter
 * Date Created: 8/25/26
 * Description: Primary Operator controls for managing the SYNARA installer blacklist.
 */

const {
    ActionRowBuilder,
    MessageFlags,
    ModalBuilder,
    StringSelectMenuBuilder,
    TextInputBuilder,
    TextInputStyle
} = require('discord.js');

const {
    getBlacklistedEntries
} = require('../../../core/database/blacklisted-installers-repository');

const {
    logFeature,
    logError
} = require('../../../core/logging/logger');

const {
    ERROR_TYPES
} = require('../../../core/logging/error-types');


/*
====================================
INTERACTION IDS
====================================
*/

/*
 * These IDs are shared with
 * blacklist-installers-handler.js.
 *
 * Keep these values stable once the
 * workflow is deployed.
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
PRIMARY OPERATOR CHECK
====================================
*/

function isPrimaryOperator(
    interaction
) {
    return (
        interaction.user.id ===
        process.env.OWNER_ID
    );
}

/*
====================================
HANDLE INSTALLER BLACKLIST COMMAND
====================================
*/

async function handleInstallerBlacklistCommand(
    interaction
) {

    /*
    ============================
    PRIMARY OPERATOR CHECK
    ============================
    */

    if (
        !isPrimaryOperator(
            interaction
        )
    ) {

        logFeature({

            category:
                'INSTALLER_BLACKLIST',

            message:
                'Unauthorized installer blacklist attempt.',

            details: {

                guildId:
                    interaction.guild?.id,

                guildName:
                    interaction.guild?.name,

                userId:
                    interaction.user.id,

                username:
                    interaction.user.username,

                action:
                    interaction.options
                        ?.getSubcommand(false)
                        ??
                        null

            }
        });

        return await interaction.reply({

            content:
                'This command is reserved for The Primary Operator.',

            flags:
                MessageFlags.Ephemeral

        });
    }

    try {

        const subcommand =
            interaction.options.getSubcommand();

        /*
        ====================================
        ADD
        ====================================
        */
        if (
            subcommand ===
            'add'
        ) {

            const type =
                interaction.options.getString(
                    'type',
                    true
                );

            /*
            ====================================
            CREATE ADD MODAL
            ====================================
            */
            const modalTitle =
                type === 'guild'

                    ?

                'Blacklist Guild'

                    :

                'Blacklist User';

            const modal =
                new ModalBuilder()

                    .setCustomId(
                        `${INSTALLER_BLACKLIST_ADD_MODAL}:${type}`
                    )

                    .setTitle(
                        modalTitle
                    );

            /*
            ====================================
            DISCORD ID INPUT
            ====================================
            */
            const discordIdInput =
                new TextInputBuilder()

                    .setCustomId(
                        'discord_id'
                    )

                    .setLabel(
                        'Discord ID'
                    )

                    .setPlaceholder(

                        type === 'guild'

                            ?

                        'Enter the Discord Server ID'

                            :

                        'Enter the Discord User ID'

                    )

                    .setStyle(
                        TextInputStyle.Short
                    )

                    .setRequired(
                        true
                    )

                    .setMinLength(
                        17
                    )

                    .setMaxLength(
                        20
                    );

            /*
            ====================================
            REASON INPUT
            ====================================
            */
            const reasonInput =
                new TextInputBuilder()

                    .setCustomId(
                        'reason'
                    )

                    .setLabel(
                        'Reason'
                    )

                    .setPlaceholder(
                        'Why is this being blacklisted?'
                    )

                    .setStyle(
                        TextInputStyle.Paragraph
                    )

                    .setRequired(
                        true
                    )

                    .setMinLength(
                        1
                    )

                    .setMaxLength(
                        1000
                    );

            /*
            ====================================
            MODAL ROWS
            ====================================
            */
            const discordIdRow =
                new ActionRowBuilder()
                    .addComponents(
                        discordIdInput
                    );

            const reasonRow =
                new ActionRowBuilder()
                    .addComponents(
                        reasonInput
                    );

            modal.addComponents(

                discordIdRow,

                reasonRow

            );

            return await interaction.showModal(
                modal
            );
        }

        /*
        ====================================
        REMOVE
        ====================================
        */
        if (
            subcommand ===
            'remove'
        ) {

            const entries =
                await getBlacklistedEntries();

            /*
            ====================================
            NO ENTRIES
            ====================================
            */
            if (
                entries.length ===
                0
            ) {

                return await interaction.reply({

                    content:
                        'There are currently no blacklisted users or guilds.',

                    flags:
                        MessageFlags.Ephemeral

                });
            }

            /*
            ====================================
            DISCORD SELECT LIMIT
            ====================================

            Discord String Select Menus support
            a maximum of 25 options.

            The handler can add pagination later
            if the blacklist grows beyond this.
            */

            if (
                entries.length >
                25
            ) {

                logFeature({

                    category:
                        'INSTALLER_BLACKLIST',

                    message:
                        'Installer blacklist exceeds the Discord select menu option limit.',

                    details: {

                        entryCount:
                            entries.length,

                        maximumOptions:
                            25

                    }
                });

                return await interaction.reply({

                    content:
                        'There are more than 25 blacklist entries. The blacklist pagination workflow needs to be implemented before entries can be removed from this menu.',

                    flags:
                        MessageFlags.Ephemeral

                });
            }

            /*
            ====================================
            BUILD SELECT OPTIONS
            ====================================
            */
            const options =
                entries.map(
                    entry => ({

                        label:

                            `${

                                entry.type === 'user'

                                    ?

                                'User'

                                    :

                                'Guild'

                            }: ${entry.name}`

                            .slice(
                                0,
                                100
                            ),

                        description:

                            `ID: ${entry.discord_id}`

                            .slice(
                                0,
                                100
                            ),

                        value:
                            String(
                                entry.id
                            )
                    })
                );

            /*
            ====================================
            SELECT MENU
            ====================================
            */
            const selectMenu =
                new StringSelectMenuBuilder()

                    .setCustomId(
                        INSTALLER_BLACKLIST_REMOVE_SELECT
                    )

                    .setPlaceholder(
                        'Select a blacklist entry to remove'
                    )

                    .setMinValues(
                        1
                    )

                    .setMaxValues(
                        1
                    )

                    .addOptions(
                        options
                    );

            const row =
                new ActionRowBuilder()
                    .addComponents(
                        selectMenu
                    );

            /*
            ====================================
            REMOVE RESPONSE
            ====================================
            */
            return await interaction.reply({

                content:
                    [
                        '**SYNARA Installer Blacklist**',
                        '',
                        'Select the user or guild you want to remove from the blacklist.',
                        '',
                        'You will be asked to confirm the removal before the database entry is deleted.'
                    ].join('\n'),

                components: [
                    row
                ],

                flags:
                    MessageFlags.Ephemeral

            });
        }

        /*
        ====================================
        UNKNOWN SUBCOMMAND
        ====================================
        */
        return await interaction.reply({

            content:
                'Unknown installer blacklist action.',

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
                'installerblacklist',

            message:
                'Failed to process installer blacklist command.',

            details: {

                guildId:
                    interaction.guild?.id,

                guildName:
                    interaction.guild?.name,

                userId:
                    interaction.user?.id,

                username:
                    interaction.user?.username,

                subcommand:
                    interaction.options
                        ?.getSubcommand(false)
                        ??
                        null,

                error:
                    error.message,

                stack:
                    error.stack

            }
        });

        /*
        ====================================
        SAFE ERROR RESPONSE
        ====================================
        */
        if (
            interaction.replied
            ||
            interaction.deferred
        ) {

            return await interaction.followUp({

                content:
                    'SYNARA encountered an error while processing the installer blacklist command. Check the system logs for details.',

                flags:
                    MessageFlags.Ephemeral

            });
        }

        return await interaction.reply({

            content:
                'SYNARA encountered an error while processing the installer blacklist command. Check the system logs for details.',

            flags:
                MessageFlags.Ephemeral

        });
    }
}


/*
====================================
EXPORTS
====================================
*/

module.exports = {
    handleInstallerBlacklistCommand,

    INSTALLER_BLACKLIST_ADD_MODAL,
    INSTALLER_BLACKLIST_REMOVE_SELECT,
    INSTALLER_BLACKLIST_REMOVE_CONFIRM,
    INSTALLER_BLACKLIST_REMOVE_CANCEL
};
