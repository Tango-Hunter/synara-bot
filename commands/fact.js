/**
 * Title: fact.js
 * Author: Tango Hunter
 * Date Created: 5/16/26
 * Date Modified: 5/16/26
 * Description: Prompt for the !fact command.
 */

const { sendToN8N } = require('../services/webhookService');

async function runFactCommand() {

    const prompt = `
Generate a fascinating short fact as SYNARA.

Requirements:
- Must be true and accurate
- Topics can include science, history, psychology, space, technology, biology, or strange human behavior
- Keep under 120 words
- Make it feel intelligent and conversational
- Avoid sounding like trivia website copy
- Occasionally include subtle observational commentary
- Avoid repetitive openings
- Do not use emojis or hashtags
`;

    return await sendToN8N({
        content: prompt
    });
}

module.exports = {
    runFactCommand
};
