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
                  console.warn('%c Failed to load betoffer data', 'color:red;');
                  console.warn(response);
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
