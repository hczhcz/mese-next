'use strict';

var report = require('./rtmese.report');

module.exports.submit = function (
    game, player,
    price, prod_rate, mk, ci, rd
) {
    if (game.submissions[game.now_tick] === undefined) {
        game.submissions[game.now_tick] = {};
    }

    game.submissions[game.now_tick][player] = [price, prod_rate, mk, ci, rd];
};

module.exports.print = function (
    game, player,
    playerCallback, publicCallback
) {
    if (player >= 0) {
        // as player

        playerCallback(report.printPlayer(game, player));
    } else {
        // as guest

        publicCallback(report.printPublic(game));
    }
};
