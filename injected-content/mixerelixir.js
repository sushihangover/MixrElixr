//on document ready
var settings = null;
$(() => {
	// start the process
	log("Starting MixerElixir...");
	
	waitForPageLoad().then(() => {

		log("page loaded");

		//Listen for url changes
		window.addEventListener('url-change', function (e) {
			runPageLogic();
		});

		loadSettings().then(() => {
			// run page logic for the first load
			runPageLogic();

			// then let the url watcher trigger it from then on
			runUrlWatcher();
		});
	});
	
	// listen for an event from the Options page. This fires everytime the user adds or removes a time entry
	chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
		if(!request.settingsUpdated) return;
		loadSettings();
	});
});

function waitForPageLoad() {
	return new Promise((resolve, reject)=>{
		function doPageCheck() {
			var spinner = $("bui-progress-circle");
			var spinnerExists = spinner != null && spinner.length > 0;
			
			if(spinnerExists) {
				//spinner still exists, check again in a bit
				setTimeout(()=> { doPageCheck(); }, 100);
			} else {
				//spinner is gone, lets party
				setTimeout(()=> { resolve(); }, 500);			
			}
		}

		doPageCheck();
	});
}

function runPageLogic() {
	//check if we are on a streamer page by looking for the name in the top right corner.
	var channelBlock = $("b-channel-owners-block");
	
	if(channelBlock != null  && channelBlock.length > 0) {
		log("detected streamer page...");

		function getStreamerName() {
			return new Promise((resolve, reject) => {
				// double check it's still here
				var channelBlock = $("b-channel-owners-block");
				if(channelBlock != null && channelBlock.length > 0) {
					var name = channelBlock.find("h2").text();
					if(name != null && name !== "") {
						resolve(name);
					} else {
						setTimeout(() => { getStreamerName(); }, 100);
					}
				} else {
					reject();
				}					
			});
		}

		// get the streamers name, this also waits for the page to load
		getStreamerName().then((name) => {
			log("streamer page loaded...");
			loadStreamerPage(name);
		});
	} else {
		log("looks like we are on the main page");
	}
}

function loadStreamerPage(streamerName) {
	log(`Loading streamer page for: ${streamerName}`)
	if(settings.autoCloseInteractive) {
		var minimizeInteractiveBtn = $("button[buitooltip='Minimize controls'");
		if(minimizeInteractiveBtn != null) {
			minimizeInteractiveBtn.click();
		}
	}	
}

function loadSettings() {
	return new Promise((resolve, reject) => {
		getSettings().then((savedSettings) => {
			settings = savedSettings;
			resolve();
		});
	});	
}

function getSettings() {
	return new Promise((resolve, reject) => {
		chrome.storage.sync.get({
			"settings": null
		  }, (options) => {
			resolve(options.settings);	  
		  });
	});
}


function runUrlWatcher() {
	var interval = null;
	var previousUrl = window.location.href;

	if(interval != null) {
		clearInterval(interval);
	}

	interval = setInterval(() => {
		var currentUrl = window.location.href;
		if(previousUrl !== currentUrl) {

			// fire event
			var event = new CustomEvent('url-change', { current: currentUrl, previous: previousUrl });
			window.dispatchEvent(event);

			previousUrl = currentUrl;
		}	
	}, 500);
}

/* Helpers */

function log(message) {
	console.log(`[ME: ${message}]`);
}








