/**
 * Namespace in oder to manage the login on wikimedia web sites
 */
var login = {
    username: '',
    logged: false,

    getUsername: function() {
        if(this.username == '') {
            var settingsDB = new Lawnchair({name:"settingsDB"}, function() {
                this.get("username", function(config) {
                     if (config) {
                         login.username = config.value;
                     }
                });
            });
        }
        return this.username;
    },

    setUsername: function(username) {
        if(this.logged) {
            //this.logout();
        }
        this.username = username;
        var settingsDB = new Lawnchair({name:"settingsDB"}, function() {
            this.save({key: "username", value: login.username});
        });
    },

    login: function(api) {
        if(this.getUsername() == '') {
            this.setUsername(prompt('Username:', this.username));
        }
        var password = prompt('Password:');

        //First step : get a token
        $.ajax({
            type: 'Post',
            dataType: 'json',
            url: api + '?format=json&action=login&lgname=' + login.username + '&lgpassword=' + password,
            success: function(data) {
                if(data.login.result == "NeedToken") {
                    //second step : real login
                    $.ajax({
                        type: 'Post',
                        dataType: 'json',
                        url: api + '?format=json&action=login&lgname=' + login.username + '&lgpassword=' + password + '&lgtoken=' + data.login.token,
                        success: function(data) {
                            if(data.login.result == "Success") {
                                alert('The login succeded as ' + data.login.lgusername + ' !');
                                login.logged = true;
                            } else {
                                alert('The login fail !');
                                console.log('Login issue: ' + data.login.result);
                            }
                        },
                        error: function(jqXHR, textStatus, errorThrown) {
                            alert('Error !');
                            console.log("Login issue: " + textStatus);
                        }
                    });
                } else {
                    alert('The login fail !');
                    console.log('Login issue: ' + data.login.result);
                }
            },
            error: function(jqXHR, textStatus, errorThrown) {
                alert('Error !');
                console.log("Token error = " + textStatus);
            }
        });
    },

    logout: function(api) {
        if(logged) {
            $.ajax({
                type: 'Post',
                url: api + '?api.php&action=logout',
                success: function(data) {
                    login.logged = false;
                }
            });
        }
    }
};