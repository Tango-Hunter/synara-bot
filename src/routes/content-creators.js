/**
 * Title: content-creators.js
 * Author: Tango Hunter
 * Date Created: 7/26/26
 * Description: Express server handling all Content Creator webhook routes.
 */

const express = require('express');

const {
    handleChallenge
} = require('../content-creators/youtube-websub');

const {
    handleSubscriptionVerification
} = require('../content-creators/subscription-service');

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

                const verification =

                    await handleChallenge(

                        req,

                        res

                    );


                /*
                ====================================
                HANDLE RESPONSE ALREADY SENT
                ====================================

                handleChallenge() sends its own
                HTTP 400 response when the
                verification request is invalid.

                Do not attempt to send another
                response in that situation.
                */

                if (
                    !verification
                ) {
                    return;
                }


                /*
                ====================================
                UPDATE SUBSCRIPTION EXPIRATION
                ====================================

                YouTube is the source of truth for
                the actual lease duration.

                handleChallenge() has already
                calculated the expiration from
                YouTube's hub.lease_seconds value.

                Persist that value through the
                centralized subscription service.
                */

                const databaseUpdate =

                    await handleSubscriptionVerification({

                        platform:

                            'youtube',

                        accountIdentifier:

                            verification.accountIdentifier,

                        subscriptionExpiresAt:

                            verification.subscriptionExpiresAt

                    });


                /*
                ====================================
                LOG VERIFICATION
                ====================================
                */

                logFeature({

                    category:

                        'CONTENT_CREATORS',

                    message:

                        'YouTube WebSub challenge accepted.',

                    details: {

                        accountIdentifier:

                            verification.accountIdentifier,

                        leaseSeconds:

                            verification.leaseSeconds,

                        subscriptionExpiresAt:

                            verification.subscriptionExpiresAt,

                        creatorsUpdated:

                            databaseUpdate.creatorsUpdated,

                        subscriptionUpdated:

                            databaseUpdate.subscriptionUpdated

                    }
                });


                /*
                ====================================
                COMPLETE WEBSUB VERIFICATION
                ====================================

                YouTube expects the challenge value
                returned exactly as received.
                */

                return res.send(

                    verification.challenge

                );
            }

            catch (
                error
            ) {

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


                return res.sendStatus(

                    500

                );
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

            logFeature({

                category:

                    'CONTENT_CREATORS',

                message:

                    'YouTube upload notification received.',

                details: {}

            });

            return res.sendStatus(200);

        }

    );

    return router;
};
