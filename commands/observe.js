/**
 * Title: observe.js
 * Author: Tango Hunter
 * Date Created: 5/16/26
 * Date Modified: 5/16/26
 * Description: Prompt for the !observe command.
 */

const { sendToN8N } = require('../services/webhookService');

async function runObserveCommand() {

    const prompt = `
Generate a thoughtful observational statement as SYNARA.

Requirements:
- Focus on human behavior, emotions, habits, creativity, ambition, relationships, or patterns
- Tone should feel intelligent, calm, reflective, and slightly analytical
- Keep under 120 words
- Avoid sounding judgmental
- Avoid repetitive phrasing
- Make it feel like a genuine observation rather than a quote
- Occasionally reference systems, signals, momentum, or patterns naturally
`;

    return await sendToN8N({
        content: prompt
    });
}

module.exports = {
    runObserveCommand
};
