/**
 * Title: trivia-reply-handler.js
 * Author: Tango Hunter
 * Date Created: 5/25/26
 * Date Modified: 5/25/26
 * Description: Handles reply validation for the trivia game and updates scores accordingly.
 */

const {
    getTriviaSession,
    removeTriviaSession
} = require('./trivia-session-manager');

const {
    getRandomCorrectResponse,
    getRandomIncorrectResponse
} = require('./trivia-responses');

const {
    addWin,
    breakStreak
} = require('./leaderboard-service');

const {
    normalizeAnswer
} = require('./normalize-answer');


async function handleTriviaReply(
    message
) {

    /*
    ============================
    MUST BE A REPLY
    ============================
    */

    if (
        !message.reference
    ) {

        return false;
    }

    const session =
        getTriviaSession(

            message.channel.id
        );

    if (
        !session
    ) {

        return false;
    }

    /*
    ============================
    MUST MATCH TRIVIA MESSAGE
    ============================
    */

    if (

        message.reference.messageId !==

        session.messageId
    ) {

        return false;
    }

    const userAnswer =

        normalizeAnswer(
            message.content
        );

    /*
    ============================
    LETTER ANSWERS
    ============================
    */

    let resolvedAnswer =
        userAnswer;

    const upperAnswer =

        userAnswer.toUpperCase();

    if (
        session.answerMap[
            upperAnswer
        ]
    ) {

        resolvedAnswer =

            normalizeAnswer(

                session.answerMap[
                    upperAnswer
                ]
            );
    }

    const correctAnswer =

        normalizeAnswer(

            session.correctAnswer
        );

    /*
    ============================
    CORRECT
    ============================
    */

    if (
        resolvedAnswer ===
        correctAnswer
    ) {

        await addWin(
            message.author.id
        );

        clearTimeout(
            session.timeoutId
        );

        removeTriviaSession(
            message.channel.id
        );

        await message.reply(

            getRandomCorrectResponse()
        );

        return true;
    }

    /*
    ============================
    INCORRECT
    ============================
    */

    await breakStreak(
        message.author.id
    );

    await message.reply(

        getRandomIncorrectResponse()
    );

    return true;
    }

module.exports = {
    handleTriviaReply
};
