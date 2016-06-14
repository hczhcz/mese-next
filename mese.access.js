'use strict';

var config = require('./config');
var db = require('./mese.db');

module.exports.init = function (path, callback) {
    db.init(path, ['users', 'games'], callback);
};

module.exports.user = function (user, callback, fail) {
    db.get('users', user, function (doc) {
        if (doc) {
            callback(doc.subscribes || {});
        } else {
            fail();
        }
    });
};

module.exports.users = function (callback) {
    db.list('users', callback);
};

module.exports.userAuth = function (user, callback) {
    db.update('users', user, function (doc, setter, next) {
        var passwordSetter = function (password, callback) {
            setter(
                {password: password},
                function () {
                    callback();
                    next();
                }
            );
        };

        callback(doc ? doc.password : undefined, passwordSetter) || next();
    });
};

module.exports.userSubscribe = function (user, game, enabled, callback, fail) {
    db.update('users', user, function (doc, setter, next) {
        if (doc) {
            var subscribes = doc.subscribes || {};
            subscribes[game] = enabled;

            setter(
                {subscribes: subscribes},
                function () {
                    callback(subscribes);
                    next();
                }
            );
        } else {
            fail();
        }
    });
};

module.exports.game = function (game, callback, fail) {
    db.get('games', game, function (doc) {
        if (doc) {
            // notice: .buffer is required for binary data
            callback(doc.uid, doc.players, doc.data.buffer);
        } else {
            fail();
        }
    });
};

module.exports.games = function (callback) {
    db.list('games', callback);
};

module.exports.gameAction = function (game, callback, fail) {
    db.update('games', game, function (doc, setter, next) {
        var gameDataSetter = function (players, gameData, callback) {
            // generate an unique id (assumed unique)
            var diff = {uid: Number(new Date())};

            if (players !== undefined) {
                diff.players = players;
            }
            if (gameData !== undefined) {
                if (gameData.length < config.coreMinDataSize) {
                    throw Error('broken data');
                }
                diff.data = gameData;
            }

            setter(
                diff,
                function () {
                    callback();
                    next();
                }
            );
        };

        if (doc) {
            // notice: .buffer is required for binary data
            callback(doc.players, doc.data.buffer, gameDataSetter, next) || next();
        } else {
            fail(gameDataSetter) || next();
        }
    });
};
