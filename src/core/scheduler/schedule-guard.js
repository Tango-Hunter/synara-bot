/**
 * Title: scheduler-guard.js
 * Author: Tango Hunter
 * Date Created: 5/20/26
 * Date Modified: 5/20/26
 * Description: Prevents duplicate scheduler registration.
 */

const activeSchedulers =
    new Set();

function registerScheduler(
    schedulerName
) {

    if (
        activeSchedulers.has(
            schedulerName
        )
    ) {

        return false;
    }

    activeSchedulers.add(
        schedulerName
    );

    return true;
}

module.exports = {
    registerScheduler
};
