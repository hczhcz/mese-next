'use strict';

var core = require('./mese.core');

// settings: [{key: value, ...}, ...]
var allocator = function (settings, callback) {
    return function (gameData) {
        module.exports.alloc(gameData, settings, callback);
    };
};

module.exports.init = function (
    count, preset, settings,
    callback
) {
    core.init(
        count, preset, settings[0],
        allocator(settings.slice(1), callback)
    );
};

module.exports.alloc = function (
    gameData, settings,
    callback
) {
    if (settings.length > 0) {
        core.alloc(
            gameData, settings[0],
            allocator(settings.slice(1), callback)
        )
    } else {
        callback(gameData);
    }
};

module.exports.print = core.printFull;
