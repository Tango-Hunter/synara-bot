/**
 * Title: trivia-session-manager.js
 * Author: Tango Hunter
 * Date Created: 5/25/26
 * Date Modified: 5/25/26
 * Description: Manages a single trivia session per channel.
 */

const activeTriviaSessions =
    new Map();

function createTriviaSession({

    channelId,
    userId,
    correctAnswer,
    messageId
}) {

    activeTriviaSessions.set(

        channelId,

        {
            userId,
            correctAnswer:
                correctAnswer
                    .toLowerCase()
                    .trim(),

            messageId,

            createdAt:
                Date.now()
        }
    );
}

function getTriviaSession(
    channelId
) {

    return activeTriviaSessions.get(
        channelId
    );
}

function removeTriviaSession(
    channelId
) {

    activeTriviaSessions.delete(
        channelId
    );
}

module.exports = {
    createTriviaSession,
    getTriviaSession,
    removeTriviaSession
};
