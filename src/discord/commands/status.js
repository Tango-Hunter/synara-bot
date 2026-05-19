/**
 * Title: status.js
 * Author: Tango Hunter
 * Date Created: 5/16/26
 * Date Modified: 5/19/26
 * Description: Prompt for the !status command.
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

async function runStatusCommand({

    username,

    platform

}) {

    const systemPrompt =
        buildSystemPrompt();

    const userPrompt = `

Generate a fictional SYNARA system status report.

Requirements:

- Should feel immersive and atmospheric
- Blend AI/system terminology with subtle emotional intelligence
- Can reference community activity, emotional analysis, behavioral patterns, energy levels, momentum, focus, or signal integrity
- Avoid sounding like real diagnostics
- Keep under 120 words
- Slightly playful but still intelligent
- Vary structure and terminology often

Current User:
${username}

Current Platform:
${platform}
`;

    return await generateResponse({

        systemPrompt,

        userPrompt,

        //temperature: 0.9,

        maxTokens: 180
    });
}

module.exports = {
    runStatusCommand
};
