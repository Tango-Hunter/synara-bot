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
    handleNotification
} = require('../content-creators/youtube-notifications');

const {
    processContent
} = require('../content-creators/announcement-service');

const {
    handleOAuthCallback
} = require('../discord/interactions/content-creator/tiktok-platform')

const {
    logFeature,
    logError
} = require('../core/logging/logger');

const {
    ERROR_TYPES
} = require('../core/logging/error-types');


const SYNARA_STATUS_URL =
    'https://tangohunter.com/synara/status';


module.exports = client => {

    const router = express.Router();

    // ============================================
    // TikTok Login Kit OAuth Callback
    // ============================================

    router.get(

        '/tiktok/callback',

        async (

            req,

            res

        ) => {

            try {

                /*
                ====================================
                RECEIVE TIKTOK OAUTH CALLBACK
                ====================================

                TikTok redirects the user's browser
                here after Login Kit authorization.

                The route owns the HTTP request.

                The TikTok platform module owns
                the OAuth workflow.
                */

                const {

                    code,

                    state,

                    error,

                    error_description:
                        errorDescription

                } = req.query;


                /*
                ====================================
                PROCESS OAUTH CALLBACK
                ====================================

                handleOAuthCallback() is responsible
                for:

                - validating the temporary OAuth state
                - exchanging the authorization code
                - retrieving the TikTok account
                - storing the account information in
                  the temporary OAuth Map
                - updating the original Discord message
                */

                const result =

                    await handleOAuthCallback({

                        code,

                        state,

                        error,

                        errorDescription

                    });


                /*
                ====================================
                REDIRECT TO STATUS PAGE
                ====================================

                The OAuth processing has completed.

                The Discord interaction has already
                been updated by tiktok-platform.js.

                The browser is now redirected to the
                public SYNARA status page.

                Only non-sensitive presentation
                information is included in the URL.
                */

                if (
                    result?.success
                ) {

                    return res.redirect(

                        `${SYNARA_STATUS_URL}?status=success&platform=tiktok`

                    );

                }


                /*
                ====================================
                HANDLE EXPIRED OAUTH SESSION
                ====================================

                A missing or expired OAuth transaction
                is different from a general OAuth error.

                The status page provides the appropriate
                user-facing message.
                */

                if (
                    result?.expired
                ) {

                    return res.redirect(

                        `${SYNARA_STATUS_URL}?status=timeout&platform=tiktok`

                    );

                }


                /*
                ====================================
                HANDLE USER CANCELLATION
                ====================================

                TikTok normally reports a declined
                authorization through the OAuth error
                response.

                access_denied is treated as a deliberate
                cancellation rather than a server error.
                */

                if (
                    error ===
                        'access_denied'
                ) {

                    return res.redirect(

                        `${SYNARA_STATUS_URL}?status=cancelled&platform=tiktok`

                    );

                }


                /*
                ====================================
                HANDLE OAUTH FAILURE
                ====================================

                Do not expose the raw TikTok error
                message in the browser.

                The status page contains controlled,
                generic messaging.
                */

                return res.redirect(

                    `${SYNARA_STATUS_URL}?status=error&platform=tiktok&code=authorization_failed`

                );

            }

            catch (
                error
            ) {

                /*
                ====================================
                LOG CALLBACK FAILURE
                ====================================
                */

                logError({

                    type:

                        ERROR_TYPES.API_ERROR,

                    source:

                        'content-creators-route',

                    message:

                        error.message,

                    details: {

                        platform:

                            'tiktok',

                        endpoint:

                            'GET /tiktok/callback',

                        hasCode:

                            Boolean(
                                req.query.code
                            ),

                        hasState:

                            Boolean(
                                req.query.state
                            )

                    }

                });


                /*
                ====================================
                RETURN GENERIC SERVER ERROR
                ====================================

                Never expose internal server errors
                through the OAuth redirect.
                */

                return res.redirect(

                    `${SYNARA_STATUS_URL}?status=error&platform=tiktok&code=server`

                );

            }

        }

    );

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

            try {

                /*
                ====================================
                PROCESS YOUTUBE WEBSUB NOTIFICATION
                ====================================

                The notification handler owns all
                YouTube-specific XML parsing and
                normalization.

                This route is responsible only for
                receiving the HTTP request and passing
                the notification body to the handler.
                */

                const notification =

                    await handleNotification({

                        body:
                            req.body,

                        headers:
                            req.headers

                    });

                await processContent({
                    content:
                        notification
                });


                /*
                ====================================
                LOG NOTIFICATION
                ====================================

                Only log the normalized identifiers
                here. The notification service will
                handle the actual content processing
                and announcement workflow.
                */

                logFeature({

                    category:
                        'CONTENT_CREATORS',

                    message:
                        'YouTube upload notification processed.',

                    details: {

                        accountIdentifier:
                            notification.accountIdentifier,

                        contentId:
                            notification.contentId

                    }
                });


                /*
                ====================================
                COMPLETE REQUEST
                ====================================

                YouTube only needs a successful HTTP
                response after the notification has
                been accepted for processing.
                */

                return res.sendStatus(200);

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
                            'POST /youtube/websub'

                    }
                });


                /*
                ====================================
                NOTIFICATION PROCESSING FAILURE
                ====================================

                Return 500 so the failure is visible
                to the WebSub sender rather than
                silently acknowledging a notification
                that SYNARA could not process.
                */

                return res.sendStatus(500);

            }
        }
    );

    return router;
};
