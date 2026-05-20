/**
 * Title: motivational-scheduler.js
 * Author: Tango Hunter
 * Date Created: 5/19/26
 * Date Modified: 5/19/26
 * Description: Creates Schedule for the motivational prompt.
 */

const cron = require('node-cron');

const {
    generateResponse
} = require('../../core/services/openai-service');

const {
    buildSystemPrompt
} = require('../../synara/cognition/prompt-builder');

const {
    sendDiscordMessage
} = require('../services/post-message');

async function runNightlyMessage() {

    try {

        console.log(

            '[NIGHTLY MESSAGE] Generating message...'
        );

        const systemPrompt =
            buildSystemPrompt();

        const userPrompt = `

Generate a nightly reflective message as SYNARA.

Requirements:

- Include a REAL quote from a historical or modern public figure
- The quote must feel meaningful and emotionally grounded
- Themes may include:
  resilience,
  growth,
  discipline,
  purpose,
  failure,
  ambition,
  reflection,
  mortality,
  creativity,
  perseverance,
  wisdom,
  human nature
- Avoid fake inspirational language
- Avoid corporate motivational tone
- Avoid excessive optimism
- The response should feel calm, intelligent, and reflective
- Keep under 180 words
- Include a short SYNARA reflection before or after the quote
- Maintain SYNARA personality
- Avoid emojis
- Avoid hashtags
`;

        const response =
            await generateResponse({
                systemPrompt,
                userPrompt,
                maxTokens: 320
            });

        const channelIds = [
            '1430018485408366740', // Void Army #general
            '1416462288575135746', // Hunter's Lodge #general
        ];

        for (const channelId of channelIds) {

            await sendDiscordMessage({
                channelId,
                message: response
            });

            console.log(
                `[NIGHTLY MESSAGE] Posted to ${channelId}`
            );
        }

        console.log(
            '[NIGHTLY MESSAGE] Posted successfully.'
        );

    } catch (error) {

        console.error(
            '[NIGHTLY MESSAGE ERROR]',
            error
        );
    }
}

function startNightlyMessageScheduler() {

    cron.schedule(

        '0 20 * * *',

        async () => {
            await runNightlyMessage();

        },

        {
            timezone:
                'America/New_York'
        }
    );

    console.log(
        '[SCHEDULER] Nightly Message Scheduler Active'
    );
}

module.exports = {
    startNightlyMessageScheduler,
    runNightlyMessage
};
