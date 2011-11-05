var login = {
    username: '',
    logged: false,
    api: 'http://commons.wikimedia.org/w/api.php', //@todo check if we can replace it by the local wikipedia api without bugs in uploader

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
        this.username = username;
        var settingsDB = new Lawnchair({name:"settingsDB"}, function() {
            this.save({key: "username", value: login.username});
        });
    },

    form: {
        callback: null,

        show: function(callback) {
            if(typeof callback == 'function') {
                this.callback = callback;
            }
            this.reset();

            hideOverlayDivs();
            $('#login').toggle();
            hideContent();

            setActiveState();
        },
        cancel: function() {
            this.reset();
            hideOverlays();
        },
        hide: function() {
            if(typeof this.callback == 'function') {
                this.reset();
                this.callback(login.logged);
            } else {
                this.cancel();
            }
        },
        reset: function() {
            $('#loginUsername').val(login.getUsername());
            $('#loginPassword').val('');
        },

        submit: function(api) {
            var username = $('#loginUsername').val();
            var password = $('#loginPassword').val();
            if(username == '' || password == '') {
                alert('You must set your username and password');
                return false;
            }
            if(!hasNetworkConnection()) {
                noConnectionMsg();
                this.hide();
                return false;
            };

            progress.show('Connection...');
            //First step : get a token
            $.ajax({
                type: 'Post',
                dataType: 'json',
                url: login.api + '?format=json&action=login&lgname=' + username + '&lgpassword=' + password,
                success: function(data) {
                    if(data.login && data.login.result == "NeedToken") {
                        //second step : real login
                        $.ajax({
                            type: 'Post',
                            dataType: 'json',
                            url: login.api + '?format=json&action=login&lgname=' + username + '&lgpassword=' + password + '&lgtoken=' + data.login.token,
                            success: function(data) {
                                if(data.login && data.login.result == "Success") {
                                    progress.hide();
                                    alert('The login succeded as ' + data.login.lgusername + ' !');
                                    login.logged = true;
                                    login.setUsername(username); //save the login for next login.
                                    login.form.hide();
                                } else {
                                    login.form.onError(data.login.result);
                                }
                            },
                            error: function(jqXHR, textStatus, errorThrown) {
                                login.form.onError(textStatus);
                            }
                        });
                    } else {
                        login.form.onError(data.login.result);
                    }
                },
                error: function(jqXHR, textStatus, errorThrown) {
                    login.form.onError(textStatus);
                }
            });
            return true;
        },
        onError: function(message) {
            alert('The login fail !');
            console.log('Login issue: ' + message);
            progress.hide();
        },
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