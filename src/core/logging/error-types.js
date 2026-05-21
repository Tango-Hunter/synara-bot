/**
 * Title: error-types.js
 * Author: Tango Hunter
 * Date Created: 5/20/26
 * Date Modified: 5/20/26
 * Description: Centralized error classification constants.
 */

const ERROR_TYPES = {

    OPENAI_ERROR:
        'OPENAI_ERROR',

    VALIDATION_ERROR:
        'VALIDATION_ERROR',

    TIMEOUT_ERROR:
        'TIMEOUT_ERROR',

    DISCORD_ERROR:
        'DISCORD_ERROR',

    SCHEDULER_ERROR:
        'SCHEDULER_ERROR',

    UNKNOWN_ERROR:
        'UNKNOWN_ERROR'
};

module.exports = {
    ERROR_TYPES
};
