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

// export log data from the database in a variety of formats
// currently it's in the db in JSON format, so each row will have to be parsed
// in order to do anything useful with it.
//

// Ti.include('json2.js');
Ti.include('../tools/xml.js');
Ti.include('../tools/util.js');
Ti.include('../tools/date.format.js');


// csv export
// how to handle possibly missing columns? don't allow it?
// enforce a device-specific schema in the sqlite db?
// --> primarily for e-mailing?
// since there is no specific enumeration to the data in the records
// the columns will have to be constructed by index
// this would be much easier if the data was just in the database columns.
// then, a request from the db would be in order.


// json export
// this is used for pushing to couchdb?
// if each piece of data is expanded into a column in the db,
// then each will have to be reconstituted into objects / json for sending
// this will be useful when the database has the data alone.
function exportCSV (data) {
    Ti.API.info('Inside CSV export function');

    var headers = [];

    var rows = [];
    for (var i = 0; i < data.length; i++) {
        var thisRow = [];
        for(var datum in data[i]) {
            if(data[i].hasOwnProperty(datum)) { 
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
                    thisRow[index] = data[i][datum];
                }
            }
        };
        // add this row to the output
        rows.push(thisRow.join(', '));

        // what will happen to the first rows, which may be shorter than others?
    };
    // add the header row
    rows.unshift(headers.join(', '));
    return rows.join('\n');
}


// gc export
// generate a GoldenCheetah format XML file
/*
<!DOCTYPE GoldenCheetah>
<ride>
    <attributes>
        <attribute key="Start time" value="2010/03/16 19:09:20 UTC" />
        <attribute key="Device type" value="PowerTap" />
    </attributes>
    <intervals>
        <interval stop="1128.12" name="0" start="0" />
        <interval stop="1749.3" name="Lap 1" start="1128.12" />
        <interval stop="2381.82" name="Lap 2" start="1749.3" />
        <interval stop="3723.62" name="3" start="2381.82" />
    </intervals>
    <samples>
        <sample cad="0" watts="0" secs="0" km="0" hr="0" kph="0" len="1.26" nm="0" />
*/

function exportGCfile (data) {

    Ti.API.info('Inside exportGCfile');

    if(data == null) { return; }

    // this expects a json array of sample objects
    // it will create the attributes header
    // then each of the sample elements with data
    //

    var startTime = data[0].timestamp;
    //var startDate = new Date(startTime).toUTCString();
    
    // ugh...the GC date parser expects: "2010/03/16 19:09:20 UTC"
    var startDate = new Date(startTime).format('UTC:yyyy/mm/dd HH:MM:ss Z');
    Ti.API.info('Created timestamp');

    var rideKM = 0;

    var results = [];
    results.push('<!DOCTYPE GoldenCheetah>');
    results.push('<ride>');
    results.push('<attributes>');
    results.push(element('attribute','',{key:"Start time",value:startDate}));

    if(Ti.Platform.name == 'iPhone OS') {
        results.push(element('attribute','',{key:"Device type",value:'Logger (iPhone)'}));
    } else if(Ti.Platform.name == 'android'){
        results.push(element('attribute','',{key:"Device type",value:'Logger (Android)'}));
    } else {
        results.push(element('attribute','',{key:"Device type",value:'Logger (mobile)'}));
    }

    results.push('</attributes>');
    results.push('<samples>');
    Ti.API.info('Prepared GC file format header');

    // now, iterate through all the data points:
    //
    for (var i = 0; i < data.length; i++) {
// need to translate some of the data
// speed -> kph         (1 m/s -> 3.6 kph) 
// timestamp to secs    (cumulative since the start time)
// distance (km)        (cumulative since the start location. calculate from the coordinates?)
// len                  (seconds duration between samples - first sample is key and must be set)
        var thisData = {};
        var prevLoc;
        var prevTimestamp;

        for(var datum in data[i]){
            if(data[i].hasOwnProperty(datum)) { 
                if(i==0) { Ti.API.info('Datum: '+datum); }

                switch(datum) {
                    case 'speed':
                        thisData.kph = Math.max(0,(data[i][datum] * 3.6).toFixed(4));
                        break;
                    case 'timestamp':
                        thisData.secs = ((data[i][datum] - startTime)/1000).toFixed(2); //convert millis to secs
                        break;
                    default:
                        thisData[datum] = data[i][datum];
                        // Ti.API.info('Just added: '+datum+', as: '+thisData[datum]);
                }
            }
        }

        // TODO: running distance should be baked into the data
        // as a stop gap for the logs already run, calculate the distances here
        if(thisData.km == null){
            if(i==0) {
                thisData.km = 0;
            } else {
                var dist = calculateDistanceDelta(prevLoc,{lon:data[i].lon,lat:data[i].lat})/1000;
                if(isNaN(dist)) { dist = 0; }
                rideKM += dist;
                thisData.km = rideKM.toFixed(5);
            }
        }
        prevLoc = {lon:data[i].lon,lat:data[i].lat};

        // hack in timestamp sample rate
        if(thisData.len == null){ // in case it's added later
            if(i==0) {
                // i'm not sure if variable intervals are supported, 
                // but Golden Cheetah seems to fall back on the first sample for the recording interval
                thisData.len = 1; 
            } else {
                thisData.len = ((data[i].timestamp - prevTimestamp)/1000).toFixed(2);
            }
        }
        prevTimestamp = data[i].timestamp;

        if(i==0) { Ti.API.info('Processed first sample: '+JSON.stringify(thisData)); }

        results.push(element('sample','',thisData));
        //Ti.API.info('Added sample: '+i);
    };

    results.push('</samples>');
    results.push('</ride>');
    Ti.API.info('Finished preparing GC file');

    results = results.join('\n');

    // that's it!
    Ti.API.info('Returning GC file string');
    return results;
}


// GPX export
//
// GPX format XML file
/*

<?xml version="1.0" encoding="UTF-8"?>
<gpx creator="Mobile Logger - http://mobilelogger.robertcarlsen.net/" version="1.1">
    <wpt lat="45.44283" lon="-121.72904"><ele>1374</ele><name>Start</name></wpt>
    <wpt lat="45.44283" lon="-121.72904"><ele>1374</ele><name>end</name></wpt>
  <trk>
    <name>Route: DateTime</name>
    <trkseg>
      <trkpt lat="45.4431641" lon="-121.7295456"><ele>2376</ele><time>2007-10-14T10:09:57.000Z</time></trkpt>
    </trkseg>
  </trk>
</gpx>

*/
function exportGPXfile(data) {
    Ti.API.info('Inside exportGPXfile');

    if(data == null) { return; }

    // this expects a json array of sample objects
    // it will create the attributes header
    // then each of the sample elements with data
    //

    var startTime = data[0].timestamp;
    var endTime = data[(data.length-1)].timestamp;

    // GPX date parser expects ISO 8601: "2010-07-12T11:43Z"
    var startDate = new Date(startTime).format('UTC:yyyy-mm-dd"T"HH:MM:ss"Z"');
    var endDate = new Date(endTime).format('UTC:yyyy-mm-dd"T"HH:MM:ss"Z"');
    // TODO: add milliseconds
    Ti.API.info('Created timestamps');

    var results = [];
    results.push('<?xml version="1.0" encoding="UTF-8"?>');
    results.push('<gpx creator="Mobile Logger - http://mobilelogger.robertcarlsen.net/" version="1.1">');

    // start location
    // TODO: Name and all...
    results.push(element('wpt',element('name','Start'),{lon:data[0].lon,lat:data[0].lat}));
    // TODO: end location
    results.push(element('wpt',element('name','End'),{lon:data[(data.length-1)].lon,lat:data[(data.length-1)].lat}));

    // add trk, name then all samples
    results.push('<trk>');
    results.push('<name>Mobile Logger - '+ new Date(startTime).format() +'</name>');

    // now, iterate through all the data points:
    // TODO: everything except lat/lon needs to be child elements, not attributes
    results.push('<trkseg>');

    for (var i = 0; i < data.length; i++) {
        var thisData = [];

        for(var datum in data[i]){
            if(data[i].hasOwnProperty(datum)) {
                if(i==0) { Ti.API.info('Datum: '+datum); }

                switch(datum) {
                    case 'speed':
                        // meters/sec
                        var s = data[i][datum];
                        if(s != null) {
                            thisData.push(element('speed',Math.max(0,s).toFixed(4)));
                        }
                        break;
                    case 'timestamp':
                        thisData.push(element('time', new Date(data[i][datum]).format("UTC:yyyy-mm-dd'T'HH:MM:ss'Z'")));
                        break;
                    case 'heading':
                        thisData.push(element('course',data[i][datum].toFixed(2)));
                        break;
                    case 'alt':
                        thisData.push(element('ele',data[i][datum].toFixed(2)));
                        break;
                    default:
                        // NOP
                        // thisData[datum] = data[i][datum];
                        // Ti.API.info('Just added: '+datum+', as: '+thisData[datum]);
                }
            }
        }
        if(i==0) { Ti.API.info('Processed first sample: '+JSON.stringify(thisData)); }
        results.push(element('trkpt',thisData.join(''),{lon:data[i].lon,lat:data[i].lat}));
        //Ti.API.info('Added sample: '+thisData.join(''));
    };

    results.push('</trkseg>');
    results.push('</trk>');
    results.push('</gpx>');

    Ti.API.info('Finished preparing GPX file');

    results = results.join('\n');

    // that's it!
    Ti.API.info('Returning GPX file string');
    return results;
}


