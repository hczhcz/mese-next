'use strict';

define('mese.admin', function (require, module) {
    var message = require('ui.message');
    var socket = require('socket');

    $('#admin_report_submit').click(function () {
        socket.emit('admin_mese_report', {
            game: $('#admin_report_game').val(),
        });
    });

    $('#admin_transfer_submit').click(function () {
        socket.emit('admin_mese_transfer', {
            game: $('#admin_transfer_game').val(),
            user: $('#admin_transfer_user').val(),
        });
    });

    $('#admin_init_submit').click(function () {
        socket.emit('admin_mese_init', {
            game: $('#admin_init_game').val(),
            players: $('#admin_init_players').val().split(','),
            preset: $('#admin_init_preset').val(),
            settings: eval('(' + $('#admin_settings').val() + ')'),
        });
    });

    $('#admin_alloc_submit').click(function () {
        socket.emit('admin_mese_alloc', {
            game: $('#admin_alloc_game').val(),
            settings: eval('(' + $('#admin_settings').val() + ')'),
        });
    });

    socket.on('admin_mese_report_data', function (data) {
        $('#admin_report').val(JSON.stringify(data));
    });

    socket.on('admin_mese_report_fail_game', function (data) {
        message('Game not found');
    });

    socket.on('admin_mese_report_fail_type', function (data) {
        message('Wrong game type: ' + data);
    });

    socket.on('admin_mese_transfer_ok', function (data) {
        message('Game transferred');
    });

    socket.on('admin_mese_transfer_fail_player', function (data) {
        message('Transferring not allowed');
    });

    socket.on('admin_mese_transfer_fail_game', function (data) {
        message('Game not found');
    });

    socket.on('admin_mese_transfer_fail_type', function (data) {
        message('Wrong game type: ' + data);
    });

    socket.on('admin_mese_init_fail_player', function (data) {
        message('Player count not supported');
    });

    socket.on('admin_mese_init_fail_game', function (data) {
        message('Game exists');
    });

    socket.on('admin_mese_init_fail_invite', function (data) {
        message('Invition not allowed: ' + data);
    });

    socket.on('admin_mese_init_ok', function (data) {
        message('Game created');
    });

    socket.on('admin_mese_init_fail_type', function (data) {
        message('Wrong game type: ' + data);
    });

    socket.on('admin_mese_alloc_ok', function (data) {
        message('Period allocated');
    });

    socket.on('admin_mese_alloc_fail_game', function (data) {
        message('Game not found');
    });

    socket.on('admin_mese_alloc_fail_type', function (data) {
        message('Wrong game type: ' + data);
    });
});
