// ==UserScript==
// @name       Trademe feedback item descriptions
// @namespace  http://drsr/
// @version    1.3
// @description  Adds auction item description and price (where available) to feedback listing
// @include    https://www.trademe.co.nz/Members/Feedback.aspx*
// @include    /https:\/\/www.trademe.co.nz\/stores\/.*\/feedback/
// @grant      none
// @copyright  public domain
// ==/UserScript==
/*
* Changes:
* v1.3 fix auction archive links over https
* v1.2 https
* v1.1 New auction page layout
* v1.0 Greasemonkey 2.0
* v0.9 Avoid double item descriptions from feedback filter script
* v0.8 Fix for more stores
* v0.7 Fix unescaped tags in auction titles
* v0.5 Fix for stores
*/


// replace trademe's JS error handler
window.onerror=function(msg, url, linenumber){
    console.log('Error message: '+msg+'\nURL: '+url+'\nLine Number: '+linenumber);
        return true;
            };

function addStyle(style) {
	$("<style>").prop("type", "text/css").html(style).appendTo("head");
}

var listingQueue = [];
function listingItem(auctionUrl, feedbackItem) {
    this.auctionUrl = auctionUrl;
    this.feedbackItem = feedbackItem; // first row of feedback item
}

var timer;
function queueNext(delay) {
    if (listingQueue.length == 0) {
//        console.log("Queue empty");
    } else {
        // get the next listing when the timer expires
        timer = setTimeout(function() {
            getListing(listingQueue.shift());
      }, delay);
    }
}

var ITEM_DONE_MARKER = "tmfbid_done";
function getListing(listingItem) {
    $.get(listingItem.auctionUrl, function(listing) {
        // Selectors are in old format, new format order
        var auctionTitle = $("#ListingTitle_title,#ListingTitleBox_TitleText", listing).text();
        var winningBid = $("#ListingTitle_auctionTitleBids,.current-bid-details-closed", listing).text();
        var breadCrumbs = $(".listingBreadCrumbs", listing).html();
        var $feedbackItem = $(listingItem.feedbackItem);
        // Check the "Trademe feedback filter hasn't added a description while we were getting this page
        if (!$feedbackItem.hasClass(ITEM_DONE_MARKER)) {
            $feedbackItem.addClass(ITEM_DONE_MARKER);
            if (auctionTitle) {
                // Add with entities in auction title escaped
                $feedbackItem.after("<tr><td>&nbsp;</td><td>" + $("<p/>").text(auctionTitle).html() + "</td><td>" + winningBid + "</td></tr>");
            }
            if (breadCrumbs) {
                $feedbackItem.after("<tr><td>&nbsp;</td><td colspan=2 class='tmfbid_bc'>" + breadCrumbs + "</td></tr>");
            }
        } else {
            console.log("other script already filled " + $feedbackItem.text());
        }
    });
    // request next listing after timer delay
    queueNext(200);
}

// return TD that holds the feedback table header, items, and footer
// header and footer are table(1) and (3) under this, items list is table(2)
function feedbackTableContainer() {
    // layout varies wildly according to store features, so work up from the 
    // "Latest n feedbacks" header
    var ret = $("#mainContent small:contains('Latest'):eq(0)").parents("td:eq(1)");
    return ret;
}

function fixArchiveUrl(auctionUrl) {
    // TM does a stupid double-redirect for archive listings which breaks single-origin for https
    // e.g. https://www.trademe.co.nz/Archive/Browse/Listing.aspx?id=nnnnnnnnn
    // 301's to http://www.trademe.co.nz/Browse/Listing.aspx?archive=1&id=nnnnnnnn
    // which 301's to https://www.trademe.co.nz/Browse/Listing.aspx?archive=1&id=nnnnnnnnnn
    // So manually tweak the archive links here to avoid this
    if(auctionUrl.indexOf("/Archive/") != -1) {
        return auctionUrl.replace("/Archive/", "/") + "&archive=1";
    }
    return auctionUrl;
}

// link style for breadcrumbs to match style used in main listing
addStyle(".tmfbid_bc a{color:#0066CC; text-decoration:none;}");

// for the first row in every feedback item (only row with valign="top")
$("> table:eq(2) > tbody > tr[valign='top']", feedbackTableContainer()).each(
    function(index, feedbackItem) {
        // fourth column contains the auction link
        var auctionUrl = $("td:eq(3) > table > tbody > tr a", feedbackItem).attr("href");
        if (auctionUrl) {
            // rate-limit listing page requests by queuing them
            listingQueue.push(new listingItem(fixArchiveUrl(auctionUrl), feedbackItem));
        }
    });
// start fetching listing pages
queueNext(10);
