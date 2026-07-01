# Twitch Monitoring

## Purpose

The Twitch Monitoring system allows SYNARA to automatically announce when active community members begin streaming, helping members discover and support one another's content.

## How It Works

Members can link their Twitch account to their Discord account using the `!linkTwitch` command.

Once linked, SYNARA monitors that Twitch account for live broadcasts.

When an active community member begins streaming, SYNARA automatically posts a live announcement.

Leadership streams are announced in the configured Leadership Promotion channel and notify members with the configured Verified role.

Community member streams are announced in the configured Self Promotion channel.

When the configured Server Leader begins streaming, SYNARA also creates a Discord Event and posts an announcement in the configured Announcements channel, making it easy for the community to join the stream.

SYNARA also tracks community participation. Live announcements are reserved for active members who regularly participate within the server. Members who become inactive will temporarily stop receiving automatic live announcements. Once they become active again, live announcements will automatically resume.

## Commands

`!linkTwitch <twitch_username>`

Links your Twitch account to SYNARA.

`!unlinkTwitch`

Removes your linked Twitch account.

`!myTwitch`

Displays the Twitch account currently linked to your Discord account.

`!twitchStats`

Displays your tracked Twitch streaming statistics.

## Notes

- Twitch usernames must be entered exactly as they appear on Twitch.
- Live announcements are intended to support active community members rather than function as a live-link directory.
- Server Leader streams receive additional visibility through automatic Discord Event creation.
- Members may unlink and relink their Twitch account at any time.
