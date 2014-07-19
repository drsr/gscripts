// ==UserScript==
// @name       Realestate.co.nz filter
// @namespace  http://drsr/
// @version    0.1
// @description  Filter out listings that don't name a definite price in Real Estate search results on realesatate.co.nz.
// @include    http://www.realestate.co.nz/residential/*
// @grant      none
// @copyright  public domain
// ==/UserScript==


//-----------------------------------------------------------------------------------------------
// Listings with a "price" that matches this pattern will be hidden
var KILL_PATTERN = /(Negotiation)|(Enquiries Over)|(Offers Over)|(Negotiable from)|(Tender)|(Auction)|(POA)|(Offers)|(Buyer enquiry over)|(Buyer budget from)/i;

// Some alternative kill patterns below, remove the "//" at the start of the line add a "//" before the other patterns to use them

// Any price that doesn't contain a dollar sign. This will allow "Enquiries over $nnnn" but block all auctions, tenders etc.
// var KILL_PATTERN = /^[^\$]*$/;

// Only kill "Price by negotiation"
// var KILL_PATTERN = /Price by negotiation/i;
//-----------------------------------------------------------------------------------------------

var KILLED_LISTING_STYLES = 
".killedlisting {background-color:#eeeeee !important; color: #999999 !important;}\
.hiddenlisting {display:none !important;}";

function addStyle(style) {
	$("<style>").prop("type", "text/css").html(style).appendTo("head");
}
addStyle(KILLED_LISTING_STYLES);

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

/* TODO not sure if this is needed
// get the max and min prices from the search form 
// values for "Any" = 0, "2M+" = 2000000
var maxPrice = parseInt($("#max-49").val());
var minPrice = parseInt($("#min-49").val());

function priceInsideRange(price) {
    if (price.indexOf('$')<0) {
        return true;
    }

    var numericPrice = parseInt(price.split('$')[1].replace(/,/g, ''));
    // catch prices accidentally listed as price/1000
    if (numericPrice < 1000) {
        numericPrice *= 1000;
    }

    // check for 2 million because this search form option is actually 2 million plus so doesn't count as a max
    var insideMax =  maxPrice <= 0 || maxPrice == 2000000 || numericPrice <= maxPrice;
    var insideMin = minPrice <=0 || numericPrice >= minPrice;

    return (insideMin && insideMax);
}
*/
function addListingHeader() {
    if (killedListingCount > 0) {
        // add after the "nnnn listings, showing n to n" para
        $(".numberOfListings").each(function(index, listingCount) {
			var $listingCount = $(listingCount);
            $listingCount.html($listingCount.html()+ "<br/>" + killedListingCount + ' hidden listings, <a class="killToggle" title="listings hidden by realestate.co.nz Filter script" href="javascript:void(0)">show</a>');
        });
        $(".killToggle").click(toggleListingVisibility);
    }
}

function scriptMain() {
    // Class for the price field is different in gallery view so this won't find anything
    $(".price").each(function(index, listingPrice) {
        var price = listingPrice.textContent;
        if (KILL_PATTERN.test(price)) {
            
            $(listingPrice).closest(".listing").addClass("killedlisting hiddenlisting");
            $(listingPrice).closest(".listDetailsHolder").attr("style","background-color:#eeeeee; color: #999999;");
            killedListingCount++;
            
        }});
    
    addListingHeader();
	      
}
// $(window).load(scriptMain);
scriptMain();