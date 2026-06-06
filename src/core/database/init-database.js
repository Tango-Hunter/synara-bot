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

    logFeature({

        category:
            'SYSTEM',

        message:
            'Discord tables initialized',

        details: {
            tables: [

                'trivia_leaderboard',

                'feature_flags'
            ] 
        }
    });
}

module.exports = {
    initializeDatabase
};
