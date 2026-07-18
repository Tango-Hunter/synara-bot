/**
 * Title: contentcreator.js
 * Author: Tango Hunter
 * Date Created: 7/17/26
 * Description: Content Creator announcement administration.
 */

const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    MessageFlags,
    StringSelectMenuBuilder
} = require('discord.js');

const {
    getGuildCreators,
    getCreatorsByUser
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

                        creator => ({

                            label:

                                getPlatformLabel(

                                    creator.platform

                                ),

                            description:

                                creator.creator_display_name,

                            value:

                                creator.platform

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

module.exports = {
    handleContentCreatorCommand
};
