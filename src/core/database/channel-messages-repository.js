/**
 * Title: channel-messages-repository.js
 * Author: Tango Hunter
 * Date Created: 6/27/26
 * Description: Stores persistent channel messages.
 */

const pool = require('./postgres');


/*
====================================
CREATE
====================================
*/

async function createChannelMessage({

    guildId,

    channelId,

    type,

    content,

    discordMessageId,

    createdBy

}) {

    await pool.query(

        `
        INSERT INTO channel_messages (

            guild_id,

            channel_id,

            type,

            content,

            discord_message_id,

            created_by,

            updated_by

        )

        VALUES (

            $1,

            $2,

            $3,

            $4,

            $5,

            $6,

            $6
        )
        `,

        [

            guildId,

            channelId,

            type,

            content,

            discordMessageId,

            createdBy
        ]
    );
}

/*
====================================
GET
====================================
*/

async function getChannelMessage({

    guildId,

    channelId,

    type

}) {

    const result =

        await pool.query(

            `
            SELECT *

            FROM channel_messages

            WHERE guild_id = $1

            AND channel_id = $2

            AND type = $3
            `,

            [

                guildId,

                channelId,

                type
            ]
        );

    return result.rows[0] ?? null;
}

/*
====================================
UPDATE
====================================
*/

async function setChannelMessage({

    guildId,

    channelId,

    type,

    content,

    discordMessageId,

    updatedBy

}) {

    await pool.query(

        `
        UPDATE channel_messages

        SET

            content = $4,

            discord_message_id = $5,

            updated_by = $6,

            updated_at = NOW()

        WHERE guild_id = $1

        AND channel_id = $2

        AND type = $3
        `,

        [

            guildId,

            channelId,

            type,

            content,

            discordMessageId,

            updatedBy
        ]
    );
}

/*
====================================
DELETE
====================================
*/

async function deleteChannelMessage({

    guildId,

    channelId,

    type

}) {

    await pool.query(

        `
        DELETE FROM channel_messages

        WHERE guild_id = $1

        AND channel_id = $2

        AND type = $3
        `,

        [

            guildId,

            channelId,

            type
        ]
    );
}

module.exports = {
    createChannelMessage,
    getChannelMessage,
    setChannelMessage,
    deleteChannelMessage
};
