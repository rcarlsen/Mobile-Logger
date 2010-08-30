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

// api for uploading samples to the database
// need to generate a post request with the data to send (json)
// get the database from the properties
//

// conduit for messages
// expecting that the app will attach the progress meter to it.
var _api = {};
function api() {
    return _api;
}


function uploadSample (sample) {
    if(sample == null) { return; }

    var xhr = Titanium.Network.createHTTPClient();
    xhr.onload = function()
    {
        //Ti.API.info('POSTed sample: '+JSON.stringify(sample));
        //Ti.API.info('With response: '+this.responseText);
        return this.responseText;
    };
    xhr.onerror = function()
    {
        Ti.API.info('Upload error: '+this.responseText);
        return this.responseText;
    };
    // TODO: get the url from the properties
    xhr.open("POST","http://mobilelogger.robertcarlsen.net/api/addSample");
    xhr.send("data="+JSON.stringify(sample));
}


/*
var progress;
var cancel;
function bulkUploadBatch (samples) {
    if(samples == null || samples.length == 0) { return; }
    
    Ti.API.info('cancel status in bulkUpload: '+cancel);

// how do we create an event callback here?
// the idea is that we send batches of samples to the server
// and after every batch we issue a callback to let the 
// device update the display


// from a functional standpoint, this will have to be several
// http requests won't it? Loop thru all the elements?

    var range = {index: 0, length: 100};
    if(range.length > samples.length) {range.length = samples.length;}

    // start the progress meter
    if(progress == null) {
        cancel = false;
        progress = samples.length;

        Ti.API.info('About to tell app to create a new progress bar');
        Ti.UI.currentWindow.fireEvent('uploadProgress',{value:0});
    }

    // var xhr = Titanium.Network.createHTTPClient();
    xhr.onload = function()
    {
        Ti.API.info('cancel status in onload function: '+cancel);

        if(cancel) {
            Ti.UI.currentWindow.fireEvent('uploadProgress',{value:-1});
            progress = null;
            return 'Cancelled by user';
        }
        
        //Ti.API.info('POSTed samples: '+JSON.stringify(sample));
        //Ti.API.info('With response: '+this.responseText);

        //TODO: the response is an array of the new doc ids
        //we need to store those docs ids to prevent duplicate doc
        //
        // this is where a new upload needs to occur
        // TODO: evaluate if this method is highly wasteful of memory
        //
        var pmeter = 1-(samples.length/progress);
        Ti.API.info('Upload pogress in bulkUpload(): '+pmeter);

        Ti.UI.currentWindow.fireEvent('uploadProgress',{value:pmeter});

        if(samples.length > range.length) {
            bulkUploadBatch(samples.slice(range.length-1));
        }
        else {
            // done with the upload
            Ti.UI.currentWindow.fireEvent('uploadProgress',{value:1.0});
            progress = null;
        }

        return this.responseText;
    };
    xhr.onerror = function()
    {
        Ti.UI.currentWindow.fireEvent('uploadProgress',{value:-1});
        progress = null;

        Ti.API.info('Upload error: '+this.responseText);
        return this.responseText;
    };
    // TODO: get the url from the properties
    // TODO: what's the array split/subarray command?
    var out = {docs:samples.slice(range.index,range.length)};

    xhr.open("POST","http://mobilelogger.robertcarlsen.net/api/addSamples");
    xhr.send("data="+JSON.stringify(out));
}
*/

var cancel;
function bulkUpload (samples) {
    if(samples == null || samples.length == 0) { return; }
    
    // start the progress meter
    Ti.API.info('About to tell app to create a new progress bar');
    Ti.UI.currentWindow.fireEvent('uploadProgress',{value:0});

    var xhr = Titanium.Network.createHTTPClient();
    xhr.onload = function(e)
    {
        // done with the upload
        //Ti.UI.currentWindow.fireEvent('uploadProgress',{value:1.0});

        return e.responseText;
    };
    xhr.onerror = function(e)
    {
        Ti.UI.currentWindow.fireEvent('uploadProgress',{value:-1});

        Ti.API.info('Upload error: '+e.responseText);
        return e.responseText;
    };

    xhr.onsendstream = function(e)
    {
        if(cancel) { xhr.abort(); }
        Ti.UI.currentWindow.fireEvent('uploadProgress',{value:e.progress});
    };

    var out = {docs:samples};

    xhr.open("POST","http://mobilelogger.robertcarlsen.net/api/addSamples");
    xhr.send("data="+JSON.stringify(out));
}



function uploadManager(win) {
    Ti.API.info('In the uploadManager constructor');

    this._xhr = Titanium.Network.createHTTPClient();
    this._window = win;
    var my = this;

    this.bulkUpload = function(_data) {
        if(_data == null || _data.length == 0) { return; }

        // start the progress meter
        Ti.API.info('About to tell app to create a new progress bar');
        my.uploadProgress({value:0});

        my._xhr.onload = function(e)
        {
            return e.responseText;
        };

        my._xhr.onerror = function(e)
        {
            my.uploadProgress({value:-1});

            Ti.API.info('Upload error: '+e.responseText);
            return e.responseText;
        };

        my._xhr.onsendstream = function(e)
        {
            my.uploadProgress({value:e.progress});
        };

        var out = {docs:_data};
        my._xhr.open("POST","http://mobilelogger.robertcarlsen.net/api/addSamples");
        my._xhr.send("data="+JSON.stringify(out));
    };

    this.cancelUpload = function() {
        my._xhr.abort();
        Ti.API.info('Cancelling xhr request');
    };


    this.progressView = null;
    this.progressBar = null;
    this.uploadProgress = function(o)
    {
        // want this to display a progress bar
        // should also generate a view 
        if(o.window == null) { o.window = my._window; }
        if(o.value == null) { o.value = 0; }

        if(my.progressView == null) {
            // create a view...then add the bar to it.
            // then add it to the current window
            Ti.API.info('Creating a progress view');
            my.progressView = Ti.UI.createView({
                top:0,
                width:320, // TODO: adjust this to fit the window
                height:50,
                backgroundColor:'#666',
                opacity:0
            });

            Ti.API.info('Creating the upload progress bar');
            my.progressBar = Titanium.UI.createProgressBar({
                width:260,
                left: 10,
                min:0,
                max:1,
                value:0,
                color:'#fff',
                message:'Upload progress',
                font:{fontSize:14, fontWeight:'bold'},
                style:Titanium.UI.iPhone.ProgressBarStyle.PLAIN
            });

            // add a cancel button:
            var btnPath = Titanium.Filesystem.resourcesDirectory + '/images/close-btn.png';
            Ti.API.info('button image path: '+btnPath);

            var closeBtn = Ti.UI.createButton({
                backgroundImage:btnPath,
                right: 10,
                width: 30,
                height: 30
            });
            closeBtn.addEventListener('click',function(){
                Ti.API.info('Upload cancel button pressed.');
                my.cancelUpload();
            });
            
            my.progressView.add(closeBtn);

            my.progressView.add(my.progressBar);
            my.progressBar.show();
            o.window.add(my.progressView);

            my.progressView.animate({opacity:0.9,duration:250});
        }
        

        if(o.value < 0) { // error condition
             my.progressBar.message = 'Upload failed';

             setTimeout(function(){
               my.progressView.animate({opacity:0,duration:250},function() {
                   o.window.remove(my.progressView);
                   //progressView = null;
               });
           },1500);

            o.value = 0;
        } 
        else {
            my.progressBar.value = o.value;
        }
        // if the progress is complete, automatically
        // dismiss the view after a few moments
        if(o.value >= 1.0) {
           Ti.API.info('About to fade the progress view');
           my.progressBar.message = 'Upload finished';

           setTimeout(function(){
               my.progressView.animate({opacity:0,duration:250},function() {
                   o.window.remove(my.progressView);
                   //progressView = null;
               });
           },1000);
        }
    };
}

