/**
 * Title: ignorechannel.js
 * Author: Tango Hunter
 * Date Created: 6/11/26
 * Description: Manage ignored channels.
 */

const {
    addIgnoredChannel,
    removeIgnoredChannel
} = require('../../../core/database/ignored-channels-repository');

const {
    discordLog
} = require('../../../core/logging/discord-logger');

const {
    logFeature
} = require('../../../core/logging/logger');


async function handleIgnoreChannelCommand(
    interaction
) {

    const action =
        interaction.options.getSubcommand();

    const channel =
        interaction.channel;

    if (
        action === 'add'
    ) {

        await addIgnoredChannel({

            guildId:
                interaction.guild.id,

            guildName:
                interaction.guild.name,

            channelId:
                channel.id,

            channelName:
                channel.name
        });

        logFeature({

            category:
                'IGNORED_CHANNELS',

            message:
                'Ignored channel added',

            details: {

                guildId:
                    interaction.guild.id,

                guildName:
                    interaction.guild.name,

                channelId:
                    channel.id,

                channelName:
                    channel.name,

                userId:
                    interaction.user.id
            }
        });

        await discordLog({

            guildId:
                interaction.guild.id,

            title:
                'Ignored Channel Added',

            category:
                'Administrative Workflow',

            details:

                `Ignored channel added: ${channel.name} by ${interaction.user}`,

            status:
                'SUCCESS'
        });

        return await interaction.reply({

            content:
                `✅ ${channel} added to ignored channels.`
        });
    }

    await removeIgnoredChannel({

        guildId:
            interaction.guild.id,

        channelId:
            channel.id
    });

    logFeature({

        category:
            'IGNORED_CHANNELS',

        message:
            'Ignored channel removed',

        details: {

            guildId:
                interaction.guild.id,

            guildName:
                interaction.guild.name,

            channelId:
                channel.id,

            channelName:
                channel.name,

            userId:
                interaction.user.id
        }
    });

    await discordLog({

        guildId:
            interaction.guild.id,

        title:
            'Ignored Channel Removed',

        category:
            'Administrative Workflow',

        details:

            `Ignored channel removed: ${channel.name} by ${interaction.user}`,

        status:
            'SUCCESS'
    });

    return await interaction.reply({

        content:
            `✅ ${channel} removed from ignored channels.`
    });
}

module.exports = {
    handleIgnoreChannelCommand
};
