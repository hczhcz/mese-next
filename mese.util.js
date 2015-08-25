'use strict';

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

module.exports.verify = function (re, str) {
    return typeof str == 'string' && str.length <= 32 && re.test(str);
};

module.exports.verifyInt = function (num) {
    return typeof num == 'number' && (0 | num) == num;
};

module.exports.verifyBool = function (bool) {
    return typeof bool == 'boolean';
};
