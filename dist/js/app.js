(function () {

   var arrDependencies;

   arrDependencies = [
      'widgetCore',
      'widgetCore.translate',
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
         var outcomes = [];
         if( $scope.events.length > 0) {
            for ( ; i < $scope.listLimit; ++i ) {
               var j = 0, outcomesLen = $scope.events[i].betOffers[0].outcomes.length;
               for ( ; j < outcomesLen; ++j ) {
                  if ( $scope.events[i].betOffers[0].outcomes[j].selected ) {
                     outcomes.push($scope.events[i].betOffers[0].outcomes[j]);
                  }
               }
            }
            result = $scope.multiplyOdds(outcomes);
         } else {
            result = '';
         }
         $scope.combinedOdds = result;
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

      // TODO: Use core library instead
      $scope.navigateToEvent = function ( eventId ) {
         $widgetService.navigateToEvent(eventId);
      };

      // Call the init method in the coreWidgetController so that we setup everything using our overridden values
      // The init-method returns a promise that resolves when all of the configurations are set, for instance the $scope.args variables
      // so we can call our methods that require parameters from the widget settings after the init method is called
      $scope.init().then(function () {
         // Load the data from the api
         $scope.getBetoffersByFilter($scope.args.filter);
         // Reset currentHeight
         $scope.currentHeight = 450;
      });

      // Watcher for the oddsFormat, when the format changes we need to recalculate the odds in the new format
      $scope.$watch('oddsFormat', function() {
         $scope.calculateCombinedOdds();
      });


   }

   (function ( $app ) {
      return $app.controller('appController', ['$scope', 'kambiWidgetService', 'kambiAPIService', '$controller', appController]);
   })(angular.module('comboWidget'));

}).call(this);
