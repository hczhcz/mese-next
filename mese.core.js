'use strict';

var childProcess = require('child_process');

var config = require('./config');
var util = require('./util');

var execCore = function (args, input, callback, fail) {
    util.log('exec ' + JSON.stringify(args));

    var proc = childProcess.spawn(config.core, args);
    var output = [];

    if (input !== undefined) {
        proc.stdin.write(input);
    }

    proc.stdout.on('data', function (data) {
        output.push(data);
    });

    proc.on('close', function (status) {
        if (status != 0) {
            fail(status, Buffer.concat(output));
        } else {
            callback(Buffer.concat(output));
        }
    });
};

var stdFail = function (status, output) {
    throw Error('exec fail ' + status);
};

var dataCallback = function (callback) {
    return function (data) {
        if (data.length < config.coreMinDataSize) {
            throw Error('broken data');
        }
        callback(data);
    };
};

var evalCallback = function (callback) {
    return function (data) {
        callback(eval('(' + data + ')'));
    };
};

module.exports.init = function (count, preset, settings, callback) {
    var args = ['init', count, preset];

    for (var i in settings) {
        args.push(i);
        args.push(settings[i]);
    }

    execCore(
        args,
        undefined,
        dataCallback(callback),
        stdFail
    );
};

module.exports.alloc = function (gameData, settings, callback) {
    var args = ['alloc'];

    for (var i in settings) {
        args.push(i);
        args.push(settings[i]);
    }

    execCore(
        args,
        gameData,
        dataCallback(callback),
        stdFail
    );
};

module.exports.submit = function (
    gameData, player, period,
    price, prod, mk, ci, rd,
    callback, fail
) {
    execCore(
        ['submit', player, period, price, prod, mk, ci, rd],
        gameData,
        dataCallback(callback),
        function (status, output) {
            if (status == 1) {
                fail(output);
            } else {
                stdFail(status, output);
            }
        }
    );
};

module.exports.close = function (gameData, callback, fail) {
    execCore(
        ['close'],
        gameData,
        dataCallback(callback),
        function (status, output) {
            if (status == 1) {
                fail(output);
            } else {
                stdFail(status, output);
            }
        }
    );
};

module.exports.printFull = function (gameData, callback) {
    execCore(
        ['print_full'],
        gameData,
        evalCallback(callback),
        stdFail
    );
};

module.exports.printPlayerEarly = function (gameData, player, callback) {
    execCore(
        ['print_player_early', player],
        gameData,
        evalCallback(callback),
        stdFail
    );
};

module.exports.printPlayer = function (gameData, player, callback) {
    execCore(
        ['print_player', player],
        gameData,
        evalCallback(callback),
        stdFail
    );
};

module.exports.printPublic = function (gameData, callback) {
    execCore(
        ['print_public'],
        gameData,
        evalCallback(callback),
        stdFail
    );
};
