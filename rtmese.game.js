'use strict';

var engine = require('./rtmese.engine');

module.exports.submit = function (
    game, player,
    price, prod_rate, mk, ci, rd
) {
    if (!game.submissions[game.now_tick]) {
        game.submissions[game.now_tick] = {};
    }

    game.submissions[game.now_tick][player] = [
        price, prod_rate, mk, ci, rd
    ]);
};

module.exports.printReport = function (
    game, player,
    playerCallback, publicCallback
) {
    if (player >= 0) {
        // as player

        core.printPlayer(gameData, player, playerCallback);
    } else {
        // as guest

        core.printPublic(gameData, publicCallback);
    }
};
