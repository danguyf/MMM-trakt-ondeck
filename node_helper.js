        importoldtoken().catch(function(){
          return trakt.get_codes().then(function(poll) {
              self.log('Trakt Access Code: ' + poll.user_code);
              self.sendSocketNotification("OAuth", {
                  code: poll.user_code
              });
              return trakt.poll_access(poll);
          }).catch(error => {
            self.errorLog(error, new Error());
            return Promise.reject(error);
          }).then(function(){
            importtoken = trakt.export_token();
            fs.writeFile("./modules/MMM-trakt/token.json", JSON.stringify(importtoken), "utf8", function (err,data) {
              if (err) {
                return self.errorLog(err, new Error());
              }
            });
          });
        }).then(function(){
            trakt.import_token(importtoken).then(newTokens => {
            self.log(importtoken);
            self.debugLog(trakt);
            refreshTokenPeriodically();  // Add this line to start refreshing the token periodically
            trakt.calendars.my.shows({
                start_date: moment().subtract(1, 'd').format("YYYY-MM-DD"),
                days: days+2,
                extended: 'full'
            }).then(shows => {
                self.sendSocketNotification("SHOWS", {
                    shows: shows
                });
            }).catch(error => {
              self.errorLog(error, new Error());
            });
          });
        }).catch(error => {
          self.errorLog(error, new Error());
        });
    },
    socketNotificationReceived: function(notification, payload) {
        this.debug = payload.debug;
        if (notification === "PULL") {
            this.createFetcher(payload.client_id, payload.client_secret, payload.days);
        }
    },
    log: function (msg) {
      console.log("[" + (new Date(Date.now())).toLocaleTimeString() + "] - " + this.name + " - : ", msg);
    },
    debugLog: function (msg) {
      if (this.debug) {
        console.log("[" + (new Date(Date.now())).toLocaleTimeString() + "]
        importoldtoken().catch(function(){
          return trakt.get_codes().then(function(poll) {
              self.log('Trakt Access Code: ' + poll.user_code);
              self.sendSocketNotification("OAuth", {
                  code: poll.user_code
              });
              return trakt.poll_access(poll);
          }).catch(error => {
            self.errorLog(error, new Error());
            return Promise.reject(error);
          }).then(function(){
            importtoken = trakt.export_token();
            fs.writeFile("./modules/MMM-trakt/token.json", JSON.stringify(importtoken), "utf8", function (err,data) {
              if (err) {
                return self.errorLog(err, new Error());
              }
            });
          });
        }).then(function(){
            trakt.import_token(importtoken).then(newTokens => {
            self.log(importtoken);
            self.debugLog(trakt);
            refreshTokenPeriodically();  // Add this line to start refreshing the token periodically
            trakt.calendars.my.shows({
                start_date: moment().subtract(1, 'd').format("YYYY-MM-DD"),
                days: days+2,
                extended: 'full'
            }).then(shows => {
                self.sendSocketNotification("SHOWS", {
                    shows: shows
                });
            }).catch(error => {
              self.errorLog(error, new Error());
            });
          });
        }).catch(error => {
          self.errorLog(error, new Error());
        });
    },
    socketNotificationReceived: function(notification, payload) {
        this.debug = payload.debug;
        if (notification === "PULL") {
            this.createFetcher(payload.client_id, payload.client_secret, payload.days);
        }
    },
    log: function (msg) {
      console.log("[" + (new Date(Date.now())).toLocaleTimeString() + "] - " + this.name + " - : ", msg);
    },
    debugLog: function (msg) {
      if (this.debug) {
        console.log("[" + (new Date(Date.now())).toLocaleTimeString() + "] - " + this.name + " - DEBUG: ", msg);
      }
    },
    errorLog: function (error, stack) {
      console.error("[" + (new Date(Date.now())).toLocaleTimeString() + "] - " + this.name + " - ERROR: ", error);
      if (this.debug) {
        console.error(stack);
      }
    }
});
