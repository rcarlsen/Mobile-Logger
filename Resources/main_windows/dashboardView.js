Ti.include('../tools/json2.js');

var win1 = Ti.UI.currentWindow;

var loggingState = false; 
// toggle this when recording
// should this be a property, or something not tied to this class?


var dashboardView = Ti.UI.createView({
    size:{width:320,height:win1.getHeight()},
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
    top:10,right:10,
    value:false
});

var loggingLabel = Ti.UI.createLabel({
    top:10,
    height:'auto',
    textAlign:'right',
    text:'Logging Active:',
    color:'#333',
	font:{fontSize:16,fontFamily:'Helvetica Neue',fontWeight:'bold'}
});
if(Ti.Platform.name == 'iPhone OS'){
    loggingLabel.right = 10+100;
} else {
    loggingLabel.right = 10+60;
}


var accLabel = Ti.UI.createLabel({
    height:'auto',
    bottom:10,
    left:10,
    textAlign:'left',
    color:'#333',
	font:{fontSize:12,fontFamily:'Helvetica Neue',fontWeight:'bold'}
});

// using text in the canvas doesn't seem supported at the moment on mobile safari
// i can't determine if the TIUICanvas (listed in the bleeding edge code) has
// actually been implemented and/or is cross-platform.
var speedlabel = Titanium.UI.createLabel({
	color:'#333',
	text:'0.0',
	font:{fontSize:72,fontFamily:'Helvetica Neue',fontWeight:'bold'},
    textAlign:'center',
    height:'auto',
    top:120
});

var speedUnitLabel = Ti.UI.createLabel({
    color:'#333',
   	font:{fontSize:20,fontFamily:'Helvetica Neue',fontWeight:'bold'},
    textAlign:'center',
    height:'auto',
    top:200,
    text:'MPH'
});


var headingLabel = Ti.UI.createLabel({
    color:'#333',
   	font:{fontSize:20,fontFamily:'Helvetica Neue',fontWeight:'bold'},
    textAlign:'center',
    height:'auto',
    top:75,
    text:'000\u00B0' // this is the degree symbol
});
var headingAccuracyLabel = Ti.UI.createLabel({
    color:'#333',
    font:{fontSize:12,fontFamily:'Helvetica Neue'},
    textAlign:'center',
    height:'auto',
    top:95
});

var distanceLabel = Ti.UI.createLabel({
    color:'#333',
   	font:{fontSize:18,fontFamily:'Helvetica Neue',fontWeight:'bold'},
    textAlign:'center',
    height:'auto',
    top:240
});

//// Testing to see if the canvas view exists
//var canvas = Ti.UI.createCanvasView({});
//Ti.include("dashboard.js");
//var dash = new Dashboard(canvas.getContext());
//dashboardView.add(canvas);
//

var compass = Ti.UI.createImageView({
    url: '../images/compass.png',
    width:278,height:278,
    center:{x:160,y:180} // i think that x and y are transposed
});

// logging methods
var eventID;
var currentSample = new Object;
var loggingInterval = 0;
var logDB;

function startLogging() {
    Ti.API.info("Inside the startLogging() method");

    // open the database connection (create if necessary)
    logDB = Ti.Database.open("log.db");
    logDB.execute('CREATE TABLE IF NOT EXISTS LOGDATA  (ID INTEGER PRIMARY KEY, EVENTID TEXT, DATA TEXT)');
    logDB.close();

    // this isn't working for android
    // generate an eventID:
    //eventID = Titanium.Platform.createUUID();

    eventID = Titanium.Utils.md5HexDigest(new Date().toUTCString());


    // clear the current sample
    //currentSample = new Object;
    currentSample.eventID = eventID;
    loggingInterval = setInterval(recordSample,1000);

    // disable the idle timer while logging
    Ti.App.idleTimerDisabled = true;

    Ti.API.info("Finished the startLogging() method");
};

function stopLogging() {
    Ti.API.info('In the stopLogging method');
    clearInterval(loggingInterval);
    loggingInterval = 0;

   
    // re-enable the idle timer:
    Ti.App.idleTimerDisabled = false;
};

function recordSample() {
    // get the current time
    currentSample.timestamp = new Date().getTime();

    Titanium.API.info("Current sample recorded to db");
    Titanium.API.info(currentSample.toString());

    logDB = Ti.Database.open("log.db");
    logDB.execute('INSERT INTO LOGDATA VALUES(NULL,?,?)',eventID,JSON.stringify(currentSample));
    logDB.close();

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
            // here is where to parse the response
                // debugging
//                Titanium.API.debug(e);
//                statusLabel.text = 'event: '+e.index;
//                loggingState = false;

            if(e.index == 0){ // 0: OK, 1: button2 (Cancel)
                // TODO: implement some actual logic here
                loggingState = false;
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

        loggingState = true;
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

dashboardView.add(compass);

//// add the dashboard webview to the dashboard window
//var webview = Ti.UI.createWebView();
//webview.url = "dashboard.html";
//dashboardView.add(webview);
//

dashboardView.add(speedlabel);
dashboardView.add(speedUnitLabel);

dashboardView.add(headingLabel);
dashboardView.add(headingAccuracyLabel);

dashboardView.add(distanceLabel);
dashboardView.add(accLabel);

dashboardView.add(loggingSwitch);
dashboardView.add(loggingLabel);

// add the changed objects to the current window
Ti.UI.currentWindow.add(dashboardView);

function updateHeadingLabel(heading) {
    // this is needed to append the degree symbol to the heading label
    headingLabel.text = parseInt(heading) + "\u00B0";
}

function updateDistanceLabel(distance) {
    distanceLabel.text = parseFloat(distance).toFixed(2) + "m accuracy";
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
			Titanium.API.info('geo - current heading: ' + new Date(timestamp) + ' x ' + x + ' y ' + y + ' z ' + z);
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
            
            headingAccuracyLabel.text = accuracy;
            updateHeadingLabel(trueHeading);
            rotateCompass(trueHeading);

			Titanium.API.info('geo - heading updated: ' + new Date(timestamp) + ' x ' + x + ' y ' + y + ' z ' + z);
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
		if (e.error)
		{
			Titanium.API.info('error: ' + JSON.stringify(e.error));
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

//		currentLocation.text = 'long:' + longitude + ' lat: ' + latitude;
		
		Titanium.API.info('geo - current location: ' + new Date(timestamp) + ' long ' + longitude + ' lat ' + latitude + ' accuracy ' + accuracy);
	});

	//
	// EVENT LISTENER FOR GEO EVENTS - THIS WILL FIRE REPEATEDLY (BASED ON DISTANCE FILTER)
	//
	Titanium.Geolocation.addEventListener('location',function(e)
	{
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
        updateDistanceLabel(accuracy);
        speedlabel.text = (2.236936 * Math.max(0,speed)).toFixed(1); // m/s -> M/hr

        // update the current sample object with the new data:
        currentSample.lat = latitude;
        currentSample.lon = longitude;
        currentSample.alt = altitude;
        currentSample.locAcc = accuracy;
        currentSample.altAcc = altitudeAccuracy;
        currentSample.speed = speed;
        currentSample.timestamp = timestamp;
        currentSample.heading = heading; // TODO: use the heading from the heading callback.


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
		Titanium.API.info('geo - location updated: ' + new Date(timestamp) + ' long ' + longitude + ' lat ' + latitude + ' accuracy ' + accuracy);
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
            acc[i] = acc[i] / -9.8;
        }
        //acc = div(acc,-9.8);
    };

    var msg = "accelerometer - x:"+acc[0].toFixed(2)+",y:"+acc[1].toFixed(2)+",z:"+acc[2].toFixed(2); 
    accLabel.text = msg;

    // add the readings to the current sample:
    var precision = 3;
    currentSample.accx = parseFloat(acc[0].toFixed(precision));
    currentSample.accy = parseFloat(acc[1].toFixed(precision));
    currentSample.accz = parseFloat(acc[2].toFixed(precision));

    // TODO: big movements trigger an immediate recording
    // will this be instantaenous or will a historcal trend need to be recorded?
    // maybe calculate the magnitude of the vector of all three axes.
});


