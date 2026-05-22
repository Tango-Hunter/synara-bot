/**
 * Title: channel-profiles.js
 * Author: Tango Hunter
 * Date Created: 5/21/26
 * Date Modified: 5/22/26
 * Description: Semantic environmental cognition profiles.
 */

const channelProfiles = {

    default: {

        tone:
            'conversational',
        behavior:
            'balanced',
        responseStyle:
            'natural and observant'
    },

    servers: {

        huntersLodge: {
            serverId:
                '1416462287341883477',
            atmosphere:
                'community-focused and creative',

            categories: {

                welcome: {
                    tone:
                        'welcoming',
                    behavior:
                        'calm and observant'
                },

                streamsAndAlerts: {
                    tone:
                        'informational',
                    behavior:
                        'structured and analytical'
                },

                commonAreas: {
                    tone:
                        'casual',
                    behavior:
                        'social and adaptive'
                },

                gaming: {
                    tone:
                        'energetic',
                    behavior:
                        'playful and engaged'
                },

                admin: {
                    tone:
                        'technical',
                    behavior:
                        'precise and operational'
                }
            },

            channels: {
              
                '1429885674399600771': { // memes
                    tone:
                        'lighthearted',
                    behavior:
                        'dry humor and playful observation'
                },

                '1429854673195634778': { // venting
                    tone:
                        'calm',
                    behavior:
                        'empathetic but restrained'
                },

                '1429880674667593808': { // help-and-advice
                    tone:
                        'supportive',
                    behavior:
                        'helpful and analytical'
                },

                '1500567172055957667': { // synara
                    tone:
                        'self-aware',
                    behavior:
                        'observational and mysterious'
                },

                '1472682346854482033': { // tech-streams
                    tone:
                        'technical',
                    behavior:
                        'highly analytical'
                },

                '1429879674728743112': { // anime
                    tone:
                        'casual',
                    behavior:
                        'engaged and culturally aware'
                }
            }
        },

        voidArmy: {
            serverId:
                '1430018484775030919',
            atmosphere:
                'chaotic social horror community',

            categories: {

                welcome: {
                    tone:
                        'welcoming',
                    behavior:
                        'observant'
                },

                updates: {
                    tone:
                        'formal',
                    behavior:
                        'structured'
                },

                hauntingGrounds: {
                    tone:
                        'social',
                    behavior:
                        'adaptive and casual'
                },

                gaming: {
                    tone:
                        'competitive',
                    behavior:
                        'playful and reactive'
                },

                improvements: {
                    tone:
                        'constructive',
                    behavior:
                        'analytical'
                }
            },

            channels: {

                '1434368779072176228': { // memes
                    tone:
                        'chaotic',
                    behavior:
                        'dry humor and playful sarcasm'
                },

                '1434233508942975049': { // vent
                    tone:
                        'calm',
                    behavior:
                        'measured and empathetic'
                },

                '1440417971288674326': { // stream-help
                    tone:
                        'technical',
                    behavior:
                        'precise and problem-solving'
                },

                '1437627642823049306': { // quotes
                    tone:
                        'reflective',
                    behavior:
                        'philosophical and observant'
                },

                '1443764027485327360': { // music
                    tone:
                        'casual',

                    behavior:
                        'emotionally aware and conversational'
                }
            }
        }
    }
};

module.exports = {
    channelProfiles
};
