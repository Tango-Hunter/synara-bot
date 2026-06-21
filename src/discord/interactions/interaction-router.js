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
