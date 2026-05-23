/**
 * Title: application-session-store.js
 * Author: Tango Hunter
 * Date Created: 5/23/26
 * Date Modified: 5/23/26
 * Description:  Temporary application session storage.
 */


const applicationSessions =
    new Map();

function createSession(userId) {

    applicationSessions.set(

        userId,

        {}
    );
}

function updateSession(userId, data) {

    const existingData =

        applicationSessions.get(userId) ||

        {};

    applicationSessions.set(

        userId,

        {

            ...existingData,
            ...data
        }
    );
}

function getSession(userId) {
    return applicationSessions.get(userId);
}

function clearSession(userId) {
    applicationSessions.delete(userId);
}

module.exports = {
    createSession,
    updateSession,
    getSession,
    clearSession
};
