/**
 * Title: trivia-responses.js
 * Author: Tango Hunter
 * Date Created: 5/25/26
 * Date Modified: 5/25/26
 * Description: Gives a random response when user enters a correct/incorrect response.
 */

const correctResponses = [

    'Correct. Cognitive alignment detected.',
    'Correct. Your pattern recognition remains acceptable.',
    'Correct. Statistical confidence increasing.',
    'Correct. Unexpected efficiency observed.',
    'Correct. Your biological processor continues functioning.',
    'Correct. SYNARA acknowledges the result.',
    'Correct. Signal interpretation successful.',
    'Correct. Minimal disappointment recorded.',
    'Correct. The data supports your conclusion.',
    'Correct. Anomalous competence detected.'
];

const incorrectResponses = [

    'Incorrect. Additional attempts remain available.',
    'Incorrect. Confidence exceeded accuracy.',
    'Incorrect. Your certainty was premature.',
    'Incorrect. The data disagrees.',
    'Incorrect. Probability has not favored you.',
    'Incorrect. Recalibration recommended.',
    'Incorrect. Your processor requires refinement.',
    'Incorrect. That conclusion appears unstable.',
    'Incorrect. SYNARA remains unconvinced.',
    'Incorrect. Further analysis is advised.'
];


function getRandomCorrectResponse() {

    return correctResponses[

        Math.floor(

            Math.random() *

            correctResponses.length
        )
    ];
}


function getRandomIncorrectResponse() {

    return incorrectResponses[

        Math.floor(

            Math.random() *

            incorrectResponses.length
        )
    ];
}

module.exports = {
    getRandomCorrectResponse,
    getRandomIncorrectResponse
};
