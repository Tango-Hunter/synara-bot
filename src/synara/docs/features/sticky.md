# Sticky Messages

## Purpose

Sticky Messages keep important information visible by automatically moving a designated message back to the bottom of a channel after conversations have slowed down.

This is ideal for rules, instructions, FAQs, event information, or other important reminders that should remain easy for members to find.

## How It Works

Administrators can create a sticky message using the `/sticky` command.

Before the sticky message is published, SYNARA displays a private preview allowing the administrator to approve or cancel the operation.

Once created, SYNARA monitors activity within that channel.

Whenever members are actively chatting, SYNARA waits until the conversation has been inactive for **5 minutes** before deleting the previous sticky message and reposting it at the bottom of the channel.

This allows conversations to continue naturally while ensuring important information remains easily visible.

## Commands

`/sticky create`

Creates a sticky message in the current channel.

`/sticky delete`

Removes the sticky message from the current channel.

## Notes

- Only one sticky message may exist per channel.
- Sticky messages remain in the channel where they were created.
- The five-minute delay prevents unnecessary reposting during active conversations.
- Sticky messages are best suited for instructions, server information, and frequently referenced content.
