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

// set up the settings table rows:
var inputData = [];

//networkRow.header = 'Network';
// network rows removed.

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
