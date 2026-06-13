/**
 * Title: fact.js
 * Author: Tango Hunter
 * Date Created: 5/16/26
 * Description: Prompt for the !fact command.
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

async function runFactCommand({

    username,
    platform

}) {

    const systemPrompt =
        buildSystemPrompt();
    
    const category =
        getRandomCategory();

    let userPrompt = `

Generate ONE fascinating and accurate fact.

Category:
${category}

Requirements:

- Must be true
- Must be interesting
- Focus on the selected category
- Avoid common overused facts
- Return ONLY the fact
- Maximum 75 words
`;

    const fact =
        await generateResponse({

            systemPrompt,
            userPrompt,
            maxTokens: 100
        });

    userPrompt = `

You are SYNARA.

Analyze the following fact.

Fact:

${fact}

Requirements:

- Remain in character
- Intelligent
- Analytical
- Slightly witty
- Do not repeat the fact
- 1-3 sentences maximum
`;

    const factResponse =
        await generateResponse({

            systemPrompt,
            userPrompt,
            maxTokens: 120
        });

    const response =`

${fact}

**SYNARA ANALYSIS**

${factResponse}
`;

    return {
        message: response
    };
}

module.exports = {
    runFactCommand
};
