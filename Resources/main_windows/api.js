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

// TODO: anti-pattern...but testing something
var googleAuth = Ti.App.googleAuth;

// map the database column names to the fusionTables columns
// important, since the order matters when importing data to a new table
var columnMap = [
             {id: 'logID', column: {name: 'logID', type: 'STRING'}},
             {id: 'accx', column: {name: 'accx', type: 'NUMBER'}},
             {id: 'accy', column: {name: 'accy', type: 'NUMBER'}},
             {id: 'accz', column: {name: 'accz', type: 'NUMBER'}},
             {id: 'mag', column: {name: 'mag', type: 'NUMBER'}},
             {id: 'lat', column: {name: 'latitude', type: 'NUMBER'}},
             {id: 'lon', column: {name: 'longitude', type: 'NUMBER'}},
             {id: 'alt', column: {name: 'altitude', type: 'NUMBER'}},
             {id: 'locAcc', column: {name: 'locationAccuracy', type: 'NUMBER'}},
             {id: 'altAcc', column: {name: 'altitudeAccuracy', type: 'NUMBER'}},
             {id: 'speed', column: {name: 'metersPerSecond', type: 'NUMBER'}},
             {id: 'timestamp', column: {name: 'timestamp', type: 'DATETIME'}},
             {id: 'heading', column: {name: 'heading', type: 'NUMBER'}},
             {id: 'eventID', column: {name: 'eventID', type: 'STRING'}},
             {id: 'deviceID', column: {name: 'deviceID', type: 'STRING'}},
             {id: 'dbfs', column: {name: 'dBFS', type: 'NUMBER'}}, 
             {id: 'dbspl', column: {name: 'dBSPL', type: 'NUMBER'}},
             {id: 'coordinate', column: {name: 'coordinates', type: 'LOCATION'}} // is constructed when the FT upload is prepared (not in the local DB)
];



function packageFusionTablesRequest(samples, useSQL, tableID) {
    if(samples == null || samples.length == 0) { return; }
    if(useSQL === undefined) {useSQL = false};
    if(useSQL && tableID === undefined) { return; } else { tableID = ''; }
 
    // prepare the rows or build the insert sql statement
    var statements = [];

    var headers = columnMap.map(function(v) {
        return v.id;
    });
        
    var rows = [];
    for (var i = 0; i < samples.length; i++) {
      var thisRow = []; 
      for(var h in headers) {thisRow.push((useSQL) ? "''" : "");} // this feels dirty, but want to ensure that all rows have values.

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
                    // wrap strings in single quotes for the SQL statements
                    if(useSQL && isNaN(samples[i][datum])) {
                        thisRow[index] = "'"+samples[i][datum]+"'";
                    }
                    else {
                        thisRow[index] = samples[i][datum];
                    }
                }
          }
      }
      // combine the lat and lon into the coordinate column:
      if(samples[i].hasOwnProperty('lat') && samples[i].hasOwnProperty('lon')) {
          thisRow[headers.indexOf('coordinate')] = (samples[i].lat+' '+samples[i].lon);
      }
      
      // add this row to the output
      rows.push(thisRow.join(','));  
    }

    if(useSQL) {
        for(var r=0; r<rows.length; r++) {
            statements.push("INSERT INTO "+tableID+" ("+headers.join(', ')+") VALUES ("+rows[r]+")");
        }
    
        return statements;
    }
    else {
        return rows.join('\n')+'\n'; // one extra newline for good luck. fixes bug #19
    }
}


// not used. creates the index table entry
function packageFusionTablesMetaData(_data) {
    return;
    
    // expects an object from the Meta table.
    if(_data == null || _data.length == 0) { return; }

    // what is this field?
    // test table id:
    var tableID = Ti.App.Properties.getInt('googleFusionTableIndexID',482710); // this default is the sandbox, public table.
 
    // description, startdate, eventID, route (kml LineString)
    // <LineString>
    // <coordinates> lng,lat[,alt] lng,lat[,alt] ... </coordinates>
    // </LineString>
    
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

// not used. creates the index table entry.
function makeFusionTablesMetaRequest(_sql, callback) {
    return;
    
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

        my._xhr.open("POST","https://www.google.com/fusiontables/api/query",false); // #dev synchronous request here
        my._xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
        my._xhr.setRequestHeader('Authorization',Ti.App.Properties.getString('googleClientLoginAuth'));

        my._xhr.send(sqlQuery);
    };

    // this should automatically refresh the token if necessary
    googleAuth.isAuthorized(
        function() {
            my.makeRequest();    
        },
        function() {
            // need to get the googleAuth object to authorize
            Ti.UI.createAlertDialog({
                title: "Not Authorized",
                message: "Please sign in to your Google account in Settings."
            }).show();
        });

}


// callback provides the tableID:
function createFusionTable(tableName, callback) {

    if (tableName == null || tableName == '') {
        tableName = "Mobile Logger";
    }

    var my = this;
    this._xhr = Titanium.Network.createHTTPClient();

    my._xhr.onload = function(e) {
        Ti.API.info('Create table success: ' + my._xhr.responseText);

        // this is where we should get the tableid.
        var r = JSON.parse(my._xhr.responseText);
        var tableID = r.tableId;
        if (tableID) {
            Ti.API.info('just got a fusion table id: ' + tableID);
            
            if (callback != null) {
                // kick off the upload
                callback(tableID);
            }
        }

        return my._xhr.responseText;
    };

    my._xhr.onerror = function(e) {
        Ti.API.info('Create table status: ' + my._xhr.status + ' error: ' + my._xhr.responseText);
        return my._xhr.responseText;
    };

    this.makeRequest = function() {
        var _columns = columnMap.map(function(v) {
            return v.column;
        });

        var data = {
            name : tableName,
            description : 'Mobile Logger data', // TODO: have a better way to add/configure this data
            isExportable : true,
            columns : _columns
        };

        Ti.API.info(data);

        my._xhr.open("POST", "https://www.googleapis.com/fusiontables/v1/tables");
        my._xhr.setRequestHeader('Content-Type', 'application/json');
        my._xhr.setRequestHeader('Authorization', 'Bearer' + ' ' + googleAuth.getAccessToken());

        my._xhr.send(JSON.stringify(data));
    };

    googleAuth.isAuthorized(function() {// success, including refreshing the access token.
        my.makeRequest();
    }, function() {// failure
        // need to get the googleAuth object to authorize
        Ti.UI.createAlertDialog({
            title : "Not Authorized",
            message : "Please sign in to your Google account in Settings."
        }).show();
    });
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

    var progress;
    this.cancelUpload = function() {
        my.uploadProgress({status:-2}); // cancel message
        my._xhr.abort();
        Ti.API.info('Cancelling xhr request');
        progress = null;
    };

    this.bulkUploadBatch = function(samples, tableID) {
        if(samples == null || samples.length == 0) { return; }
        if(tableID === undefined) { 
            Ti.UI.createAlertDialog({
                title: 'Upload Error',
                message: 'Table ID not specified. Try again later.'
            }).show();
            return;
            
            // TODO: create a new table and continue if the tableID is not specified.
        } 
        
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

            // recursion:
            if(samples.length > range.length) {
                my.bulkUploadBatch(samples.slice(range.length-1), tableID);
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
            // don't need to prepare sql statements...but do need to send the rows as csv data.            
            // will have to insure that the ordering here matches the order of when the table was created.
            var csvData = packageFusionTablesRequest(samples.slice(range.index,range.length), false);

            this.makeRequest = function() {
                my._xhr.open("POST","https://www.googleapis.com/upload/fusiontables/v1/tables/" +tableID+ "/import");
                my._xhr.setRequestHeader('Content-type', 'application/octet-stream');
                my._xhr.setRequestHeader('Authorization', 'Bearer ' +googleAuth.getAccessToken());

                my._xhr.send(csvData);
            };

            if(!googleAuth.isAuthorized()) {
                // need to get the googleAuth object to authorize
                Ti.UI.createAlertDialog({
                title: "Not Authorized",
                message: "Please sign in to your Google account in Settings."
                }).show();
            }
            else {
                my.makeRequest();
            }

        }
        else {
            // NOP
            // no other upload services are currently defined.
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
                top:7,
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


function sendBuffer(d) {
    return; // the upload method is not implemented
    
    // d is an object with the doc buffer, eventID and deviceID.
    if(d == null) {return;}
    if(!d.hasOwnProperty('docBuffer') || d.docBuffer == null || d.docBuffer.length == 0) { return; }

    //Ti.API.info('Sending Buffer');
    // send the batch of docIDs in the docBuffer
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

    // send this batch of samples
    // bulkUpload(docs); // <-- this is no longer defined...it's in the manager class.
    // TODO: use the upload manager, but in a silent way (no progress indicator)
}

