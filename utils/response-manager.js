/**
 * Title: response-manager.js
 * Author: Tango Hunter
 * Date Created: 5/15/26
 * Date Modified: 5/15/26
 * Description: Ensures messages are trunciated and sent in chunks intelligently.
 */

function prepareResponse(message, maxLength = 1800) {

    if (!message) {

        return 'Signal clarity insufficient.';
    }

    if (message.length > maxLength) {

        return (
            message.substring(0, maxLength) +
            '...'
        );
    }

    return message;
}

module.exports = {
    prepareResponse
};
