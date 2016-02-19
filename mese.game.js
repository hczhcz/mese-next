'use strict';

var core = require('./mese.core');

module.exports.submit = function (
    gameData, player, period,
    price, prod, mk, ci, rd,
    callback, fail, printCallback, closeCallback, closeFail
) {
    core.submit(
        gameData, player, period,
        price, prod, mk, ci, rd,
        function (gameData) {
            callback(gameData);

            core.printPlayerEarly(gameData, player, printCallback);
            core.close(gameData, closeCallback, closeFail);
        },
        function (gameData) {
            fail(gameData);

            core.printPlayerEarly(gameData, player, printCallback);
            closeFail(gameData); // would not close if submission is declined
        }
    );
};

module.exports.print = function (
    gameData, player,
    playerCallback, publicCallback
) {
    if (player !== undefined) {
        // as player

        core.printPlayer(gameData, player, playerCallback);
    } else {
        // as guest

        core.printPublic(gameData, publicCallback);
    }
};
