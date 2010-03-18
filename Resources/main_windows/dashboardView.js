// include files
Ti.include('../tools/json2.js');
Ti.include('../tools/util.js');

// reference the parent window
var win = Ti.UI.currentWindow;

/*// toggle the display*/
//win.addEventListener('twofingertap',function(e){
    //toggleDisplayVisibility();
/*});*/

// set up some instance vars:
var loggingState = false; // toggle this when recording
// should this be a property, or something not tied to this class?

var eventID;
var currentSample = new Object();
var loggingInterval = 0;
var logDB;

var eventDistance = 0;
var eventStartDate;
var clockInterval = 0;
var audioListenerInterval = 0;

var distanceUnits = "Miles";
// end instance vars //

var dashboardView = Ti.UI.createView({
    size:{width:320,height:win.getHeight()},
    backgroundColor:'#ccc',
    top:0,bottom:0
});


//var statusLabel = Ti.UI.createLabel({
//    top:10,
//    left:10,
//    text:'status messages'
//});
//
//dashboardView.add(statusLabel);


// toggle switch for enabling logging
var loggingSwitch = Titanium.UI.createSwitch({
    top:30,right:10,
    value:false
});

var loggingLabel = Ti.UI.createLabel({
    top:5,
    right:10,
    height:'auto',
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
    height:'auto',
    top:10,
    left:10,
    textAlign:'left',
    color:'#333',
	font:{fontSize:10,fontFamily:'Helvetica Neue',fontWeight:'bold'}
});

// using text in the canvas doesn't seem supported at the moment on mobile safari
// i can't determine if the TIUICanvas (listed in the bleeding edge code) has
// actually been implemented and/or is cross-platform.
var speedlabel = Titanium.UI.createLabel({
	color:'#333',
	text:'0.0',
	font:{fontSize:64,fontFamily:'Helvetica Neue',fontWeight:'bold'},
    textAlign:'center',
    height:'auto',
    top:60
});

var speedUnitLabel = Ti.UI.createLabel({
    color:'#333',
   	font:{fontSize:22,fontFamily:'Helvetica Neue',fontWeight:'bold'},
    textAlign:'center',
    height:'auto',
    top:125,
    text:'MPH'
});


var headingLabel = Ti.UI.createLabel({
    color:'#333',
   	font:{fontSize:24,fontFamily:'Helvetica Neue',fontWeight:'bold'},
    textAlign:'center',
    height:'auto',
    top:20,
    text:'000\u00B0' // this is the degree symbol
});

// TODO: remove, this is only for debugging:
var headingAccuracyLabel = Ti.UI.createLabel({
    color:'#333',
    font:{fontSize:12,fontFamily:'Helvetica Neue'},
    textAlign:'center',
    height:'auto',
    top:45
});

var accuracyLabel = Ti.UI.createLabel({
    color:'#333',
   	font:{fontSize:18,fontFamily:'Helvetica Neue',fontWeight:'bold'},
    textAlign:'center',
    height:'auto',
    bottom:120
});

//// Testing to see if the canvas view exists
//var canvas = Ti.UI.createCanvasView({});
//Ti.include("dashboard.js");
//var dash = new Dashboard(canvas.getContext());
//dashboardView.add(canvas);
//

var compassView = Ti.UI.createView({
    width:320,height:200,
    center:{x:160,y:160},
    left:0,top:65
});

var compass = Ti.UI.createImageView({
    url: '../images/small-compass-shadow.png',
    width:200,height:200,
    top:0,
    //center:{x:160,y:0} // this should be relative to the parent view. i think that x and y are transposed
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
compassView.add(locationView);


var consoleView = Ti.UI.createView({
   width:320,height:'auto',
   left:0,bottom:0
});

var consoleImage = Ti.UI.createImageView({
    url:'../images/bottom.png',
    width:320,height:82,
    bottom:0
});

var forceImage = Ti.UI.createImageView({
    url:'../images/blue-circle.png',
    width:62,height:62,
    bottom:48
});

var forceLabel = Ti.UI.createLabel({
    height:'auto',
    textAlign:'center',
    text:'0.0 g',
    color:'#333',
    font:{fontSize:12,fontFamily:'Helvetica Neue',fontWeight:'bold'}
});
forceImage.add(forceLabel);


// add a duration label
var durationLabel = Ti.UI.createLabel({
    text:'0:00',
    height:'auto',
    textAlign:'left',
    color:'#333',
    font:{fontSize:32,fontFamily:'Helvetica Neue',fontWeight:'bold'}
});
durationLabel.left = 10;

var durationUnitLabel = Ti.UI.createLabel({
    text:'Duration',
    height:'auto',
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
    height:'auto',
    textAlign:'right',
    color:'#333',
    font:{fontSize:32,fontFamily:'Helvetica Neue',fontWeight:'bold'}
});
distanceLabel.right = 10;

var distanceUnitLabel = Ti.UI.createLabel({
    text:distanceUnits,
    height:'auto',
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
    url:'../images/orange-circle.png',
    width:62,height:62,
    //center:{x:160,y:0},
    top:-31
});

var audioLevelLabel = Ti.UI.createLabel({
    bottom:15,
    height:'auto',
    textAlign:'center',
    text:'Off',
    color:'#333',
    font:{fontSize:12,fontFamily:'Helvetica Neue',fontWeight:'bold'}

});
audioLevelImage.add(audioLevelLabel);


function resetValues () {
    // reset the necessary ivars
    currentSample = new Object();
    eventDistance = 0;
    eventStartDate = new Date();
    eventID = Titanium.Utils.md5HexDigest(eventStartDate.toUTCString());
}

// logging methods
function startLogging() {
    Ti.API.info("Inside the startLogging() method");

    // TODO: this method should populate a new row in the meta table
    // this table will contain the eventID, startdate/time, tags, notes, userID, et al.
    // the logdata table contain the actual samples, using a primary key...perhaps the eventID?
    // or this could be done traditionally, with a lookup.

    // open the database connection (create if necessary)
    logDB = Ti.Database.open("log.db");
    logDB.execute('CREATE TABLE IF NOT EXISTS LOGDATA  (ID INTEGER PRIMARY KEY, EVENTID TEXT, DATA TEXT)');
    logDB.close();

    // (re)set variables for this new event
    resetValues();
    currentSample.eventID = eventID;

    loggingState = true;
    
    // grab the current position and fill in the currentSample
    if (Titanium.Geolocation.locationServicesEnabled==true) {
        Ti.Geolocation.getCurrentPosition(function(e){updateLocationData(e);});
    }

    loggingInterval = setInterval(recordSample,1000);

    // start a timer for the clock update
    clockInterval = setInterval(updateClock,1000);

    // disable the idle timer while logging
    Ti.App.idleTimerDisabled = true;

    Ti.API.info("Finished the startLogging() method");
};

function stopLogging() {
    Ti.API.info('In the stopLogging method');
    
    loggingState = false;
  
    clearInterval(loggingInterval);
    loggingInterval = 0;

    clearInterval(clockInterval);
    clockInterval = 0;
  
    // re-enable the idle timer:
    Ti.App.idleTimerDisabled = false;
};

function recordSample() {
    // get the current time
    currentSample.timestamp = new Date().getTime();

    Titanium.API.info("Current sample recorded to db");
    Titanium.API.info('Time: '+currentSample.timestamp);

    logDB = Ti.Database.open("log.db");
    logDB.execute('INSERT INTO LOGDATA VALUES(NULL,?,?)',eventID,JSON.stringify(currentSample));
    logDB.close();

    // pulse red while recording
    animateLocationView();

//  this is neat, but it messes up the rotation animation
//  the heartbeat animation would be great for another widget.
//	// animate compass
//	var t = Titanium.UI.create2DMatrix();
//	t = t.scale(1.1);
//	compass.animate({transform:t, duration:100},function()
//	{
//		var t = Titanium.UI.create2DMatrix();
//		compass.animate({transform:t, duration:200});
//	});
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

    if(e.value == false) {
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
        startLogging();

        // prompt to begin logging
        // TODO: check if there is a recent log and ask to extend that log.
/*        var alertDialog1 = Titanium.UI.createAlertDialog({*/
            //title: 'Enable Logging',
            //message: 'Click ok to begin logging.',
            //buttonNames: ['OK','Cancel']
        //});
        //alertDialog1.addEventListener('click',function(e,sw) {
            //// here is where to parse the response
                //// debugging
                ////Titanium.API.debug(e);
                ////statusLabel.text = 'event: '+e.index;
                ////loggingState = true;

            //if(e.index == 0) {
                //// TODO: implement actual logic here
                //loggingState = true;
            //} else {
                //// the cancel button was pressed, restore the button state
                //sw.value = false;
            //}
        //});

        /*alertDialog1.show();   */
    }

});

dashboardView.add(accuracyLabel);
dashboardView.add(accLabel);

compassView.add(speedlabel);
compassView.add(speedUnitLabel);

compassView.add(headingLabel);
compassView.add(headingAccuracyLabel);

dashboardView.add(compassView);
dashboardView.add(consoleView);

dashboardView.add(loggingSwitch);
dashboardView.add(loggingLabel);

dashboardView.add(audioLevelImage);

// add the changed objects to the current window
Ti.UI.currentWindow.add(dashboardView);

function updateSpeedLabel (speed) {
    speedlabel.text = (2.236936 * Math.max(0,speed)).toFixed(1); // m/s -> M/hr
}

function updateHeadingLabel(heading) {
    // this is needed to append the degree symbol to the heading label
    headingLabel.text = parseInt(heading) + "\u00B0";
}

function updateAccuracyLabel(meters) {
    accuracyLabel.text = parseFloat(meters).toFixed(2) + "m accuracy";
}

function updateForceLabel (force) {
    forceLabel.text = parseFloat(force).toFixed(1) + 'g';
}

// simple padding function
function pad2(number) {
     return (number < 10 ? '0' : '') + number   
}


function updateClock() {
    // use the recorded start time and current time to set a clock display
    var currentTime = new Date().getTime();
    var duration = currentTime - eventStartDate.getTime(); // millis

    var hour = Math.floor(duration / 1000 / 60 / 60);
    var min = Math.floor(duration / 1000 / 60) % 60;
    var sec = Math.floor(duration / 1000) % 60;

    durationLabel.text = (hour > 0 ? hour +':' : '') + (hour > 0 ? pad2(min) : min) +':'+ pad2(sec);
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

// toggle the dashboard view transparency
// trying to save a bit of the battery by disabling the screen
// TODO: what about the tab bar?
function toggleDisplayVisibility (state) {
    // toggle if no input.
    if(state == null) {
        state = !dashboardView.visible;
    }

    if(state === true) {
        dashboardView.show();
    } else if (state === false) {
        dashboardView.hide();
    }

}

// testing
var dummyDistIncrementInterval;
//dummyDistIncrementInterval = setInterval(dummyDist,1000);
function dummyDist() {
    updateDistanceLabel(1);
}

function updateDistanceLabel (delta) {
    // expects a ivar with the current distance
    eventDistance += delta;

    Ti.API.info('Distance delta: '+delta);
    Ti.API.info('Event distance: '+eventDistance);

    // convert the meters to an appropriate display unit. (miles only for now)
    // 1 meter = 0.000621371192 miles
    var displayDistance = eventDistance * 0.000621371192; // miles
    //var displayDistance = eventDistance;

    Ti.API.info('Display distance: '+displayDistance);
    distanceLabel.text = parseFloat(displayDistance).toFixed(2);
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

// Enable audio monitoring by default
// TODO: add a user preference and store it as a property
// iPhone only?
if(Ti.Platform.name == 'iPhone OS') {
    setAudioMonitoring(true);
}

function rotateCompass(degrees) {
// cloud 1 animation/transform
	// don't interrupt the current animation
    if(compass.animating) {return;}
    
    var t = Ti.UI.create2DMatrix();
	t = t.rotate(360-parseFloat(degrees));

	var a = Titanium.UI.createAnimation();
	a.transform = t;
	a.duration = 100;
	a.autoreverse = false;
	//a.repeat = 0;
	compass.animate(a); // TODO: rotate a compass widget instead
}


// TODO: figure out how to move the geolocation and accelerometer stuff to another class
// for now, let's make this monolithic to get the ball rolling.
//
// geolocation:
//
//  SHOW CUSTOM ALERT IF DEVICE HAS GEO TURNED OFF
//
if (Titanium.Geolocation.locationServicesEnabled==false)
{
	Titanium.UI.createAlertDialog({title:'Location Service', message:'Your device has location services turned off - turn it on to continue.'}).show();
}
else
{
	//
	// IF WE HAVE COMPASS GET THE HEADING
	//
	if (Titanium.Geolocation.hasCompass)
	{
		//
		//  TURN OFF ANNOYING COMPASS INTERFERENCE MESSAGE
		//
		Titanium.Geolocation.showCalibration = false;

		//
		// SET THE HEADING FILTER (THIS IS IN DEGREES OF ANGLE CHANGE)
		// EVENT WON'T FIRE UNLESS ANGLE CHANGE EXCEEDS THIS VALUE
		Titanium.Geolocation.headingFilter = 2;

		//
		//  GET CURRENT HEADING - THIS FIRES ONCE
		//
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

//			updatedHeading.text = 'x:' + x + ' y: ' + y + ' z:' + z;
//			updatedHeadingTime.text = 'timestamp:' + new Date(timestamp);
//			updatedHeading.color = 'red';
//			updatedHeadingTime.color = 'red';
//			setTimeout(function()
//			{
//				updatedHeading.color = '#444';
//				updatedHeadingTime.color = '#444';
//				
//			},100);
	        
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

	//
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
	//  SET DISTANCE FILTER.  THIS DICTATES HOW OFTEN AN EVENT FIRES BASED ON THE DISTANCE THE DEVICE MOVES
	//  THIS VALUE IS IN METERS
	//
	Titanium.Geolocation.distanceFilter = 1;

	//
	// GET CURRENT POSITION - THIS FIRES ONCE
	//
	Titanium.Geolocation.getCurrentPosition(function(e)
	{
        updateLocationData(e);	
		
		//Titanium.API.info('geo - current location: ' + new Date(timestamp) + ' long ' + longitude + ' lat ' + latitude + ' accuracy ' + accuracy);
	});

	//
	// EVENT LISTENER FOR GEO EVENTS - THIS WILL FIRE REPEATEDLY (BASED ON DISTANCE FILTER)
	//
	Titanium.Geolocation.addEventListener('location',function(e)
	{
        updateLocationData(e);

//		updatedLocation.text = 'long:' + longitude;
//		updatedLatitude.text = 'lat: '+ latitude;
//		updatedLocationAccuracy.text = 'accuracy:' + accuracy;
//		updatedLocationTime.text = 'timestamp:' +new Date(timestamp);
//
//		updatedLatitude.color = 'red';
//		updatedLocation.color = 'red';
//		updatedLocationAccuracy.color = 'red';
//		updatedLocationTime.color = 'red';
//		setTimeout(function()
//		{
//			updatedLatitude.color = '#444';
//			updatedLocation.color = '#444';
//			updatedLocationAccuracy.color = '#444';
//			updatedLocationTime.color = '#444';
//			
//		},100);
		
//		// reverse geo
//		Titanium.Geolocation.reverseGeocoder(latitude,longitude,function(evt)
//		{
//			var places = evt.places;
//			reverseGeo.text = places[0].address;
//			Titanium.API.debug("reverse geolocation result = "+JSON.stringify(evt));
//		});
//		
//		
		//Titanium.API.info('geo - location updated: ' + new Date(timestamp) + ' long ' + longitude + ' lat ' + latitude + ' accuracy ' + accuracy);
	});

	
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

    // calculate distance travelled.
    // TODO: filter out small changes to minimize cumulative errors?

    // only calculate distance if logging is enabled
    // DEBUG: update all the time for testing.
    if(loggingState == true && (currentSample.lon && currentSample.lat)) {
        var dist = calculateDistanceDelta({lon:currentSample.lon,lat:currentSample.lat},
                                          {lon:longitude,lat:latitude});
        Ti.API.info('Sample distance: '+dist);
        
        // distance display never updated.
        // Update: distance display seems to only show the delta
        // rather than the accumulated distance.
        if(Math.abs(dist) > 0.0) {
            updateDistanceLabel(dist);
        }
    }

    // can safely limit the precision of the location data
    // places   degrees distance
    // 3	    0.001	111 m
    // 4	    0.0001	11.1 m
    // 5	    0.00001	1.11 m
    // 
    // update the current sample object with the new data:
    currentSample.lat = latitude.toFixed(5);
    currentSample.lon = longitude.toFixed(5);
    currentSample.alt = altitude;
    currentSample.locAcc = accuracy.toFixed(5);
    currentSample.altAcc = altitudeAccuracy.toFixed(2);
    currentSample.speed = speed;
    currentSample.timestamp = timestamp;
    currentSample.heading = heading; // TODO: use the heading from the heading callback.
};

// methods for the accelerometer
Titanium.Accelerometer.addEventListener('update',function(e)
{
    var acc = [e.x,e.y,e.z];

    // the android (G1) seems to report acceleration in m/s2
    // the iPhone reports this in g forces
    // 1g = -9.8m/s2
    if(Ti.Platform.name == 'android'){
        for(var i in acc){
            acc[i] = acc[i] / -9.8;
        }
        //acc = div(acc,-9.8);
    };

    var msg = "accelerometer - x:"+acc[0].toFixed(2)+",y:"+acc[1].toFixed(2)+",z:"+acc[2].toFixed(2); 
    // DEBUG: only for debugging the accelerometer
    //accLabel.text = msg;

    // update the force label with the total magnitude of the forces
    // is simple addition enough?
    // TODO: animate the force image on big hits
    //var mag = acc[0]+acc[1]+acc[2];
    var mag = Math.sqrt(acc[0]*acc[0]+acc[1]*acc[1]+acc[2]*acc[2]);


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
    currentSample.mag = mag.toFixed(precision);

    // TODO: big movements trigger an immediate recording
    // will this be instantaenous or will a historcal trend need to be recorded?
    // maybe calculate the magnitude of the vector of all three axes.
});


