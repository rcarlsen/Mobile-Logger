
    function circle(x,y,r) {
      cx.beginPath();
      cx.arc(x, y, r, 0, Math.PI*2, true);
      cx.closePath();
      cx.fill();
    }

    function rect(x,y,w,h) {
      cx.beginPath();
      cx.rect(x,y,w,h);
      cx.closePath();
      cx.fill();
    }

    function clear() {
      cx.clearRect(0, 0, WIDTH, HEIGHT);
    }


