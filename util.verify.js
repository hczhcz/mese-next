'use strict';

module.exports.bool = function () {
    return function (bool) {
        return typeof bool === 'boolean';
    };
};

module.exports.int = function () {
    return function (num) {
        return typeof num === 'number' && isFinite(num) && Math.round(num) === num;
    };
};

module.exports.num = function () {
    return function (num) {
        return typeof num === 'number' && isFinite(num);
    };
};

module.exports.str = function (re) {
    return function (str) {
        return typeof str === 'string' && str.length <= 32 && re.test(str);
    };
};

module.exports.text = function () {
    return function (str) {
        return typeof str === 'string' && str.length <= 256;
    };
};

module.exports.hash = function (len) {
    return function (str) {
        return typeof str === 'string' && str.length === len;
    };
};

module.exports.arr = function (verifier) {
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

module.exports.obj = function (keyVerifier, valueVerifier) {
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
