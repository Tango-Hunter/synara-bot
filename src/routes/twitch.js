/**
 * Title: twitch.js
 * Author: Tango Hunter
 * Date Created: 5/30/26
 * Date Modified: 5/30/26
 * Description: Express server handling all twitch routes.
 */

const express = require('express');

const router =
    express.Router();

const {
    handleEventSub
} = require('../twitch/services/eventsub-handler');


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

                req.body
            );
        }

        res.sendStatus(200);
    }
);

module.exports =
    router;
