/**
 * Title: fact.js
 * Author: Tango Hunter
 * Date Created: 5/16/26
 * Date Modified: 5/19/26
 * Description: Prompt for the !fact command.
 */

const {
    generateResponse
} = require('../../core/services/openai-service');

const {
    buildSystemPrompt
} = require('../../synara/cognition/prompt-builder');

async function runFactCommand({

    username,
    platform

}) {

    const systemPrompt =
        buildSystemPrompt();

    const userPrompt = `

Generate a fascinating short fact as SYNARA.

Requirements:

- Must be true and accurate
- Topics can include:
  science,
  history,
  psychology,
  space,
  technology,
  biology,
  or strange human behavior
- Keep under 120 words
- Make it feel intelligent and conversational
- Avoid sounding like trivia website copy
- Occasionally include subtle observational commentary
- Avoid repetitive openings
- Do not use emojis or hashtags

Current User:
${username}

Current Platform:
${platform}
`;

    const response =
        await generateResponse({

            systemPrompt,
            userPrompt,
            maxTokens: 150
        });

    return {
        message: response
    };
}

module.exports = {
    runFactCommand
};
