(function () {

   var arrDependencies;

   arrDependencies = [
      'widgetCore',
      'ngAnimate'
   ];

   (function ( $app ) {
      'use strict';

      return $app;
   })(angular.module('comboWidget', arrDependencies));
}).call(this);

(function () {

   'use strict';

   function appController( $scope, $widgetService, $apiService, $controller ) {

      // Extend the core controller that takes care of basic setup and common functions
      angular.extend(appController, $controller('widgetCoreController', {
         '$scope': $scope
      }));

      // Default arguments, these will be overridden by the arguments from the widget api
      $scope.defaultArgs = {
         filter: 'football/all/all/',
         defaultListLimit: 3, // A default setting for the size of the list, used when resetting
         selectionLimit: 12 // The maximum allowed selections, the bet slip supports up to 12 outcomes
      };

      // The bet offers and events to be loaded from the api
      $scope.betoffers = [];
      $scope.events = [];

      // Default Widget height, used when resetting the list
      $scope.defaultHeight = 450;

      // The actual list of the widget
      $scope.currentHeight = 450;

      // The height of a row, used when adding more events
      $scope.rowHeight = 115;

      // The actual limit of the list
      $scope.listLimit = 3;

      // Todo: Implement this?
      $scope.lowerOddsLimit = 2;


      $scope.args = angular.merge({}, $scope.defaultArgs);

      /**
       * Fetches the events based on the filter and sorts them according to their lowest outcome
       * @param {String} filter A string with the filter
       * @returns {*}
       */
      $scope.getBetoffersByFilter = function ( filter ) {
         // Loading flag
         $scope.loading = true;
         // Call the api and get the filtered events
         return $apiService.getEventsByFilter(filter)
            .then(function ( response ) {
                  $scope.events = [];
                  var sortedEvents = $scope.sortEventOffers(response.data.events);
                  var i = 0, len = sortedEvents.length, selectionCounter = 0, addedTeams = [];
                  for ( ; i < len; ++i ) {
                     // Check that the participants are not a in a previously added event, since they can only be in one outcome on the betslip
                     var participantsExist = false;

                     if ( sortedEvents[i].event.homeName != null ) {
                        if ( addedTeams.indexOf(sortedEvents[i].event.homeName) === -1 ) {
                           addedTeams.push(sortedEvents[i].event.homeName);
                        } else {
                           participantsExist = true;
                        }
                     }

                     if ( sortedEvents[i].event.awayName != null ) {
                        if ( addedTeams.indexOf(sortedEvents[i].event.awayName) === -1 ) {
                           addedTeams.push(sortedEvents[i].event.awayName);
                        } else {
                           participantsExist = true;
                        }
                     }

                     // Finally if the participant hasn't already been added, add it now
                     if ( !participantsExist ) {
                        if ( selectionCounter < $scope.listLimit ) {
                           sortedEvents[i].betOffers[0].outcomes[sortedEvents[i].betOffers[0].lowestOutcome].selected = true;
                           selectionCounter = selectionCounter + 1;
                        }
                        $scope.events.push(sortedEvents[i]);
                     }
                  }
                  // Calculate the odds for the selected bets
                  $scope.calculateCombinedOdds();
               },
               function ( response ) {
                  void 0;
                  void 0;
               }).finally(function () {
               // Unset the loading flag
               $scope.loading = false;
            });
      };

      /**
       * Sorts the events bases on the lowest odds in the first offer, if it has any offer
       * If the event does not contain a bet offer then it is filtered out
       * @param {Array.<Object>} events An array of events, each containing events and betOffers.
       * @returns {Array} The sorted and filtered array
       */
      $scope.sortEventOffers = function ( events ) {
         var i = 0, len = events.length, eventsWithOffers = [];
         for ( ; i < len; ++i ) {
            // Find the lowest outcome odds in the offering, store the index of the lowest outcome in the object for reference, rather than sorting the outcomes
            if ( events[i].betOffers[0] != null && events[i].betOffers[0].outcomes != null && events[i].betOffers[0].outcomes.length > 0 &&
               events[i].betOffers[0].outcomes.length <= 3 ) {
               var j = 1, outcomesLen = events[i].betOffers[0].outcomes.length, lowestOutcome = 0;
               for ( ; j < outcomesLen; ++j ) {
                  if ( events[i].betOffers[0].outcomes[j].odds < events[i].betOffers[0].outcomes[lowestOutcome].odds ) {
                     lowestOutcome = j;
                  }
               }
               events[i].betOffers[0].lowestOutcome = lowestOutcome;
               eventsWithOffers.push(events[i]);
            }
         }
         // Sort the events based on their lowest outcome
         return $scope.quickSortBetEvents(eventsWithOffers);
      };

      /**
       * Perform a quicksort on the bet offers based on their lowest outcome
       * @param {Array} items an array of bet offers
       * @param {number} [left] Optional start index
       * @param {number} [right] Option end index
       * @returns {Array} Returns an array of bet offers
       */
      $scope.quickSortBetEvents = function ( items, left, right ) {

         function swap( items, firstIndex, secondIndex ) {
            var temp = items[firstIndex];
            items[firstIndex] = items[secondIndex];
            items[secondIndex] = temp;
         }

         function partition( items, left, right ) {
            var pivot = items[Math.floor((right + left) / 2)],
               i = left,
               j = right;

            while ( i <= j ) {
               while ( items[i].betOffers[0].outcomes[items[i].betOffers[0].lowestOutcome].odds <
                        pivot.betOffers[0].outcomes[pivot.betOffers[0].lowestOutcome].odds ) {
                  i++;
               }

               while ( items[j].betOffers[0].outcomes[items[j].betOffers[0].lowestOutcome].odds >
                        pivot.betOffers[0].outcomes[pivot.betOffers[0].lowestOutcome].odds ) {
                  j--;
               }

               if ( i <= j ) {
                  swap(items, i, j);
                  i++;
                  j--;
               }
            }

            return i;
         }

         var index;

         if ( items.length > 1 ) {
            left = typeof left !== 'number' ? 0 : left;
            right = typeof right !== 'number' ? items.length - 1 : right;

            index = partition(items, left, right);

            if ( left < index - 1 ) {
               $scope.quickSortBetEvents(items, left, index - 1);
            }

            if ( index < right ) {
               $scope.quickSortBetEvents(items, index, right);
            }
         }

         return items;
      };


      /**
       * Calculates the combined odds of the selected outcomes
       */
      $scope.calculateCombinedOdds = function () {
         var i = 0, result = 1;
         switch ( $scope.oddsFormat ) {
            case 'american':
               // Todo: Implement american odds calculation
               break;
            case 'fractional':
               // Todo: Implement fractional odds calculation
               break;
            default:
               for ( ; i < $scope.listLimit; ++i ) {
                  var j = 0, outcomesLen = $scope.events[i].betOffers[0].outcomes.length;
                  for ( ; j < outcomesLen; ++j ) {
                     if ( $scope.events[i].betOffers[0].outcomes[j].selected ) {
                        result = result * $scope.events[i].betOffers[0].outcomes[j].odds / 1000;
                     }
                  }
               }
               break;
         }
         $scope.combinedOdds = Math.round(result * 100) / 100;
      };

      /**
       * Adds the outcomes to the betslip
       */
      $scope.addOutcomesToBetslip = function () {
         var i = 0, outcomes = [];
         for ( ; i < $scope.listLimit; ++i ) {
            var j = 0, outcomesLen = $scope.events[i].betOffers[0].outcomes.length;
            for ( ; j < outcomesLen; ++j ) {
               if ( $scope.events[i].betOffers[0].outcomes[j].selected ) {
                  outcomes.push($scope.events[i].betOffers[0].outcomes[j].id);
               }
            }

         }
         $widgetService.addOutcomeToBetslip(outcomes);
      };

      /**
       * Select the next unselected outcome
       */
      $scope.selectNextOutcome = function () {
         var i = 0, len = $scope.events.length, selectedCount = 0, alreadySelected = 0;
         for ( ; i < len; ++i ) {
            var j = 0, outcomeLen = $scope.events[i].betOffers[0].outcomes.length, hasSelected = false;
            for ( ; j < outcomeLen; ++j ) {
               if ( $scope.events[i].betOffers[0].outcomes[j].selected === true ) {
                  hasSelected = true;
                  alreadySelected = alreadySelected + 1;
               }
            }
            if ( alreadySelected >= $scope.args.selectionLimit ) {
               return false;
            }
            if ( hasSelected === false ) {
               if ( selectedCount === $scope.listLimit ) {
                  $scope.listLimit = $scope.listLimit + 1;
                  $scope.setWidgetHeight($scope.currentHeight + $scope.rowHeight);
               }
               $scope.events[i].betOffers[0].outcomes[$scope.events[i].betOffers[0].lowestOutcome].selected = true;
               $scope.calculateCombinedOdds();
               return true;
            } else {
               selectedCount = selectedCount + 1;
            }
         }
         return false;
      };

      /**
       * Clear the selected outcomes and set it back to the initial selection
       */
      $scope.resetSelection = function () {
         var i = 0, len = $scope.events.length, selectionCounter = 0;
         for ( ; i < len; ++i ) {
            var j = 0, outcomeLen = $scope.events[i].betOffers[0].outcomes.length;
            for ( ; j < outcomeLen; ++j ) {
               if ( selectionCounter < $scope.args.defaultListLimit && j === $scope.events[i].betOffers[0].lowestOutcome ) {
                  $scope.events[i].betOffers[0].outcomes[j].selected = true;
                  selectionCounter = selectionCounter + 1;
               } else {
                  $scope.events[i].betOffers[0].outcomes[j].selected = false;
               }

            }
         }
         // Reset the list size and height
         $scope.listLimit = $scope.args.defaultListLimit;
         $scope.setWidgetHeight($scope.defaultHeight);
         $scope.calculateCombinedOdds();
      };

      $scope.setLowerOddsLimit = function ( newLimit ) {
         if ( newLimit > 0 ) {
            $scope.lowerOddsLimit = newLimit;
         }
      };

      /**
       * Deselects all the outcomes passed and selects a new one
       * @param {Object} outcome Outcome to be selected
       * @param {Array.<Object>} outcomes Array of outcomes which will first be deselected
       */
      $scope.selectOutcome = function ( outcome, outcomes ) {
         var i = 0, len = outcomes.length;
         for ( ; i < len; ++i ) {
            outcomes[i].selected = false;
         }
         outcome.selected = true;
         $scope.calculateCombinedOdds();
      };

      // Call the init method in the coreWidgetController so that we setup everything using our overridden values
      // The init-method returns a promise that resolves when all of the configurations are set, for instance the $scope.args variables
      // so we can call our methods that require parameters from the widget settings after the init method is called
      $scope.init().then(function () {
         // Load the data from the api
         $scope.getBetoffersByFilter($scope.args.filter);
      });


   }

   (function ( $app ) {
      return $app.controller('appController', ['$scope', 'kambiWidgetService', 'kambiAPIService', '$controller', appController]);
   })(angular.module('comboWidget'));

}).call(this);

!function(){"use strict";function e(t,n,r,i,a){t.apiConfigSet=!1,t.appArgsSet=!1,t.oddsFormat="decimal",t.defaultHeight=350,t.currentHeight=350,t.apiVersion="v2",t.streamingAllowedForPlayer=!1,t.defaultArgs={},t.init=function(){var e=i.defer(),a=t.$on("CLIENT:CONFIG",function(n,i){null!=i.oddsFormat&&t.setOddsFormat(i.oddsFormat),i.version=t.apiVersion,r.setConfig(i),t.apiConfigSet=!0,t.apiConfigSet&&t.appArgsSet&&e.resolve(),a()}),o=t.$on("WIDGET:ARGS",function(n,i){t.setArgs(i),null!=i&&i.hasOwnProperty("offering")&&r.setOffering(i.offering),t.appArgsSet=!0,t.apiConfigSet&&t.appArgsSet&&e.resolve(),o()});return n.setWidgetHeight(t.defaultHeight),n.requestWidgetHeight(),n.enableWidgetTransition(!0),n.requestClientConfig(),n.requestWidgetArgs(),n.requestBetslipOutcomes(),n.requestOddsFormat(),e.promise},t.getConfigValue=function(e){return r.config.hasOwnProperty(e)?r.config[e]:null},t.navigateToLiveEvent=function(e){n.navigateToLiveEvent(e)},t.getWidgetHeight=function(){n.requestWidgetHeight()},t.setWidgetHeight=function(e){t.currentHeight=e,n.setWidgetHeight(e)},t.setWidgetEnableTransition=function(e){n.enableWidgetTransition(e)},t.removeWidget=function(){n.removeWidget()},t.addOutcomeToBetslip=function(e){n.addOutcomeToBetslip(e.id)},t.removeOutcomeFromBetslip=function(e){n.removeOutcomeFromBetslip(e.id)},t.requestBetslipOutcomes=function(){n.requestBetslipOutcomes()},t.requestWidgetArgs=function(){n.requestWidgetArgs()},t.requestPageInfo=function(){n.requestPageInfo()},t.requestOddsFormat=function(){n.requestOddsFormat()},t.setOddsFormat=function(e){t.oddsFormat=e},t.findEvent=function(e,t){for(var n=0,r=e.length;r>n;++n)if(e[n].id===t)return e[n];return null},t.getOutcomeLabel=function(e,t){return r.getOutcomeLabel(e,t)},t.setArgs=function(e){var n=t.defaultArgs;for(var r in e)e.hasOwnProperty(r)&&n.hasOwnProperty(r)&&(n[r]=e[r]);t.args=n},t.setPages=function(e,n,r){var i=r||e.length,a=Math.ceil(i/n),o=0;for(t.pages=[];a>o;++o)t.pages.push({startFrom:n*o,page:o+1})},t.updateBetOfferOutcomes=function(e,t){for(var n=0,r=e.outcomes.length,i=t.length;r>n;++n){var a=0,o=-1;for(e.outcomes[n].selected=!1;i>a;a++)e.outcomes[n].id===t[a].id&&(e.outcomes[n].odds=t[a].odds,o=n),-1!==o&&(e.outcomes[o].selected=!0)}};try{angular.module("widgetCore.translate"),angular.extend(e,a("translateController",{$scope:t}))}catch(o){}t.$on("WIDGET:HEIGHT",function(e,n){t.currentHeight=n})}!function(t){return t.controller("widgetCoreController",["$scope","kambiWidgetService","kambiAPIService","$q","$controller",e])}(angular.module("widgetCore",[]))}(),function(){!function(e){"use strict";e.filter("startFrom",function(){return function(e,t){return e?(t=+t,e.slice(t)):[]}})}(angular.module("widgetCore"))}(),function(){"use strict";!function(e){return e.directive("kambiPaginationDirective",[function(){return{restrict:"E",scope:{list:"=list",listLimit:"=",pages:"=",startFrom:"=",activePage:"="},template:'<span ng-class="{disabled:activePage === 1}" ng-if="pages.length > 1" ng-click="pagePrev()" class="kw-page-link kw-pagination-arrow"><i class="ion-ios-arrow-left"></i></span><span ng-if="pages.length > 1" ng-repeat="page in getPagination()" ng-click="setActivePage(page)" ng-class="{active:page === activePage}" class="kw-page-link l-pack-center l-align-center">{{page}}</span><span ng-class="{disabled:activePage === pages.length}" ng-if="pages.length > 1" ng-click="pageNext()" class="kw-page-link kw-pagination-arrow"><i class="ion-ios-arrow-right"></i></span>',controller:["$scope",function(e){e.activePage=1,e.setPage=function(t){e.startFrom=t.startFrom,e.activePage=t.page},e.setActivePage=function(t){e.setPage(e.pages[t-1])},e.pagePrev=function(){e.activePage>1&&e.setPage(e.pages[e.activePage-2])},e.pageNext=function(){e.activePage<e.pages.length&&e.setPage(e.pages[e.activePage])},e.pageCount=function(){return Math.ceil(e.list.length/e.listLimit)},e.getPagination=function(){var t=[],n=5,r=e.activePage,i=e.pageCount(),a=1,o=i;i>n&&(a=Math.max(r-Math.floor(n/2),1),o=a+n-1,o>i&&(o=i,a=o-n+1));for(var s=a;o>=s;s++)t.push(s);return 0!==i&&r>i&&e.setActivePage(1),t}}]}}])}(angular.module("widgetCore"))}(),function(){"use strict";!function(e){return e.service("kambiAPIService",["$http","$q","$rootScope",function(e,t,n){var r={};return r.configDefer=t.defer(),r.configSet=!1,r.offeringSet=!1,r.config={apiBaseUrl:null,apiUrl:null,channelId:null,currency:null,locale:null,market:null,offering:null,clientId:null,version:null},r.setConfig=function(e){for(var t in e)if(e.hasOwnProperty(t)&&r.config.hasOwnProperty(t))switch(r.config[t]=e[t],t){case"locale":n.$broadcast("LOCALE:CHANGE",e[t])}r.configSet=!0,r.configSet&&r.offeringSet&&r.configDefer.resolve()},r.setOffering=function(e){r.config.offering=e,r.offeringSet=!0,r.configSet&&r.offeringSet&&r.configDefer.resolve()},r.getGroupEvents=function(e){var t="/event/group/"+e+".json";return r.doRequest(t)},r.getEventsByFilterParameters=function(e,t,n,i,a,o){var s="/listView/";return s+=null!=e?r.parseFilterParameter(e):"all/",s+=null!=t?r.parseFilterParameter(t):"all/",s+=null!=n?r.parseFilterParameter(n):"all/",s+="all/",s+=null!=a?r.parseFilterParameter(e):"all/",r.doRequest(s,o,"v3")},r.parseFilterParameter=function(e){var t="";if(null!=e)if(angular.isArray(e)){for(var n=0,r=e.length;r>n;++n){if(angular.isArray(e[n])){var i=0,a=e[n].length;for(t+="[";a>i;++i)t+=e[n][i],a-1>i&&(t+=",");t+="]"}else t+=e[n];r-1>n&&(t+=",")}t+="/"}else angular.isstring(e)&&(t+=e);else t+="all/";return t},r.getEventsByFilter=function(e,t){var n="/listView/"+e;return r.doRequest(n,t,"v3")},r.getLiveEvents=function(){var e="/event/live/open.json";return r.doRequest(e)},r.getBetoffersByGroup=function(e,t,n,i,a){var o="/betoffer/main/group/"+e+".json";return r.doRequest(o,{include:"participants"})},r.getGroupById=function(e,t){var n="/group/"+e+".json";return r.doRequest(n,{depth:t})},r.doRequest=function(n,i,a){return r.configDefer.promise.then(function(){if(null==r.config.offering)return t.reject("The offering has not been set, please provide it in the widget arguments");var o=r.config.apiBaseUrl.replace("{apiVersion}",null!=a?a:r.config.version),s=o+r.config.offering+n,u=i||{},c={lang:u.locale||r.config.locale,market:u.market||r.config.market,client_id:u.clientId||r.config.clientId,include:u.include||null,callback:"JSON_CALLBACK"};return e.jsonp(s,{params:c,cache:!1})})},r.getOutcomeLabel=function(e,t){switch(e.type){case"OT_ONE":return t.homeName;case"OT_CROSS":return"Draw";case"OT_TWO":return t.awayName;default:return e.label}},r}])}(angular.module("widgetCore"))}(),function(){"use strict";!function(e){return e.service("kambiWidgetService",["$rootScope","$window","$q",function(e,t,n){var r,i,a={};return t.KambiWidget&&(i=n.defer(),r=i.promise,t.KambiWidget.apiReady=function(e){a.api=e,i.resolve(e)},t.KambiWidget.receiveResponse=function(e){a.handleResponse(e)}),a.handleResponse=function(t){switch(t.type){case a.api.WIDGET_HEIGHT:e.$broadcast("WIDGET:HEIGHT",t.data);break;case a.api.BETSLIP_OUTCOMES:e.$broadcast("OUTCOMES:UPDATE",t.data);break;case a.api.WIDGET_ARGS:e.$broadcast("WIDGET:ARGS",t.data);break;case a.api.PAGE_INFO:e.$broadcast("PAGE:INFO",t.data);break;case a.api.CLIENT_ODDS_FORMAT:e.$broadcast("ODDS:FORMAT",t.data);break;case a.api.CLIENT_CONFIG:e.$broadcast("CLIENT:CONFIG",t.data);break;case a.api.USER_LOGGED_IN:e.$broadcast("USER:LOGGED_IN",t.data)}},a.requestWidgetHeight=function(){var e=n.defer();return r.then(function(e){e.request(e.WIDGET_HEIGHT)}),e.promise},a.setWidgetHeight=function(e){var t=n.defer();return r.then(function(t){t.set(t.WIDGET_HEIGHT,e)}),t.promise},a.enableWidgetTransition=function(e){var t=n.defer();return r.then(function(t){e?t.set(t.WIDGET_ENABLE_TRANSITION):t.set(t.WIDGET_DISABLE_TRANSITION)}),t.promise},a.removeWidget=function(){var e=n.defer();return r.then(function(e){e.remove()}),e.promise},a.navigateToLiveEvent=function(e){var t=n.defer();return r.then(function(t){t.navigateClient("#event/live/"+e)}),t.promise},a.navigateToEvent=function(e){var t=n.defer();return r.then(function(t){t.navigateClient("#event/"+e)}),t.promise},a.navigateToGroup=function(e){var t=n.defer();return r.then(function(t){t.navigateClient("#group/"+e)}),t.promise},a.navigateToLiveEvents=function(){var e=n.defer();return r.then(function(e){e.navigateClient("#events/live")}),e.promise},a.addOutcomeToBetslip=function(e,t,i,a){var o=n.defer();return r.then(function(n){var r=[];angular.isArray(e)?r=e:r.push(e);var o={outcomes:r};null!=t&&(angular.isArray(t)?o.stakes=t:o.stakes=[t]),o.couponType=1===r.length?n.BETSLIP_OUTCOMES_ARGS.TYPE_SINGLE:n.BETSLIP_OUTCOMES_ARGS.TYPE_COMBINATION,o.updateMode="replace"!==i?n.BETSLIP_OUTCOMES_ARGS.UPDATE_APPEND:n.BETSLIP_OUTCOMES_ARGS.UPDATE_REPLACE,null!=a&&(o.source=a),n.set(n.BETSLIP_OUTCOMES,o)}),o.promise},a.removeOutcomeFromBetslip=function(e){var t=n.defer();return r.then(function(t){var n=[];angular.isArray(e)?n=e:n.push(e),t.set(t.BETSLIP_OUTCOMES_REMOVE,{outcomes:n})}),t.promise},a.requestBetslipOutcomes=function(){var e=n.defer();return r.then(function(e){e.request(e.BETSLIP_OUTCOMES)}),e.promise},a.requestPageInfo=function(){var e=n.defer();return r.then(function(e){e.request(e.PAGE_INFO)}),e.promise},a.requestWidgetArgs=function(){var e=n.defer();return r.then(function(e){e.request(e.WIDGET_ARGS)}),e.promise},a.requestClientConfig=function(){var e=n.defer();return r.then(function(e){e.request(e.CLIENT_CONFIG)}),e.promise},a.requestOddsFormat=function(){var e=n.defer();return r.then(function(e){e.request(e.CLIENT_ODDS_FORMAT)}),e.promise},a}])}(angular.module("widgetCore"))}();