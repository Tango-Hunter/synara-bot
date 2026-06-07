/**
 * Title: features.js
 * Author: Tango Hunter
 * Date Created: 6/7/26
 * Description: Displays guild feature flags.
 */

const {
    EmbedBuilder
} = require('discord.js');

const {
    getAllFeatureFlags
} = require('../../../core/database/feature-flags-repository');

const {
    logFeature
} = require('../../../core/logging/logger');


async function handleFeaturesCommand(
    interaction
) {

    const features =
        await getAllFeatureFlags(

            interaction.guild.id
        );

    const embed =

        new EmbedBuilder()

            .setColor(
                0x5865F2
            )

            .setTitle(
                'Feature Flags'
            )

            .setDescription(

                features

                    .map(

                        feature =>

                            `${feature.enabled ? '🟢' : '🔴'} **${feature.feature_name}**`
                    )

                    .join('\n')
            )

            .setFooter({

                text:
                    interaction.guild.name
            })

            .setTimestamp();

    logFeature({

        category:
            'FEATURE_FLAGS',

        message:
            'Feature list viewed',

        details: {

            guildId:
                interaction.guild.id,

            guildName:
                interaction.guild.name,

            userId:
                interaction.user.id,

            username:
                interaction.user.username
        }
    });

    return interaction.reply({

        embeds: [
            embed
        ]
    });
}

module.exports = {
    handleFeaturesCommand
};
