/**
 * Title: init-database.js
 * Author: Tango Hunter
 * Date Created: 5/25/26
 * Date Modified: 5/25/26
 * Description:  Creates Discord Database Initialization.
 */

const pool =
    require('./postgres');

const {
    logFeature
} = require('../logging/logger');


async function initializeDatabase() {

    await pool.query(`

        CREATE TABLE IF NOT EXISTS trivia_leaderboard (

            user_id TEXT PRIMARY KEY,

            score INTEGER DEFAULT 0,

            streak INTEGER DEFAULT 0,

            best_streak INTEGER DEFAULT 0
        );

    `);

    await pool.query(`

        CREATE TABLE IF NOT EXISTS feature_flags (

            guild_id TEXT NOT NULL,

            guild_name TEXT NOT NULL,

            feature_name TEXT NOT NULL,

            enabled BOOLEAN NOT NULL DEFAULT TRUE,

            updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

            PRIMARY KEY (

                guild_id,

                feature_name
            )
        );

    `);

    await pool.query(`

        CREATE TABLE IF NOT EXISTS guild_settings (

            guild_id TEXT NOT NULL,

            guild_name TEXT NOT NULL,

            setting_name TEXT NOT NULL,

            setting_value TEXT,

            updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

            PRIMARY KEY (

                guild_id,

                setting_name
            )
        );
    `);

    await pool.query(`

        CREATE TABLE IF NOT EXISTS ignored_channels (

            guild_id TEXT NOT NULL,

            guild_name TEXT NOT NULL,

            channel_id TEXT NOT NULL,

            channel_name TEXT NOT NULL,

            updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

            PRIMARY KEY (

                guild_id,

                channel_id
            )
        );

    `);

    await pool.query(`

        CREATE TABLE IF NOT EXISTS community_activity (

            discord_user_id TEXT PRIMARY KEY,

            last_activity_at TIMESTAMP NOT NULL,

            message_count INTEGER DEFAULT 0,

            is_inactive BOOLEAN DEFAULT FALSE,

            joined_at TIMESTAMP DEFAULT NOW(),

            updated_at TIMESTAMP DEFAULT NOW()
        )
    `);

    await pool.query(`

        CREATE TABLE IF NOT EXISTS bonk_counts (

            guild_id TEXT NOT NULL,

            user_id TEXT NOT NULL,

            username TEXT NOT NULL,

            received_count INTEGER NOT NULL DEFAULT 0,

            given_count INTEGER NOT NULL DEFAULT 0,

            updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

            PRIMARY KEY (

                guild_id,

                user_id
            )
        );

    `);

    await pool.query(`

        CREATE TABLE IF NOT EXISTS birthdays (

            guild_id TEXT NOT NULL,

            user_id TEXT NOT NULL,

            month INTEGER NOT NULL,

            day INTEGER NOT NULL,

            created_at TIMESTAMP NOT NULL DEFAULT NOW(),

            updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

            PRIMARY KEY (

                guild_id,

                user_id
            )
        );

    `);

    await pool.query(`

        CREATE TABLE IF NOT EXISTS scheduled_events (

            event_id TEXT PRIMARY KEY,

            guild_id TEXT NOT NULL,

            title TEXT NOT NULL,

            description TEXT,

            channel_id TEXT NOT NULL,

            next_run TIMESTAMP NOT NULL,

            recurrence TEXT NOT NULL,

            author_id TEXT NOT NULL,

            approved BOOLEAN DEFAULT FALSE,

            active BOOLEAN DEFAULT TRUE,

            reminder_24h_sent BOOLEAN DEFAULT FALSE,

            reminder_1h_sent BOOLEAN DEFAULT FALSE,

            created_at TIMESTAMP NOT NULL
        );

    `);

    await pool.query(`

        CREATE TABLE IF NOT EXISTS discord_event_announcements (

            event_id TEXT PRIMARY KEY,

            guild_id TEXT NOT NULL,

            title TEXT NOT NULL,

            description TEXT,

            location TEXT,

            start_time TIMESTAMP NOT NULL,

            created_at TIMESTAMP NOT NULL DEFAULT NOW()
        );

    `);

    await pool.query(`

        CREATE TABLE IF NOT EXISTS nicknames (

            user_id TEXT PRIMARY KEY,

            nickname TEXT NOT NULL,

            updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        );

    `);

    await pool.query(`

        CREATE TYPE channel_message_type AS ENUM (

            'STICKY',

            'FAQ',

            'STATUS'

        );

    `).catch(() => {

        /*
        Enum already exists.
        */

    });

    await pool.query(`

        CREATE TABLE IF NOT EXISTS channel_messages (

            guild_id TEXT NOT NULL,

            channel_id TEXT NOT NULL,

            type channel_message_type NOT NULL,

            content TEXT NOT NULL,

            discord_message_id TEXT,

            created_by TEXT NOT NULL,

            updated_by TEXT NOT NULL,

            updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

            PRIMARY KEY (

                guild_id,

                channel_id,

                type
            )
        );

    `);

    await pool.query(`

        CREATE TABLE IF NOT EXISTS content_creators (

            id BIGSERIAL PRIMARY KEY,

            guild_id TEXT NOT NULL,

            discord_channel_id TEXT NOT NULL,

            discord_user_id TEXT NOT NULL,

            platform TEXT NOT NULL,

            account_identifier TEXT NOT NULL,

            creator_display_name TEXT,

            message_template TEXT,

            last_content_id TEXT,

            subscription_expires_at TIMESTAMP,

            created_at TIMESTAMP NOT NULL DEFAULT NOW(),

            updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

            UNIQUE (

                guild_id,

                platform,

                account_identifier

            )

        );

    `);

    await pool.query(`

        CREATE TABLE IF NOT EXISTS tiktok_authorizations (

            id BIGSERIAL PRIMARY KEY,

            account_identifier TEXT NOT NULL,

            access_token TEXT NOT NULL,

            refresh_token TEXT NOT NULL,

            access_token_expires_at TIMESTAMP NOT NULL,

            refresh_token_expires_at TIMESTAMP NOT NULL,

            scope TEXT NOT NULL,

            token_type TEXT NOT NULL DEFAULT 'Bearer',

            authorization_status TEXT NOT NULL DEFAULT 'active',

            created_at TIMESTAMP NOT NULL DEFAULT NOW(),

            updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

            UNIQUE (
                account_identifier
            )

        );

    `);

    /*
    ====================================
    BLACKLISTED INSTALLERS
    ====================================
    */

    await pool.query(`
        CREATE TABLE IF NOT EXISTS blacklisted_installers (

            id
                BIGSERIAL
                PRIMARY KEY,

            type
                VARCHAR(16)
                NOT NULL,

            name
                VARCHAR(255)
                NOT NULL,

            discord_id
                VARCHAR(32)
                NOT NULL,

            reason
                TEXT,

            created_at
                TIMESTAMP WITH TIME ZONE
                NOT NULL
                DEFAULT NOW(),

            CONSTRAINT blacklisted_installers_type_check
                CHECK (
                    type IN (
                        'guild',
                        'user'
                    )
                ),

            CONSTRAINT blacklisted_installers_unique_target
                UNIQUE (
                    type,
                    discord_id
                )

        );
    `);

    /*
    ====================================
    SYNARA SUBSCRIPTIONS
    ====================================
    */

    await pool.query(`

        CREATE TABLE IF NOT EXISTS synara_subscriptions (

            id
                BIGSERIAL
                PRIMARY KEY,

            user_id
                TEXT
                NOT NULL,

            guild_id
                TEXT
                NOT NULL,

            guild_name
                TEXT
                NOT NULL,

            tier
                TEXT
                NOT NULL,

            status
                TEXT
                NOT NULL,

            subscription_id
                TEXT
                UNIQUE,

            expires_at
                TIMESTAMP WITH TIME ZONE,

            source
                TEXT
                NOT NULL,

            updated_at
                TIMESTAMP WITH TIME ZONE
                NOT NULL
                DEFAULT NOW(),

            created_at
                TIMESTAMP WITH TIME ZONE
                NOT NULL
                DEFAULT NOW(),

            CONSTRAINT synara_subscriptions_tier_check
                CHECK (
                    tier IN (
                        'Foundation',
                        'Intelligence'
                    )
                ),

            CONSTRAINT synara_subscriptions_status_check
                CHECK (
                    status IN (
                        'active',
                        'expired',
                        'cancelled',
                        'pending_cancellation',
                    )
                ),

            CONSTRAINT synara_subscriptions_source_check
                CHECK (
                    source IN (
                        'Subscription',
                        'Trial',
                        'Sponsored'
                    )
                )

        );

    `);


    /*
    ====================================
    SYNARA SUBSCRIPTION INDEXES
    ====================================
    */

    await pool.query(`

        CREATE INDEX IF NOT EXISTS
            idx_synara_subscriptions_guild_id

        ON synara_subscriptions (
            guild_id
        );

    `);


    await pool.query(`

        CREATE INDEX IF NOT EXISTS
            idx_synara_subscriptions_user_id

        ON synara_subscriptions (
            user_id
        );

    `);


    await pool.query(`

        CREATE INDEX IF NOT EXISTS
            idx_synara_subscriptions_subscription_id

        ON synara_subscriptions (
            subscription_id
        );

    `);


    await pool.query(`

        CREATE INDEX IF NOT EXISTS
            idx_synara_subscriptions_expires_at

        ON synara_subscriptions (
            expires_at
        );

    `);

    logFeature({

        category:
            'SYSTEM',

        message:
            'Discord tables initialized',

        details: {
            tables: [

                'trivia_leaderboard',

                'feature_flags',

                'guild_settings',

                'ignored_channels',

                'community_activity',

                'bonk_counts',

                'birthdays',

                'scheduled_events',

                'discord_event_announcements',

                'nicknames',

                'channel_messages',

                'content_creators',

                'tiktok_authorizations',

                'blacklisted_installers',

                'synara_subscriptions'
            ] 
        }
    });
}

module.exports = {
    initializeDatabase
};
