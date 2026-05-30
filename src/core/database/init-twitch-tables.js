/**
 * Title: init-twitch-table.js
 * Author: Tango Hunter
 * Date Created: 5/29/26
 * Date Modified: 5/29/26
 * Description:  Creates Twitch Database Initialization.
 */

const pool
     = require('./postgres');

async function initializeTwitchTables() {

    await pool.query(`

        CREATE TABLE IF NOT EXISTS twitch_users (

            discord_user_id TEXT PRIMARY KEY,

            discord_name TEXT NOT NULL,

            guild_ids TEXT[] NOT NULL DEFAULT '{}',

            twitch_user_id TEXT NOT NULL UNIQUE,

            twitch_login TEXT NOT NULL,

            twitch_display_name TEXT NOT NULL,

            twitch_profile_image_url TEXT,

            notifications_enabled BOOLEAN DEFAULT TRUE,

            last_verified_at TIMESTAMP,

            created_at TIMESTAMP DEFAULT NOW(),

            updated_at TIMESTAMP DEFAULT NOW()
        );

    `);

    await pool.query(`

        CREATE TABLE IF NOT EXISTS twitch_live_status (

            discord_user_id TEXT PRIMARY KEY,

            message_ids JSONB NOT NULL DEFAULT '{}',

            stream_category TEXT,

            stream_title TEXT,

            thumbnail_url TEXT,

            live_now BOOLEAN DEFAULT FALSE,

            started_at TIMESTAMP,

            ended_at TIMESTAMP,

            updated_at TIMESTAMP DEFAULT NOW()
        );

    `);

    await pool.query(`

        CREATE TABLE IF NOT EXISTS twitch_statistics (

            discord_user_id TEXT PRIMARY KEY,

            total_streams INTEGER DEFAULT 0,

            total_stream_duration_seconds BIGINT DEFAULT 0,

            longest_stream_duration_seconds BIGINT DEFAULT 0,

            last_stream_duration_seconds BIGINT DEFAULT 0,

            last_stream_at TIMESTAMP,

            updated_at TIMESTAMP DEFAULT NOW()
        );

    `);

    await pool.query(`

            CREATE TABLE IF NOT EXISTS twitch_eventsub (

            twitch_user_id TEXT PRIMARY KEY,

            subscription_id TEXT NOT NULL,

            created_at TIMESTAMP DEFAULT NOW(),

            updated_at TIMESTAMP DEFAULT NOW()
        );
    `);
}

module.exports = {
    initializeTwitchTables
};
