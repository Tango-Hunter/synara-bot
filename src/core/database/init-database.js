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

            created_at TIMESTAMP NOT NULL DEFAULT NOW(),

            updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

            UNIQUE (

                guild_id,

                platform,

                account_identifier

            )

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

                'content_creators'
            ] 
        }
    });
}

module.exports = {
    initializeDatabase
};
