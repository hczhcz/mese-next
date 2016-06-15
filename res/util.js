'use strict';

var sha = function (str) {
    var shaObj = new jsSHA('SHA-256', 'TEXT');

    shaObj.setHMACKey('MESE-Next', 'TEXT');
    shaObj.update(str);

    return shaObj.getHMAC('BYTES');
};
