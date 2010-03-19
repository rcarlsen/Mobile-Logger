/** Settings window
*/

// The Android can't do a grouped table layout but it does have sections.
// Also, I don't think that it can have controls in the table rows, can it?
//
var win = Titanium.UI.currentWindow;

var inputData = [
{title:'Enabled', header:'Network'},
{title:'Server'},
{title:'Database'}
];

var resumeRow = addControlRow('Auto-resume','autoResume',false);
resumeRow.header = 'Configuration';
inputData.push(resumeRow);
inputData.push(addControlRow('Metric Units','useMetric'));
inputData.push(addControlRow('Monitor Sound Levels','monitorSound',false));

function addControlRow(label,property,initialValue)
{
    if(initialValue == null) initialValue = false;

	var row = Ti.UI.createTableViewRow({height:50});

    // add a label to the left
    // should be bold
    var cellLabel = Ti.UI.createLabel({
        text:label,
        font:{fontSize:16,fontWeight:'bold'},
        left:10
    });
    row.add(cellLabel);

    // enable the property to be omitted
    // TODO: use a type variable to create different styles of controls?
    if(property != null){
        // add a switch to the right
        var sw = Ti.UI.createSwitch({
            right:10,
            value:Ti.App.Properties.getBool(property,initialValue)
        });

        // add a callback function to set application
        // properties when the value is changed
        sw.addEventListener('change', function(e)
        {
            // update the property with the state of the switch
            Ti.App.Properties.setBool(property,e.value);

            Ti.API.info('Property changed: '+property+', '+e.value);
        });

        row.add(sw);

	}

	row.className = 'control';
	return row;
}



var tableView = Titanium.UI.createTableView({ 
	data:inputData, 
	style:Titanium.UI.iPhone.TableViewStyle.GROUPED, 
}); 
win.add(tableView);
