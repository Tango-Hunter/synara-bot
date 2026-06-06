/**
 * Title: trivia.js
 * Author: Tango Hunter
 * Date Created: 5/25/26
 * Date Modified: 5/25/26
 * Description: Prompt for the !trivia command.
 */

const {
    buildEmbed
} = require('../services/embed-builder');

const {
    fetchTriviaQuestion
} = require('../trivia/trivia-service');

const {
    createTriviaSession
} = require('../trivia/trivia-session-manager');

const {
    logFeature
} = require('../../core/logging/logger');


async function handleTriviaCommand({

    userId
}) {

    const trivia =
        await fetchTriviaQuestion();

    const answers = [

        trivia.correctAnswer,

        ...trivia.incorrectAnswers
    ]

        .sort(
            () =>

                Math.random() - 0.5
        );

    const answerMap = {};

    answers.forEach(

        (
            answer,
            index
        ) => {

            const letter =

                String.fromCharCode(

                    65 + index
                );

            answerMap[letter] =
                answer;
        }
    );

    const answerText =

        answers

            .map(

                (
                    answer,
                    index
                ) =>

                    `${

                        String.fromCharCode(

                            65 + index
                        )

                    }. ${answer}`
            )

            .join(
                '\n'
            );

    const embed =
        buildEmbed({

            type:
                'trivia',

            title:
                'Trivia Challenge',

            description:
`
Category:
${trivia.category}

Difficulty:
${trivia.difficulty}

Question:
${trivia.question}

${answerText}

Reply directly to this message with your answer.
`
        });

    logFeature({

        category:
            'TRIVIA',

        message:
            'Trivia session created',

        details: {

            userId,

            category:
                trivia.category,

            difficulty:
                trivia.difficulty
        }
    });

    return {

        embed,

        triviaData: {

            correctAnswer:
                trivia.correctAnswer,

            answerMap
        }
    };
}

module.exports = {
    handleTriviaCommand
};
