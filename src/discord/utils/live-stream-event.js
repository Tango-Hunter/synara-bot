/**
 * Title: live-stream-event.js
 * Author: Tango Hunter
 * Date Created: 6/24/26
 * Description: Creates Discord events for live streams.
 */

const {
    GuildScheduledEventEntityType,
    GuildScheduledEventPrivacyLevel
} = require('discord.js');

const {
    getGuildSetting
} = require('../../core/database/guild-settings-repository');

const {
    logFeature
} = require('../../core/logging/logger');


const pendingOfflineEvents = new Map();


/*
====================================
FIND LIVE EVENT
====================================
*/
async function findLiveStreamEvent(
    guild
) {

    const events =

        await guild.scheduledEvents.fetch();

    return events.find(

        event =>

            event.entityType ===
                GuildScheduledEventEntityType.External

            &&

            event.name.endsWith(
                'is Live!'
            )
    );
}

/*
====================================
CREATE EVENT
====================================
*/
async function createLiveStreamEvent({

    guild,

    twitchLogin,

    streamTitle,

    streamCategory
}) {

    const existingEvent =
        await findLiveStreamEvent(
            guild
        );

    if (
        existingEvent
    ) {

        return existingEvent;
    }

    const serverLeaderId =
        await getGuildSetting({

            guildId:
                guild.id,

            settingName:
                'server_leader'
        });

    if (
        !serverLeaderId
    ) {

        return null;
    }

    const member =
        await guild.members.fetch(
            serverLeaderId
        )
        .catch(
            () => null
        );

    if (
        !member
    ) {

        return null;
    }

    const leaderName =
        member.displayName;

    const startTime = new Date();

    const endTime =
        new Date(

            Date.now()

            +

            12 * 60 * 60 * 1000
        );

    const event =

        await guild.scheduledEvents.create({

            name:
                `${leaderName} is Live!`,

            scheduledStartTime:
                startTime,

            scheduledEndTime:
                endTime,

            privacyLevel:
                GuildScheduledEventPrivacyLevel.GuildOnly,

            entityType:
                GuildScheduledEventEntityType.External,

            entityMetadata: {

                location:
                    `https://twitch.tv/${twitchLogin}`
            },

            description:

`Category:
${streamCategory}

Title:
${streamTitle}`
        });

    logFeature({

        category:
            'TWITCH_EVENT',

        message:
            'Discord live event created',

        details: {

            guildId:
                guild.id,

            eventId:
                event.id,

            leader:
                leaderName,

            twitchLogin
        }
    });

    return event;
}

/*
====================================
DELETE EVENT
====================================
*/
async function deleteLiveStreamEvent(
    guild
) {

    const event =

        await findLiveStreamEvent(
            guild
        );

    if (
        !event
    ) {

        return;
    }

    await event.delete();

    logFeature({

        category:
            'TWITCH_EVENT',

        message:
            'Discord live event deleted',

        details: {

            guildId:
                guild.id,

            eventId:
                event.id
        }
    });
}

/*
====================================
START OFFLINE TIMER
====================================
*/
function startOfflineCooldown({

    guild
}) {

    const existingTimer =
        pendingOfflineEvents.get(
            guild.id
        );

    if (
        existingTimer
    ) {

        clearTimeout(
            existingTimer
        );
    }

    const timer =
        setTimeout(

            async () => {

                try {

                    await deleteLiveStreamEvent(
                        guild
                    );
                }

                finally {

                    pendingOfflineEvents.delete(
                        guild.id
                    );
                }

            },

            5 * 60 * 1000
        );

    pendingOfflineEvents.set(

        guild.id,

        timer
    );
}

/*
====================================
CANCEL OFFLINE TIMER
====================================
*/
function cancelOfflineCooldown(
    guildId
) {

    const timer =
        pendingOfflineEvents.get(
            guildId
        );

    if (
        !timer
    ) {

        return;
    }

    clearTimeout(
        timer
    );

    pendingOfflineEvents.delete(
        guildId
    );
}

module.exports = {
    createLiveStreamEvent,
    deleteLiveStreamEvent,
    startOfflineCooldown,
    cancelOfflineCooldown
};
