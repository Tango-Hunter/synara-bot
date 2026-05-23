/**
 * Title: points.js
 * Author: Tango Hunter
 * Date Created: 5/23/26
 * Date Modified: 5/23/26
 * Description: Returns SYNARA efficiency assessment.
 */

const {
    getEfficiencyScore
} = require('../../core/efficiency/efficiency-manager');

const {
    generateResponse
} = require('../../core/services/openai-service');

const {
    buildSystemPrompt
} = require('../../synara/cognition/prompt-builder');

const {
    buildEmbed
} = require('../services/embed-builder');

async function runPointsCommand({

    username,
    userId

}) {

    const score =
        getEfficiencyScore(
            userId
        );

    const systemPrompt =
        buildSystemPrompt();

    const userPrompt = `

Generate a short SYNARA efficiency assessment.

Requirements:

- Reference the user's efficiency score indirectly
- Maintain SYNARA personality
- Slightly analytical
- Slightly observational
- Calm tone
- Subtle humor is acceptable
- Avoid sounding supportive or motivational
- Avoid repeating common phrases
- Keep under 2 sentences
- Avoid emojis
- Avoid hashtags
- Return plain text only
- Do not use markdown
- Do not use bullet points
- Do not use quotation marks
- Keep formatting extremely simple

Efficiency Score:
${score}

User:
${username}
`;

    const assessment =
        await generateResponse({

            systemPrompt,
            userPrompt,
            maxTokens: 150
        });

    const finalAssessment =

        assessment ||
        'Operational assessment remains inconclusive.';

    const embed =
        buildEmbed({

            type:
                'efficiency',
            title:
                'Efficiency Assessment',
            description:
`
Current operational assessment for ${username}:

${score}%

${finalAssessment}
`
        });

    return {
        embed
    };
}

module.exports = {
    runPointsCommand
};
