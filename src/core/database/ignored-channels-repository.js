/**
 * Title: ignored-channels-repository.js
 * Author: Tango Hunter
 * Date Created: 6/11/26
 * Description: Repository for channels for SYNARA to ignore for activity/observation.
 */

const pool = require('./postgres');


async function addIgnoredChannel({

    guildId,

    guildName,

    channelId,

    channelName
}) {

    await pool.query(

        `
        INSERT INTO ignored_channels (

            guild_id,

            guild_name,

            channel_id,

            channel_name,

            updated_at
        )

        VALUES (

            $1,

            $2,

            $3,

            $4,

            NOW()
        )

        ON CONFLICT (

            guild_id,

            channel_id
        )

        DO UPDATE

        SET

            channel_name =
                EXCLUDED.channel_name,

            updated_at =
                NOW()
        `,
        [

            guildId,

            guildName,

            channelId,

            channelName
        ]
    );
}

async function removeIgnoredChannel({

    guildId,

    channelId
}) {

    await pool.query(

        `
        DELETE FROM ignored_channels

        WHERE guild_id = $1

        AND channel_id = $2
        `,
        [

            guildId,

            channelId
        ]
    );
}

async function isIgnoredChannel({

    guildId,

    channelId
}) {

    const result =
        await pool.query(

            `
            SELECT 1

            FROM ignored_channels

            WHERE guild_id = $1

            AND channel_id = $2
            `,
            [

                guildId,

                channelId
            ]
        );

    return (
        result.rows.length > 0
    );
}

async function getIgnoredChannels(
    guildId
) {

    const result =
        await pool.query(

            `
            SELECT *

            FROM ignored_channels

            WHERE guild_id = $1

            ORDER BY channel_name
            `,
            [guildId]
        );

    return result.rows;
}

/*
====================================
DELETE GUILD DATA
====================================
*/

async function deleteGuildIgnoredChannels(
    guildId
) {

    await pool.query(

        `
        DELETE FROM ignored_channels

        WHERE guild_id = $1
        `,

        [
            guildId
        ]
    );

}

module.exports = {
    addIgnoredChannel,
    removeIgnoredChannel,
    isIgnoredChannel,
    getIgnoredChannels,
    deleteGuildIgnoredChannels
};
