function go_full_screen(){
	var c = document.getElementById("canvas");
	if     (c.requestFullScreen)       c.requestFullScreen();
	else if(c.webkitRequestFullScreen) c.webkitRequestFullScreen();
	else if(c.mozRequestFullScreen)    c.mozRequestFullScreen();
}

window.onload  = function () { window.focus(); };
window.onclick = function () { window.focus(); };

window.addEventListener("keydown", function(e) {
	// space and arrow keys
	if([32, 37, 38, 39, 40].indexOf(e.keyCode) > -1) {
		e.preventDefault();
	}
}, false);

window.onerror = function(event) {
	// TODO: do not warn on ok events like simulating an infinite loop or exitStatus
	Module.setStatus("Exception thrown, see JavaScript console");
	Module.setStatus = function(text) {
		if (text) Module.printErr("[post-exception status] " + text);
	};
};

var PACKAGE_NAME        = 'assets/games/game.data';
var REMOTE_PACKAGE_NAME = 'assets/games/game.data';
var PACKAGE_FILES       = [{"filename": "/game.love", "crunched": 0, "start": 0, "end": 2764592, "audio": false}]
var REMOTE_PACKAGE_SIZE = 2764592;
var PACKAGE_UUID        = "7029bf48-def9-48bf-97c6-a46d907cf0f5";

var PACKAGE_PATH;
if      (typeof window   === 'object')    { PACKAGE_PATH = window['encodeURIComponent'](window.location.pathname.toString().substring(0, window.location.pathname.toString().lastIndexOf('/')) + '/'); } 
else if (typeof location !== 'undefined') { PACKAGE_PATH = encodeURIComponent(location.pathname.toString().substring(0, location.pathname.toString().lastIndexOf('/')) + '/'); } // worker
else { throw 'using preloaded data can only be done on a web page or in a web worker'; }


var Module = {}

Module.arguments             = ["./game.love"]
Module.INITIAL_MEMORY        = 16777216
Module.totalDependencies     = 0
Module.remainingDependencies = 0

Module.canvas = (function() {
	var c = document.getElementById("canvas");
	
	// As a default initial behavior, pop up an alert when webgl context is lost. To make your
	// application robust, you may want to override this behavior before shipping!
	// See http://www.khronos.org/registry/webgl/specs/latest/1.0/#5.15.2
	c.addEventListener("webglcontextlost", function(e) { alert("WebGL context lost. You will need to reload the page."); e.preventDefault(); }, false);
	
	return c;
})()

Module.setStatus = function(text) {
	if (text) {
		// draw loading text
		var ctx = document.getElementById("loading_canvas").getContext("2d");
		
		ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
		
		ctx.font      = "2em Courier New";
		ctx.textAlign = "center"
		ctx.fillStyle = "white";
		ctx.fillText(text, ctx.canvas.scrollWidth / 2, ctx.canvas.scrollHeight / 2);
		
		ctx.fillText("Powered By Emscripten.", ctx.canvas.scrollWidth / 2, ctx.canvas.scrollHeight / 4);
		ctx.fillText("Powered By LÖVE."      , ctx.canvas.scrollWidth / 2, ctx.canvas.scrollHeight / 4 * 3);
		
	} else if (Module.remainingDependencies === 0) {
		// game is loaded, hide loading_canvas and show game
		document.getElementById("loading_canvas").style.display = "none";
		document.getElementById("canvas").style.visibility      = "visible";
	}
}

Module.monitorRunDependencies = function(left) {
	this.remainingDependencies = left;
	this.totalDependencies     = Math.max(this.totalDependencies, left);
	Module.setStatus(left ? "Preparing... (" + (this.totalDependencies-left) + "/" + this.totalDependencies + ")" : "All downloads complete.");
}

Module.printErr = console.error.bind(console)

Module.setStatus("Downloading...");

if (!Module.expectedDataFileDownloads) {
	Module.expectedDataFileDownloads = 0;
	Module.finishedDataFileDownloads = 0;
}

Module.expectedDataFileDownloads++;


function fetch_remote_package(packageName, packageSize, callback, errback) {
	var xhr = new XMLHttpRequest();
	xhr.open('GET', packageName, true);
	xhr.responseType = 'arraybuffer';
	xhr.onprogress = function(event) {
		var url  = packageName;
		var size = packageSize;
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
			var total = 0;
			var loaded = 0;
			var num = 0;
			for (var download in Module.dataFileDownloads) {
				var data = Module.dataFileDownloads[download];
				total += data.total;
				loaded += data.loaded;
				num++;
			}
			total = Math.ceil(total * Module.expectedDataFileDownloads/num);
			if (Module['setStatus']) Module['setStatus']('Downloading data... (' + loaded + '/' + total + ')');
		} else if (!Module.dataFileDownloads) {
			if (Module['setStatus']) Module['setStatus']('Downloading data...');
		}
	};
	xhr.onerror = function(event) {
		throw new Error("NetworkError for: " + packageName);
	}
	xhr.onload = function(event) {
		if (xhr.status == 200 || xhr.status == 304 || xhr.status == 206 || (xhr.status == 0 && xhr.response)) { // file URLs can return 0
			var packageData = xhr.response;
			callback(packageData);
		} else {
			throw new Error(xhr.statusText + " : " + xhr.responseURL);
		}
	};
	xhr.send(null);
};

function handle_error(error) {
	console.error('package error:', error);
};

function run_with_filesystem() {
	
	function assert(check, msg) {
		if (!check) throw msg + new Error().stack;
	}
	
	function DataRequest(start, end, crunched, audio) {
		this.start    = start;
		this.end      = end;
		this.crunched = crunched;
		this.audio    = audio;
	}
	
	DataRequest.prototype = {
		requests: {},
		open: function(mode, name) {
			this.name = name;
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
	
	var files = PACKAGE_FILES;
	
	for (i = 0; i < files.length; ++i) {
		new DataRequest(files[i].start, files[i].end, files[i].crunched, files[i].audio).open('GET', files[i].filename);
	}
	
	var indexedDB           = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
	var IDB_RO              = "readonly";
	var IDB_RW              = "readwrite";
	var DB_NAME             = "EM_PRELOAD_CACHE";
	var DB_VERSION          = 1;
	var METADATA_STORE_NAME = 'METADATA';
	var PACKAGE_STORE_NAME  = 'PACKAGES';
	
	function open_database(callback, errback) {
		try {
			var openRequest = indexedDB.open(DB_NAME, DB_VERSION);
		} catch (e) {
			return errback(e);
		}
		
		openRequest.onupgradeneeded = function(event) {
			var db = event.target.result;
			
			if(db.objectStoreNames.contains(PACKAGE_STORE_NAME)) {
				db.deleteObjectStore(PACKAGE_STORE_NAME);
			}
			var packages = db.createObjectStore(PACKAGE_STORE_NAME);
			
			if(db.objectStoreNames.contains(METADATA_STORE_NAME)) {
				db.deleteObjectStore(METADATA_STORE_NAME);
			}
			var metadata = db.createObjectStore(METADATA_STORE_NAME);
		};
		
		openRequest.onsuccess = function(event) {
			var db = event.target.result;
			callback(db);
		};
		
		openRequest.onerror = function(error) {
			errback(error);
		};
	};
	
	/* Check if there's a cached package, and if so whether it's the latest available */
	function check_cached_package(db, packageName, callback, errback) {
		var transaction = db.transaction([METADATA_STORE_NAME], IDB_RO);
		var metadata    = transaction.objectStore(METADATA_STORE_NAME);
		
		var getRequest = metadata.get("metadata/" + packageName);
		getRequest.onsuccess = function(event) {
			var result = event.target.result;
			if (!result) {
				return callback(false);
			} else {
				return callback(PACKAGE_UUID === result.uuid);
			}
		};
		getRequest.onerror = function(error) {
			errback(error);
		};
	};
	
	function fetch_cached_package(db, packageName, callback, errback) {
		var transaction = db.transaction([PACKAGE_STORE_NAME], IDB_RO);
		var packages    = transaction.objectStore(PACKAGE_STORE_NAME);
		
		var getRequest = packages.get("package/" + packageName);
		getRequest.onsuccess = function(event) {
			var result = event.target.result;
			callback(result);
		};
		getRequest.onerror = function(error) {
			errback(error);
		};
	};
	
	function cache_remote_package(db, packageName, packageData, packageMeta, callback, errback) {
		var transaction_packages = db.transaction([PACKAGE_STORE_NAME], IDB_RW);
		var packages             = transaction_packages.objectStore(PACKAGE_STORE_NAME);
		
		var putPackageRequest = packages.put(packageData, "package/" + packageName);
		putPackageRequest.onsuccess = function(event) {
			var transaction_metadata = db.transaction([METADATA_STORE_NAME], IDB_RW);
			var metadata             = transaction_metadata.objectStore(METADATA_STORE_NAME);
			var putMetadataRequest   = metadata.put(packageMeta, "metadata/" + packageName);
			putMetadataRequest.onsuccess = function(event) {
				callback(packageData);
			};
			putMetadataRequest.onerror = function(error) {
				errback(error);
			};
		};
		putPackageRequest.onerror = function(error) {
			errback(error);
		};
	};
	
	function process_package_data(arrayBuffer) {
		Module.finishedDataFileDownloads++;
		assert(arrayBuffer, 'Loading data file failed.');
		assert(arrayBuffer instanceof ArrayBuffer, 'bad input to process_package_data');
		var byteArray = new Uint8Array(arrayBuffer);
		var curr;
		
		// copy the entire loaded file into a spot in the heap. Files will refer to slices in that. They cannot be freed though
		// (we may be allocating before malloc is ready, during startup).
		if (Module['SPLIT_MEMORY']) Module.printErr('warning: you should run the file packager with --no-heap-copy when SPLIT_MEMORY is used, otherwise copying into the heap may fail due to the splitting');
		var ptr = Module['getMemory'](byteArray.length);
		Module['HEAPU8'].set(byteArray, ptr);
		DataRequest.prototype.byteArray = Module['HEAPU8'].subarray(ptr, ptr+byteArray.length);
		
		var files = PACKAGE_FILES;
		for (i = 0; i < files.length; ++i) {
			DataRequest.prototype.requests[files[i].filename].onload();
		}
		Module['removeRunDependency']('datafile_game.data');
		
	};
	
	function preload_fallback(error) {
		console.error(error);
		console.error('falling back to default preload behavior');
		fetch_remote_package(REMOTE_PACKAGE_NAME, REMOTE_PACKAGE_SIZE, process_package_data, handle_error);
	};

	Module['addRunDependency']('datafile_game.data');
	
	if (!Module.preloadResults) Module.preloadResults = {};
	
	open_database(function(db) {
		check_cached_package(db, PACKAGE_PATH + PACKAGE_NAME,function(useCached) {
				
			Module.preloadResults[PACKAGE_NAME] = {fromCache: useCached};

			if (useCached) {
				console.info('loading ' + PACKAGE_NAME + ' from cache');
				fetch_cached_package(db, PACKAGE_PATH + PACKAGE_NAME, process_package_data, preload_fallback);

			} else {
				console.info('loading ' + PACKAGE_NAME + ' from remote');
				fetch_remote_package(REMOTE_PACKAGE_NAME, REMOTE_PACKAGE_SIZE, function(packageData) { 
					cache_remote_package(db, PACKAGE_PATH + PACKAGE_NAME, packageData, { uuid:PACKAGE_UUID}, process_package_data, function(error) { 
						console.error(error); 
						process_package_data(packageData); 
					}); 
				}, preload_fallback);
			}

		}, preload_fallback);
	}, preload_fallback);
				
	if (Module['setStatus']) Module['setStatus']('Downloading...');
}

if (Module['calledRun']) {
	run_with_filesystem();
} else {
	if (!Module['preRun']) Module['preRun'] = [];
	Module["preRun"].push(run_with_filesystem); // FS is not initialized yet, wait for it
}
