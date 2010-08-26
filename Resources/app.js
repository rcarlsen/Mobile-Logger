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

Ti.include('tools/util.js');
Ti.include('main_windows/api.js');

setupDatabase();

Ti.Geolocation.purpose = "Log location, movement and sound.";

// this sets the background color of the master UIView (when there are no windows/tab groups on it)
Titanium.UI.setBackgroundColor('#000');

//var greenColor = 'rgb(85,130,80)';
//var orangeColor = '#f27f14';
var orangeColor = '#d56009';
var blueColor = '#c8e6ff';

// create tab group
var tabGroup = Titanium.UI.createTabGroup();
//tabGroup.backgroundColor=greenColor;

//
// create base UI tab and root window
//
var win1 = Titanium.UI.createWindow({  
    url:'main_windows/dashboardView.js',
    // title:'Dashboard',
    backgroundColor:'#ccc',
    navBarHidden:true
});


var tab1 = Titanium.UI.createTab({  
    icon:'map-tab-icons.png',
    title:'Dashboard',
    window:win1
});

//
// create controls tab and root window
//
var win2 = Titanium.UI.createWindow({  
    url:'main_windows/logList.js',
    title:'Logs',
    backgroundColor:'#ccc',
    barColor:orangeColor
});
var tab2 = Titanium.UI.createTab({  
    icon:'list-tab-icons.png',
    title:'Logs',
    window:win2
});

//
// Settings Tab 
//
var winSettings = Titanium.UI.createWindow({  
    url:'main_windows/settings.js',
    title:'Settings',
    backgroundColor:'#ccc',
    barColor:orangeColor
});
var tabSettings = Titanium.UI.createTab({  
    icon:'settings_tab.png',
    title:'Settings',
    window:winSettings
});



//
//  add tabs
//
tabGroup.addTab(tab1);
tabGroup.addTab(tab2);  
tabGroup.addTab(tabSettings);


// open tab group
tabGroup.open();


// FIX: I don't think this is going to work.
// set up a function to hide everything
//var windowShade = Ti.UI.createWindow({
//    backgroundColor:'#000',
//    fullscreen:true
//});
//
//function toggleDisplayVisibility (state) {
//    // toggle if no input.
//    if(state == null) {
//        state = !windowShade.visible;
//    }
//    if(state === true) {
//        windowShade.show();
//    } else if (state === false) {
//        windowShade.hide();
//    }
//}
//
// Moved this to app.js to try to get the uploading on a different thread than the UI
function sendBuffer(d) {
    // d is an object with the doc buffer, eventID and deviceID.
    if(d == null) {return;}
    if(!d.hasOwnProperty('docBuffer') || d.docBuffer == null || d.docBuffer.length == 0) { return; }

    //Ti.API.info('In the sendBuffer() method with: '+ d.docBuffer.toString() +
                //', eventid: '+d.eventID+
                //', deviceid: '+d.deviceID);

    //Ti.API.info('Sending Buffer');
    // send the batch of docIDs in the uploadBuffer
    // need to retrieve them from the database 
    var logDB = Ti.Database.open("log.db");
 
    // using an array just isn't working, despite the documentation
    //var rows = logDB.execute("SELECT _id,DATA FROM LOGDATA WHERE _id IN (?)",docString);

    // instead, manually construct the SQL statement
    var docString = d.docBuffer.join("','");
    var sql = "SELECT * FROM LOGDATA WHERE _id IN ('"+docString+"')";
    var rows = logDB.execute(sql);
    
    var docs = [];
    var useDeviceID = Ti.App.Properties.getBool('omitDeviceID',false);
    
    while(rows.isValidRow()) {
        // get the data from the row
        var thisDoc = JSON.parse(rows.fieldByName('DATA'));
       
        // disabled at the moment, but ensure that uploaded records are numbers, not strings
        // make sure that each field is a number
        //for(var f in currentSample){
        //    out[f] = parseFloat(currentSample[f]);
        //}
       
        // add the docid
        thisDoc._id = rows.fieldByName('_id');
        // add the eventID
        thisDoc.eventID = (d.hasOwnProperty('eventID')) ? d.eventID : -1;
        // and the deviceID
        if(!useDeviceID){
            thisDoc.deviceID = (d.hasOwnProperty('deviceID')) ? d.deviceID : -1;
        } else {
            thisDoc.deviceID = -1;
        }
        docs.push(thisDoc);

        //Ti.API.info(JSON.stringify(thisDoc));
        rows.next();
    }
    rows.close();
    logDB.close();

    //Ti.API.info('Prepared docs for upload: '+docs.length);

    // send this batch of samples
    bulkUpload(docs);

    //Ti.API.info('Finished upload');
}

var progressView;
var progressBar;
function uploadProgress(w,v)
{
    // want this to display a progress bar
    // should also generate a view 
    //
    if(w == null) { return; }
    if(v == null) { v = 0; }

    if(progressView == null) {
        // create a view...then add the bar to it.
        // then add it to the current window
        //
        Ti.API.info('Creating a progress view');
        progressView = Ti.UI.createView({
            top:0,
            width:320, // adjust this to fit the window
            height:50,
            backgroundColor:'#666',
            opacity:0
        });

        Ti.API.info('Creating the upload progress bar');
        progressBar = Titanium.UI.createProgressBar({
            width:250,
            min:0,
            max:10,
            value:0,
            color:'#fff',
            message:'Upload Progress',
            font:{fontSize:14, fontWeight:'bold'},
            style:Titanium.UI.iPhone.ProgressBarStyle.PLAIN
        });
        progressView.add(progressBar);
        progressBar.show();
        w.add(progressView);

        progressView.animate({opacity:0.9,duration:250});

        var val = 0;
        var interval = setInterval(function()
        {
            if(val == 11) {
                clearInterval(interval);

                if(progressView) { // how to detect that progressView is still available?
                    Ti.API.info('About to fade the progress view');
                    progressView.animate({opacity:0,duration:250},function() {
                        w.remove(progressView);
                        progressView = null;
                    });
                } else {
                    Ti.API.info('Just hide the progress view');
                    w.remove(progressView);
                    progressView = null;
                }
            }
            progressBar.value = ++val;
        },500);
    }
    
    Ti.API.info('Setting the progress bar value: '+ v);
    progressBar.value = v;

}


// attach the 
win2.uploadProgress = uploadProgress;

// attach the sendBuffer method.
// is this the correct way?
win1.sendBuffer = sendBuffer;
