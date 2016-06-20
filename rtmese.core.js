'use strict';

var engine = require('./rtmese.engine');

module.exports.init = function (count, delta, events) {
    var game = engine.init(count);

    game.tick_delta = delta;
    game.now_tick = 0;
    game.events = events;
    game.submissions = {};
};

module.exports.submit = function (
    game, player,
    price, prod_rate, mk, ci, rd
) {
    if (!game.submissions[game.now_tick]) {
        game.submissions[game.now_tick] = [];
    }

    game.submissions[game.now_tick].push([
        player, price, prod_rate, mk, ci, rd
    ]);
};

module.exports.exec = function (game) {
    var events = game.events[game.now_tick] || [];
    for (var i in events) {
        game.settings[events[i][0]] = events[i][1];
    }

    var submissions = game.submissions[game.now_tick] || [];
    for (var i in submissions) {
        game.decisions.price[submissions[i][0]] = submissions[i][1];
        game.decisions.prod_rate[submissions[i][0]] = submissions[i][2];
        game.decisions.mk[submissions[i][0]] = submissions[i][3];
        game.decisions.ci[submissions[i][0]] = submissions[i][4];
        game.decisions.rd[submissions[i][0]] = submissions[i][5];
    }

    game.now_tick += 1;

    engine.exec(game, game.tick_delta);
};
