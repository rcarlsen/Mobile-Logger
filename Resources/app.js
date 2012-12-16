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

Ti.include('tools/util.js');
Ti.include('main_windows/api.js');

Ti.include('tools/date.format.js');
Ti.include('tools/util.js');
Ti.include('tools/xml.js');

Ti.include('main_windows/export.js');

var orangeColor = '#d56009';
var blueColor = '#c8e6ff';

// only here for testing.
// these properties should not be embedded in the source
var GoogleAuth = require('modules/googleAuth');
var googleAuth = new GoogleAuth({
    clientId : GoogleAPI.clientId,
    clientSecret : GoogleAPI.clientSecret,
    propertyName : 'googleToken',
    quiet: false,
    scope : ['https://www.googleapis.com/auth/fusiontables', 'https://www.googleapis.com/auth/fusiontables.readonly']
});

// anti-pattern...but trying to test other things first:
Ti.App.googleAuth = googleAuth;


setupDatabase();

// TODO: get rid of this.
// #dev only. clear the table, it will fallback on the dev table.
Ti.App.Properties.removeProperty('googleFusionTableID');

// upgrade..if the upload function is mobile logger, clear the property:
if('mobileLogger' === Ti.App.Properties.getString('uploadService')) {
    Ti.App.Properties.removeProperty('uploadService');
}

Ti.Geolocation.purpose = "Log location, movement and sound.";

// this sets the background color of the master UIView (when there are no windows/tab groups on it)
Titanium.UI.setBackgroundColor('#000');


// TODO: require the tabGroup file.
//require and open top level UI component
var AppTabGroup = require('main_windows/AppTabGroup');
new AppTabGroup().open();


