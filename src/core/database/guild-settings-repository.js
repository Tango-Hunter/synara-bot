/**
 * Title: guild-settings-repository.js
 * Author: Tango Hunter
 * Date Created: 6/7/26
 * Description: Repository for guild settings.
 */

const pool =
    require('./postgres');

const {
    logFeature
} = require('../logging/logger');


async function settingExists({

    guildId,

    settingName
}) {

    const result =

        await pool.query(

            `
            SELECT 1

            FROM guild_settings

            WHERE guild_id = $1

            AND setting_name = $2
            `,
            [

                guildId,

                settingName
            ]
        );

    return result.rows.length > 0;
}

async function getGuildSetting({

    guildId,

    settingName
}) {

    const result =
        await pool.query(

            `
            SELECT setting_value

            FROM guild_settings

            WHERE guild_id = $1

            AND setting_name = $2
            `,
            [

                guildId,

                settingName
            ]
        );

    if (
        result.rows.length === 0
    ) {
        return null;
    }

    const value =
        result.rows[0].setting_value;

    try {
        return JSON.parse(
            value
        );
    }

    catch {
        return value;
    }
}

async function setGuildSetting({

    guildId,

    guildName,

    settingName,

    settingValue
}) {

    const value =
        typeof settingValue === 'object'

            ? JSON.stringify(
                settingValue
            )

            : settingValue;

    await pool.query(

        `
        INSERT INTO guild_settings (

            guild_id,

            guild_name,

            setting_name,

            setting_value,

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

            setting_name
        )

        DO UPDATE

        SET

            guild_name = EXCLUDED.guild_name,

            setting_value = EXCLUDED.setting_value,

            updated_at = NOW()
        `,
        [

            guildId,

            guildName,

            settingName,

            value
        ]
    );
}

async function getAllGuildSettings(
    guildId
) {

    const result =

        await pool.query(

            `
            SELECT

                setting_name,

                setting_value

            FROM guild_settings

            WHERE guild_id = $1

            ORDER BY setting_name
            `,
            [

                guildId
            ]
        );

    return result.rows.map(

        row => {

            try {
                row.setting_value =
                    JSON.parse(
                        row.setting_value
                    );
            }

            catch {
                // leave as string
            }
            return row;
        }
    );
}

async function initializeGuildSettings({

    guildId,

    guildName
}) {

    const {
        DEFAULT_GUILD_SETTINGS
    } = require('./default-guild-settings');

    for (

        const setting

        of

        DEFAULT_GUILD_SETTINGS
    ) {

        const exists =
            await settingExists({

                guildId,

                settingName:
                    setting.name
            });

        if (
            !exists
        ) {
            await setGuildSetting({

                guildId,

                guildName,

                settingName:
                    setting.name,

                settingValue:
                    null
            });
        }
    }
}

async function initializeAllGuildSettings(
    client
) {

    for (

        const guild

        of

        client.guilds.cache.values()
    ) {

        await initializeGuildSettings({

            guildId:
                guild.id,

            guildName:
                guild.name
        });
    }

    logFeature({

        category:
            'GUILD_SETTINGS',

        message:
            'Guild settings verification completed',

        details: {

            guildCount:
                client.guilds.cache.size
        }
    });
}

module.exports = {
    settingExists,
    getGuildSetting,
    setGuildSetting,
    getAllGuildSettings,
    initializeGuildSettings,
    initializeAllGuildSettings
};
