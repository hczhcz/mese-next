'use strict';

var verify = require('./util.verify');
var access = require('./server.access');

module.exports = function (socket, session) {
    socket.on('admin_message', function (args) {
        // args: message

        if (
            !session.sudo
            || !verify.text()(args.message)
        ) {
            session.log('bad socket request');

            return;
        }

        session.log('admin message ' + args.message);

        socket.server.emit('message', args.message);
    });

    socket.on('admin_login', function (args) {
        // args: user

        if (
            !session.sudo
            || !verify.str(/^[A-Za-z0-9_ ]+$/)(args.user)
        ) {
            session.log('bad socket request');

            return;
        }

        session.log('admin login ' + args.user);

        session.user = args.user;

        socket.emit('login_ok', session.user);
    });

    socket.on('admin_password', function (args) {
        // args: newPassword

        if (
            !session.sudo
            || !verify.str(/^.+$/)(args.newPassword)
        ) {
            session.log('bad socket request');

            return;
        }

        session.log('admin change password');

        access.userAuth(session.user, function (password, setter) {
            setter(args.newPassword, function () {
                socket.emit('password_ok');
            });

            return true; // need setter
        });
    });

    socket.on('admin_list', function (args) {
        // args: (nothing)

        if (
            !session.sudo
        ) {
            session.log('bad socket request');

            return;
        }

        session.log('admin list all');

        access.users(function (userList) {
            access.games(function (gameList) {
                socket.emit('admin_list_data', {users: userList, games: gameList});
            });
        });
    });

    socket.on('admin_transfer', function (args) {
        // args: game, user

        if (
            !session.sudo
            || !verify.str(/^[A-Za-z0-9_ ]+$/)(args.game)
            || !verify.str(/^[A-Za-z0-9_ ]+$/)(args.user)
        ) {
            session.log('bad socket request');

            return;
        }

        session.log('admin transfer game ' + args.game + ' ' + args.user);

        access.gameAction(
            args.game,
            function (players, oldData, setter) {
                var player = -1;

                for (var i in players) {
                    if (players[i] === session.user) {
                        player = parseInt(i, 10);
                        break;
                    }
                }

                if (player >= 0) {
                    players[player] = args.user;

                    // store data
                    setter(players, undefined, function () {
                        socket.emit('admin_transfer_ok');
                    });

                    return true; // need setter
                } else {
                    session.log('transferring not allowed ' + args.game);

                    socket.emit('admin_transfer_fail_player');
                }
            },
            function (setter) {
                session.log('game not found ' + args.game);

                socket.emit('admin_transfer_fail_game');
            }
        );
    });
};
