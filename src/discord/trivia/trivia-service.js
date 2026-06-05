/**
 * Title: trivia-service.js
 * Author: Tango Hunter
 * Date Created: 5/25/26
 * Date Modified: 5/25/26
 * Description: Performs the API call to retrieve the trivia question and answers.
 */

const axios = require('axios');

const he = require('he');

const {
    logFeature
} = require('../../core/logging/logger');


async function fetchTriviaQuestion() {

    const endpoints = [

        'https://opentdb.com/api.php?amount=1&type=multiple',

        'https://opentdb.com/api.php?amount=1&type=boolean'
    ];

    const endpoint =

        endpoints[

            Math.floor(

                Math.random() *

                endpoints.length
            )
        ];

    const response =
        await axios.get(
            endpoint
        );

    const question =
        response.data.results[0];

    logFeature({

        category:
            'TRIVIA',

        message:
            'Trivia question retrieved',

        details: {

            category:
                question.category,

            difficulty:
                question.difficulty,

            type:
                question.type
        }
    });

    return {

        question:
            he.decode(
                question.question
            ),

        correctAnswer:
            he.decode(
                question.correct_answer
            ),

        incorrectAnswers:

            question.incorrect_answers.map(

                answer =>

                    he.decode(
                        answer
                    )
            ),

        difficulty:
            question.difficulty,

        category:
            question.category,

        type:
            question.type
    };
}

module.exports = {
    fetchTriviaQuestion
};
