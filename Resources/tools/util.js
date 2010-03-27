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


    // check to see if these tables are up-to-date
    // if not upgrade the tables
    /*
    ALTER TABLE orig_table_name RENAME TO tmp_table_name;

    CREATE TABLE orig_table_name (
      col_a INT
    , col_b INT
    );

    INSERT INTO orig_table_name(col_a, col_b)
    SELECT col_a, colb
    FROM tmp_table_name;

    DROP TABLE tmp_table_name;
    */
   
    // access (create if necessary) the meta table
    // this table contains the event id, start time, duration, distance, tags/notes
    // some of these fields are set when stopping the log
    logDB.execute('CREATE TABLE IF NOT EXISTS LOGMETA (logid INTEGER PRIMARY KEY, eventid TEXT, startdate INTEGER, duration INTEGER, distance REAL, tags TEXT, deviceid TEXT, _id TEXT, _rev TEXT)');
    Ti.API.info('Created LOGMETA table');

    // access (create if necessary) the log data table
    // shares the id field with the meta table
    logDB.execute('CREATE TABLE IF NOT EXISTS LOGDATA  (_id TEXT, _rev TEXT, logid INTEGER, DATA TEXT)');
    Ti.API.info('Created LOGDATA table');

    // upgrade logmeta table from old format
    try
      {
        // add the logid table and move the id field over to it
        var rows = logDB.execute('SELECT logid,_rev FROM LOGMETA LIMIT 1');
        Ti.API.info('LOGMETA upgrade test. row count: '+ rows.rowCount);
        Ti.API.info('LOGMETA upgrade test. field count: '+ rows.fieldCount());
        rows.close();
      }
    catch(err)
      {
        // check for error indicating that these columns don't exist
        Ti.API.info('Caught the LOGMETA table test error');

        // need to upgrade this table
        logDB.execute('ALTER TABLE LOGMETA RENAME TO LOGMETA_old');
        Ti.API.info('Renamed LOGMETA table');
        
        logDB.execute('CREATE TABLE LOGMETA (logid INTEGER PRIMARY KEY, eventid TEXT, startdate INTEGER, duration INTEGER, distance REAL, tags TEXT, deviceid TEXT, _id TEXT, _rev TEXT)');
        Ti.API.info('Created new LOGMETA table');

        logDB.execute('INSERT INTO LOGMETA (logid,eventid,startdate,duration,distance,tags,deviceid) SELECT id,eventid,startdate,duration,distance,tags,deviceid FROM LOGMETA_old');
        Ti.API.info('Copied LOGMETA_old to LOGMETA (new)');

        logDB.execute('DROP TABLE LOGMETA_old');
        Ti.API.info('Dropped LOGMETA_old');
      }
       
    // upgrade logdata table
    try
      {
        // add the logid table and move the id field over to it
        var rows = logDB.execute('SELECT logid,_rev FROM LOGDATA LIMIT 1');
        Ti.API.info('LOGDATA upgrade test. row count: '+ rows.rowCount);
        Ti.API.info('LOGDATA upgrade test. field count: '+ rows.fieldCount());
        rows.close();
      }
    catch(err)
      {
        // check for error indicating that these columns don't exist
        Ti.API.info('Caught the LOGDATA table test error');

        // need to upgrade this table
        logDB.execute('ALTER TABLE LOGDATA RENAME TO LOGDATA_old');
        Ti.API.info('Renamed LOGDATA table');
        
        logDB.execute('CREATE TABLE LOGDATA  (_id TEXT, _rev TEXT, logid INTEGER, DATA TEXT)');
        Ti.API.info('Created new LOGDATA table');

        logDB.execute('INSERT INTO LOGDATA (logid,DATA) SELECT id,DATA FROM LOGDATA_old');
        Ti.API.info('Copied LOGDATA_old to LOGDATA (new)');

        logDB.execute('DROP TABLE LOGDATA_old');
        Ti.API.info('Dropped LOGDATA_old');
      }


    
    logDB.close();
    Ti.API.info('Closed log.db');
}

function toMPH (metersPerSec) {
    if(metersPerSec == null) return 0;
    return metersPerSec * 2.236936; // m/s -> M/hr
}

function toKPH (metersPerSec) {
    if(metersPerSec == null) return 0;
    return metersPerSec * 3.6;
}

function toMiles (meters) {
    if(meters == null) return 0;
    return meters * 0.000621371192;
}

function toKM (meters) {
    if(meters == null) return 0;
    return meters * 0.001;
}
     
