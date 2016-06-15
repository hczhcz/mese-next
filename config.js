'use strict';

module.exports.core = './mese';
module.exports.coreMaxPlayer = 32;
module.exports.coreMinDataSize = 4096; // for db data protection

module.exports.db = 'mongodb://localhost/mese';
module.exports.port = 63000;

module.exports.adminUser = 'admin';
module.exports.adminPassword =
    '\xad\xbd\x18\x3e\x60\xba\x28\x6f'
    + '\x2a\x36\xa4\x3b\xe5\xaf\x11\xfe'
    + '\xa4\x1a\xe9\x9f\x7d\xb4\x35\xfd'
    + '\x6d\x86\x3c\x30\x4f\xb7\xe1\xfc'; // 'echopen';
