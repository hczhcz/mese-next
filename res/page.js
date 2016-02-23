'use strict';

// connection

var socket = io(window.location.origin);

var connected = false;

socket.on('connect', function () {
    connected = true;
    message('Connected');

    autoLogin();
});

socket.on('disconnect', function () {
    connected = false;
    message('Connection lost');
});

// message

var windowActive = false;

var showMessage = function () {
    if ($('#message p').length == 0) {
        return;
    }

    $('#message')
        .clearQueue()
        .stop()
        .removeClass('hide')
        .attr('style', '');

    // IE8 workaround
    if (
        $('#message').position().left * 2 + 1 >= $(window).width()
        && $('#message').position().top * 2 + 1 >= $(window).height()
    ) {
        $('#message').css(
            'margin-left',
            (-$('#message').outerWidth(true) / 2) + 'px'
        );
        $('#message').css(
            'margin-top',
            (-$('#message').outerHeight(true) / 2) + 'px'
        );
    }
};

var removeMessage = function () {
    $('#message')
        .addClass('hide')
        .empty();
};

var hideMessage = function () {
    if (windowActive) {
        $('#message')
            .clearQueue()
            .stop()
            .delay(2000)
            .fadeOut(2000, removeMessage);
    }
};

var message = function (message) {
    $('#message').append(
        $('<p />').text(message)
    );
    if ($('#message p').length > 5) {
        $('#message p:first').remove();
    }

    $('#user_message').text(message);

    showMessage();
    hideMessage();
};

$(window).focus(function () {
    windowActive = true;
    hideMessage();
});

$(window).blur(function () {
    windowActive = false;
});

$('#message').hover(showMessage, hideMessage);
$('#message').click(removeMessage);
$('#message').on('touchstart', removeMessage);

// side

var sideEnabled = true;

var showSide = function () {
    if (!sideEnabled) {
        sideEnabled = true;

        $('#side')
            .css('overflow-y', 'auto')
            .clearQueue()
            .stop()
            .animate({left: '0rem'}, function () {
                // IE8 workaround
                if ($('#side').position().left != 0) {
                    $('#side').css('left', '0');
                    $('#report').css('left', '16em');
                }
            });
        $('#report')
            .clearQueue()
            .stop()
            .animate({left: '16rem'});
    }
};

var hideSide = function () {
    if (sideEnabled) {
        sideEnabled = false;

        $('#side')
            .css('overflow-y', 'hidden')
            .clearQueue()
            .stop()
            .animate({left: '-15.5rem'}, 1000, function () {
                // IE8 workaround
                if ($('#side').position().left == 0) {
                    $('#side').css('left', '-15.5em');
                    $('#report').css('left', '0.5em');
                }
            });
        $('#report')
            .clearQueue()
            .stop()
            .animate({left: '0.5rem'}, 1000);
    }
};

$('#side').click(showSide);
$('#side').on('touchstart', showSide);
$('#side').dblclick(hideSide);
$('#side_hide').click(function (event) {
    hideSide();
    event.stopPropagation();
});
$('#util td').dblclick(function (event) {
    event.stopPropagation();
});

// login

var currentName = undefined;

var loginDone = function (name, reg) {
    currentName = name;

    $('#user_name').text(
        reg ? currentName + ' (new user)' : currentName
    );

    $('#user').removeClass('hide');
    $('#login').addClass('hide');
    $('#login_show').removeClass('hide');
    $('#password').addClass('hide');
    $('#password_show').removeClass('hide');
    $('#subscribe').removeClass('hide');

    // update the game list
    $('#list').addClass('hide');
    socket.emit('list');

    if (currentGame) {
        loadReport(currentGame);
    }
};

var autoLogin = function () {
    // auto login
    var loginInfo = localStorage.getItem('MESE_login');
    if (loginInfo) {
        var loginInfoObj = JSON.parse(loginInfo);

        socket.emit('login', loginInfoObj);
        $('#login_name').val(loginInfoObj.name);
    }
};

$('#login_show').click(function () {
    // reset auto login
    localStorage.removeItem('MESE_login');

    $('#login').removeClass('hide');
    $('#login_show').addClass('hide');
});

$('#login_name').change(function () {
    if (/^[A-Za-z0-9_ ]+$/.test($('#login_name').val())) {
        $('#login_name').removeClass('wrong');
    } else {
        $('#login_name').addClass('wrong');
    }
});

$('#login_name').keypress(function (event) {
    if (event.which == 13) {
        $('#login_password').focus();
    }
});

$('#login_password').keypress(function (event) {
    if (event.which == 13) {
        $('#login_submit').click();
    }
});

$('#login_submit').click(function (event) {
    event.preventDefault();

    var name = $('#login_name').val();
    var password = $('#login_password').val();
    $('#login_password').val('');

    // auto login
    if ($('#login_remember').prop('checked')) {
        localStorage.setItem(
            'MESE_login',
            JSON.stringify({
                name: name,
                password: password, // TODO: hash?
            })
        );
    }

    socket.emit('login', {
        name: name,
        password: password, // TODO: hash?
    });
});

socket.on('login_new', function (data) {
    loginDone(data.name, true);

    message('New user: ' + data.name);
});

socket.on('login_ok', function (data) {
    loginDone(data.name, false);

    message('Login: ' + data.name);
});

socket.on('login_fail', function (data) {
    // reset auto login
    localStorage.removeItem('MESE_login');

    message('Wrong password');
});

// password

$('#password_show').click(function () {
    $('#password').removeClass('hide');
    $('#password_show').addClass('hide');
});

$('#password_old').keypress(function (event) {
    if (event.which == 13) {
        $('#password_new').focus();
    }
});

$('#password_new').keypress(function (event) {
    if (event.which == 13) {
        $('#password_submit').click();
    }
});

$('#password_submit').click(function (event) {
    event.preventDefault();

    var password = $('#password_old').val();
    var newPassword = $('#password_new').val();
    $('#password_old').val('');
    $('#password_new').val('');

    socket.emit('password', {
        password: password, // TODO: hash?
        newPassword: newPassword, // TODO: hash?
    });
});

socket.on('password_ok', function (data) {
    // reset auto login
    localStorage.removeItem('MESE_login');

    message('Password changed');
});

socket.on('password_fail', function (data) {
    // reset auto login
    // localStorage.removeItem('MESE_login');

    message('Wrong password');
});

// subscribe & list

var currentList = undefined;

var updateList = function (data) {
    currentList = data;

    $('#list_content').empty();

    for (var i in currentList) {
        if (currentList[i]) {
            $('#list_content').prepend(
                $('<input type="button" />')
                    .val(i)
                    .click(function (game) {
                        return function (event) {
                            event.preventDefault();

                            loadReport(game);
                        }
                    } (i))
            );
        }
    }

    $('#list').removeClass('hide');
};

// auto refresh
setInterval(
    function () {
        if (connected && !$('#list').hasClass('hide')) {
            socket.emit('list');
        }
    },
    60000
);

$('#subscribe_game').change(function () {
    if (/^[A-Za-z0-9_ ]+$/.test($('#subscribe_game').val())) {
        $('#subscribe_game').removeClass('wrong');
    } else {
        $('#subscribe_game').addClass('wrong');
    }
});

$('#subscribe_game').keypress(function (event) {
    if (event.which == 13) {
        $('#subscribe_submit').click();
    }
});

$('#subscribe_submit').click(function (event) {
    event.preventDefault();

    var game = $('#subscribe_game').val();

    socket.emit('subscribe', {
        game: game,
        enabled: !currentList[$('#subscribe_game').val()],
    });
});

socket.on('subscribe_list', updateList);

socket.on('subscribe_update', updateList);

socket.on('subscribe_fail_list', function (data) {
    message('List not found');
});

socket.on('subscribe_fail_game', function (data) {
    message('Game not found');
});

// report

// DOM change
$('.report_div [bind]')
    .append('<span target="last"><span></span>&nbsp;</span>')
    .append('<span target="now"><span></span></span>')
    .append('<span target="next">&nbsp;<span></span></span>');

var currentGame = undefined;
var currentPeriod = undefined;
var currentUid = undefined;

var verboseEnabled = false;

var initReport = function (game, period, uid) {
    if (game !== currentGame) {
        hideSide();
        message('Game: ' + game);
    }
    if (game === currentGame && period !== currentPeriod) {
        message('Period: ' + period);
    }

    currentGame = game;
    currentPeriod = period;
    currentUid = uid;

    $('#subscribe_game').val(currentGame);

    $('#report_title').text(
        'Period ' + (currentPeriod - 1) + ' of Game "' + currentGame + '"'
    );

    $('#submit_game').text(currentGame);
    $('#submit_period').text(currentPeriod);
    $('#submit_name').text(currentName);

    $('.report_div [target]').addClass('hide');
};

var showReport = function (head, data, tail, xbind /* patch */) {
    if (head.length == 0) {
        return;
    }

    if (typeof data == 'string' || typeof data == 'number') {
        var target = head.find('[target=' + tail + ']');

        if (target.length == 1) {
            target.find('span').text(data);
            target.removeClass('hide');
        }
    } else if (typeof data == 'object') {
        for (var i in data) {
            // top-level bind
            if (xbind && data[i] instanceof Array /* notice: optimization */) {
                showReport($('.report_div [xbind=' + i + ']'), data[i], tail);
            }

            // path-based bind
            showReport(head.find('[bind=' + i + ']'), data[i], tail, xbind);
        }
    }
};

var initPlayerList = function (count) {
    // remove items

    $('#report_players [bind]').remove();
    $('#report_list [xbind] [bind]').remove();

    // add items

    var spanLast = '<span target="last"><span></span>&nbsp;</span>';
    var spanNow = '<span target="now"><span></span></span>';

    for (var i = 0; i < count; ++i) {
        $('#report_players')
            .append('<th bind="' + i + '">' + spanNow + '</th>');
        $('#report_list [xbind]')
            .append('<td bind="' + i + '">' + spanLast + spanNow + '</td>');
    }
};

var showStatus = function (status) {
    for (var i = 0; status; ++i) {
        if (status & (1 << i)) {
            // done
            $('#report_players [bind=' + i + ']').addClass('hint_next');
        } else {
            // not done
            $('#report_players [bind=' + i + ']').removeClass('hint_next');
        }

        status &= ~(1 << i);
    }
};

var loadReport = function (game) {
    socket.emit('report', {
        game: game,
        period: -1, // force reload
        uid: -1, // force reload
    });
};

// load from url hash
var loadHash = function () {
    var urlHash = window.location.hash.slice(1);
    if (urlHash) {
        loadReport(urlHash);
    }
};

var reloadReport = function () {
    if (!$('#report').hasClass('hide')) {
        socket.emit('report', {
            game: currentGame,
            period: currentPeriod,
            uid: currentUid,
        });
    }
};

// auto refresh
setInterval(
    function () {
        if (connected) {
            reloadReport();
        }
    },
    30000
);

// load the game
loadHash();
$(window).on('hashchange', loadHash);

$('#report_refresh').click(reloadReport);

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

socket.on('report_early', function (data) {
    showStatus(data.status);

    showReport($('#report_decisions'), data.decisions, 'next');
    showReport($('#report_data_early'), data.data_early, 'next');
});

socket.on('report_player', function (data) {
    initPlayerList(data.players.length); // prepare DOM
    initReport(data.game, data.now_period, data.uid);

    showStatus(data.status);
    showReport($('#report_players'), data.players, 'now');

    if (data.now_period >= 3) {
        // showReport($('#report_decisions'), data.last_decisions, 'last');
        // showReport($('#report_data_early'), data.last_data_early, 'last');
        showReport($('#report_data'), data.last_data, 'last');
        showReport($('#report_decisions'), data.last_data_public.decisions, 'last', true);
        showReport($('#report_data_early'), data.last_data_public.data_early, 'last');
        showReport($('#report_data'), data.last_data_public.data, 'last', true);
    }

    showReport($('#report_settings'), data.settings, 'now');
    showReport($('#report_decisions'), data.decisions, 'now');
    showReport($('#report_data_early'), data.data_early, 'now');
    showReport($('#report_data'), data.data, 'now');
    showReport($('#report_decisions'), data.data_public.decisions, 'now', true);
    showReport($('#report_data_early'), data.data_public.data_early, 'now');
    showReport($('#report_data'), data.data_public.data, 'now', true);

    if (data.next_settings) {
        showReport($('#report_settings'), data.next_settings, 'next');

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

        $('#submit input').attr('disabled', false);
    } else {
        $('#submit input').attr('disabled', true);
    }

    $('#submit').removeClass('hide');

    $('#report').removeClass('hide');
});

socket.on('report_public', function (data) {
    initPlayerList(data.players.length); // prepare DOM
    initReport(data.game, data.now_period, data.uid);

    showStatus(data.status);
    showReport($('#report_players'), data.players, 'now');

    if (data.now_period >= 3) {
        showReport($('#report_decisions'), data.last_data_public.decisions, 'last', true);
        showReport($('#report_data_early'), data.last_data_public.data_early, 'last');
        showReport($('#report_data'), data.last_data_public.data, 'last', true);
    }

    showReport($('#report_settings'), data.settings, 'now');
    showReport($('#report_decisions'), data.data_public.decisions, 'now', true);
    showReport($('#report_data_early'), data.data_public.data_early, 'now');
    showReport($('#report_data'), data.data_public.data, 'now', true);

    if (data.next_settings) {
        showReport($('#report_settings'), data.next_settings, 'next');
    }

    $('#submit').addClass('hide');

    $('#report').removeClass('hide');
});

socket.on('report_status', function (data) {
    showStatus(data);
});

socket.on('report_fail', function (data) {
    message('Game not found');
});

// submit

$('#submit_price').change(function () {
    $('#submit_price').val(
        0.01 * Math.round(100 * $('#submit_price').val())
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

    socket.emit('submit', {
        game: currentGame,
        period: currentPeriod,
        price: parseFloat($('#submit_price').val()),
        prod: parseInt($('#submit_prod').val()),
        mk: parseFloat($('#submit_mk').val()),
        ci: parseFloat($('#submit_ci').val()),
        rd: parseFloat($('#submit_rd').val()),
    });
});

socket.on('submit_ok', function (data) {
    message('Submission ok');
});

socket.on('submit_decline', function (data) {
    message('Submission declined');
});

socket.on('submit_fail_game', function (data) {
    message('Game not found');
});

socket.on('submit_fail_player', function (data) {
    message('Submission not allowed');
});
