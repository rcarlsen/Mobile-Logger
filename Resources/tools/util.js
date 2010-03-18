// utility methods

function toRad (deg) {
    // convert from degrees to radians
    var conversion = (Math.PI * 2) / 360;
    return deg*conversion;
}

function calculateDistanceDelta(pt1,pt2) {
    // the points should be hashes with {lon, lat}
    // calculate distance between adjacent points
    // reference for estimate in JavaScript.
     var R = 6371; // km
     var d =    Math.acos(Math.sin(toRad(pt1.lat))*
                Math.sin(toRad(pt2.lat))+Math.cos(toRad(pt1.lat))*
                Math.cos(toRad(pt2.lat))*Math.cos(toRad(pt2.lon)-toRad(pt1.lon))) * R;

    return d*1000; // in meters?
};
