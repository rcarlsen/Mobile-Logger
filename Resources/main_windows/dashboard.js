function Dashboard(cx) {
    this.cx = cx;
    this.r = 120;

    this.currentHeading = 180;
    this.headingRadians = function(heading) { return heading * (Math.PI/180);};

    this.currentSpeed = 0.0;
    this.speedUnits = "MPH";

    this.distance = 0;
    this.distanceUnits = "Miles";

    this.time = new Date();

    this.draw = function(){
      clear();

      this.cx.save();
      this.cx.translate(WIDTH/2,HEIGHT/2);
      // roughly constructing the dashboard element
      this.cx.fillStyle = "rgba(200,100,0,.3)";
      circle(0,0,this.r);
      this.cx.fill();
    
      this.cx.fillStyle = "rgba(10,10,10,.7)";
 

      // build the compass around the outside
        this.cx.save();
        this.cx.rotate(-Math.PI/2); // put 0 degrees at the top

        // now rotate to the current heading
        this.cx.rotate(this.headingRadians(this.currentHeading));

        var count = 64;
        for (var i = 0; i < count; i++) {
            this.cx.save();
            var a = i*(Math.PI*2)/count;
           
           // set colors for the cardinal directions
            this.cx.rotate(a);
            this.cx.translate(this.r-10,0);

            if(i==0){
              this.cx.fillStyle = "rgba(200,50,50,.9)"; // red for north
              rect(0,0,20,3);
            } else if(a%(Math.PI/2) < 0.05) {
                this.cx.fillStyle = "rgba(10,10,10,0.9)"; // dark for cardinal directions
                rect(0,0,20,3);
            } else {
                this.cx.fillStyle = "rgba(10,10,10,0.5)";
                rect(0,0,15,2);
            }
          // draw a short rect, then rotate:
            this.cx.restore();
        };
      this.cx.restore();

    // current heading at the top
    this.cx.save();
    this.cx.translate(0,-this.r+35);

//    this.cx.fillStyle = "rgba(10,10,10,.9)";
    this.cx.font = "bold 18pt sans-serif";
    this.cx.textAlign = "center";
    this.textBaseline = "bottom";
    this.cx.fillText(this.currentHeading + "\u00B0",0,0); // Unicode for degree symbol
    this.cx.restore();
   

    // current speed in the center:
    this.cx.save();
 //   this.cx.fillStyle = "rgba(10,10,10,.7)";
    this.cx.textAlign = "center";
    this.cx.font = "bold 64pt sans-serif";
    this.cx.fillText(parseFloat(this.currentSpeed),0,0); // the speed
    this.cx.font = "bold 18pt sans-serif";
    this.cx.fillText(this.speedUnits,0,25); // the label
    this.cx.restore();


    // trip distance in here, too
    this.cx.save();
  //  this.cx.fillStyle = "rgba(10,10,10,.7)";
    this.cx.font = "16pt sans-serif";
    this.cx.textAlign = "center";

    this.cx.translate(0,55);
    this.cx.fillText(this.distance +" "+ this.distanceUnits,0,0);
    // TODO: add an odometer like effect here?
    
    this.cx.translate(0,25);
    
    this.cx.font = "12pt sans-serif";
    this.cx.fillText(this.time.getMinutes() +":"+ this.time.getSeconds(),0,0);
    
    this.cx.restore();



    this.cx.restore();
    }


}
