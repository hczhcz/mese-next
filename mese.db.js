'use strict';

var mongodb = require('mongodb').MongoClient;

var task = require('./mese.task');

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

module.exports.get = function (lv1, lv2, callback) {
    collections[lv1]
        .find({_id: lv2})
        .toArray(function (err, docs) {
            if (err) {
                throw err;
            } else if (docs.length == 1) { // notice: never > 1
                callback(docs[0]);
            } else {
                callback(undefined);
            }
        });
};

module.exports.update = function (lv1, lv2, callback) {
    var setter = function (diff, callback) {
        collections[lv1].updateOne(
            {_id: lv2},
            {$set: diff},
            {upsert: true},
            function (err, upd) {
                if (err) {
                    throw err;
                } else {
                    callback();
                }
            }
        );
    };

    task(lv1, lv2, function (next) {
        module.exports.get(
            lv1, lv2,
            function (doc) {
                callback(doc, setter, next);
            }
        );
    });
};
