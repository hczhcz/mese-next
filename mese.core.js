'use strict';

var childProcess = require('child_process');

module.exports.exec = function (args, input, callback, fail) {
    console.log('exec ' + JSON.stringify(args));

    var proc = childProcess.spawn('./mese', args);
    var output = [];

    if (input) {
        proc.stdin.write(input);
    }

    proc.stdout.on('data', function (data) {
        output.push(data);
    });
    proc.on('close', function (status) {
        if (proc.status) {
            fail(status, Buffer.concat(output));
        } else {
            callback(Buffer.concat(output));
        }
    });
};

module.exports.execSync = function (args, input, callback, fail) {
    console.log('exec (sync) ' + JSON.stringify(args));

    var proc = childProcess.spawnSync('./mese', args, {
        input: input,
        timeout: 10000,
        maxBuffer: 1024 * 1024 * 4,
    });

    if (proc.status) {
        fail(proc.status, proc.stdout);
    } else {
        callback(proc.stdout);
    }
};

var stdFail = function (status, output) {
    throw 1;
};

module.exports.init = function (count, preset, settings, callback) {
    // TODO: settings?
    module.exports.execSync(
        ['init', count, preset],
        Buffer(0),
        callback,
        stdFail
    );
};

module.exports.alloc = function (gameData, settings, callback) {
    // TODO: settings?
    module.exports.execSync(
        ['alloc'],
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
    module.exports.execSync(
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
    module.exports.execSync(
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
    module.exports.exec(
        ['print_full'],
        gameData,
        callback,
        stdFail
    );
};

module.exports.printPlayerEarly = function (gameData, player, callback) {
    module.exports.exec(
        ['print_player_early', player],
        gameData,
        callback,
        stdFail
    );
};

module.exports.printPlayer = function (gameData, player, callback) {
    module.exports.exec(
        ['print_player', player],
        gameData,
        callback,
        stdFail
    );
};

module.exports.printPublic = function (gameData, callback) {
    module.exports.exec(
        ['print_public'],
        gameData,
        callback,
        stdFail
    );
};
