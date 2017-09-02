// ==UserScript==
// @name       My Trademe Tools
// @namespace  http://drsr/
// @version    0.7
// @description  Tweaks for My Trademe, especially watchlist notes
// @include    https://www.trademe.co.nz/*
// @include    https://www.trademe.co.nz/MyTradeMe/*
//    exclude iframe on stuff.co.nz pages
// @exclude    https://www.trademe.co.nz/iframe/*
// @copyright  public domain
// @grant		GM_xmlhttpRequest
// @grant		unsafeWindow
// ==/UserScript==
// v0.7: https
// v0.6: Fix for TM watchlist moved to https (probably Chrome only)
// v0.5: Fix for Firefox
// v0.4: More real estate attributes
// v0.3: show attributes from listing e.g. Location and Available for rental houses, car details for cars
// TODO:
//   On search results if saved button appears check watchlist for note and display
//   Linkify within notes

window.onerror=function(msg, url, linenumber){
    console.log('Error message: '+msg+'\nURL: '+url+'\nLine Number: '+linenumber);
        return true;
            };

$.when(
	$.ajax({
        url: "https://cdnjs.cloudflare.com/ajax/libs/jeditable.js/1.7.3/jeditable.min.js",
  		dataType: "script",
        cache: true
	})    
).done(scriptMain);

function formatForWrapping(s) {
    // Any long strings without whitespace get zero-length spaces inserted so they will wrap
    return s.replace(/\S{25}/g, "$&\u200b");
}

function embiggenNotes() {
    // show full note text by extracting it from the hidden input controls,
    // see SetNoteText() from TM's AddNote*.js
    $("#mainContent input[id*=note_tosave_]").each(function(index, noteInput) {
        var noteText = noteInput.value;
        var $noteInput = $(noteInput);
        var displayedText = $noteInput.next().text();
        if (noteText && noteText.length > 0 && displayedText && displayedText.indexOf("\u2026") > -1) {  // 2026 = ellipsis
            noteText = formatForWrapping(noteText);
            $noteInput.next().text(noteText); 
            $noteInput.parent().removeAttr("nowrap");
        }
    });
}


function addInterestingAttributes() {
    var attribsToFetch = ["Available", "Location", "Furnishings", "Parking", "Rooms", "Floor area", "Land area", "Rateable value (RV)", "Kilometres", "Engine size", "Engine", "Registration expires", "WOF expires"];
	return $("tr[id*='row2']").each(function(index, watchlistRow) {
        var auctionLink = "https://www.trademe.co.nz" + $("a:first", watchlistRow).attr("href");
        // can't use $.get() due to same-origin policy
        GM_xmlhttpRequest({
  			method: "GET",
  			url: auctionLink,
  			onload: function(responseText) {
                var listing = responseText.response;
                var listingAttribs = {};
                $("[id^=ListingAttributes_AttributesRepeater]", listing).each(
                    function(index, attrib) {
                        var attribName = $.trim(attrib.textContent).slice(0,-1);
                        // use html() to retain formatting from m2 etc. 
                        listingAttribs[attribName]=$.trim($(attrib).next().html());
                    });
                var interestingAttribs = [];
                $.each(attribsToFetch, 
                       function(index, attribName) { 
                           if (listingAttribs[attribName]) {
                               if (attribName==='Location') {
                                   var locationText = listingAttribs[attribName].split("<br>").slice(0,1).join(" ");
                                   interestingAttribs.push("Location: " + locationText);
                               } else {
                                   interestingAttribs.push(attribName + ": " + listingAttribs[attribName]);
                               }
                           }
                       });
                if (interestingAttribs.length > 0) {
                    var descriptionLocation = $("div.note_spacer_class", watchlistRow);
                    // more or less the same style as the "Closes:" div
                    descriptionLocation.before('<div style="margin: 0px; width: 100%; padding-right: 1px; padding-left:0px;"><small>' + interestingAttribs.join(", ") + '</small></div>');
                }
            }});
	});
}
                                                
var fromEditWatcher = false; // avoid recursive mutations from our changes
function editWatcher(mutations) {
    if (!fromEditWatcher) {
        fromEditWatcher = true;
    	embiggenNotes();
		fromEditWatcher = false;        
    }
}

function observeTree(selector, watchFunction) {
    var observer = new MutationObserver(watchFunction);
    observer.observe(document.querySelector(selector), {childList: true, subtree : true });
}

function watchForNoteEdits() {
    observeTree("#mainContent", editWatcher);
}

function WatchlistItem() {
}

function Watchlist() {
	this.watchlist = [];
    this.morePages = false;
}

Watchlist.prototype.extractParam = 
    function (url, param) {
        var  paramValue;
        var urlRight = url.split(param+'=')[1];
        if (urlRight) {
            paramValue = urlRight.split("&")[0];
        }
        return paramValue;
    };

Watchlist.prototype.readPage = 
    function (watchlistPage) {
        var _watchlist = this; // jQuery each changes "this"
        // only have IDs rather than classes to identify rows:
        // id "row2n": checkbox, thumbnail, title link
        // id "row3n": note, or the "add note" link
        // "n" starts at 0
        $("tr[id*='row3']", watchlistPage).each(function(index, watchlistRow) {
            var thisItem = new WatchlistItem();
            var noteLink = $(".note_label:first a", watchlistRow).attr("href");
            thisItem.auctionId = _watchlist.extractParam(noteLink, "auction_id");
            thisItem.noteId = _watchlist.extractParam(noteLink, "note_id");
            thisItem.note = $(".note_label :input", watchlistRow).val();
            _watchlist.watchlist[thisItem.auctionId] = thisItem;
        });
        
        this.morePages = ($("#mainContent a:contains('Next')", watchlistPage).length > 0);
   };

Watchlist.prototype.loadCurrentPage = function() {
    var pageDeferred = $.Deferred();
    var wlThis = this;
    if (this.morePages) {
        // can't use $.get due to https
        GM_xmlhttpRequest({
            method: "GET",
            url: "https://www.trademe.co.nz/MyTradeMe/Buy/Watchlist.aspx?filter=all&page=" + this.pageCtr, 
            onload: function(responseText) {
                var wlPage = responseText.response;
                wlThis.readPage(wlPage);
                pageDeferred.resolve();
            }});
      	this.pageCtr++;
        $.when(pageDeferred).then(this.loadCurrentPage.bind(this)); // recurse; need to load one at a time to check for a next page, could load all at once from number links I guess
    } else {
        // whole watchlist load complete
       this.deferred.resolve();
    }
};
    
Watchlist.prototype.load = function() {
        this.pageCtr = 1;
        this.morePages = true;
    	this.watchlist = {};
        this.deferred = $.Deferred();
        this.loadCurrentPage();
        return this.deferred; // note watchlist is not loaded yet, must wait for deferred to resolve with when()
    };

Watchlist.prototype.getItem = function(auctionId) {
    return this.watchlist[auctionId];
};

var watchlist = new Watchlist();
function withWatchlist(callback) {
	$.when(watchlist.load()).then (callback);
}
//-------------- Watchlist end -----------------------------------------

//----- Notes Start -----------------------------------------------------------------------------------------------
function WatchlistNote(auctionId, watchlist) {
    this.auctionId = auctionId;
    this.watchlistItem = watchlist.getItem(auctionId);
}
WatchlistNote.prototype.getId = function() {
    return this.watchlistItem.noteId;
};
WatchlistNote.prototype.getNote = function() {
    return this.watchlistItem.note;
};


WatchlistNote.prototype.save = function() { 
    // TODO AJAX save
};

WatchlistNote.prototype.defaultText = function() { return (this.getNote() ? this.getNote() : ' '); };

// note_delete_left.png
WatchlistNote.prototype.noteDeleteLeftIcon = 
	"data:image/gif;base64,R0lGODlhFgAVAPcAAAAAAJmZmZ+fmL6/luPlk+Tmk/Dykvz/kf///wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACH5BAEAAP8ALAAAAAAWABUAAAiAAP8JHEjwgMGDCA0SFJiwYcKCDiMqZChRIsWKEf85NDBAQAABAww41JiQgMcAKD8SwHjAwMmUKAWIrDgAJYKUNwMMwPjyZs6PGGEG+ImSJ86hKQVgrInUJsqdFV0KjTmzYoGXMQs0JJmQo0eQVRFyZbl1LNmDA88+TKt2IsSzAQEAOw==";

WatchlistNote.prototype.html = function() {
        // TODO linkify links and auction numbers
        return this.defaultText().replace(/\n/g,"<br/>");
    };

function addNoteEditDiv(note, item) {
    if (myJQ(note.jqPrefix + "_text").length > 0) {
        return;
     }
    
     myJQ(".delete", item).after(
'<div class="watchlistNote watchlistNotePosition" id="' + note.id + '_ctr">\
    <div class="watchlistNoteDelete">\
        <a class="watchlistNoteDeleteIcon" id="' + note.id + '_del" title="Delete this note"><img src="' + this.noteDeleteLeftIcon + '"/></a>\
    </div>\
    <div class="watchlistNoteText" id="' + note.id + '_text">' + note.html() + '</div>\
</div>');
    
    // make it editable using Jeditable
    myJQ(note.jqPrefix + "_text").editable(function(value, settings) { 
        // TODO delete note if text is empty?
        note.text = value;
        note.save();
        removeNoteAddIcon(note);
        return(note.html());
    }, { 
        type    : 'textarea',
        submit  : 'OK',
        cancel  : 'Cancel',
        // TODO more rows if text is longer?
        rows : 3,
        width: 410,
        tooltip   : 'Click to edit note',
        // on edit start, use plain text rather than the HTML text in the editable div
        data : function (value, settings) { return note.defaultText(); },
        // on cancel or blur, remove the note div if the note hasn't been saved
        onreset : function (editable, value) { if (!note.text) { removeNoteEditDiv(note); return false; } },
        cssclass : 'watchlistNoteEditable'
    });

    // delete icon click
    myJQ(note.jqPrefix + "_del").click( function() { 
        note.remove();
        removeNoteEditDiv(note); 
        addNoteAddIcon(note, item);
        });
}

function addNoteAddIcon(note, item) {
    var addIconSuffix = "_addicon";

    // don't add if it's already there
    if (myJQ(note.jqPrefix + addIconSuffix).length==0) { 
        
        myJQ(note.jqPrefix + "_add").append(
            '<a id="' + note.id + addIconSuffix + '" title="Add note">\
<img src="/images/my_trademe/ajax/note_left_off_white.gif"></a>');
    
        myJQ(note.jqPrefix + addIconSuffix).click(function() {
            addNewNoteAndEdit(note, item);
        });
    }
}

function removeNoteAddIcon(note) {
    myJQ(note.jqPrefix + "_addicon").remove();
}

function addStyle(style) {
	$("<style>").prop("type", "text/css").html(style).appendTo("head");
}
function initNotes() {
        addStyle(
   ".watchlistNoteIcon {float:left; margin-right:10px; cursor:pointer;}\
.watchlistNote {clear:both; cursor:pointer; background-color:#FCFF91; width:500px;}\
.watchlistNoteText {float:left; background-color:#FCFF91; max-width:415px; overflow:hidden; padding:3px 10px 5px 5px;\
border-top-right-radius:10px; border-bottom-right-radius:10px; font-size:11px; }\
.watchlistNoteEditable TEXTAREA { background-color:#FCFF91; font-size:11px;}\
.watchlistNoteDelete {float:left;}\
");
}

// holder for the "Add note" icon
function addNoteIconHolder(selector, item, note, useSpan) {
    var container = myJQ(useSpan ? "<span>" : "<div>", 
                         {class: "watchlistNoteIcon", id: note.id+"_add"});
    myJQ(selector, item).after(container);
}

function addNotesToList(notesSelectors, useSpan) {
    
    myJQ(notesSelectors.item).each(function(index, item) {
        
        var memberName = myJQ(notesSelectors.member, item).text();

        var note = new WatchlistNote(memberName);
        
        addNoteIconHolder(notesSelectors.iconPosition, item, note, notesSelectors.useSpan);
 
        if (note.text) {
            addNoteEditDiv(note, item);
        } else {
            addNoteAddIcon(note, item);
        }
    });

}

function addNotesToBlacklist() {
	initNotes();

    addNotesToList({item: "#theList .item, #theList .altItem", 
                    member: ".nick > a", 
                    iconPosition: ".memberRating"});
}

function addNotesToSellers() {
	initNotes();
    
    addStyle(
        ".watchlistNoteIcon {float:none; margin-right:10px; cursor:pointer;}\
.watchlistNotePosition {margin-top:5px; margin-left:-4px;}");
    
    addNotesToList({item: ".tre tr", 
                    member: ".title > span > a", 
                    iconPosition: ".title > span",
                    useSpan: true});
}
    
// ---- Notes end -------------------------------------------------------------------------------------


function showNotesOnItem() {
    var saveButton = $("#SaveToWatchlist_SaveToWatchlistButton");
    if (saveButton.hasClass("Saved")) {
        // TODO could defer loading the watchlist till here
        var wlItem = watchlist.getItem(unsafeWindow.listingId);
        if (wlItem && (wlItem.note.length > 0) ) {
            initNotes();
            $("#SaveToWatchlist_MessageWatchlistSaveInvalidAttempt").after("<div class='watchlistNote'>" + wlItem.note + "</div>");
        } else {
            // TODO add a Note link here
            
        }
    }
}

function scriptMain() {
 	// Only show the notes if we're viewing a listing
    var trademePage = window.location.toString().toLowerCase();
    if (trademePage.indexOf("listing")>0) {
        // on a listing page, show the notes
        withWatchlist(showNotesOnItem);
    } else {
        // on the main watchlist page
        embiggenNotes();
    	watchForNoteEdits();
        addInterestingAttributes();
    }
}