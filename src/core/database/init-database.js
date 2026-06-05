/**
 * Title: init-database.js
 * Author: Tango Hunter
 * Date Created: 5/25/26
 * Date Modified: 5/25/26
 * Description:  Creates Database Initialization.
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

    logFeature({

        category:
            'SYSTEM',

        message:
            'Database initialized',

        details: {

            table:
                'trivia_leaderboard'
        }
    });
}

module.exports = {
    initializeDatabase
};
