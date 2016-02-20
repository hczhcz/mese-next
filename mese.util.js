'use strict';

var domain = require('domain');

module.exports.log = function (info) {
    var date = new Date();

    console.log(
        '['
            + date.getFullYear() + '.'
            + (date.getMonth() + 1) + '.'
            + date.getDate() + ' '
            + date.getHours() + ':'
            + date.getMinutes() + ':'
            + date.getSeconds() + '.'
            + date.getMilliseconds()
        + '] '
        + info
    );
};

module.exports.verifyBool = function (bool) {
    return typeof bool == 'boolean';
};

module.exports.verifyInt = function (num) {
    return typeof num == 'number' && isFinite(num) && (0 | num) == num;
};

module.exports.verifyNum = function (num) {
    return typeof num == 'number' && isFinite(num);
};

module.exports.verifierStr = function (re) {
    return function (str) {
        return typeof str == 'string' && str.length <= 32 && re.test(str);
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

module.exports.domainRun = function (emitters, callback, fail) {
    var d = domain.create();

    d.on('error', fail);

    for (var i in emitters) {
        d.add(emitters[i]);
    }

    d.run(callback);
};

module.exports.domainRunCatched = function (emitters, callback) {
    module.exports.domainRun(
        emitters, callback,
        function (e) {
            module.exports.log(e.stack || e);
        }
    );
};
