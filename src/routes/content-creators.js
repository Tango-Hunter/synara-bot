/**
 * Title: content-creators.js
 * Author: Tango Hunter
 * Date Created: 7/26/26
 * Description: Express server handling all Content Creator webhook routes.
 */

const express = require('express');

const {
    handleChallenge,
    handleNotification
} = require('../content-creators/platforms/youtube/youtube-websub');

const {
    logFeature,
    logError
} = require('../core/logging/logger');

const {
    ERROR_TYPES
} = require('../core/logging/error-types');


module.exports = client => {

    const router = express.Router();

    // ============================================
    // YouTube WebSub Challenge Verification
    // ============================================
    router.get(

        '/youtube/websub',

        async (

            req,
            res

        ) => {

            try {

                await handleChallenge(

                    req,
                    res

                );

            } catch (error) {

                logError({

                    type:

                        ERROR_TYPES.API_ERROR,

                    source:

                        'content-creators-route',

                    message:

                        error.message,

                    details: {

                        platform:

                            'youtube',

                        endpoint:

                            'GET /youtube/websub'

                    }
                });

                return res.sendStatus(500);

            }
        }
    );

    // ============================================
    // YouTube Upload Notifications
    // ============================================
    router.post(

        '/youtube/websub',

        express.text({

            type: [

                'application/atom+xml',

                'application/xml',

                'text/xml'

            ]

        }),

        async (

            req,
            res

        ) => {

            try {

                logFeature({

                    category:

                        'CONTENT_CREATORS',

                    message:

                        'YouTube WebSub notification received',

                    details: {}

                });

                await handleNotification({

                    client,

                    body:

                        req.body,

                    headers:

                        req.headers

                });

                return res.sendStatus(200);

            } catch (error) {

                logError({

                    type:

                        ERROR_TYPES.API_ERROR,

                    source:

                        'content-creators-route',

                    message:

                        error.message,

                    details: {

                        platform:

                            'youtube',

                        endpoint:

                            'POST /youtube/websub'

                    }
                });

                return res.sendStatus(500);

            }
        }
    );

    return router;
};
