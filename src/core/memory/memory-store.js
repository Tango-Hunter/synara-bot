/**
 * Title: memory-store.js
 * Author: Tango Hunter
 * Date Created: 5/21/26
 * Date Modified: 5/21/26
 * Description: Persistent conversational memory storage.
 */

const fs = require('fs');

const path = require('path');

const memoryPath =
    path.join(
        __dirname,
        '../../../data/memory.json'
    );

function ensureMemoryFileExists() {

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

function loadMemory() {

    ensureMemoryFileExists();

    const rawData =
        fs.readFileSync(
            memoryPath,
            'utf8'
        );

    return JSON.parse(
        rawData
    );
}

function saveMemory(memoryData) {

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
