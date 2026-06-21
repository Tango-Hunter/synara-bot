/**
 * Title: event-id.js
 * Author: Tango Hunter
 * Date Created: 6/21/26
 * Description: Generates unique event IDs.
 */

function generateEventId() {

    const random =

        Math.random()

            .toString(36)

            .substring(
                2,
                8
            )

            .toUpperCase();

    return `evt_${random}`;
}

module.exports = {
    generateEventId
};
