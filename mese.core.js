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
    proc.on('close', function (code) {
        callback(code, Buffer.concat(output));
    });
};
