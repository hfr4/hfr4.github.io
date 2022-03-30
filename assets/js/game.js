var PACKAGE_FOLDER = "../assets/games/"
var PACKAGE_NAME   = document.currentScript.getAttribute("PACKAGE_NAME").replace(/ /g, "");;

var Module = {
	arguments: [PACKAGE_NAME],
	canvas   : document.getElementById("canvas"),
	printErr : console.error.bind(console),
	preRun   : load_game,
}

window.addEventListener("keydown", (e) => { if([32, 37, 38, 39, 40].indexOf(e.keyCode) > -1) { e.preventDefault(); } }, false); // space and arrow keys
window.onerror = () => draw_text_on_loading_canvas("Error");

draw_text_on_loading_canvas("Initializing...");

// FUNCTIONS

function go_full_screen(){
	var c = document.getElementById("canvas");
	if     (c.requestFullScreen)       c.requestFullScreen();
	else if(c.webkitRequestFullScreen) c.webkitRequestFullScreen();
	else if(c.mozRequestFullScreen)    c.mozRequestFullScreen();
}

function draw_text_on_loading_canvas(text) {
	var ctx = document.getElementById("loading_canvas").getContext("2d");

	ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
	ctx.font      = "2em Courier New";
	ctx.textAlign = "center"
	ctx.fillStyle = "white";
	ctx.fillText(text, ctx.canvas.scrollWidth / 2, ctx.canvas.scrollHeight / 2);
}

function load_game() {
	draw_text_on_loading_canvas("Downloading...");
	
	Module.addRunDependency("rd_" + PACKAGE_NAME);

	var req = new XMLHttpRequest();
	req.open("GET", PACKAGE_FOLDER + PACKAGE_NAME, true);
	req.responseType = "arraybuffer";
	req.onload       = (e) => {
		var byte_array = new Uint8Array(e.target.response);
		
		Module.FS_createDataFile(PACKAGE_NAME, null, byte_array, true, true, true);
		Module.removeRunDependency("rd_" + PACKAGE_NAME);

		document.getElementById("canvas").style.display         = "unset";
		document.getElementById("loading_canvas").style.display = "none";
	};
	req.send();
}
