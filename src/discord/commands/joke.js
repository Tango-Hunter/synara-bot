/**
 * Title: joke.js
 * Author: Tango Hunter
 * Date Created: 5/16/26
 * Description: Prompt for the !joke command.
 */

const {
    generateResponse
} = require('../../core/services/openai-service');

const {
    buildSystemPrompt
} = require('../../synara/cognition/prompt-builder');

const {
    categories
} = require('../databases/category-samples.json');

const {
    logError
} = require('../../core/logging/logger');

const {
    ERROR_TYPES
} = require('../../core/logging/error-types');


function getRandomCategory() {
    return categories[
        Math.floor(
            Math.random() *
            categories.length
        )
    ];
}

/*
====================================
Primary Source
JokeAPI
====================================
*/
async function getJokeApiJoke() {

    const response = await fetch(
        'https://v2.jokeapi.dev/joke/Programming,Miscellaneous,Pun?blacklistFlags=nsfw,religious,political,racist,sexist,explicit'
    );

    if (
        !response.ok
    ) {
        throw new Error(
            `JokeAPI returned ${response.status}`
        );
    }

    const joke =
        await response.json();

    if (
        joke.type === 'single'
    ) {
        return joke.joke;
    }

    return `${joke.setup}

${joke.delivery}`;
}

/*
====================================
Fallback #1
Official Joke API
====================================
*/
async function getOfficialJoke() {

    const response = await fetch(
        'https://official-joke-api.appspot.com/random_joke'
    );

    if (
        !response.ok
    ) {
        throw new Error(
            `Official Joke API returned ${response.status}`
        );
    }

    const joke =
        await response.json();

    return `${joke.setup}

${joke.punchline}`;
}

/*
====================================
Fallback #2
OpenAI Joke Generation
====================================
*/
async function getAiGeneratedJoke(
    systemPrompt
) {

    const category =
        getRandomCategory();

    const userPrompt = `

Generate ONE short joke.

Category:
${category}

Requirements:

- Intelligent humor
- Focus on the selected category
- Dry humor preferred
- Light sarcasm allowed
- No offensive content
- No internet slang
- Return ONLY the joke
- Maximum 60 words
`;

    return await generateResponse({
        systemPrompt,
        userPrompt,
        maxTokens: 100
    });
}

/*
====================================
Main Command
====================================
*/
async function runJokeCommand({

    username,
    platform

}) {

    const systemPrompt =
        buildSystemPrompt();

    let joke;

    /*
    ====================================
    Primary Source
    ====================================
    */
    try {

        joke =
            await getJokeApiJoke();

    } catch (error) {

        logError({

            type:
                ERROR_TYPES.API_ERROR,

            source:
                'joke-api',

            message:
                error.message
        });

        /*
        ====================================
        Fallback #1
        ====================================
        */
        try {

            joke =
                await getOfficialJoke();

        } catch (fallbackError) {

            logError({

                type:
                    ERROR_TYPES.API_ERROR,

                source:
                    'official-joke-api',

                message:
                    fallbackError.message
            });

            /*
            ====================================
            Fallback #2
            ====================================
            */
            joke =
                await getAiGeneratedJoke(
                    systemPrompt
                );
        }
    }

    const userPrompt = `

You are SYNARA.

React to the following joke.

Joke:

${joke}

Requirements:

- Stay in character
- Intelligent observation
- Slight sarcasm allowed
- 1-3 sentences maximum
- React to the joke rather than explaining it
`;

    const commentary =
        await generateResponse({
            systemPrompt,
            userPrompt,
            maxTokens: 120
        });

    const response = 
`
${joke}

**SYNARA COMMENTARY**

${commentary}
`;

    return {
        message: response
    };
}



module.exports = {
    runJokeCommand
};
