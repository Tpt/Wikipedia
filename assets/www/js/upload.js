var upload = {
    file: {}, //the current file edited
    token: '', //the token for upload

    //file object
    setFile: function(metadata) {
        //split the complete name of the file in order to have the name and the extension
        this.file.name = metadata.name;
        /^(.+)\.(\w+)$/.exec(metadata.name);
        this.file.title = RegExp.$1;
        this.file.extension = RegExp.$2;

        //others data from metadata
        this.file.fullPath = metadata.fullPath;
        this.file.type = metadata.type;
        this.file.size = metadata.size;
        this.file.date = metadata.lastModifiedDate.toISOString().split('T')[0]; //date of the last edit in iso format

        //params for the description page
        this.file.licence = upload.params.defaultLicence;
        this.file.author = login.getUsername();
        this.file.latitude = '';
        this.file.longitude = '';
        this.file.altitude = '';
        this.file.descriptions = {};
        this.file.cats = [];
        this.file.otherInformation = '';
    },

    showFile: function(file) {
        //init of the file reader
        progress.show();
        var reader = new FileReader();
        reader.onloadend = function(evt) {
            $('#uploadPicture').html('<img  width="200" height="200" src="' + evt.target.result + '" />');
            progress.hide();
        };
        reader.onerror = upload.addFile.error;

          reader.readAsDataURL(file);
    },

    addFile: {
        fromLibary: function() {
            navigator.camera.getPicture(this.onSuccess, this.onFail, {sourceType: Camera.PictureSourceType.PHOTOLIBRARY, mediaType: Camera.MediaType.PICTURE, destinationType: Camera.DestinationType.FILE_URI, allowEdit:true});
        },
        fromCamera: function() {
            navigator.camera.getPicture(this.onSuccess, this.onFail, {sourceType: Camera.PictureSourceType.CAMERA, destinationType: Camera.DestinationType.FILE_URI, allowEdit:true});
        },
        onSuccess: function(imagePath) {
            window.resolveLocalFileSystemURI(imagePath, function(entry) {
                entry.file(function(file) {
                    if(upload.params.formats.indexOf(file.type) == -1) {
                        alert('You can\'t upload this file !');
                    } else {
                        upload.ui.resetForm();
                        upload.setFile(file);
                        $('#uploadNext').show();
                        upload.showFile(file);
                    }
                }, upload.addFile.error);
            }, upload.addFile.error);
        },
        error: function(evt) {
            console.log(evt.target.error.code);
        },
        onFail: function(message) {
            if(message != 'Selection cancelled.' && message != 'Camera cancelled.') {
                alert('Failed because: ' + message);
            }
        }
    },

    //function that get the token for uploading the file and check if the file exist
    getToken: function(callback) {
        $.ajax({
            type: 'Get',
            dataType: 'json',
            url: upload.params.commonsApi + '?format=json&action=query&prop=info&intoken=edit&titles=File:' + upload.file.name,
            success: function(data) {
                if(data.error) {
                    alert('The upload fail !');
                    console.log(data.error.info);
                    progress.hide();
                } else if(!data.query.pages[-1]) {
                    alert('The file already exist');
                    progress.hide();
                } else {
                    upload.token = data.query.pages[-1].edittoken;
                    if(upload.token == '') {
                        alert('The file already exist');
                        progress.hide();
                    } else {
                        callback();
                    }
                }
            },
            error: function(jqXHR, textStatus, errorThrown) {
                alert('Error !');
                console.log("Token error = " + textStatus);
                progress.hide();
            }
        });
    },

    //Get all data from the form (step 2 and 3 before uploading)
    getFormData: function() {
        this.file.title = $('#upload-title').val();
        this.file.name = this.file.title + '.' + this.file.extension;
        this.file.date = $('#upload-date').val();
        this.file.licence = $('#licencechooser input[type=radio][name=license]:checked').val();
        this.file.author = $('#upload-author').val();

        var description = $('#upload-description');
        if(description.val()) {
            this.file.descriptions = {'en': description.val()};
        }

        this.file.latitude = $('#upload-latitude').val();
        this.file.longitude = $('#upload-longitude').val();
        this.file.altitude = $('#upload-altitude').val();

        var cat = $('#upload-cat');
        if(cat.val()) {
            this.file.cats = [$('#upload-cat').val()];
        }

        this.file.otherInformation = $('#upload-otherInformation').val();
    },

    uploadFile: {
        upload: function() {
            var options = new FileUploadOptions();
            options.fileKey = 'file';
            options.fileName = upload.file.name;
            options.mimeType = upload.file.type;

            var params = {
                format: 'json',
                action: 'upload',
                filename: upload.file.name,
                comment: 'upload from the Wkipedia mobile app',
                text: this.getPageContent(),
                token: upload.token
            };
            options.params = params;
            console.log('Upload of ' + upload.file.name + ' started');
            var ft = new FileTransfer();
            ft.upload(upload.file.fullPath, upload.params.commonsApi, this.onSuccess, this.onFail, options);
        },
        onSuccess: function(r) {
            var data = JSON.parse(r.response);
            if(data.upload && data.upload.result == 'Success') {
                lightweightNotification('The upload of the file ' + data.upload.filename + ' is done !');
                upload.ui.resetForm();
            } else {
                if(data.error) {
                    alert('The upload fail ! Error: ' + data.error.info);
                } else {
                    alert('The upload fail !');
                }

                console.log("Code = " + r.responseCode);
                console.log("Response = " + r.response);
                console.log("Sent = " + r.bytesSent);
            }
            progress.hide();
            upload.ui.hide();
        },
        onFail: function(error) {
            if(error.code == FileTransferError.CONNECTION_ERR) {
                alert('The upload fail because of a connection error !');
            } else {
                alert('The upload fail !');
                console.log("An error has occurred: Code = " + error.code);
            }
            progress.hide();
            upload.ui.hide();
        },


        getPageContent: function() {
            var content = '=={{int:filedesc}}==\n';
                content += '{{Location dec|'+ upload.file.latitude + '|' + upload.file.longitude + '|' + upload.file.altitude + '}}\n';
                content += '{{Information\n';
                content += '|Description=\n';
                for(lang in upload.file.descriptions) {
                    content += '      {{' + lang + '|' + upload.file.descriptions[lang] + '}}\n';
                }
                content += '|Date=' + upload.file.date + '\n';
                content += '|Source= {{Own}}\n';
                content += '|Author=' + upload.file.author + '\n';
                content += '|Permission=\n';
                content += '|Other_versions=\n';
                content += '|other_fields=' + upload.file.otherInformation + '\n';
                content += '}}\n';
                content += '== {{int:license-header}}==\n';
                content += '{{Self|' + upload.file.licence + '}}\n';
                for(catId in upload.file.cats) {
                    content += '[[Category:' + upload.file.cats[catId] + ']]\n';
                }
                return content;
        }
    },

    ui: {
        currentStep: 1,

        show: function() {
            hideOverlayDivs();
            hideContent();
            $('#upload').toggle();
            $('#upload1').show();
            $('#upload2').hide();
            $('#upload3').hide();
            this.step();
            
            setActiveState();
        },
        hide: function() {
            this.currentStep = 1;
            upload.file = {};
            hideOverlays();
        },
        resetForm: function() {
            $('#upload input').val('');
            $('#upload textarea').val('');
        },

        back: function() {
            if(this.currentStep == 1) {
                this.hide();
            } else {
                $('#upload' + this.currentStep).hide();
                this.currentStep--;
                this.step();
                $('#upload' + this.currentStep).show();
            }
        },
        next: function() {
            if(this.check()) {
                $('#upload' + this.currentStep).hide();
                this.currentStep++;
                this.step();
            }
        },

        location: function() {
            navigator.geolocation.getCurrentPosition(
                function(position) {
                    $('#upload-latitude').val(position.coords.latitude);
                    $('#upload-longitude').val(position.coords.longitude);
                    $('#upload-altitude').val(position.coords.altitude);
                },
                function onError(error) {
                    lightweightNotification('The loacation fail !');
                    console.log("An error has occurred: Code = " + error.code + ", message :" + error.message);
              });
        },

        //do actions before lauching a step
        step: function() {
            switch(this.currentStep) {
                case 1:
                    $('#uploadBack').show();
                    $('#uploadNext').hide();
                    upload.file = {};
                    if(!login.logged) {
                        $('#upload').hide();
                        login.form.show(function(logged) {
                            if(logged) {
                                upload.ui.show();
                            }
                        });
                    } else {
                        $('#upload1').show();
                    }
                    break;
                case 2:
                    $('#upload-author').val(upload.file.author);
                    var chooser = $('#licencechooser');
                    chooser.html('');
                    for(licence in upload.params.licences) {
                        var html = '<input id="license|' + licence + '" type="radio" value="' + licence + '" name="license" onclick="javascript:upload.file.licence = \'' + licence + '\';" ';
                        if(licence == upload.file.licence) {
                            html += 'checked="checked" ';
                        }
                        html += '/><label for="license|' + licence + '">' + upload.params.licences[licence] + '</label><br />';
                        chooser.append(html);
                    }
                    $('#upload2').show();
                    break;
                case 3:
                    $('#upload-title').val(upload.file.title);
                    $('#upload-date').val(upload.file.date);
                    $('#upload3').show();
                    break;
                case 4:
                    if(!hasNetworkConnection()) {
                        noConnectionMsg();
                        upload.ui.hide();
                    };
                    progress.show('Uploading...');
                    upload.getFormData();
                    upload.getToken(function() {
                        console.log("Token: " + upload.token);
                        if(login.logged) {
                            upload.uploadFile.upload();
                        } else {
                            alert('You must be logged to upload a file !');
                            progress.hide();
                        }
                    });
                    break;
            }
        },

        //validate the form before the next step.
        check: function() {
            switch(this.currentStep) {
                case 1:
                    return upload.file != {};
                case 2:
                    return upload.file.licence != '';
                case 3:
                    //TODO validate the form
                    return true;
                }
        }
    },

    params: {
        formats: [
            'image/gif',
            'image/tiff',
            'image/svg+xml',
            'image/png',
            'image/jpeg',
            'image/vnd.djvu,image/x-djvu'
        ],
        licences: {
            'cc-by-sa-3.0': 'Creative Commons Attribution ShareAlike 3.0',
            'cc-by-3.0': 'Creative Commons Attribution 3.0',
            'cc-zero': 'Public domain (all rights waived with Creative Commons Zero license)'
        },
        defaultLicence: 'cc-by-sa-3.0',
        commonsApi: 'http://commons.wikimedia.org/w/api.php'
    }
};