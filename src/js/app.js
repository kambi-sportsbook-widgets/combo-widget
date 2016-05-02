(function () {
   'use strict';

   /**
    * Perform a quicksort on the bet offers based on their lowest outcome
    * @param {Array} items an array of bet offers
    * @param {number} [left] Optional start index
    * @param {number} [right] Option end index
    * @returns {Array} Returns an array of bet offers
    */
   var quickSortBetEvents = function ( items, left, right ) {

      function swap ( items, firstIndex, secondIndex ) {
         var temp = items[firstIndex];
         items[firstIndex] = items[secondIndex];
         items[secondIndex] = temp;
      }

      function partition ( items, left, right ) {
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
            quickSortBetEvents(items, left, index - 1);
         }

         if ( index < right ) {
            quickSortBetEvents(items, index, right);
         }
      }

      return items;
   };

   var ComboWidget = CoreLibrary.Component.subclass({
      defaultArgs: {
         filter: 'football/all/all/',
         defaultListLimit: 3, // A default setting for the size of the list, used when resetting
         selectionLimit: 12, // The maximum allowed selections, the bet slip supports up to 12 outcomes
         replaceOutcomes: true // When selecting a different outcome in a betoffer that has already been added to the betslip, should we replace it?
      },

      constructor () {
         CoreLibrary.Component.apply(this, arguments);
      },

      init () {
         this.scope.betoffers = [];
         this.scope.events = [];

         var rowHeight = 115;

         // Loading flag
         this.scope.loading = true;

         this.scope.navigateToEvent = function ( eventId ) {
            // TODO
            // $widgetService.navigateToEvent(eventId);
         };

         // Call the api and get the filtered events
         return CoreLibrary.offeringModule.getEventsByFilter(this.scope.args.filter)
            .then(( response ) => {
               this.scope.events = [];
               var sortedEvents = this.sortEventOffers(response.events);
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
                     if ( selectionCounter < this.scope.args.defaultListLimit ) {
                        sortedEvents[i].betOffers[0].outcomes[sortedEvents[i].betOffers[0].lowestOutcome].selected = true;
                        selectionCounter = selectionCounter + 1;
                     }
                     this.scope.events.push(sortedEvents[i]);
                  }
               }
               // Calculate the odds for the selected bets
               this.calculateCombinedOdds();
            },
            ( response ) => {
               console.warn('%c Failed to load betoffer data', 'color:red;');
               console.warn(response);
            }).then(() => {
               // Unset the loading flag
               this.scope.loading = false;
            });
      },

      /**
       * Sorts the events bases on the lowest odds in the first offer, if it has any offer
       * If the event does not contain a bet offer then it is filtered out
       * @param {Array.<Object>} events An array of events, each containing events and betOffers.
       * @returns {Array} The sorted and filtered array
       */
      sortEventOffers ( events ) {
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
         return quickSortBetEvents(eventsWithOffers);
      },

      /**
       * Calculates the combined odds of the selected outcomes
       */
      calculateCombinedOdds () {
         var i = 0, result = 1;
         var outcomes = [];
         if ( this.scope.events.length > 0 ) {
            for ( ; i < this.scope.defaultListLimit; ++i ) {
               var j = 0, outcomesLen = this.scope.events[i].betOffers[0].outcomes.length;
               for ( ; j < outcomesLen; ++j ) {
                  if ( this.scope.events[i].betOffers[0].outcomes[j].selected ) {
                     outcomes.push(this.scope.events[i].betOffers[0].outcomes[j]);
                  }
               }
            }
            result = '';
            // TODO result = this.scope.multiplyOdds(outcomes);
         } else {
            result = '';
         }
         this.scope.combinedOdds = result;
      }
   });

   var comboWidget = new ComboWidget({
      rootElement: 'html'
   });
})();
