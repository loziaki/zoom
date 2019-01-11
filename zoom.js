var zoom = (function (objName, imgarr) {

	window.requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;

	console.log(1);

	var canvas = document.getElementById(objName);
	var zc = $('#' + objName);
	console.log(imgarr)
	var context;
	//
	var window_w, window_h;
	var center_x, center_y;
	var element_w;
	var element_h;
	var startposition = 0;
	var z_position = 0
	var lastframe = null;
	var steps;
	//
	var pause = false;
	//
	var playback = true;
	var hue = 0;
	var fx = localStorage.getItem("fx") || 'nofx';

	var direction = 1;
	var keyboardMap = {
		up: false,
		down: false
	};
	//
	// var slowspeed = 6;
	var fastspeed = 15;
	// var maxspeed = 100;


	var speedfactor = 1;
	var portrait = false;

	var speed = fastspeed;
	var visiblesteps = 2;
	var color1 = '#222';
	var color2 = '#444';
	var loaded = false;
	var loadpercent = 0;
	var tilewidth = 750;
	var tileheight = 1468;
	var loadcompleted = false;
	var z_opac = 0;
	var z_opac_target = 0;
	var visitstart = Date.now();
	var filterelements = $('.filtered');

	//var imgarray = [
	//	'./img/11.jpg',
	//	'./img/12.jpg',

	//	'./img/13.jpg',
	//	'./img/14.jpg',
	//];
	var imgarray = imgarr || [];
	//for (var i = 0; i <= visiblesteps; i++) {
	//	var f = imgarray.pop();
	// 	imgarray.unshift(f)
	//};



	var length = imgarray.length;
	/* SETUP */
	$(window).resize(function () {
		resize();
	});

	function setup() {
		context = canvas.getContext('2d');
		resize();
		setupsteps();
		window.requestAnimationFrame(loop);

	}

	function resize(scale) {

		if (window.devicePixelRatio !== undefined) {
			dpr = window.devicePixelRatio;
		} else {
			dpr = 1;
		}
		var w = $(window).width();
		var h = $(window).height();
		window_w = w * dpr;
		window_h = h * dpr;

		center_x = window_w / 2;
		center_y = window_h / 2;

		if (window_w > window_h * (tilewidth / tileheight)) {
			element_w = window_w;
			element_h = window_w * (tileheight / tilewidth);
		} else {
			element_w = window_h * (tilewidth / tileheight);
			element_h = window_h;
		}
		portrait = (window_h > window_w);

		zc.attr('width', window_w);
		zc.attr('height', window_h);

	}

	function loadstatus() {
		if (!loaded) {
			loadpercent = 0;
			var isready = steps.every(function (element) {
				if (element.ready) loadpercent += 100 / steps.length;
				return element.ready;
			});

			if (isready) {
				$("#zc").animate({
					'opacity': 1
				}, (100 - z_opac) * 5);
				loadcompleted = true;
				$('body').removeClass('loading');
			}
			return isready;
		} else return true;
	}

	/* IMG OBJECT */
	function zoom_img(src) {
		var that = this;
		this.ready = false;
		this.img = new Image();
		this.img.onload = function () {
			that.ready = true;
			if (loadstatus()) {
				loaded = true;
				var loadtime = (Date.now() - visitstart) / 1000;
			}
		};
		this.img.src = src;
	}

	/* POPULATE STEP OBJECTS ARRAY */
	function setupsteps() {
		steps = [];
		for (var i = 0; i < imgarray.length; i++) {
			steps.push(new zoom_img(imgarray[i]));
		}
	}

	/* ANIMATION LOOP */
	function loop(timestamp) {
		var elapsed = 0;
		if (!lastframe) {
			lastframe = timestamp;
		} else {
			elapsed = timestamp - lastframe;
			lastframe = timestamp;
		}

		// CONTROL
		if (loaded) {
			var zoomspeed = 0.0003 * elapsed

			if (pause) {
				z_position = z_position;
			} else if (keyboardMap.up) {
				z_position += zoomspeed * 3;
			} else if (keyboardMap.down) {
				z_position -= zoomspeed * 3;
			} else if (playback) {
				z_position += (zoomspeed / 8 * ((portrait) ? speed * speedfactor : speed));
			}
			if (z_position < 0) {
				z_position += steps.length;
			}
			if (z_position > steps.length) {
				// z_position-=steps.length;
				z_position = steps.length;
				return;
			}
			//console.log(z_position);
		}

		// DISPLAY
		context.clearRect(0, 0, canvas.width, canvas.height);
		// build array of visible steps, looping end to the beginning
		var steparray = [];
		for (var i = 0; i < visiblesteps; i++) {
			// steparray.push( steps[ (Math.floor(z_position)+i)%steps.length ] );
			if ((Math.floor(z_position) + i) < imgarray.length) {
				steparray.push(steps[(Math.floor(z_position) + i)]);
			}
		}
		//
		var scale = Math.pow(2, (z_position % 1));
		//console.log(scale);
		// draw the collected image steps
		for (var i = 0; i < steparray.length; i++) {
			var x = center_x - element_w / 2 * scale;
			var y = center_y - element_h / 2 * scale + (-280 * scale + 280) * (element_h / tileheight);
			var w = element_w * scale;
			var h = element_h * scale;

			if (steparray[i].ready) {
				context.drawImage(steparray[i].img, x, y, w, h);
			} else {
				context.fillStyle = ((Math.floor(z_position) + i) % 2 === 0) ? color1 : color2;
				context.fillRect(x, y, w, h);
			}
			scale *= 0.5;
		}

		//如果还没载入完成就一直停留在第一针
		if (!loadcompleted) {
			if (steparray.every(function (e) {
					return e.ready
				})) {
				z_opac_target = loadpercent;
			}
			if (z_opac < z_opac_target) {
				z_opac += 0.5;
			}

			zc.css('opacity', (z_opac / 100));
			// z_position = startposition+(z_opac/2000);
			z_position = startposition;


			if (loaded) {

			}
		}

		if (steparray.length > 1) {
			window.requestAnimationFrame(loop);
		}
	}

	if (canvas.getContext) {
		setup();
	}

	/****************/
	/* Pause    	*/
	/****************/

	function togglePause() {
		pause = !pause;
	}

	// /* KEYBOARD */
	// 	$(document).keydown(function(event) {
	// 		if (event.which === 32) {
	// 			playback = !playback;
	// 			speedbuttons.removeClass('active');
	// 			if (playback) {
	// 				active_speed_button.addClass('active');
	// 			} else {
	// 				button_p.addClass('active');
	// 			}
	// 			event.preventDefault();
	// 		}
	// 		if (event.which === 38) {keyboardMap.up = true;event.preventDefault();}
	// 		if (event.which === 40) {keyboardMap.down = true;event.preventDefault();}
	// 	});
	// 	$(document).keyup(function(event) {
	// 		if (event.which === 38) {keyboardMap.up = false;event.preventDefault();}
	// 		if (event.which === 40) {keyboardMap.down = false;event.preventDefault();}
	// 	});


	/****************/
	/* Fullscreen	*/
	/****************/

	// document.addEventListener('fullscreenchange', function () {
	//     isFullscreen = !!document.fullscreen;
	//     fullscreenchange();
	// }, false);
	// document.addEventListener('mozfullscreenchange', function () {
	//     isFullscreen = !!document.mozFullScreen;
	//     fullscreenchange();
	// }, false);
	// document.addEventListener('webkitfullscreenchange', function () {
	//     isFullscreen = !!document.webkitIsFullScreen;
	//     fullscreenchange();
	// }, false);
	// function fullscreenchange() {
	//     if(isFullscreen) {
	// 		$('#fullscreen').addClass('active');
	//     } else {
	// 		$('#fullscreen').removeClass('active');
	//     }
	// }
	function toggleFullScreen() {
		if (!document.fullscreenElement && !document.mozFullScreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement) {
			if (document.documentElement.requestFullscreen) {
				document.documentElement.requestFullscreen();
			} else if (document.documentElement.msRequestFullscreen) {
				document.documentElement.msRequestFullscreen();
			} else if (document.documentElement.mozRequestFullScreen) {
				document.documentElement.mozRequestFullScreen();
			} else if (document.documentElement.webkitRequestFullscreen) {
				document.documentElement.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
			}
		} else {
			if (document.exitFullscreen) {
				document.exitFullscreen();
			} else if (document.msExitFullscreen) {
				document.msExitFullscreen();
			} else if (document.mozCancelFullScreen) {
				document.mozCancelFullScreen();
			} else if (document.webkitExitFullscreen) {
				document.webkitExitFullscreen();
			}
		}
	}

	return {
		togglePause: togglePause,
	}
});