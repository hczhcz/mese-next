'use strict';

var config = require('./config');
var engine = require('./rtmese.engine');

// events: {tick: {key: value, ...}, ...}
// submissions: {tick: {player: [...]}, ...}
module.exports.init = function (count, final, events) {
    var game = engine.init(count);

    game.tick_delta = config.rtmeseDelta;
    game.now_tick = 0;
    game.final_tick = final;
    game.events = events;
    game.submissions = {};
};

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

module.exports.exec = function (game) {
    var events = game.events[game.now_tick] || {};
    for (var i in events) {
        game.settings[i] = events[i];
    }

    var submissions = game.submissions[game.now_tick] || {};
    for (var i in submissions) {
        game.decisions.price[i] = submissions[i][0];
        game.decisions.prod_rate[i] = submissions[i][1];
        game.decisions.mk[i] = submissions[i][2];
        game.decisions.ci[i] = submissions[i][3];
        game.decisions.rd[i] = submissions[i][4];
    }

    game.now_tick += 1;

    engine.exec(game, game.tick_delta);

    return game.now_tick < game.final_tick;
};
