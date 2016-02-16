'use strict';

var mongodb = require('mongodb').MongoClient;

var collections = undefined;

module.exports.init = function (db, callback) {
    mongodb.connect(
        db,
        function (err, db) {
            if (err) {
                throw err;
            } else {
                collections = {
                    users: db.collection('users'),
                    games: db.collection('games'),
                };
                callback();
            }
        }
    );
};

module.exports.access = function (lv1, lv2) {
    return {
        get: function (key, callback) {
            collections[lv1].find({
                _id: lv2
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
        getMulti: function (callback) {
            collections[lv1].find({
                _id: lv2
            }).toArray(function (err, docs) {
                if (err) {
                    throw err;
                } else if (docs.length == 1) {
                    callback(docs[0]);
                } else {
                    callback(undefined);
                }
            });
        },
        set: function (key, value, callback) {
            var op = {$set: {}};
            op.$set[key] = value;

            collections[lv1].updateOne({
                _id: lv2
            }, op, {upsert: true}, function (err, doc) {
                if (err) {
                    throw err;
                } else {
                    callback(doc);
                }
            });
        },
        setMulti: function (map, callback) {
            var op = {$set: map};

            collections[lv1].updateOne({
                _id: lv2
            }, op, {upsert: true}, function (err, doc) {
                if (err) {
                    throw err;
                } else {
                    callback(doc);
                }
            });
        },
    };
};
