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

// json export
// this is used for pushing to couchdb?
// if each piece of data is expanded into a column in the db,
// then each will have to be reconstituted into objects / json for sending

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

    if(data == null) return;

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
// len                  (seconds duration between samples)
        var thisData = new Object();
        var prevLoc;
        var prevTimestamp;

        for(var datum in data[i]){
            if(i==0) Ti.API.info('Datum: '+datum);

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

        // TODO: running distance should be baked into the data
        // as a stop gap for the logs already run, calculate the distances here
        if(thisData.km == null){
            if(i==0) {
                thisData.km = 0;
            } else {
                var dist = calculateDistanceDelta(prevLoc,{lon:data[i].lon,lat:data[i].lat})/1000;
                if(isNaN(dist)) dist = 0; 
                rideKM += dist;
                thisData.km = rideKM.toFixed(5);
            }
        }
        prevLoc = {lon:data[i].lon,lat:data[i].lat};

        // hack in timestamp sample rate
        if(thisData.len == null){ // in case it's added later
            if(i==0) {
                thisData.len = 0;
            } else {
                thisData.len = ((data[i].timestamp - prevTimestamp)/1000).toFixed(2);
            }
        }
        prevTimestamp = data[i].timestamp;

        if(i==0) Ti.API.info('Processed first sample: '+JSON.stringify(thisData));

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
