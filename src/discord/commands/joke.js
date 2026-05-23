/**
 * Title: joke.js
 * Author: Tango Hunter
 * Date Created: 5/16/26
 * Date Modified: 5/19/26
 * Description: Prompt for the !joke command.
 */

const {
    generateResponse
} = require('../../core/services/openai-service');

const {
    buildSystemPrompt
} = require('../../synara/cognition/prompt-builder');

async function runJokeCommand({

    username,
    platform

}) {

    const systemPrompt =
        buildSystemPrompt();

    const userPrompt = `

Generate a short joke or humorous observation as SYNARA.

Requirements:

- Humor should be intelligent, dry, observational, or lightly sarcastic
- Avoid meme humor
- Avoid cringe internet slang
- Avoid offensive jokes
- Humor should feel subtly AI flavored
- Keep under 100 words
- Occasionally reference humans, systems, patterns, technology, or behavior
- Make responses varied and natural

Current User:
${username}

Current Platform:
${platform}
`;

    const response =
        await generateResponse({

            systemPrompt,
            userPrompt,
            maxTokens: 120
        });

    return {
        message: response
    };
}

module.exports = {
    runJokeCommand
};
