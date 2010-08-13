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

// include files
Ti.include('../tools/json2.js');
Ti.include('../tools/util.js');
Ti.include('api.js');


// reference the parent window
var win = Ti.UI.currentWindow;



function setLoggingState(state) {
    // set the preferences
    // the application should *always* have the loggingState false
    // when it launches. otherwise, it may ahve shut down incorrectly.
    // if so, perhaps we should prompt to resume logging.
    // however, if the auto-resume feature is set, what to do then?
    // should the auto-resume only activate in startLogging()?
    //
    // what needs to happen to resume the previous log?
    // - get the previous eventid
    //  - query the database? store the current eventid in an app property?
}



// set up some instance vars:
var loggingState = false; // toggle this when recording

var currentSample = {};
var eventID;
var logID;
//var logDB;
var loggingInterval = 0;

var eventDistance = 0;
var eventStartDate;
var eventDuration = 0;
var clockInterval = 0;
var audioListenerInterval = 0;

// TODO: work with the database when generating the upload buffer
// to record which records have been uploaded
var uploadBuffer = [];
var uploadTrigger = 10;

// set up configuration for metric or imperial
// data should *always* be stored in metric / meters
// this configuration will only affect display
var distanceUnits;
var distanceUnitValue;
var speedUnits;
var speedUnitValue;


// end instance vars //

var dashboardView = Ti.UI.createView({
    size:{width:320,height:win.getHeight()},
    backgroundColor:'#ccc',
    top:0,bottom:0
});


// toggle switch for enabling logging
var loggingSwitch = Titanium.UI.createSwitch({
    top:30,right:10,
    value:false
});

var loggingLabel = Ti.UI.createLabel({
    top:5,
    right:10,
    height:20,
    textAlign:'right',
    text:'Logging:',
    color:'#333',
	font:{fontSize:16,fontFamily:'Helvetica Neue',fontWeight:'bold'}
});

/*if(Ti.Platform.name == 'iPhone OS'){
    loggingLabel.right = 10+100;
} else {
    loggingLabel.right = 10+60;
}*/


var accLabel = Ti.UI.createLabel({
    height:12,
    top:10,
    left:10,
    textAlign:'left',
    color:'#333',
	font:{fontSize:10,fontFamily:'Helvetica Neue',fontWeight:'bold'}
});

// using text in the canvas doesn't seem supported at the moment on mobile safari
// i can't determine if the TIUICanvas (listed in the bleeding edge code) has
// actually been implemented and/or is cross-platform.
//// Testing to see if the canvas view exists
//var canvas = Ti.UI.createCanvasView({});
//Ti.include("dashboard.js");
//var dash = new Dashboard(canvas.getContext());
//dashboardView.add(canvas);
//

var speedlabel = Titanium.UI.createLabel({
	color:'#333',
	text:'0.0',
	font:{fontSize:64,fontFamily:'Helvetica Neue',fontWeight:'bold'},
    textAlign:'center',
    height:80,
    top:60
});

var speedUnitLabel = Ti.UI.createLabel({
    color:'#333',
   	font:{fontSize:22,fontFamily:'Helvetica Neue',fontWeight:'bold'},
    textAlign:'center',
    height:30,
    top:125,
    text:speedUnits
});

var lonLabel = Ti.UI.createLabel({
    color:'#333',
   	font:{fontSize:18,fontFamily:'Helvetica Neue',fontWeight:'bold'},
    textAlign:'left',
    height:22,
    top:10,left:10
});

var latLabel = Ti.UI.createLabel({
    color:'#333',
   	font:{fontSize:18,fontFamily:'Helvetica Neue',fontWeight:'bold'},
    textAlign:'left',
    height:22,
    top:30,left:10
});

var headingLabel = Ti.UI.createLabel({
    color:'#333',
   	font:{fontSize:28,fontFamily:'Helvetica Neue',fontWeight:'bold'},
    textAlign:'center',
    height:34,
    top:20,
    text:'000\u00B0' // this is the degree symbol
});

var cardinalLabel = Ti.UI.createLabel({
    color:'#333',
   	font:{fontSize:18,fontFamily:'Helvetica Neue',fontWeight:'bold'},
    textAlign:'center',
    height:22,
    top:48,
    text:'N' // for cardinal direction
});

// TODO: remove, this is only for debugging:
var headingAccuracyLabel = Ti.UI.createLabel({
    color:'#333',
    font:{fontSize:12,fontFamily:'Helvetica Neue'},
    textAlign:'center',
    height:16,
    top:45
});

var accuracyLabel = Ti.UI.createLabel({
    color:'#333',
   	font:{fontSize:18,fontFamily:'Helvetica Neue',fontWeight:'bold'},
    textAlign:'center',
    height:22,
    bottom:120
});

var compassView = Ti.UI.createView({
    width:320,height:200,
    center:{x:160,y:170},
    left:0,top:75
});

var compass = Ti.UI.createImageView({
    image: '../images/small-compass-shadow.png',
    width:200,height:200,
    top:0
});

//compassView.borderWidth = 1;

// use an animated view (circle - rect with lots of border radius)
// to indicate the location accuracy
var accuracyView = Ti.UI.createView({
    opacity:0.4,
    //backgroundColor:'rgb(171,200,226)',
    backgroundColor:'#ABC8E2',
    width:10,height:10,
    borderRadius:5
});


// This position is getting crowded with the speedLabel.
// TODO: figure out a way to manage all these things in the compass view
var locationView = Ti.UI.createView({
    opacity:0.4,
    backgroundColor:'#f27f14', // orange
    width:10,height:10,
    borderRadius:5
});

compassView.add(compass);
compassView.add(accuracyView);
// doesn't really help right now.
//compassView.add(locationView);


var consoleView = Ti.UI.createView({
   width:320,height:'auto',
   left:0,bottom:0
});

var consoleImage = Ti.UI.createImageView({
    image:'../images/bottom.png',
    width:320,height:82,
    bottom:0
});

var forceImage = Ti.UI.createImageView({
    image:'../images/blue-circle.png',
    width:62,height:62,
    bottom:48
});

var forceLabel = Ti.UI.createLabel({
    height:16,
    textAlign:'center',
    text:'0.0 g',
    color:'#333',
    font:{fontSize:12,fontFamily:'Helvetica Neue',fontWeight:'bold'}
});
forceImage.add(forceLabel);


// add a duration label
var durationLabel = Ti.UI.createLabel({
    text:'0:00',
    height:40,
    textAlign:'left',
    color:'#333',
    font:{fontSize:32,fontFamily:'Helvetica Neue',fontWeight:'bold'}
});
durationLabel.left = 10;

var durationUnitLabel = Ti.UI.createLabel({
    text:'Duration',
    height:18,
    textAlign:'left',
    color:'#333',
    font:{fontSize:14,fontFamily:'Helvetica Neue',fontWeight:'bold'}
});
durationUnitLabel.bottom = -15;
durationLabel.add(durationUnitLabel);
consoleImage.add(durationLabel);

// add a distance label
var distanceLabel = Ti.UI.createLabel({
    text:'0.00',
    height:40,
    textAlign:'right',
    color:'#333',
    font:{fontSize:32,fontFamily:'Helvetica Neue',fontWeight:'bold'}
});
distanceLabel.right = 10;

var distanceUnitLabel = Ti.UI.createLabel({
    text:distanceUnits,
    height:18,
    textAlign:'right',
    color:'#333',
    font:{fontSize:14,fontFamily:'Helvetica Neue',fontWeight:'bold'}
});
distanceUnitLabel.bottom = -15;
distanceLabel.add(distanceUnitLabel);
consoleImage.add(distanceLabel);


consoleView.add(consoleImage);
consoleView.add(forceImage);


var audioLevelImage = Ti.UI.createImageView({
    image:'../images/orange-circle.png',
    width:62,height:62,
    //center:{x:160,y:0},
    top:-31
});

var audioLevelLabel = Ti.UI.createLabel({
    bottom:15,
    height:16,
    textAlign:'center',
    text:'Off',
    color:'#333',
    font:{fontSize:12,fontFamily:'Helvetica Neue',fontWeight:'bold'}

});
audioLevelImage.add(audioLevelLabel);
// end UI setup


// begin methods for dashboard //

// simple padding function
function pad2(number) {
     return (number < 10 ? '0' : '') + number;
}


function updateClock() {
    // use the recorded start time and current time to set a clock display
    var currentTime = new Date().getTime();
    var duration = currentTime - eventStartDate.getTime(); // millis
    eventDuration = duration;

    var hour = Math.floor(duration / 1000 / 60 / 60);
    var min = Math.floor(duration / 1000 / 60) % 60;
    var sec = Math.floor(duration / 1000) % 60;

    durationLabel.text = (hour > 0 ? hour +':' : '') + (hour > 0 ? pad2(min) : min) +':'+ pad2(sec);
}

function updateSpeedLabel (speed) {
    if(speed == null || speed == undefined) { speed = 0; }
    if(speedUnitValue == null) { speedUnitValue = 0; }

    speedlabel.text = (speedUnitValue * Math.max(0,speed)).toFixed(1); // m/s -> M/hr
}

function updateHeadingLabel(heading) {
    if(heading == null) { return; }
    
    // this is needed to append the degree symbol to the heading label
    headingLabel.text = Math.max(0,parseInt(heading,10)) + "\u00B0";

    // update the cardinal direction label, too
    var cardinalDir = ['N','NE','E','SE','S','SW','W','NW','N'];
    cardinalLabel.text = cardinalDir[Math.abs(Math.floor((heading+22.5)/45))%8];
}

function updateAccuracyLabel(meters) {
    if(meters == null || meters == undefined) { meters = 0; }
    accuracyLabel.text = parseFloat(meters).toFixed(2) + "m accuracy";
}

function updateForceLabel (force) {
    if(force == null || force == undefined) { force = 0; }
    //Ti.API.info('Force (accelerometer) info: '+force);

    forceLabel.text = parseFloat(force).toFixed(1) + 'g';
}

function updateLocationLabel (loc) {
    if(loc.lon == null || loc.lat == null) { return; }

    // determine if lon is W ( <0) or E ( >0)
    // determine if lat is N ( >0) or S ( <0)
    var lonUnit = (loc.lon < 0) ? 'W' : 'E';
    var latUnit = (loc.lat > 0) ? 'N' : 'S';
    
    lonLabel.text = Math.abs(loc.lon.toFixed(5)) +'\u00B0 '+ lonUnit;
    latLabel.text = Math.abs(loc.lat.toFixed(5)) +'\u00B0 '+ latUnit;
}




function updateAccuracyView (meters) {
    // create an animation for the accuracy
    // scale? starts at 5k, usually 100-50m
    // map the meters to an appropriate scale

    // set up some constraints
    var minMeters = 25;
    var maxMeters = 500;
    var minPx = 10;
    var maxPx = 400;

    // map / normalize the scale:
    var sc = (((meters-minMeters)/(maxMeters-minMeters)) * (maxPx-minPx) + minPx)/minPx;
	var t = Titanium.UI.create2DMatrix();
	t = t.scale(sc + 0.2);
	accuracyView.animate({transform:t, duration:300},function()
	{
		var t = Titanium.UI.create2DMatrix();
        t = t.scale(sc);
		accuracyView.animate({transform:t, duration:200});
	});
}

function animateLocationView () {
    var bg = locationView.backgroundColor;
    
    // color red
	locationView.animate({backgroundColor:'#ff0000', duration:200},function()
	{
        // back to normal
		locationView.animate({backgroundColor:bg, duration:300});
	});   
}


// helper methods for logging
function resetValues (restore) {
    if(restore == null) { restore = false; }
    Ti.API.info('In the resetValues() method');

    // if restore is true, then get the last data from the db? 
    // otherwise, create a new row in the logmeta table
    var logDB = Ti.Database.open("log.db");
    Ti.API.info('Opened log.db');

    // create a hash for this device / user
    deviceID =  Titanium.Utils.md5HexDigest(Ti.Platform.id);
    Ti.API.info('Set device ID: '+deviceID);

    // clear the upload buffer
    uploadBuffer = [];

    if(restore == false) {
        Ti.API.info('Creating a new event log.');
        // create a new event
        eventDistance = 0;
        eventStartDate = new Date();
        eventDuration = 0;
        eventID = Titanium.Utils.md5HexDigest(eventStartDate.toUTCString());

        logDB.execute('INSERT INTO LOGMETA (eventid,startdate,duration,distance,deviceid) VALUES(?,?,?,?,?)',eventID,eventStartDate.getTime()/1000,0,eventDistance,deviceID); // sqlite INTEGER only supports seconds not millis
        Ti.API.info('Inserted the new event into the DB.');

        // get the newly created id field
        var rowsLogid = logDB.execute('SELECT logid from LOGMETA WHERE eventid = ?',eventID);
        Ti.API.info('Queried LOGMETA for logid of eventid: '+eventID);

        if(rowsLogid.isValidRow()){ // should only return one row
            logID = rowsLogid.fieldByName('logid');
            Ti.API.info('logID: '+logID);
        
        } else {
            alert('There was a problem creating a new event log.');
            // this is mostly for debugging
            rowsLogid.close();
            return false; // tell the calling method (startLogging) to *not* start
        }
        rowsLogid.close();
        Ti.API.info('Closed the ResultSet');
    } else {
        Ti.API.info('Retrieving the past event');

        // retrieve the last event and continue logging.
        var rowsPrevious = logDB.execute('SELECT logid,eventid,startdate,duration,distance FROM LOGMETA ORDER BY startdate DESC LIMIT 1');
        Ti.API.info('Queried the DB for the most recent event');
        Ti.API.info('rowsPrevious count: ' + rowsPrevious.rowCount);

        if(rowsPrevious.isValidRow()){
            Ti.API.info('Getting previous event data.');

            eventDistance = rowsPrevious.fieldByName('distance');
            Ti.API.info('got distance: ' +eventDistance);

            eventStartDate = new Date(rowsPrevious.fieldByName('startdate')*1000);
            Ti.API.info('got startDate: '+ eventStartDate.toLocaleString());

            eventDuration = rowsPrevious.fieldByName('duration');
            Ti.API.info('got duration: ' +eventDuration);

            eventID = rowsPrevious.fieldByName('eventid');
            Ti.API.info('got eventID: '+eventID);

            logID = rowsPrevious.fieldByName('logid');
            Ti.API.info('got logid: ' +logID);

            Ti.API.info('Got last event with eventid: '+eventID+', and startdate: '+eventStartDate);
        } else {
            alert('There was a problem retrieving the previous event');
            rowsPrevious.close();
            return false;
            // TODO: need to have a way to determine if there are any events stored.
        }
        rowsPrevious.close();
        Ti.API.info('Closed the resultSet');
    }
    logDB.close();
    Ti.API.info('Closed the log.db in the resetValues() method');

   return true; 
}



function recordSample() {
    // get audio levels. will just record -1 if off
    // testing to see if the frequent audio updates are causing a crash
    // using the timer method again. disable this to not double call the audio checking.
    //checkAudioLevels();

    // get the current time
    currentSample.timestamp = new Date().getTime();

    var logDB = Ti.Database.open("log.db");
    //Ti.API.info('Opened log.db');

    // create a Document ID for this sample
    var docID = Titanium.Utils.md5HexDigest(eventID+currentSample.timestamp);
    //Ti.API.info('Generated docID: '+docID);

    // insert the current sample in the logdata table
    logDB.execute('INSERT INTO LOGDATA (_id,logid,data) VALUES(?,?,?)',docID,logID,JSON.stringify(currentSample));
    //Ti.API.info('Inserted sample into LOGDATA with logID: '+logID);

    // insert updated meta data into logmeta table
    logDB.execute('UPDATE LOGMETA SET distance = ? , duration = ? WHERE eventid = ?',eventDistance,eventDuration,eventID);
    //Ti.API.info('Updated LOGMETA for eventID: '+eventID);

    logDB.close();
    //Ti.API.info('Closed log.db');

    // pulse red while recording
    //animateLocationView();

    //Titanium.API.info("Current sample recorded to db");
    //Titanium.API.info('Time: '+currentSample.timestamp);

    // upload the sample
    // DEBUG: testing only
    // TODO: abstract / buffer this process.
    if(Ti.App.Properties.getBool('uploadEnabled',true)){
        // add this sample to the upload buffer:
        uploadBuffer.push(docID);
        if(uploadBuffer.length >= uploadTrigger){
            try{
                win.sendBuffer({'docBuffer':uploadBuffer,
                            'eventID':eventID,
                            'deviceID':deviceID});
                // clear the buffer
                uploadBuffer = [];
            } catch(err) {
                Ti.API.info('Error uploading the sample buffer: '+err.toLocaleString());    
            }
        }
    }
};

function updateDistanceLabel (delta) {
    if(delta == null) { delta = 0; }
    // expects a ivar with the current distance
    
    if(eventDistance == null || eventDistance == undefined) { eventDistance = 0; }
    eventDistance += delta;

    //Ti.API.info('Distance delta: '+delta);
    //Ti.API.info('Event distance: '+eventDistance);

    // convert the meters to an appropriate display unit. (miles only for now)
    // 1 meter = 0.000621371192 miles
    
    // Debug:
    if(distanceUnitValue == null || distanceUnitValue == undefined) { distanceUnitValue = 1; }
    var displayDistance = eventDistance * distanceUnitValue; // miles
    //var displayDistance = eventDistance;

    Ti.API.info('Display distance: '+displayDistance);
    if(displayDistance == null) { displayDistance = 0; } // Debugging for Android
    distanceLabel.text = parseFloat(displayDistance).toFixed(2);
}

function rotateCompass(degrees) {
	// don't interrupt the current animation
    // if(compass.animating) { return; }
    
    var t = Ti.UI.create2DMatrix().rotate(360-parseFloat(degrees));
    compass.transform = t;

    // ignore the nice rotation for now, just get the compas to move correctly
    /*
    var a = Titanium.UI.createAnimation();
	a.transform = t;
	a.duration = 100;
	a.autoreverse = false;
	a.repeat = 0;
	compass.animate(a); // TODO: rotate a compass widget instead
    */
}

function updateLocationData(e) {
    if (e.error)
    {
        Titanium.API.info('error:' + JSON.stringify(e.error));
        return;
    }
    

    var longitude = e.coords.longitude;
    var latitude = e.coords.latitude;
    var altitude = e.coords.altitude;
    var heading = e.coords.heading;
    var accuracy = e.coords.accuracy;
    var speed = e.coords.speed;
    var timestamp = e.coords.timestamp;
    var altitudeAccuracy = e.coords.altitudeAccuracy;

    // update the labels with the current data:
    updateAccuracyLabel(accuracy);
    updateSpeedLabel(speed);
    updateAccuracyView(accuracy);

    updateLocationLabel({lon:longitude,lat:latitude});

    // calculate distance travelled.
    // TODO: filter out small changes to minimize cumulative errors?

    // only calculate distance if logging is enabled
    // DEBUG: update all the time for testing.
    if(loggingState == true && (currentSample.lon && currentSample.lat)) {
        var dist = calculateDistanceDelta({lon:currentSample.lon,lat:currentSample.lat},
                                          {lon:longitude,lat:latitude});
        //Ti.API.info('Sample distance: '+dist);
        
        // distance display never updated.
        // Update: distance display seems to only show the delta
        // rather than the accumulated distance.
        if(Math.abs(dist) > 0.0) {
            updateDistanceLabel(dist);
        }
    }

    //Ti.API.info('current lat: '+latitude);
    //Ti.API.info('current lon: '+longitude);
    //Ti.API.info('current accuracy: '+accuracy);
    //Ti.API.info('current alt accuracy: '+ altitudeAccuracy);
    //Ti.API.info('current speed: '+speed);

    // sanity checking for anrdoid's sake:
    if(altitudeAccuracy == null) { altitudeAccuracy = -1; }

    // can safely limit the precision of the location data
    // places   degrees distance
    // 3	    0.001	111 m
    // 4	    0.0001	11.1 m
    // 5	    0.00001	1.11 m
    // 
    // update the current sample object with the new data:
    currentSample.lat = parseFloat(latitude.toFixed(5));
    currentSample.lon = parseFloat(longitude.toFixed(5));
    currentSample.alt = altitude;
    currentSample.locAcc = parseFloat(accuracy.toFixed(5));
    currentSample.altAcc = parseFloat(altitudeAccuracy.toFixed(2));
    currentSample.speed = parseFloat(speed.toFixed(2));
    currentSample.timestamp = timestamp;

    if(!Titanium.Geolocation.hasCompass){
        currentSample.heading = Math.round(heading); // only use this if the device lacks a compass.
        updateHeadingLabel(heading);
        rotateCompass(heading);
    }
};


// logging methods:
function startLogging(restore) {
    if(restore == null) { restore = false; } // start a new log

    Ti.API.info("Inside the startLogging() method");
    Ti.API.info('Continue (restore) old log: '+restore);

    // (re)set variables for this new event
    // if something went wrong get out of here, don't start to logging timers
    if(!resetValues(restore)) { return false; }
    Ti.API.info('Returned from resetValues()');

    currentSample = {};
    currentSample.logID = logID;

    // store this eventid in the app properties
    Ti.App.Properties.setString('eventid',eventID);
    loggingState = true;
    
    // grab the current position and fill in the currentSample
    if (Titanium.Geolocation.locationServicesEnabled==true) {
        Ti.Geolocation.getCurrentPosition(function(e){updateLocationData(e);});
    }
    // the first few samples don't seem to have location data
    // does the first recording after the currentSample is cleared 
    // need to be delayed for a few moments to allow for a fix?
    loggingInterval = setInterval(recordSample,1000);

    // start a timer for the clock update
    clockInterval = setInterval(updateClock,1000);

    // disable the idle timer while logging
    Ti.App.idleTimerDisabled = true;

    Ti.API.info("Finished the startLogging() method");

    return true;
};

function stopLogging() {
    Ti.API.info('In the stopLogging method');
   
    // store this eventid in the app properties
    Ti.App.Properties.setString('eventid','');
    loggingState = false;
  
    clearInterval(loggingInterval);
    loggingInterval = 0;

    clearInterval(clockInterval);
    clockInterval = 0;
 
    // push the final samples to the server
    if(Ti.App.Properties.getBool('uploadEnabled',true)){
        try{
            win.sendBuffer({'docBuffer':uploadBuffer,
                        'eventID':eventID,
                        'deviceID':deviceID});
        } catch(err) {
            Ti.API.info('Error uploading the final buffer: ' + err.toLocaleString());
        }
    }

    // re-enable the idle timer:
    Ti.App.idleTimerDisabled = false;
};



// end logging methods//



// hack for the setting the value of the switch at launch
var switchFirstRun = true;

// use the compass for toggling the recording
loggingSwitch.addEventListener('change',function(e) {
    // just show an alert view for now
    var sw = e.source;

    // hack for setting the switch value at launch
    if(switchFirstRun) {
        switchFirstRun = false;
        return;
    }

    if(e.value == false && loggingState == true) { 
        // added the loggingState bit to help prevent a double alert 
        // when programatically setting the switch value to false 
        // (eg. in the event of an error)
        //
        // ask to stop logging
        var alertDialog = Titanium.UI.createAlertDialog({
            title: 'Stop Logging',
            message: 'Click OK to stop logging.',
            buttonNames: ['OK','Cancel']
        });
        alertDialog.addEventListener('click',function(e) {
            if(e.index == 0){ // 0: OK, 1: button2 (Cancel)
                stopLogging();
            } else {
                // the cancel button was pressed, restore the switch state
                sw.value = true;
            }
        });

        alertDialog.show();   
        // TODO: any post logging cleanup

    } else if(loggingState==false) { // don't start a new log if we're already logging
        Titanium.API.info("Logging switch activated");

        var logDB = Ti.Database.open("log.db");
        //Ti.API.info('Opened log.db in loggingSwitch()');

        var rows = logDB.execute('SELECT eventid,startdate FROM LOGMETA');
        //Ti.API.info('Queried LOGMETA for event list');

        var eventCount = rows.rowCount;

        rows.close();
        //Ti.API.info('Closed the resultSet in loggingSwitch. row count: '+eventCount);
        
        logDB.close();
        //Ti.API.info('Closed log.db');

        if(eventCount > 0) {
            //Ti.API.info('row count > 0');

            // there is at least one stored event, so prompt to continue it
            // TODO: use some logic on the startdate and current time to determine if we should prompt to continue.

            var alertDialog1 = Titanium.UI.createAlertDialog({
                title: 'Continue Log',
                message: 'Continue the previous log or begin new?',
                buttonNames: ['Continue','New']
            });
            alertDialog1.addEventListener('click',function(e,sw) {
                // here is where to parse the response
                //
                // If there was a problem with starting the log
                // indicate that it's not recording
                // TODO: i recall that there was a problem with the switch change event
                // causing trouble.
                //
                if(e.index == 0) {
                    // continue the previous log
                    var resultContinue = startLogging(true);
                    if(resultContinue == false) { sw.value = false; }
                } else {
                    // start a new log
                    var resultStart = startLogging(false);
                    if(resultStart == false) { sw.value = false; }
                }
            });

            alertDialog1.show();   
        } else {
            //Ti.API.info('row count <= 0. call startLogging() for a new event');
            // New event:
            var resultNew = startLogging();
            Ti.API.info('Result of startLogging(): '+ resultNew);
            if(!resultNew) { sw.value = false; }
        }

    }

});

//dashboardView.add(accuracyLabel);
dashboardView.add(accLabel);

dashboardView.add(lonLabel);
dashboardView.add(latLabel);

compassView.add(speedlabel);
compassView.add(speedUnitLabel);

compassView.add(headingLabel);
//compassView.add(headingAccuracyLabel);
compassView.add(cardinalLabel);

dashboardView.add(compassView);
dashboardView.add(consoleView);

dashboardView.add(loggingSwitch);
dashboardView.add(loggingLabel);

// don't think that audio recording is supported on android
if(Ti.Platform.name == 'iPhone OS') {
    dashboardView.add(audioLevelImage);
}

// add the changed objects to the current window
dashboardView.visible = true;
Ti.UI.currentWindow.add(dashboardView);



var reminderLabel = Ti.UI.createLabel({
    height:'auto',
    text:'Dashboard hidden.\nDouble-tap to display',
    color:'#aaa',
    textAlign:'center',
    //top:40,
    font:{fontSize:18,fontWeight:'bold'}
});
reminderLabel.hide();
win.add(reminderLabel);


// toggle the dashboard view transparency
// trying to save a bit of the battery by disabling the screen
// TODO: what about the tab bar?
function toggleDisplayVisibility (state) {
    // toggle if no input.
    if(state == null) {
        //Ti.API.info('Dashboard view visible: '+dashboardView.visible);
        state = !dashboardView.visible;
    }
    //Ti.API.info('Toggling dashboard visible: '+state);

    if(state == true) {
        reminderLabel.hide();
        win.backgroundColor = '#ccc';
        //dashboardView.show();
        var a1 = Titanium.UI.createAnimation({opacity:1.0,duration:300});
        dashboardView.animate(a1);
        dashboardView.show();
    } else if (state == false) {
        // add a label to indicate that the display is hidden
        reminderLabel.show();
        win.backgroundColor = '#000';
        //dashboardView.hide();
        var a2 = Titanium.UI.createAnimation({opacity:0,duration:300});
        a2.addEventListener('complete',function(){
            dashboardView.hide();
        });
        dashboardView.animate(a2);
    }
    //Ti.API.info('Finished toggling the dashboard visibility');
}

// toggle the display
//win.addEventListener('dblclick',function(e){
win.addEventListener('doubletap',function(e){
    //Ti.API.info('Double click on window');
    toggleDisplayVisibility();
    //Ti.API.info('Should have toggled the display');
});


function setUnits () {
    Ti.API.info('Setting units preferences.');

    // retrieve the unit preference
    // use inperial units by default
    if(Ti.App.Properties.getBool('useMetric',false)) {
        distanceUnits = "Kilometers";
        speedUnits = 'KPH';

        distanceUnitValue = 0.001; //m -> km
        speedUnitValue = 3.6; // m/s -> M/hr
    } else {
        distanceUnits = "Miles";
        speedUnits = 'MPH';

        //1 meter = 0.000621371192 miles
        distanceUnitValue = 0.000621371192; // m -> mile
        speedUnitValue = 2.236936; // m/s -> M/hr
    }

    // need to update all the labels which use these values
    updateSpeedLabel();
    speedUnitLabel.text = speedUnits;
    updateDistanceLabel();
    distanceUnitLabel.text = distanceUnits;
}

function floatToDB (level) {
    // AudioQueueLevelMeterState (iPhone)
    // convert the float value to DBFS:
    /*
    Using the natural log, ln, log base e:
    linear-to-db(x) = ln(x) / (ln(10) / 20)
    db-to-linear(x) = e^(x * (ln(10) / 20))

    Using the common log, log, log base 10:
    linear-to-db(x) = log(x) * 20
    db-to-linear(x) = 10^(x / 20)
    
    */ 
    return (20 * (Math.log(level / 1.0)/Math.LN10));
}

function DBFStoSPL (db) {
    // approximately convert dbfs to spl
    // estimate of spl (sound pressure level) conversion
    // dbspl(db) = 20*log10( (10^(db/10)/.000002))
    
    // I really don't know if this is calibrated to the iPhone mic
    // or if it's accurate at all.
    
    // I think this is the baseline for human hearing, but the iPhone is much more limited
    //return 20* (Math.log(Math.pow(10,(db/10))/0.000002)/Math.LN10);
    
    //return 20* (Math.log(Math.pow(10,(db/10))/0.0000035)/Math.LN10);
    
    // this *should* be normalized for a dBFS range of -60:0, 
    // and produce a dB SPL range of 0:120 
    return 20* (Math.log(Math.pow(10,(db/10))/0.000001)/Math.LN10);
}


function checkAudioLevels() {
	//var peak = Ti.Media.peakMicrophonePower;
	var peak = Ti.Media.averageMicrophonePower;
    if(peak == -1) {
        audioLevelLabel.text = 'Off';
    } else {
        //Ti.API.info('Mic level: '+peak);
        var dbfs = floatToDB(peak);
        var dbspl = DBFStoSPL(dbfs);

        //Ti.API.info('dBFS: '+dbfs);
        //Ti.API.info('dBSPL: '+dbspl);

        audioLevelLabel.text = Math.ceil(dbspl) + " dB";

        // store the audio levels
        currentSample.dbfs = parseFloat(dbfs.toFixed(1));
        currentSample.dbspl = parseFloat(dbspl.toFixed(1));

        // animate audio image
        // use a callback at the end to scale back
        // using 90 as a threshhold - busy street for dB (not dBFS)
        if(dbspl >= 90 && audioLevelImage.animating == false) {
            var t = Titanium.UI.create2DMatrix();
            t = t.scale(1.1 + ((dbspl-90)/20)); // scale relative to dbspl
            audioLevelImage.animate({transform:t, duration:100},function()
            {
                var t = Titanium.UI.create2DMatrix();
                audioLevelImage.animate({transform:t, duration:200});
            });
        }
    }
}

function setAudioMonitoring (state) {
    if(state == null) {
        state = Ti.App.Properties.getBool('monitorSound',true); // enable audio monitoring by default
    } else {
        Ti.App.Properties.setBool('monitorSound',state);
    }

    if(state == true) {
        Ti.Media.startMicrophoneMonitor();
        audioListenerInterval = setInterval(checkAudioLevels,300);
    } else {
        Ti.Media.stopMicrophoneMonitor();
        clearInterval(audioListenerInterval);
        audioListenerInterval = 0;

        // check one last time to trigger a -1 reading
        checkAudioLevels();
    }
}







// TODO: figure out how to move the geolocation and accelerometer stuff to another class
// for now, let's make this monolithic to get the ball rolling.
//
// geolocation:
//  SHOW CUSTOM ALERT IF DEVICE HAS GEO TURNED OFF
if (Titanium.Geolocation.locationServicesEnabled==false)
{
	Titanium.UI.createAlertDialog({title:'Location Service', message:'Your device has location services turned off - turn it on to continue.'}).show();
}
else
{
	// IF WE HAVE COMPASS GET THE HEADING
	if (Titanium.Geolocation.hasCompass)
	{
		//  TURN OFF ANNOYING COMPASS INTERFERENCE MESSAGE
		Titanium.Geolocation.showCalibration = false;

		// SET THE HEADING FILTER (THIS IS IN DEGREES OF ANGLE CHANGE)
		// EVENT WON'T FIRE UNLESS ANGLE CHANGE EXCEEDS THIS VALUE
		Titanium.Geolocation.headingFilter = 2;

		//  GET CURRENT HEADING - THIS FIRES ONCE
		Ti.Geolocation.getCurrentHeading(function(e)
		{
			if (e.error)
			{
				Titanium.API.info('error: ' + e.error);
				return;
			}
			var x = e.heading.x;
			var y = e.heading.y;
			var z = e.heading.z;
			var magneticHeading = e.heading.magneticHeading;
			var accuracy = e.heading.accuracy;
			var trueHeading = e.heading.trueHeading;
			var timestamp = e.heading.timestamp;

            updateHeadingLabel(trueHeading);
            rotateCompass(trueHeading);


			//currentHeading.text = 'x:' + x + ' y: ' + y + ' z:' + z;
			//Titanium.API.info('geo - current heading: ' + new Date(timestamp) + ' x ' + x + ' y ' + y + ' z ' + z);
		});

		//
		// EVENT LISTENER FOR COMPASS EVENTS - THIS WILL FIRE REPEATEDLY (BASED ON HEADING FILTER)
		//
		Titanium.Geolocation.addEventListener('heading',function(e)
		{
			if (e.error)
			{
				Titanium.API.info('error: ' + e.error);
				return;
			}

			var x = e.heading.x;
			var y = e.heading.y;
			var z = e.heading.z;
			var magneticHeading = e.heading.magneticHeading;
			var accuracy = e.heading.accuracy;
			var trueHeading = e.heading.trueHeading;
			var timestamp = e.heading.timestamp;
	        
            // if the accuracy is negative, then the heading is invalid
            // change the display to indicate this.
            // Color the heading label differently?
            
            // just trying something out with feedback
            // This isn't working, but seems correct.
            //var limitVibrate = false;
            // function timeoutVibration() {
            //     limitVibrate = false;
            // }           
            //if(!limitVibrate && trueHeading >=0 && trueHeading%90 < 10) {
            //    // vibrate the phone at cardinal points
            //    limitVibrate = true;
            //    Ti.API.info('Should have vibrated at '+trueHeading+' degrees');
            //    Titanium.Media.vibrate();	
            //    setTimeout(timeoutVibration,3000);
            //}

            currentSample.heading = Math.round(trueHeading);

            headingAccuracyLabel.text = accuracy;
            updateHeadingLabel(trueHeading);
            rotateCompass(trueHeading);

			//Titanium.API.info('geo - heading updated: ' + new Date(timestamp) + ' x ' + x + ' y ' + y + ' z ' + z);
		});
	}
	else
	{
		Titanium.API.info("No Compass on device");
	}

	//  SET ACCURACY - THE FOLLOWING VALUES ARE SUPPORTED
	//
	// Titanium.Geolocation.ACCURACY_BEST
	// Titanium.Geolocation.ACCURACY_NEAREST_TEN_METERS
	// Titanium.Geolocation.ACCURACY_HUNDRED_METERS
	// Titanium.Geolocation.ACCURACY_KILOMETER
	// Titanium.Geolocation.ACCURACY_THREE_KILOMETERS
	//
	Titanium.Geolocation.accuracy = Titanium.Geolocation.ACCURACY_BEST;

	//
	Titanium.Geolocation.distanceFilter = 1;


	// GET CURRENT POSITION - THIS FIRES ONCE
	Titanium.Geolocation.getCurrentPosition(function(e)
	{
        updateLocationData(e);	
			
/*        Titanium.Geolocation.reverseGeocoder(e.coords.latitude,e.coords.longitude,function(evt)*/
		//{
			//var places = evt.places;
			////reverseGeo.text = places[0].address;
			//Titanium.API.debug("reverse geolocation result = "+JSON.stringify(evt));
		/*});
*/
			
		//Titanium.API.info('geo - current location: ' + new Date(timestamp) + ' long ' + longitude + ' lat ' + latitude + ' accuracy ' + accuracy);
	});

	// EVENT LISTENER FOR GEO EVENTS - THIS WILL FIRE REPEATEDLY (BASED ON DISTANCE FILTER)
	Titanium.Geolocation.addEventListener('location',function(e)
	{
        updateLocationData(e);

        // TODO: fire this on a pretty slow timer?
        // and only after a previously successful return value
		// reverse geo
        /*
		Titanium.Geolocation.reverseGeocoder(e.coords.latitude,e.coords.longitude,function(evt)
		{
			var places = evt.places;
			//reverseGeo.text = places[0].address;
			Titanium.API.debug("reverse geolocation result = "+JSON.stringify(evt));
		});
		*/
		
		//Titanium.API.info('geo - location updated: ' + new Date(timestamp) + ' long ' + longitude + ' lat ' + latitude + ' accuracy ' + accuracy);
	});

	
}

// methods for the accelerometer
Titanium.Accelerometer.addEventListener('update',function(e)
{
    var acc = [e.x,e.y,e.z];

    // the android (G1) seems to report acceleration in m/s2
    // the iPhone reports this in g forces
    // 1g = -9.8m/s2
    if(Ti.Platform.name == 'android'){
        for(var i in acc){
            if(acc.hasOwnProperty(i)) {
                acc[i] = acc[i] / -9.8;
            }
        }
        //acc = div(acc,-9.8);
    };

    //var msg = "accelerometer - x:"+acc[0].toFixed(2)+",y:"+acc[1].toFixed(2)+",z:"+acc[2].toFixed(2); 
    // DEBUG: only for debugging the accelerometer
    //Ti.API.info(msg);
    //accLabel.text = msg;

    // update the force label with the total magnitude of the forces
    // is simple addition enough?
    // TODO: animate the force image on big hits
    //var mag = acc[0]+acc[1]+acc[2];
    var mag = Math.sqrt(acc[0]*acc[0]+acc[1]*acc[1]+acc[2]*acc[2]);
    if(mag == null) { mag = 0; }

    // Let the label lock to the triggered value during animation
    if(!forceImage.animating) {
       updateForceLabel(mag);
    }
	// animate force image
	// use a callback at the end to scale back
    //
    if(Math.abs(mag) > 1.5 && forceImage.animating == false) {
        var t = Titanium.UI.create2DMatrix();
        t = t.scale(Math.abs(mag));
        forceImage.animate({transform:t, duration:100},function()
        {
            var t = Titanium.UI.create2DMatrix();
            forceImage.animate({transform:t, duration:200});
        });
    }

    // add the readings to the current sample:
    var precision = 3;
    currentSample.accx = parseFloat(acc[0].toFixed(precision));
    currentSample.accy = parseFloat(acc[1].toFixed(precision));
    currentSample.accz = parseFloat(acc[2].toFixed(precision));
    currentSample.mag = parseFloat(mag.toFixed(precision));

    // TODO: big movements trigger an immediate recording
    // will this be instantaenous or will a historcal trend need to be recorded?
    // maybe calculate the magnitude of the vector of all three axes.
});



// Window event listener methods:



// set up a listener to act every time the window is loaded
win.addEventListener('focus',function() {
    //Ti.API.info('Dashboard focus event');
    setUnits();

    // set the audio monitoring state
    // iPhone only?
    if(Ti.Platform.name == 'iPhone OS') {
        setAudioMonitoring();
    } else {
        setAudioMonitoring(false);
    }
});

win.addEventListener('open',function() {
    // is this the first event to trigger?
    // if not, the setup needs to happen first.
    // maybe in app.js.
    //Ti.API.info('In the window open event. About to setup DB.');
    
    // this is done in the app.js file now.
    //setupDatabase();
    
    // check to see if the the event was open when the app quit
    var thisEventID = Ti.App.Properties.getString('eventid','');
    if(thisEventID != '') {
        if(Ti.App.Properties.getBool('autoResume',false) === false){
            var alertDialog = Ti.UI.createAlertDialog({
                title:'Restore Log',
                message:'A log may have been interrupted. Would you like to continue logging?',
                buttonNames:['OK','Cancel']
            });
            alertDialog.addEventListener('click',function(e){
                switch(e.index) {
                    case 0:
                        // continue log
                        startLogging(thisEventID);
                        loggingSwitch.value = true;
                        break;
                    case 1:
                        // do nothing, just remove the eventID
                        Ti.App.Properties.setString('eventid','');
                        break;
                    default:
                        // do nothing, just remove the eventID
                        Ti.App.Properties.setString('eventid','');
                }
            });

            alertDialog.show();
        } else {
            // continue log
            startLogging(thisEventID);
            loggingSwitch.value = true;
        }
    }
});


