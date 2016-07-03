'use strict';

var db = require('./util.db');

module.exports.init = function (path, callback) {
    db.init(path, ['users', 'games'], callback);
};

module.exports.users = function (callback) {
    db.list('users', callback);
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

module.exports.userAuth = function (user, callback) {
    db.update('users', user, function (doc, setter, next) {
        var passwordSetter = function (password, setterCallback) {
            setter(
                {password: new Buffer(password)},
                function () {
                    next();
                    setterCallback();
                }
            );
        };

        // notice: .buffer is required for binary data
        if (!callback(
            doc && doc.password ?
            doc.password.buffer :
            undefined, passwordSetter
        )) {
            next();
        }
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
                    next();
                    callback(subscribes);
                }
            );
        } else {
            next();
            fail();
        }
    });
};

module.exports.games = function (callback) {
    db.list('games', callback);
};

module.exports.gameExist = function (game, callback, fail) {
    db.get('games', game, function (doc) {
        if (doc) {
            callback();
        } else {
            fail();
        }
    });
};

module.exports.game = function (type, game, callback, failGame, failType) {
    db.get('games', game, function (doc) {
        if (doc) {
            if (doc.type === type) {
                // notice: .buffer is required for binary data
                callback(doc.uid, doc.players, doc.data.buffer);
            } else {
                failType(doc.type);
            }
        } else {
            failGame();
        }
    });
};

module.exports.gameAction = function (
    type, game,
    existCallback, newCallback, fail
) {
    db.update('games', game, function (doc, setter, next) {
        var gameDataSetter = function (players, gameData, setterCallback) {
            // generate an unique id (assumed unique)
            var diff = {
                uid: Number(new Date()),
                type: type,
            };

            if (players !== undefined) {
                diff.players = players;
            }
            if (gameData !== undefined) {
                diff.data = gameData;
            }

            setter(
                diff,
                function () {
                    next();
                    setterCallback();
                }
            );
        };

        if (doc) {
            if (doc.type === type) {
                // notice: .buffer is required for binary data
                if (
                    !existCallback(
                        doc.players, doc.data.buffer, gameDataSetter, next
                    )
                ) {
                    next();
                }
            } else {
                next();
                fail(doc.type);
            }
        } else {
            if (!newCallback(gameDataSetter)) {
                next();
            }
        }
    });
};
