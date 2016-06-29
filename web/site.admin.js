'use strict';

define('site.admin', function (require, module) {
    var socket = require('socket');
    var login = require('login');

    module.exports.gameLoaders = {};

    $('#admin_message_submit').click(function () {
        socket.emit('admin_message', {
            message: $('#admin_message_content').val(),
        });
    });

    $('#admin_list_refresh').click(function () {
        socket.emit('admin_list');
    });

    $('#admin_users').change(function () {
        var list = $('#admin_users').val();

        if (list.length === 1) {
            $('#admin_login_user').val(list);
            $('#admin_transfer_user').val(list);
        } else if (list.length > 1) {
            $('#admin_init_players').val(list.join(','));
        }
    });

    $('#admin_login_submit').click(function () {
        socket.emit('admin_login', {
            user: $('#admin_login_user').val(),
        });
    });

    $('#admin_games').change(function () {
        $('#admin_game_game').val($('#admin_games').val());
    });

    $('#admin_game_submit').click(function () {
        // load player / public report
        module.exports.gameLoaders.loadGame(
            $('#admin_game_game').val()
        );
    });

    $('#admin_password_submit').click(function () {
        socket.emit('admin_password', {
            newPassword: login.sha($('#admin_password_new').val()),
        });
    });

    socket.on('admin_auth_ok', function (data) {
        $('#admin').removeClass('hide');

        socket.emit('admin_list');
    });

    socket.on('admin_list_data', function (data) {
        // notice: use html string when data size becomes large

        var load = function (target, list) {
            target.empty();

            for (var i in list) {
                target.prepend(
                    $('<option>').text(list[i])
                );
            }
        };

        load($('#admin_users'), data.users);
        load($('#admin_games'), data.games);
    });
});
