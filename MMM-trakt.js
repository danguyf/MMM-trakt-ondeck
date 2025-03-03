Module.register("MMM-trakt", {
	defaults: {
		updateInterval: 60 * 60 * 1000, //every 60 minutes
		initialLoadDelay: 0,
		days: 1,
		displayType: "upcoming",
		debug: false,
		styling : {
		  	moduleSize: "small",
			daysUntil: false,
			daysUntilFormat: "hh:mm",
			dateFormat: "D.M hh:mm",
			showEpisodeTitle: true,
		},
	},
	getTranslations() {
		return {
			en: 'translations/en.json',
			de: 'translations/de.json',
			kr: 'translations/kr.json',
			pt: 'translations/pt.json',
			sv: 'translations/sv.json',
			da: 'translations/da.json'
		};
	},
	getStyles: function () {
		return ["MMM-trakt.css"];
	},
	getScripts: function() {
		return ["moment.js"];
	},
	start: function() {
		Log.info("Starting module: " + this.name);
		moment.locale(config.language);
		this.config.styling = { ...this.defaults.styling, ...this.config.styling };
		this.traktData = {};
		this.traktCode;
		this.loaded = false;
		this.scheduleUpdate(this.config.initialLoadDelay);
		// Schedule update interval for ui.
		var self = this;
		setInterval(function () {
		      self.updateDom();
		}, 1000 * 10); // 1min
	},

	getHeader: function () {
		return this.data.header;
	},

	getDom: function() {
		let wrapper = document.createElement('div');
		if (Object.keys(this.traktData).length === 0 && this.traktCode === undefined) {
			wrapper.innerHTML = 'Error loading module. Please check the logs.';
		} else if (Object.keys(this.traktData).length === 0) {
			wrapper.innerHTML = 'Please enter the following on https://trakt.tv/activate: ' + this.traktCode
				+ '<br> Or scan the following QR Code: <br> '
				+ '<img src="/modules/MMM-trakt/qr-code.svg" alt="QR Code" height="15%" width="15%">';
		} else {
			let table = document.createElement('table');
			table.className = this.config.styling.moduleSize + " traktHeader";
			let showCount = 0; // Keep track of the number of shows to generate unique ids

			// sort on-deck in reverse chronology by next_episode, otherwise chronologically by episode
			if (this.config.displayType == "on-deck") {
				shows = this.traktData.sort((a,b) => moment.utc(b.next_episode.first_aired) - moment.utc(a.next_episode.first_aired));
			} else {
				shows = this.traktData.sort((a,b) => moment.utc(a.episode.first_aired) - moment.utc(b.episode.first_aired));
			}

			for (let show in shows) {
				// next_episode for on-deck, otherwise episode
				if (this.config.displayType == "on-deck") {
					this_episode = this.traktData[show].next_episode;
				} else {
					this_episode = this.traktData[show].episode;
				}

				let date = moment.utc(this_episode.first_aired).local();
				if (this.config.displayType == "on-deck" || date.isBetween(moment().subtract(this.config.days, "d"), moment().add(1, "d"), 'days', '[]')) {
					let tableRow = table.insertRow(-1);
					tableRow.className = 'normal';

					// Name
					let showTitleCell = tableRow.insertCell();
					showTitleCell.innerHTML = this.traktData[show].show.title;
					showTitleCell.className = 'bright traktShowTitle';
					showTitleCell.id = 'showTitle' + showCount; // Add a unique id

					// Add scroll function if text overflows cell
					let scrollAmount = 0;
					function scrollTitle() {
						showTitleCell.scrollLeft += 1;
						scrollAmount++;
						if(scrollAmount < showTitleCell.scrollWidth) {
							setTimeout(scrollTitle, 20);
						}
					}
					if (showTitleCell.offsetWidth < showTitleCell.scrollWidth) {
						setTimeout(scrollTitle, 20000); // Start scrolling after 20 seconds
					}

					showCount++;
					// Episode
					let seasonNo = (this_episode.season);
					let episode = (this_episode.number);
					seasonNo = seasonNo <= 9 ? seasonNo.toLocaleString(undefined, { minimumIntegerDigits: 2 }) : seasonNo.toString();
					episode = episode <= 9 ? episode.toLocaleString(undefined, { minimumIntegerDigits: 2 }) : episode.toString();
					let episodeCell = tableRow.insertCell();
					episodeCell.innerHTML = 'S' + seasonNo + 'E' + episode;
					episodeCell.className = 'traktEpisode';

					// Title
					if (this.config.styling.showEpisodeTitle) {
						let titleCell = tableRow.insertCell();
						const episodeTitle = this_episode.title;
						titleCell.innerHTML = episodeTitle === null ? '' : '\'' + episodeTitle + '\'';
						titleCell.className = "traktTitle";
					}
					// Airtime
					var airtime;
					if (this.config.styling.daysUntil) {
						airtime = moment.utc(this_episode.first_aired).local().calendar(moment.utc().local(), {
							sameDay: '[' + this.translate('TODAY') + '] ' + this.config.styling.daysUntilFormat,
							nextDay: '[' + this.translate('TOMORROW') + '] ' + this.config.styling.daysUntilFormat,
							nextWeek: this.config.styling.dateFormat,
							sameElse: this.config.styling.dateFormat
						});
					} else {
						airtime = moment.utc(this_episode.first_aired)
								.local().format(this.config.styling.dateFormat);
					}
					let airtimeCell = tableRow.insertCell();
					airtimeCell.innerHTML = airtime;
					airtimeCell.className = 'light traktAirtime';
				}
				wrapper.appendChild(table);
			}
		}
		return wrapper;
	},
	
	updateTrakt: function() {
		var self = this;
		if (self.config.client_id === "") {
			self.log("ERROR - client_id not set");
			return;
		}
		if (self.config.client_secret === "") {
			self.log("ERROR - client_secret not set");
			return;
		}
		this.sendSocketNotification("PULL", {
			client_id: self.config.client_id,
			client_secret: self.config.client_secret,
			days: self.config.days,
			displayType: self.config.displayType,
			debug: self.config.debug
		});
	},

	socketNotificationReceived: function(notification, payload) {
		if (notification === "SHOWS") {
			this.debugLog(payload.shows);
			this.traktData = payload.shows;
			this.updateDom();
		}
		if (notification === "OAuth") {
			this.log(payload.code);
			this.traktCode = payload.code;
			this.updateDom();
		}
	},

	scheduleUpdate: function(delay) {
		if (typeof delay === "undefined" && delay < 0) {
			delay = 0;
		}
		var self = this;
		setTimeout(function() {
			self.updateTrakt();
			setInterval(function () {
				self.updateTrakt();
			}, self.config.updateInterval);
		}, delay);
	},

	log: function (msg) {
		Log.log("[" + (new Date(Date.now())).toLocaleTimeString() + "] - " + this.name + " - : ", msg);
	},

	debugLog: function (msg) {
		if (this.config.debug) {
			Log.log("[" + (new Date(Date.now())).toLocaleTimeString() + "] - DEBUG - " + this.name + " - : ", msg);
		}
	}
});
