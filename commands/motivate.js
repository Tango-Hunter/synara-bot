/**
 * Title: motivate.js
 * Author: Tango Hunter
 * Date Created: 5/16/26
 * Date Modified: 5/16/26
 * Description: Prompt for the !motivate command.
 */

const { sendToN8N } = require('../services/webhook-service');

async function runMotivateCommand(username) {

    const prompt = `
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
`;

    return await sendToN8N({
        content: prompt,
        username
    });
}

module.exports = {
    runMotivateCommand
};
