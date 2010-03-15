// this sets the background color of the master UIView (when there are no windows/tab groups on it)
Titanium.UI.setBackgroundColor('#000');

var greenColor = 'rgb(85,130,80)';

// create tab group
var tabGroup = Titanium.UI.createTabGroup();
tabGroup.backgroundColor=greenColor;

//
// create base UI tab and root window
//
var win1 = Titanium.UI.createWindow({  
    url:'main_windows/dashboardView.js',
    title:'Dashboard',
    backgroundColor:'#aaa',
    barColor:greenColor
});
var tab1 = Titanium.UI.createTab({  
    icon:'KS_nav_views.png',
    title:'Dashboard',
    backgroundColor:greenColor,
    window:win1
});

//
// create controls tab and root window
//
var win2 = Titanium.UI.createWindow({  
    url:'main_windows/logList.js',
    title:'Logs',
    backgroundColor:'#ccc',
    barColor:greenColor
});
var tab2 = Titanium.UI.createTab({  
    icon:'KS_nav_ui.png',
    title:'Logs',
    backgroundColor:greenColor,
    window:win2
});

//
// Settings Tab 
//
var winSettings = Titanium.UI.createWindow({  
    url:'main_windows/settings.js',
    title:'Settings',
    backgroundColor:'#ccc',
    barColor:greenColor
});
var tabSettings = Titanium.UI.createTab({  
    icon:'settings_tab.png',
    title:'Settings',
    backgroundColor:greenColor,
    window:winSettings
});



//
//  add tabs
//
tabGroup.addTab(tab1);
tabGroup.addTab(tab2);  
tabGroup.addTab(tabSettings);


// open tab group
tabGroup.open();
