/**
 * Title: openai-service.js
 * Author: Tango Hunter
 * Date Created: 5/19/26
 * Date Modified: 5/19/26
 * Description: OpenAI Response Service.
 */

const OpenAI = require('openai');

const openai = new OpenAI({

    apiKey: process.env.OPENAI_API_KEY
});

async function generateResponse({

    systemPrompt,

    userPrompt,

    //temperature = 0.8,

    maxTokens = 500

}) {

    try {

        const completion =
            await openai.chat.completions.create({

                model: 'gpt-5.5',

                messages: [

                    {
                        role: 'system',
                        content: systemPrompt
                    },

                    {
                        role: 'user',
                        content: userPrompt
                    }
                ],

                //temperature,

                max_completion_tokens: maxTokens
            });

        return completion
            .choices[0]
            .message
            .content;

    } catch (error) {

        console.error(

            '[OPENAI SERVICE ERROR]',

            error
        );

        return (
            'System interruption detected.'
        );
    }
}

module.exports = {
    generateResponse
};
