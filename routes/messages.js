/**
 * Title: messages.js
 * Author: Tango Hunter
 * Date Created: 5/13/26
 * Date Modified: 5/13/26
 * Description: Message Routing.
 */

const express = require('express');

const router = express.Router();

const {
    logError
} = require('../utils/logger');

const {
    apiAuth
} = require('../middleware/api-auth');

module.exports = (client) => {

    router.post(
        '/send-message',
        apiAuth,
        async (req, res) => {

        try {

            const {
                channelId,
                message
            } = req.body;

            const channel = await client.channels.fetch(channelId);

            if (!channel) {

                return res.status(404).json({
                    error: 'Channel not found'
                });
            }

            await channel.send(message);

            return res.status(200).json({
                success: true
            });

        } catch (error) {

            logError(
                'MESSAGE ROUTE ERROR',
                {
                    error: error.message
                }
            );

            return res.status(500).json({
                error: 'Failed to send message'
            });
          }
    });

    return router;
};
