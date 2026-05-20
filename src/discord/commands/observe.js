/**
 * Title: observe.js
 * Author: Tango Hunter
 * Date Created: 5/16/26
 * Date Modified: 5/19/26
 * Description: Prompt for the !observe command.
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

async function runObserveCommand({

    username,

    platform

}) {

    const systemPrompt =
        buildSystemPrompt();

    const userPrompt = `

Generate a thoughtful observational statement as SYNARA.

Requirements:

- Focus on human behavior, emotions, habits, creativity, ambition, relationships, or patterns
- Tone should feel intelligent, calm, reflective, and slightly analytical
- Keep under 120 words
- Avoid sounding judgmental
- Avoid repetitive phrasing
- Make it feel like a genuine observation rather than a quote
- Occasionally reference systems, signals, momentum, or patterns naturally

Current User:
${username}

Current Platform:
${platform}
`;

    return await generateResponse({

        systemPrompt,

        userPrompt,

        //temperature: 0.95,

        maxTokens: 300
    });
}

module.exports = {
    runObserveCommand
};
