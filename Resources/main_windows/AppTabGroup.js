/*
 * Mobile Logger. Record geotagged sensor values on a mobile device.
 * Copyright (C) 2010-2012 Robert Carlsen
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
