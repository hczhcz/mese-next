'use strict';

var core = require('./mese.core');

module.exports.init = function (
    players, settings,
    callback
) {
    // TODO
};

module.exports.print = function (
    gameData,
    callback
) {
    core.printFull(
        gameData,
        function (reportData) {
            callback(eval('(' + reportData + ')'));
        }
    );
};
