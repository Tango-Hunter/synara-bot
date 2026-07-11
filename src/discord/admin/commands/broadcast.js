/**
 * Title: broadcast.js
 * Author: Tango Hunter
 * Date Created: 7/6/26
 * Description: Initializes the SYNARA broadcast command.
 */

const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    MessageFlags
} = require("discord.js");

const {
    logFeature
} = require("../../../core/logging/logger");


async function handleBroadcastCommand(
    interaction
) {

    /*
    ============================
    PRIMARY OPERATOR CHECK
    ============================
    */

    if (

        interaction.user.id !==
        process.env.OWNER_ID

    ) {

        logFeature({

            category:
                "BROADCAST",

            message:
                "Unauthorized broadcast attempt",

            details: {

                guildId:
                    interaction.guild?.id,

                guildName:
                    interaction.guild?.name,

                userId:
                    interaction.user.id,

                username:
                    interaction.user.username

            }

        });

        return await interaction.reply({

            content:
                "This command is reserved for The Primary Operator.",

            flags:
                MessageFlags.Ephemeral

        });

    }

    /*
    ============================
    CREATE BUTTON
    ============================
    */

    const row =
        new ActionRowBuilder()

            .addComponents(

                new ButtonBuilder()

                    .setCustomId(
                        "broadcast_create"
                    )

                    .setLabel(
                        "Compose Broadcast"
                    )

                    .setStyle(
                        ButtonStyle.Primary
                    )

            );

    /*
    ============================
    RESPONSE
    ============================
    */

    await interaction.reply({

        flags:
            MessageFlags.Ephemeral,

        content:
            "Create an official SYNARA broadcast for all configured servers.",

        components: [

            row

        ]

    });

}

module.exports = {
    handleBroadcastCommand
};
