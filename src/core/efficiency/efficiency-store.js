/**
 * Title: efficiency-store.js
 * Author: Tango Hunter
 * Date Created: 5/23/26
 * Date Modified: 5/23/26
 *  Description: Persistent efficiency score storage.
 */

const fs = require('fs');

const path = require('path');

const efficiencyPath = path.join(
    __dirname,
    '../../../data/discord-efficiency.json'
);

function ensureEfficiencyFileExists() {

    const dataDirectory =
        path.dirname(
            efficiencyPath
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
            efficiencyPath
        )
    ) {

        fs.writeFileSync(
            efficiencyPath,
            JSON.stringify({})
        );
    }
}

function loadEfficiencyData() {

    ensureEfficiencyFileExists();

    const rawData =
        fs.readFileSync(
            efficiencyPath,
            'utf8'
        );

    return JSON.parse(
        rawData
    );
}

function saveEfficiencyData(
    data
) {

    fs.writeFileSync(

        efficiencyPath,
        JSON.stringify(
            data,
            null,
            2
        )
    );
}

module.exports = {
    loadEfficiencyData,
    saveEfficiencyData
};
