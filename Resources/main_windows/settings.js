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

// The Android can't do a grouped table layout but it does have sections.
// Also, I don't think that it can have controls in the table rows, can it?
//
var win = Titanium.UI.currentWindow;

var orangeColor = '#d56009';


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

            Titanium.UI.currentTab.open(exportWin,{animated:true});
            Ti.API.info('Export format window whould have opened');
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
            editable:false,
            touchEnabled:false,
            font:{fontSize:15}
        });
        Ti.API.info('Created about field');
        //Ti.API.info('Added about string to about field: '+value);

        aboutWin.add(aboutField);
        //aboutWin.open();//{modal:true});
        Titanium.UI.currentTab.open(aboutWin,{animated:true});
    
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
    // hack to clean up the busted path
    var dbPath = Ti.Filesystem.applicationDirectory;
    dbPath = dbPath.substring(0,dbPath.length - 'Applications'.length);
    dbPath += 'Library/Application Support/database/log.db.sql';

    // iPhone only path. Is this a fragile path, too?
    var f = Ti.Filesystem.getFile(dbPath);
    Ti.API.info('db file exists: '+ ((f.exists) ? 'yes' : 'no') +' path: '+dbPath);

    var cellValue = Ti.UI.createLabel({
        text:(f.read.size/1024) + ' kB',
        font:{fontSize:14},
        textAlign:'right',
        right:20
    });
    row.add(cellValue);


    // add a child view
    row.addEventListener('click',function(e){

        Ti.API.info('In the about row click event');

        var emailDialog = Titanium.UI.createEmailDialog();
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
    });
    row.className = 'exportdb';
    return row;
}


// add network row. mobile logger server or google fusion tables
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
                title:'Select service',
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
                    
                    // add the authentication fields in a new window:
                    if(i == 'fusionTables') {
                        thisRow.hasDetail = true;
                        
                        thisRow.addEventListener('click',function(r){
                           // only act when the detail disclosure is clicked, or if the account fields are empty
                           if(r.detail ||
                                (Ti.App.Properties.getString('googleUsername') == '' ||
                                 Ti.App.Properties.getString('googlePassword') == '')) { 
                                var acctWin = Ti.UI.createWindow({
                                    title:'Google account',
                                    backgroundColor: '#ccc',
                                    barColor:orangeColor
                                });
                                var acctTable = Ti.UI.createTableView();
                                acctTable.style = Ti.UI.iPhone.TableViewStyle.GROUPED;
                                acctTable.backgroundColor = '#ccc';
                                var acctData = [];

                                var nameRow = addTextFieldRow('Username','googleUsername','Google username');
                                var passRow = addTextFieldRow('Password','googlePassword','Google password',true);
                                passRow.footer = 'Provide Google Account information';

                                acctData.push(nameRow);
                                acctData.push(passRow);

                                acctTable.setData(acctData);

                                // TODO: add click listener to this table
                                acctWin.add(acctTable);
                                Titanium.UI.currentTab.open(acctWin,{animated:true});
                            }
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

            Titanium.UI.currentTab.open(exportWin,{animated:true});
            Ti.API.info('Select service window should have opened');
        });
	}

	row.className = 'networkRow';
	return row;
}

// set up the settings table rows:
var inputData = [];

var networkServiceRow = addNetworkRow('Upload Service','uploadService',{fusionTables:'Google Fusion Tables',mobileLogger:'Mobile Logger'},'mobileLogger');
var networkRow = addControlRow('Upload While Logging','uploadEnabled',true);
networkRow.footer = 'Send data to a network service';
inputData.push(networkServiceRow);
inputData.push(networkRow);

//inputData.push(addControlRow('Server'));
//inputData.push(addControlRow('Database'));

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
'Export logs via e-mail in CSV, JSON or Golden Cheetah format. Data can be automatically uploaded while logging to: http://mobilelogger.robertcarlsen.net\n\n'+
'By default, logs contain a unique identifier for this device. It may be omitted by enabling the "Anonymous Export" option.\n\n'+
'This application has been released as open source software under the GPLv3. '+
'Source code is available at: http://github.com/rcarlsen/Mobile-Logger \n\n'+
'Created by Robert Carlsen in the Interactive Telecommunications Program at New York University.';

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
win.add(tableView);
