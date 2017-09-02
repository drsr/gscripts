// ==UserScript==
// @name       TradeMe Killfile
// @namespace  http://drsr/
// @version    3.1.0
// @description  Killfile for Trademe Message board using blacklist. Messages by users on the Trademe blacklist are given a special style
// @include    https://www.trademe.co.nz/Community/MessageBoard/*
// @include    https://www.trademe.co.nz/MyTradeMe/BlackList.aspx*
// @include    https://www.trademe.co.nz/Members/Listings.aspx*
// @include    https://www.trademe.co.nz/Members/Logout.aspx*
// @include    https://www.trademe.co.nz/MyTradeMe/Favourites.aspx?pv=3
// @require https://greasyfork.org/scripts/2722-gm-config-mod-library/code/gm_config_mod%20library.js?version=7536
// @require http://cdn.jsdelivr.net/jquery.jeditable/1.7.3/jquery.jeditable.js
// @grant       GM_xmlhttpRequest
// @grant		GM_setValue
// @grant		GM_getValue
// @grant		GM_deleteValue
// @grant		GM_log

// @copyright  public domain
// ==/UserScript==

/* Changes:
TODO: Add to blacklist not working
v3.1.0: https
v3.0.2: Fix cached blacklist not clearing when user added or removed
v3.0.1: "Add to blacklist" link on store pages, fix blacklist note data for https change
v3.0: handle move of the MyTrademe pages to https
v2.9: changes for Greasemonkey 2.0, settings icon to replace GM_registerMenuCommand
v2.8: external dependencies to comply with Greasyfork rules
v2.7: work with changes to favorite sellers list
Thanks to TM user "king1" for the Blacklist Bar code.
*/


// TODO:
//  When adding to blacklist scroll down and open the note for edit.
//  Delete saved notes for users that are not on the blacklist
//  Blacklist note import and export
//  Reddit-like link markup [text](url) ?

// replace trademe's JS error handler
window.onerror=function(msg, url, linenumber){
    // console.log('Error message: '+msg+'\nURL: '+url+'\nLine Number: '+linenumber);
        return true;
            };

function addStyle(style) {
	$("<style>").prop("type", "text/css").html(style).appendTo("head");
}

// TODO make icons configurable?
// trollface.png
var troll_icon = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABYAAAASCAYAAABfJS4tAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAadEVYdFNvZnR3YXJlAFBhaW50Lk5FVCB2My41LjEwMPRyoQAAA6ZJREFUOE+NVGdPm2cURfAFCYl/U5U2HxASXxqSDyjTdWNGiAPUahIUVIwTgRw1UBLTxhbDYWOmQCyxpxhiCrH3EHsKEHtz+p6bkihqQmrp0fv6eZ/n3HvPOffa2V3xy7Il4S9TBKxxZrwKf4Hfg5/i2ZNfZT0P+g1GZS85IRZXYci3/Nx0BPg/gsEQisjISKSnpyMtLQ3l5eWoqKhAVVUV6urqUFNTg/7+fgwMDKCoqAj37939OvjbP/9AXFwcJiYmsLi4iJmZGaytrWF9fR0rKyuYnZ0VoL6+PgHt7OzE/Pw8jo+P0dLSAh/vB18Gt1jMOD09FZDl5WVsbW1JEO5dXFxgaWkJh4eHODs7w+7uLqampiQI909OTmA0GhH95vXn4JGvjVIiLxGwt7cXg4ODEuT8/FyANzY2UFZWhpiYGAQFBSErKwurq6uSMc+Mj4/j+vWfPgHbUt/DbH73kYLR0VEkJydLBlqtFh0dHXKRfBcXFyMnJwcWiwXZ2dnybWRkBMPDw2hoaEBGRga8vTUfwP21D4UjClRdXY3m5mZMT09L9twnx8x4f38fm5ubst/e3i7Z805paancqa2tlSoZOOCxH+x8FdKbmppEqLa2NoyNjYkoFIiKE4gZLywsoLGxUUTkWXLP9/z8fISFhQl9lZWVGBoawg8u38HOpBAeHx8vYBqNRriam5uT0pgRueUegzNLOoZ2y8zMFCvyP+9Tm/r6ehQWFuJn1b/20z7yE6XVajUiIiJgs9k+0kPeeIElk2eWyowZNDw8HHq9XvShiAzo4eGB+Ni/P/DsqxDOiJ6enoiKioLVapXDFInUpKSkiEO6u7sRGBgoriAFdAbdRKq2t7ehUqlgCHn+yRm+Pl7Y29uDm5sbnJycYG9vDwcHB3k6OjrC2dkZOp0OJSUl4hhmR3pyc3OFawLn5eXhF7Xqcx/7PfTB0dGRlJqYmIjU1FTFgmYkJSUJQFdXlzQNhWRbk192HrNkQhT92rUf/9t5Af5a6Z6dnR2xDQNER0cL1wUFBVI2M6Lqra2tEuyytTkGXFy+R0riF4ZRqD5EotOnk5OT4l36lhajpcgv1aeVenp65Ekabt+6pZR//+sDSKcLxMHBgQDRdlwUj4OIi/OAVPCdgO7u7spEuw1r7LurR2bYSz0SEhIka/J4uRiMATgyTSYTXF1d4aVRI1uZ09+cwZcHDPpg3Lt7B/qQEGUeG8RWHCo3b3jAz9cLL0KD/z+YAvoPq0rRAALR3w0AAAAASUVORK5CYII=";
var blacklist_bar_icon = troll_icon;
// note_delete_left.png
var	note_delete_icon = "data:image/gif;base64,R0lGODlhFgAVAPcAAAAAAJmZmZ+fmL6/luPlk+Tmk/Dykvz/kf///wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACH5BAEAAP8ALAAAAAAWABUAAAiAAP8JHEjwgMGDCA0SFJiwYcKCDiMqZChRIsWKEf85NDBAQAABAww41JiQgMcAKD8SwHjAwMmUKAWIrDgAJYKUNwMMwPjyZs6PGGEG+ImSJ86hKQVgrInUJsqdFV0KjTmzYoGXMQs0JJmQo0eQVRFyZbl1LNmDA88+TKt2IsSzAQEAOw==";

// Change the post to a blacklist bar, based on code contributed by "king1" on TM
function blacklistBar(post) {
    var poster = $(".nick", post).text();
    var postid = $(".MessageAuthor > small > span", post).text();
    
    var blacklistCode = $("<div>", {
         "class": "BLBC",
         "click": 
             function(){ $(post).toggleClass("hiddenpost"); }
    }).html(
            '<div class="BLBS">' + postid + '</div>'+
            '<div class="BLBSC">Blacklist' +
                (settings.showPosterName ? ' (' + poster + ')' : '') +
            '</div>'+
            '<div class="BLBS">' +
            (settings.useIconBlacklistBar ? '<img src="' + blacklist_bar_icon + '" height="20">' : '&nbsp') + 
             '</div>');
    $(post).addClass("hiddenpost")
        .before(blacklistCode);
}


// replace all text with random "herp derp"
function herpDerp(post) {
    
    var postBody = $(".MessageBody", post);
    var postText = postBody.text();
    
    // make new text roughly the same length
    // TODO: preserve paragraphs and punctuation
    var herpCount = Math.floor(postText.length / 5);
    var derpText = "";
    for (var i=0; i<herpCount; i++) {
        derpText += (Math.random() > 0.5) ? "herp " : "derp ";
    }
    
    // save the underped version
    postBody[0].oldHtml = postBody.html();
    
    derpText = derpText.charAt(0).toUpperCase() + derpText.substr(1).trim() + ".";
    postBody.text(derpText);
}


var GREY_KILL_POST = ".killedpost {background-color:#eeeeee !important; color: #999999 !important; font-size:12px !important;} \
.killedpost p {font-size:12px !important; color:#999999 !important;}";
var GREY_KILL_THREAD = ".killedthread {background-color:#eeeeee !important; color: #999999 !important; font-size:12px !important;} \
.killedthread .title {font-size:12px !important; color:#999999 !important;}\
.killedthread a {color:#999999 !important; font-weight:normal;}";

var KILL_OPTIONS = {
    
    // Grey: threads and posts remain visible but with a grey background and smaller, faded text 
    'Grey': {
           cssPost: GREY_KILL_POST,
           cssThread: GREY_KILL_THREAD,
           textVisible: true
    },
    
    // Invisible: threads and posts are not shown at all, have to turn the script off to read them 
    'Invisible': {
           cssPost: '.killedpost {display:none}',
           cssThread: '.killedthread {display:none}',
           invisible: true
    },

    // Blacklist bar: a placeholder blacklist bar is shown in place of the message. Click to show or hide the message
    'Blacklist bar': {
           cssPost:
".BLBC {border-top:1px solid #eeeeee; border-bottom:1px solid #eeeeee; background-color:#ffffff; display:block; margin-bottom:5px;} \
.BLB {text-align:center; line-height:20px !important; vertical-align:middle; background-color:#eeeeee; width:100%; font-size:10px !important; font-weight:bold; color:silver; display:inline-block; margin:2px 0;} \
.BLBSC {text-align:center; line-height:20px !important; vertical-align:middle; background-color:#eeeeee; width:70%;font-size:10px !important; font-weight:bold; color:silver; display:inline-block; margin:2px 0;} \
.BLBS {text-align:center; line-height:20px !important; height:20px; vertical-align:middle; background-color:#eeeeee; width:15%; font-size:10px !important; font-weight:bold; color:silver; display:inline-block; margin: 2px 0 ; } \
.hiddenpost { display:none; } \
.killedpost {  border-bottom:1px solid silver; padding-bottom:20px; margin-bottom:10px; background-color:#eeeeee !important; color: #999999 !important; font-size:12px !important;} \
.killedpost p {  color:#999999 !important;}", 
           cssThread: "",
           customKill: blacklistBar
    }
};
var KILL_OPTION_DEFAULT = 'Grey';

var settings;

var BLACKLIST_STORAGE_ITEM = "trademeblacklist";

var USERNAME_STORAGE_ITEM = "trademeusername";

var blackList = Object.create(null); // just in case there's a user called "constructor"

function toggleKillPost(post) {
    if ($(post).hasClass("killedpost")) {
        unkillPost(post);
    } else {
        killPost(post);
    }
}

function killPost(post) {
    if (settings.postKill.customKill) {
        settings.postKill.customKill(post);
    } else {
        $(post).addClass("killedpost");
        
        if (!settings.postKill.invisible) {
            
            var messageBody = $(".MessageBody", post);
            // unbind() for repeated clicks after unkill()
            messageBody.unbind('click').click(function() {toggleKillPost(post);});

            if (settings.useTrollIcon) {
                messageBody.css({"background-image": "url('" + troll_icon + "')",
                                 "background-position": "4px 4px"});
            }
            
            if (settings.postKill.textVisible && settings.useHerpDerp) {
                herpDerp(post);
            }
            
        }
    }
}

function unkillPost(post) {
    if (!settings.postKill.customKill) { // custom kill funcs handle their own unkilling
        // unkill the text
        var messageBody = $(".MessageBody", post);
        var oldHtml = messageBody[0].oldHtml;
        if (oldHtml) {
            $(messageBody).html(oldHtml);
            messageBody[0].oldHtml = null;
        }
        $(post).removeClass("killedpost");
    }
}

function killPosts() {
    $("#MessageBoard .MessagePost").each(function(index, post) {
        var poster = $(".nick", post).text();
        if (blackList[poster]) {
            killPost(post);
        } 
    });
}

function decoratePosts() {
    // Hyperlink 9-digit auction numbers, only on child text nodes.
    addStyle(".tmkflink {text-decoration: underline;}");
    $("#MessageBoard .MessageBody > p").contents().each(function(index, text) {
        if (text.nodeType == 3) { 
            var auctionNoRegex = /\b([1-9]\d{8})\b/g;
            var contents = text.textContent; 
            if (auctionNoRegex.test(contents)) {
                $(text).replaceWith($('<span>' + contents.replace(auctionNoRegex, 
                      '<a href="/Browse/Listing.aspx?id=$1" title="Auction link (Killfile script)" class="tmkflink">$1</a>') + '</span>'));
            }
        }
    });
}

function clearBlacklist() {
    sessionStorage.removeItem(BLACKLIST_STORAGE_ITEM);
}

// Do a function that uses the blacklist, with cached loading of the blacklist
// If the blacklist isn't cached the function will only fire after the blacklist page is loaded
function withBlacklist(blacklistFunc) {
    var cachedBlacklist = sessionStorage.getItem(BLACKLIST_STORAGE_ITEM);
    if (cachedBlacklist && cachedBlacklist != "{}") {

        blackList = JSON.parse(cachedBlacklist);
        // blackList.__proto__ = null; // just in case there's a user called "constructor"
        blacklistFunc();
        
    } else {
        // can't use $.get() due to same-origin policy
        GM_xmlhttpRequest({
  			method: "GET",
  			url: "https://www.trademe.co.nz/MyTradeMe/BlackList.aspx?unique=" + new Date().getTime(),
  			onload:
              function(data) {
                  $("#theList .nick > a", data.responseText).each(function(index, atag) {
                      // href is "/Members/Listings.aspx?member=nnnnnnn
                      var memberId = atag.href.split("member=")[1];
                      if (atag.text!=='__proto__') { // would override the object's prototype
                          blackList[atag.text]=memberId;
                      }
                  });

                  sessionStorage.setItem(BLACKLIST_STORAGE_ITEM, JSON.stringify(blackList));
                  
                  blacklistFunc();
              }});
    }
}

function loadBlacklistAndKillPosts() {
    addStyle(settings.postKill.cssPost);
    withBlacklist(killPosts);
}

function killThreads() {
    $("#ThreadListContainer .byline").each(function(index, byline) {
        var bylineText = $(byline).text();
        // in All Threads mode the board name comes before "Started by xxxxx"
        if (bylineText.indexOf("Started") > 0) {
            bylineText = bylineText.substring(bylineText.indexOf("Started"));
        }
        var userName = bylineText.split(" ")[2];
        if (userName && blackList[userName]) {
            $(byline).parent().parent().addClass("killedthread");
        }
    });
}
                          
function loadBlacklistAndKillThreads() {
    addStyle(settings.threadKill.cssThread);
    withBlacklist(killThreads);
}

// Add link to add or remove user from blacklist
// Have to clear the cached blacklist in localStorage before going to the blacklist page because
// blacklist page is secure so has separate localStorage
function addBlacklistLink(params, content) {
    // after username/feedback count, or store header if user has a store
    var blacklistLinkCode = $("<p>", {
        "style": "margin-top:-5px; margin-bottom:7px"})
        .html(
            $("<a>", {
                "href": "javascript:void(0)",
                "click": function() {
                    clearBlacklist();
                    window.location.href='/MyTradeMe/BlackList.aspx?' + params;
                },
                "id":  "blacklistLink",
                "title": "This link was added by the TradeMe Killfile script", 
                "text": content
            }
            )
        );

    $("#mainContent h3:first,#StoreDetailsHeader_MemberNavigationDiv")
		.after(blacklistLinkCode);
}

function blacklistWithNewNote(userName) {
    var note = new BlacklistNote(userName);
    addNewNoteAndEdit(note, item, "#blacklistLink");
}

function addBlacklistLinkToListingsPage() {
    withBlacklist(function() {
        var userName = $("#MemberLink").text();
        if (blackList[userName]) {
            // use member ID saved by withBlacklist()
            addBlacklistLink("member="+blackList[userName]+"&nick="+userName+"&action=delete", "Remove from Blacklist");
        } else {
            addBlacklistLink("memberToBlacklist="+userName+"&tehSubmit=Add%20to%20Blacklist&action=add", "Add to Blacklist");
        }
    });
}

//----- Notes Start -----------------------------------------------------------------------------------------------
function BlacklistNote(memberName) {
    this.id = "tmkfblNote_" + memberName;
    this.text = null;
	this.load();
}    
BlacklistNote.prototype.load = function() { this.text = GM_getValue(this.id); return this.text; };
BlacklistNote.prototype.save = function() { GM_setValue(this.id, this.text); };
BlacklistNote.prototype.remove = function() { GM_deleteValue(this.id); this.text = null;};
BlacklistNote.prototype.defaultText = function() { return this.text || ' '; };
BlacklistNote.prototype.html = function() {
	// TODO linkify links and auction numbers
	return this.defaultText().replace(/\n/g,"<br/>");
};


function NoteEditor(note, container) {
    this.note = note;
    this.container = container;
}    
NoteEditor.prototype.noteUniqueId = function(suffix) {return this.note.id + suffix;};
NoteEditor.prototype.ctrId = function() {return this.noteUniqueId("_ctr");};
NoteEditor.prototype.textId = function() {return this.noteUniqueId("_text");};
NoteEditor.prototype.deleteId = function() {return this.noteUniqueId("_del");};
NoteEditor.prototype.addId = function() {return this.noteUniqueId("_add");};
NoteEditor.prototype.addIconId = function() {return this.noteUniqueId("_addicon");};
	
// JQuery selector prefix for this note's ID, with "#" added and dots escaped
// Trademe allows dots in user IDs which are valid in HTML IDs, but JQuery treats them as class selectors
// Only valid characters in TradeMe IDs are letters, numbers or the characters '.', '_', or '-' (no spaces)
NoteEditor.prototype.jqFindId = function(id) {
	return $("#" + id.replace(/\./g, "\\.")); 
};

NoteEditor.prototype.removeNoteEditDiv = function() {this.jqFindId(this.ctrId()).remove();};

NoteEditor.prototype.addNoteEditDiv = function(positionSelector) {
    if (this.jqFindId(this.textId()).length > 0) {
        return;
    }
    
    $(positionSelector, this.container).after(
        '<div class="blacklistNote blacklistNotePosition" id="' + this.ctrId() +'">\
<div class="blacklistNoteDelete">\
<a class="blacklistNoteDeleteIcon" id="' + this.deleteId() + '" title="Delete this note"><img src="' + note_delete_icon +'"/></a>\
</div>\
<div class="blacklistNoteText" id="' + this.textId() +'">' + this.note.html() + '</div>\
</div>');
    
    // make it editable using Jeditable
    var _noteEditor = this; // for jQuery context problem
    this.jqFindId(this.textId()).editable(function(value, settings) { 
        // TODO delete note if text is empty?
        _noteEditor.note.text = value;
        _noteEditor.note.save();
        _noteEditor.removeNoteAddIcon(this.note);
        return(_noteEditor.note.html());
    }, { 
        type    : 'textarea',
        submit  : 'OK',
        cancel  : 'Cancel',
        // TODO more rows if text is longer?
        rows : 3,
        width: 410,
        tooltip   : 'Click to edit note',
        // on edit start, use plain text rather than the HTML text in the editable div
        data : function (value, settings) { return _noteEditor.note.defaultText(); },
        // on cancel or blur, remove the note div if the note hasn't been saved
        onreset : function (editable, value) { if (!_noteEditor.note.text) { _noteEditor.removeNoteEditDiv(); return false; } },
        cssclass : 'blacklistNoteEditable'
    });
    
    // delete icon click
    this.jqFindId(this.deleteId()).click( function() { 
        _noteEditor.note.remove();
        _noteEditor.removeNoteEditDiv(); 
        _noteEditor.addNoteAddIcon();
    });
};

	
NoteEditor.prototype.addNoteAddIcon = function() {
	// don't add if it's already there
	if (this.jqFindId(this.addIconId()).length==0) { 
		
		this.jqFindId(this.addId()).append(
			'<a id="' + this.addIconId() + '" title="Add note">\
<img src="/images/my_trademe/ajax/note_left_off_white.gif"></a>');
	
		var _noteEditor = this; // for jQuery context problem
		this.jqFindId(this.addIconId()).click(function() {
			_noteEditor.addNewNoteAndEdit(".delete");
		});
	}
};
	
NoteEditor.prototype.removeNoteAddIcon = function() {
	this.jqFindId(this.addIconId()).remove();
};

	// holder for the "Add note" icon
NoteEditor.prototype.addNoteIconHolder = function(selector, useSpan) {
	var iconHolder = $(useSpan ? "<span>" : "<div>", 
					 {class: "blacklistNoteIcon", id: this.addId()});
	$(selector, this.container).after(iconHolder);
};


NoteEditor.prototype.addNewNoteAndEdit= function(positionSelector) {
	if (!this.note.text) {
		this.addNoteEditDiv(positionSelector);
	}
	// start editing the new editable
	this.jqFindId(this.textId()).trigger("click");
};

function addNoteStyles() {
        addStyle(
            ".blacklistNoteIcon {float:left; margin-right:10px; cursor:pointer;}\
.blacklistNote {clear:both; cursor:pointer; background-color:#FCFF91; width:500px;}\
.blacklistNoteText {float:left; background-color:#FCFF91; max-width:415px; overflow:hidden;  margin-top:2px; padding:3px 10px 5px 5px;\
border-top-right-radius:10px; border-bottom-right-radius:10px; font-size:11px; }\
.blacklistNoteEditable TEXTAREA { background-color:#FCFF91; font-size:11px;}\
.blacklistNoteDelete {float:left;}\
");
}

function addNotesToList(notesSelectors) {
 
    $(notesSelectors.item).each(function(index, item) {
        
        var memberName = $(notesSelectors.member, item).text();

        var note = new BlacklistNote(memberName);
		
		var noteEditor = new NoteEditor(note, item);
        noteEditor.addNoteIconHolder(notesSelectors.iconPosition, notesSelectors.useSpan);
 
        if (note.text) {
            noteEditor.addNoteEditDiv(".delete");
        } else {
            noteEditor.addNoteAddIcon();
        }
    });

}

function addNotesToBlacklist() {
    addNoteStyles();

    addNotesToList({item: "#theList .item, #theList .altItem", 
                    member: ".nick > a", 
                    iconPosition: ".memberRating"});
}

function addNotesToSellers() {
    addNoteStyles();
    
    addStyle(
    ".blacklistNoteIcon {float:none; margin-right:10px; cursor:pointer;}\
.blacklistNotePosition {margin-top:5px; margin-left:-4px;}");
    
    addNotesToList({item: ".tre tr", 
                    member: ".nick", 
                    iconPosition: ".title > span",
                    useSpan: true});
}
    
// ---- Notes end -------------------------------------------------------------------------------------

function withUsername(usernameFunc) {
    var userName = sessionStorage.getItem(USERNAME_STORAGE_ITEM);
    if (!userName || userName=="") {
        GM_xmlhttpRequest({
  			method: "GET",
            url: "https://www.trademe.co.nz/MyTradeMe/Default.aspx",
  			onload: function(data) {
                userName = $('#MemberLink', data.responseText).text();
                sessionStorage.setItem(USERNAME_STORAGE_ITEM, userName);
                usernameFunc(userName);
            }});
    } else {
        usernameFunc(userName);
    }
}    
    
function searchMyMessages() {
    withUsername(function(userName) {
        $("#MbSearchForm").attr("action", $("#MbSearchForm").attr("action") + "?searchMine=1");
        $("#MbSearchTopicSelect").val(-1); // all topics
        $("#SiteHeader_MessageBoardSearch_MbSearchKeywordInput").val(userName);
        // change "Date posted" to "7 days" if it's "24 hours"
        if ($("#SiteHeader_MessageBoardSearch_MbSearchTimeSelect").val()==="10") {
            $("#SiteHeader_MessageBoardSearch_MbSearchTimeSelect").val("20");
        }
        $("#MbSearchForm").submit();
    });
}

function modifySearchBox() {
    $(".reset-link").html($("<a/>", 
        {href:"javascript:void(0)", 
         click: searchMyMessages, 
         text: "Mine", 
         class:"ResetSearchForm", 
         title:"Search all topics for my messages (Killfile script)"}));
    // 	registerMenuCommand('TradeMe Killfile: Settings',openGMConfig);
    $("<a href='javascript:void(0)' id='tmkfsettings' title='Trademe Killfile settings' style='margin-left:10px'>" +
      "<img width='16' height='16' title='' alt='' src='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAD5UlEQVR4nGJkwAGam5u3MTIyejIwMDD8//9/e21trRc2dQAAAAD//2KBMRoaGgoYGRlj////39zQ0LDh////ht7e3gwMDAwMW7ZsMYSqiWVkZCz4////4oaGhgkMDAwMAAAAAP//YoRp5uPj6zc2NmY4f/48w/v373dxcXG5eXp6MjAwMDBs376d4du3b0cEBQVtDA0NGc6ePcvw6dOnwoaGhgkAAAAA//8EwTERwDAIQNGfu84YyMiKhISxLuKpomKDEQ1sXN97ALr7mBkigrsTEe+ck6oCYO9NZi5VZYyBmXHvPcD3AwAA//80zzERwAAMA7G/DoZhsoVnJN5CILlOFQM9fzkJbZkZbCOJ3eXukIRtZoa2JAF4AT4AAAD//zTQMRXAMAgFwB+W4oEJxKSeEICn1guZeGhg7NSTcOs/cPdHRLaqgpmRmaiqIaIlIpeZYWZwzkF3vxFxA8AHAAD//wBBAL7/AXh4eLb9/f0xCAgIGCwsLAAMDAwA4eHhAOTk5L6JiYlLAAAAAHd3d7UcHBxCHx8fAPT09ADU1NQA+Pj46AMDA88AAAD//wTBsQ3AMAgEwI9cYOg8CrNRsAPLMUo6ZAqU3D1m9qkqiAhVBWZGZt6IODNzAWCttd39VdVdVRARdDcyEz8AAAD//zzPwQkAMAgEsFO6hPtv5ssJ5EDUvtpskEMS7g5VhYjAzNDdv/ZUlWQmIgK7i5kBSVwAAAD//wTBsREAIAgAMe4bbWFNFvScBQbADiYwAbiZ+SJCqkq6W1R1ufsBNrDd/ZjZmhmpKokIycwH3A8AAP//gtuUmpq6/9+/fw4iIiIMKioqDM+fP2d48uTJTwYGBgYZGRl2SUlJhjt37jC8efOGgYmJ6eTs2bMtGBgYGAAAAAD//2JkYGBgKCoqCn3z5s0qGRkZhnfv3jFwcXExKCkpMbCzszMwMjLCQ//bt28MQkJCDE+ePGEQERFJ7uvrmwcAAAD//wTBsQ3AMAgAwS/S4QbJk2YBb5L1EELUxoVF7h4Ad19zTjKTvTcRgZkxxuDeyzmHqkJE6G5UFXd/ge8HAAD//wTBsQnAQAwEwcVcAeo//1YcOr8OhEB8JlDmmQcgIo5tMpOqQtJ372Vm2F26G0lvVZGZ2CYiDsAPAAD//wTBMRHAMAwDQJ2YaDCC7gVSAgURAEFgEGYUGPamMf8EgMzckhbJExF/VT22Z2bQ3bA9VfVGxEfySFqZuQHgAgAA//+CBSIzIyMjBxMTkwAjIyMvExOTgJ2d3awPHz7oQl145dChQxn/////9u/fv4//////8P///2//////CQAAAP//AwAvroSUkykoBQAAAABJRU5ErkJggg==' />"
      +"</a>")
    	.appendTo(".reset-link");
    $("#tmkfsettings").click(openGMConfig);
}

// convert dates in format used in Trademe search results to a JS date
// "n min(s) ago", "n hour(s) ago", or "textday nday textmonth" 
function trademeDateToJSDate(trademeDate) {
    var jsDate;

    if (trademeDate.indexOf("min") > 0) {
        jsDate = new Date($.now() - ((trademeDate.split(" ")[0]) * 60000));
    } else if (trademeDate.indexOf("hour") > 0) {
        jsDate = new Date($.now() - ((trademeDate.split(" ")[0]) * 3600000));
    } else {
        var datePrefix = trademeDate.substr(trademeDate.indexOf(" ")+1);
        var thisYear = (new Date()).getFullYear();
        jsDate = new Date(datePrefix + " " + thisYear);
        if (jsDate > $.now()) { // thread date is from previous year
            thisYear--;
            jsDate = new Date(datePrefix + " " + thisYear);
        }
    }
    return jsDate;
}

function sortSearchResults() {
	// only sort if page was loaded from the "Mine" link
    // note this is limited to the 50 results shown on the first page of search results, 
    // which are sorted by relevance so may not include all the latest threads if user posts a lot
    if (window.location.href.indexOf("searchMine") != -1) {
        var results = $("#MbThreadList tr[id*='SearchResultsRepeater']");
        results.detach();
        results.sort(function(a,b) {
            var lastMessageA = $(".lastMessage",a).text();
            var lastMessageB = $(".lastMessage",b).text();
            return trademeDateToJSDate(lastMessageB) - trademeDateToJSDate(lastMessageA);
        });
        results.removeClass("lastrow");
        if (results.length > 0) {
            $(results[results.length-1]).addClass("lastrow");
        }
        results.appendTo($("#MbThreadList"));
    }
}

function initSettings() {
    // TODO not working except .config_var, CSS is generated in iframe but ignored, iframe issue?
    var configCSS = 
        '\n' + " #GM_config_wrapper {margin-left: auto !important; margin-right: auto !important; width:30em !important} " + '\n' +
        "#GM_config_buttons_holder  {margin-left: 25% !important; margin-right: 25% !important; } " + '\n' + 
        "#GM_config .config_var {margin-top: 1em; margin-bottom: 1em; margin-left:10%; margin-right:10%}"; 
    
    settings = {
        postKill: KILL_OPTIONS[KILL_OPTION_DEFAULT],
        useHerpDerp: false,
        useTrollIcon: false,
        showPosterName: false,
        useIconBlacklistBar: true,
        threadKill: KILL_OPTIONS[KILL_OPTION_DEFAULT]
    };

    // hack alert: don't include Blacklist bar in thread settings as it isn't implemented
    var threadOptions = Object.keys(KILL_OPTIONS);
    threadOptions.pop();
        
    GM_config.init('TradeMe Killfile Settings',
    {
        'postKill': {
            'section': ['Killed message settings'],
            'label': '',
                'type': 'radio', 
                'options': Object.keys(KILL_OPTIONS),
                'default': KILL_OPTION_DEFAULT
         },
        
        'useHerpDerp': {
            'label': 'Change text to "herp derp"',
            'type': 'checkbox',
            'default': false
        },
        
        'useTrollIcon': {
            'label': 'Change post icon to trollface',
            'type': 'checkbox',
            'default': false
        },

            
        'showPosterName': {
            'label': 'Show poster name in blacklist bar',
            'type': 'checkbox',
            'default': false
        },
        
        'useIconBlacklistBar': {
            'label': 'Show icon in blacklist bar',
            'type': 'checkbox',
            'default': true
        },
        
        'threadKill': {
            'section': ['Killed thread settings'],
            'label': '',
                'type': 'radio', 
                'options': threadOptions,
                'default': KILL_OPTION_DEFAULT
        },
    }, configCSS);
    
    // for..in doesn't officially work in GreaseMonkey
    var settingKeys = Object.keys(settings);
    for (var i=0; i<settingKeys.length; i++) {
        settings[settingKeys[i]] = GM_config.get(settingKeys[i]);
    }
    
    // convert kill option name to option
    settings.postKill = KILL_OPTIONS[settings.postKill];
    if (!settings.postKill) {
        // happens when the saved config option is not one of the available options any more, should fix this in GM_config really
        settings.postKill = KILL_OPTIONS[KILL_OPTION_DEFAULT];
    }
    settings.threadKill = KILL_OPTIONS[settings.threadKill];
    if (!settings.threadKill) {
        settings.threadKill = KILL_OPTIONS[KILL_OPTION_DEFAULT];
    }
    
}

function openGMConfig() {
    
    // Code included from GM_config Extender http://userscripts.org/scripts/review/50018
    GM_config.resizeFrame = function(wid,hei) {
        this.frame.style.width = wid;
        this.frame.style.height = hei;
    };
    // end of GM_config Extender code 
        
    GM_config.onSave = function() {GM_config.close(); window.location.reload();}; // so the "Save" button also closes the dialog and reloads the page
    
    GM_config.open();
    GM_config.resizeFrame('40em', '40em');
    
    // TODO Tampermonkey leaves the settings menu open on top of this frame, why?
}

// Unfortunately TM's move of the blacklist page to https marooned the notes that were in http localStorage
// Move them to GM storage which is global for the script
function migrateNotes() {
    if (!localStorage.getItem("tmkfMigr")) {
        for (var noteKey in localStorage) {
            if (noteKey.indexOf("tmkfbl")==0) {
                GM_setValue(noteKey, localStorage.getItem(noteKey));
            }
        }
        // don't do this again
        localStorage.setItem("tmkfMigr","Y");
    }
}
// ---------------------------------------------------------------------------------------
function scriptMain() {

    initSettings();
    
    var trademePage = window.location.toString().toLowerCase();
    
    // auto-migrate on first http page visited
    if (trademePage.indexOf("https") != 0) {
        migrateNotes();
    }
    // migrate pre v3.0.1 blacklist
    if (trademePage.indexOf("blacklist")>0) {
        // clear the cached blacklist when the blacklist update page is visited
        clearBlacklist();
        addNotesToBlacklist();
    }
    else if (trademePage.indexOf("favourites")>0) {
        addNotesToSellers();
    }
    else if (trademePage.indexOf("messages")>0) {
        loadBlacklistAndKillPosts();
        decoratePosts();
        modifySearchBox();
    }
    else if (trademePage.indexOf("listings") > 0) {
        addBlacklistLinkToListingsPage();
    }
    else if (trademePage.indexOf("threads") > 0) {
        loadBlacklistAndKillThreads();
        modifySearchBox();    
    }
    else if (trademePage.indexOf("default") > 0) {
        modifySearchBox();    
    }
    else if (trademePage.indexOf("searchresults") > 0) {
        modifySearchBox();    
        sortSearchResults();
    }
    else if (trademePage.indexOf("logout") > 0) {
        clearBlacklist();
        sessionStorage.removeItem(USERNAME_STORAGE_ITEM);
    }
}
scriptMain();