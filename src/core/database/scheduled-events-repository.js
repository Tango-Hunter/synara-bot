/**
 * Title: scheduled-events-repository.js
 * Author: Tango Hunter
 * Date Created: 6/21/26
 * Description: Repository for scheduled events.
 */

const pool = require('./postgres');

/*
====================================
CREATE EVENT
====================================
*/
async function createScheduledEvent(
    event
) {

    await pool.query(

        `
        INSERT INTO scheduled_events (

            event_id,

            guild_id,

            title,

            description,

            channel_id,

            next_run,

            recurrence,

            author_id,

            approved,

            active,

            reminder_24h_sent,

            reminder_1h_sent,

            created_at
        )

        VALUES (

            $1,

            $2,

            $3,

            $4,

            $5,

            $6,

            $7,

            $8,

            true,

            true,

            false,

            false,

            NOW()
        )
        `,
        [

            event.eventId,

            event.guildId,

            event.title,

            event.description,

            event.channelId,

            event.nextRun,

            event.recurrence,

            event.authorId
        ]
    );
}

/*
====================================
GET EVENT
====================================
*/
async function getScheduledEvent(
    eventId
) {

    const result =

        await pool.query(

            `
            SELECT *

            FROM scheduled_events

            WHERE event_id = $1
            `,
            [
                eventId
            ]
        );

    return result.rows[0] || null;
}

/*
====================================
GET USER EVENTS
====================================
*/
async function getUserScheduledEvents({

    guildId,

    authorId
}) {

    const result =

        await pool.query(

            `
            SELECT *

            FROM scheduled_events

            WHERE guild_id = $1

            AND author_id = $2

            ORDER BY next_run
            `,
            [

                guildId,

                authorId
            ]
        );

    return result.rows;
}

/*
====================================
APPROVE EVENT
====================================
*/
async function approveScheduledEvent(
    eventId
) {

    await pool.query(

        `
        UPDATE scheduled_events

        SET approved = true

        WHERE event_id = $1
        `,
        [
            eventId
        ]
    );
}

/*
====================================
PAUSE EVENT
====================================
*/
async function pauseScheduledEvent(
    eventId
) {

    await pool.query(

        `
        UPDATE scheduled_events

        SET active = false

        WHERE event_id = $1
        `,
        [
            eventId
        ]
    );
}

/*
====================================
RESUME EVENT
====================================
*/
async function resumeScheduledEvent(
    eventId
) {

    await pool.query(

        `
        UPDATE scheduled_events

        SET active = true

        WHERE event_id = $1
        `,
        [
            eventId
        ]
    );
}

/*
====================================
DELETE EVENT
====================================
*/
async function deleteScheduledEvent(
    eventId
) {

    await pool.query(

        `
        DELETE FROM scheduled_events

        WHERE event_id = $1
        `,
        [
            eventId
        ]
    );
}

/*
====================================
UPDATE NEXT RUN
====================================
*/
async function updateNextRun({

    eventId,

    nextRun
}) {

    await pool.query(

        `
        UPDATE scheduled_events

        SET

            next_run = $2,

            reminder_24h_sent = false,

            reminder_1h_sent = false

        WHERE event_id = $1
        `,
        [

            eventId,

            nextRun
        ]
    );
}

/*
====================================
DUE EVENTS
====================================
*/
async function getDueEvents() {

    const result =

        await pool.query(

            `
            SELECT *

            FROM scheduled_events

            WHERE approved = true

            AND active = true

            AND next_run <= NOW()
            `
        );

    return result.rows;
}

/*
====================================
MARK 24H REMINDER SENT
====================================
*/
async function mark24HourReminderSent(
    eventId
) {

    await pool.query(

        `
        UPDATE scheduled_events

        SET reminder_24h_sent = true

        WHERE event_id = $1
        `,
        [
            eventId
        ]
    );
}

/*
====================================
MARK 1H REMINDER SENT
====================================
*/
async function mark1HourReminderSent(
    eventId
) {

    await pool.query(

        `
        UPDATE scheduled_events

        SET reminder_1h_sent = true

        WHERE event_id = $1
        `,
        [
            eventId
        ]
    );
}

/*
====================================
24 HOUR REMINDERS
====================================
*/
async function getEventsNeeding24HourReminder() {

    const result =

        await pool.query(

            `
            SELECT *

            FROM scheduled_events

            WHERE

                approved = true

                AND active = true

                AND reminder_24h_sent = false

                AND next_run <= NOW() + INTERVAL '24 hours'

                AND next_run > NOW()
            `
        );

    return result.rows;
}

/*
====================================
1 HOUR REMINDERS
====================================
*/
async function getEventsNeeding1HourReminder() {

    const result =

        await pool.query(

            `
            SELECT *

            FROM scheduled_events

            WHERE

                approved = true

                AND active = true

                AND reminder_1h_sent = false

                AND next_run <= NOW() + INTERVAL '1 hour'

                AND next_run > NOW()
            `
        );

    return result.rows;
}

/*
====================================
SET ACTIVE STATUS
====================================
*/
async function setScheduledEventActive({

    eventId,

    active
}) {

    await pool.query(

        `
        UPDATE scheduled_events

        SET active = $2

        WHERE event_id = $1
        `,
        [

            eventId,

            active
        ]
    );
}

/*
====================================
SKIP EVENT
====================================
*/
async function skipScheduledEvent({

    eventId,

    nextRun
}) {

    await pool.query(

        `
        UPDATE scheduled_events

        SET

            next_run = $2,

            reminder_24h_sent = false,

            reminder_1h_sent = false

        WHERE event_id = $1
        `,
        [

            eventId,

            nextRun
        ]
    );
}

/*
====================================
UPDATE EVENT
====================================
*/
async function updateScheduledEvent({

    eventId,

    title,

    description,

    channelId,

    nextRun,

    recurrence
}) {

    await pool.query(

        `
        UPDATE scheduled_events

        SET

            title = $2,

            description = $3,

            channel_id = $4,

            next_run = $5,

            recurrence = $6

        WHERE event_id = $1
        `,
        [

            eventId,

            title,

            description,

            channelId,

            nextRun,

            recurrence
        ]
    );
}

module.exports = {
    createScheduledEvent,
    getScheduledEvent,
    getUserScheduledEvents,
    approveScheduledEvent,
    pauseScheduledEvent,
    resumeScheduledEvent,
    deleteScheduledEvent,
    updateNextRun,
    getDueEvents,
    mark24HourReminderSent,
    mark1HourReminderSent,
    getEventsNeeding24HourReminder,
    getEventsNeeding1HourReminder,
    setScheduledEventActive,
    skipScheduledEvent,
    updateScheduledEvent
};
