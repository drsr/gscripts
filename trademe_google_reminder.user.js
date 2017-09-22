// ==UserScript==
// @name       TradeMe Google reminder
// @namespace  http://drsr/
// @version    0.6
// @description  Add a Google Calendar reminder link to Trademe auction pages
// @include    /https:\/\/www\.trademe\.co\.nz\/.*\/[Ll]isting.*/
// @include    /https:\/\/www\.trademe\.co\.nz\/.*\/auction-.*/
// @include    /https:\/\/www\.trademe\.co\.nz\/a\.aspx.*/
// @grant      GM_addStyle
// @copyright  public domain
// ==/UserScript==
// v0.6 more https
// v0.5 https
// v0.4 another update for new format
// v0.3 work with new listing format

var $ = unsafeWindow.jQuery;

// replace trademe's JS error handler
window.onerror=function(msg, url, linenumber){
    console.log('Error message: '+msg+'\nURL: '+url+'\nLine Number: '+linenumber);
    return true;
};

function getCloseDateTime() {
    var closeDateTime = null;
    // format of closing time is "Closes: Sat 16 Jun, 3:05 pm." and optionally " This auction may auto-extend"
    // doesn't work for periods less than one day where time is e.g. "4 hours", but not really worth a GCAL reminder then
    var closing = $("#BidBuyNow_closingContainer,#ClosingTime_ClosingTimeContainer").text();
    if (closing && closing.indexOf("Closes:") > -1) {
        // get just date and time without dayname but including am/pm
        closing = $.trim(closing.replace(new RegExp("\n", 'g'), ""));
        var closeTime = /Closes:\s+\w+\s+(.*[ap]m).*/.exec(closing);
        if (closeTime) {
            closeTime = closeTime[1];
            // insert year
            var timeParts = closeTime.split(",");
            closeDateTime = new Date(timeParts[0] + " " + new Date().getFullYear() + " " + timeParts[1]);
        }
    }
    return closeDateTime;
}

/*
 *  Return a date string as yyyymmddThhmmssZ in UTC.
 *  based on http://stackoverflow.com/questions/5661487/converting-date-time-to-rfc3339-format-using-either-jquery-or-java-script
 */
// Add leading zero to single digit numbers
function addZ(n) {
    return (n<10) ? '0'+n : ''+n;
}
function dateToUTCString(d) {

    return d.getUTCFullYear() + 
           addZ(d.getUTCMonth() + 1) + 
           addZ(d.getUTCDate()) +
           'T' + 
           addZ(d.getUTCHours()) + 
           addZ(d.getUTCMinutes()) + 
           addZ(d.getUTCSeconds()) +
           'Z';
}

function addReminderLink(reminderTime) {
    var auctionTitle = $("#ListingTitle_title,#ListingTitleBox_TitleText").text().trim();

    var utcDate = dateToUTCString(reminderTime);

    // Link format: http://support.google.com/calendar/bin/answer.py?hl=en&answer=2476685
    // annoyingly Google Calendar web app won't auto-link to either HTML or plain link in the title or details, 
    // but other calendar and browser apps e.g. Android should when they popup the reminder
    var reminderLink = "https://www.google.com/calendar/event?action=TEMPLATE" + 
        "&text=TM: " + escape(auctionTitle) +  
        "&dates=" + utcDate + "/" + utcDate +
        "&details=" + escape(location.href); 

    GM_addStyle(".tmgr_addToGoogle {padding-top:5px; text-align:center}");
    // TODO better layout
    $("#SaveToWatchlist_SaveToWatchlistButton,#ClosingTime_ClosingTimeContainer")
        .after('<div id="tmgr_addToGoogle" class="tmgr_addToGoogle">' + 
                   '<a href="' + reminderLink + '">' +
                       '<img src="https://www.google.com/calendar/images/ext/gc_button2.gif">' +
                   '</a>' +
               '</div>');
}

var reminderTime = getCloseDateTime();
if (reminderTime) {
    addReminderLink(reminderTime);
}