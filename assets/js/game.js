window.addEventListener("keydown", function(e) { if([32, 37, 38, 39, 40].indexOf(e.keyCode) > -1) { e.preventDefault(); } }, false); // space and arrow keys
window.onload  = function () { window.focus(); };
window.onclick = function () { window.focus(); };
window.onerror = function(event) {
	draw_text_on_loading_canvas("Exception thrown, see JavaScript console");
	Module.setStatus = function(text) { if (text) console.error("[post-exception status] " + text); };
};

var PACKAGE_FOLDER = "../assets/games/"
var PACKAGE_NAME   = document.currentScript.getAttribute("PACKAGE_NAME").replace(/ /g, '');;
var PACKAGE_SIZE   = 16777216;
var PACKAGE_FILES  = [{"filename": "/game.love", "start": 0, "end": 2764592}]

var Module = {}

Module.arguments                 = ["./game.love"]
Module.INITIAL_MEMORY            = 16777216
Module.totalDependencies         = 0
Module.remainingDependencies     = 0
Module.expectedDataFileDownloads = 1;
Module.finishedDataFileDownloads = 0;
Module.canvas                    = document.getElementById("canvas");
Module.printErr                  = console.error.bind(console)
Module.preRun                    = [run_with_filesystem];

Module.setStatus = function(text) {
	if (text) {
		draw_text_on_loading_canvas(text)
	} else if (Module.remainingDependencies === 0) {
		// game is loaded, hide loading_canvas and show game
		document.getElementById("canvas").style.visibility      = "visible";
		document.getElementById("loading_canvas").style.display = "none";
	}
}

Module.monitorRunDependencies = function(left) {
	this.remainingDependencies = left;
	this.totalDependencies     = Math.max(this.totalDependencies, left);
	Module.setStatus(left ? "Preparing... (" + (this.totalDependencies-left) + "/" + this.totalDependencies + ")" : "All downloads complete.");
}

Module.setStatus("Downloading...");


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

function run_with_filesystem() {
	
	function DataRequest(start, end) {
		this.start = start;
		this.end   = end;
	}
	
	DataRequest.prototype = {
		requests: {},

		open: function(mode, name) {
			this.name           = name;
			this.requests[name] = this;
			Module['addRunDependency']('fp ' + this.name);
		},

		send: function() {},

		onload: function() {
			var byteArray = this.byteArray.subarray(this.start, this.end);
			this.finish(byteArray);
		},

		finish: function(byteArray) {
			var that = this;
			
			Module['FS_createDataFile'](this.name, null, byteArray, true, true, true); // canOwn this data in the filesystem, it is a slide into the heap that will never change
			Module['removeRunDependency']('fp ' + that.name);
			
			this.requests[this.name] = null;
		}
	};
	
	function fetch_remote_package(package_name, package_size, callback) {
		var xhr = new XMLHttpRequest();
		xhr.open('GET', package_name, true);
		xhr.responseType = 'arraybuffer';
		xhr.onprogress = function(event) {
			var url  = package_name;
			var size = package_size;

			if (event.total) size = event.total;
			
			if (event.loaded) {
				if (!xhr.addedTotal) {
					xhr.addedTotal = true;
					if (!Module.dataFileDownloads) Module.dataFileDownloads = {};
					Module.dataFileDownloads[url] = {
						loaded: event.loaded,
						total: size
					};
				} else {
					Module.dataFileDownloads[url].loaded = event.loaded;
				}
	
				var total  = 0;
				var loaded = 0;
				var num    = 0;
				for (var download in Module.dataFileDownloads) {
					var data = Module.dataFileDownloads[download];
	
					total  += data.total;
					loaded += data.loaded;
					num    += 1;
				}
	
				total = Math.ceil(total * Module.expectedDataFileDownloads/num);
	
				Module.setStatus('Downloading data... (' + loaded + '/' + total + ')');
	
			} else if (!Module.dataFileDownloads) {
				Module.setStatus('Downloading data...');
			}
		};
		xhr.onerror = function(event) {
			throw new Error("NetworkError for: " + package_name);
		}
		xhr.onload = function(event) {
			if (xhr.status == 200 || xhr.status == 304 || xhr.status == 206 || (xhr.status == 0 && xhr.response)) { // file URLs can return 0
				var package_data = xhr.response;
				callback(package_data);
			} else {
				throw new Error(xhr.statusText + " : " + xhr.responseURL);
			}
		};
		xhr.send(null);
	};
	
	function process_package_data(array_buffer) {
		Module.finishedDataFileDownloads += 1;
		
		if (!array_buffer)                        throw 'Loading data file failed.'         + new Error().stack;
		if (!array_buffer instanceof ArrayBuffer) throw 'bad input to process_package_data' + new Error().stack;

		var byteArray = new Uint8Array(array_buffer);
		
		// copy the entire loaded file into a spot in the heap. Files will refer to slices in that. They cannot be freed though
		// (we may be allocating before malloc is ready, during startup).
		if (Module['SPLIT_MEMORY']) Module.printErr('warning: you should run the file packager with --no-heap-copy when SPLIT_MEMORY is used, otherwise copying into the heap may fail due to the splitting');

		var ptr = Module['getMemory'](byteArray.length);

		Module['HEAPU8'].set(byteArray, ptr);
		DataRequest.prototype.byteArray = Module['HEAPU8'].subarray(ptr, ptr+byteArray.length);
		
		for (i = 0; i < PACKAGE_FILES.length; ++i) DataRequest.prototype.requests[PACKAGE_FILES[i].filename].onload();
		
		Module.removeRunDependency('datafile_game.data');
	};

	for (i = 0; i < PACKAGE_FILES.length; ++i) new DataRequest(PACKAGE_FILES[i].start, PACKAGE_FILES[i].end).open('GET', PACKAGE_FILES[i].filename);

	Module['addRunDependency']('datafile_game.data');
	
	if (!Module.preloadResults) Module.preloadResults = {};

	console.info('loading ' + PACKAGE_NAME + ' from remote');

	fetch_remote_package(PACKAGE_FOLDER + PACKAGE_NAME, PACKAGE_SIZE, function(package_data) { process_package_data(package_data); });

	Module.setStatus('Downloading...');
}
