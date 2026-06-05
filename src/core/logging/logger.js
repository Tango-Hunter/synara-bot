/**
 * Title: logger.js
 * Author: Tango Hunter
 * Date Created: 5/13/26
 * Date Modified: 5/20/26
 * Description: Centralized structured logging system.
 */

const fs = require('fs');

const path = require('path');

const logDirectory =
    path.join(
        __dirname,
        '../../../logs'
    );

const errorLogPath =
    path.join(
        logDirectory,
        'errors.log'
    );

const commandLogPath =
    path.join(
        logDirectory,
        'commands.log'
    );

const systemLogPath =
    path.join(
        logDirectory,
        'system.log'
    );

if (
    !fs.existsSync(
        logDirectory
    )
) {
    fs.mkdirSync(
        logDirectory,
        { recursive: true }
    );
}

const logFiles = [
    errorLogPath,
    commandLogPath,
    systemLogPath
];

for (const filePath of logFiles) {
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(
            filePath,
            ''
        );
    }
}

function buildLogEntry({

    type,
    source,
    message,
    details = null

}) {

    return {

        timestamp:
            new Date().toISOString(),

        type,
        source,
        message,
        details
    };
}

function logError({

    type,
    source,
    message,
    details = null

}) {

    const logEntry =
        buildLogEntry({

            type,
            source,
            message,
            details
        });

    console.error(
        JSON.stringify(
            logEntry,
            null,
            2
        )
    );

    fs.appendFileSync(

        errorLogPath,
        JSON.stringify(
            logEntry
        ) + '\n'
    );
}

function logInfo({

    source,
    message,
    details = null

}) {

    const logEntry =
        buildLogEntry({

            type: 'INFO',
            source,
            message,
            details
        });

    console.log(
        JSON.stringify(
            logEntry,
            null,
            2
        )
    );

    fs.appendFileSync(
        systemLogPath,
        JSON.stringify(
            logEntry
        ) + '\n'
    );
}

function logCommand({

    command,
    username,
    channelId

}) {

    const logEntry =
        buildLogEntry({

            type:
                'COMMAND',
            source:
                'discord-command',
            message:
                `${username} used ${command}`,

            details: {
                username,
                command,
                channelId
            }
        });

    console.log(
        JSON.stringify(
            logEntry,
            null,
            2
        )
    );

    fs.appendFileSync(

        commandLogPath,
        JSON.stringify(
            logEntry
        ) + '\n'
    );
}

// Railway Logs
function logFeature({
    category,
    message,
    details
}) {

    if (
        !category
    ) {
        throw new Error(
            'logFeature requires category'
        );
    }

    if (
        !message
    ) {
        throw new Error(
            'logFeature requires message'
        );
    }

    if (
        !details
    ) {
        throw new Error(
            'logFeature requires details'
        );
    }

    console.log(
        `[${category}] ${message}`
    );

    console.log(
        JSON.stringify(
            details,
            null,
            2
        )
    );
}

module.exports = {
    logError,
    logInfo,
    logCommand,
    logFeature
};
