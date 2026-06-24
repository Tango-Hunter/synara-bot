/**
 * Title: event-recurrence.js
 * Author: Tango Hunter
 * Date Created: 6/21/26
 * Description: Calculates recurring event dates.
 */

function calculateNextRun({

    currentDate,

    recurrence
}) {

    const nextRun =

        new Date(
            currentDate
        );

    switch (
        recurrence
    ) {

        case 'DAILY':

            nextRun.setDate(
                nextRun.getDate() + 1
            );

            break;

        case 'WEEKLY':

            nextRun.setDate(
                nextRun.getDate() + 7
            );

            break;

        case 'BIWEEKLY':

            nextRun.setDate(
                nextRun.getDate() + 14
            );

            break;

        case 'MONTHLY':

            nextRun.setMonth(
                nextRun.getMonth() + 1
            );

            break;

        case 'YEARLY':

            nextRun.setFullYear(
                nextRun.getFullYear() + 1
            );

            break;

        default:

            return null;
    }

    return nextRun;
}

module.exports = {
    calculateNextRun
};
