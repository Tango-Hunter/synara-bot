/**
 * Title: response-validator.js
 * Author: Tango Hunter
 * Date Created: 5/20/26
 * Date Modified: 5/20/26
 * Description: Centralized AI response validation layer.
 */

const recentResponses = [];
const MAX_RECENT_RESPONSES = 15;
const MAX_RESPONSE_LENGTH = 3500;

function sanitizeResponse(response) {

    return response

        .replace(/```+/g, '`')

        .replace(/\n{4,}/g, '\n\n')

        .trim();
}

function isDuplicateResponse(response) {

    return recentResponses.includes(
        response
    );
}

function rememberResponse(response) {

    recentResponses.push(
        response
    );

    if (
        recentResponses.length >
        MAX_RECENT_RESPONSES
    ) {

        recentResponses.shift();
    }
}

function validateResponse(response) {

    if (
        !response ||
        typeof response !== 'string'
    ) {

        throw new Error(
            'Invalid AI response type.'
        );
    }

    const cleanedResponse =
        sanitizeResponse(
            response
        );

    if (
        cleanedResponse.length === 0
    ) {

        throw new Error(
            'Empty AI response.'
        );
    }

    if (
        cleanedResponse.length >
        MAX_RESPONSE_LENGTH
    ) {

        throw new Error(
            'AI response exceeded maximum length.'
        );
    }

    if (
        isDuplicateResponse(
            cleanedResponse
        )
    ) {

        throw new Error(
            'Duplicate AI response detected.'
        );
    }

    rememberResponse(
        cleanedResponse
    );

    return cleanedResponse;
}

module.exports = {
    validateResponse
};
