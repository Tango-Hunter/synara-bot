/**
 * Title: contentcreator.js
 * Author: Tango Hunter
 * Date Created: 7/17/26
 * Description: Content Creator announcement administration.
 */

const {
    ActionRowBuilder,
    StringSelectMenuBuilder,
    EmbedBuilder,
    MessageFlags
} = require('discord.js');

const {
    getGuildCreators,
    getCreatorsByUser,
    deleteCreator
} = require('../../../core/database/content-creators-repository');

const {
    getPlatformOptions,
    getPlatformLabel
} = require('../../interactions/content-creator/platform-selection');

const {
    createApprovalButtons
} = require('../../utils/approval-workflow');

const {
    embedThemes
} = require('../../../core/config/embed-themes');

const {
    discordLog
} = require('../../../core/logging/discord-logger');


const contentCreatorRemoveDrafts = new Map();


/*
====================================
HANDLE CONTENT CREATOR
====================================
*/
async function handleContentCreatorCommand(
    interaction
) {

    const subcommand =
        interaction.options.getSubcommand();

    /*
    ====================================
    ADD
    ====================================
    */

    if (
        subcommand === 'add'
    ) {

        const selector =

            new StringSelectMenuBuilder()

                .setCustomId(

                    'content_creator_platform'

                )

                .setPlaceholder(

                    'Select a content platform...'

                )

                .addOptions(

                    getPlatformOptions()

                );

        const row =

            new ActionRowBuilder()

                .addComponents(

                    selector

                );

        return await interaction.reply({

            embeds: [

                new EmbedBuilder()

                    .setColor(

                        embedThemes.contentCreator.color

                    )

                    .setTitle(

                        `${embedThemes.contentCreator.icon} Register Content Creator`

                    )

                    .setDescription(

                        'Select the platform you would like to register.'

                    )
            ],

            components: [

                row

            ],

            flags:

                MessageFlags.Ephemeral

        });
    }

    /*
    ====================================
    REMOVE
    ====================================
    */

    if (
        subcommand === 'remove'
    ) {

        const creators =

            await getCreatorsByUser({

                guildId:

                    interaction.guild.id,

                discordUserId:

                    interaction.user.id

            });

        contentCreatorRemoveDrafts.set(

            `${interaction.guild.id}:${interaction.user.id}`,

            creators

        );

        if (
            creators.length === 0
        ) {

            return await interaction.reply({

                content:

                    'You have not configured any content creator announcements.',

                flags:

                    MessageFlags.Ephemeral

            });
        }

        const selector =

            new StringSelectMenuBuilder()

                .setCustomId(

                    'content_creator_remove'

                )

                .setPlaceholder(

                    'Select a platform to remove...'

                )

                .addOptions(

                    creators.map(

                        (

                            creator,

                            index

                        ) => ({

                            label:

                                getPlatformLabel(

                                    creator.platform

                                ),

                            description:

                                creator.creator_display_name,

                            value:

                                index.toString()

                        })
                    )
                );

        return await interaction.reply({

            embeds: [

                new EmbedBuilder()

                    .setColor(

                        embedThemes.contentCreator.color

                    )

                    .setTitle(

                        'Remove Content Creator'

                    )

                    .setDescription(

                        'Select the platform you would like to remove.'

                    )
            ],

            components: [

                new ActionRowBuilder()

                    .addComponents(

                        selector

                    )
            ],

            flags:

                MessageFlags.Ephemeral

        });
    }

    /*
    ====================================
    LIST
    ====================================
    */

    const creators =
        await getGuildCreators({

            guildId:
                interaction.guild.id

        });

    const description =

        creators.length

            ? creators

                .map(

                    creator => {

                        const platform =

                            creator.platform

                                .charAt(0)

                                .toUpperCase()

                            +

                            creator.platform.slice(1);

                        return `• <@${creator.discord_user_id}> • ${platform} • ${creator.creator_display_name}`;

                    }
                )

                .join('\n')

            : '*No content creators have been configured.*';

    const theme =
        embedThemes.contentCreator;

    const embed =

        new EmbedBuilder()

            .setColor(
                theme.color
            )

            .setTitle(
                `${theme.icon} Content Creator Announcements`
            )

            .setDescription(
                description
            )

            .setFooter({

                text:
                    theme.footer

            });

    return await interaction.reply({

        embeds: [

            embed

        ],

        flags:
            MessageFlags.Ephemeral

    });
}

/*
============================
CONTENT CREATOR REMOVAL
============================
*/
async function handleRemoveInteraction(

    interaction

) {

    /*
    ============================
    REMOVE SELECTED
    ============================
    */

    if (

        interaction.isStringSelectMenu()

        &&

        interaction.customId ===

        'content_creator_remove'

    ) {

        const creators =

            contentCreatorRemoveDrafts.get(

                `${interaction.guild.id}:${interaction.user.id}`

            );

        if (
            !creators
        ) {

            await interaction.update({

                content:

                    'This removal session has expired.',

                embeds: [],

                components: []

            });

            return true;

        }

        const creator =

            creators[

                Number(

                    interaction.values[0]

                )
            ];

        if (
            !creator
        ) {

            return await interaction.update({

                content:

                    'Unable to locate the selected content creator.',

                embeds: [],

                components: []

            });
        }

        const {

            platform,

            account_identifier:

                accountIdentifier,

            creator_display_name:

                creatorDisplayName

        } = creator;

        return await interaction.update({

            embeds: [

                new EmbedBuilder()

                    .setColor(

                        embedThemes.contentCreator.color

                    )

                    .setTitle(

                        `${embedThemes.contentCreator.icon} Remove Content Creator`

                    )

                    .setDescription(

                        'Review the selected content creator before removal.'

                    )

                    .addFields(

                        {

                            name:

                                'Platform',

                            value:

                                getPlatformLabel(

                                    platform

                                ),

                            inline:

                                true

                        },

                        {

                            name:

                                'Creator',

                            value:

                                creatorDisplayName,

                            inline:

                                true

                        }

                    )

                    .setFooter({

                        text:

                            embedThemes.contentCreator.footer

                    })

            ],

            components: [

                createApprovalButtons({

                    approveId:

                        `content_creator_remove_confirm:${Buffer

                            .from(

                                interaction.values[0]

                            )

                            .toString(

                                'base64url'

                            )}`,

                    cancelId:

                        'content_creator_remove_cancel'

                })

            ]

        });

    }

    /*
    ============================
    APPROVE
    ============================
    */

    if (

        interaction.isButton()

        &&

        interaction.customId.startsWith(

            'content_creator_remove_confirm:'

        )

    ) {

        const encoded =

            interaction.customId.split(

                ':'

            )[1];

        const index =

            Number(

                Buffer

                    .from(

                        encoded,

                        'base64url'

                    )

                    .toString()

            );

        const creators =

            contentCreatorRemoveDrafts.get(

                `${interaction.guild.id}:${interaction.user.id}`

            );

        if (
            !creators
        ) {

            return await interaction.update({

                content:

                    'This removal session has expired.',

                embeds: [],

                components: []

            });

        }

        const creator =

            creators[index];

        if (
            !creator
        ) {

            return await interaction.update({

                content:

                    'Unable to locate the selected content creator.',

                embeds: [],

                components: []

            });

        }

        const {

            platform,

            account_identifier:

                accountIdentifier,

            creator_display_name:

                creatorDisplayName

        } = creator;

        await deleteCreator({

            guildId:

                interaction.guild.id,

            platform,

            accountIdentifier

        });

        contentCreatorRemoveDrafts.delete(

            `${interaction.guild.id}:${interaction.user.id}`

        );

        await discordLog({
        
                guildId:
        
                    interaction.guild.id,

                title:
                    'Content Creator Removed',
        
                category:
        
                    'Administrative Action',
                
                details:

                    `${creatorDisplayName} on ${platform} has been removed from automated announcements by <@${interaction.user.id}>.`,

                status:

                    'INFO'
        
            });

        return await interaction.update({

            embeds: [

                new EmbedBuilder()

                    .setColor(

                        embedThemes.contentCreator.color

                    )

                    .setTitle(

                        `${embedThemes.contentCreator.icon} Content Creator Removed`

                    )

                    .setDescription(

                        `${creatorDisplayName} has been removed from automated ${getPlatformLabel(platform)} announcements.`

                    )

                    .setFooter({

                        text:

                            embedThemes.contentCreator.footer

                    })

            ],

            components: []

        });

    }

    /*
    ============================
    CANCEL
    ============================
    */

    if (

        interaction.isButton()

        &&

        interaction.customId ===

        'content_creator_remove_cancel'

    ) {

        contentCreatorRemoveDrafts.delete(

            `${interaction.guild.id}:${interaction.user.id}`

        );

        return await interaction.update({

            content:

                'Content creator removal cancelled.',

            embeds: [],

            components: []

        });

    }

    return false;
}

module.exports = {
    handleContentCreatorCommand,
    handleRemoveInteraction
};
