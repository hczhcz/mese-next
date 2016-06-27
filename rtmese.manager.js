'use strict';

var games = {};

module.exports.schedule = function (
    name, game, delay, execAction
    waitCallback, execCallback, finishCallback
) {
    var exec = function () {
        if (game.pause) {
            // nothing
        } else if (game.delay > 0) {
            waitCallback();

            game.delay -= config.rtmeseInterval;
        } else if (execAction(game)) {
            execCallback();
        } else {
            finishCallback();

            if (games[name] !== game) {
                throw Error('broken runtime');
            }
            delete games[name];

            delete game.pause;
            delete game.delay;

            return;
        }

        setTimeout(exec, config.rtmeseInterval);
    };

    if (games[name]) {
        throw Error('duplicate game name');
    }
    games[name] = game;

    game.pause = false;
    game.delay = delay;

    exec();
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
