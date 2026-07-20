/**
 * Title: content-creators-repository.js
 * Author: Tango Hunter
 * Date Created: 7/17/26
 * Description: Database operations for Content Creator Announcements.
 */

const pool = require('./postgres');


/*
====================================
GETTERS
====================================
*/

async function getGuildCreators({

    guildId

}) {

    const result = await pool.query(

        `
        SELECT *

        FROM content_creators

        WHERE guild_id = $1

        ORDER BY

            discord_user_id,

            platform,

            creator_display_name
        `,

        [

            guildId

        ]
    );

    return result.rows;
}

async function getCreatorsByUser({

    guildId,

    discordUserId

}) {

    const result = await pool.query(

        `
        SELECT *

        FROM content_creators

        WHERE

            guild_id = $1

            AND discord_user_id = $2

        ORDER BY

            platform,

            creator_display_name
        `,

        [

            guildId,

            discordUserId

        ]
    );

    return result.rows;
}

async function getCreatorsByPlatform({

    platform

}) {

    const result = await pool.query(

        `
        SELECT *

        FROM content_creators

        WHERE platform = $1

        ORDER BY

            creator_display_name
        `,

        [

            platform

        ]
    );

    return result.rows;
}

async function getCreator({

    guildId,

    platform,

    accountIdentifier

}) {

    const result = await pool.query(

        `
        SELECT *

        FROM content_creators

        WHERE

            guild_id = $1

            AND platform = $2

            AND account_identifier = $3

        LIMIT 1
        `,

        [

            guildId,

            platform,

            accountIdentifier

        ]
    );

    return result.rows[0] ?? null;

}

/*
====================================
CREATE / UPDATE
====================================
*/

async function createCreator({

    guildId,

    discordChannelId,

    discordUserId,

    platform,

    accountIdentifier,

    creatorDisplayName,

    messageTemplate,

    subscriptionExpiresAt

}) {

    const result = await pool.query(

        `
        INSERT INTO content_creators (

            guild_id,

            discord_channel_id,

            discord_user_id,

            platform,

            account_identifier,

            creator_display_name,

            message_template,

            subscription_expires_at

        )

        VALUES (

            $1,

            $2,

            $3,

            $4,

            $5,

            $6,

            $7,

            $8

        )

        RETURNING *
        `,

        [

            guildId,

            discordChannelId,

            discordUserId,

            platform,

            accountIdentifier,

            creatorDisplayName,

            messageTemplate,

            subscriptionExpiresAt

        ]
    );

    return result.rows[0];

}

async function updateCreator({

    guildId,

    platform,

    accountIdentifier,

    discordChannelId,

    creatorDisplayName,

    messageTemplate

}) {

    const result = await pool.query(

        `
        UPDATE content_creators

        SET

            discord_channel_id = $4,

            creator_display_name = $5,

            message_template = $6,

            updated_at = NOW()

        WHERE

            guild_id = $1

            AND platform = $2

            AND account_identifier = $3

        RETURNING *
        `,

        [

            guildId,

            platform,

            accountIdentifier,

            discordChannelId,

            creatorDisplayName,

            messageTemplate

        ]
    );

    return result.rows[0] ?? null;
}

async function updateLastContentId({

    guildId,

    platform,

    accountIdentifier,

    lastContentId

}) {

    await pool.query(

        `
        UPDATE content_creators

        SET

            last_content_id = $4,

            updated_at = NOW()

        WHERE

            guild_id = $1

            AND platform = $2

            AND account_identifier = $3
        `,

        [

            guildId,

            platform,

            accountIdentifier,

            lastContentId

        ]
    );
}

/*
====================================
DELETE
====================================
*/

async function deleteCreator({

    guildId,

    platform,

    accountIdentifier

}) {

    await pool.query(

        `
        DELETE FROM content_creators

        WHERE

            guild_id = $1

            AND platform = $2

            AND account_identifier = $3
        `,

        [

            guildId,

            platform,

            accountIdentifier

        ]
    );
}

async function removeGuildCreators({

    guildId

}) {

    await pool.query(

        `
        DELETE FROM content_creators

        WHERE guild_id = $1
        `,

        [

            guildId

        ]
    );
}

module.exports = {
    getGuildCreators,
    getCreatorsByUser,
    getCreatorsByPlatform,
    getCreator,
    createCreator,
    updateCreator,
    updateLastContentId,
    deleteCreator,
    removeGuildCreators
};
