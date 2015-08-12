'use strict';

var mongodb = require('mongodb').MongoClient;

var dbStorage = undefined;
var memStorage = {};

module.exports.init = function (callback) {
    mongodb.connect('mongodb://localhost/mese', function (err, db) {
        if (err) {
            throw err;
        } else {
            dbStorage = db.collection('users');
            callback();
        }
    });
};

var genStorageAccess = function (user) {
    return {
        user: user,
        staticGet: function (key, callback) {
            dbStorage.find({
                user: user
            }).toArray(function (err, docs) {
                if (err) {
                    throw err;
                } else if (docs.length == 1) {
                    callback(docs[0][key]);
                } else {
                    callback(undefined);
                }
            });
        },
        staticSet: function (key, value, callback) {
            var op = {$set: {}};
            op.$set[key] = value;

            dbStorage.updateOne({
                user: user
            }, op, {upsert: true}, function (err, doc) {
                if (err) {
                    throw err;
                } else {
                    callback(doc);
                }
            });
        },
        dynamicGet: function (key) {
            if (!memStorage[user]) {
                return;
            }

            return memStorage[user][key];
        },
        dynamicSet: function (key, value) {
            if (!memStorage[user]) {
                memStorage[user] = {};
            }

            memStorage[user][key] = value;
        },
    };
};

module.exports.auth = function (user, password, callback, fail) {
    var session = genStorageAccess(user);

    session.staticGet('password', function (data) {
        if (password && password === data) {
            callback(session);
        } else {
            fail();
        }
    });
};

module.exports.reg = function (user, password, callback) {
    var session = genStorageAccess(user);

    session.staticSet('password', password, callback);
};
