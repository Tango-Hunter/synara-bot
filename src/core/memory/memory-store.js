/**
 * Title: memory-store.js
 * Author: Tango Hunter
 * Date Created: 5/21/26
 * Date Modified: 5/22/26
 * Description: Persistent platform-specific conversational memory storage.
 */

const fs = require('fs');

const path = require('path');

function getMemoryPath(
    platform
) {

    return path.join(
        __dirname,
        `../../../data/${platform}-memory.json`
    );
}

function ensureMemoryFileExists(
    platform
) {

    const memoryPath =
        getMemoryPath(
            platform
        );

    const dataDirectory =
        path.dirname(
            memoryPath
        );

    if (
        !fs.existsSync(
            dataDirectory
        )
    ) {

        fs.mkdirSync(
            dataDirectory,
            { recursive: true }
        );
    }

    if (
        !fs.existsSync(
            memoryPath
        )
    ) {

        fs.writeFileSync(
            memoryPath,
            JSON.stringify({})
        );
    }
}

function loadMemory(
    platform
) {

    ensureMemoryFileExists(
        platform
    );

    const memoryPath =
        getMemoryPath(
            platform
        );

    const rawData =
        fs.readFileSync(
            memoryPath,
            'utf8'
        );

    return JSON.parse(
        rawData
    );
}

function saveMemory({

    platform,
    memoryData
}) {

    const memoryPath =
        getMemoryPath(
            platform
        );

    fs.writeFileSync(

        memoryPath,
        JSON.stringify(
            memoryData,
            null,
            2
        )
    );
}

module.exports = {
    loadMemory,
    saveMemory
};
