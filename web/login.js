'use strict';

var sha = function (str) {
    var shaObj = new jsSHA('SHA-256', 'TEXT');

    shaObj.setHMACKey('MESE-Next', 'TEXT');
    shaObj.update(str);

    return shaObj.getHMAC('BYTES');
};

var currentLogin = undefined;

var getLogin = function (callback) {
    if (currentLogin) {
        callback(currentLogin);
    } else {
        var loginInfo = localStorage.getItem('MESE_login');

        if (loginInfo) {
            callback(JSON.parse(loginInfo));
        }
    }
};

var setLogin = function (login, save, callback) {
    currentLogin = login;

    if (save) {
        localStorage.setItem('MESE_login', JSON.stringify(login));
    }

    callback(login);
};

var resetLogin = function () {
    localStorage.removeItem('MESE_login');
};
