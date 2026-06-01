/**
 * Title: init-activity-table.js
 * Author: Tango Hunter
 * Date Created: 6/1/26
 * Date Modified: 6/1/26
 * Description:  Creates Activity Table Initialization.
 */

const pool = require('./postgres');


async function initializeActivityTable() {

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
}

module.exports = {
    initializeActivityTable
};
