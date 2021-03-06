// ==UserScript==
// @name       TradeMe Real Estate filter
// @namespace  http://drsr/
// @version    1.3
// @description  Filter out listings that don't name a definite price in Real Estate search results. List view only. Tampermonkey only
// @include    /https://www\.trademe\.co\.nz/[Bb]rowse/[Cc]ategory[Aa]ttribute[Ss]earch[Rr]esults.aspx.*/
//    tried using params to select only real estate search results but there are too many variants
// @include    https://www.trademe.co.nz/property/*
// @include    https://www.trademe.co.nz/browse/property/regionlistings.aspx*
// @include    https://www.trademe.co.nz/members/listings.aspx*
// @grant      none
// @copyright  public domain
// ==/UserScript==


//-----------------------------------------------------------------------------------------------
// Listings with a "price" that matches this pattern will be hidden
var KILL_PATTERN = /(Price by negotiation)|(Enquiries Over)|(To be auctioned)|(Tender)|(Deadline private treaty)|(Deadline sale)/i;

// Some alternative kill patterns below, remove the "//" at the start of the line add a "//" before the other patterns to use them

// Any price that doesn't contain a dollar sign. This will allow "Enquiries over $nnnn" but block all auctions, tenders etc.
// var KILL_PATTERN = /^[^\$]*$/;

// Only kill "Price by negotiation"
// var KILL_PATTERN = /Price by negotiation/i;
//-----------------------------------------------------------------------------------------------

// v1.3 work with top-tier and highlighted listings
// v1.1.3 Fix hiding all rental listings
// v1.1.2 Trademe changed class for listing price
// v1.1, v1.1.1 Greasemonkey 2.0 changes
// v1.0 work with "Properties from this office" page and category listing pages

var KILLED_LISTING_STYLES = 
".killedlisting {background-color:#eeeeee !important; color: #999999 !important;}\
.hiddenlisting {display:none !important;}";

function addStyle(style) {
	$("<style>").prop("type", "text/css").html(style).appendTo("head");
}
addStyle(KILLED_LISTING_STYLES);

// replace trademe's JS error handler
window.onerror=function(msg, url, linenumber){
    if (msg.indexOf("Uncaught TypeError") < 0) { // caused by Adblock in Chrome I think
        console.log('Error message: '+msg+'\nURL: '+url+'\nLine Number: '+linenumber);
    }
    return true;
};

var killedListingCount = 0;

function toggleListingVisibility() {
    $(".killedlisting").toggleClass("hiddenlisting");
    $(".killToggle").each(function(index, toggle) {
        $(toggle).text($(toggle).text()==="show" ? "hide" : "show");
    });
}

// keypress code borrowed from "Google reader tiny"
function REF_key(event) {
   element = event.target;
   elementName = element.nodeName.toLowerCase();
   if (elementName == "input") {
     typing = (element.type == "text" || element.type == "password");
   } else {
     typing = (elementName == "textarea");
   }
   if (typing) return true;

    if (String.fromCharCode(event.which)=="H" && !event.ctrlKey && !event.altKey && !event.metaKey) {
     toggleListingVisibility();
     try {
       event.preventDefault();
     } catch (e) {
     }
     return false;
   }
   return true;
 }
document.addEventListener("keydown", REF_key, false);

function priceInsideRange(price) {
    if (price.indexOf('$')<0) {
        return true;
    }

    var numericPrice = parseInt(price.split('$')[1].replace(/,/g, ''));
    // catch prices accidentally listed as price/1000
    if (numericPrice < 1000) {
        numericPrice *= 1000;
    }

    // get the max and min prices from the search form 
    // values for "Any" = 0, "10M+" = 10000000
    var maxPrice = parseInt($("#max-49").val());
    var minPrice = parseInt($("#min-49").val());   
    // check for 10 million because this search form option is actually 10 million plus so doesn't count as a max
    var insideMax =  maxPrice <= 0 || maxPrice == 10000000 || numericPrice <= maxPrice;
    var insideMin = minPrice <=0 || numericPrice >= minPrice;

    return (insideMin && insideMax);
}

function addListingHeader() {
    if (killedListingCount > 0) {

        // add after the "nnnn listings, showing n to n" para
        // there are two of these, one <div> and one <p>, with one hidden depending on browse or search mode, but hide operation happens after this script
        $(".listing-count-holder").each(function(index, listingCount) {
            var $listingCount = $(listingCount);
            if (listingCount.nodeName=='DIV') {
                // don't use listing-count-holder class as contents will be overwritten by TM script
                $listingCount.after('<div class="listing-count-label" style="font-size:12px; line-height:18px">' + killedListingCount + ' hidden listings, ' +
                                    '<a class="killToggle" title="listings hidden by TradeMe Real Estate Filter script" href="javascript:void(0)">show</a>'+
                                    '</div>');
            }
        });
        $(".killToggle").click(toggleListingVisibility);
    }
}

function scriptMain() {

	// try to check for property search results as it sometimes fires on Motors search results
	// breadcrumb class is different for category listing page e.g.
	// http://www.trademe.co.nz/property/residential-property-for-sale/canterbury/christchurch-city

	var firstBreadCrumb = $("#mainContent .site-breadcrumbs a:first, #mainContent .category-listings-breadcrumbs a:first");
	var priceColumnClass = ".tmp-search-card-list-view__price, .tmp-search-card-top-tier__price";
	if (firstBreadCrumb.length === 0) {
		// "Properties from this office" page
		firstBreadCrumb = $("#BreadCrumbsStore_BreadcrumbsContainer a:first");
		priceColumnClass = ".classifyCol";
	}
    // Check for the property search minimum price field (#max-49) to avoid catching rental property searches
	var isPropertySearchResult = firstBreadCrumb.text().indexOf("Property") != -1 && $("#max-49").val();
	if (isPropertySearchResult) {
		// Class for the price field is different in gallery view so this won't find anything
		$(priceColumnClass).each(function(index, listingPrice) {
			var price = listingPrice.textContent;
			if (KILL_PATTERN.test(price) || !priceInsideRange(price)) {
				card = $(listingPrice).closest(".tmp-search-card-list-view, .tmp-search-card-top-tier")
                if (card.length > 0) {
                    card.addClass("killedlisting hiddenlisting");
                    card.removeClass("feature highlight")
                }
				killedListingCount++;
				
			}});
		
		// TODO could kill ".super-features-container" if all prices inside (".super-feature-price") should be killed?
		
		addListingHeader();
	}        
}
scriptMain();