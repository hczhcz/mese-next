'use strict';

var engine = require('./rtmese.engine');

module.exports.init = function (count, delta, events) {
    var game = engine.init(count);

    game.tick_delta = delta;
    game.now_tick = 0;
    game.events = events;
    game.submissions = {};
};

module.exports.submit = function () {
    //
};

module.exports.exec = function () {
    //
};
