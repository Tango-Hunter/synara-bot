# Birthdays

## Purpose

The Birthday feature helps celebrate members of your community by remembering their birthday and announcing it automatically each year. It gives everyone an opportunity to celebrate together and helps make your server feel more welcoming.

## How It Works

Members can register their birthday using the `!birthday` command. SYNARA will present a button that opens a simple form where the user enters their birthday using the **MM/DD** format.

After submitting the form, SYNARA confirms the saved birthday using the month's name (for example, **July 1**) and reminds the user that they can simply repeat the process if they made a mistake.

Each year on a member's birthday, SYNARA will automatically:

- Wish them a Happy Birthday.
- Announce their birthday in the configured Birthday channel.
- Assign the Happy Birthday role if one has been configured by the server administrators.

## Commands

`!birthday`

Registers or updates your birthday.

`!nextBirthday`

Displays birthdays occurring during the next three months.

## Notes

- Birthdays are entered using the **MM/DD** format.
- A birth year is never requested or stored.
- Running `!birthday` again replaces your previously saved birthday.
- The Happy Birthday role is optional and only assigned if configured by the server.
