// ==UserScript==
// @name       TradeMe Tweaks
// @namespace  http://drsr/
// @version    0.9
// @description  Tweak TradeMe page elements, including the main menu, header, footer, and sidebar, and maps
// @include    http://www.trademe.co.nz/*
//    exclude iframe on stuff.co.nz pages
// @exclude    http://www.trademe.co.nz/iframe/*
// @copyright  public domain
// @run-at   document-end
// @require https://greasyfork.org/scripts/2722-gm-config-mod-library/code/gm_config_mod%20library.js?version=7536
// @grant none
// ==/UserScript==
// v0.9: Greasemonkey 2.0 changes
// v0.8: Click on either of the "Watching" buttons on a listing to remove it from the watchlist
// v0.7: Option to hide other ads on sidebar (although AdBlock does this anyway), fix box width for quick links
// v0.6: Wait for map to load before tweaking it
// v0.5: Add "Full map" and "Zoodle" links to map info window on Real Estate pages, hide Travelbug on homepage
// v0.4: Click the "Saved" button on a listing to remove it from the watchlist
// v0.3: Change order of extra items on "My Trade Me" dropdown to match sidebar
// v0.2: Add "Tweak My Trade Me dropdown menu items", adds "Blacklist" and "My Photos" to menu

function addStyle(style) {
	$("<style>").prop("type", "text/css").html(style).appendTo("head");
}
var settings = {};
function removeDropdowns() {
    // Remove dropdowns from top menu, just go straight to the pages
    $(".modal-open:not([class*='search-options'])").unbind("click");
    // deleting the dropdown arrow span makes the buttons symmetrical but looks more jumpy: $(".modal-open span").remove();
    $(".modal-open:not([class*='search-options']) span").css("background-image", "none"); // dropdown arrow
    
    // Same for "My Trademe"
    $("#SiteHeader_SiteTabs_myTradeMeDropDownLink").unbind("click");
    // $(".mytrademe span").remove(); // dropdown arrow
    $(".mytrademe span").css("background-image", "none"); // dropdown arrow
}
function removeSidebarFeatures() {
    // remove unwanted sidebar features
    if (settings.hideSidebarOtherAds) {
        $("#lifeDirectForm_lifeDirectDiv").hide();
        $("#HomepageAdSpace").hide();
    }
    if (settings.hideSidebarFindSomeone) {
        $(".sidebar-feature:not([id])").hide(); // "find someone"
    }
    if (settings.hideSidebarTreatme) {       
        $("#treatMe_dailyDealsDiv").hide();
    }
    if (settings.hideSidebarTravelbug) {
        $("#travelbugDeals_dailyDealsDiv").hide();
    }
}
function addQuickLinksToSidebar() {
    if ($("#sidebar_tmtw_QuickLinks").length > 0 || !settings.addQuicklinksToSidebar) {
        return;
    }
    
    // TODO tweak layout, border?
    addStyle("\
.tmtw_ql h3 {\
font: bold 16px Arial,Helvetica,Sans-serif;\
color: #c60;\
padding: 3px 10px 0;\
}\
.tmtw_ql a {\
padding-left:2em;\
}");
    
    $('.sidebar').prepend('\
<div id="sidebar_tmtw_QuickLinks" class="old-box solid sidebar-feature" >\
	<div class="inner">\
        <div class="bd tmtw_ql">\
		<ul style="padding-bottom:10px">\
			<li><h3 id="SiteHeader_SideBar_tmtw_ql_BuyingText">Buying</h3>\
				<ul>\
					<li><a href="/MyTradeMe/Buy/Watchlist.aspx?source=sidebar" id="SiteHeader_SideBar_tmtw_ql_WatchlistLink">Watchlist</a></li>\
					<li><a href="/MyTradeMe/Buy/Won.aspx?source=sidebar" id="SiteHeader_SideBar_tmtw_ql_WonItemsLink">Items I won</a></li>\
					<li><a href="/MyTradeMe/Buy/Lost.aspx?source=sidebar" id="SiteHeader_SideBar_tmtw_ql_LostItemsLink">Items I lost</a></li>\
					<li id="SiteHeader_SideBar_tmtw_ql_FavouritesListItem"><a href="/MyTradeMe/Favourites.aspx?source=sidebar" id="SiteHeader_SideBar_tmtw_ql_FavouritesLink">My favourites</a></li>\
					<li><a href="/Browse/Latest.aspx">Latest listings</a></li>\
					<li id="SiteHeader_SideBar_tmtw_ql_RecentlyViewedListItem" class="Last"><a href="/Listings/recently-viewed.htm" id="SiteHeader_SideBar_tmtw_ql_RecentlyViewedLink">Recently viewed</a></li>\
				</ul>\
			</li>\
			<li class="Selling"><h3 id="SiteHeader_SideBar_tmtw_ql_SellingText">Selling</h3>\
				<ul>\
					<li id="SiteHeader_SideBar_tmtw_ql_ListAnItem"><a href="/Sell/Default.aspx?source=sidebar" id="SiteHeader_SideBar_tmtw_ql_ListAnItemLink">List an item</a></li>\
					<li><a href="/MyTradeMe/Sell/Current.aspx?source=sidebar" id="SiteHeader_SideBar_tmtw_ql_SellingLink">Items I\'m selling</a></li>\
					<li><a href="/MyTradeMe/Sell/Sold.aspx?source=sidebar" id="SiteHeader_SideBar_tmtw_ql_SoldItemsLink">Sold items</a></li>\
					<li id="SiteHeader_SideBar_tmtw_ql_unsoldLink" ><a href="/MyTradeMe/Sell/Unsold.aspx?source=sidebar" id="SiteHeader_SideBar_tmtw_ql_UnsoldItemsLink">Unsold items</a></li>\
					<li><a href="/MyTradeMe/MyPhotos.aspx">My Photos</a></li>\
					<li><a href="/MyTradeMe/BlackList.aspx">Blacklist</a></li>\
				</ul>\
			</li>\
		</ul>\
		</div>\
	</div>\
</div>');
}
function isHomePage() {
    return ($(".sidebar").length > 0);
}
function removeTopBar() {
    /* Hide the top nav bar, which is stretched out when Adblock is operational and when zoom is less than 100% */
    $(".sat-nav").hide();
}
// --------------------------------------------------------------------------------------------
function unsaveButton(evt) {
    // Unsaved:
    //   class="SaveToWatchlistButton spriteButton button30"
    // Saved:
    //   class="SaveToWatchlistButton Saved spriteButton"
    var ret = false;
    var saveButton = $("#SaveToWatchlist_SaveToWatchlistButton");
    var topSaveButton = $("#ListingTitle_watchlistLink");
    if (saveButton.hasClass("Saved")) {
        $.ajax({
            type: 'POST',
            url: '/MyTradeMe/WatchlistDelete.aspx',
            data: {
                "refurl": window.location.href,
                "type": "watchlist",
                "postback": "0",
                "ref": "watchlist",
                "auction_id": "0", /* actual IDs are in auction_list */
                "offer_id": "",
                "auction_list": window.listingId, /* Listing ID global from page */
                "submit1": "Delete"
            },
            error: function(jqXHR, textStatus, errorThrown) {
                    alert("Error while unsaving from watchlist: " + textStatus + " " + errorThrown); 
            },
            success: function(data, textStatus, jqXHR) {
                saveButton.removeClass("Saved").addClass("button30");
                topSaveButton.removeClass("saved btn-disabled").addClass("linkUnsaved");
                topSaveButton.children("span").attr("class", "watchlist-plus");
                topSaveButton.contents()[1].textContent="Watchlist";
                // these divs are generated hidden if the item is saved already
                $("#SaveToWatchlist_EmailReminder, #SaveToWatchlist_TextReminder").hide();
                // page global generated by TradeMe and used by TM click event
                window.isSaved = false;
            }
        });
    } else {
        // call original TM click function (cheat by calling the bottom one even if the top one was clicked)
        ret = window.BottomListingWatchlistButtonClick(evt);
        // Make sure we still have the click captured and re-enable the top button
        tweakSavedButtonClicks();
        
    }
    evt.preventDefault();
    return ret;
}
function tweakSavedButtonClicks() {
    var saveButtons = $("#SaveToWatchlist_SaveToWatchlistButton, #ListingTitle_watchlistLink");
    saveButtons.removeClass("btn-disabled");
    // replace click event, will chain to the original if it's not currently saved
    saveButtons.unbind().click(unsaveButton);
}

function tweakSavedButton() {
    addStyle(".SaveToWatchlistButton.Saved{cursor:pointer !important}");
    tweakSavedButtonClicks();
}
// --------------------------------------------------------------------------------------------
function removeFooter() {
    /* Hide the grey site footer, which unnecessarily appears on every page and is way too big */
    $(".site-footer").hide();
}
function tweakBeforeLoad() {
    if (isHomePage()) {
        if (settings.hideTopBarOnHomepage) {
            removeTopBar();
        }
        if (settings.hideFooterOnHomepage) {
            removeFooter();
        }
        removeSidebarFeatures();
        addQuickLinksToSidebar();
    } else {
        if (settings.hideTopBarOnOtherPages) {
            removeTopBar();
        }
        if (settings.hideFooterOnOtherPages) {
            removeFooter();
        }
    }
}

// Add extra links to "My Trade Me"
function tweakMyTrademeDropdown() {
    $("#SiteHeader_SiteTabs_myTradeMeDropDownLink").click(function() {
        $("#mtm-selling ul:eq(1) li:eq(1)").replaceWith('<li><a href="/MyTradeMe/MyPhotos.aspx">My Photos</a></li>');
        $("#mtm-selling ul:eq(1) li:eq(1)").append('<li><a href="/MyTradeMe/BlackList.aspx">Blacklist</a></li>');        
    });
}

// Add "Open in Google Maps" to map's InfoWindow on Real Estate pages
// The "Powered by Google" link opens the right area, but doesn't display a marker at the property location
// Also adds a link for Zoodle, to easily get school zones
function tweakMap() {
    // mapState is a global in TM real estate pages
    var mapState = window.mapState;
	if (mapState && mapState.lat && mapState.lng) {
        var zoomIn = $('a:contains("Zoom in")');
        if (zoomIn.length == 0) {
            // console.log("Map not loaded yet");
            setTimeout(tweakMap, 2000);
        } else {
            zoomIn.nextAll().remove();
            zoomIn.replaceWith('<a target="_blank" href="https://maps.google.co.nz?q=' + 
                               mapState.lat + ',' + mapState.lng +
                               '" title="Open Google Maps in a new window">Full map</a>' +
                               '&nbsp;|&nbsp;<a target="_blank" href="https://www.zoodle.co.nz/search?query=' +
                              escape(mapState.userEnteredLocation) +'" title="Search for this address in Zoodle">Zoodle</a>');
        }
    } else {
        console.log("No mapState in page");
    }
}    

function tweakAfterLoad() {
    if (settings.removeDropdowns) {
        $(window.document).unbind("ready");
        removeDropdowns();
    } else {
        if (settings.tweakMyTrademeDropdown) {
            tweakMyTrademeDropdown();
        }
    }
    tweakSavedButton();

    tweakMap();
    
    addSettingsButton();
}

function addSettingsButton() {
    $("<a href='javascript:void(0)' id='tmtwsettings' title='Trademe Tweaks settings' style='margin-left:10px'>" +
      "<img width='16' height='16' title='' alt='' style='margin-bottom:-2px' src='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAD5UlEQVR4nGJkwAGam5u3MTIyejIwMDD8//9/e21trRc2dQAAAAD//2KBMRoaGgoYGRlj////39zQ0LDh////ht7e3gwMDAwMW7ZsMYSqiWVkZCz4////4oaGhgkMDAwMAAAAAP//YoRp5uPj6zc2NmY4f/48w/v373dxcXG5eXp6MjAwMDBs376d4du3b0cEBQVtDA0NGc6ePcvw6dOnwoaGhgkAAAAA//8EwTERwDAIQNGfu84YyMiKhISxLuKpomKDEQ1sXN97ALr7mBkigrsTEe+ck6oCYO9NZi5VZYyBmXHvPcD3AwAA//80zzERwAAMA7G/DoZhsoVnJN5CILlOFQM9fzkJbZkZbCOJ3eXukIRtZoa2JAF4AT4AAAD//zTQMRXAMAgFwB+W4oEJxKSeEICn1guZeGhg7NSTcOs/cPdHRLaqgpmRmaiqIaIlIpeZYWZwzkF3vxFxA8AHAAD//wBBAL7/AXh4eLb9/f0xCAgIGCwsLAAMDAwA4eHhAOTk5L6JiYlLAAAAAHd3d7UcHBxCHx8fAPT09ADU1NQA+Pj46AMDA88AAAD//wTBsQ3AMAgEwI9cYOg8CrNRsAPLMUo6ZAqU3D1m9qkqiAhVBWZGZt6IODNzAWCttd39VdVdVRARdDcyEz8AAAD//zzPwQkAMAgEsFO6hPtv5ssJ5EDUvtpskEMS7g5VhYjAzNDdv/ZUlWQmIgK7i5kBSVwAAAD//wTBsREAIAgAMe4bbWFNFvScBQbADiYwAbiZ+SJCqkq6W1R1ufsBNrDd/ZjZmhmpKokIycwH3A8AAP//gtuUmpq6/9+/fw4iIiIMKioqDM+fP2d48uTJTwYGBgYZGRl2SUlJhjt37jC8efOGgYmJ6eTs2bMtGBgYGAAAAAD//2JkYGBgKCoqCn3z5s0qGRkZhnfv3jFwcXExKCkpMbCzszMwMjLCQ//bt28MQkJCDE+ePGEQERFJ7uvrmwcAAAD//wTBsQ3AMAgAwS/S4QbJk2YBb5L1EELUxoVF7h4Ad19zTjKTvTcRgZkxxuDeyzmHqkJE6G5UFXd/ge8HAAD//wTBsQnAQAwEwcVcAeo//1YcOr8OhEB8JlDmmQcgIo5tMpOqQtJ372Vm2F26G0lvVZGZ2CYiDsAPAAD//wTBMRHAMAwDQJ2YaDCC7gVSAgURAEFgEGYUGPamMf8EgMzckhbJExF/VT22Z2bQ3bA9VfVGxEfySFqZuQHgAgAA//+CBSIzIyMjBxMTkwAjIyMvExOTgJ2d3awPHz7oQl145dChQxn/////9u/fv4//////8P///2//////CQAAAP//AwAvroSUkykoBQAAAABJRU5ErkJggg==' />"
      +"</a>")
    	.appendTo(".time");
    $("#tmtwsettings").click(openGMConfig);
}

function initSettings() {
    // TODO not working except .config_var, CSS is generated in iframe but ignored, iframe issue?
    var configCSS = 
        '\n' + " #GM_config_wrapper {margin-left: auto !important; margin-right: auto !important; width:30em !important} " + '\n' +
        "#GM_config_buttons_holder  {margin-left: 25% !important; margin-right: 25% !important; } " + '\n' + 
        "#GM_config .config_var {margin-top: 1em; margin-bottom: 1em; margin-left:10%; margin-right:10%}"; 
    
    settings = {
        hideTopBarOnHomepage: false,
        hideTopBarOnOtherPages: true,
        
        hideFooterOnHomepage: false,
        hideFooterOnOtherPages: true,
        
        removeDropdowns: false,
        tweakMyTrademeDropdown: false,
        
        addQuicklinksToSidebar: true,
        
        hideSidebarOtherAds: false,
        hideSidebarFindSomeone: false,
        hideSidebarTreatme: false,
        hideSidebarTravelbug: false
    };
    GM_config.init('TradeMe Tweaks Settings',
    {
        'hideTopBarOnHomepage': {
            'section': ['Top Bar'],
            'type': 'checkbox', 
            'label': 'Hide on home page',
                'default': settings.hideTopBarOnHomepage
         },
        
        'hideTopBarOnOtherPages': {
            'type': 'checkbox',
            'label': 'Hide on other pages',
            'default': settings.hideTopBarOnOtherPages
        },
        
         'hideFooterOnHomepage': {
            'section': ['Footer'],
                'type': 'checkbox', 
            'label': 'Hide on home page',
                'default': settings.hideFooterOnHomepage
         },
        
        'hideFooterOnOtherPages': {
            'type': 'checkbox',
            'label': 'Hide on other pages',
            'default': settings.hideFooterOnOtherPages
        },
        
        'removeDropdowns': {
            'section': ['Main menu'],
                'type': 'checkbox', 
            'label': 'Remove dropdowns from main menu',
                'default': settings.removeDropdowns
         },
         'tweakMyTrademeDropdown': {
            'type': 'checkbox', 
            'label': 'Tweak My Trade Me dropdown menu items',
            'default': settings.tweakMyTrademeDropdown
         },
       'addQuicklinksToSidebar': {
            'section': ['Home Page Sidebar'],
                'type': 'checkbox', 
            'label': 'Add Quick Links',
                'default': settings.addQuicklinksToSidebar
         },
        
        'hideSidebarFindSomeone': {
            'type': 'checkbox',
            'label': 'Hide Find Someone',
            'default': settings.hideSidebarFindSomeone
        },
        
        'hideSidebarTreatme': {
            'type': 'checkbox',
            'label': 'Hide Treatme',
            'default': settings.hideSidebarTreatme
        },
        'hideSidebarTravelbug': {
            'type': 'checkbox',
            'label': 'Hide Travelbug',
            'default': settings.hideSidebarTravelbug
        },
        'hideSidebarOtherAds': {
            'type': 'checkbox',
            'label': 'Hide Other Sidebar Ads',
            'default': settings.hideSidebarOtherAds
        },
    }, configCSS);
    
    // for..in doesn't officially work in GreaseMonkey
    var settingKeys = Object.keys(settings);
    for (var i=0; i<settingKeys.length; i++) {
        settings[settingKeys[i]] = GM_config.get(settingKeys[i]);
    }
}
function openGMConfig() {
      
    // Code included from GM_config Extender http://userscripts.org/scripts/review/50018
    GM_config.resizeFrame = function(wid,hei) {
      if(fid=this.frame.id) {
        this.frame.style.width = wid;
        this.frame.style.height = hei;
      }
    }
    // end of GM_config Extender code 
        
    GM_config.onSave = function() {GM_config.close; window.location.reload();}; // so the "Save" button also closes the dialog and reloads the page
    
    GM_config.open();
    GM_config.resizeFrame('500px', '650px');
    
}
initSettings();
// GM_registerMenuCommand('TradeMe Tweaks: Settings',openGMConfig);
tweakBeforeLoad();
$(window).load(tweakAfterLoad);
