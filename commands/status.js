/**
 * Title: status.js
 * Author: Tango Hunter
 * Date Created: 5/16/26
 * Date Modified: 5/16/26
 * Description: Prompt for the !status command.
 */

const { sendToN8N } = require('../services/webhook-service');

async function runStatusCommand() {

    const prompt = `
Generate a fictional SYNARA system status report.

Requirements:
- Should feel immersive and atmospheric
- Blend AI/system terminology with subtle emotional intelligence
- Can reference community activity, emotional analysis, behavioral patterns, energy levels, momentum, focus, or signal integrity
- Avoid sounding like real diagnostics
- Keep under 120 words
- Slightly playful but still intelligent
- Vary structure and terminology often
`;

    return await sendToN8N({
        content: prompt
    });
}

module.exports = {
    runStatusCommand
};
