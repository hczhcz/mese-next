'use strict';

var config = require('./mese.config');
var db = require('./mese.db');

module.exports.user = function (name, callback) {
    db.get('users', name, callback);
};

module.exports.game = function (game, callback) {
    db.get('games', game, callback);
};

module.exports.userAuth = function (name, callback) {
    db.update('users', name, function (doc, setter, next) {
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

module.exports.userSubscribe = function (name, game, enabled, callback, fail) {
    db.update('users', name, function (doc, setter, next) {
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
            callback(doc.players, doc.data.buffer, gameDataSetter) || next();
        } else {
            fail(gameDataSetter) || next();
        }
    });
};
