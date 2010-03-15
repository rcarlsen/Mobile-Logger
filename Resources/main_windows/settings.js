/** Settings window
*/

// The Android can't do a grouped table layout but it does have sections.
// Also, I don't think that it can have controls in the table rows, can it?
//
var win = Titanium.UI.currentWindow

var inputData = [
{title:'Enabled', header:'Network'},
{title:'Server'},
{title:'Database'},
{title:'Auto-resume', header:'Configuration'},
{title:'Other options'}

]; 
var tableView = Titanium.UI.createTableView({ 
	data:inputData, 
	style:Titanium.UI.iPhone.TableViewStyle.GROUPED, 
}); 
win.add(tableView);
