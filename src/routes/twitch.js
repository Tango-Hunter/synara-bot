/**
 * Title: twitch.js
 * Author: Tango Hunter
 * Date Created: 5/30/26
 * Date Modified: 5/30/26
 * Description: Express server handling all twitch routes.
 */

const express = require('express');

const {
    handleEventSub
} = require('../twitch/services/eventsub-handler');

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

            console.log(
                'EVENTSUB REQUEST RECEIVED'
            );

            console.log(
                JSON.stringify(
                    req.body,
                    null,
                    2
                )
            );

            const messageType =

                req.header(

                    'Twitch-Eventsub-Message-Type'
                );

            if (

                messageType ===
                'webhook_callback_verification'

            ) {

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

                await handleEventSub(
                    req.body,
                    client
                );
            }

            res.sendStatus(200);
        }
    );
    // Test
    router.post(

        '/test-online',

        async (

            req,

            res
        ) => {

            await handleEventSub(

                {

                    subscription: {

                        type:
                            'stream.online'
                    },

                    event: {

                        broadcaster_user_id:
                            req.body
                                .twitchUserId,

                        title:
                            'SYNARA EventSub Test',

                        category_name:
                            'Testing'
                    }
                },

                client
            );

            res.sendStatus(
                200
            );
        }
    );

    return router;
};
