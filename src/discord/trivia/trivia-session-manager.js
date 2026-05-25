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
    channel,
    userId,
    correctAnswer,
    answerMap,
    messageId
}) {

    const timeoutId =

        setTimeout(

            async () => {

                const session =

                    activeTriviaSessions.get(
                        channelId
                    );

                if (
                    !session
                ) {

                    return;
                }

                try {

                    const channel =

                        session.channel;

                    await channel.send(

                        `Trivia session expired. The correct answer was: ${correctAnswer}`
                    );

                } catch (error) {

                    console.error(
                        error
                    );
                }

                activeTriviaSessions.delete(
                    channelId
                );

            },

            5 * 60 * 1000
        );

    activeTriviaSessions.set(

        channelId,

        {
            userId,

            correctAnswer:
                correctAnswer
                    .toLowerCase()
                    .trim(),

            answerMap,

            messageId,

            timeoutId,

            channel,

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
