'use strict';

module.exports = {
    db: 'mongodb://localhost/mese',
    port: 63000,

    adminUser: 'admin',
    adminPassword:
    '\xad\xbd\x18\x3e\x60\xba\x28\x6f'
    + '\x2a\x36\xa4\x3b\xe5\xaf\x11\xfe'
    + '\xa4\x1a\xe9\x9f\x7d\xb4\x35\xfd'
    + '\x6d\x86\x3c\x30\x4f\xb7\xe1\xfc', // 'echopen',

    meseEngine: './mese',
    meseMaxPlayers: 32,
    meseMinDataSize: 4096, // for db data protection

    rtmeseDelta: 0.01,
    rtmeseInterval: 1000,
    rtmeseMaxPlayers: 32,
};
