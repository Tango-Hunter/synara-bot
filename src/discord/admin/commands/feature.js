/**
 * Title: feature.js
 * Author: Tango Hunter
 * Date Created: 6/7/26
 * Description: Enable or disable guild features.
 */

const {
    setFeatureFlag,
    featureFlagExists
} = require('../../../core/database/feature-flags-repository');

const {
    discordLog
} = require('../../../core/logging/discord-logger');

const {
    logFeature
} = require('../../../core/logging/logger');


async function handleFeatureCommand(
    interaction
) {

    const action =
        interaction.options.getSubcommand();

    const featureName =
        interaction.options.getString(
            'feature'
        );

    const exists =
        await featureFlagExists({

            guildId:
                interaction.guild.id,

            featureName
        });

    if (
        !exists
    ) {
        return interaction.reply({

            content:
                `Unknown feature: ${featureName}`
        });
    }

    const enabled =
        action === 'enable';

    await setFeatureFlag({

        guildId:
            interaction.guild.id,

        guildName:
            interaction.guild.name,

        featureName,

        enabled
    });

    logFeature({

        category:
            'FEATURE_FLAGS',

        message:
            'Feature updated',

        details: {

            guildId:
                interaction.guild.id,

            guildName:
                interaction.guild.name,

            featureName,

            enabled,

            userId:
                interaction.user.id,

            username:
                interaction.user.username
        }
    });

    await discordLog({

        guildId:
            interaction.guild.id,

        category:
            'FEATURE_FLAGS',

        details:

            `${featureName} ${enabled ? 'enabled' : 'disabled'} by ${interaction.user}`,

        status:
            'SUCCESS'
    });

    return interaction.reply({

        content:

            `${enabled ? '🟢 Enabled' : '🔴 Disabled'} **${featureName}**`
    });
}

module.exports = {
    handleFeatureCommand
};
