// api for uploading samples to the database
// need to generate a post request with the data to send (json)
// get the database from the properties
//

function uploadSample (sample) {
    if(sample == null) return;

    var xhr = Titanium.Network.createHTTPClient();
    xhr.onload = function()
    {
        //Ti.API.info('POSTed sample: '+JSON.stringify(sample));
        Ti.API.info('With response: '+this.responseText);
    };
    xhr.onerror = function()
    {
        Ti.API.info('Upload error: '+this.responseText);
    };
    // TODO: get the url from the properties
    xhr.open("POST","http://mobilelogger.robertcarlsen.net/api/addSample");
    xhr.send("data="+JSON.stringify(sample));
}

function bulkUpload (samples) {
    if(samples == null || samples.length == 0) return;

    var xhr = Titanium.Network.createHTTPClient();
    xhr.onload = function()
    {
        //Ti.API.info('POSTed samples: '+JSON.stringify(sample));
        Ti.API.info('With response: '+this.responseText);

        //TODO: the response is an array of the new doc ids
        //we need to store those docs ids to prevent duplicate docs
    };
    xhr.onerror = function()
    {
        Ti.API.info('Upload error: '+this.responseText);
    };
    // TODO: get the url from the properties
    var out = {docs:samples};

    xhr.open("POST","http://mobilelogger.robertcarlsen.net/api/addSamples");
    xhr.send("data="+JSON.stringify(out));
}
