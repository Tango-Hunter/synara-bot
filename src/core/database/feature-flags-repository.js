/**
 * Title: feature-flags-repository.js
 * Author: Tango Hunter
 * Date Created: 6/6/26
 * Description: Repository for guild feature flags.
 */

const pool = require('./postgres');


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

async function getGuildFeatures(
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
            `,
            [

                guildId
            ]
        );

    const features = {};

    for (

        const row

        of

        result.rows
    ) {

        features[
            row.feature_name
        ] = row.enabled;
    }

    return features;
}

async function initializeGuildFeatures({

    guildId,

    guildName
}) {

    const {
        DEFAULT_FEATURE_FLAGS
    } = require('./default-feature-flags');

    for (

        const featureName

        of

        DEFAULT_FEATURE_FLAGS
    ) {

        await setFeatureFlag({

            guildId,

            guildName,

            featureName,

            enabled: true
        });
    }
}

module.exports = {
    getFeatureFlag,
    setFeatureFlag,
    getGuildFeatures,
    initializeGuildFeatures
};
