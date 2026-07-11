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


/*
====================================
HELPER FUNCTION
====================================
*/
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

/*
====================================
GET GUILD SETTINGS
====================================
*/
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

    if (
        typeof value ===
        'string'

        &&

        value.startsWith(
            '['
        )
    ) {

        try {
            return JSON.parse(
                value
            );
        }

        catch {
            return value;
        }
    }

    return value;
}

/*
====================================
SET GUILD SETTING
====================================
*/
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

/*
====================================
GET ARRAY SETTING
====================================
*/
async function getGuildArraySetting({

    guildId,

    settingName
}) {

    const value =

        await getGuildSetting({

            guildId,

            settingName
        });

    return Array.isArray(
        value
    )

        ? value

        : [];
}

/*
====================================
ADD ARRAY VALUE
====================================
*/
async function addGuildArrayValue({

    guildId,

    guildName,

    settingName,

    value
}) {

    const currentValues =

        await getGuildArraySetting({

            guildId,

            settingName
        });

    if (

        !currentValues.includes(
            value
        )

    ) {

        currentValues.push(
            value
        );
    }

    await setGuildSetting({

        guildId,

        guildName,

        settingName,

        settingValue:
            currentValues
    });

    return currentValues;
}

/*
====================================
REMOVE ARRAY VALUE
====================================
*/
async function removeGuildArrayValue({

    guildId,

    guildName,

    settingName,

    value
}) {

    const currentValues =

        await getGuildArraySetting({

            guildId,

            settingName
        });

    const updatedValues =

        currentValues.filter(

            currentValue =>

                currentValue !== value
        );

    await setGuildSetting({

        guildId,

        guildName,

        settingName,

        settingValue:
            updatedValues
    });

    return updatedValues;
}

/*
====================================
GET ALL SETTINGS
====================================
*/
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

            if (
                typeof row.setting_value ===
                'string'

                &&

                row.setting_value.startsWith(
                    '['
                )
            ) {

                try {
                    row.setting_value =
                        JSON.parse(
                            row.setting_value
                        );
                }

                catch {
                    // leave as string
                }
            }

            return row;
        }
    );
}

/*
====================================
NEW GUILD INIT
====================================
*/
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
            
            logFeature({

                category:
                    'GUILD_SETTINGS',

                message:
                    'Guild setting initialized',

                details: {

                    guildId,

                    guildName,

                    settingName:
                        setting.name
                }
            });
        }
    }
}

/*
====================================
EXISTING GUILD UPDATE
====================================
*/
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

/*
====================================
DELETE GUILD SETTINGS
====================================
*/

async function deleteGuildSettings(
    guildId
) {

    await pool.query(

        `
        DELETE FROM guild_settings

        WHERE guild_id = $1
        `,

        [
            guildId
        ]
    );

}

module.exports = {
    settingExists,
    getGuildSetting,
    setGuildSetting,
    getGuildArraySetting,
    addGuildArrayValue,
    removeGuildArrayValue,
    getAllGuildSettings,
    initializeGuildSettings,
    initializeAllGuildSettings,
    deleteGuildSettings
};
