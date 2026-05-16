/**
 * Title: webhook-service.js
 * Author: Tango Hunter
 * Date Created: 5/13/26
 * Date Modified: 5/16/26
 * Description: Sends requests to SYNARA n8n workflows.
 */

const axios = require('axios');

async function sendToN8N(payload) {

    const response = await axios.post(

        process.env.N8N_WEBHOOK_URL,

        payload,

        {
            timeout: 30000
        }
    );

    return response.data;
}

module.exports = {
    sendToN8N
};
