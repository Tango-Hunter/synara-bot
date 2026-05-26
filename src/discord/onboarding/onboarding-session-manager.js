/**
 * Title: onboarding-session-manager.js
 * Author: Tango Hunter
 * Date Created: 5/26/26
 * Date Modified: 5/26/26
 * Description: Handles onboarding session.
 */

const onboardingMessages =
    new Map();

function storeOnboardingMessage({

    userId,
    messageId
}) {

    onboardingMessages.set(

        userId,

        messageId
    );
}

function getOnboardingMessage(
    userId
) {

    return onboardingMessages.get(
        userId
    );
}

function removeOnboardingMessage(
    userId
) {

    onboardingMessages.delete(
        userId
    );
}

module.exports = {
    storeOnboardingMessage,
    getOnboardingMessage,
    removeOnboardingMessage
};
