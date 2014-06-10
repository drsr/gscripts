// ==UserScript==
// @name       TradeMe Tweaks
// @namespace  http://drsr/
// @version    0.8.1
// @description  Tweak TradeMe page elements, including the main menu, header, footer, and sidebar, and maps
// @include    http://www.trademe.co.nz/*
//    exclude iframe on stuff.co.nz pages
// @exclude    http://www.trademe.co.nz/iframe/*
// @copyright  public domain
// @run-at   document-end
// @grant GM_addStyle
// @grant GM_getValue
// @grant GM_log
// @grant GM_registerMenuCommand
// @grant GM_setValue
// @grant unsafeWindow
// ==/UserScript==
// v0.8: Click on either of the "Watching" buttons on a listing to remove it from the watchlist
// v0.7: Option to hide other ads on sidebar (although AdBlock does this anyway), fix box width for quick links
// v0.6: Wait for map to load before tweaking it
// v0.5: Add "Full map" and "Zoodle" links to map info window on Real Estate pages, hide Travelbug on homepage
// v0.4: Click the "Saved" button on a listing to remove it from the watchlist
// v0.3: Change order of extra items on "My Trade Me" dropdown to match sidebar
// v0.2: Add "Tweak My Trade Me dropdown menu items", adds "Blacklist" and "My Photos" to menu
var myJQ = unsafeWindow.jQuery;
var settings = {};
function removeDropdowns() {
    // Remove dropdowns from top menu, just go straight to the pages
    myJQ(".modal-open:not([class*='search-options'])").unbind("click");
    // deleting the dropdown arrow span makes the buttons symmetrical but looks more jumpy: myJQ(".modal-open span").remove();
    myJQ(".modal-open:not([class*='search-options']) span").css("background-image", "none"); // dropdown arrow
    
    // Same for "My Trademe"
    myJQ("#SiteHeader_SiteTabs_myTradeMeDropDownLink").unbind("click");
    // myJQ(".mytrademe span").remove(); // dropdown arrow
    myJQ(".mytrademe span").css("background-image", "none"); // dropdown arrow
}
function removeSidebarFeatures() {
    // remove unwanted sidebar features
    if (settings.hideSidebarOtherAds) {
        myJQ("#lifeDirectForm_lifeDirectDiv").hide();
        myJQ("#HomepageAdSpace").hide();
    }
    if (settings.hideSidebarFindSomeone) {
        myJQ(".sidebar-feature:not([id])").hide(); // "find someone"
    }
    if (settings.hideSidebarTreatme) {       
        myJQ("#treatMe_dailyDealsDiv").hide();
    }
    if (settings.hideSidebarTravelbug) {
        myJQ("#travelbugDeals_dailyDealsDiv").hide();
    }
}
function addQuickLinksToSidebar() {
    if (myJQ("#sidebar_tmtw_QuickLinks").length > 0 || !settings.addQuicklinksToSidebar) {
        return;
    }
    
    // TODO tweak layout, border?
    GM_addStyle("\
.tmtw_ql h3 {\
font: bold 16px Arial,Helvetica,Sans-serif;\
color: #c60;\
padding: 3px 10px 0;\
}\
.tmtw_ql a {\
padding-left:2em;\
}");
    
    myJQ('.sidebar').prepend('\
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
    return (myJQ(".sidebar").length > 0);
}
function removeTopBar() {
    /* Hide the top nav bar, which is stretched out when Adblock is operational and when zoom is less than 100% */
    myJQ(".sat-nav").hide();
}
// --------------------------------------------------------------------------------------------
function unsaveButton(evt) {
    // Unsaved:
    //   class="SaveToWatchlistButton spriteButton button30"
    // Saved:
    //   class="SaveToWatchlistButton Saved spriteButton"
    var ret = false;
    var saveButton = myJQ("#SaveToWatchlist_SaveToWatchlistButton");
    var topSaveButton = myJQ("#ListingTitle_watchlistLink");
    if (saveButton.hasClass("Saved")) {
        myJQ.ajax({
            type: 'POST',
            url: '/MyTradeMe/WatchlistDelete.aspx',
            data: {
                "refurl": window.location.href,
                "type": "watchlist",
                "postback": "0",
                "ref": "watchlist",
                "auction_id": "0", /* actual IDs are in auction_list */
                "offer_id": "",
                "auction_list": unsafeWindow.listingId, /* Listing ID global from page */
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
                myJQ("#SaveToWatchlist_EmailReminder, #SaveToWatchlist_TextReminder").hide();
                // page global generated by TradeMe and used by TM click event
                unsafeWindow.isSaved = false;
            }
        });
    } else {
        // call original TM click function (cheat by calling the bottom one even if the top one was clicked)
        ret = unsafeWindow.BottomListingWatchlistButtonClick(evt);
        // Make sure we still have the click captured and re-enable the top button
        tweakSavedButtonClicks();
        
    }
    evt.preventDefault();
    return ret;
}
function tweakSavedButtonClicks() {
    var saveButtons = myJQ("#SaveToWatchlist_SaveToWatchlistButton, #ListingTitle_watchlistLink");
    saveButtons.removeClass("btn-disabled");
    // replace click event, will chain to the original if it's not currently saved
    saveButtons.unbind().click(unsaveButton);
}

function tweakSavedButton() {
    GM_addStyle(".SaveToWatchlistButton.Saved{cursor:pointer !important}");
    tweakSavedButtonClicks();
}
// --------------------------------------------------------------------------------------------
function removeFooter() {
    /* Hide the grey site footer, which unnecessarily appears on every page and is way too big */
    myJQ(".site-footer").hide();
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
    myJQ("#SiteHeader_SiteTabs_myTradeMeDropDownLink").click(function() {
        myJQ("#mtm-selling ul:eq(1) li:eq(1)").replaceWith('<li><a href="/MyTradeMe/MyPhotos.aspx">My Photos</a></li>');
        myJQ("#mtm-selling ul:eq(1) li:eq(1)").append('<li><a href="/MyTradeMe/BlackList.aspx">Blacklist</a></li>');        
    });
}

// Add "Open in Google Maps" to map's InfoWindow on Real Estate pages
// The "Powered by Google" link opens the right area, but doesn't display a marker at the property location
// Also adds a link for Zoodle, to easily get school zones
function tweakMap() {
    // mapState is a global in TM real estate pages
    var mapState = unsafeWindow.mapState;
	if (mapState && mapState.lat && mapState.lng) {
        var zoomIn = myJQ('a:contains("Zoom in")');
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
        myJQ(unsafeWindow.document).unbind("ready");
        removeDropdowns();
    } else {
        if (settings.tweakMyTrademeDropdown) {
            tweakMyTrademeDropdown();
        }
    }
    tweakSavedButton();

    tweakMap();
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
// ---------------------------------------------------------------------------------------
/*
Slightly modified version by drsr of :

GM_config.js from http://github.com/sizzlemctwizzle/GM_config/raw/master/gm_config.js
Copyright 2009-2010, GM_config Contributors
All rights reserved.

GM_config Contributors:
    Mike Medley <medleymind@gmail.com>
    Joe Simmons
    Izzy Soft
    Marti Martz

GM_config is distributed under the terms of the GNU Lesser General Public License.

    GM_config is free software: you can redistribute it and/or modify
    it under the terms of the GNU Lesser General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Lesser General Public License for more details.

    You should have received a copy of the GNU Lesser General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

function GM_configStruct(){if(arguments.length)
GM_configInit(this,arguments);}
function GM_configInit(config,args){if(typeof config.fields=="undefined"){config.fields={};config.onInit=function(){};config.onOpen=function(){};config.onSave=function(){};config.onClose=function(){};config.onReset=function(){};config.isOpen=false;config.title='User Script Settings';config.css={basic:"#GM_config * { font-family: arial,tahoma,myriad pro,sans-serif; }\
             #GM_config { background: #FFF; }\
             #GM_config input[type='radio'] { margin-right: 8px; }\
             #GM_config .indent40 { margin-left: 40%; }\
             #GM_config .field_label { font-weight: bold; font-size: 12px; margin-right: 6px; }\
             #GM_config .block { display: block; }\
             #GM_config .saveclose_buttons { margin: 16px 10px 10px; padding: 2px 12px; }\
             #GM_config .reset, #GM_config .reset a,\
             #GM_config_buttons_holder { text-align: right; color: #000; }\
             #GM_config .config_header { font-size: 20pt; margin: 0; }\
             #GM_config .config_desc, #GM_config .section_desc, #GM_config .reset { font-size: 9pt; }\
             #GM_config .center { text-align: center; }\
             #GM_config .section_header_holder { margin-top: 8px; }\
             #GM_config .config_var { margin: 0 0 4px; }\
             #GM_config .section_header { font-size: 13pt; background: #414141; color: #FFF;\
              border: 1px solid #000; margin: 0; }\
             #GM_config .section_desc { font-size: 9pt; background: #EFEFEF; color: #575757;\
             border: 1px solid #CCC; margin: 0 0 6px; }",stylish:""};}
if(typeof config.id=="undefined")
config.id='GM_config';var settings=null;if(config.id!='GM_config')
config.css.basic=config.css.basic.replace(/#GM_config/gm,'#'+config.id);var oldInitCb=config.onInit;for(var i=0,l=args.length,arg;i<l;++i){arg=args[i];if(typeof arg.appendChild=="function"){config.frame=arg;continue;}
switch(typeof arg){case'object':for(var j in arg){if(typeof arg[j]!="function"){settings=arg;break;}
config["on"+j.charAt(0).toUpperCase()+j.slice(1)]=arg[j];}
break;case'function':config.onOpen=arg;break;case'string':if(arg.indexOf('{')!=-1&&arg.indexOf('}')!=-1)
config.css.stylish=arg;else
config.title=arg;break;}}
if(settings){var stored=config.read();for(var id in settings)
config.fields[id]=new GM_configField(settings[id],stored[id],id);}
if(config.onInit===oldInitCb)
config.onInit=function(){};oldInitCb();}
GM_configStruct.prototype={init:function(){GM_configInit(this,arguments);},open:function(){var match=document.getElementById(this.id);if(match&&(match.tagName=="IFRAME"||match.childNodes.length>0))return;var config=this;function buildConfigWin(body,head){var create=config.create,fields=config.fields,configId=config.id,bodyWrapper=create('div',{id:configId+'_wrapper'});head.appendChild(create('style',{type:'text/css',textContent:config.css.basic+config.css.stylish}));bodyWrapper.appendChild(create('div',{id:configId+'_header',className:'config_header block center',innerHTML:config.title}));var section=bodyWrapper,secNum=0;for(var id in fields){var field=fields[id].settings;if(field.section){section=bodyWrapper.appendChild(create('div',{className:'section_header_holder',id:configId+'_section_'+secNum}));if(typeof field.section[0]=="string")
section.appendChild(create('div',{className:'section_header center',id:configId+'_section_header_'+secNum,innerHTML:field.section[0]}));if(typeof field.section[1]=="string")
section.appendChild(create('p',{className:'section_desc center',id:configId+'_section_desc_'+secNum,innerHTML:field.section[1]}));++secNum;}
section.appendChild(fields[id].toNode(configId));}
bodyWrapper.appendChild(create('div',{id:configId+'_buttons_holder'},create('button',{id:configId+'_saveBtn',textContent:'Save',title:'Save settings',className:'saveclose_buttons',onclick:function(){config.save()}}),create('button',{id:configId+'_closeBtn',textContent:'Cancel',title:'Cancel changes and close settings',className:'saveclose_buttons',onclick:function(){config.close()}}),create('div',{className:'reset_holder block'},create('a',{id:configId+'_resetLink',textContent:'Reset to defaults',href:'#',title:'Reset fields to default values',className:'reset',onclick:function(e){e.preventDefault();config.reset()}}))));body.appendChild(bodyWrapper);config.center();window.addEventListener('resize',config.center,false);config.onOpen(config.frame.contentDocument||config.frame.ownerDocument,config.frame.contentWindow||window,config.frame);window.addEventListener('beforeunload',function(){config.close();},false);config.frame.style.display="block";config.isOpen=true;}
var defaultStyle='position:fixed; top:0; left:0; opacity:0; display:none; z-index:999;'+'width:75%; height:75%; max-height:95%; max-width:95%;'+'border:1px solid #000000; overflow:auto; bottom: auto;'+'right: auto; margin: 0; padding: 0;';if(this.frame){this.frame.id=this.id;this.frame.setAttribute('style',defaultStyle);buildConfigWin(this.frame,this.frame.ownerDocument.getElementsByTagName('head')[0]);}else{document.body.appendChild((this.frame=this.create('iframe',{id:this.id,style:defaultStyle})));this.frame.src='about:blank';this.frame.addEventListener('load',function(e){var frame=config.frame;var body=frame.contentDocument.getElementsByTagName('body')[0];body.id=config.id;buildConfigWin(body,frame.contentDocument.getElementsByTagName('head')[0]);},false);}},save:function(){var fields=this.fields;for(id in fields)
if(fields[id].toValue()===null)
return;this.write();this.onSave();},close:function(){if(this.frame.contentDocument){this.remove(this.frame);this.frame=null;}else{this.frame.innerHTML="";this.frame.style.display="none";}
var fields=this.fields;for(var id in fields)
fields[id].node=null;this.onClose();this.isOpen=false;},set:function(name,val){this.fields[name].value=val;},get:function(name){return this.fields[name].value;},write:function(store,obj){if(!obj){var values={},fields=this.fields;for(var id in fields){var field=fields[id];if(field.settings.type!="button")
values[id]=field.value;}}
try{this.setValue(store||this.id,this.stringify(obj||values));}catch(e){this.log("GM_config failed to save settings!");}},read:function(store){try{var rval=this.parser(this.getValue(store||this.id,'{}'));}catch(e){this.log("GM_config failed to read saved settings!");var rval={};}
return rval;},reset:function(){var fields=this.fields,doc=this.frame.contentDocument||this.frame.ownerDocument,type;for(id in fields){var node=fields[id].node,field=fields[id].settings,noDefault=typeof field['default']=="undefined",type=field.type;switch(type){case'checkbox':node.checked=noDefault?GM_configDefaultValue(type):field['default'];break;case'select':if(field['default']){for(var i=0,len=node.options.length;i<len;++i)
if(node.options[i].value==field['default'])
node.selectedIndex=i;}else
node.selectedIndex=0;break;case'radio':var radios=node.getElementsByTagName('input');for(var i=0,len=radios.length;i<len;++i)
if(radios[i].value==field['default'])
radios[i].checked=true;break;case'button':break;default:node.value=noDefault?GM_configDefaultValue(type):field['default'];break;}}
this.onReset();},create:function(){switch(arguments.length){case 1:var A=document.createTextNode(arguments[0]);break;default:var A=document.createElement(arguments[0]),B=arguments[1];for(var b in B){if(b.indexOf("on")==0)
A.addEventListener(b.substring(2),B[b],false);else if(",style,accesskey,id,name,src,href,which,for".indexOf(","+
b.toLowerCase())!=-1)
A.setAttribute(b,B[b]);else
A[b]=B[b];}
for(var i=2,len=arguments.length;i<len;++i)
A.appendChild(arguments[i]);}
return A;},center:function(){var node=this.frame,style=node.style,beforeOpacity=style.opacity;if(style.display=='none')style.opacity='0';style.display='';style.top=Math.floor((window.innerHeight/2)-(node.offsetHeight/2))+'px';style.left=Math.floor((window.innerWidth/2)-(node.offsetWidth/2))+'px';style.opacity='1';},remove:function(el){if(el&&el.parentNode)el.parentNode.removeChild(el);}};(function(){var isGM=typeof GM_getValue!='undefined'&&typeof GM_getValue('a','b')!='undefined',setValue,getValue,stringify,parser;if(!isGM){setValue=function(name,value){return localStorage.setItem(name,value);};getValue=function(name,def){var s=localStorage.getItem(name);return s==null?def:s};stringify=JSON.stringify;parser=JSON.parse;}else{setValue=GM_setValue;getValue=GM_getValue;stringify=typeof JSON=="undefined"?function(obj){return obj.toSource();}:JSON.stringify;parser=typeof JSON=="undefined"?function(jsonData){return(new Function('return '+jsonData+';'))();}:JSON.parse;}
GM_configStruct.prototype.isGM=isGM;GM_configStruct.prototype.setValue=setValue;GM_configStruct.prototype.getValue=getValue;GM_configStruct.prototype.stringify=stringify;GM_configStruct.prototype.parser=parser;GM_configStruct.prototype.log=isGM?GM_log:(window.opera?opera.postError:console.log);})();function GM_configDefaultValue(type){var value;if(type.indexOf('unsigned ')==0)
type=type.substring(9);switch(type){case'radio':case'select':value=settings.options[0];break;case'checkbox':value=false;break;case'int':case'integer':case'float':case'number':value=0;break;default:value='';}
return value;}
function GM_configField(settings,stored,id){this.settings=settings;this.id=id;var value=typeof stored=="undefined"?typeof settings['default']=="undefined"?GM_configDefaultValue(settings.type):settings['default']:stored;this.value=value;}
GM_configField.prototype={create:GM_configStruct.prototype.create,node:null,toNode:function(configId){var field=this.settings,value=this.value,options=field.options,id=this.id,create=this.create;var retNode=create('div',{className:'config_var',id:configId+'_'+this.id+'_var',title:field.title||''}),firstProp;for(var i in field){firstProp=i;break;}
var label=create('label',{innerHTML:field.label,id:configId+'_'+this.id+'_field_label',for:configId+'_field_'+this.id,className:'field_label'});switch(field.type){case'textarea':retNode.appendChild((this.node=create('textarea',{id:configId+'_field_'+this.id,innerHTML:value,cols:(field.cols?field.cols:20),rows:(field.rows?field.rows:2)})));break;case'radio':var wrap=create('div',{id:configId+'_field_'+id});this.node=wrap;for(var i=0,len=options.length;i<len;++i){var radLabel=wrap.appendChild(create('span',{innerHTML:options[i]}));var rad=wrap.appendChild(create('input',{value:options[i],type:'radio',name:id,checked:options[i]==value?true:false}));if(firstProp=="options")
wrap.insertBefore(radLabel,rad);else
wrap.appendChild(radLabel);}
retNode.appendChild(wrap);break;case'select':var wrap=create('select',{id:configId+'_field_'+id});this.node=wrap;for(var i in options)
wrap.appendChild(create('option',{innerHTML:options[i],value:i,selected:options[i]==value?true:false}));retNode.appendChild(wrap);break;case'checkbox':retNode.appendChild((this.node=create('input',{id:configId+'_field_'+id,type:'checkbox',value:value,checked:value})));break;case'button':var btn=create('input',{id:configId+'_field_'+id,type:'button',value:field.label,size:(field.size?field.size:25),title:field.title||''});this.node=btn;if(field.script)
btn.addEventListener('click',function(){var scr=field.script;typeof scr=='function'?setTimeout(scr,0):eval(scr);},false);retNode.appendChild(btn);break;case'hidden':retNode.appendChild((this.node=create('input',{id:configId+'_field_'+id,type:'hidden',value:value})));break;default:retNode.appendChild((this.node=create('input',{id:configId+'_field_'+id,type:'text',value:value,size:(field.size?field.size:25)})));}
if(field.type!="hidden"&&field.type!="button"&&typeof field.label=="string"){if(firstProp=="label")
retNode.insertBefore(label,retNode.firstChild);else
retNode.appendChild(label);}
return retNode;},toValue:function(){var node=this.node,field=this.settings,type=field.type,unsigned=false,rval;if(type.indexOf('unsigned ')==0){type=type.substring(9);unsigned=true;}
switch(type){case'checkbox':this.value=node.checked;break;case'select':this.value=node[node.selectedIndex].value;break;case'radio':var radios=node.getElementsByTagName('input');for(var i=0,len=radios.length;i<len;++i)
if(radios[i].checked)
this.value=radios[i].value;break;case'button':break;case'int':case'integer':var num=Number(node.value);var warn='Field labeled "'+field.label+'" expects a'+
(unsigned?' positive ':'n ')+'integer value';if(isNaN(num)||Math.ceil(num)!=Math.floor(num)||(unsigned&&num<0)){alert(warn+'.');return null;}
if(!this._checkNumberRange(num,warn))
return null;this.value=num;break;case'float':case'number':var num=Number(node.value);var warn='Field labeled "'+field.label+'" expects a '+
(unsigned?'positive ':'')+'number value';if(isNaN(num)||(unsigned&&num<0)){alert(warn+'.');return null;}
if(!this._checkNumberRange(num,warn))
return null;this.value=num;break;default:this.value=node.value;break;}
return this.value;},_checkNumberRange:function(num,warn){var field=this.settings;if(typeof field.min=="number"&&num<field.min){alert(warn+' greater than or equal to '+field.min+'.');return null;}
if(typeof field.max=="number"&&num>field.max){alert(warn+' less than or equal to '+field.max+'.');return null;}
return true;}};var GM_config=new GM_configStruct();
//------------- includes end
initSettings();
GM_registerMenuCommand('TradeMe Tweaks: Settings',openGMConfig);
tweakBeforeLoad();
myJQ(unsafeWindow).load(tweakAfterLoad);
