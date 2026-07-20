/**
 * Title: interaction-router.js
 * Author: Tango Hunter
 * Date Created: 5/23/26
 * Description: Centralized Discord interaction router.
 */

const {
    handleApplicationInteraction
} = require('./application-handler');

const {
    routeAdminCommand
} = require('../admin/admin-command-router');

const {
    handleBirthdayInteraction
} = require('./birthday-handler');

const {
    handleCustomEmbedInteraction
} = require('./custom-embed-handler');

const {
    handleEventInteraction
} = require('./event-handler');

const {
    handleStickyInteraction
} = require('./sticky-handler');

const {
    handleDocsInteraction
} = require("./docs-handler");

const {
    handleSetupInteraction
} = require("./setup-handler");

const {
    handleBroadcastInteraction
} = require("./broadcast-handler");

const {
    handleContentCreatorInteraction
} = require('./content-creator-handler');

const {
    handleRemoveInteraction
} = require('../admin/commands/contentcreator');

const {
    logError,
    logFeature
} = require('../../core/logging/logger');

const {
    ERROR_TYPES
} = require('../../core/logging/error-types');


async function routeInteraction(
    interaction
) {

    try {

        /*
        ============================
        BIRTHDAY INTERACTIONS
        ============================
        */
        const handledBirthday =
            await handleBirthdayInteraction(
                interaction
            );

        if (
            handledBirthday !== false
        ) {
            return;
        }

        /*
        ============================
        CUSTOM EMBED INTERACTIONS
        ============================
        */
        const handledCustomEmbed =
            await handleCustomEmbedInteraction(
                interaction
            );

        if (
            handledCustomEmbed !== false
        ) {
            return;
        }

        /*
        ============================
        EVENT INTERACTIONS
        ============================
        */
        const handledEvent =
            await handleEventInteraction(
                interaction
            );

        if (
            handledEvent !== false
        ) {

            return;
        }

        /*
        ============================
        STICKY INTERACTIONS
        ============================
        */

        const handledSticky =
            await handleStickyInteraction(
                interaction
            );

        if (
            handledSticky !== false
        ) {
            return;
        }

        /*
        ============================
        DOCUMENTATION INTERACTIONS
        ============================
        */

        const handledDocs =
            await handleDocsInteraction(
                interaction
            );

        if (
            handledDocs !== false
        ) {
            return;
        }

        /*
        ============================
        SETUP INTERACTIONS
        ============================
        */

        const handledSetup =
            await handleSetupInteraction(
                interaction
            );

        if (
            handledSetup !== false
        ) {
            return;
        }

        /*
        ============================
        BROADCAST INTERACTIONS
        ============================
        */

        const handledBroadcast =
            await handleBroadcastInteraction(
                interaction
            );

        if (
            handledBroadcast !== false
        ) {
            return;
        }

        /*
        ============================
        CONTENT CREATOR
        ============================
        */
        // Add
        const handledContentCreator =
            await handleContentCreatorInteraction(
                interaction
            );
        if (
            handledContentCreator !== false
        ) {
            return;
        }

        // Remove
        const handledContentCreatorRemoval =
            await handleRemoveInteraction(
                interaction
            );
        if (
            handledContentCreatorRemoval !== false
        ) {
            return;
        }

        /*
        ============================
        APPLICATION INTERACTIONS
        ============================
        */
       
        await routeAdminCommand(
            interaction
        );

        await handleApplicationInteraction(
            interaction
        );

        if (

            interaction.isButton() ||

            interaction.isModalSubmit()

        ) {

            logFeature({

                category:
                    'INTERACTION',

                message:
                    'Interaction processed',

                details: {

                    guildId:
                        interaction.guild?.id,

                    userId:
                        interaction.user?.id,

                    interactionId:
                        interaction.customId
                }
            });
        }

    } catch (error) {

        logError({
            type:
                ERROR_TYPES.SYSTEM_ERROR,
            source:
                'interaction-router',
            message:
                error.message,
            details: {

                error:
                    error.message,

                stack:
                    error.stack,

                guildId:
                    interaction.guild?.id,

                userId:
                    interaction.user?.id,

                interactionId:
                    interaction.customId
            }
        });

    }
}

module.exports = {
    routeInteraction
};
