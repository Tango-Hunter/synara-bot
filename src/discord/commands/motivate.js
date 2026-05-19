/**
 * Title: motivate.js
 * Author: Tango Hunter
 * Date Created: 5/16/26
 * Date Modified: 5/19/26
 * Description: Prompt for the !motivate command.
 */

const {

    generateResponse

} = require(

    '../../core/services/openai-service'
);

const {

    buildSystemPrompt

} = require(

    '../../synara/cognition/prompt-builder'
);

async function runMotivateCommand({

    username,

    platform

}) {

    const systemPrompt =
        buildSystemPrompt();

    const userPrompt = `

Generate a short motivational reflection as SYNARA.

Requirements:

- Feel emotionally grounded and sincere
- Include a real quote from a historical figure, philosopher, scientist, author, or leader
- Keep under 140 words
- Avoid generic productivity language
- Avoid sounding corporate or robotic
- Make the reflection feel cohesive and thoughtful
- Maintain subtle calm AI personality
- Vary themes daily

Current User:
${username}

Current Platform:
${platform}
`;

    return await generateResponse({

        systemPrompt,

        userPrompt,

        //temperature: 0.85,

        maxTokens: 250
    });
}

module.exports = {
    runMotivateCommand
};
