'use strict';

var config = require('./config');

var games = {};

module.exports.schedule = function (
    name, game, delay, execAction,
    waitCallback, execCallback, stopCallback, fail
) {
    var stop = function () {
        stopCallback(game);

        if (games[name] !== game) {
            throw Error('broken runtime');
        }
        delete games[name];

        delete game.stop;
        delete game.delay;
    };

    var exec = function () {
        if (game.stop) {
            stop();
        } else if (game.delay > 0) {
            waitCallback(game);

            game.delay -= config.rtmeseInterval;

            setTimeout(exec, config.rtmeseInterval);
        } else if (execAction(game)) {
            execCallback(game);

            setTimeout(exec, config.rtmeseInterval);
        } else {
            stop();
        }
    };

    if (games[name] !== undefined) {
        fail();
    } else {
        games[name] = game;

        game.stop = false;
        game.delay = delay;

        exec();
    }
};

module.exports.get = function (
    name,
    callback, fail
) {
    if (games[name] !== undefined) {
        callback(games[name]);
    } else {
        fail();
    }
};
