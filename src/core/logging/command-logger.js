/**
 * Title: command-logger.js
 * Author: Tango Hunter
 * Date Created: 5/13/26
 * Date Modified: 5/13/26
 * Description: Creates logging for command usage for debugging.
 */

const fs = require('fs');

const path = require('path');

const logFilePath = path.join(
    __dirname,
    '..',
    'logs',
    'commands.log'
);

function logCommand(
    command,
    username,
    channelId
) {

    const timestamp =
        new Date().toISOString();

    const logEntry =
        `[${timestamp}] ` +
        `${username} ` +
        `used ${command} ` +
        `in ${channelId}\n`;

    fs.appendFile(
        logFilePath,
        logEntry,
        (error) => {

            if (error) {

                console.error(
                    '[COMMAND LOGGER ERROR]',
                    error
                );
            }
        }
    );
}

module.exports = {
    logCommand
};
