'use strict';

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
    getLogin(function (login) {
        socket.emit('login', login);
    });
};

$('#login_show_submit').click(function () {
    resetLogin();

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
    var password = sha($('#login_password').val());
    $('#login_password').val('');

    // auto login
    setLogin(
        {
            user: user,
            password: password,
        },
        $('#login_remember').prop('checked'),
        function (login) {
            socket.emit('login', login);
        }
    );
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
    resetLogin();

    message('Wrong password');
});

// password

$('#password_show_submit').click(function () {
    resetLogin();

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

    var password = sha($('#password_old').val());
    var newPassword = sha($('#password_new').val());
    $('#password_old').val('');
    $('#password_new').val('');

    socket.emit('password', {
        password: password,
        newPassword: newPassword,
    });
});

socket.on('password_ok', function (data) {
    message('Password changed');
});

socket.on('password_fail', function (data) {
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
        enabled: !currentList[game],
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
                        };
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
