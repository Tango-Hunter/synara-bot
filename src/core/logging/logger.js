/**
 * Title: logger.js
 * Author: Tango Hunter
 * Date Created: 5/13/26
 * Date Modified: 5/13/26
 * Description: Creates error logs.
 */

const fs = require('fs');

const path = require('path');

const logFilePath = path.join(
    __dirname,
    '..',
    '..',
    'logs',
    'errors.log'
);

function logError(context, details) {

    const timestamp = new Date().toISOString();

    const logEntry = `
[${timestamp}]
[${context}]
${JSON.stringify(details, null, 2)}

`;

    console.error(logEntry);

    fs.appendFile(
        logFilePath,
        logEntry,
        (error) => {

            if (error) {

                console.error(
                    '[LOGGER FAILURE]',
                    error
                );
            }
        }
    );
}

module.exports = {
    logError
};
