'use strict';

var core = require('./mese.core');
var db = require('./mese.db');

module.exports.submit = function () {
    // TODO



                    // var afterSubmit = function (game) {
                    //     core.printPlayerEarly(
                    //         game,
                    //         player,
                    //         function (output) {
                    //             socket.emit(
                    //                 'report_early',
                    //                 eval('(' + output + ')')
                    //             );
                    //         }
                    //     );
                    // };

                    // core.submit( // TODO: protection?
                    //     gameStorage.dynamicGet('data'), player,
                    //     data.price, data.prod, data.mk, data.ci, data.rd,
                    //     function (output) {
                    //         // submit ok

                    //         core.printPlayerEarly(
                    //             output,
                    //             player,
                    //             function (output) {
                    //                 socket.emit(
                    //                     'submit_ok',
                    //                     eval('(' + output + ')')
                    //                 );
                    //             }
                    //         );

                    //         core.close(
                    //             output,
                    //             function (output) {
                    //                 // closed
                    //                 gameStorage.dynamicSet('data', output);
                    //                 gameStorage.staticSet('data', output);
                    //             },
                    //             function (output) {
                    //                 // not closed
                    //                 gameStorage.dynamicSet('data', output);
                    //                 gameStorage.staticSet('data', output);
                    //             }
                    //         );
                    //     },
                    //     function (output) {
                    //         // submit declined

                    //         core.printPlayerEarly(
                    //             output,
                    //             player,
                    //             function (output) {
                    //                 socket.emit(
                    //                     'submit_decline',
                    //                     eval('(' + output + ')')
                    //                 );
                    //             }
                    //         );
                    //     }
                    // );

};
