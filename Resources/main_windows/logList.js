// the log file list viewer


Ti.include('../tools/json2.js');
Ti.include('export.js');

var win = Ti.UI.currentWindow;

// add an activity indicator 
// use this for slow loading stuff.
var actInd = Titanium.UI.createActivityIndicator();
if(Ti.Platform.name == 'iPhone OS') {
    //actInd.style = Titanium.UI.iPhone.ActivityIndicatorStyle.BIG;
    actInd.style = Titanium.UI.iPhone.ActivityIndicatorStyle.DARK;
}
win.add(actInd);


var selectedEvents = new Array();

// add a send action button
var b = Titanium.UI.createButton();

// use special button icon if on iPhone
if(Ti.Platform.name == 'iPhone OS'){
    b.systemButton = Titanium.UI.iPhone.SystemButton.ACTION;    
} else {
    b.title = 'Send';
}


function sendLog(){
    // TODO: invoke an action sheet with options for sending the data
    // at the moment, just back to emailing off an attachment

    // display an alert if there are no rows selected
    // (or, if more than one is selected while i sort out that bug)
    if(selectedEvents.length < 1) {
        Ti.UI.createAlertDialog({
            title:'Select Log',
            message:"Please select a log file to send."
        }).show();
        return;
    } else if (selectedEvents.length > 1) {
        Ti.UI.createAlertDialog({
            title:'Select one log',
            message:"Select one log to send at a time. \n *TODO: this is a bug*"
        }).show();
        return;
    }

    // retrieve the rows and setup an email message
    var sampleData;
    var logDB = Ti.Database.open("log.db");

    var eventListArray = [];
    for (var i = 0; i < selectedEvents.length; i++) {
        var evt = selectedEvents[i];
        eventListArray.push(evt);//"'"+evt+"'"); // trying to get this query to work.
        Ti.API.info('eventID: '+selectedEvents[i]);
    };

    Ti.API.info('Selected Events list: '+eventListArray.join());
    var eventList = eventListArray.join();
    
    // i think that each of these items needs to be surrounded by quotes
    //var rows = logDB.execute('SELECT * FROM LOGDATA WHERE EVENTID IN (?)',eventList);
    var rows = logDB.execute('SELECT * FROM LOGDATA WHERE EVENTID = ?',eventListArray[0]);
    
    // the rowCount seems to be limited to 1000 rows. why?
    // The problem seems alleviated after two changes:
    // 1. commented out the getRowCount() call.
    // 2. changed the execute statement to 'EVENTID = ?', eventListArray[0]
    // Not sure which, if either, of these did the trick.
    //
    //Titanium.API.info('Samples retrieved from db: ' + rows.getRowCount());
    //Titanium.API.info('Rows affected: ' + logDB.rowsAffected);

    // TODO: group the rows by eventID
    var tmpData=[];
    while(1){
        var thisData = rows.fieldByName('DATA');
        tmpData.push(JSON.parse(thisData));
        if(rows.next() == false) break;
    };
    rows.close();
    logDB.close();

    Ti.API.info('log row count: '+tmpData.length);

    // ok, now construct the email window
    var emailView = Ti.UI.createEmailDialog();
    emailView.setSubject(' Log data');
    
    //var tmpDataString = '['+ tmpData.join(',\n') +']'; // create a JSON string
    //var tmpDataString = JSON.stringify(tmpData);
    
    // testing GC file format export
    var tmpDataString = exportGCfile(tmpData);
    
    emailView.setMessageBody(tmpDataString);

    // this is a huge string
    //Ti.API.info('output string: '+tmpDataString);

    // emailView.addAttachment(tmpDataString);

    emailView.addEventListener('complete',function(e)
    {
        if (e.result == emailView.SENT)
        {
            // TODO: this isn't really necessary, is it?
            // alert("Mail sent.");
        }
        else if(e.result == emailView.FAILED)
        {
            var alertDialog = Titanium.UI.createAlertDialog({
                title: 'Problem',
                message: 'There was a problem. Check your network connection. DEBUG: '+e.result,
                buttonNames: ['OK']
            });
        }
    });
    emailView.open();

};


//b.addEventListener('click',sendLog());

if(Ti.Platform.name == 'iPhone OS'){
    win.rightNavButton = b;
    rightnav = true;
} else {
    // TODO: figure out a solution for android
    // Menu?
}

// this isn't being used at the moment
// TODO: add an activity meter.
var data = [
	{title:'Log file loading...'}
];

// create a table view for the logs
var logTable = Ti.UI.createTableView();

logTable.addEventListener('click',function(e) 
{
    // create a child view with the sample data
    // TODO: organize the data into events
    // inspect each event in the child view
   

    // because the android doesn't have a navbar with buttons,
    // use the options dialog (action sheet) to reveal
    // log inspection and upload functions
    var optionsDialog = Titanium.UI.createOptionDialog({
        options:['Inspect data', 'Email Log', 'Delete Log', 'Cancel'],
        destructive:2,
        cancel:3,
        title:'Manage Log'
    });


    // TODO: add a listener to conditionally act on the response.
    // This may be better suited to display differently based on each platform's
    // UX paradigms.
    optionsDialog.addEventListener('click',function(oe){
        // these properties aren't being provided correctly.
        if(oe.cancel == true) { 
            Ti.API.info('Cancel button pressed');
            return; 
        }
        if(oe.destructive == true) {
            // delete this log file
            // forward the event to the delete listener
            Ti.API.info('Delete Log button pressed.');
            logTable.fireEvent('delete',e);
            Ti.API.info('fired a synthesized delete event to logTable');
        } else {
            switch(oe.index) {
                case 0:
                    Ti.API.info('Button 0 pressed.');
                    // Inspect this log data 
                    displayDetail();
                    break;
                case 1:
                    Ti.API.info('Button 1 pressed.');
                    // email / upload this log
                    actInd.show();
                    toggleSelection(true);
                    sendLog();
                    toggleSelection(false);
                    actInd.hide();
                    break;
                case 2:
                    // delete this log file
                    // forward the event to the delete listener
                    Ti.API.info('Delete Log button pressed for event: '+e.row.eventID);
                    deleteEvent(e.row.eventID);
                    toggleSelection(false);
                    break;
                case 3:
                    Ti.API.info('Cancel button pressed');
                    toggleSelection(false);
                    break;

                default:
                    Ti.API.info('Default case in options dialog.');
                    // this shouldn't happen
                    toggleSelection(false);
                    return;
            }
        }

    });


    Ti.API.info('Showing the options dialog');
    optionsDialog.show();

   function displayDetail() { 
        var newwin = Titanium.UI.createWindow({
			title:'Data Sample',
            backgroundColor:'#ddd'
		});

        var sample = Ti.UI.createTextArea({
            value:e.rowData.content,
            height:300,
            width:300,
            top:10,
            font:{fontSize:16,fontFamily:'Marker Felt', fontWeight:'bold'},
            color:'#666',
            textAlign:'left',
            borderWidth:2,
            borderColor:'#bbb',
            borderRadius:5,
            editable:false
        });
        newwin.add(sample);

		Titanium.UI.currentTab.open(newwin,{animated:true});
   }
    
    function toggleSelection(force) {
        // toggle the checked status of this row
        if(force == null) // actually perform a toggle
        {
            force = (e.row.hasCheck == null || e.row.hasCheck == false);
        }

       if(force === true){ // (e.row.hasCheck == null || e.row.hasCheck == false)) {
           var data = e.row;
           //logTable.updateRow(e.index,data);
            data.hasCheck = true;
            //data.hasDetail = false;

            var evt = data.eventID;
            selectedEvents.push(evt);

            Ti.API.info('row '+e.index+' selected. ('+data.eventID+')');
       } else {
           var data = e.row;
           //data.hasDetail = true;
           data.hasCheck = false;
           //logTable.updateRow(e.index,data);
           
           // remove this selected item
           // TODO: change this to use indexOf()
           for (var i = 0; i < selectedEvents.length; i++) {
               if(selectedEvents[i] == data.eventID) {
                selectedEvents.splice(i,1); // remove this element
                Ti.API.info('row '+e.index+' deselected. ('+data.eventID+')');
               }
           };
       }
    }

});

// add delete event listener
logTable.addEventListener('delete',function(e)
{
    // get the selected row's eventID
    var eventID = e.row.eventID;
    if (eventID == null ) {return;}

    deleteEvent(eventID);
});

function deleteEvent(eventID) {
    if(eventID == null) { return; }

    // remove the log data from the db
    // but first confirm with an alert
    var alertDialog = Ti.UI.createAlertDialog({
        title:'Delete Log',
        message:'Are you sure you want to delete this log data?',
        buttonNames: ['OK','Cancel']
    });
    alertDialog.addEventListener('click',function(e) {
        if(e.index == 0){
            // the OK button was clicked, delete this data.
            // open the DB
            var logDB = Ti.Database.open("log.db");

            // run the SQL statement to delete the row.
            logDB.execute('DELETE FROM LOGDATA WHERE EVENTID = ?',eventID);

            // is there a way to verify the process?
            logDB.close();
           
            Ti.API.info('deleted eventID: '+eventID);
        }
        // have to refresh the table data
        Ti.API.info('Reloading log list from alert dialog');
        loadLogs();
    });

    alertDialog.show();

};



// call up the log list from the database
function loadLogs () {
    // display the activity indicator
    actInd.show();
    
    // open the database connection (create if necessary)
    var logDB = Ti.Database.open("log.db");

    Ti.API.info('Getting logs from db');

    // TODO: move the data base stuff into a class.
    logDB.execute('CREATE TABLE IF NOT EXISTS LOGDATA (ID INTEGER PRIMARY KEY, EVENTID TEXT, DATA TEXT)');

    var rows = logDB.execute('SELECT * FROM LOGDATA GROUP BY EVENTID');
    //Titanium.API.info('ROW COUNT = ' + rows.getRowCount());
    
    // TODO: group the rows by eventID
    var tmpData = new Array();
    var previousSelection = selectedEvents.slice(0);
    selectedEvents.splice(0,selectedEvents.length); // clear the list

    if(rows.getRowCount() > 0) {
        while(rows.isValidRow()){
            var thisData = rows.fieldByName('DATA');
            var thisObject = JSON.parse(thisData);

            var rowParams = {   title:new Date(thisObject.timestamp).toLocaleString(),
                                eventID:rows.fieldByName('EVENTID'),
                                content:thisData,
                                timestamp:thisObject.timestamp};

            /* // notes on creating custom row layouts
            row = Ti.UI.createTableViewRow();
            row.hasDetail = true;
            row.title = rows.field(1);
            row.leftImage = '../images/film/small/'+rows.fieldByName('small_img');
            data[rows.field(0)] = row;
            rows.next();
            */

            // look up the eventid in the selectedEvents array.
            if(previousSelection.indexOf(rowParams.eventID) >= 0) {
                Ti.API.info('Found previously selected event');
                rowParams.hasCheck = true;
                selectedEvents.push(rowParams.eventID); // restore this selection
            } else {
                Ti.API.info('Found unselected event');
                //rowParams.hasDetail = true;
            }
            tmpData.push(rowParams);
            rows.next();
        };
    }
    rows.close();
    logDB.close();

    // sort chronolocically:
    tmpData.sort(compareTime);

    Ti.API.info('Got '+tmpData.length+' events');
    Ti.API.info('Selected events: '+selectedEvents);

    if(tmpData.length == 0) { 
        tmpData.push({title:'No Logs recorded.',touchEnabled:false});
    } else {
        logTable.editable=true;
    }

    // this seems to only be available on iPhone.
    if(Ti.Platform.name == "iPhone OS"){
        Ti.API.info('Updating the iPhone log table');
        logTable.setData(tmpData);
    } else {
        // hack for android
        Ti.API.info('Updating the Android log table');
        win.remove(logTable);
        logTable.data = tmpData;
        win.add(logTable);
    }

    // hide the activity indicator
    actInd.hide();
}

// reload the logs when the window gains focus
win.addEventListener('focus',function() {
    loadLogs();
    //selectedEvents = [];
});

// the android doesn't seem to be responding to focus or open events
// TODO: fix me please
if(Ti.Platform.name == 'android') {
    loadLogs();
    //selectedEvents = [];
}


function compareTime(a, b) {
    return b.timestamp - a.timestamp;
}


// add the log table to the view.
win.add(logTable);
