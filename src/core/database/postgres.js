/**
 * Title: postgres.js
 * Author: Tango Hunter
 * Date Created: 5/25/26
 * Date Modified: 5/25/26
 * Description:  Database connection pool.
 */

const {
    Pool
} = require('pg');


const pool =

    new Pool({

        host:
            process.env.PGHOST,

        port:
            process.env.PGPORT,

        user:
            process.env.PGUSER,

        password:
            process.env.PGPASSWORD,

        database:
            process.env.PGDATABASE,

        ssl: {
            rejectUnauthorized:
                false
        }
    });

module.exports = pool;
