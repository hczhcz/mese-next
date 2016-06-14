'use strict';

module.exports.verifyBool = function (bool) {
    return typeof bool == 'boolean';
};

module.exports.verifyInt = function (num) {
    return typeof num == 'number' && isFinite(num) && (0 | num) === num;
};

module.exports.verifyNum = function (num) {
    return typeof num == 'number' && isFinite(num);
};

module.exports.verifierStr = function (re) {
    return function (str) {
        return typeof str == 'string' && str.length <= 32 && re.test(str);
    };
};

module.exports.verifierText = function () {
    return function (str) {
        return typeof str == 'string' && str.length <= 256;
    };
};

module.exports.verifierArr = function (verifier) {
    return function (arr) {
        if (!arr instanceof Array) {
            return false;
        }

        for (var i in arr) {
            if (!verifier(arr[i])) {
                return false;
            }
        }

        return true;
    };
};

module.exports.verifierObj = function (keyVerifier, valueVerifier) {
    // notice: use verified objects carefully
    //         {__proto__: 123, ...}

    return function (obj) {
        if (!obj instanceof Object) {
            return false;
        }

        for (var i in obj) {
            if (!keyVerifier(i) || !valueVerifier(obj[i])) {
                return false;
            }
        }

        return true;
    };
};
