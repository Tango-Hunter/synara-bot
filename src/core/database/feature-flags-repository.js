/**
 * Title: feature-flags-repository.js
 * Author: Tango Hunter
 * Date Created: 6/6/26
 * Description: Repository for guild feature flags.
 */

const pool = require('./postgres');

const {
    logFeature
} = require('../logging/logger');


async function getFeatureFlag({

    guildId,

    featureName
}) {

    const result =

        await pool.query(

            `
            SELECT enabled

            FROM feature_flags

            WHERE guild_id = $1

            AND feature_name = $2
            `,
            [

                guildId,

                featureName
            ]
        );

    if (

        result.rows.length === 0
    ) {

        return false;
    }

    return result.rows[0].enabled;
}

async function featureFlagExists({

    guildId,

    featureName
}) {

    const result =

        await pool.query(

            `
            SELECT 1

            FROM feature_flags

            WHERE guild_id = $1

            AND feature_name = $2
            `,
            [

                guildId,

                featureName
            ]
        );

    return result.rows.length > 0;
}

async function setFeatureFlag({

    guildId,

    guildName,

    featureName,

    enabled
}) {

    await pool.query(

        `
        INSERT INTO feature_flags (

            guild_id,

            guild_name,

            feature_name,

            enabled,

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

            feature_name
        )

        DO UPDATE

        SET

            guild_name = EXCLUDED.guild_name,

            enabled = EXCLUDED.enabled,

            updated_at = NOW()
        `,
        [

            guildId,

            guildName,

            featureName,

            enabled
        ]
    );
}

async function getAllFeatureFlags(
    guildId
) {

    const result =

        await pool.query(

            `
            SELECT

                feature_name,

                enabled

            FROM feature_flags

            WHERE guild_id = $1

            ORDER BY feature_name
            `,
            [
                guildId
            ]
        );

    return result.rows;
}

async function getEnabledGuilds(
    featureName
) {

    const result =

        await pool.query(

            `
            SELECT guild_id

            FROM feature_flags

            WHERE feature_name = $1

            AND enabled = true
            `,
            [

                featureName
            ]
        );

    return result.rows.map(

        row => row.guild_id
    );
}

async function initializeGuildFeatures({

    guildId,

    guildName
}) {

    const {
        DEFAULT_FEATURE_FLAGS
    } = require('./default-feature-flags');

    for (
        const feature of DEFAULT_FEATURE_FLAGS
    ) {

        const featureName =
            feature.name;

        const exists =
            await featureFlagExists({

                guildId,

                featureName
            });

        if (
            !exists
        ) {
            await setFeatureFlag({

                guildId,

                guildName,

                featureName,

                enabled: false
            });
        }
    }
}

async function initializeAllGuildFeatures(
    client
) {

    for (
        const guild

        of

        client.guilds.cache.values()
    ) {

        await initializeGuildFeatures({

            guildId:
                guild.id,

            guildName:
                guild.name
        });
    }

    logFeature({

        category:
            'FEATURE_FLAGS',

        message:
            'Feature flag verification completed',

        details: {

            guildCount:
                client.guilds.cache.size
        }
    });
}

/*
====================================
DELETE GUILD FEATURES
====================================
*/

async function deleteGuildFeatures(
    guildId
) {

    await pool.query(

        `
        DELETE FROM feature_flags

        WHERE guild_id = $1
        `,

        [
            guildId
        ]
    );

}

module.exports = {
    getFeatureFlag,
    featureFlagExists,
    setFeatureFlag,
    getAllFeatureFlags,
    getEnabledGuilds,
    initializeGuildFeatures,
    initializeAllGuildFeatures,
    deleteGuildFeatures
};
