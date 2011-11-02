function getSettings() {
	$('#settings').html('');
    getLanguages();
    getUsername();
    showSettings();
}

function showSettings() {
    hideOverlayDivs();
    hideContent();
    $('#settings').show();
    setActiveState();                                   
}

function hideSettings() {
    hideOverlayDivs();
    showContent();
}

function getLanguages() {
  
    //$('#settings').addClass('inProgress');
             
    console.log("get languages");          
                           
    var requestUrl = "http://en.wikipedia.org/w/api.php?action=sitematrix&format=json";

    $.ajax({
        type:'Get', 
        url:requestUrl, 
        success:function(data) {
            displayLanguages(data);
        }
    });

}

function displayLanguages(results) {

    var numberOfSites = -1;
    var markup = '';
    markup += "<form><select id='localeSelector' onchange='javascript:onLocaleChanged(this.options[this.selectedIndex].value);'>";
    
    if (results != null) {
        results = JSON.parse(results);
        if (results.sitematrix) {       
            numberOfSites = parseInt(results.sitematrix.count);
            for (var i=0;i<numberOfSites;i++) {
                var locale = results.sitematrix[i.toString()];
                if (locale) {
                    var len = parseInt(JSON.stringify(locale.site.length));
                    for (var j=0;j<len;j++) {
                        if (locale.site[j].code == "wiki") {
                            markup += "<option value='" + locale.code + "'>"  + locale.name + "</option>";
                            break;
                        }
                    } 
                }             
            }
        }         
    }
    
    markup += "</select></form>";  
    $('#settings').append(markup);

    //hideProgressLoader();
    //$('#settings').removeClass('inProgress');
}

function onLocaleChanged(selectedValue) {
    
    currentLocale.languageCode = selectedValue;
    currentLocale.url = "http://" + selectedValue + ".m.wikipedia.org";
      
    // save / update currentLocale in LocalStorage
    var settingsDB = new Lawnchair({name:"settingsDB"}, function() {
        this.save({key: "locale", value: currentLocale});
    });
}


function getUsername() {
    var markup = '<form><label for="settings-username">Username:</label> <input type="text" id="settings-username" value="' + login.getUsername() + '" onchange="javascript:login.setUsername(this.value);"></form>';  
    $('#settings').append(markup);
}