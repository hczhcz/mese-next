'use strict';

var config = require('./config');
var verify = require('./util.verify');
var access = require('./server.access');

module.exports = function (socket, session) {
    socket.on('login', function (args) {
        // args: user, password

        if (
            !verify.str(/^[A-Za-z0-9_ ]+$/)(args.user)
            || !verify.hash(32)(args.password)
        ) {
            session.log('bad socket request');

            return;
        }

        session.log('login ' + args.user);

        access.userAuth(args.user, function (password, setter) {
            if (password === undefined) {
                setter(args.password, function () {
                    session.user = args.user;

                    session.log('new user');

                    socket.emit('login_new', session.user);

                    // notice: admin user should login again here
                });

                return true; // need setter
            } else if (password.equals(new Buffer(args.password))) {
                session.user = args.user;

                socket.emit('login_ok', session.user);

                if (
                    args.user === config.adminUser
                    && args.password === config.adminPassword
                ) {
                    session.sudo = true;

                    session.log('admin auth');

                    socket.emit('admin_auth_ok');
                }
            } else {
                session.log('wrong password');

                socket.emit('login_fail');
            }
        });
    });

    socket.on('password', function (args) {
        // args: password, newPassword

        if (
            session.user === undefined
            || !verify.hash(32)(args.password)
            || !verify.hash(32)(args.newPassword)
        ) {
            session.log('bad socket request');

            return;
        }

        session.log('change password');

        access.userAuth(session.user, function (password, setter) {
            if (password.equals(new Buffer(args.password))) {
                setter(args.newPassword, function () {
                    socket.emit('password_ok');
                });

                return true; // need setter
            } else {
                session.log('wrong password');

                socket.emit('password_fail');
            }
        });
    });

    socket.on('list', function (args) {
        // args: (nothing)

        if (
            session.user === undefined
        ) {
            session.log('bad socket request');

            return;
        }

        session.log('list games');

        access.user(
            session.user,
            function (subscribes) {
                socket.emit('subscribe_data', subscribes);
            },
            function () {
                session.log('list not found');

                socket.emit('list_fail');
            }
        );
    });

    socket.on('subscribe', function (args) {
        // args: game, enabled

        if (
            session.user === undefined
            || !verify.str(/^[A-Za-z0-9_ ]+$/)(args.game)
            || !verify.bool()(args.enabled)
        ) {
            session.log('bad socket request');

            return;
        }

        if (args.enabled) {
            session.log('subscribe game ' + args.game);
        } else {
            session.log('unsubscribe game ' + args.game);
        }

        var changeSubscribe = function () {
            access.userSubscribe(
                session.user, args.game, args.enabled,
                function (subscribes) {
                    socket.emit('subscribe_data', subscribes);
                },
                function () {
                    session.log('subscription not allowed');

                    socket.emit('subscribe_fail_player');
                }
            );
        };

        access.gameExist(
            args.game,
            function () {
                changeSubscribe();
            },
            function () {
                if (args.enabled) {
                    session.log('game not found ' + args.game);

                    socket.emit('subscribe_fail_game');
                } else {
                    changeSubscribe();
                }
            }
        );
    });
};
