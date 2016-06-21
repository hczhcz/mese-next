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

    return engine.exec(game);
};

module.exports.schedule = function (
    game, delay,
    waitCallback, execCallback, finishCallback
) {
    var doExec = function () {
        if (module.exports.exec(game)) {
            execCallback();

            setTimeout(doExec, config.rtmeseInterval);
        } else {
            finishCallback();
        }
    };

    var doWait = function () {
        if (game.delay > 0) {
            waitCallback();

            game.delay -= config.rtmeseInterval;
            setTimeout(doWait, config.rtmeseInterval);
        } else {
            delete game.delay;

            doExec();
        }
    };

    game.delay = delay;
    doWait();
};
