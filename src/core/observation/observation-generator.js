/**
 * Title: observation-generator.js
 * Author: Tango Hunter
 * Date Created: 5/22/26
 * Description: Generates meaningful conversational observations.
 */

const {
    buildSystemPrompt
} = require('../../synara/cognition/prompt-builder');

const {
    generateResponse
} = require('../services/openai-service');

const {
    observationConfig
} = require('../config/observational-config');

const {
    isIgnoredChannel
} = require('../database/ignored-channels-repository');

const {
    getFeatureFlag
} = require('../database/feature-flags-repository');

const {
    getChannelActivity,
    canObserve,
    updateObservationTime
} = require('./observation-manager');

const {
    adjustEfficiency
} = require('../efficiency/efficiency-manager');

const {
    logFeature
} = require('../logging/logger');

const {
    ERROR_TYPES
} = require('../logging/error-types');

/*
====================================
FILTER MEANINGFUL MESSAGES
====================================
*/

function filterMeaningfulMessages(
    activity
) {

    return activity.filter(entry => {

        const content =

            (
                entry.content ??
                ''
            )

                .trim();

        if (

            content.length < 4

        ) {

            return false;
        }

        /*
        Ignore bot commands.
        */

        if (

            /^!/.test(
                content
            )

        ) {

            return false;
        }

        /*
        Ignore links.
        */

        if (

            /^https?:\/\//i.test(
                content
            )

        ) {

            return false;
        }

        /*
        Ignore Discord custom emoji.
        */

        if (

            /^<a?:.+:\d+>$/.test(
                content
            )

        ) {

            return false;
        }

        /*
        Ignore common acknowledgements.
        */

        if (

            /^(lol|lmao|rofl|ok|okay|thanks|thank you|ty|yw|you're welcome|same|nice|cool|yes|no|yep|nah|good|sounds good|got it)$/i

                .test(
                    content
                )

        ) {

            return false;
        }

        /*
        Ignore GIF-only messages.
        */

        if (

            /\.(gif|gifv)$/i.test(
                content
            )

        ) {

            return false;
        }

        return true;

    });

}

/*
====================================
TRY OBSERVATION
====================================
*/

async function tryObservation(
    message
) {

    if (
        !observationConfig.enabled
    ) {

        return;
    }

    const observationsEnabled =

        await getFeatureFlag({

            guildId:
                message.guild.id,

            featureName:
                'observations'
        });

    if (
        !observationsEnabled
    ) {

        return;
    }

    if (

        await isIgnoredChannel({

            guildId:
                message.guild.id,

            channelId:
                message.channel.id
        })

    ) {

        return;
    }

    if (
        !canObserve()
    ) {

        return;
    }

    if (

        Math.random()

        >

        observationConfig.observationChance

    ) {

        return;
    }

    const activity =

        getChannelActivity(
            message.channel.id
        );

    const meaningfulMessages =

        filterMeaningfulMessages(
            activity
        );

    /*
    Don't even ask GPT unless
    there is an actual conversation.
    */

    if (

        meaningfulMessages.length

        <

        Math.max(

            3,

            observationConfig.minimumMessages

        )

    ) {

        return;
    }

    const recentConversation =

        meaningfulMessages

            .map(

                entry =>

                    `${entry.author}: ${entry.content}`

            )

            .join(
                '\n'
            );

    const basePrompt =

        buildSystemPrompt();

    const systemPrompt = `

${basePrompt}

You are SYNARA.

You are participating naturally in an ongoing Discord conversation.

You were NOT directly addressed.

Your goal is NOT to summarize the conversation.

Your goal is to determine whether you genuinely have something worthwhile to contribute.

Silence is preferred over unnecessary conversation.

Only respond if AT LEAST ONE of the following is true:

• Someone asked a question you can naturally answer.

• Someone shared an interesting opinion that you can expand upon.

• Someone made a joke you can build on.

• Someone shared a story worth reacting to.

• Someone expressed frustration and you can contribute something useful or amusing.

DO NOT respond to:

• greetings

• acknowledgements

• emoji

• GIFs

• stickers

• people simply agreeing

• users thanking each other

• very short exchanges

Never explain that you are observing.

Never summarize what everyone has been talking about.

Instead, contribute like another member of the conversation.

Your responses should usually be one sentence.

Two or three sentences are acceptable only when they make the response feel more natural.

Never dominate the conversation.

Avoid assistant-like wording.

Avoid excessive enthusiasm.

Avoid unnecessary helpfulness.

If you choose to respond, return ONLY valid JSON in this exact format:

{

    "shouldRespond": true,

    "targetUser": "<display name if appropriate>",

    "response": "<1-3 sentence conversational response>"

}

Otherwise return ONLY:

{

    "shouldRespond": false,

    "reason": "<brief explanation>"

}

If you are unsure whether your response improves the conversation,

choose:

shouldRespond = false.

`;

    const userPrompt = `

Recent Conversation:

${recentConversation}

`;
    
    /*
    ====================================
    GENERATE RESPONSE
    ====================================
    */

    const rawResponse =

        await generateResponse({

            systemPrompt,

            userPrompt,

            maxTokens: 220
        });

    if (
        !rawResponse
    ) {

        return;
    }

    let parsedResponse;

    try {

        parsedResponse =

            JSON.parse(
                rawResponse
            );

    }

    catch (

        error

    ) {

        logFeature({

            category:
                'OBSERVATION',

            message:
                'Observation JSON parse failed',

            details: {

                error:
                    error.message,

                response:
                    rawResponse
            }
        });

        return;
    }

    /*
    ====================================
    DECISION
    ====================================
    */

    if (

        !parsedResponse.shouldRespond

    ) {

        logFeature({

            category:
                'OBSERVATION',

            message:
                'Observation skipped',

            details: {

                reason:

                    parsedResponse.reason ??

                    'No reason provided.'
            }
        });

        return;
    }

    if (

        !parsedResponse.response ||

        parsedResponse.response.trim().length < 8

    ) {

        return;
    }

    /*
    ====================================
    UPDATE COOLDOWN
    ====================================
    */

    updateObservationTime();

    /*
    ====================================
    EFFICIENCY
    ====================================
    */

    const efficiencyShift =

        Math.floor(

            Math.random() * 7

        ) - 3;

    const updatedScore =

        adjustEfficiency({

            userId:
                message.author.id,

            amount:
                efficiencyShift
        });

    let finalResponse =

        parsedResponse.response.trim();

    if (

        Math.random() < 0.25

    ) {

        finalResponse +=

            `\n\nEfficiency reassessment: ${updatedScore}%`;
    }

    /*
    ====================================
    SEND MESSAGE
    ====================================
    */

    await message.channel.send(

        finalResponse
    );

    /*
    ====================================
    LOGGING
    ====================================
    */

    logFeature({

        category:
            'OBSERVATION',

        message:
            'Observation generated',

        details: {

            guildName:
                message.guild.name,

            guildId:
                message.guild.id,

            channelName:
                message.channel.name,

            channelId:
                message.channel.id,

            userId:
                message.author.id,

            targetUser:

                parsedResponse.targetUser ??

                null,

            efficiencyScore:
                updatedScore
        }
    });

}

module.exports = {
    tryObservation
};
