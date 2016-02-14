'use strict';

var core = require('./mese.core');

module.exports.print = function (gameData, player, playerCallback, publicCallback) {
    if (player !== undefined) {
        // as player

        core.printPlayer(
            gameData, player,
            function (reportData) {
                playerCallback(eval('(' + reportData + ')'));
            }
        );
    } else {
        // as guest

        core.printPublic(
            gameData,
            function (reportData) {
                publicCallback(eval('(' + reportData + ')'));
            }
        );
    }
};

module.exports.printEarly = function (gameData, player, callback) {
    core.printPlayerEarly(
        gameData, player,
        function (reportData) {
            callback(eval('(' + reportData + ')'));
        }
    );
};
