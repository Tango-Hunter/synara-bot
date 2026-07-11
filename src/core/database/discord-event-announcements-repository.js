/**
 * Title: discord-event-announcements-repository.js
 * Author: Tango Hunter
 * Date Created: 6/22/26
 * Description: Discord event announcement tracking.
 */

const pool = require('./postgres');


/*
====================================
CREATE EVENT
====================================
*/
async function createDiscordEventAnnouncement({

    eventId,

    guildId,

    title,

    description,

    location,

    startTime
}) {

    await pool.query(

        `
        INSERT INTO discord_event_announcements (

            event_id,

            guild_id,

            title,

            description,

            location,

            start_time
        )

        VALUES (

            $1,

            $2,

            $3,

            $4,

            $5,

            $6
        )
        `,
        [

            eventId,

            guildId,

            title,

            description,

            location,

            startTime
        ]
    );
}

/*
====================================
UPDATE EVENT
====================================
*/
async function updateDiscordEventAnnouncement({

    eventId,

    title,

    description,

    location,

    startTime
}) {

    await pool.query(

        `
        UPDATE discord_event_announcements

        SET

            title = $2,

            description = $3,

            location = $4,

            start_time = $5

        WHERE event_id = $1
        `,
        [

            eventId,

            title,

            description,

            location,

            startTime
        ]
    );
}

/*
====================================
DELETE EVENT
====================================
*/
async function deleteDiscordEventAnnouncement(
    eventId
) {

    await pool.query(

        `
        DELETE FROM
            discord_event_announcements

        WHERE event_id = $1
        `,
        [
            eventId
        ]
    );
}

/*
====================================
DUE EVENTS
====================================
*/
async function getDueDiscordEvents() {

    const result =

        await pool.query(

            `
            SELECT *

            FROM discord_event_announcements

            WHERE start_time <= NOW()
            `
        );

    return result.rows;
}

/*
====================================
DELETE GUILD DATA
====================================
*/

async function deleteGuildEvents(
    guildId
) {

    await pool.query(

        `
        DELETE FROM
            discord_event_announcements

        WHERE guild_id = $1
        `,

        [
            guildId
        ]
    );

}

module.exports = {
    createDiscordEventAnnouncement,
    updateDiscordEventAnnouncement,
    deleteDiscordEventAnnouncement,
    getDueDiscordEvents,
    deleteGuildEvents
};
