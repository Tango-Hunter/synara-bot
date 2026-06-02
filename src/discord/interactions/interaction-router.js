/**
 * Title: interaction-router.js
 * Author: Tango Hunter
 * Date Created: 5/23/26
 * Date Modified: 5/23/26
 * Description:
 * Centralized Discord interaction router.
 */

const {
    handleApplicationInteraction
} = require('./application-handler');

const {
    routeAdminCommand
} = require('../admin/admin-command-router');

const {
    logError
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
        APPLICATION INTERACTIONS
        ============================
        */
       
        await routeAdminCommand(
            interaction
        );

        await handleApplicationInteraction(
            interaction
        );

    } catch (error) {

        console.error(
            '[INTERACTION ERROR FULL]',
            error
        );

        logError({
            type:
                ERROR_TYPES.SYSTEM_ERROR,
            source:
                'interaction-router',
            message:
                error.message,
            details:
                error.stack
        });

    }
}

module.exports = {
    routeInteraction
};
