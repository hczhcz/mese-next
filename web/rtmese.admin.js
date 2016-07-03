'use strict';

define('rtmese.admin', function (require, module) {
    var message = require('ui.message');
    var socket = require('socket');

    $('#admin_report_submit').click(function () {
        socket.emit('admin_rtmese_report', {
            game: $('#admin_report_game').val(),
        });
    });

    $('#admin_init_submit').click(function () {
        socket.emit('admin_rtmese_init', {
            game: $('#admin_init_game').val(),
            players: $('#admin_init_players').val().split(','),
            ticks: parseInt($('#admin_init_ticks').val(), 10),
            events: eval('(' + $('#admin_events').val() + ')'),
        });
    });

    $('#admin_schedule_submit').click(function () {
        socket.emit('admin_rtmese_schedule', {
            game: $('#admin_schedule_game').val(),
            delay: parseInt($('#admin_schedule_delay').val(), 10),
        });
    });

    $('#admin_stop_submit').click(function () {
        socket.emit('admin_rtmese_stop', {
            game: $('#admin_stop_game').val(),
        });
    });

    socket.on('admin_rtmese_report_data', function (data) {
        $('#admin_report').val(JSON.stringify(data));
    });

    socket.on('admin_rtmese_report_fail_game', function (data) {
        message('Game not found');
    });

    socket.on('admin_rtmese_report_fail_type', function (data) {
        message('Wrong game type: ' + data);
    });

    socket.on('admin_rtmese_init_fail_player', function (data) {
        message('Player count not supported');
    });

    socket.on('admin_rtmese_init_fail_game', function (data) {
        message('Game exists');
    });

    socket.on('admin_rtmese_init_fail_invite', function (data) {
        message('Invition not allowed: ' + data);
    });

    socket.on('admin_rtmese_init_ok', function (data) {
        message('Game created');
    });

    socket.on('admin_rtmese_init_fail_type', function (data) {
        message('Wrong game type: ' + data);
    });

    socket.on('admin_rtmese_schedule_ok', function (data) {
        message('Game scheduled');
    });

    socket.on('admin_rtmese_schedule_fail_running', function (data) {
        message('Game is already running');
    });

    socket.on('admin_rtmese_schedule_fail_game', function (data) {
        message('Game not found');
    });

    socket.on('admin_rtmese_schedule_fail_type', function (data) {
        message('Wrong game type: ' + data);
    });

    socket.on('admin_rtmese_stop_ok', function (data) {
        message('Game stopped');
    });

    socket.on('admin_rtmese_stop_fail', function (data) {
        message('Game is not running');
    });
});
