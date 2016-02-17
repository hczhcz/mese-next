'use strict';

var util = require('./mese.util');
var core = require('./mese.core');

module.exports.submit = function (
    gameData, player, period,
    price, prod, mk, ci, rd,
    callback, fail, closeCallback, closeFail
) {
    core.submit(
        gameData, player, period,
        price, prod, mk, ci, rd,
        function (gameData) {
            callback(gameData);

            core.close(gameData, closeCallback, closeFail);
        },
        function (gameData) {
            fail(gameData);

            closeFail(gameData); // would not close if submission is declined
        }
    );
}
