/*
 * Mobile Logger. Record geotagged sensor values on a mobile device.
 * Copyright (C) 2010 Robert Carlsen
 *
 * This file is part of Mobile Logger.
 *
 * Mobile Logger is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * 
 */

/* Settings window
*/


function SettingsWindow(title) {
    
    var self = Ti.UI.createWindow({
        navBarHidden: true
    });
    
    var settingsWin = Ti.UI.createWindow({
        title : title,
        backgroundColor : 'white',
        barColor : orangeColor,
    });
    
    var nav = Ti.UI.iPhone.createNavigationGroup({
        window: settingsWin
    });
    
    self.add(nav);
    
    // methods for creating custom rows:
    function addControlRow(label,property,initialValue)
    {
        if(initialValue == null) { initialValue = false; }
    
    	var row = Ti.UI.createTableViewRow({height:50});
        row.backgroundColor = '#fff';
    
        // add a label to the left
        // should be bold
        var cellLabel = Ti.UI.createLabel({
            text:label,
            font:{fontSize:16,fontWeight:'bold'},
            left:10
        });
        row.add(cellLabel);
    
        // enable the property to be omitted
        // TODO: use a type variable to create different styles of controls?
        if(property != null){
            // add a switch to the right
            var sw = Ti.UI.createSwitch({
                right:10,
                value:Ti.App.Properties.getBool(property,initialValue)
            });
    
            // add a callback function to set application
            // properties when the value is changed
            sw.addEventListener('change', function(e)
            {
                // update the property with the state of the switch
                Ti.App.Properties.setBool(property,e.value);
    
                Ti.API.info('Property changed: '+property+', '+e.value);
            });
    
            row.add(sw);
    
    	}
    
    	row.className = 'control';
    	return row;
    }
    
    
    function addTextFieldRow(label,property,initialValue,secure)
    {
        if(initialValue == null) { initialValue = ''; }
        if(secure == null) { secure = false; }
    
    	var row = Ti.UI.createTableViewRow({height:50});
        row.backgroundColor = '#fff';
    
        // add a label to the left
        // should be bold
        var cellLabel = Ti.UI.createLabel({
            text:label,
            font:{fontSize:16,fontWeight:'bold'},
            left:10
        });
        row.add(cellLabel);
    
        // enable the property to be omitted
        // TODO: use a type variable to create different styles of controls?
        if(property != null){
            // add a textField
            var field = Ti.UI.createTextField({
                right:10,
                left:110,
                passwordMask:secure,
                hintText:initialValue,
                value:Ti.App.Properties.getString(property,initialValue)
            });
    
            // add a callback function to set application
            // properties when the value is changed
            field.addEventListener('blur', function(e)
            {
                // update the property with the state of the switch
                Ti.App.Properties.setString(property,e.value);
                Ti.API.info('Property changed: '+property+', '+e.value);
            });
            row.add(field);
    	}
    
    	row.className = 'textControl';
    	return row;
    }
    
    function addExportRow(label,property,valuesList,initialValue)
    {
        if(initialValue == null) { initialValue = false; }
    
    	var row = Ti.UI.createTableViewRow({height:50});
        row.backgroundColor = '#fff';
    
        // add a label to the left
        // should be bold
        var cellLabel = Ti.UI.createLabel({
            text:label,
            font:{fontSize:16,fontWeight:'bold'},
            left:10
        });
        row.add(cellLabel);
    
        // enable the property to be omitted
        // TODO: use a type variable to create different styles of controls?
        if(property != null){
            row.hasChild = true;
            row.value = Ti.App.Properties.getString(property,initialValue);
    
            var cellValue = Ti.UI.createLabel({
                text:valuesList[row.value],
                font:{fontSize:14},
                textAlign:'right',
                right:20
            });
            row.add(cellValue);
    
            // add an event listener to this row
            row.addEventListener('click',function(e){
                // push a table view with these valuesList
               Ti.API.info('In the export table row click event');
    
                var exportWin = Ti.UI.createWindow({
                    title:'Export Format',
                    backgroundColor: '#ccc',
                    barColor:orangeColor
                });
    
                var thisTable = Ti.UI.createTableView();
                thisTable.style = Ti.UI.iPhone.TableViewStyle.GROUPED;
                thisTable.backgroundColor = '#ccc';
                var data = [];
                for(var i in valuesList) {
                    if(valuesList.hasOwnProperty(i)){
                        var thisRow = Ti.UI.createTableViewRow({backgroundColor:'#fff'});
                        thisRow.title = valuesList[i];
                        thisRow.value = i;
    
                        // check the currently selected export format
                        if(row.value == thisRow.value) { thisRow.hasCheck = true; }
                        data.push(thisRow);
                    }
                }
                thisTable.setData(data);
    
                thisTable.addEventListener('click',function(r){
                    Ti.API.info('In the export format window click event');
                    var rowValue = r.rowData.value;
    
                    // trying to get the parentTable to update.
                    cellValue.text = r.rowData.title;
                    row.value = rowValue;
    
                    Ti.App.Properties.setString(property,rowValue);
                    Ti.API.info('Set the property: '+property +' to: '+rowValue);
    
                    // deselect all rows in the table
                    var index = r.index;
                    var section = r.section;
    
                    setTimeout(function()
                    {
                        // reset checks
                        for (var i=0;i<section.rows.length;i++) {
                            section.rows[i].hasCheck = false;
                        }
                        // set current check
                        section.rows[index].hasCheck = true;
                    },250);
                });
    
                exportWin.add(thisTable);
                Ti.API.info('Added export table to export window');
    
                nav.open(exportWin,{animated:true});
                Ti.API.info('Export format window should have opened');
            });
    
    	}
    
    	row.className = 'export';
    	return row;
    }
    
    function addAboutRow(label,value)
    {
        if(label == null) { label = 'About'; }
            
    	var row = Ti.UI.createTableViewRow({height:50});
        row.backgroundColor = '#fff';
        row.hasChild = true;
        row.header = '';
    
        // add a label to the left
        // should be bold
        var cellLabel = Ti.UI.createLabel({
            text:label,
            font:{fontSize:16,fontWeight:'bold'},
            left:10
        });
        row.add(cellLabel);
    
        // add a child view
        row.addEventListener('click',function(e){
            Ti.API.info('In the about row click event');
    
            // push a new window
            var aboutWin = Ti.UI.createWindow({
                title:label,
                backgroundColor:'#ccc',
                barColor:orangeColor
            });
            Ti.API.info('Created about window');
    
            var aboutField = Ti.UI.createTextArea({
                value:value,
                //width:300,
                //height:300,
                //top:10,
                //borderWidth:1,
                //borderColor:'#999',
                //borderRadius:10,
                height:Ti.UI.FILL,
                editable:false,
                touchEnabled:true,
                font:{fontSize:16},
                scrollable:true
            });
            Ti.API.info('Created about field');
            //Ti.API.info('Added about string to about field: '+value);
    
            aboutWin.add(aboutField);
            //aboutWin.open();//{modal:true});
            nav.open(aboutWin,{animated:true});
        
            Ti.API.info('Should have opened the about window');
        });
    
    	row.className = 'aboutrow';
    	return row;
    }
    
    function addInfoRow(label,property)
    {
    	var row = Ti.UI.createTableViewRow({height:50});
        row.backgroundColor = '#fff';
    
        // add a label to the left
        // should be bold
        var cellLabel = Ti.UI.createLabel({
            text:label,
            font:{fontSize:16,fontWeight:'bold'},
            left:10
        });
        row.add(cellLabel);
    
        // enable the property to be omitted
        // TODO: use a type variable to create different styles of controls?
        if(property != null){
            row.hasChild = false;
            row.value = property.toString(); 
    
            var cellValue = Ti.UI.createLabel({
                text:row.value,
                font:{fontSize:14},
                textAlign:'right',
                right:20
            });
            row.add(cellValue);
        }
    
        row.selectionStyle = Titanium.UI.iPhone.TableViewCellSelectionStyle.NONE;
      	row.className = 'info';
    	return row;
    
    }
    
    
    // add export db file row
    
    function addExportDbRow(label)
    {
    	var row = Ti.UI.createTableViewRow({height:50});
        row.backgroundColor = '#fff';
        row.hasChild = true;
        //row.header = '';
    
            // add a label to the left
        // should be bold
        var cellLabel = Ti.UI.createLabel({
            text:label,
            font:{fontSize:16,fontWeight:'bold'},
            left:10
        });
        row.add(cellLabel);
    
        // get the db and list the size...this could be a memory killer
        var logDB = Ti.Database.open("log.db");
        var f = logDB.getFile();
        
        Ti.API.info('db file exists: '+ ((f.exists) ? 'yes' : 'no')); // +' path: '+f.resolve());
    
        var cellValue = Ti.UI.createLabel({
            text:(f.read.size/1024) + ' kB',
            font:{fontSize:14},
            textAlign:'right',
            right:20
        });
        row.add(cellValue);
    
        function exportDBCallback(e) {
            // the compression may take a while, disable the button
            // until the compression is finished:
            row.removeEventListener('click',exportDBCallback);
            row.setSelectionStyle(Ti.UI.iPhone.TableViewCellSelectionStyle.NONE);
    
            // this may take a while, create an indicator:
            var activityIndicator = Ti.UI.createActivityIndicator({
                  style:Ti.UI.iPhone.ActivityIndicatorStyle.DARK,
                  right: (10 + cellValue.size.width + 20)
            });
            activityIndicator.show();
            row.add(activityIndicator);
            
            Ti.API.info('In the about row click event');
    
            var emailDialog = Titanium.UI.createEmailDialog();
            
            // alert if email is not supported (eg. don't have an e-mail acconut set up)
            if(emailDialog.isSupported()) {
                emailDialog.barColor = orangeColor;
        
                emailDialog.subject = "Mobile Logger Database";
                //emailDialog.toRecipients = ['foo@yahoo.com'];
                emailDialog.messageBody = 'Attached is the sqlite database file from Mobile Logger.';
                // Compress the newly created temp file
                var zipFilePath = Ti.Compression.compressFile(f.path);
                Ti.API.info('zip file path: '+zipFilePath);
        
                if(zipFilePath) { // it was successful, attach this
                    emailDialog.addAttachment(Ti.Filesystem.getFile(zipFilePath));
                }
                else {
                    emailDialog.addAttachment(f);
                }
                emailDialog.open();
                Ti.API.info('Email dialog should have opened');
            }
            else {
                // alert
                var dialog = Ti.UI.createAlertDialog({
                    title: 'Cannot Export',
                    message: 'Please set up a default e-mail account.',
                    ok: 'OK'
                }).show();
            }
            
            // clean up:
            activityIndicator.hide();
            row.remove(activityIndicator);
            row.setSelectionStyle(Ti.UI.iPhone.TableViewCellSelectionStyle.BLUE);
    
            // add the event listener again:
            row.addEventListener('click',exportDBCallback);
        };
        
        // add a child view
        row.addEventListener('click',exportDBCallback);
        row.className = 'exportdb';
        return row;
    }
    
    
    // add network row. currently only google fusion tables (but leaving the mechanism to add network services later)
    function addNetworkRow(label,property,valuesList,initialValue)
    {
        if(initialValue == null) { initialValue = false; }
    
    	var row = Ti.UI.createTableViewRow({height:50});
        row.backgroundColor = '#fff';
    
        // add a label to the left
        // should be bold
        var cellLabel = Ti.UI.createLabel({
            text:label,
            font:{fontSize:16,fontWeight:'bold'},
            left:10
        });
        row.add(cellLabel);
    
        // enable the property to be omitted
        // TODO: use a type variable to create different styles of controls?
        if(property != null){
            row.hasChild = true;
            row.value = Ti.App.Properties.getString(property,initialValue);
    
            var cellValue = Ti.UI.createLabel({
                text:valuesList[row.value],
                font:{fontSize:12},
                textAlign:'right',
                right:20
            });
            row.add(cellValue);
    
            // add an event listener to this row
            row.addEventListener('click',function(e){
                // push a table view with these valuesList
               Ti.API.info('In the network row click event');
    
                var exportWin = Ti.UI.createWindow({
                    title:'Setup service',
                    backgroundColor: '#ccc',
                    barColor:orangeColor
                });
                
                var thisTable = Ti.UI.createTableView();
                thisTable.style = Ti.UI.iPhone.TableViewStyle.GROUPED;
                thisTable.backgroundColor = '#ccc';
                thisTable.setScrollable(false);
                var data = [];

                var footerView = Ti.UI.createView({
                    width: Ti.UI.FILL,
                    heigth: Ti.UI.SIZE
                });
                
                var infoView = Ti.UI.createTextArea({
                    backgroundColor: 'transparent',
                    color : '#333',
                    font : { fontSize : 12 },
                    textAlign : Ti.UI.TEXT_ALIGNMENT_CENTER,
                    autoLink : Ti.UI.AUTODETECT_ALL,
                    editable : false,
                    top : 0,
                    width : 300,
                    height : Ti.UI.SIZE
                });

                // provide some information here:                
                infoView.value = 
                'Upload logs to Fusion Tables, an experimental Google Labs product. ' +
                'Fusion Tables appear in your Google Drive account. ' +
                'You can map your data, chart it in various ways, merge several tables and share. \n\n' +
                'Sign into your Google account by tapping the Google Fusion Tables button above. \n\n' +
                'Mobile Logger does not store your account login information; access is provided via OAuth 2.0. ' +
                'You can remove Mobile Logger\'s tokens by tapping the "Clear" button and can revoke access in your Google account settings. \n\n' +
                'More information about Fusion Tables is available on the Google support site:\n' +
                'http://goo.gl/c9ex8'
                ;
                
                footerView.add(infoView);
                thisTable.setFooterView(footerView);
                
                
                var clearButton = Ti.UI.createButton({
                    title: "Clear"
                });
                clearButton.addEventListener('click',function(e){

                    function clearUploadService() {
                        // remove the uploadService property.
                        // deactivate all auth...currently only google auth
                        
                        googleAuth.clearTokens();
                        Ti.App.Properties.removeProperty('uploadService');
                            
                        // clear the network row cell label value:
                        cellValue.text = '';
                        row.value = '';
                        
                        // reset checks
                        // only 1 section
                        for (var i=0;i<data.length;i++) {
                            data[i].hasCheck = false;
                        }
                        thisTable.setData(data);
                    }
                    
                    // display an action sheet to confirm
                    // set up and display an action sheet with upload choices:
                    var optionsDialog = Titanium.UI.createOptionDialog({
                        options : ['Clear', 'Cancel'],
                        cancel : 1,
                        destructive: 0,
                        title : 'Clear upload service setting?'
                    });

                    // TODO: add a listener to conditionally act on the response.
                    // This may be better suited to display differently based on each platform's
                    // UX paradigms.
                    optionsDialog.addEventListener('click', function(oe) {
                        switch(oe.index) {
                            case oe.destructive:
                                // clear the upload service, and log out of Google
                                Ti.API.info('Button 0 pressed.');
                                clearUploadService();
                                break;
                            case oe.cancel:
                                Ti.API.info('Cancel button pressed');
                                break;
                            default:
                                Ti.API.info('Default case in options dialog.');
                                return;
                        }
                    }); 

                   // Ti.API.info('Showing the options dialog');
                   optionsDialog.show();
                });
                exportWin.setRightNavButton(clearButton);
                
                for(var i in valuesList) {
                    if(valuesList.hasOwnProperty(i)){
                        var thisRow = Ti.UI.createTableViewRow({backgroundColor:'#fff'});
                        thisRow.title = valuesList[i];
                        thisRow.value = i;
    
                        // check the currently selected export format
                        if(row.value == thisRow.value) { thisRow.hasCheck = true; }
                        data.push(thisRow);
                        
                        if (i == 'fusionTables') {
                            Ti.API.log('in fusion tables OAuth');

                            function displayAccountName() {
                                function displayErrorMessage(e) {
                                    Titanium.UI.createAlertDialog({
                                        title : 'Error',
                                        message : 'Can\'t load user profile.'
                                    }).show();
                                    Ti.API.error('RESPONSE: ' + JSON.stringify(e));
                                };
                                
                                var xhrList = Ti.Network.createHTTPClient({
                                    // function called when the response data is available
                                    onload : function(e) {
                                        try {
                                            var resp = JSON.parse(this.responseText);
                                            // get the name from the profile response. display in alert:
                                            Ti.UI.createAlertDialog({
                                                title : 'Authorized',
                                                message : 'Signed in as: ' + resp.email
                                            }).show();

                                        } catch(e) {
                                            displayErrorMessage(e);
                                        }
                                    },
                                    // function called when an error occurs, including a timeout
                                    onerror : function(e) {
                                        displayErrorMessage(e);
                                    },
                                    timeout : 5000
                                });
                                xhrList.open("GET", 'https://www.googleapis.com/oauth2/v1/userinfo?access_token=' + googleAuth.getAccessToken());
                                xhrList.send();
                            };

                            thisRow.addEventListener('click', function(r) {
                                // login to Google if not authorized.
                                // display an alert with the current name.
                                googleAuth.isAuthorized(function() {
                                    // already authorized...or after a successful authorization
                                    Ti.API.debug('Access Token: ' + googleAuth.getAccessToken());
                                    displayAccountName();
                                }, function() {
                                    // not authorized yet.
                                    Ti.API.debug('Authorize google account...');
                                    googleAuth.authorize();
                                });

                            });
                        }

    
                    }
                }
                thisTable.setData(data);
    
                thisTable.addEventListener('click',function(r){
                    Ti.API.info('In the select network service window click event');
                    var rowValue = r.rowData.value;
    
                    // trying to get the parentTable to update.
                    cellValue.text = r.rowData.title;
                    row.value = rowValue;
    
                    Ti.App.Properties.setString(property,rowValue);
                    Ti.API.info('Set the property: '+property +' to: '+rowValue);
    
                    // deselect all rows in the table
                    var index = r.index;
                    var section = r.section;
    
                    setTimeout(function()
                    {
                        // reset checks
                        for (var i=0;i<section.rows.length;i++) {
                            section.rows[i].hasCheck = false;
                        }
                        // set current check
                        section.rows[index].hasCheck = true;
                    },250);
                });
    
                exportWin.add(thisTable);
                Ti.API.info('Added server table to service window');
    
                nav.open(exportWin,{animated:true});
                Ti.API.info('Select service window should have opened');
            });
    	}
    
    	row.className = 'networkRow';
    	return row;
    }
    
    // set up the settings table rows:
    var inputData = [];
    
    // only currently including one network service, but attempting to design this system
    // to accomodate several upload services. api.js will need to be extented
    // to support each additional service.
    var networkServiceRow = addNetworkRow('Upload Service','uploadService',
    {
        fusionTables:'Google Fusion Tables',
    }); // no initial value. respond to the absence of the upload service row with an alert 
        
    networkServiceRow.footer = 'Send data to a network service';
    inputData.push(networkServiceRow);
    
    //inputData.push(addControlRow('Server'));
    //inputData.push(addControlRow('Database'));
    //networkRow.header = 'Network';
    
    var resumeRow = addControlRow('Auto-Resume Logging','autoResume',false);
    //resumeRow.header = 'Configuration';
    resumeRow.header = '';
    inputData.push(resumeRow);
    inputData.push(addControlRow('Metric Units','useMetric'));
    inputData.push(addControlRow('Monitor Sound Levels','monitorSound',true));
    
    // should this actually modify the stored data in the db,
    // or control whether or not the user ID field is included
    // in uploaded or exported data?
    var anonRow = addControlRow('Anonymous Export','omitDeviceID',false);
    anonRow.header = '';
    inputData.push(anonRow);
    
    // trying to get the export to work
    var exportRow = addExportRow('Export Format','exportFormat',{csv:'CSV',json:'JSON',gc:'Golden Cheetah',gpx:'GPX'},'csv');
    inputData.push(exportRow);
    inputData.push(addExportDbRow('Export DB'));
    
    // Set up an about message
    var aboutString = 
    'Log location, heading, speed, altitude, accelerometer, sound level, trip duration and distance. '+
    'Export logs via e-mail in CSV, JSON or Golden Cheetah format.\n\n'+
    'By default, logs contain a unique identifier for this device. It may be omitted by enabling the "Anonymous Export" option.\n\n'+
    'This application has been released as open source software under the GPLv3. '+
    'Source code is available at: http://github.com/rcarlsen/Mobile-Logger \n\n'+
    'Created by Robert Carlsen in the Interactive Telecommunications Program at New York University.\n\n'+
    'Google Authentication Module, Copyright 2012 Miroslav Magda. Licensed under GPL/MIT.'
    ;
    
    inputData.push(addAboutRow('About Mobile Logger',aboutString));
    
    // add a version row:
    var versionRow = addInfoRow("Application Version",Ti.App.version);
    //versionRow.header = '';
    inputData.push(versionRow);
    
        // create the settings table view:
    var tableView = Titanium.UI.createTableView({ 
        data:inputData, 
        style:Titanium.UI.iPhone.TableViewStyle.GROUPED, 
        backgroundColor: '#ccc'
    }); 
    settingsWin.add(tableView);
    
    return self;
}


// will attach a new window for debugging the Google auth and display the current Fusion Tables list.
// needs a window reference for pushing the new view.
function debugFusionTables(win) {
    var nav = win;
    
    // ensure logged in:
    var acctWin = Ti.UI.createWindow({
        title : 'Fusion Tables',
        backgroundColor : '#ccc',
        barColor : orangeColor
    });

    var sync = Ti.UI.createButton({
        title : 'Sync'
    });
    var logout = Ti.UI.createButton({
        title : 'Logout'
    });
    var table = Titanium.UI.createTableView();
    acctWin.add(table);
    acctWin.rightNavButton = sync;
    //acctWin.leftNavButton = logout;

    logout.addEventListener('click', function() {
        googleAuth.deAuthorize();
        table.setData([]);
    });
    sync.addEventListener('click', function() {
        Ti.API.info('Authorized: ' + googleAuth.isAuthorized());
        googleAuth.isAuthorized(function() {
            Ti.API.info('Access Token: ' + googleAuth.getAccessToken());
            //empty table view
            table.setData([]);
            var xhrList = Ti.Network.createHTTPClient({
                // function called when the response data is available
                onload : function(e) {
                    try {
                        var resp = JSON.parse(this.responseText);
                        for (var i = 0; i < resp.items.length; i++) {
                            // get each of the table names:
                            var name = resp.items[i].name;
                            var row = Ti.UI.createTableViewRow({
                                title : (name) ? name : '(no name)'
                            });
                            table.appendRow(row);
                        }
                    } catch(e) {
                        Titanium.UI.createAlertDialog({
                            title : 'Error',
                            message : 'Can\'t load tasks for list'
                        });
                        Ti.API.error('RESPONSE: ' + JSON.stringify(e));
                    }
                },
                // function called when an error occurs, including a timeout
                onerror : function(e) {
                    Titanium.UI.createAlertDialog({
                        title : 'Error',
                        message : 'Can\'t load tasklists'
                    });
                    Ti.API.error('HTTP: ' + JSON.stringify(e));
                },
                timeout : 5000
            });
            xhrList.open("GET", 'https://www.googleapis.com/fusiontables/v1/tables?access_token=' + googleAuth.getAccessToken());
            xhrList.send();
        }, function() {
            Ti.API.info('Authorize google account...');
            googleAuth.authorize();
        });
    });

    nav.open(acctWin, {
        animated : true
    });
};

module.exports = SettingsWindow;
