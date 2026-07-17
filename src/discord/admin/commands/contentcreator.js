/**
 * Title: contentcreator.js
 * Author: Tango Hunter
 * Date Created: 7/17/26
 * Description: Content Creator announcement administration.
 */

const {
    EmbedBuilder,
    MessageFlags
} = require('discord.js');

const {
    getGuildCreators
} = require('../../../core/database/content-creators-repository');

const {
    embedThemes
} = require('../../../core/config/embed-themes');

const {
    beginCreatorAdd,
    beginCreatorRemove
} = require('../../interactions/content-creator/content-creator-handler');


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

        return await beginCreatorAdd(
            interaction
        );
    }

    /*
    ====================================
    REMOVE
    ====================================
    */

    if (
        subcommand === 'remove'
    ) {

        return await beginCreatorRemove(
            interaction
        );
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
