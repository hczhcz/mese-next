'use strict';

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
