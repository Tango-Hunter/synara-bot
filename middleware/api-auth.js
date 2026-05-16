/**
 * Title: api-auth.js
 * Author: Tango Hunter
 * Date Created: 5/16/26
 * Date Modified: 5/16/26
 * Description: Protects SYNARA API routes.
 */

function apiAuth(req, res, next) {

    const apiKey = req.headers['x-api-key'];

    if (
        !apiKey ||
        apiKey !== process.env.SYNARA_API_KEY
    ) {

        return res.status(401).json({
            error: 'Unauthorized'
        });
    }

    next();
}

module.exports = {
    apiAuth
};
