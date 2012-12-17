/*
 * Mobile Logger. Record geotagged sensor values on a mobile device.
 * Copyright (C) 2010 Robert Carlsen
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

// Not committed to the repo. Contains service keys.
Ti.include('keys.js');
// --- //

// include required assets:
Ti.include('tools/util.js');
Ti.include('main_windows/api.js');

Ti.include('tools/date.format.js');
Ti.include('tools/util.js');
Ti.include('tools/xml.js');
Ti.include('main_windows/export.js');

// set up some global constants
var orangeColor = '#d56009';
var blueColor = '#c8e6ff';

//---//
// version migration. housekeeping code
// upgrade..if the upload function is mobile logger, clear the property:
if('mobileLogger' === Ti.App.Properties.getString('uploadService')) {
    Ti.App.Properties.removeProperty('uploadService');
}
// uploading while logging is no longer supported. remove this preference
if(Ti.App.Properties.hasProperty('uploadEnabled')) {
    Ti.App.Properties.removeProperty('uploadEnabled');
}
//---//

// set up the Google authentication service.
var GoogleAuth = require('modules/googleAuth');
var googleAuth = new GoogleAuth({
    clientId : GoogleAPI.clientId,
    clientSecret : GoogleAPI.clientSecret,
    propertyName : 'googleToken',
    quiet: false,
    scope : [
        'https://www.googleapis.com/auth/fusiontables',
        'https://www.googleapis.com/auth/fusiontables.readonly', 
        'https://www.googleapis.com/auth/userinfo.email'       // only used to display the email address of the currently logged in user
    ]
});
// anti-pattern...but trying to test other things first:
Ti.App.googleAuth = googleAuth;

// app configuration:
Ti.Geolocation.purpose = "Log location, movement and sound.";
setupDatabase();

// this sets the background color of the master UIView (when there are no windows/tab groups on it)
Titanium.UI.setBackgroundColor('#000');

//require and open top level UI component
var AppTabGroup = require('main_windows/AppTabGroup');
new AppTabGroup().open();


