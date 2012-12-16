var orangeColor = '#d56009';
var blueColor = '#c8e6ff';

function AppTabGroup() {
    //declare module dependencies
    var SettingsWindow = require('main_windows/settings');
    var LogWindow = require('main_windows/logList');
    
    // create tab group
    var self = Titanium.UI.createTabGroup();
    
    //
    // create base UI tab and root window
    //
    var win1 = Titanium.UI.createWindow({  
        url:'main_windows/dashboardView.js',
        // title:'Dashboard',
        backgroundColor:'#ccc',
        navBarHidden:true
    });
    
    
    var tab1 = Titanium.UI.createTab({  
        icon:'map-tab-icons.png',
        title:'Dashboard',
        window:win1
    });
    
    //
    // Log list Tab
    //
    var winLogs = new LogWindow('Logs');
    var tabLogs = Titanium.UI.createTab({
        icon:'list-tab-icons.png',
        title:'Logs',
        window:winLogs
    });
    
    //
    // Settings Tab 
    //
    var winSettings = new SettingsWindow('Settings');
    var tabSettings = Titanium.UI.createTab({  
        icon:'settings_tab.png',
        title:'Settings',
        window:winSettings
    });
    
    //
    //  add tabs
    //
    self.addTab(tab1);
    self.addTab(tabLogs);  
    self.addTab(tabSettings);
    
    return self;
};

module.exports = AppTabGroup;
