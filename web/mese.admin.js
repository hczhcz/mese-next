'use strict';

define('mese.admin', function (require, module) {
    var message = require('ui.message');
    var socket = require('socket');

    var parseSettings = function (text) {
        var data = text.split(/-{3,}/);
        var result = [];

        for (var i in data) {
            result.push(eval('({' + data[i] + '})'));
        }

        return result;
    };

    $('#admin_games').change(function () {
        $('#admin_game_game').val($('#admin_games').val());
    });

    $('#admin_game_submit').click(function () {
        // load player / public report
        loadReport($('#admin_game_game').val());
    });

    $('#admin_report_submit').click(function () {
        // TODO
        if (currentGame) {
            // load summary report
            socket.emit('admin_mese_report', {
                game: currentGame,
            });
        } else {
            // TODO
        }
    });

    $('#admin_transfer_submit').click(function () {
        // TODO
        if (currentGame) {
            socket.emit('admin_mese_transfer', {
                game: currentGame,
                user: $('#admin_transfer_user').val(),
            });
        } else {
            // TODO
        }
    });

    $('#admin_init_submit').click(function () {
        socket.emit('admin_mese_init', {
            game: $('#admin_init_game').val(),
            players: $('#admin_init_players').val().split(','),
            preset: $('#admin_init_preset').val(),
            settings: parseSettings($('#admin_settings').val()),
        });
    });

    $('#admin_alloc_submit').click(function () {
        // TODO
        if (currentGame) {
            socket.emit('admin_mese_alloc', {
                game: currentGame,
                settings: parseSettings($('#admin_settings').val()),
            });
        } else {
            // TODO
        }
    });

    socket.on('admin_mese_report_data', function (data) {
        $('#admin_report').val(JSON.stringify(data)); // TODO: format?
    });

    socket.on('admin_mese_report_fail', function (data) {
        message('Game not found');
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
        message('Wrong game type');
    });

    socket.on('admin_mese_init_fail_number', function (data) {
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
        message('Wrong game type');
    });

    socket.on('admin_mese_alloc_ok', function (data) {
        message('Period allocated');
    });

    socket.on('admin_mese_alloc_fail_game', function (data) {
        message('Game not found');
    });

    socket.on('admin_mese_alloc_fail_type', function (data) {
        message('Wrong game type');
    });
});
