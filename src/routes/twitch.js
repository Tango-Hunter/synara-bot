/**
 * Title: twitch.js
 * Author: Tango Hunter
 * Date Created: 5/30/26
 * Description: Express server handling all twitch routes.
 */

const express = require('express');

const {
    handleEventSub
} = require('../twitch/services/eventsub-handler');

const {
    logFeature,
    logError
} = require('../core/logging/logger');

const {
    ERROR_TYPES
} = require('../core/logging/error-types');


module.exports = (
    client
) => {
    const router =
        express.Router();

    router.get(

        '/health',

        (
            req,
            res
        ) => {

            res.status(200).json({

                status:
                    'online'
            });
        }
    );

    router.post(

        '/eventsub',

        async (

            req,
            res
        ) => {

            const messageType =

                req.header(

                    'Twitch-Eventsub-Message-Type'
                );

            if (

                messageType ===
                'webhook_callback_verification'

            ) {

                logFeature({

                    category:
                        'EVENTSUB',

                    message:
                        'Webhook verification received',

                    details: {

                        challenge:
                            'received'
                    }
                });

                return res
                    .status(200)
                    .send(

                        req.body.challenge
                    );
            }

            if (

                messageType ===
                'notification'

            ) {

                logFeature({

                    category:
                        'EVENTSUB',

                    message:
                        'Notification received',

                    details: {

                        type:
                            req.body.subscription?.type,

                        broadcasterId:
                            req.body.event?.broadcaster_user_id
                    }
                });

                try {

                    await handleEventSub(
                        req.body,
                        client
                    );

                } catch (error) {

                    logError({

                        type:
                            ERROR_TYPES.API_ERROR,

                        source:
                            'eventsub-route',

                        message:
                            error.message,

                        details: {

                            subscriptionType:
                                req.body.subscription?.type,

                            broadcasterId:
                                req.body.event?.broadcaster_user_id
                        }
                    });
                }
            }

            res.sendStatus(200);
        }
    );

    return router;
};
