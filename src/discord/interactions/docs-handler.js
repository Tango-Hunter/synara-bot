/**
 * Title: docs-handler.js
 * Author: Tango Hunter
 * Date Created: 7/5/26
 * Description: Handles documentation selector interactions.
 */

const {
    MessageFlags
} = require('discord.js');

const {
    renderDocument
} = require("../utils/registry-renderer");

const {
    logFeature,
    logError
} = require("../../core/logging/logger");

const {
    ERROR_TYPES
} = require("../../core/logging/error-types");



async function handleDocsInteraction(
    interaction
) {

    try {

        /*
        ============================
        STRING SELECT MENUS ONLY
        ============================
        */

        if (

            !interaction.isStringSelectMenu()

        ) {

            return false;
        }

        /*
        ============================
        DOCS SELECTOR
        ============================
        */

        if (

            interaction.customId !==
            "docs_selector"

        ) {

            return false;
        }

        const documentId =
            interaction.values[0];

        /*
        ============================
        ACKNOWLEDGE INTERACTION
        ============================
        */

        await interaction.deferUpdate();

        /*
        ============================
        RENDER DOCUMENTATION
        ============================
        */

        const rendered =
            renderDocument(
                documentId
            );

        /*
        ============================
        SEND DOCUMENTATION
        ============================
        */

        await interaction.channel.send({

            embeds: [

                rendered.embed

            ]

        });

        /*
        ============================
        LOG
        ============================
        */

        logFeature({

            category:
                "DOCUMENTATION",

            message:
                "Documentation displayed",

            details: {

                guildId:
                    interaction.guild?.id,

                channelId:
                    interaction.channel?.id,

                userId:
                    interaction.user?.id,

                documentId:
                    rendered.document.id,

                documentName:
                    rendered.document.name

            }

        });

        return true;

    } catch (error) {

        logError({

            type:
                ERROR_TYPES.SYSTEM_ERROR,

            source:
                "docs-handler",

            message:
                error.message,

            details: {

                error:
                    error.message,

                stack:
                    error.stack,

                guildId:
                    interaction.guild?.id,

                channelId:
                    interaction.channel?.id,

                userId:
                    interaction.user?.id

            }

        });

        if (

            !interaction.replied &&

            !interaction.deferred

        ) {

            await interaction.reply({

                content:
                    "I encountered an error while loading that documentation.",

                flags:
                    MessageFlags.Ephemeral

            }).catch(() => {});

        }

        return true;
    }
}

module.exports = {
    handleDocsInteraction
};
