/**
 * Title: permission-check.js
 * Author: Tango Hunter
 * Date Created: 5/24/26
 * Date Modified: 5/24/26
 * Description: Verifies admin/mod permissions.
 */

const allowedRoles = [

    // Hunter's Lodge

    '1419382716931248431', // Admin
    '1429896603136823509', // Mod

    // Void Army

    '1432358756376645632', // Owner
    '1433485270472331335', // Co-Owner
    '1430210622242689147', // Admin
    '1433452708106338447'  //Mod
];

function hasAdminPermissions(
    interaction
) {

    return interaction.member.roles.cache.some(

        role => allowedRoles.includes(
            role.id
        )
    );
}

module.exports = {
    hasAdminPermissions
};
