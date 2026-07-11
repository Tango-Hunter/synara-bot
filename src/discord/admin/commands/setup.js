/**
 * Title: setup.js
 * Author: Tango Hunter
 * Date Created: 7/8/26
 * Description: Starts the SYNARA Setup Wizard.
 */

const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    MessageFlags
} = require("discord.js");

const {
    renderDocument
} = require("../../utils/registry-renderer");

const {
    DEFAULT_GUILD_SETTINGS
} = require("../../../core/database/default-guild-settings");

const {
    logFeature,
    logError
} = require("../../../core/logging/logger");

const {
    ERROR_TYPES
} = require("../../../core/logging/error-types");


/*
====================================
HELPERS
====================================
*/

function buildRequiredSettingsEmbed(
    setupDocument
) {

    const {

        EmbedBuilder

    } = require("discord.js");

    const embed =

        new EmbedBuilder()

            .setColor(0x5865F2)

            .setTitle(
                "Required Configuration"
            )

            .setDescription(

                "Before setup begins, make sure these roles, channels, and users exist in your server. If they do not already exist, create them now."

            );

    for (

        const settingName

        of

        setupDocument.settings

    ) {

        const setting =

            DEFAULT_GUILD_SETTINGS.find(

                setting =>

                    setting.name ===
                    settingName

            );

        if (
            !setting
        ) {
            continue;
        }

        embed.addFields({

            name:
                setting.displayName,

            value:
                setting.description,

            inline:
                false

        });
    }

    return embed;
}

/*
====================================
COMMAND
====================================
*/

async function handleSetupCommand(
    interaction
) {

    try {

        /*
        ================================
        SETUP GUIDE
        ================================
        */

        const {

            document,

            embed

        } = renderDocument(

            "setup"

        );

        /*
        ================================
        REQUIRED SETTINGS
        ================================
        */

        const requiredEmbed =

            buildRequiredSettingsEmbed(

                document

            );

        /*
        ================================
        BEGIN BUTTON
        ================================
        */

        const row =

            new ActionRowBuilder()

                .addComponents(

                    new ButtonBuilder()

                        .setCustomId(

                            "setup_begin"

                        )

                        .setLabel(

                            "Begin Setup"

                        )

                        .setStyle(

                            ButtonStyle.Primary

                        )
                );

        /*
        ================================
        SEND
        ================================
        */

        await interaction.reply({

            embeds: [

                embed,

                requiredEmbed

            ],

            components: [

                row

            ]
        });

        logFeature({

            category:
                "SETUP",

            message:
                "Setup wizard started.",

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
    }

    catch (
        error
    ) {

        logError({

            type:
                ERROR_TYPES.DISCORD_ERROR,

            source:
                "setup-command",

            message:
                error.message,

            details: {

                guildId:
                    interaction.guild?.id,

                guildName:
                    interaction.guild?.name,

                userId:
                    interaction.user?.id

            }
        });

        await interaction.reply({

            content:
                "An unexpected error occurred while starting the setup wizard.",

            flags:
                MessageFlags.Ephemeral

        });
    }
}

module.exports = {
    handleSetupCommand
};
