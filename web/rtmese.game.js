'use strict';

define('rtmese.game', function (require, module) {
    var bind = require('ui.bind');
    var message = require('ui.message');
    var socket = require('socket');
    var user = require('site.user');
    var admin = require('site.admin');

    // // report

    // var currentGame = undefined;
    // var currentSettings = undefined;

    // var verboseEnabled = false;

    // var initReport = function (game, period, uid) {
    //     if (game !== currentGame) {
    //         message('Game: ' + game);
    //     }
    //     if (game === currentGame && period !== currentPeriod) {
    //         message('Period: ' + period);
    //     }

    //     currentGame = game;
    //     currentPeriod = period;
    //     currentUid = uid;

    //     bind.variable('game', currentGame);
    //     bind.variable('period', currentPeriod - 1);
    //     bind.variable('next_period', currentPeriod);

    //     $('.last').addClass('hide');
    //     $('.now').addClass('hide');
    //     $('.next').addClass('hide');
    // };

    // var initPlayerList = function (count) {
    //     // remove items

    //     $('#report_list [bind]').remove();

    //     // add items

    //     var spanLast = '<span class="last"><span></span>&nbsp;</span>';
    //     var spanNow = '<span class="now"><span></span></span>';

    //     for (var i = 0; i < count; ++i) {
    //         $('#report_players')
    //             .append(
    //                 '<th bind="players.' + i + '">'
    //                 + spanNow
    //                 + '</th>');
    //         $('#report_list [list]').each(function () {
    //             $(this).append(
    //                 '<td bind="' + $(this).attr('list') + '.' + i + '">'
    //                 + spanLast + spanNow
    //                 + '</td>'
    //             );
    //         });
    //     }
    // };

    // var showStatus = function (status) {
    //     $('#report_players [bind]').removeClass('next');

    //     var unhandled = status;
    //     for (var i = 0; unhandled; ++i) {
    //         if (unhandled & 1 << i) {
    //             // done
    //             $('#report_players [bind="players.' + i + '"]').addClass('next');
    //         }

    //         unhandled &= ~(1 << i);
    //     }
    // };

    // var showReport = function (data, tail, path) {
    //     if (typeof data === 'string' || typeof data === 'number') {
    //         var target = $('[bind="' + path + '"] ' + tail);

    //         if (target.length === 1) {
    //             target.find('span').text(data);
    //             target.removeClass('hide');
    //         } else {
    //             // never reach
    //             throw Error('data binding error ' + path);
    //         }
    //     } else if (typeof data === 'object') {
    //         for (var i in data) {
    //             showReport(
    //                 data[i], tail,
    //                 path !== undefined ? path + '.' + i : i
    //             );
    //         }
    //     }
    // };

    // var loadReport = function (game) {
    //     socket.emit('rtmese_report', {
    //         game: game,
    //         uid: -1, // force reload
    //     });
    // };

    // // load from url hash
    // var loadHash = function () {
    //     var urlHash = window.location.hash.slice(1);
    //     if (urlHash !== '') {
    //         loadReport(urlHash);
    //     }
    // };
    // loadHash();
    // $(window).on('hashchange', loadHash);

    // var reloadReport = function () {
    //     if (currentGame !== undefined) {
    //         socket.emit('rtmese_report', {
    //             game: currentGame,
    //             uid: currentUid,
    //         });
    //     }
    // };

    // // auto refresh
    // socket.poll(reloadReport, 30000);

    // $('#report_refresh').click(reloadReport);

    // $('#report_expand').click(function () {
    //     if (verboseEnabled) {
    //         verboseEnabled = false;

    //         $('.report_verbose').addClass('hide');
    //         $('#report_expand').text('+');
    //     } else {
    //         verboseEnabled = true;

    //         $('.report_verbose').removeClass('hide');
    //         $('#report_expand').text('-');
    //     }
    // });

    // socket.on('rtmese_report_early', function (data) {
    //     showStatus(data.status);

    //     showReport(data.decisions, '.next');
    //     showReport(data.data_early, '.next');
    // });

    // socket.on('rtmese_report_player', function (data) {
    //     initReport(data.game, data.now_period, data.uid);
    //     initPlayerList(data.players.length); // prepare DOM

    //     showStatus(data.status);
    //     showReport(data.players, '.now', 'players');

    //     if (data.now_period >= 3) {
    //         // showReport(data.last_decisions, '.last');
    //         // showReport(data.last_data_early, '.last');
    //         showReport(data.last_data, '.last');
    //         showReport(data.last_data_public.decisions, '.last');
    //         showReport(data.last_data_public.data_early, '.last');
    //         showReport(data.last_data_public.data, '.last');
    //     }

    //     showReport(data.settings, '.now');
    //     showReport(data.decisions, '.now');
    //     showReport(data.data_early, '.now');
    //     showReport(data.data, '.now');
    //     showReport(data.data_public.decisions, '.now');
    //     showReport(data.data_public.data_early, '.now');
    //     showReport(data.data_public.data, '.now');

    //     if (data.next_settings !== undefined) {
    //         showReport(data.next_settings, '.next');

    //         var settingsStr = JSON.stringify(data.next_settings);
    //         if (settingsStr !== currentSettings) {
    //             $('#submit_price')
    //                 .attr('min', data.next_settings.limits.price_min)
    //                 .attr('max', data.next_settings.limits.price_max)
    //                 .val(data.decisions.price);
    //             $('#submit_prod_rate')
    //                 .attr('min', 0)
    //                 .attr('max', data.data_early.balance.size)
    //                 .val(
    //                     Math.round(
    //                         data.data_early.balance.size
    //                         * data.data_early.production.prod_rate
    //                     )
    //                 );
    //             $('#submit_prod_rate').text(
    //                 Math.round(
    //                     100 * data.data_early.production.prod_rate
    //                 )
    //             );
    //             $('#submit_mk')
    //                 .attr('min', 0)
    //                 .attr('max', data.next_settings.limits.mk_limit)
    //                 .val(data.decisions.mk);
    //             $('#submit_ci')
    //                 .attr('min', 0)
    //                 .attr('max', data.next_settings.limits.ci_limit)
    //                 .val(data.decisions.ci);
    //             $('#submit_rd')
    //                 .attr('min', 0)
    //                 .attr('max', data.next_settings.limits.rd_limit)
    //                 .val(data.decisions.rd);
    //         }

    //         currentSettings = settingsStr;
    //         $('#submit input').attr('disabled', false);
    //     } else {
    //         currentSettings = undefined;
    //         $('#submit input').attr('disabled', true);
    //     }

    //     $('#submit').removeClass('hide');
    //     $('#report').removeClass('hide');
    // });

    // socket.on('rtmese_report_public', function (data) {
    //     initReport(data.game, data.now_period, data.uid);
    //     initPlayerList(data.players.length); // prepare DOM

    //     showStatus(data.status);
    //     showReport(data.players, '.now', 'players');

    //     if (data.now_period >= 3) {
    //         showReport(data.last_data_public.decisions, '.last');
    //         showReport(data.last_data_public.data_early, '.last');
    //         showReport(data.last_data_public.data, '.last');
    //     }

    //     showReport(data.settings, '.now');
    //     showReport(data.data_public.decisions, '.now');
    //     showReport(data.data_public.data_early, '.now');
    //     showReport(data.data_public.data, '.now');

    //     if (data.next_settings !== undefined) {
    //         showReport(data.next_settings, '.next');
    //     }

    //     currentSettings = undefined;
    //     $('#submit').addClass('hide');
    //     $('#report').removeClass('hide');
    // });

    // socket.on('rtmese_report_fail_game', function (data) {
    //     message('Game not found');
    // });

    // socket.on('rtmese_report_fail_type', function (data) {
    //     message('Wrong game type');
    // });

    // submit

    $('#submit_price').change(function () {
        $('#submit_price').val(
            0.01 * Math.round(100 * $('#submit_price').val())
        );
    });

    // $('#submit_prod_rate').change(function () {
    //     $('#submit_prod_rate').val(
    //         0.01 * Math.round(100 * $('#submit_prod_rate').val())
    //     );
    // });

    $('#submit_mk').change(function () {
        $('#submit_mk').val(
            0.01 * Math.round(100 * $('#submit_mk').val())
        );
    });

    $('#submit_ci').change(function () {
        $('#submit_ci').val(
            0.01 * Math.round(100 * $('#submit_ci').val())
        );
    });

    $('#submit_rd').change(function () {
        $('#submit_rd').val(
            0.01 * Math.round(100 * $('#submit_rd').val())
        );
    });

    $('#submit_submit').click(function (event) {
        event.preventDefault();

        socket.emit('rtmese_submit', {
            game: currentGame,
            price: parseFloat($('#submit_price').val()),
            prod_rate: parseFloat($('#submit_prod_rate').val()),
            mk: parseFloat($('#submit_mk').val()),
            ci: parseFloat($('#submit_ci').val()),
            rd: parseFloat($('#submit_rd').val()),
        });
    });

    socket.on('rtmese_submit_ok', function (data) {
        message('Submission ok');
    });

    socket.on('rtmese_submit_fail_player', function (data) {
        message('Submission not allowed');
    });

    socket.on('rtmese_submit_fail_running', function (data) {
        message('Game is not running');
    });

    user.gameLoaders.defaultGame = reloadReport;
    user.gameLoaders.loadGame = loadReport;
    admin.gameLoaders.defaultGame = reloadReport;
    admin.gameLoaders.loadGame = loadReport;
});