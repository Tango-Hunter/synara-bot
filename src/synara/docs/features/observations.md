# Observations

## Purpose

The Observation system allows SYNARA to naturally participate in conversations throughout the server. Rather than waiting to be mentioned directly, she may occasionally contribute meaningful responses that help conversations feel more engaging and immersive.

## How It Works

SYNARA monitors all channels that have not been added to the server's ignored channel list.

Administrators can prevent SYNARA from monitoring a channel by using:

`/ignoreChannel Add`

within the channel they wish to ignore.

Monitoring can be restored at any time by using:

`/ignoreChannel Remove`

The list of ignored channels can be viewed using:

`/settings`

SYNARA is designed to contribute naturally to conversations rather than interrupt them. She responds selectively when she believes she can meaningfully add to the discussion.

## Commands

`/ignoreChannel Add`

Prevents SYNARA from monitoring the current channel.

`/ignoreChannel Remove`

Allows SYNARA to resume monitoring the current channel.

`/settings`

Displays the server's configured settings, including the list of ignored channels.

## Notes

- SYNARA only monitors channels that are not on the ignored channel list.
- She intentionally avoids responding to low-information messages, simple acknowledgements, emotes, GIFs, and similar content.
- Observations are designed to make conversations feel more natural rather than dominate them.
