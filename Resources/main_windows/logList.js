// the log file list viewer


Ti.include('../tools/json2.js');

var win = Ti.UI.currentWindow;

var selectedEvents = [];

// add a send action button
var b = Titanium.UI.createButton();

// use special button icon if on iPhone
if(Ti.Platform.name == 'iPhone OS'){
    b.systemButton = Titanium.UI.iPhone.SystemButton.ACTION    
} else {
    b.title = 'Send';
}

b.addEventListener('click',function(){
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
    }/* else if (selectedEvents.length > 1) {
        Ti.UI.createAlertDialog({
            title:'Select one log',
            message:"Select one log to send at a time. \n *TODO: this is a bug*"
        }).show();
        return;
    }*/

    // retrieve the rows and setup an email message
    var sampleData;
    var logDB = Ti.Database.open("log.db");

    var eventListArray = [];
    for (var i = 0; i < selectedEvents.length; i++) {
        var evt = selectedEvents[i].eventID;
        eventListArray.push("'"+evt+"'"); // trying to get this query to work.
        Ti.API.info('eventID: '+selectedEvents[i].eventID);
    };

    Ti.API.info('Selected Events list: '+eventListArray.valueOf());
    //var eventList = eventListArray.join();
    
    // i think that each of these items needs to be surrounded by quotes
    var rows = logDB.execute('SELECT * FROM LOGDATA WHERE EVENTID IN (?)',eventListArray);
    Titanium.API.info('Samples retrieved from db: ' + rows.getRowCount());
  
    // TODO: group the rows by eventID
    var tmpData=[];
    while(rows.isValidRow()){
        var thisData = rows.fieldByName('DATA');
        tmpData.push(thisData);
        rows.next();
    };
    rows.close();

    // ok, now construct the email window
    var emailView = Ti.UI.createEmailDialog();
    emailView.setSubject('Log data');
    
    var tmpDataString = tmpData.join();
    emailView.setMessageBody('Your log data is below: \n\n' + tmpDataString);

    Ti.API.info('output string: '+tmpDataString);

    // emailView.addAttachment(tmpDataString);

    emailView.addEventListener('complete',function(e)
    {
        if (e.result == emailView.SENT)
        {
            // TODO: this isn't really necessary, is it?
            alert("Mail sent.");
        }
        else if(e.result == emailView.FAILED)
        {
            alert("There was a problem. Check your network connection. Debug: "+e.result);
        }
    });
    emailView.open();

});

win.rightNavButton = b;
rightnav = true;

var data = [
	{title:'Log file loading...'}
];

// create a table view for the logs
var logTable = Ti.UI.createTableView({
    data:data
});

logTable.addEventListener('click',function(e) 
{
    // create a child view with the sample data
    // TODO: organize the data into events
    // inspect each event in the child view
    //
    if(e.detail){ // only do this if the detail icon was clicked
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
    } else {
        // toggle the checked status of this row
       if(e.row.hasCheck == null || e.row.hasCheck == false) {
           var data = e.row;
           //logTable.updateRow(e.index,data);
            data.hasCheck = true;
            data.hasDetail = false;

            var evt = {id:e.index,eventID:data.eventID};
            selectedEvents.push(evt);

            Ti.API.info('row '+e.index+' selected. ('+data.eventID+')');
       } else {
           var data = e.row;
           data.hasDetail = true;
           data.hasCheck = false;
           //logTable.updateRow(e.index,data);
           
           // remove this selected item
           for (var i = 0; i < selectedEvents.length; i++) {
               if(selectedEvents[i].eventID == data.eventID) {
                selectedEvents.splice(i,1); // remove this element
                Ti.API.info('row '+e.index+' deselected. ('+data.eventID+')');
               }
           };
       }
    }
});

win.add(logTable);

// call up the log list from the database
function loadLogs () {
    // open the database connection (create if necessary)
    var logDB = Ti.Database.open("log.db");

    // TODO: move the data base stuff into a class.
    logDB.execute('CREATE TABLE IF NOT EXISTS LOGDATA (ID INTEGER PRIMARY KEY, EVENTID TEXT, DATA TEXT)');

    var rows = logDB.execute('SELECT * FROM LOGDATA GROUP BY EVENTID');
    Titanium.API.info('ROW COUNT = ' + rows.getRowCount());
  
    // TODO: group the rows by eventID
    var tmpData = [];
    while(rows.isValidRow()){
        var thisData = rows.fieldByName('DATA');
        tmpData.push({  title:new Date(JSON.parse(thisData).timestamp).toLocaleString(),
                        eventID:rows.fieldByName('EVENTID'),
                        content:thisData,
                        hasDetail:true});
        rows.next();
    };
    rows.close();

    if(tmpData.length == 0) { tmpData.push({title:'No Logs recorded.'});};

    // this seems to only be available on iPhone.
    if(Ti.Platform.name == "iPhone OS"){
        logTable.setData(tmpData);
    } else {
        logTable.data = tmpData;
    }
}

// reload the logs when the window gains focus
win.addEventListener('focus',function() {
    loadLogs();
    selectedEvents = [];
});


//loadLogs();
