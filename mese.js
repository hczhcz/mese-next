'use strict';

var port = 63000;

var fs = require('fs');
var ffi = require('ffi');
var domain = require('domain');
var http = require('http'); // TODO: https?
var io = require('socket.io');
// var querystring = require('querystring');
// var Cookies = require('cookies');

var filePage = fs.readFileSync('./page.html');
var fileSocket = fs.readFileSync('./page.html');

var server = http.createServer(function (req, res) {
    var d = domain.create();

    d.on('error', function (e) {
        // ignore
    });

    d.add(req);
    d.add(res);

    d.run(function () {
        res.writeHead(200);
        res.end(filePage);
    });
}).listen(port);

io(server).on('connection', function (socket) {
    var d = domain.create();

    d.on('error', function (e) {
        // ignore
    });

    d.add(socket);

    d.run(function () {
        socket.on('login', function (data) {
            socket.on('submit', function (data) {
                //
            });
            socket.on('password', function (data) {
                //
            });
        });
    });
});
