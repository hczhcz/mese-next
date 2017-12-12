'use strict';

define('mese.game', function (require, module) {
    var bind = require('ui.bind');
    var message = require('ui.message');
    var socket = require('socket');
    var loader = require('loader');

    // report

    // DOM change
    $('#report [bind]')
        .append('<span class="last"><span></span>&nbsp;</span>')
        .append('<span class="now"><span></span></span>')
        .append('<span class="next">&nbsp;<span></span></span>');

    var currentGame = undefined;
    var currentPeriod = undefined;
    var currentUid = undefined;

    var verboseEnabled = false;

    var initReport = function (game, period, uid) {
        if (game !== currentGame) {
            message('Game: ' + game);
        }
        if (game === currentGame && period !== currentPeriod) {
            message('Next period: ' + period);
        }

        var updated = game !== currentGame || period !== currentPeriod;

        currentGame = game;
        currentPeriod = period;
        currentUid = uid;

        bind.variable('game', currentGame);
        bind.variable('period', currentPeriod - 1);
        bind.variable('next_period', currentPeriod);

        if (updated) {
            $('.last').addClass('hide');
            $('.now').addClass('hide');
            $('.next').addClass('hide');
        }

        return updated;
    };

    var initPlayerList = function (count) {
        // remove items

        $('#report_list [bind]').remove();

        // add items

        var spanLast = '<span class="last"><span></span>&nbsp;</span>';
        var spanNow = '<span class="now"><span></span></span>';

        for (var i = 0; i < count; ++i) {
            $('#report_players').append(
                '<th bind="players.' + i + '">'
                + spanNow
                + '</th>'
            );
            $('#report_list [list]').each(function (index, element) {
                $(element).append(
                    '<td bind="' + $(element).attr('list') + '.' + i + '">'
                    + spanLast + spanNow
                    + '</td>'
                );
            });
        }
    };

    var showStatus = function (status) {
        $('#report_players [bind]').removeClass('next');

        var unhandled = status;
        for (var i = 0; unhandled; ++i) {
            if (unhandled & 1 << i) {
                // done
                $('#report_players [bind="players.' + i + '"]').addClass('next');
            }

            unhandled &= ~(1 << i);
        }
    };

    var showReport = function (data, tail, path) {
        if (typeof data === 'string' || typeof data === 'number') {
            var target = $('[bind="' + path + '"]' + tail);

            if (target.length === 1) {
                target.find('span').text(data);
                target.removeClass('hide');
            } else {
                // never reach
                throw Error('data binding error ' + path);
            }
        } else if (typeof data === 'object') {
            for (var i in data) {
                showReport(
                    data[i], tail,
                    path !== undefined ? path + '.' + i : i
                );
            }
        }
    };

    loader.init(function (game) {
        socket.emit('mese_report', {
            game: game,
            uid: -1, // force reload
        });
    }, function () {
        if (currentGame !== undefined) {
            loader.load(currentGame);
        }
    });

    $('#report_refresh').click(loader.reload);

    $('#report_expand').click(function () {
        if (verboseEnabled) {
            verboseEnabled = false;

            $('.report_verbose').addClass('hide');
            $('#report_expand').text('+');
        } else {
            verboseEnabled = true;

            $('.report_verbose').removeClass('hide');
            $('#report_expand').text('-');
        }
    });

    // auto refresh
    socket.poll(function () {
        if (currentGame !== undefined) {
            socket.emit('mese_report', {
                game: currentGame,
                uid: currentUid,
            });
        }
    }, 30000);

    socket.on('mese_report_early', function (data) {
        showStatus(data.status);

        showReport(data.decisions, ' .next', 'decisions');
        showReport(data.data_early, ' .next');
    });

    socket.on('mese_report_player', function (data) {
        var updated = initReport(data.game, data.now_period, data.uid);
        initPlayerList(data.player_count); // prepare DOM

        showStatus(data.status);

        showReport(data.players, ' .now', 'players');

        if (data.now_period >= 3) {
            showReport(data.last_data, ' .last');
            showReport(data.last_data_public.decisions, ' .last', 'decisions');
            showReport(data.last_data_public.data_early, ' .last');
            showReport(data.last_data_public.data, ' .last');
        }

        showReport(data.settings, ' .now');
        showReport(data.decisions, ' .now', 'decisions');
        showReport(data.data_early, ' .now');
        showReport(data.data, ' .now');
        showReport(data.data_public.decisions, ' .now', 'decisions');
        showReport(data.data_public.data_early, ' .now');
        showReport(data.data_public.data, ' .now');

        if (data.next_settings !== undefined) {
            showReport(data.next_settings, ' .next');

            if (updated) {
                $('#submit_price')
                    .attr('min', data.next_settings.limits.price_min)
                    .attr('max', data.next_settings.limits.price_max)
                    .val(data.decisions.price);
                $('#submit_prod')
                    .attr('min', 0)
                    .attr('max', data.data_early.balance.size)
                    .val(
                        Math.round(
                            data.data_early.balance.size
                            * data.data_early.production.prod_rate
                        )
                    );
                $('#submit_prod_rate').text(
                    Math.round(
                        100 * data.data_early.production.prod_rate
                    )
                );
                $('#submit_mk')
                    .attr('min', 0)
                    .attr('max', data.next_settings.limits.mk_limit)
                    .val(data.decisions.mk);
                $('#submit_ci')
                    .attr('min', 0)
                    .attr('max', data.next_settings.limits.ci_limit)
                    .val(data.decisions.ci);
                $('#submit_rd')
                    .attr('min', 0)
                    .attr('max', data.next_settings.limits.rd_limit)
                    .val(data.decisions.rd);
            }

            $('#submit input').attr('disabled', false);
        } else {
            $('#submit input').attr('disabled', true);
        }

        $('#submit').removeClass('hide');
        $('#report').removeClass('hide');
    });

    socket.on('mese_report_public', function (data) {
        initReport(data.game, data.now_period, data.uid);
        initPlayerList(data.player_count); // prepare DOM

        showStatus(data.status);

        showReport(data.players, ' .now', 'players');

        if (data.now_period >= 3) {
            showReport(data.last_data_public.decisions, ' .last', 'decisions');
            showReport(data.last_data_public.data_early, ' .last');
            showReport(data.last_data_public.data, ' .last');
        }

        showReport(data.settings, ' .now');
        showReport(data.data_public.decisions, ' .now', 'decisions');
        showReport(data.data_public.data_early, ' .now');
        showReport(data.data_public.data, ' .now');

        if (data.next_settings !== undefined) {
            showReport(data.next_settings, ' .next');
        }

        $('#submit').addClass('hide');
        $('#report').removeClass('hide');
    });

    socket.on('mese_report_fail_game', function (data) {
        message('Game not found');
    });

    socket.on('mese_report_fail_type', function (data) {
        message('Wrong game type');

        loader.jump(data);
    });

    // submit

    $('#submit_price').change(function () {
        $('#submit_price').val(
            Math.round(100 * $('#submit_price').val()) / 100
        );
    });

    $('#submit_prod').change(function () {
        $('#submit_prod').val(
            Math.round($('#submit_prod').val())
        );
        $('#submit_prod_rate').text(
            Math.round(
                100 * $('#submit_prod').val() / $('#submit_prod').attr('max')
            )
        );
    });

    $('#submit_mk').change(function () {
        $('#submit_mk').val(
            Math.round(100 * $('#submit_mk').val()) / 100
        );
    });

    $('#submit_ci').change(function () {
        $('#submit_ci').val(
            Math.round(100 * $('#submit_ci').val()) / 100
        );
    });

    $('#submit_rd').change(function () {
        $('#submit_rd').val(
            Math.round(100 * $('#submit_rd').val()) / 100
        );
    });

    $('#submit_submit').click(function (event) {
        event.preventDefault();

        socket.emit('mese_submit', {
            game: currentGame,
            period: currentPeriod,
            price: parseFloat($('#submit_price').val()),
            prod: parseInt($('#submit_prod').val(), 10),
            mk: parseFloat($('#submit_mk').val()),
            ci: parseFloat($('#submit_ci').val()),
            rd: parseFloat($('#submit_rd').val()),
        });
    });

    socket.on('mese_submit_ok', function (data) {
        message('Submission ok');
    });

    socket.on('mese_submit_decline', function (data) {
        message('Submission declined');
    });

    socket.on('mese_submit_fail_player', function (data) {
        message('Submission not allowed');
    });

    socket.on('mese_submit_fail_game', function (data) {
        message('Game not found');
    });

    socket.on('mese_submit_fail_type', function (data) {
        message('Wrong game type');

        loader.jump(data);
    });
});
