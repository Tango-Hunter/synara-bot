# Counting Penalties

## Purpose

The Counting Penalty feature adds a bit of friendly competition to your server's counting game by highlighting the member who most recently caused the count to reset.

## How It Works

SYNARA watches the configured counting channel while your counting bot manages the game.

Whenever the counting sequence fails and the count resets, SYNARA automatically:

- Removes the Counting Penalty role from anyone who currently has it.
- Assigns the role to the member responsible for the most recent counting failure.

This role is meant to be humorous and serves as a temporary reminder of who most recently broke the count.

## Notes

- SYNARA does not control the counting game itself.
- A separate counting bot is responsible for validating numbers.
- Only one member can have the Counting Penalty role at a time.
- The role automatically moves to the next member who breaks the counting sequence.
