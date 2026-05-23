/**
 * Title: status.js
 * Author: Tango Hunter
 * Date Created: 5/16/26
 * Date Modified: 5/23/26
 * Description: Prompt for the !status command.
 */

const {
    generateResponse
} = require('../../core/services/openai-service');

const {
    buildSystemPrompt
} = require('../../synara/cognition/prompt-builder');

const {
    buildEmbed
} = require('../services/embed-builder');

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
- Avoid repeating previous terminology or report structures

Current User:
${username}

Current Platform:
${platform}
`;

    const response =
        await generateResponse({

            systemPrompt,
            userPrompt,
            //temperature: 0.9,
            maxTokens: 180
        });

    const finalResponse =

        response ||

        'System visibility partially degraded. Operational insight unavailable.';

    const embed =
        buildEmbed({

            type:
                'status',
            title:
                'System Status',
            description:
                finalResponse
        });

    return {
        embed
    };
}

module.exports = {
    runStatusCommand
};
