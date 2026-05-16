/**
 * Title: joke.js
 * Author: Tango Hunter
 * Date Created: 5/16/26
 * Date Modified: 5/16/26
 * Description: Prompt for the !joke command.
 */

const { sendToN8N } = require('../services/webhook-service');

async function runJokeCommand(username) {

    const prompt = `
Generate a short joke or humorous observation as SYNARA.

Requirements:
- Humor should be intelligent, dry, observational, or lightly sarcastic
- Avoid meme humor
- Avoid cringe internet slang
- Avoid offensive jokes
- Humor should feel subtly AI flavored
- Keep under 100 words
- Occasionally reference humans, systems, patterns, technology, or behavior
- Make responses varied and natural
`;

    return await sendToN8N({
        content: prompt,
        username
    });
}

module.exports = {
    runJokeCommand
};
