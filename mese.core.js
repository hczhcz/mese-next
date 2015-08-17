'use strict';

var childProcess = require('child_process');

module.exports.exec = function (args, input, callback) {
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
        callback(status, Buffer.concat(output));
    });
};

module.exports.execSync = function (args, input, callback) {
    console.log('exec (sync) ' + JSON.stringify(args));

    var proc = childProcess.spawnSync('./mese', args, {
        input: input,
        timeout: 10000,
        maxBuffer: 1024 * 1024 * 4,
    });

    callback(proc.status, proc.stdout);
};
