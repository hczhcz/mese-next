'use strict';

var core = require('./mese.core');

module.exports.submit = function (
    gameData, player, period,
    price, prod, mk, ci, rd,
    callback, printCallback
) {
    core.submit(
        gameData, player, period,
        price, prod, mk, ci, rd,
        function (gameData) {
            core.close(gameData, function (gameData) {
                // accepted, closed
                callback(true, true, gameData);
            }, function (gameData) {
                // accepted, not closed
                callback(true, false, gameData);
            });

            core.printPlayerEarly(gameData, player, printCallback);
        },
        function (gameData) {
            // declined
            // notice: not necessary to close
            callback(false, false, gameData);

            core.printPlayerEarly(gameData, player, printCallback);
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
