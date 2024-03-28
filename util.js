'use strict';

module.exports.log = function (info) {
    var date = new Date();

    var zero2 = function (str) {
        return ('0' + str).slice(-2);
    };
    var zero3 = function (str) {
        return ('00' + str).slice(-3);
    };

    console.log(
        '['
            + date.getFullYear() + '.'
            + zero2(date.getMonth() + 1) + '.'
            + zero2(date.getDate()) + ' '
            + zero2(date.getHours()) + ':'
            + zero2(date.getMinutes()) + ':'
            + zero2(date.getSeconds()) + '.'
            + zero3(date.getMilliseconds())
        + '] '
        + info
    );
};

module.exports.err = function (err) {
    module.exports.log(err.stack || 'Error ' + typeof err + ': ' + err);
};
