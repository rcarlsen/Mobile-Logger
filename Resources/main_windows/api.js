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

// api for uploading samples to the database
// need to generate a post request with the data to send (json)
// get the database from the properties
//

// conduit for messages
// expecting that the app will attach the progress meter to it.
var _api = {};
function api() {
    return _api;
}


function uploadSample (sample) {
    if(sample == null) { return; }

    var xhr = Titanium.Network.createHTTPClient();
    xhr.onload = function()
    {
        //Ti.API.info('POSTed sample: '+JSON.stringify(sample));
        //Ti.API.info('With response: '+this.responseText);
        return this.responseText;
    };
    xhr.onerror = function()
    {
        Ti.API.info('Upload error: '+this.responseText);
        return this.responseText;
    };
    // TODO: get the url from the properties
    xhr.open("POST","http://mobilelogger.robertcarlsen.net/api/addSample");
    xhr.send("data="+JSON.stringify(sample));
}


/*
var progress;
var cancel;
function bulkUploadBatch (samples) {
    if(samples == null || samples.length == 0) { return; }
    
    Ti.API.info('cancel status in bulkUpload: '+cancel);

// how do we create an event callback here?
// the idea is that we send batches of samples to the server
// and after every batch we issue a callback to let the 
// device update the display


// from a functional standpoint, this will have to be several
// http requests won't it? Loop thru all the elements?

    var range = {index: 0, length: 100};
    if(range.length > samples.length) {range.length = samples.length;}

    // start the progress meter
    if(progress == null) {
        cancel = false;
        progress = samples.length;

        Ti.API.info('About to tell app to create a new progress bar');
        Ti.UI.currentWindow.fireEvent('uploadProgress',{value:0});
    }

    // var xhr = Titanium.Network.createHTTPClient();
    xhr.onload = function()
    {
        Ti.API.info('cancel status in onload function: '+cancel);

        if(cancel) {
            Ti.UI.currentWindow.fireEvent('uploadProgress',{value:-1});
            progress = null;
            return 'Cancelled by user';
        }
        
        //Ti.API.info('POSTed samples: '+JSON.stringify(sample));
        //Ti.API.info('With response: '+this.responseText);

        //TODO: the response is an array of the new doc ids
        //we need to store those docs ids to prevent duplicate doc
        //
        // this is where a new upload needs to occur
        // TODO: evaluate if this method is highly wasteful of memory
        //
        var pmeter = 1-(samples.length/progress);
        Ti.API.info('Upload pogress in bulkUpload(): '+pmeter);

        Ti.UI.currentWindow.fireEvent('uploadProgress',{value:pmeter});

        if(samples.length > range.length) {
            bulkUploadBatch(samples.slice(range.length-1));
        }
        else {
            // done with the upload
            Ti.UI.currentWindow.fireEvent('uploadProgress',{value:1.0});
            progress = null;
        }

        return this.responseText;
    };
    xhr.onerror = function()
    {
        Ti.UI.currentWindow.fireEvent('uploadProgress',{value:-1});
        progress = null;

        Ti.API.info('Upload error: '+this.responseText);
        return this.responseText;
    };
    // TODO: get the url from the properties
    // TODO: what's the array split/subarray command?
    var out = {docs:samples.slice(range.index,range.length)};

    xhr.open("POST","http://mobilelogger.robertcarlsen.net/api/addSamples");
    xhr.send("data="+JSON.stringify(out));
}
*/

function makeGoogleFusionAuthRequest(callback) {
    // make an auth request:
    var authXhr = Ti.Network.createHTTPClient();
    authXhr.onerror = function(e) {
        Ti.API.info("auth error: "+e.responseText);
    };

    authXhr.onload = function(e) {
        //Ti.API.info("auth xhr finished: "+authXhr.responseText);
        
        var statusCode = authXhr.status;
        if(statusCode == 200) {
            // success, store the token and make the real call:
            var tokens = authXhr.responseText.split("\n");
            for (var c=0;c<tokens.length;c++)
            {
                var token = tokens[c];
                var kv = token.split("=");
                if (kv[0]=='Auth') {
                    var authHeader = "GoogleLogin auth="+kv[1];
                    Ti.App.Properties.setString('googleClientLoginAuth',authHeader);
                    Ti.API.info("wrote auth header to properties: "+authHeader);

                    // Finally got a valid token, now make the actual request:
                    if (callback != null && callback.hasOwnProperty('makeRequest')) {
                        callback.makeRequest();
                    }
                    break;
                }
            }
        }
        else {
            // there was an error
            // TODO: alert the user
            Ti.API.info("There was an auth request error: "+authXhr.responseText);
            
            // clear the previous session auth header:
            Ti.App.Properties.setString('googleClientLoginAuth','');
        }
    };

    var payload = [
        "Email="+Ti.App.Properties.getString('googleUsername'),
        "Passwd="+Ti.App.Properties.getString('googlePassword'),
        "service="+"fusiontables",
        "source=MobileLogger"
    ];

    authXhr.open("POST","https://www.google.com/accounts/ClientLogin");
    authXhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    
    var payloadString = payload.join('&');
    //Ti.API.info(payloadString);
    authXhr.send(payloadString);
}


function createFusionTable(tableName, callback) {
    if(tableName == null || tableName == '') {
        tableName = "Mobile Logger";
    }

    // create a new table and reture the table id?
    // store it in the properties?
    //
    // syntax:
    // sql=CREATE TABLE SaleInformation (customer: NUMBER, memo: STRING, 'sale location': LOCATION, 'time of sale': DATETIME)

    var my = this;
    this._xhr = Titanium.Network.createHTTPClient();
    
    my._xhr.onload = function(e)
    {
        Ti.API.info('Create table success: '+my._xhr.responseText);

        // this is where we should get the tableid.
        var r = my._xhr.responseText.split('\n');
        if(r.length > 1) {
            var tableID = r[1];
            if(!isNaN(tableID)) { 
                Ti.App.Properties.setInt('googleFusionTableID',tableID);
                Ti.API.info('just set the fusion table id to: ' +tableID);

                if(callback != null) {
                    // kick off the upload
                    callback();
                }
            }
        }
        
        return my._xhr.responseText;
    };

    my._xhr.onerror = function(e)
    {
        Ti.API.info('Create table status: '+ my._xhr.status +' error: '+my._xhr.responseText);
        return my._xhr.responseText;
    };


    this.makeRequest = function() {
         var headers = [
         'logID: STRING',
         'accx: NUMBER',
         'accy: NUMBER',
         'accz: NUMBER',
         'mag: NUMBER',
         'lat: LOCATION',
         'lon: NUMBER',
         'alt: NUMBER',
         'locAcc: NUMBER',
         'altAcc: NUMBER',
         'speed: NUMBER',
         'timestamp: DATETIME',
         'heading: NUMBER',
         'eventID: STRING',
         'deviceID: STRING',
         'dbfs: NUMBER', 
         'dbspl: NUMBER' //,
         //'LATLON: LOCATION'
         ];

        var sqlQuery="sql="+encodeURIComponent("CREATE TABLE '"+tableName+"' ("+headers.join(', ')+")");
        Ti.API.info(sqlQuery);
        
        my._xhr.open("POST","https://www.google.com/fusiontables/api/query");
        my._xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
        my._xhr.setRequestHeader('Authorization',Ti.App.Properties.getString('googleClientLoginAuth'));

        my._xhr.send(sqlQuery);
    };

    if(Ti.App.Properties.getString('googleClientLoginAuth') == '') {
        makeGoogleFusionAuthRequest(this);
    }
    else {
        my.makeRequest();
    }
}


function packageFusionTablesRequest(samples) {
    if(samples == null || samples.length == 0) { return; }

    // test table id:
    var tableID = Ti.App.Properties.getInt('googleFusionTableID',456504); // this default is the sandbox, public table.
 
    // build the insert sql statement
    var statements = [];
    

    var headers = ['logID', 'accx', 'accy', 'accz', 'mag', 'lat', 'lon', 'alt', 'locAcc', 'altAcc', 'speed', 'timestamp', 'heading', 'eventID', 'deviceID','dbfs', 'dbspl'];//,'LATLON'];
    var rows = [];
    for (var i = 0; i < samples.length; i++) {
      var thisRow = []; for(var h in headers) {thisRow.push("''");} // this feels dirty, but want to ensure that all rows have values.

      for(var datum in samples[i]) {
          if(samples[i].hasOwnProperty(datum)) {
                if(datum == '_id') { continue; }

                // add this data type to the index
                var index = headers.indexOf(datum);
                if(index == -1){
                    headers.push(datum);
                    index = headers.indexOf(datum);
                }

                // respect the user preference to omit the device ID
                if(datum == 'deviceID' && Ti.App.Properties.getBool('omitDeviceID',false)) {
                    thisRow[index] = -1;
                } else {
                    // wrap strings in single quotes:
                    if(isNaN(samples[i][datum])) {
                        thisRow[index] = "'"+samples[i][datum]+"'";
                    }
                    else {
                        thisRow[index] = samples[i][datum];
                    }
                }
          }
      }
    
      // // construct the location column
      // thisRow[headers.indexOf('LATLON')] = samples[i].lat +','+ samples[i].lon;

      // add this row to the output
      rows.push(thisRow.join(', '));  
    }
    //Ti.API.info(rows);

    for(var r=0; r<rows.length; r++) {
        statements.push("INSERT INTO "+tableID+" ("+headers.join(', ')+") VALUES ("+rows[r]+")");
    }

    return statements;
}


function packageFusionTablesMetaData(_data) {
    // expects an object from the Meta table.
    if(_data == null || _data.length == 0) { return; }

    // test table id:
    var tableID = Ti.App.Properties.getInt('googleFusionTableIndexID',482710); // this default is the sandbox, public table.
 
    // description, startdate, eventID, route (kml LineString)
    // <LineString>
    // <coordinates> lng,lat[,alt] lng,lat[,alt] ... </coordinates>
    // </LineString>
    // 
    var routeData = [];
    for (var i = 0; i < _data.samples.length; i++) {
        var sample = _data.samples[i];
        var thisData = [];
        if(sample.hasOwnProperty('lat') && sample.hasOwnProperty('lon')) {
            thisData.push(sample.lon);
            thisData.push(sample.lat);
        }
        if(sample.hasOwnProperty('alt')) { thisData.push(sample.alt); }

        routeData.push(thisData.join(','));
    }

    var kmlString = '<LineString><coordinates> '+routeData.join(' ')+' </coordinates></LineString>';
    var statement = 'INSERT INTO '+tableID+" ( description, startdate, eventID, route ) VALUES ( '"+_data.description+"', "+_data.startdate+", '"+_data.eventID+"', '"+kmlString+"' )";
    
    //Ti.API.info(statement);

    return statement;
}

function makeFusionTablesMetaRequest(_sql, callback) {
    var my = this;
    this._xhr = Titanium.Network.createHTTPClient();
    
    my._xhr.onload = function(e)
    {
        Ti.API.info('Send meta data success: '+my._xhr.responseText);
        if(callback != null) {
            callback();
        }
        
        return my._xhr.responseText;
    };

    my._xhr.onerror = function(e)
    {
        Ti.API.info('Send meta data status: '+ my._xhr.status +' error: '+my._xhr.responseText);
        return my._xhr.responseText;
    };

    this.makeRequest = function() {
        var sqlQuery="sql="+encodeURIComponent(_sql);
        //Ti.API.info(sqlQuery);
        
        my._xhr.open("POST","https://www.google.com/fusiontables/api/query",false); // #dev synchronous request here
        my._xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
        my._xhr.setRequestHeader('Authorization',Ti.App.Properties.getString('googleClientLoginAuth'));

        my._xhr.send(sqlQuery);
    };

    if(Ti.App.Properties.getString('googleClientLoginAuth') == '') {
        makeGoogleFusionAuthRequest(this);
    }
    else {
        my.makeRequest();
    }

}


var cancel;
function bulkUpload (samples) {
    if(samples == null || samples.length == 0) { return; }
    
    // start the progress meter
    //Ti.API.info('About to tell app to create a new progress bar');
    //Ti.UI.currentWindow.fireEvent('uploadProgress',{value:0});
    this._xhr = Titanium.Network.createHTTPClient();
    var my = this;
    
    my._xhr.onload = function(e)
    {
        // hack to clear a bad session token:
        if(my._xhr.status != 200) {
            // clear the previous session auth header:
            Ti.API.info("Clearing the the Google token. Status: "+my._xhr.status);
            Ti.App.Properties.setString('googleClientLoginAuth','');
        }

        // done with the upload
        //Ti.UI.currentWindow.fireEvent('uploadProgress',{value:1.0});
        Ti.API.info("Upload finished: "+my_xhr.responseText);
        return e.responseText;
    };
    my._xhr.onerror = function(e)
    {
        //Ti.UI.currentWindow.fireEvent('uploadProgress',{value:-1});

        Ti.API.info('Upload error: '+JSON.stringify(e));
        //Ti.API.info('Upload error: '+e.responseText);
        return e.responseText;
    };

    my._xhr.onsendstream = function(e)
    {
        if(cancel) { my._xhr.abort(); }
        Ti.API.info("onsendstream called");
        //Ti.UI.currentWindow.fireEvent('uploadProgress',{value:e.progress});
    };


    // testing google fusion tables
    if (Ti.App.properties.getString('uploadService') == 'fusionTables') {
        var statements = packageFusionTablesRequest(samples); 

        // check for an auth token:
        var auth = Ti.App.Properties.getString('googleClientLoginAuth','');
        Ti.API.info("the saved client login token: "+auth);

        var makeRequest = function() {
            var sqlQuery="sql="+encodeURIComponent(statements.join(';'));
//            statements.push("INSERT INTO "+tableID+" (timestamp) VALUES ("+samples[0].timestamp+")");
            Ti.API.info(sqlQuery);
            
            my._xhr.open("POST","https://www.google.com/fusiontables/api/query");
            my._xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
            my._xhr.setRequestHeader('Authorization',Ti.App.Properties.getString('googleClientLoginAuth'));

            my._xhr.send(sqlQuery);
        };


        if(auth == '') {
            // make an auth request:
            var authXhr = Ti.Network.createHTTPClient();
            authXhr.onerror = function(e) {
                Ti.API.info("auth error: "+e.responseText);
            };

            authXhr.onload = function(e) {
                //Ti.API.info("auth xhr finished: "+authXhr.responseText);
                
                var statusCode = authXhr.status;
                if(statusCode == 200) {
                    // success, store the token and make the real call:
                    var tokens = authXhr.responseText.split("\n");
                    for (var c=0;c<tokens.length;c++)
                    {
                        var token = tokens[c];
                        var kv = token.split("=");
                        if (kv[0]=='Auth') {
                            var authHeader = "GoogleLogin auth="+kv[1];
                            Ti.App.Properties.setString('googleClientLoginAuth',authHeader);
                            Ti.API.info("wrote auth header to properties: "+authHeader);

                            // Finally got a valid token, now make the actual request:
                            makeRequest();                       
                            break;
                        }
                    }
                }
                else {
                    // there was an error
                    // TODO: alert the user
                    Ti.API.info("There was an auth request error: "+authXhr.responseText);
                    
                    // clear the previous session auth header:
                    Ti.App.Properties.setString('googleClientLoginAuth','');
                }
            };

            var payload = [
                "Email="+Ti.App.Properties.getString('googleUsername'),
                "Passwd="+Ti.App.Properties.getString('googlePassword'),
                "service="+"fusiontables",
                "source=MobileLogger"
            ];

            authXhr.open("POST","https://www.google.com/accounts/ClientLogin");
            authXhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
            
            var payloadString = payload.join('&');
            Ti.API.info(payloadString);
            authXhr.send(payloadString);
        }
        else {
            makeRequest();
        }

        // https://www.google.com/fusiontables/api/query
        // body of POST statement: sql={whatever}
        //
        // INSERT INTO 274409 (Product, Inventory) VALUES ('Red Shoes', 25)

    }
    else {
        var out = {docs:samples};
        my._xhr.open("POST","http://mobilelogger.robertcarlsen.net/api/addSamples");
        my._xhr.send("data="+JSON.stringify(out));
    }
}




function uploadManager(win) {
    Ti.API.info('In the uploadManager constructor');

    this._xhr = Titanium.Network.createHTTPClient();
    this._window = win;
    var my = this;

    // expose a way to make a new table:
    this.createNewTable = function(_tableName, _callback) {
        createFusionTable(_tableName, _callback);
    };

    this.bulkUpload = function(_data) {
        if(_data == null || _data.length == 0) { return; }

        // start the progress meter
        Ti.API.info('About to tell app to create a new progress bar');
        my.uploadProgress({value:0});

        my._xhr.onload = function(e)
        {
            Ti.API.info('Upload success: '+my._xhr.status);
            return e.responseText;
        };

        my._xhr.onerror = function(e)
        {
            my.uploadProgress({status:-1});

            //Ti.API.info('Upload status: '+ my._xhr.status +' error: '+my._xhr.responseText);
            Ti.API.info('Upload status: '+ JSON.stringify(e));
            return my._xhr.responseText;
        };

        my._xhr.onsendstream = function(e)
        {
            my.uploadProgress({value:e.progress});
        };

        var out = {docs:_data};
        my._xhr.setTimeout = 120000; // try 2 minutes.
        my._xhr.open("POST","http://mobilelogger.robertcarlsen.net/api/addSamples");
        my._xhr.send("data="+JSON.stringify(out));
    };

    var progress;
    this.cancelUpload = function() {
        my.uploadProgress({status:-2}); // cancel message
        my._xhr.abort();
        Ti.API.info('Cancelling xhr request');
        progress = null;
    };

    this.bulkUploadBatch = function(samples) {
        if(samples == null || samples.length == 0) { return; }
        
        var range = {index: 0, length: 300};
        if(range.length > samples.length) {range.length = samples.length;}

        // start the progress meter
        if(progress == null) {
            progress = samples.length;

            Ti.API.info('About to tell app to create a new progress bar');
            my.uploadProgress({value:0});
        }

        my._xhr.onload = function(e)
        {
            var pmeter = 1-((samples.length-range.length)/progress);
            Ti.API.info('Upload progress in bulkUploadBatch(): '+pmeter);

            my.uploadProgress({value:pmeter});

            if(samples.length > range.length) {
                my.bulkUploadBatch(samples.slice(range.length-1));
            }
            else {
                // done with the upload
                my.uploadProgress({value:1.0});
                progress = null;
            }

            return e.responseText;
        };
        
        my._xhr.onerror = function(e)
        {
            my.uploadProgress({status:-1});
            progress = null;

            Ti.API.info('Upload error: '+e.responseText);
            return e.responseText;
        };
        
        my._xhr.onsendstream = function(e)
        {
            Ti.API.info('sendstream progress: '+e.progress);

            var pmeter = 1-((samples.length-(e.progress*range.length))/progress);
            Ti.API.info('sendstream progress: '+pmeter);
            my.uploadProgress({value:pmeter});
        };
       
        // done setting up the xhr request parameters.
        //
            
        // google fusion tables:
        if (Ti.App.properties.getString('uploadService') == 'fusionTables') {
            var statements = packageFusionTablesRequest(samples.slice(range.index,range.length)); 

            this.makeRequest = function() {
                var sqlQuery="sql="+encodeURIComponent(statements.join(';'));
                //Ti.API.info(sqlQuery);
                
                my._xhr.open("POST","https://www.google.com/fusiontables/api/query");
                my._xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
                my._xhr.setRequestHeader('Authorization',Ti.App.Properties.getString('googleClientLoginAuth'));

                my._xhr.send(sqlQuery);
            };

            if(Ti.App.Properties.getString('googleClientLoginAuth') == '') {
                makeGoogleFusionAuthRequest(this);
            }
            else {
                my.makeRequest();
            }

        }
        else {
            // mobile logger server:
            var out = {docs:samples.slice(range.index,range.length)};

            my._xhr.setTimeout = 20000;
            my._xhr.open("POST","http://mobilelogger.robertcarlsen.net/api/addSamples");
            my._xhr.send("data="+JSON.stringify(out));
        }
    };


    this.progressView = null;
    this.progressBar = null;
    this.progressActive = false;
    this.uploadProgress = function(o)
    {
        // want this to display a progress bar
        // should also generate a view 
        if(o.window == null) { o.window = my._window; }
        if(o.value == null) { 
            if(my.progressBar)
                { o.value = my.progressBar.value; }
            else
                { o.value = 0; }
        }
        if(o.status == null) { o.status = 0; }

        if(my.progressView == null) {
            // create a view...then add the bar to it.
            // then add it to the current window
            Ti.API.info('Creating a progress view');
            my.progressView = Ti.UI.createView({
                top:0,
                width:320, // TODO: adjust this to fit the window
                height:55,
                backgroundColor:'#666',
                opacity:0
            });

            Ti.API.info('Creating the upload progress bar');
            my.progressBar = Titanium.UI.createProgressBar({
                top:-3,
                width:260,
                left: 10,
                min:0,
                max:1,
                value:0,
                color:'#fff',
                message:'Uploading data',
                font:{fontSize:14, fontWeight:'bold'},
                style:Titanium.UI.iPhone.ProgressBarStyle.PLAIN
            });

            // add a cancel button:
            var btnPath = Titanium.Filesystem.resourcesDirectory + '/images/close-btn.png';
            Ti.API.info('button image path: '+btnPath);

            var closeBtn = Ti.UI.createButton({
                backgroundImage:btnPath,
                right: 10,
                width: 30,
                height: 30
            });
            closeBtn.addEventListener('click',function(){
                Ti.API.info('Upload cancel button pressed.');
                my.cancelUpload();
            });
            
            my.progressView.add(closeBtn);
            my.progressView.add(my.progressBar);
            my.progressBar.show();

            my.progressActive = true;
            o.window.add(my.progressView);

            my.progressView.animate({opacity:0.9,duration:250});
        }
        

        if(my.progressActive && o.status < 0) { // error condition
            my.progressActive = false;

            if(o.status == -1) {
                 my.progressBar.message = 'Upload failed';
             } else if(o.status == -2) {
                 my.progressBar.message = 'Upload cancelled';
             } else {
                 my.progressBar.message = 'Upload error';
             }

             setTimeout(function(){
               my.progressView.animate({opacity:0,duration:250},function() {
                   o.window.remove(my.progressView);
                   //progressView = null;
               });
           },1500);

            //o.value = 0;
        } 
        else {
            my.progressBar.value = o.value;
        }
        // if the progress is complete, automatically
        // dismiss the view after a few moments
        if(my.progressActive && o.value >= 1.0) {
            my.progressBar.value = 1.0;
            my.progressActive = false;

            Ti.API.info('About to fade the progress view');
            my.progressBar.message = 'Upload finished';

            setTimeout(function(){
               my.progressView.animate({opacity:0,duration:250},function() {
                   o.window.remove(my.progressView);
                   //progressView = null;
               });
            },1000);
        }
    };
}

