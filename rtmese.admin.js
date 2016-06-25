'use strict';

var config = require('./config');
var engine = require('./rtmese.engine');

// events: {tick: {key: value, ...}, ...}
// submissions: {tick: {player: [...]}, ...}
module.exports.init = function (count, final, events) {
    var game = engine.init(count, final, config.rtmeseDelta);

    game.events = events;
    game.submissions = {};
};

module.exports.exec = function (game) {
    var applyEvents = function (events) {
        for (var i in events) {
            game.settings[i] = events[i];
        }
    };
    applyEvents(game.events[game.now_tick] || {});

    var applySubmissions = function (submissions) {
        for (var i in submissions) {
            game.decisions.price[i] = submissions[i][0];
            game.decisions.prod_rate[i] = submissions[i][1];
            game.decisions.mk[i] = submissions[i][2];
            game.decisions.ci[i] = submissions[i][3];
            game.decisions.rd[i] = submissions[i][4];
        }
    };
    applySubmissions(game.submissions[game.now_tick] || {});

    return engine.exec(game);
};
