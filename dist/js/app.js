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
         groupId: 0,
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
       * Fetches the offers from a group and sorts them according to their lowest outcome and then combines them with their related event
       */
      $scope.getBetoffersByGroup = function ( groupId ) {
         // Lading flag
         $scope.loading = true;
         // Call the api and get the specified group offers
         return $apiService.getBetoffersByGroup(groupId)
            .then(function ( response ) {
                  $scope.events = [];
                  // Sort through the bet offers based on their lowest outcome
                  var sortedOffers = $scope.sortBetOffers(response.data.betoffers);
                  var i = 0, len = sortedOffers.length, addedTeams = [], selectionCounter = 0;
                  // Iterate over the sorted offers and find their event, then add the offer to the event and add the event to an array
                  // This way we get events sorted according to their offers lowest id
                  for ( ; i < len; ++i ) {
                     var event = $scope.findEvent(response.data.events, sortedOffers[i].eventId);
                     if ( event != null ) {
                        if ( event.betoffers == null ) {
                           // Check that the participants are not a in a previously added event, since they can only be in one outcome on the betslip
                           var participantsExist = false, j = 0, plen = event.participants.length;
                           for ( ; j < plen; ++j ) {
                              if ( addedTeams.indexOf(event.participants[j].participantId) === -1 ) {
                                 addedTeams.push(event.participants[j].participantId);
                              } else {
                                 participantsExist = true;
                              }
                           }
                           // Finally if the participant hasn't already been added, add it now
                           if ( !participantsExist ) {
                              event.betoffer = sortedOffers[i];
                              // We only want to mark the selection on as many items as we are currently displaying, so let's make sure of it
                              if ( selectionCounter < $scope.listLimit ) {
                                 event.betoffer.outcomes[event.betoffer.lowestOutcome].selected = true;
                                 selectionCounter = selectionCounter + 1;
                              }
                              $scope.events.push(event);
                           }
                        }
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
       * Sorts through the offers based on the lowest odds value in their outcomes
       * @param {Array.<Object>} offers An array of bet offers, including their outcomes
       */
      $scope.sortBetOffers = function ( offers ) {
         var i = 0, len = offers.length;
         for ( ; i < len; ++i ) {
            // Find the lowest outcome odds in the offering, store the index of the lowest outcome in the object for reference, rather than sorting the outcomes
            var j = 1, outcomesLen = offers[i].outcomes.length, lowestOutcome = 0;
            for ( ; j < outcomesLen; ++j ) {
               if ( offers[i].outcomes[j].odds < offers[i].outcomes[lowestOutcome].odds ) {
                  lowestOutcome = j;
               }
            }
            offers[i].lowestOutcome = lowestOutcome;
         }
         // Sort the bet offers based on their lowest outcome
         return $scope.quickSortBetOffers(offers);
      };

      /**
       * Perform a quicksort on the bet offers based on their lowest outcome
       * @param {Array} items an array of bet offers
       * @param {number} [left] Optional start index
       * @param {number} [right] Option end index
       * @returns {Array} Returns an array of bet offers
       */
      $scope.quickSortBetOffers = function ( items, left, right ) {

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
               while ( items[i].outcomes[items[i].lowestOutcome].odds < pivot.outcomes[pivot.lowestOutcome].odds ) {
                  i++;
               }

               while ( items[j].outcomes[items[j].lowestOutcome].odds > pivot.outcomes[pivot.lowestOutcome].odds ) {
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
               $scope.quickSortBetOffers(items, left, index - 1);
            }

            if ( index < right ) {
               $scope.quickSortBetOffers(items, index, right);
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
                  var j = 0, outcomesLen = $scope.events[i].betoffer.outcomes.length;
                  for ( ; j < outcomesLen; ++j ) {
                     if ( $scope.events[i].betoffer.outcomes[j].selected ) {
                        result = result * $scope.events[i].betoffer.outcomes[j].odds / 1000;
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
            var j = 0, outcomesLen = $scope.events[i].betoffer.outcomes.length;
            for ( ; j < outcomesLen; ++j ) {
               if ( $scope.events[i].betoffer.outcomes[j].selected ) {
                  outcomes.push($scope.events[i].betoffer.outcomes[j].id);
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
            var j = 0, outcomeLen = $scope.events[i].betoffer.outcomes.length, hasSelected = false;
            for ( ; j < outcomeLen; ++j ) {
               if ( $scope.events[i].betoffer.outcomes[j].selected === true ) {
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
               $scope.events[i].betoffer.outcomes[$scope.events[i].betoffer.lowestOutcome].selected = true;
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
            var j = 0, outcomeLen = $scope.events[i].betoffer.outcomes.length;
            for ( ; j < outcomeLen; ++j ) {
               if ( selectionCounter < $scope.args.defaultListLimit && j === $scope.events[i].betoffer.lowestOutcome ) {
                  $scope.events[i].betoffer.outcomes[j].selected = true;
                  selectionCounter = selectionCounter + 1;
               } else {
                  $scope.events[i].betoffer.outcomes[j].selected = false;
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
         // Laad the data from the api
         $scope.getBetoffersByGroup($scope.args.groupId);
      })


   }

   (function ( $app ) {
      return $app.controller('appController', ['$scope', 'kambiWidgetService', 'kambiAPIService', '$controller', appController]);
   })(angular.module('comboWidget'));

}).call(this);

!function(){"use strict";function e(e,t,n,r){e.apiConfigSet=!1,e.appArgsSet=!1,e.oddsFormat="decimal",e.defaultHeight=350,e.currentHeight=350,e.apiVersion="v2",e.streamingAllowedForPlayer=!1,e.defaultArgs={},e.init=function(){var i=r.defer(),a=e.$on("CLIENT:CONFIG",function(t,r){null!=r.oddsFormat&&e.setOddsFormat(r.oddsFormat),r.version=e.apiVersion,n.setConfig(r),e.apiConfigSet=!0,e.apiConfigSet&&e.appArgsSet&&i.resolve(),a()}),o=e.$on("WIDGET:ARGS",function(t,r){e.setArgs(r),r.hasOwnProperty("offering")&&n.setOffering(r.offering),e.appArgsSet=!0,e.apiConfigSet&&e.appArgsSet&&i.resolve(),o()});return t.setWidgetHeight(e.defaultHeight),t.requestWidgetHeight(),t.enableWidgetTransition(!0),t.requestClientConfig(),t.requestWidgetArgs(),t.requestBetslipOutcomes(),t.requestOddsFormat(),i.promise},e.navigateToLiveEvent=function(e){t.navigateToLiveEvent(e)},e.getWidgetHeight=function(){t.requestWidgetHeight()},e.setWidgetHeight=function(n){e.currentHeight=n,t.setWidgetHeight(n)},e.setWidgetEnableTransition=function(e){t.enableWidgetTransition(e)},e.removeWidget=function(){t.removeWidget()},e.addOutcomeToBetslip=function(e){t.addOutcomeToBetslip(e.id)},e.removeOutcomeFromBetslip=function(e){t.removeOutcomeFromBetslip(e.id)},e.requestBetslipOutcomes=function(){t.requestBetslipOutcomes()},e.requestWidgetArgs=function(){t.requestWidgetArgs()},e.requestPageInfo=function(){t.requestPageInfo()},e.requestOddsFormat=function(){t.requestOddsFormat()},e.setOddsFormat=function(t){e.oddsFormat=t},e.findEvent=function(e,t){for(var n=0,r=e.length;r>n;++n)if(e[n].id===t)return e[n];return null},e.getOutcomeLabel=function(e,t){return n.getOutcomeLabel(e,t)},e.setArgs=function(t){var n=e.defaultArgs;for(var r in t)t.hasOwnProperty(r)&&n.hasOwnProperty(r)&&(n[r]=t[r]);e.args=n},e.setPages=function(t,n,r){var i=r||t.length,a=Math.ceil(i/n),o=0;for(e.pages=[];a>o;++o)e.pages.push({startFrom:n*o,page:o+1})},e.updateBetOfferOutcomes=function(e,t){for(var n=0,r=e.outcomes.length,i=t.length;r>n;++n){var a=0,o=-1;for(e.outcomes[n].selected=!1;i>a;a++)e.outcomes[n].id===t[a].id&&(e.outcomes[n].odds=t[a].odds,o=n),-1!==o&&(e.outcomes[o].selected=!0)}},e.$on("WIDGET:HEIGHT",function(t,n){e.currentHeight=n})}!function(t){return t.controller("widgetCoreController",["$scope","kambiWidgetService","kambiAPIService","$q",e])}(angular.module("widgetCore",[]))}(),function(){"use strict";!function(e){return e.directive("kambiPaginationDirective",[function(){return{restrict:"E",scope:{list:"=list",listLimit:"=",pages:"=",startFrom:"=",activePage:"="},template:'<span ng-class="{disabled:activePage === 1}" ng-if="pages.length > 1" ng-click="pagePrev()" class="kw-page-link kw-pagination-arrow"><i class="ion-ios-arrow-left"></i></span><span ng-if="pages.length > 1" ng-repeat="page in getPagination()" ng-click="setActivePage(page)" ng-class="{active:page === activePage}" class="kw-page-link l-pack-center l-align-center">{{page}}</span><span ng-class="{disabled:activePage === pages.length}" ng-if="pages.length > 1" ng-click="pageNext()" class="kw-page-link kw-pagination-arrow"><i class="ion-ios-arrow-right"></i></span>',controller:["$scope",function(e){e.activePage=1,e.setPage=function(t){e.startFrom=t.startFrom,e.activePage=t.page},e.setActivePage=function(t){e.setPage(e.pages[t-1])},e.pagePrev=function(){e.activePage>1&&e.setPage(e.pages[e.activePage-2])},e.pageNext=function(){e.activePage<e.pages.length&&e.setPage(e.pages[e.activePage])},e.pageCount=function(){return Math.ceil(e.list.length/e.listLimit)},e.getPagination=function(){var t=[],n=5,r=e.activePage,i=e.pageCount(),a=1,o=i;i>n&&(a=Math.max(r-Math.floor(n/2),1),o=a+n-1,o>i&&(o=i,a=o-n+1));for(var s=a;o>=s;s++)t.push(s);return t}}]}}])}(angular.module("widgetCore"))}(),function(){!function(e){"use strict";e.filter("startFrom",function(){return function(e,t){return e?(t=+t,e.slice(t)):[]}})}(angular.module("widgetCore"))}(),function(){"use strict";!function(e){return e.service("kambiAPIService",["$http","$q",function(e,t){var n={};return n.configDefer=t.defer(),n.configSet=!1,n.offeringSet=!1,n.config={apiBaseUrl:null,channelId:null,currency:null,locale:null,market:null,offering:null,clientId:null,version:"v2"},n.setConfig=function(e){for(var t in e)e.hasOwnProperty(t)&&n.config.hasOwnProperty(t)&&(n.config[t]=e[t]);n.config.apiBaseUrl=n.config.apiBaseUrl.replace(/\{apiVersion}/gi,n.config.version),n.configSet=!0,n.configSet&&n.offeringSet&&n.configDefer.resolve()},n.setOffering=function(e){n.config.offering=e,n.offeringSet=!0,n.configSet&&n.offeringSet&&n.configDefer.resolve()},n.getGroupEvents=function(e){var t="/event/group/"+e+".json";return n.doRequest(t)},n.getLiveEvents=function(){var e="/event/live/open.json";return n.doRequest(e)},n.getBetoffersByGroup=function(e,t,r,i,a){var o="/betoffer/main/group/"+e+".json";return n.doRequest(o,{include:"participants"})},n.getGroupById=function(e,t){var r="/group/"+e+".json";return n.doRequest(r,{depth:t})},n.doRequest=function(r,i){return n.configDefer.promise.then(function(){if(null==n.config.offering)return t.reject("The offering has not been set, please provide it in the widget arguments");var a=n.config.apiBaseUrl+n.config.offering+r,o=i||{},s={lang:o.locale||n.config.locale,market:o.market||n.config.market,client_id:o.clientId||n.config.clientId,include:o.include||null,callback:"JSON_CALLBACK"};return e.jsonp(a,{params:s,cache:!1})})},n.getOutcomeLabel=function(e,t){switch(e.type){case"OT_ONE":return t.homeName;case"OT_CROSS":return"Draw";case"OT_TWO":return t.awayName;default:return e.label}},n}])}(angular.module("widgetCore"))}(),function(){"use strict";!function(e){return e.service("kambiWidgetService",["$rootScope","$window","$q",function(e,t,n){var r,i,a={};return t.KambiWidget&&(i=n.defer(),r=i.promise,t.KambiWidget.apiReady=function(e){a.api=e,i.resolve(e)},t.KambiWidget.receiveResponse=function(e){a.handleResponse(e)}),a.handleResponse=function(t){switch(t.type){case a.api.WIDGET_HEIGHT:e.$broadcast("WIDGET:HEIGHT",t.data);break;case a.api.BETSLIP_OUTCOMES:e.$broadcast("OUTCOMES:UPDATE",t.data);break;case a.api.WIDGET_ARGS:e.$broadcast("WIDGET:ARGS",t.data);break;case a.api.PAGE_INFO:e.$broadcast("PAGE:INFO",t.data);break;case a.api.CLIENT_ODDS_FORMAT:e.$broadcast("ODDS:FORMAT",t.data);break;case a.api.CLIENT_CONFIG:e.$broadcast("CLIENT:CONFIG",t.data);break;case a.api.USER_LOGGED_IN:e.$broadcast("USER:LOGGED_IN",t.data)}},a.requestWidgetHeight=function(){var e=n.defer();return r.then(function(e){e.request(e.WIDGET_HEIGHT)}),e.promise},a.setWidgetHeight=function(e){var t=n.defer();return r.then(function(t){t.set(t.WIDGET_HEIGHT,e)}),t.promise},a.enableWidgetTransition=function(e){var t=n.defer();return r.then(function(t){e?t.set(t.WIDGET_ENABLE_TRANSITION):t.set(t.WIDGET_DISABLE_TRANSITION)}),t.promise},a.removeWidget=function(){var e=n.defer();return r.then(function(e){e.remove()}),e.promise},a.navigateToLiveEvent=function(e){var t=n.defer();return r.then(function(t){t.navigateClient("#event/live/"+e)}),t.promise},a.navigateToEvent=function(e){var t=n.defer();return r.then(function(t){t.navigateClient("#event/"+e)}),t.promise},a.navigateToGroup=function(e){var t=n.defer();return r.then(function(t){t.navigateClient("#group/"+e)}),t.promise},a.navigateToLiveEvents=function(){var e=n.defer();return r.then(function(e){e.navigateClient("#events/live")}),e.promise},a.addOutcomeToBetslip=function(e,t,i,a){var o=n.defer();return r.then(function(n){var r=[];angular.isArray(e)?r=e:r.push(e);var o={outcomes:r};null!=t&&(angular.isArray(t)?o.stakes=t:o.stakes=[t]),o.couponType=1===r.length?n.BETSLIP_OUTCOMES_ARGS.TYPE_SINGLE:n.BETSLIP_OUTCOMES_ARGS.TYPE_COMBINATION,o.updateMode="replace"!==i?n.BETSLIP_OUTCOMES_ARGS.UPDATE_APPEND:n.BETSLIP_OUTCOMES_ARGS.UPDATE_REPLACE,null!=a&&(o.source=a),n.set(n.BETSLIP_OUTCOMES,o)}),o.promise},a.removeOutcomeFromBetslip=function(e){var t=n.defer();return r.then(function(t){var n=[];angular.isArray(e)?n=e:n.push(e),t.set(t.BETSLIP_OUTCOMES_REMOVE,{outcomes:n})}),t.promise},a.requestBetslipOutcomes=function(){var e=n.defer();return r.then(function(e){e.request(e.BETSLIP_OUTCOMES)}),e.promise},a.requestPageInfo=function(){var e=n.defer();return r.then(function(e){e.request(e.PAGE_INFO)}),e.promise},a.requestWidgetArgs=function(){var e=n.defer();return r.then(function(e){e.request(e.WIDGET_ARGS)}),e.promise},a.requestClientConfig=function(){var e=n.defer();return r.then(function(e){e.request(e.CLIENT_CONFIG)}),e.promise},a.requestOddsFormat=function(){var e=n.defer();return r.then(function(e){e.request(e.CLIENT_ODDS_FORMAT)}),e.promise},a}])}(angular.module("widgetCore"))}();