// utility methods

function toRad (deg) {
    // convert from degrees to radians
    var conversion = (Math.PI * 2) / 360;
    return deg*conversion;
}

function calculateDistanceDelta(pt1,pt2) {
    // the points should be hashes with {lon, lat}
    // calculate distance between adjacent points
    // reference for estimate in JavaScript.
     var R = 6371; // km
     var d =    Math.acos(Math.sin(toRad(pt1.lat))*
                Math.sin(toRad(pt2.lat))+Math.cos(toRad(pt1.lat))*
                Math.cos(toRad(pt2.lat))*Math.cos(toRad(pt2.lon)-toRad(pt1.lon))) * R;

    return d*1000; // in meters?
};


// to be run each time the application starts
// ensures that the database is ready for access
function setupDatabase() {
    // open the database connection (create if necessary)
    var logDB = Ti.Database.open("log.db");
    Ti.API.info('Opened (or created) log.db');

    // access (create if necessary) the meta table
    // this table contains the event id, start time, duration, distance, tags/notes
    // some of these fields are set when stopping the log
    logDB.execute('CREATE TABLE IF NOT EXISTS LOGMETA (id INTEGER PRIMARY KEY, eventid TEXT, startdate INTEGER, duration INTEGER, distance REAL, tags TEXT, deviceid TEXT)');
    Ti.API.info('Created LOGMETA table');

    // access (create if necessary) the log data table
    // shares the id field with the meta table
    //logDB.execute('CREATE TABLE IF NOT EXISTS LOGDATA  (id INTEGER PRIMARY KEY, EVENTID TEXT, DATA TEXT)');
    logDB.execute('CREATE TABLE IF NOT EXISTS LOGDATA  (id INTEGER, DATA TEXT)');
    Ti.API.info('Created LOGDATA table');
    
    logDB.close();
    Ti.API.info('Closed log.db');
}


