var currentHistoryIndex = 0;
var currentLocale = new Object();
var defaultLocale = new Object();
// default locale info
defaultLocale.languageCode = removeCountryCode(navigator.language.toLowerCase());
defaultLocale.url = "http://" + defaultLocale.languageCode + ".m.wikipedia.org";

function init() {
    document.addEventListener("deviceready", onDeviceReady, true);
}

function onDeviceReady() {

    // some reason the android browser is not recognizing the style=block when set in the CSS
    // it only seems to recognize the style when dynamically set here or when set inline...
    // the style needs to be explicitly set for logic used in the backButton handler
    $('#content').css('display', 'block');

    document.addEventListener("backbutton", onBackButton, false);
    document.addEventListener("searchbutton", onSearchButton, false);
  
    // this has to be set for the window.history API to work properly
    PhoneGap.UsePolling = true;
    
    loadContent();
    setActiveState();
}

function removeCountryCode(localeCode) {
    
    if (localeCode.indexOf("-") >= 0) {
        return localeCode.substr(0, localeCode.indexOf("-"));
    }
    
    if (localeCode.indexOf("_") >= 0) {
        return localeCode.substr(0, localeCode.indexOf("_"));
    }
    
    return localeCode;
}

function onBackButton() {
    console.log('currentHistoryIndex '+currentHistoryIndex + ' history length '+history.length);

    if ($('#content').css('display') == "block") {
        currentHistoryIndex -= 1;
        $('#search').addClass('inProgress');
        window.history.go(-1);
        if(currentHistoryIndex <= 0) {
            console.log("no more history to browse exiting...");
            navigator.app.exitApp();
        }
    }

    if ($('#bookmarks').css('display') == "block" || $('#history').css('display') == "block" || 
        $('#searchresults').css('display') == "block" || $('#settings').css('display') == "block") {
        window.hideOverlayDivs();
        window.showContent();
    }
}

function onSearchButton() {
    //hmmm...doesn't seem to set the cursor in the input field - maybe a browser bug???
    $('#searchParam').focus();
    plugins.SoftKeyBoard.show();
}

function hideMobileLinks() {
    var frameDoc = $("#main")[0].contentDocument;
    $('#header', frameDoc).css('display', 'none');
    $('#footmenu', frameDoc).css('display', 'none');

    // Internal links
    $('a[href^="/wiki/"]', frameDoc).click(function(e) {
        $('#search').addClass('inProgress');
        currentHistoryIndex += 1;
    });

    // External links
    $('a.external, a.extiw', frameDoc).click(function(event) {
        var target = $(this).attr('href');

        // Stop the link from opening in the iframe...
        event.preventDefault();

        // And open it in parent context for reals.
        //
        // This seems to successfully launch the native browser, and works
        // both with the stock browser and Firefox as user's default browser
        document.location = target;
    });
}

function iframeOnLoaded(iframe) {
    if(iframe.src) {
        window.scroll(0,0);
        hideMobileLinks();
        toggleForward();
        addToHistory();
        $('#search').removeClass('inProgress');
        console.log('currentHistoryIndex '+currentHistoryIndex + ' history length '+history.length);
    }
}

function loadContent() {
    // retrieve locale settings from LocalStorage - if it doesn't exist use the defaults!
    var settingsDB = new Lawnchair({name:"settingsDB"}, function() {
        this.get("locale", function(config) {
        
            if (config) {
                (config.value.url) ? currentLocale.url = config.value.url : currentLocale.url = defaultLocale.url;
                (config.value.languageCode) ? currentLocale.languageCode = config.value.languageCode : currentLocale.languageCode = defaultLocale.languageCode;
            }else{
                currentLocale.url = defaultLocale.url;
                currentLocale.languageCode = defaultLocale.languageCode;
            }
            
            window.loadWikiContent();
        });
    });
}

function loadWikiContent() {

    $('#search').addClass('inProgress');
    $.ajax({url: currentLocale.url,
            success: function(data) {
              if(data) {
                //$('#main').attr('src', 'http://en.m.wikipedia.org');
                $('#main').attr('src', currentLocale.url);
                currentHistoryIndex += 1;
              } else {
                noConnectionMsg();
                navigator.app.exitApp();
              }
            },
            error: function(xhr) {
              noConnectionMsg();
            },
            timeout: 3000
         });
}

function hideOverlayDivs() {
    $('#bookmarks').hide();
    $('#history').hide();
    $('#searchresults').hide();
    $('#settings').hide();
    $('#upload').hide();
}

function showContent() {
    $('#mainHeader').show();
    $('#content').show();
}

function hideContent() {  
    $('#mainHeader').hide();
    $('#content').hide();
}

function checkLength() {
    var searchTerm = $('#searchParam').val();
  
    if (searchTerm.length > 0) {
        $('#clearSearch').show();
    }else{
        $('#clearSearch').hide();
    }
}

function clearSearch() {
    $('#searchParam').val('');
    $('#clearSearch').hide();
}

function noConnectionMsg() {
    alert("Please try again when you're connected to a network.");
}

function toggleForward() {
    currentHistoryIndex < window.history.length ?
    $('#forwardCmd').attr('disabled', 'false') :
    $('#forwardCmd').attr('disabled', 'true');

    console.log('Forward command disabled '+$('#forwardCmd').attr('disabled')); 
    window.plugins.SimpleMenu.loadMenu($('#appMenu')[0], 
                                       function(success) {console.log(success);},
                                       function(error) {console.log(error);});
}

function goForward() {
    $('#search').addClass('inProgress');
    window.history.go(1);
}

function selectText() {
    PhoneGap.exec(null, null, 'SelectTextPlugin', 'selectText', []);
}

function lightweightNotification(text) {
	// Using PhoneGap-Toast plugin for Android's lightweight "Toast" style notifications.
	// https://github.com/m00sey/PhoneGap-Toast
	// http://developer.android.com/guide/topics/ui/notifiers/toasts.html
	window.plugins.ToastPlugin.show_short(text);
}

function sharePage() {
	// @fixme consolidate these with addBookmarkPrompt etc
	// @fixme if we don't have a page loaded, this menu item should be disabled...
	var frame = document.getElementById("main"),
		title = frame.contentDocument.title.replace(/ - .*?$/, ' - ' + mw.message('sitename').plain()),
		url = frame.contentWindow.location.href;
	window.plugins.share.show(
		{
			subject: title,
			text: url
		}
	);
}

function hasNetworkConnection() 
{
    return navigator.network.connection.type == Connection.NONE ? false : true;
}

function setActiveState() {
    var applicableClasses = [
        '.deleteButton',
        '.listItem',
        '#search',
        '.closeButton'
    ];
  
    for (var key in applicableClasses) {
        applicableClasses[key] += ':not(.activeEnabled)';
    }
    console.log(applicableClasses);
    
    function onTouchEnd() {
        $('.active').removeClass('active');
        $('body').unbind('touchend', onTouchEnd);
        $('body').unbind('touchmove', onTouchEnd);
    }
  
    function onTouchStart() {   
        $(this).addClass('active');
        $('body').bind('touchend', onTouchEnd);
        $('body').bind('touchmove', onTouchEnd);
    }
  
    setTimeout(function() {
        $(applicableClasses.join(',')).each(function(i) {
            $(this).bind('touchstart', onTouchStart);
            $(this).addClass('activeEnabled');
        });
    }, 500);
}
