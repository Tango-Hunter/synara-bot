/**
 * Title: default-guild-settings.js
 * Author: Tango Hunter
 * Date Created: 6/7/26
 * Description: Default guild settings.
 */

const DEFAULT_GUILD_SETTINGS = [

    /*
    ====================================
    REQUIRED SETTINGS
    ====================================
    */

    {
        name: 'current_version',
        displayName: 'Current Version',
        description: 'Current version of SYNARA'
    },

    {
        name: 'server_leader',
        displayName: 'Server Leader',
        description: 'Primary streamer or community leader',
        selectorType: "user"
    },

    {
        name: 'role_verified',
        displayName: 'Verified',
        description: 'Verified member role',
        selectorType: "role"
    },

    {
        name: 'roles_moderator',
        displayName: 'Moderator',
        description: 'Moderator roles',
        selectorType: "role"
    },

    {
        name: 'roles_admin',
        displayName: 'Admin',
        description: 'Administrative roles',
        selectorType: "role"
    },

    {
        name: 'channel_announcements',
        displayName: 'Announcements',
        description: 'Server announcement channel',
        selectorType: "channel"
    },

    {
        name: 'channel_automation',
        displayName: 'Automation',
        description: 'Private channel for admins to use for configuring SYNARA settings, features, and running automatic tasks',
        selectorType: "channel"
    },

    {
        name: 'channel_logs',
        displayName: 'Logs',
        description: 'Discord logging channel',
        selectorType: "channel"
    },

    /*
    ====================================
    FEATURE SPECIFIC SETTINGS
    ====================================
    */    

    {
        name: 'channel_welcome',
        displayName: 'Welcome',
        description: 'Welcome channel',
        selectorType: "channel"
    },

    {
        name: 'channel_intro',
        displayName: 'Intro',
        description: 'Introduction channel',
        selectorType: "channel"
    },

    {
        name: 'channel_roles',
        displayName: 'Roles',
        description: 'Reaction Roles channel',
        selectorType: "channel"
    },


    {
        name: 'channel_modapps_apply',
        displayName: 'Mod Applications',
        description: 'Moderator application channel',
        selectorType: "channel"
    },

    {
        name: 'channel_modapps_submissions',
        displayName: 'Mod App Submissions',
        description: 'Moderator application submissions channel',
        selectorType: "channel"
    },

    {
        name: 'message_modapps_apply',
        displayName: 'Mod Application Message',
        description: 'Moderator application message'
    },

    {
        name: 'modapps_blacklist',
        displayName: 'ModApps Blacklist',
        description: 'Users prohibited from applying for moderator positions'
    },
    

    {
        name: 'channel_stream_leadership',
        displayName: 'Leadership Streams',
        description: 'Leadership stream notifications',
        selectorType: "channel"
    },

    {
        name: 'channel_stream_selfpromo',
        displayName: 'Self Promo Streams',
        description: 'Self promotion channel',
        selectorType: "channel"
    },


    {
        name: 'channel_qotd',
        displayName: 'QOTD',
        description: 'Question of the Day channel',
        selectorType: "channel"
    },


    {
        name: 'channel_motivational',
        displayName: 'Motivational',
        description: 'Motivational message channel',
        selectorType: "channel"
    },


    {
        name: 'channel_birthdays',
        displayName: 'Birthdays',
        description: 'Birthday assignment and announcement channel',
        selectorType: "channel"
    },

    {
        name: 'role_birthday',
        displayName: 'Birthday',
        description: 'Birthday celebration role',
        selectorType: "role"
    },

    
    {
        name: 'channel_counting',
        displayName: 'Counting',
        description: 'Counting game channel',
        selectorType: "channel"
    },

    {
        name: 'counting_bot',
        displayName: 'Counting Bot',
        description: 'Counting game bot user',
        selectorType: "user"
    },

    {
        name: 'role_counting_failure',
        displayName: 'Counting Failure Role',
        description: 'Role assigned to the latest counting failure',
        selectorType: "role"
    }
];


function getSettingNames() {

    return DEFAULT_GUILD_SETTINGS.map(

        setting => setting.name
    );
}

function getChannelSettings() {

    return DEFAULT_GUILD_SETTINGS.filter(

        setting =>

            setting.name.startsWith(
                'channel_'
            )
    );
}

function getRoleSettings() {

    return DEFAULT_GUILD_SETTINGS.filter(

        setting =>

            setting.name.startsWith(
                'role_'
            )

            ||

            setting.name.startsWith(
                'roles_'
            )
    );
}

module.exports = {
    DEFAULT_GUILD_SETTINGS,
    getSettingNames,
    getChannelSettings,
    getRoleSettings
};
