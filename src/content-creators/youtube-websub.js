/**
 * Title: youtube-websub.js
 * Author: Tango Hunter
 * Date Created: 7/26/26
 * Description:
 * Handles YouTube WebSub subscriptions for Content Creator
 * Announcements.
 *
 * Responsibilities:
 * • Create WebSub subscriptions
 * • Renew subscriptions
 * • Handle WebSub verification challenges
 * • Receive upload notifications
 *
 * This file DOES NOT:
 * • Update the database
 * • Send Discord messages
 * • Build announcement embeds
 * • Parse YouTube API metadata
 */


const {
    logFeature,
    logError
} = require('../core/logging/logger');

const {
    ERROR_TYPES
} = require('../core/logging/error-types');

const fetch = global.fetch;


/*
====================================
CONSTANTS
====================================
*/

const HUB_URL =
    'https://pubsubhubbub.appspot.com/subscribe';

const TOPIC_BASE =
    'https://www.youtube.com/xml/feeds/videos.xml?channel_id=';

const CALLBACK_PATH =
    '/content-creators/youtube/websub';

const DEFAULT_LEASE_SECONDS =
    432000; // 5 days

const REQUEST_TIMEOUT =
    10000;



/*
====================================
HELPERS
====================================
*/

function buildTopicUrl(

    channelId

) {

    return `${TOPIC_BASE}${channelId}`;

}



function buildCallbackUrl() {

    const publicUrl =

        process.env.PUBLIC_URL;

    if (

        !publicUrl

    ) {

        throw new Error(

            'PUBLIC_URL is not configured.'

        );

    }

    return (

        publicUrl.replace(

            /\/$/,

            ''

        )

        +

        CALLBACK_PATH

    );

}



function calculateSubscriptionExpiration(

    leaseSeconds = DEFAULT_LEASE_SECONDS

) {

    return new Date(

        Date.now()

        +

        (

            leaseSeconds

            *

            1000

        )

    );

}



function buildSubscriptionBody({

    topic,

    callback,

    leaseSeconds = DEFAULT_LEASE_SECONDS

}) {

    const body =

        new URLSearchParams();

    body.append(

        'hub.mode',

        'subscribe'

    );

    body.append(

        'hub.topic',

        topic

    );

    body.append(

        'hub.callback',

        callback

    );

    body.append(

        'hub.verify',

        'async'

    );

    body.append(

        'hub.lease_seconds',

        leaseSeconds

    );

    return body;

}



async function requestHub({

    body

}) {

    const controller =

        new AbortController();

    const timeout =

        setTimeout(

            () =>

                controller.abort(),

            REQUEST_TIMEOUT

        );

    try {

        const response =

            await fetch(

                HUB_URL,

                {

                    method:

                        'POST',

                    headers: {

                        'Content-Type':

                            'application/x-www-form-urlencoded'

                    },

                    body,

                    signal:

                        controller.signal

                }

            );

        clearTimeout(

            timeout

        );

        if (

            !response.ok

        ) {

            throw new Error(

                `WebSub returned HTTP ${response.status}`

            );

        }

        return response;

    }

    catch (

        error

    ) {

        clearTimeout(

            timeout

        );

        throw error;

    }

}

/*
====================================
WEBSUB OPERATIONS
====================================
*/

async function subscribe({

    accountIdentifier,

    leaseSeconds = DEFAULT_LEASE_SECONDS

}) {

    const channelId =

        accountIdentifier;


    const topic =

        buildTopicUrl(

            channelId

        );


    const callback =

        buildCallbackUrl();


    const body =

        buildSubscriptionBody({

            topic,

            callback,

            leaseSeconds

        });


    await requestHub({

        body

    });


    logFeature({

        category:

            'CONTENT_CREATORS',

        message:

            'YouTube WebSub subscription requested.',

        details: {

            accountIdentifier,

            topic,

            callback,

            requestedLeaseSeconds:

                leaseSeconds

        }
    });


    return {

        accountIdentifier,

        topic,

        callback,

        requestedLeaseSeconds:

            leaseSeconds

    };
}


/*
async function unsubscribe({

    channelId

}) {

    const topic =

        buildTopicUrl(

            channelId

        );

    const callback =

        buildCallbackUrl();

    const body =

        new URLSearchParams();

    body.append(

        'hub.mode',

        'unsubscribe'

    );

    body.append(

        'hub.topic',

        topic

    );

    body.append(

        'hub.callback',

        callback

    );

    body.append(

        'hub.verify',

        'async'

    );

    await requestHub({

        body

    });

    logFeature({

        category:

            'CONTENT_CREATORS',

        message:

            'YouTube WebSub subscription removed.',

        details: {

            channelId,

            topic

        }

    });

}
*/


async function initialize({

    accountIdentifier,

    leaseSeconds = DEFAULT_LEASE_SECONDS

}) {

    try {

        logFeature({

            category:

                'CONTENT_CREATORS',

            message:

                'Initializing YouTube WebSub.',

            details: {

                channelId:

                    accountIdentifier

            }

        });

        return await subscribe({

            accountIdentifier,

            leaseSeconds

        });

    }

    catch (

        error

    ) {

        logError({

            type:

                ERROR_TYPES.UNKNOWN_ERROR,

            source:

                'youtube-websub',

            message:

                'Failed to initialize YouTube WebSub.',

            details: {

                channelId:

                    accountIdentifier,

                error:

                    error.message

            }

        });

        throw error;

    }

}

/*
====================================
WEBSUB VERIFICATION
====================================
*/

async function handleChallenge(

    req,

    res

) {

    const {

        'hub.mode': mode,

        'hub.topic': topic,

        'hub.challenge': challenge,

        'hub.lease_seconds': leaseSeconds

    } = req.query;

    if (

        mode !== 'subscribe'

    ) {

        logError({

            type:

                ERROR_TYPES.UNKNOWN_ERROR,

            source:

                'youtube-websub',

            message:

                'Received invalid WebSub verification mode.',

            details: {

                mode,

                topic

            }

        });

        return res

            .status(

                400

            )

            .send(

                'Invalid verification mode.'

            );

    }

    if (

        !topic

        ||

        !challenge

    ) {

        logError({

            type:

                ERROR_TYPES.UNKNOWN_ERROR,

            source:

                'youtube-websub',

            message:

                'Received incomplete WebSub verification request.',

            details: {

                topic,

                challenge:

                    !!challenge,

                leaseSeconds

            }

        });

        return res

            .status(

                400

            )

            .send(

                'Missing verification parameters.'

            );

    }

    const numericLeaseSeconds =

        Number(

            leaseSeconds

        );

    if (

        !Number.isFinite(

            numericLeaseSeconds

        )

        ||

        numericLeaseSeconds <= 0

    ) {

        logError({

            type:

                ERROR_TYPES.UNKNOWN_ERROR,

            source:

                'youtube-websub',

            message:

                'YouTube WebSub verification returned an invalid lease duration.',

            details: {

                topic,

                leaseSeconds

            }

        });

        return res

            .status(

                400

            )

            .send(

                'Invalid lease duration.'

            );

    }

    const accountIdentifier =

        topic

            .split(

                'channel_id='

            )[1];

    if (

        !accountIdentifier

    ) {

        logError({

            type:

                ERROR_TYPES.UNKNOWN_ERROR,

            source:

                'youtube-websub',

            message:

                'Unable to determine YouTube channel from WebSub topic.',

            details: {

                topic

            }

        });

        return res

            .status(

                400

            )

            .send(

                'Invalid WebSub topic.'

            );

    }

    const subscriptionExpiresAt =

        calculateSubscriptionExpiration(

            numericLeaseSeconds

        );

    logFeature({

        category:

            'CONTENT_CREATORS',

        message:

            'YouTube WebSub subscription verified.',

        details: {

            accountIdentifier,

            leaseSeconds:

                numericLeaseSeconds,

            subscriptionExpiresAt

        }

    });

    return {

        accountIdentifier,

        leaseSeconds:

            numericLeaseSeconds,

        subscriptionExpiresAt,

        challenge

    };

}

module.exports = {
    initialize,
    subscribe,
    handleChallenge
};
