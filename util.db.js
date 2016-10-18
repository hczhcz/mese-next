'use strict';

var mongodb = require('mongodb').MongoClient;

var task = require('./util.task');

var collections = {}; // add by init()

module.exports.init = function (path, lv1s, callback) {
    mongodb.connect(
        path,
        function (err, db) {
            if (err) {
                throw err;
            } else {
                for (var i in lv1s) {
                    collections[lv1s[i]] = db.collection(lv1s[i]);
                }

                callback();
            }
        }
    );
};

module.exports.get = function (lv1, lv2, callback) {
    collections[lv1]
        .find({
            _id: lv2,
        })
        .toArray(function (err, docs) {
            if (err) {
                throw err;
            } else if (docs.length === 1) { // notice: never > 1
                callback(docs[0]);
            } else {
                callback(undefined);
            }
        });
};

module.exports.list = function (lv1, callback) {
    collections[lv1]
        .find({}, {
            _id: 1,
        })
        .toArray(function (err, docs) {
            if (err) {
                throw err;
            } else {
                var list = [];

                for (var i in docs) {
                    list.push(docs[i]._id);
                }

                callback(list);
            }
        });
};

module.exports.update = function (lv1, lv2, callback) {
    var setter = function (diff, setterCallback) {
        collections[lv1].updateOne(
            {
                _id: lv2,
            },
            {
                $set: diff,
            },
            {
                upsert: true,
            },
            function (err, upd) {
                if (err) {
                    throw err;
                } else {
                    setterCallback();
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
