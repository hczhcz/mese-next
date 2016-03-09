'use strict';

var core = require('./mese.core');

module.exports.submit = function (
    gameData, player, period,
    price, prod, mk, ci, rd,
    submitCallback, printCallback, closeCallback
) {
    core.submit(
        gameData, player, period,
        price, prod, mk, ci, rd,
        function (gameData) {
            submitCallback(gameData, true);

            core.printPlayerEarly(gameData, player, printCallback);
            core.close(gameData, function (gameData) {
                closeCallback(gameData, true);
            }, function (gameData) {
                closeCallback(gameData, false);
            });
        },
        function (gameData) {
            submitCallback(gameData, false);

            core.printPlayerEarly(gameData, player, printCallback);
            closeCallback(gameData, false); // would not close if submission is declined
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
