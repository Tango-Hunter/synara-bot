/**
 * Title: migrate-guild-configs.js
 * Author: Tango Hunter
 * Date Created: 6/7/26
 * Description: Migrates guild-config.js settings into guild_settings table.
 */

require(
    'dotenv'
).config();

const {
    guildConfig
} = require(
    '../config/guild-config'
);

const {
    setGuildSetting
} = require(
    './guild-settings-repository'
);

const {
    logFeature
} = require(
    '../logging/logger'
);

async function migrateGuildConfigs() {

    logFeature({

        category:
            'GUILD_SETTINGS',

        message:
            'Starting guild settings migration',

        details: {

            guildCount:
                Object.keys(
                    guildConfig
                ).length
        }
    });

    for (

        const [

            guildId,

            guildSettings

        ]

        of

        Object.entries(
            guildConfig
        )
    ) {

        const guildName =

            guildSettings.name ||
            'Unknown Guild';

        const settings = {

            // ============================
            // Onboarding
            // ============================

            role_verified:
                guildSettings.onboarding
                    ?.verifiedRoleId,

            channel_welcome:
                guildSettings.onboarding
                    ?.welcomeChannelId,

            channel_roles:
                guildSettings.onboarding
                    ?.rolesChannelId,

            channel_intro:
                guildSettings.onboarding
                    ?.introChannelId,

            // ============================
            // Moderation
            // ============================

            channel_modapps_apply:
                guildSettings.moderation
                    ?.modappApplyChannelId,

            message_modapps_apply:
                guildSettings.moderation
                    ?.modappApplyMessageId,

            channel_modapps_submissions:
                guildSettings.moderation
                    ?.modappSubmissionsChannelId,

            roles_admin:
                guildSettings.moderation
                    ?.adminRoleIds,

            roles_moderator:
                guildSettings.moderation
                    ?.moderatorRoleIds,

            // ============================
            // Streaming
            // ============================

            channel_stream_leadership:
                guildSettings.streaming
                    ?.leadershipLiveChannelId,

            channel_stream_selfpromo:
                guildSettings.streaming
                    ?.selfPromoChannelId,

            // ============================
            // Schedulers
            // ============================

            channel_qotd:
                guildSettings.schedulers
                    ?.qotdChannelId,

            channel_motivational:
                guildSettings.schedulers
                    ?.nightlyChannelId,

            channel_logs:
                guildSettings.schedulers
                    ?.logsChannelId
        };

        for (

            const [

                settingName,

                settingValue

            ]

            of

            Object.entries(
                settings
            )
        ) {

            if (

                settingValue === undefined
            ) {

                continue;
            }

            await setGuildSetting({

                guildId,

                guildName,

                settingName,

                settingValue
            });

            logFeature({

                category:
                    'GUILD_SETTINGS',

                message:
                    'Setting migrated',

                details: {

                    guildId,

                    guildName,

                    settingName
                }
            });
        }
    }

    logFeature({

        category:
            'GUILD_SETTINGS',

        message:
            'Guild settings migration completed',

        details: {

            guildCount:
                Object.keys(
                    guildConfig
                ).length
        }
    });

    process.exit(
        0
    );
}

migrateGuildConfigs()

    .catch(

        error => {

            console.error(
                error
            );

            process.exit(
                1
            );
        }
    );
