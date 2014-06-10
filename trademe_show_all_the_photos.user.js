// ==UserScript==
// @name       TradeMe Show All The Photos
// @namespace  http://drsr/
// @version    0.6.2
// @description  Show all the large photos on a listing
// @include    /http:\/\/www\.trademe\.co\.nz\/.*\/[Ll]isting.*/
// @include    /http:\/\/www\.trademe\.co\.nz\/.*\/auction-.*/
// @include    /http:\/\/www\.trademe\.co\.nz\/a\.aspx.*/
// @grant      GM_addStyle
// @grant      GM_getResourceURL
// @copyright  public domain
// @require    http://ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery.min.js
// @require    http://cdnjs.cloudflare.com/ajax/libs/jquery.lazyload/1.9.1/jquery.lazyload.min.js
// @resource   grey_pixel http://drsr.site90.com/img/grey.gif
// ==/UserScript==

// v0.6: fix for new large image URLs, don't show link when there's only one photo
// v0.5: when browser window is resized or maximized, recentre and adjust number of columns
// v0.4: tweak layout, Greasemonkey 1.0
// v0.3: minor tidyup
// v0.2: compact and recenter image grid when images are smaller than max size

// TODO:
// lazy load order is strange, image#1 gets loaded last?
// dynamic resize?

// replace trademe's JS error handler
window.onerror=function(msg, url, linenumber){
    console.log('Error message: '+msg+'\nURL: '+url+'\nLine Number: '+linenumber);
    return true;
};

// make sure the JQuery is the one loaded by the @require
var myJQ = jQuery.noConflict();
var initialised = false;
var initialHeight = 0;
var saveTop = 0;
var resizeTimer = null;

function init() {
    if (initialised) {
        return;
    }
    initialHeight = myJQ(document).height();
    
    GM_addStyle("\
.tmsatp_hide {\
   position: absolute;\
   top: -9999px;\
   left: -9999px;\
   background-color: #000000;\
}\
.tmsatp_closebutton {\
border-radius: 12px 12px 12px 12px;\
box-shadow: none;\
font: 20px sans-serif;\
padding: 0 20px 4px;\
position: absolute;\
right: -10px;\
top: -6px;\
color: white;\
background-color: #7A0000;\
cursor: pointer;\
display: inline-block;\
text-align: center;\
text-decoration: none;\
}\
.tmsatp_closebutton:hover {\
  background-color: #9A0000;\
}\
.tmsatp_imgcell {\
	text-align:center;\
	vertical-align:middle;\
	padding: 0;\
    border: 4px solid black;\
}\
.tmsatp_largerCell {\
width:800px;\
min-width:800px;\
height:600px;\
min-height:600px;\
}\
.tmsatp_smallerCell {\
width:669px;\
min-width:669px;\
height:502px;\
min-height:502px;\
}\
.tmsatp_table {\
	border-width: 0;\
	border-spacing: 0;\
    border-collapse: collapse;\
}\
.tmsatp_lazy {\
	margin:0;\
	padding:0;\
}\
#tmsatp_spacer {\
    height: 20px;\
    clear: both;\
    background: #494949\
");
    
    myJQ("#showallthephotos").after(
        '<div id="allthephotosctr" class="tmsatp_hide">\
	<span class="tmsatp_closebutton" title="Close">x</span>\
	<div id="allthephotos"/>\
    </div>');
    myJQ("#allthephotosctr")
        .append('<div id="tmsatp_spacer"/>');
    initialised = true;
}            

var IMAGE_WIDTH_PADDING = 4;
var IMAGE_HEIGHT_PADDING = 4;
var SCROLLER_TOP_MARGIN = 20;
var SCROLLER_LEFT_MARGIN = 20;

// max image dimensions for the current category, images may be (much) smaller
function imageDimensions() {
    if (unsafeWindow.isProperty) { // flag in real estate pages
        return {width:800, height:600, cellClass:"tmsatp_largerCell"};
    } else {
        return {width:669, height:502, cellClass:"tmsatp_smallerCell"};
    }
}

// calculate URL for large image from thumbnail <img>
function imageLargeUrl(img) {
    var retUrl;
    // thumbnail link has class "lbt_nnnnn"
    var imageId = myJQ(img).parent().attr("class").substring(4);

    // Unbelievably this is what TM does in their own script, comparing the current image ID to the ID where they started storing the images in a new path.
    var isNewImage = (unsafeWindow.photoStartIdNewDir ? unsafeWindow.photoStartIdNewDir > imageId : false);
    if (isNewImage) {
        retUrl = img.src.replace("/thumb", "").replace(".jpg", "_full.jpg");
    } else {
        retUrl = img.src.replace("/thumb", "/full");
    }
    return retUrl;
}

function genImages() {
    // Get all the lightbox thumbs
    var allImages = myJQ(".lbThumb img");
	var imageCount = allImages.length;
    
    var dimensions = imageDimensions();
    var padded = {width: dimensions.width + IMAGE_WIDTH_PADDING, height: dimensions.height + IMAGE_HEIGHT_PADDING};
    
	var jqWindow = myJQ(window);
	var columns = ((jqWindow.width() > (padded.width*2 + SCROLLER_LEFT_MARGIN)) && imageCount > 2) ? 2 : 1;

    var grey_pixel = GM_getResourceURL("grey_pixel");
	// use a table for easy centering
	var imgTable = myJQ('<table class="tmsatp_table"/>');
	var i = 0;
	while (i<allImages.length) {
		var row = myJQ("<tr/>");
		for (var col=0; col < columns; col++) {
			if (i >= allImages.length) break;
			var bigImage = imageLargeUrl(allImages[i]);
            
            var td;
            // if last image is odd-numbered, span both columns in the last row
            if (columns === 2 && i===(allImages.length-1) && (i%2===0)) {
                td = myJQ('<td/>', {class: "tmsatp_imgcell", colspan:"2"});
            } else {
                td = myJQ('<td/>', {class: "tmsatp_imgcell " + dimensions.cellClass});
            }
			td.append(myJQ("<img />", 
				  {class: "tmsatp_lazy",
				   src: grey_pixel,
				   // fixed size because we don't know image dimensions yet, see lazyLoadDone
				   width: dimensions.width,
				   height: dimensions.height,
				   "data-original": bigImage,
				   title: "Photo " + (i+1) + " of " + imageCount
				}));
			row.append(td);
			i++;
		}
		row.appendTo(imgTable);
	}
	myJQ("#allthephotos").empty().append(imgTable);
}

function lazyLoadDone(elements_left, settings) {
	// use real image size once the real image is loaded
	myJQ(this).removeAttr("width").removeAttr("height").removeAttr("style");
    
    // remove the min-width and height from the cell so the cell will fit the image
    myJQ(this).parent().removeClass(imageDimensions().cellClass);
    
    // changing image sizes may have de-centered the table, recentre it after re-layout
    if (elements_left ===0) {
        window.setTimeout(recentre, 200);
    }
}

function addSpacer() {
    // Show the spacer at the bottom if the scroller height is greater than the document height,
    // so the last photo isn't stuck on the bottom of the window.
    var scrollerHeight = myJQ("#allthephotosctr").height();
    if (scrollerHeight > initialHeight) {
        myJQ("#tmsatp_spacer").show();
    } else {
        myJQ("#tmsatp_spacer").hide();
    }
}

function centeredPosition() {
	$window = myJQ(window);
    return {
        // center vertically in viewport
        top: Math.max(SCROLLER_TOP_MARGIN,($window.height() - myJQ("#allthephotosctr").height()) / 2) + saveTop,
        left: Math.max(SCROLLER_LEFT_MARGIN, ($window.width() - myJQ("#allthephotosctr").width()) / 2)
    };
}    

function recentre() {
    var pos = centeredPosition();
    myJQ("#allthephotosctr").animate({top: "" + pos.top +"px", left: "" + pos.left + "px"});    
}

function startLoading() {
    myJQ("img.tmsatp_lazy").lazyload({effect : "fadeIn", container: myJQ("#allthephotos"), load: lazyLoadDone});    
}

function relayout() {
    genImages();
    addSpacer();
    recentre();
    startLoading();
}

function showAllThePhotos() {
    init();
    saveTop = myJQ(window).scrollTop();
    genImages();
    addSpacer();
    var pos = centeredPosition();
	myJQ("#allthephotosctr").bPopup({
         follow: [false, false], 
         position: [pos.left,pos.top], 
         closeClass: "tmsatp_closebutton",
        onClose: function() { 
            if (resizeTimer) clearTimeout(resizeTimer);
            myJQ(window).scrollTop(saveTop); 
        }
    });
	startLoading();
    
    // handle resize, with timer to limit repeated calls while resizing
    myJQ(window).resize(function() {
        if (resizeTimer) clearTimeout(resizeTimer);
        resizeTimer = setTimeout(relayout, 100);
    });
}

/* Inline bPopup library as not hosted anywhere, 
  Do With It What You Want But Please Visit My Sponsor license: http://dinbror.dk/blog/bpopup/#license */
/*================================================================================
 * name: bPopup - if you can't get it up, use bPopup
 * author: (c)Bjoern Klinggaard (twitter@bklinggaard)
 * demo: http://dinbror.dk/bpopup
 * version: 0.9.4.min
 ================================================================================*/
 (function(b){b.fn.bPopup=function(z,F){function K(){a.contentContainer=b(a.contentContainer||c);switch(a.content){case "iframe":var h=b('<iframe class="b-iframe" '+a.iframeAttr+"></iframe>");h.appendTo(a.contentContainer);r=c.outerHeight(!0);s=c.outerWidth(!0);A();h.attr("src",a.loadUrl);k(a.loadCallback);break;case "image":A();b("<img />").load(function(){k(a.loadCallback);G(b(this))}).attr("src",a.loadUrl).hide().appendTo(a.contentContainer);break;default:A(),b('<div class="b-ajax-wrapper"></div>').load(a.loadUrl,a.loadData,function(){k(a.loadCallback);G(b(this))}).hide().appendTo(a.contentContainer)}}function A(){a.modal&&b('<div class="b-modal '+e+'"></div>').css({backgroundColor:a.modalColor,position:"fixed",top:0,right:0,bottom:0,left:0,opacity:0,zIndex:a.zIndex+t}).appendTo(a.appendTo).fadeTo(a.speed,a.opacity);D();c.data("bPopup",a).data("id",e).css({left:"slideIn"==a.transition||"slideBack"==a.transition?"slideBack"==a.transition?g.scrollLeft()+u:-1*(v+s):l(!(!a.follow[0]&&m||f)),position:a.positionStyle||"absolute",top:"slideDown"==a.transition||"slideUp"==a.transition?"slideUp"==a.transition?g.scrollTop()+w:x+-1*r:n(!(!a.follow[1]&&p||f)),"z-index":a.zIndex+t+1}).each(function(){a.appending&&b(this).appendTo(a.appendTo)});H(!0)}function q(){a.modal&&b(".b-modal."+c.data("id")).fadeTo(a.speed,0,function(){b(this).remove()});a.scrollBar||b("html").css("overflow","auto");b(".b-modal."+e).unbind("click");g.unbind("keydown."+e);d.unbind("."+e).data("bPopup",0<d.data("bPopup")-1?d.data("bPopup")-1:null);c.undelegate(".bClose, ."+a.closeClass,"click."+e,q).data("bPopup",null);H();return!1}function G(h){var b=h.width(),e=h.height(),d={};a.contentContainer.css({height:e,width:b});e>=c.height()&&(d.height=c.height());b>=c.width()&&(d.width=c.width());r=c.outerHeight(!0);s=c.outerWidth(!0);D();a.contentContainer.css({height:"auto",width:"auto"});d.left=l(!(!a.follow[0]&&m||f));d.top=n(!(!a.follow[1]&&p||f));c.animate(d,250,function(){h.show();B=E()})}function L(){d.data("bPopup",t);c.delegate(".bClose, ."+a.closeClass,"click."+e,q);a.modalClose&&b(".b-modal."+e).css("cursor","pointer").bind("click",q);M||!a.follow[0]&&!a.follow[1]||d.bind("scroll."+e,function(){B&&c.dequeue().animate({left:a.follow[0]?l(!f):"auto",top:a.follow[1]?n(!f):"auto"},a.followSpeed,a.followEasing)}).bind("resize."+e,function(){w=y.innerHeight||d.height();u=y.innerWidth||d.width();if(B=E())clearTimeout(I),I=setTimeout(function(){D();c.dequeue().each(function(){f?b(this).css({left:v,top:x}):b(this).animate({left:a.follow[0]?l(!0):"auto",top:a.follow[1]?n(!0):"auto"},a.followSpeed,a.followEasing)})},50)});a.escClose&&g.bind("keydown."+e,function(a){27==a.which&&q()})}function H(b){function d(e){c.css({display:"block",opacity:1}).animate(e,a.speed,a.easing,function(){J(b)})}switch(b?a.transition:a.transitionClose||a.transition){case "slideIn":d({left:b?l(!(!a.follow[0]&&m||f)):g.scrollLeft()-(s||c.outerWidth(!0))-C});break;case "slideBack":d({left:b?l(!(!a.follow[0]&&m||f)):g.scrollLeft()+u+C});break;case "slideDown":d({top:b?n(!(!a.follow[1]&&p||f)):g.scrollTop()-(r||c.outerHeight(!0))-C});break;case "slideUp":d({top:b?n(!(!a.follow[1]&&p||f)):g.scrollTop()+w+C});break;default:c.stop().fadeTo(a.speed,b?1:0,function(){J(b)})}}function J(b){b?(L(),k(F),a.autoClose&&setTimeout(q,a.autoClose)):(c.hide(),k(a.onClose),a.loadUrl&&(a.contentContainer.empty(),c.css({height:"auto",width:"auto"})))}function l(a){return a?v+g.scrollLeft():v}function n(a){return a?x+g.scrollTop():x}function k(a){b.isFunction(a)&&a.call(c)}function D(){x=p?a.position[1]:Math.max(0,(w-c.outerHeight(!0))/2-a.amsl);v=m?a.position[0]:(u-c.outerWidth(!0))/2;B=E()}function E(){return w>c.outerHeight(!0)&&u>c.outerWidth(!0)}b.isFunction(z)&&(F=z,z=null);var a=b.extend({},b.fn.bPopup.defaults,z);a.scrollBar||b("html").css("overflow","hidden");var c=this,g=b(document),y=window,d=b(y),w=y.innerHeight||d.height(),u=y.innerWidth||d.width(),M=/OS 6(_\d)+/i.test(navigator.userAgent),C=200,t=0,e,B,p,m,f,x,v,r,s,I;c.close=function(){a=this.data("bPopup");e="__b-popup"+d.data("bPopup")+"__";q()};return c.each(function(){b(this).data("bPopup")||(k(a.onOpen),t=(d.data("bPopup")||0)+1,e="__b-popup"+t+"__",p="auto"!==a.position[1],m="auto"!==a.position[0],f="fixed"===a.positionStyle,r=c.outerHeight(!0),s=c.outerWidth(!0),a.loadUrl?K():A())})};b.fn.bPopup.defaults={amsl:50,appending:!0,appendTo:"body",autoClose:!1,closeClass:"b-close",content:"ajax",contentContainer:!1,easing:"swing",escClose:!0,follow:[!0,!0],followEasing:"swing",followSpeed:500,iframeAttr:'scrolling="no" frameborder="0"',loadCallback:!1,loadData:!1,loadUrl:!1,modal:!0,modalClose:!0,modalColor:"#000",onClose:!1,onOpen:!1,opacity:0.7,position:["auto","auto"],positionStyle:"absolute",scrollBar:!0,speed:250,transition:"fadeIn",transitionClose:!1,zIndex:9997}})(jQuery);
 
// Only show "all photos" link if there's more than 1 photo
if (myJQ(".lbThumb img").length > 1) { 
    myJQ("#viewFullSize").after(myJQ("<a />", 
        {id: "showallthephotos",
         href: "javascript:void(0)",
         title: "View all the full size photos (Greasemonkey script)",
         text: "View all photos",
         click: showAllThePhotos}))
        .after("<br />");
}
