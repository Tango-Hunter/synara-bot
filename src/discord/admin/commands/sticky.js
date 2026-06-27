/**
 * Title: sticky.js
 * Author: Tango Hunter
 * Date Created: 6/27/26
 * Description: Starts sticky message workflows.
 */

const {
    MessageFlags
} = require('discord.js');

const {
    getChannelMessage
} = require('../../../core/database/channel-messages-repository');

const {
    showStickyCreateModal,
    showStickyDeleteConfirmation
} = require('../../interactions/sticky-handler');

async function handleStickyCommand(
    interaction
) {

    const action =
        interaction.options.getString(
            'action'
        );

    const existingMessage =
        await getChannelMessage({

            guildId:
                interaction.guild.id,

            channelId:
                interaction.channel.id,

            type:
                'STICKY'
        });

    /*
    ============================
    CREATE
    ============================
    */

    if (
        action ===
        'create'

    ) {
        return await showStickyCreateModal({

            interaction,

            existingMessage
        });
    }

    /*
    ============================
    DELETE
    ============================
    */

    if (
        action ===
        'delete'
    ) {

        if (
            !existingMessage
        ) {
            return await interaction.reply({

                content:
                    'There is no sticky message configured for this channel.',

                flags:
                    MessageFlags.Ephemeral
            });
        }

        return await showStickyDeleteConfirmation({

            interaction,

            existingMessage
        });
    }

}

module.exports = {
    handleStickyCommand
};
