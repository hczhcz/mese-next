'use strict';

define('site.user', function (require, module) {
    var bind = require('ui.bind');
    var message = require('ui.message');
    var socket = require('socket');
    var login = require('login');

    module.exports.gameLoaders = {};

    // login

    var loginDone = function (user) {
        bind.variable('user', user);

        $('#user').removeClass('hide');
        $('#login').addClass('hide');
        $('#login_show').removeClass('hide');
        $('#password').addClass('hide');
        $('#password_show').removeClass('hide');
        $('#subscribe').removeClass('hide');

        socket.emit('list');

        module.exports.gameLoaders.defaultGame();
    };

    $('#login_show_submit').click(function () {
        login.reset();

        $('#login').removeClass('hide');
        $('#login_show').addClass('hide');
    });

    $('#login_user').change(function () {
        if (/^[A-Za-z0-9_ ]+$/.test($('#login_user').val())) {
            $('#login_user').removeClass('wrong');
        } else {
            $('#login_user').addClass('wrong');
        }
    });

    $('#login_user').keypress(function (event) {
        if (event.which === 13) {
            $('#login_password').focus();
        }
    });

    $('#login_password').keypress(function (event) {
        if (event.which === 13) {
            $('#login_submit').click();
        }
    });

    $('#login_remember').keypress(function (event) {
        if (event.which === 13) {
            $('#login_submit').click();
        }
    });

    $('#login_submit').click(function (event) {
        event.preventDefault();

        var user = $('#login_user').val();
        var password = login.sha($('#login_password').val());
        $('#login_password').val('');

        // auto login
        login.set(
            {
                user: user,
                password: password,
            },
            $('#login_remember').prop('checked'),
            function (login) {
                socket.emit('login', login);
            }
        );
    });

    socket.on('login_new', function (data) {
        loginDone(data);

        message('New user: ' + data);
    });

    socket.on('login_ok', function (data) {
        loginDone(data);

        message('Login: ' + data);
    });

    socket.on('login_fail', function (data) {
        login.reset();

        message('Wrong password');
    });

    // password

    $('#password_show_submit').click(function () {
        login.reset();

        $('#password').removeClass('hide');
        $('#password_show').addClass('hide');
    });

    $('#password_old').keypress(function (event) {
        if (event.which === 13) {
            $('#password_new').focus();
        }
    });

    $('#password_new').keypress(function (event) {
        if (event.which === 13) {
            $('#password_submit').click();
        }
    });

    $('#password_submit').click(function (event) {
        event.preventDefault();

        var password = login.sha($('#password_old').val());
        var newPassword = login.sha($('#password_new').val());
        $('#password_old').val('');
        $('#password_new').val('');

        socket.emit('password', {
            password: password,
            newPassword: newPassword,
        });
    });

    socket.on('password_ok', function (data) {
        message('Password changed');
    });

    socket.on('password_fail', function (data) {
        message('Wrong password');
    });

    // subscribe & list

    var currentList = undefined;

    // auto refresh
    socket.poll(function () {
        socket.emit('list');
    }, 60000);

    $('#subscribe_game').change(function () {
        if (/^[A-Za-z0-9_ ]+$/.test($('#subscribe_game').val())) {
            $('#subscribe_game').removeClass('wrong');
        } else {
            $('#subscribe_game').addClass('wrong');
        }
    });

    $('#subscribe_game').keypress(function (event) {
        if (event.which === 13) {
            $('#subscribe_submit').click();
        }
    });

    $('#subscribe_submit').click(function (event) {
        event.preventDefault();

        var game = $('#subscribe_game').val();

        socket.emit('subscribe', {
            game: game,
            enabled: !currentList[game],
        });
    });

    socket.on('subscribe_data', function (data) {
        currentList = data;

        $('#list_content').empty();

        var loader = function (game) {
            return function (event) {
                event.preventDefault();

                module.exports.gameLoaders.mese(game); // TODO
            };
        };

        for (var i in currentList) {
            if (currentList[i] !== undefined) {
                $('#list_content').prepend(
                    $('<input type="button" />')
                        .val(i)
                        .click(loader(i))
                );
            }
        }

        $('#list').removeClass('hide');
    });

    socket.on('subscribe_fail_list', function (data) {
        message('List not found');
    });

    socket.on('subscribe_fail_player', function (data) {
        message('Subscription not allowed');
    });

    socket.on('subscribe_fail_game', function (data) {
        message('Game not found');
    });
});
