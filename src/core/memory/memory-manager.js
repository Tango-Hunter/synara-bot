/**
 * Title: memory-manager.js
 * Author: Tango Hunter
 * Date Created: 5/21/26
 * Date Modified: 5/22/26
 * Description: Handles conversational memory retrieval and storage.
 */

const {
    loadMemory,
    saveMemory
} = require('./memory-store');

const {
    memoryConfig
} = require('../config/memory-config');

function getUserMemory({

    platform,
    userId
}) {

    const memory =
        loadMemory(
            platform
        );

    return (
        memory[userId] || []
    );
}

function addUserMemory({

    platform,
    userId,
    username,
    messageContent

}) {

    if (
        !memoryConfig.enabled
    ) {

        return;
    }

    const memory =
        loadMemory(
            platform
        );

    if (
        !memory[userId]
    ) {

        memory[userId] = [];
    }

    const userMemory =
        memory[userId];

    userMemory.push({

        timestamp:
            new Date().toISOString(),

        username,
        message:
            messageContent.slice(
                0,
                memoryConfig.maxMemoryLength
            )
    });

    while (

        userMemory.length >
        memoryConfig.maxMemoriesPerUser
    ) {

        userMemory.shift();
    }

    saveMemory({
        platform,
        memoryData:
            memory
    });
}

function buildMemoryContext({
    platform,
    userId
}) {

    const memories =
        getUserMemory({
            platform,
            userId
        });

    if (
        memories.length === 0
    ) {

        return '';
    }

    const recentMemories =
        memories.slice(
            -memoryConfig.recentConversationLimit
        );

    return recentMemories

        .map(memory =>
            `${memory.username}: ${memory.message}`
        )

        .join('\n');
}

module.exports = {
    getUserMemory,
    addUserMemory,
    buildMemoryContext
};
