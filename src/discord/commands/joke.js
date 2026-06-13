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


function getRandomCategory() {
    return categories[
        Math.floor(
            Math.random() *
            categories.length
        )
    ];
}

async function runJokeCommand({

    username,
    platform

}) {

    const systemPrompt =
        buildSystemPrompt();

    const category =
        getRandomCategory();

    let userPrompt = `

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

    const joke =
        await generateResponse({

            systemPrompt,
            userPrompt,
            maxTokens: 100
        });

    userPrompt = `

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

    const jokeResponse =
        await generateResponse({

            systemPrompt,
            userPrompt,
            maxTokens: 120
        });

    const response = `
    
${joke}

**SYNARA COMMENTARY**

${jokeResponse}
`;

    return {
        message: response
    };
}

module.exports = {
    runJokeCommand
};
