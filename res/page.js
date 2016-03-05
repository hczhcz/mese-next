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

    $('[var=message]').text(message);

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

socket.on('message', function (data) {
    message(data);
});

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
                    $('body').css('padding-left', '16em');
                }
            });
        $('body')
            .clearQueue()
            .stop()
            .animate({'padding-left': '16rem'});
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
                    $('body').css('padding-left', '0.5em');
                }
            });
        $('body')
            .clearQueue()
            .stop()
            .animate({'padding-left': '0.5rem'}, 1000);
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

var loginDone = function (user) {
    $('[var=user]').text(user);

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
        $('#login_user').val(loginInfoObj.user);
    }
};

$('#login_show_submit').click(function () {
    // reset auto login
    localStorage.removeItem('MESE_login');

    $('#login').removeClass('hide');
    $('#login_show').addClass('hide');
});

$('#login_user').change(function () {
    if (/^[A-Za-z0-9_ ]+$/.test($('#login_user').val())) {
        $('#login_user').removeClass('wrong');
    } else {
        $('#login_user').addClass('wrong');
    }
});

$('#login_user').keypress(function (event) {
    if (event.which == 13) {
        $('#login_password').focus();
    }
});

$('#login_password').keypress(function (event) {
    if (event.which == 13) {
        $('#login_submit').click();
    }
});

$('#login_remember').keypress(function (event) {
    if (event.which == 13) {
        $('#login_submit').click();
    }
});

$('#login_submit').click(function (event) {
    event.preventDefault();

    var user = $('#login_user').val();
    var password = $('#login_password').val();
    $('#login_password').val('');

    // auto login
    if ($('#login_remember').prop('checked')) {
        localStorage.setItem(
            'MESE_login',
            JSON.stringify({
                user: user,
                password: password, // TODO: hash?
            })
        );
    }

    socket.emit('login', {
        user: user,
        password: password, // TODO: hash?
    });
});

socket.on('login_new', function (data) {
    loginDone(data);

    message('New user: ' + data);
});

socket.on('login_ok', function (data) {
    loginDone(data);

    message('Login: ' + data);
});

socket.on('login_fail', function (data) {
    // reset auto login
    localStorage.removeItem('MESE_login');

    message('Wrong password');
});

// password

$('#password_show_submit').click(function () {
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

socket.on('subscribe_data', function (data) {
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
});

socket.on('subscribe_fail_list', function (data) {
    message('List not found');
});

socket.on('subscribe_fail_player', function (data) {
    message('Subscription not allowed');
});

socket.on('subscribe_fail_game', function (data) {
    message('Game not found');
});

// report

// DOM change
$('#report [bind]')
    .append('<span class="last"><span></span>&nbsp;</span>')
    .append('<span class="now"><span></span></span>')
    .append('<span class="next">&nbsp;<span></span></span>');

var currentGame = undefined;
var currentPeriod = undefined;
var currentUid = undefined;
var currentSettings = undefined;

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

    $('[var=game]').text(currentGame);
    $('[var=period]').text(currentPeriod - 1);
    $('[var=next_period]').text(currentPeriod);

    $('.last').addClass('hide');
    $('.now').addClass('hide');
    $('.next').addClass('hide');
};

var showReport = function (head, data, tail, xbind /* patch */) {
    if (head.length == 0) {
        return;
    }

    if (typeof data == 'string' || typeof data == 'number') {
        var target = head.find('.' + tail);

        if (target.length == 1) {
            target.find('span').text(data);
            target.removeClass('hide');
        }
    } else if (typeof data == 'object') {
        for (var i in data) {
            // top-level bind
            if (xbind && data[i] instanceof Array /* notice: optimization */) {
                showReport($('#report [xbind=' + i + ']'), data[i], tail);
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

    var spanLast = '<span class="last"><span></span>&nbsp;</span>';
    var spanNow = '<span class="now"><span></span></span>';

    for (var i = 0; i < count; ++i) {
        $('#report_players')
            .append('<th bind="' + i + '">' + spanNow + '</th>');
        $('#report_list [xbind]')
            .append('<td bind="' + i + '">' + spanLast + spanNow + '</td>');
    }
};

var showStatus = function (status) {
    $('#report_players [bind]').removeClass('next');

    for (var i = 0; status; ++i) {
        if (status & (1 << i)) {
            // done
            $('#report_players [bind=' + i + ']').addClass('next');
        }

        status &= ~(1 << i);
    }
};

var loadReport = function (game) {
    socket.emit('report', {
        game: game,
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

        var settingsStr = JSON.stringify(data.next_settings);
        if (settingsStr !== currentSettings) {
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

        currentSettings = settingsStr;
        $('#submit input').attr('disabled', false);
    } else {
        currentSettings = undefined;
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

    currentSettings = undefined;
    $('#submit').addClass('hide');

    $('#report').removeClass('hide');
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

socket.on('submit_fail_player', function (data) {
    message('Submission not allowed');
});

socket.on('submit_fail_game', function (data) {
    message('Game not found');
});

// admin

socket.on('admin_auth_ok', function (data) {
    $('#admin').removeClass('hide');

    socket.emit('admin_list');
});

socket.on('admin_list_data', function (data) {
    // notice: use html string when data size becomes large

    $('#admin_users').empty();
    for (var i in data.users) {
        $('#admin_users').prepend(
            $('<option>').text(data.users[i])
        );
    }

    $('#admin_games').empty();
    for (var i in data.games) {
        $('#admin_games').prepend(
            $('<option>').text(data.games[i])
        );
    }
});

$('#admin_report_submit').click(function () {
    socket.emit('admin_report', {
        game: currentGame,
    });
});

socket.on('admin_report_data', function (data) {
    $('#admin_report').val(JSON.stringify(data)); // TODO: format?
});

socket.on('admin_report_fail', function (data) {
    message('Game not found');
});

socket.on('admin_transfer_ok', function (data) {
    message('Game transferred');
});

socket.on('admin_transfer_fail_player', function (data) {
    message('Transferring not allowed');
});

socket.on('admin_transfer_fail_game', function (data) {
    message('Game not found');
});

socket.on('admin_init_fail_number', function (data) {
    message('Player count not supported');
});

socket.on('admin_init_fail_game', function (data) {
    message('Game exists');
});

socket.on('admin_init_fail_invite', function (data) {
    message('Invition not allowed: ' + data);
});

socket.on('admin_init_ok', function (data) {
    message('Game created');
});

socket.on('admin_alloc_ok', function (data) {
    message('Period allocated');
});

socket.on('admin_alloc_fail_game', function (data) {
    message('Game not found');
});
