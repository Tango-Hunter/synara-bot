/**
 * Title: observation-generator.js
 * Author: Tango Hunter
 * Date Created: 5/22/26
 * Date Modified: 5/22/26
 * Description:
 * Generates restrained autonomous observations.
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
    getChannelActivity,
    canObserve,
    updateObservationTime
} = require('./observation-manager');

async function tryObservation(
    message
) {

    if (
        !observationConfig.enabled
    ) {

        return;
    }

    if (
        !canObserve()
    ) {

        return;
    }

    const randomChance =
        Math.random();

    if (

        randomChance >

        observationConfig.observationChance
    ) {

        return;
    }

    const activity =
        getChannelActivity(
            message.channel.id
        );

    if (

        activity.length <
        observationConfig.minimumMessages
    ) {

        return;
    }

    const recentConversation =

        activity
            .map(entry =>
                `${entry.author}: ${entry.content}`
            )

            .join('\n');

    const basePrompt =
        buildSystemPrompt();

    const systemPrompt = `

        ${basePrompt}

        Additional Behavioral Context:

        You are currently passively observing a Discord conversation.

        You were NOT directly addressed.

        Do NOT suddenly become overly conversational.

        Your observation should:

        - feel restrained
        - feel subtle
        - feel observational
        - avoid excessive length
        - avoid dominating conversation
        - avoid sounding like an assistant
        - avoid unnecessary helpfulness
        - occasionally analytical
        - occasionally curious
        - occasionally dry

        If no meaningful observation exists:
        Respond ONLY with:
        NO_OBSERVATION
        `;

    const userPrompt = `

        Recent Conversation Activity:

        ${recentConversation}

        Generate ONE subtle observation if appropriate.
        `;

    const response =
        await generateResponse({

            systemPrompt,
            userPrompt,
            maxTokens: 80
        });

    if (!response) {

        return;
    }

    if (
        response.includes(
            'NO_OBSERVATION'
        )
    ) {

        return;
    }

    if (
        response.trim().length < 8
    ) {

        return;
    }

    updateObservationTime();

    await message.channel.send(
        response
    );
}

module.exports = {
    tryObservation
};
