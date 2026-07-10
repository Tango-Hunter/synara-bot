/**
 * Title: setup-session.js
 * Author: Tango Hunter
 * Date Created: 7/8/26
 * Description: Stores setup sessions while the SYNARA Setup Wizard is active.
 */

const {
    getToggleableFeatures
} = require("../../utils/registry-renderer");


const setupSessions = new Map();

/*
====================================
CREATE SESSION
====================================
*/

function createSession({

    guildId,
    guildName,
    ownerId,
    ownerName

}) {

    const session = {

        guildId,

        guildName,

        ownerId,

        ownerName,

        startedAt:
            Date.now(),

        /*
        ====================================
        Current Wizard State
        ====================================
        */

        featureIndex:

            0,

        /*
        ====================================
        Registry Data
        ====================================
        */

        featureIds:

            getToggleableFeatures(),

        /*
        ====================================
        Configuration
        ====================================
        */

        settings:
            {},

        featureSettings:
            {},

        enabledFeatures:
            [],

        disabledFeatures:
            [],

        /*
        ====================================
        Temporary Selection
        ====================================
        */

        pendingFeature:
            null,

        pendingSelections:
            {}

    };

    setupSessions.set(

        guildId,

        session

    );

    return session;
}

/*
====================================
GET SESSION
====================================
*/

function getSession(
    guildId
) {

    return setupSessions.get(

        guildId

    ) || null;

}

/*
====================================
UPDATE SESSION
====================================
*/

function updateSession(
    guildId,
    updates
) {

    const session =

        getSession(

            guildId

        );

    if (
        !session
    ) {
        return null;
    }

    Object.assign(

        session,
        updates

    );

    return session;
}

/*
====================================
DELETE SESSION
====================================
*/

function deleteSession(
    guildId
) {

    return setupSessions.delete(

        guildId

    );
}

/*
====================================
ADVANCE FEATURE
====================================
*/

function advanceFeature(
    guildId
) {

    const session =

        getSession(

            guildId

        );

    if (
        !session
    ) {
        return null;
    }

    session.featureIndex++;

    session.pendingFeature =

        null;

    session.pendingSelections =

        {};

    return session;

}

/*
====================================
RESET FEATURE STATE
====================================
*/

function resetFeatureState(
    guildId
) {

    const session =

        getSession(

            guildId

        );

    if (
        !session
    ) {
        return null;
    }

    session.featureSettings = {};

    session.pendingFeature = null;

    return session;

}

/*
====================================
CURRENT FEATURE
====================================
*/

function getCurrentFeature(
    guildId
) {

    const session =

        getSession(

            guildId

        );

    if (
        !session
    ) {
        return null;
    }

    return (

        session.featureIds[

            session.featureIndex

        ] || null

    );
}

/*
====================================
FEATURES REMAINING
====================================
*/

function hasRemainingFeatures(
    guildId
) {

    const session =

        getSession(

            guildId

        );

    if (
        !session
    ) {
        return false;
    }

    return (

        session.featureIndex

        <

        session.featureIds.length

    );
}

/*
====================================
OWNER CHECK
====================================
*/

function isSessionOwner(

    guildId,
    userId

) {

    const session =

        getSession(

            guildId

        );

    if (
        !session
    ) {
        return false;
    }

    return (

        session.ownerId ===

        userId

    );
}

module.exports = {
    createSession,
    getSession,
    updateSession,
    deleteSession,
    advanceFeature,
    resetFeatureState,
    getCurrentFeature,
    hasRemainingFeatures,
    isSessionOwner
};
