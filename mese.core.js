'use strict';

var childProcess = require('child_process');

var util = require('./mese.util');

var execCore = function (args, input, callback, fail) {
    util.log('exec ' + JSON.stringify(args));

    var proc = childProcess.spawn('./mese', args);
    var output = [];

    if (input) {
        proc.stdin.write(input);
    }

    proc.stdout.on('data', function (data) {
        output.push(data);
    });

    proc.on('close', function (status) {
        if (status) {
            fail(status, Buffer.concat(output));
        } else {
            callback(Buffer.concat(output));
        }
    });
};

var stdFail = function (status, output) {
    throw Error('exec fail: ' + status);
};

module.exports.init = function (count, preset, settings, callback) {
    var args = ['init', count, preset];

    for (var i in settings) {
        args.push(i);
        args.push(settings[i]);
    }

    execCore(
        args,
        Buffer(0),
        callback,
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
        callback,
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
        callback,
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
        callback,
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
        callback,
        stdFail
    );
};

module.exports.printPlayerEarly = function (gameData, player, callback) {
    execCore(
        ['print_player_early', player],
        gameData,
        callback,
        stdFail
    );
};

module.exports.printPlayer = function (gameData, player, callback) {
    execCore(
        ['print_player', player],
        gameData,
        callback,
        stdFail
    );
};

module.exports.printPublic = function (gameData, callback) {
    execCore(
        ['print_public'],
        gameData,
        callback,
        stdFail
    );
};
