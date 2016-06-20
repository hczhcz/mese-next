'use strict';

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
                if ($('#side').position().left === 0) {
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
