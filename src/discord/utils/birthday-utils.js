/**
 * Title: birthday-utils.js
 * Author: Tango Hunter
 * Date Created: 6/17/26
 * Description: Birthday formatter.
 */

const MONTHS = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December'
];

function formatBirthday(

    month,

    day
) {

    return `${MONTHS[month - 1]} ${day}`;
}

module.exports = {
    MONTHS,
    formatBirthday
};
