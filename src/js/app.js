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
            while ( items[i].betOffers.outcomes[items[i].betOffers.lowestOutcome].odds <
            pivot.betOffers.outcomes[pivot.betOffers.lowestOutcome].odds ) {
               i++;
            }

            while ( items[j].betOffers.outcomes[items[j].betOffers.lowestOutcome].odds >
            pivot.betOffers.outcomes[pivot.betOffers.lowestOutcome].odds ) {
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

         this.view.formatters['checkBetOffers'] = ( betOffers ) => {
            return betOffers.outcomes.length <= 3;
         };

         this.view.formatters['eventFormatter'] = ( arr, listLimit ) => {
            return arr.slice(0, listLimit);
         };

         this.view.formatters['disablePlusIcon'] = ( listLimit ) => {
            return listLimit >= this.scope.args.selectionLimit;
         };

         this.scope.events = [];

         Stapes.on('CUSTOM:OUTCOME:SELECTED', ( data, event ) => {
            this.scope.selectOutcome(data.outcomeId, data.betOfferId);
         });

         Stapes.on('CUSTOM:OUTCOME:DESELECTED', ( data, event ) => {
            this.scope.selectOutcome(data.outcomeId, data.betOfferId);
         });

         CoreLibrary.widgetModule.events.on('ODDS:FORMAT', () => {
            this.calculateCombinedOdds();
         });

         // The actual limit of the list
         this.scope.listLimit = this.scope.args.defaultListLimit;

         // The height of a row, used when adding more events
         this.rowHeight = 115;

         this.headerHeight = 37;
         this.footerHeight = 58;

         // Loading flag
         this.scope.loading = true;

         this.scope.addToBetslipString = CoreLibrary.translationModule.getTranslation('Add to betslip');

         this.scope.navigateToEvent = ( clickEvent, eventData ) => {
            CoreLibrary.widgetModule.navigateToEvent(eventData.event.event.id);
         };

         this.scope.selectOutcome = ( outcomeId, betOfferId ) => {
            this.scope.events.forEach(( event ) => {
               if ( event.betOffers.id === betOfferId ) {
                  event.betOffers.outcomes.forEach(( outcome ) => {
                     if ( outcome.id === outcomeId ) {
                        outcome.selected = outcome.selected !== true;
                     } else {
                        outcome.selected = false;
                     }
                  });
               }
            });
            this.calculateCombinedOdds();
         };

         this.scope.selectNextOutcome = () => {
            var i = 0, len = this.scope.events.length, selectedCount = 0, alreadySelected = 0;
            for ( ; i < len; ++i ) {
               var j = 0, outcomeLen = this.scope.events[i].betOffers.outcomes.length, hasSelected = false;
               for ( ; j < outcomeLen; ++j ) {
                  if ( this.scope.events[i].betOffers.outcomes[j].selected === true ) {
                     hasSelected = true;
                     alreadySelected = alreadySelected + 1;
                  }
               }
               if ( alreadySelected >= this.scope.args.selectionLimit ) {
                  return false;
               }
               if ( hasSelected === false ) {
                  if ( selectedCount === this.scope.listLimit ) {
                     this.scope.listLimit = this.scope.listLimit + 1;
                     // this.currentHeight += this.rowHeight;
                     // CoreLibrary.widgetModule.setWidgetHeight(this.currentHeight);
                     this.adjustHeight();
                  }
                  this.scope.events[i].betOffers.outcomes[this.scope.events[i].betOffers.lowestOutcome].selected = true;
                  this.calculateCombinedOdds();
                  return true;
               } else {
                  selectedCount = selectedCount + 1;
               }
            }
            return false;
         };

         this.scope.addOutcomesToBetslip = () => {
            // Create a removable listener that calls the api for the betslip betoffers
            var betslipListener = ( betslipOffers, event ) => {
               console.debug('listener');
               console.debug(event, betslipOffers);
               // Remove the listener once we get the items from the betslip
               CoreLibrary.widgetModule.events.off('OUTCOMES:UPDATE', betslipListener);

               var i = 0, outcomes = [], remove = [], betslipLen = betslipOffers.outcomes.length, k = 0;
               for ( ; i < this.scope.listLimit; ++i ) {
                  var j = 0, outcomesLen = this.scope.events[i].betOffers.outcomes.length;
                  for ( ; j < outcomesLen; ++j ) {
                     if ( this.scope.events[i].betOffers.outcomes[j].selected ) {
                        outcomes.push(this.scope.events[i].betOffers.outcomes[j].id);
                     }
                  }
                  if ( this.scope.args.replaceOutcomes === true ) {
                     k = 0;
                     for ( ; k < betslipLen; ++k ) {
                        if ( betslipOffers.outcomes[k].eventId === this.scope.events[i].event.id && outcomes.indexOf(betslipOffers.outcomes[k].id) === -1 &&
                           betslipOffers.outcomes[k].id !== outcomes ) {
                           remove.push(betslipOffers.outcomes[k].id);
                        }
                     }
                  }
               }
               if ( this.scope.args.replaceOutcomes === true ) {
                  CoreLibrary.widgetModule.removeOutcomeFromBetslip(remove);
               }
               CoreLibrary.widgetModule.addOutcomeToBetslip(outcomes);
            };
            CoreLibrary.widgetModule.events.on('OUTCOMES:UPDATE', betslipListener);
            CoreLibrary.widgetModule.requestBetslipOutcomes();
         };

         this.scope.resetSelection = () => {
            var selectionCounter = 0;
            for ( var i = 0; i < this.scope.events.length; ++i ) {
               var outcomeLen = this.scope.events[i].betOffers.outcomes.length;
               for ( var j = 0; j < outcomeLen; ++j ) {
                  if ( selectionCounter < this.scope.args.defaultListLimit && j === this.scope.events[i].betOffers.lowestOutcome ) {
                     this.scope.events[i].betOffers.outcomes[j].selected = true;
                     selectionCounter = selectionCounter + 1;
                  } else {
                     this.scope.events[i].betOffers.outcomes[j].selected = false;
                  }

               }
            }
            // Reset the list size and height
            this.scope.listLimit = this.scope.args.defaultListLimit;
            // this.currentHeight = this.defaultHeight;
            // CoreLibrary.widgetModule.setWidgetHeight(this.currentHeight);
            this.adjustHeight();
            this.calculateCombinedOdds();
         };

         var arrayFilter = [];

         // Merge the generic filters with the contidional filters
         for ( var genericGroup in this.scope.args.genericFilters ) {
            if ( this.scope.args.genericFilters.hasOwnProperty(genericGroup) ) {
               this.scope.args.filters[genericGroup] = this.scope.args.filters[genericGroup].concat(this.scope.args.genericFilters[genericGroup]);
            }
         }

         for ( var group in this.scope.args.filters ) {
            if ( this.scope.args.filters.hasOwnProperty(group) ) {
               var i = 0, len = this.scope.args.filters[group].length;
               for ( ; i < len; ++i ) {
                  if ( this.scope.args.ignoreFilters.indexOf(this.scope.args.filters[group][i]) === -1 ) {
                     arrayFilter.push('/football/' + this.scope.args.filters[group][i] + '/');
                  } else {
                     console.debug('Ignoring', this.scope.args.filters[group][i])
                  }
               }
            }
         }
         arrayFilter = arrayFilter.sort(( a, b ) => {
            if ( a < b ) {
               return -1;
            }
            if ( a > b ) {
               return 1;
            }
            return 0;
         });

         var filterUrl = CoreLibrary.widgetModule.createFilterUrl(arrayFilter);
         if ( filterUrl ) {
            filterUrl = filterUrl.substring(8, filterUrl.length);
         } else {
            filterUrl = 'football/all/all'; // Try to get everything if we dont get anything from filters
         }

         // Call the api and get the filtered events
         return CoreLibrary.offeringModule.getEventsByFilter(filterUrl)
            .then(( response ) => {

               this.scope.events = [];
               for ( var i = 0; i < response.events.length; i++ ) {
                  response.events[i].betOffers = response.events[i].betOffers[0];
               }
               var sortedEvents = this.sortEventOffers(response.events);
               sortedEvents = this.prioSort(sortedEvents);
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
                        sortedEvents[i].betOffers.outcomes[sortedEvents[i].betOffers.lowestOutcome].selected = true;
                        selectionCounter = selectionCounter + 1;
                     }
                     this.scope.events.push(sortedEvents[i]);
                  }
               }
               // Check that we have enough events to fill the defaultListLimit or remove the widget
               if ( selectionCounter < this.scope.args.defaultListLimit ) {
                  CoreLibrary.widgetModule.removeWidget();
               }
               this.adjustHeight();
               // Calculate the odds for the selected bets
               this.calculateCombinedOdds();
            }, ( response ) => {
               console.warn('%c Failed to load betoffer data', 'color:red;');
               console.warn(response);
               CoreLibrary.widgetModule.removeWidget();
            })
            .then(() => {
               // Unset the loading flag
               this.scope.loading = false;
            });
      },

      /**
       * Sorts the events based on the lowest odds in the first offer, if it has any offer
       * If the event does not contain a bet offer then it is filtered out
       * @param {Array.<Object>} events An array of events, each containing events and betOffers.
       * @returns {Array} The sorted and filtered array
       */
      sortEventOffers ( events ) {
         var i = 0, len = events.length, eventsWithOffers = [];
         for ( ; i < len; ++i ) {
            // Find the lowest outcome odds in the offering, store the index of the lowest outcome in the object for reference, rather than sorting the outcomes
            if ( events[i].betOffers != null && events[i].betOffers.outcomes != null && events[i].betOffers.outcomes.length > 0 &&
               events[i].betOffers.outcomes.length <= 3 && events[i].event.openForLiveBetting !== true ) {
               var j = 1, outcomesLen = events[i].betOffers.outcomes.length, lowestOutcome = 0;
               for ( ; j < outcomesLen; ++j ) {
                  if ( events[i].betOffers.outcomes[j].odds < events[i].betOffers.outcomes[lowestOutcome].odds ) {
                     lowestOutcome = j;
                  }
               }
               events[i].betOffers.lowestOutcome = lowestOutcome;
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
            for ( ; i < this.scope.events.length; ++i ) {
               var j = 0, outcomesLen = this.scope.events[i].betOffers.outcomes.length;
               for ( ; j < outcomesLen; ++j ) {
                  if ( this.scope.events[i].betOffers.outcomes[j].selected === true ) {
                     outcomes.push(this.scope.events[i].betOffers.outcomes[j]);
                     result = result * (this.scope.events[i].betOffers.outcomes[j].odds / 1000);
                  }
               }
            }
            this.getFormattedOdds(Math.floor(result * 1000))
               .then(( odds ) => {
                  this.scope.combinedOdds = odds;
               });
         } else {
            this.scope.combinedOdds = '';
         }
      },

      getFormattedOdds ( odds ) {
         switch ( CoreLibrary.config.oddsFormat ) {
            case 'fractional':
               return CoreLibrary.widgetModule.requestOddsAsFractional(odds);
            case 'american':
               return CoreLibrary.widgetModule.requestOddsAsAmerican(odds);
            default:
               return new Promise(( resolve, reject ) => {
                  var res = CoreLibrary.utilModule.getOddsDecimalValue(odds / 1000);
                  resolve(res);
               });
         }
      },

      /**
       * Sorts the events based on date and priority
       * @param {Array} events The events filtered and sorted according to betoffer
       * @returns {Array} An array with the events sorted according to date, priority group, betoffer
       */
      prioSort ( events ) {
         var eventGroups = {
               twoDays: {},
               more: {}
            },
            now = Date.now(),
            sortedEvents = [],
            i = 0, len = events.length;
         for ( ; i < len; ++i ) {
            var dateRange = 'twoDays';
            if ( events[i].event.start - now > 172800000 ) { // 2 days
               dateRange = 'more';
            }
            for ( var group in this.scope.args.filters ) {
               if ( this.scope.args.filters.hasOwnProperty(group) ) {
                  var compinedPath = [], x = 0, pathLen = events[i].event.path.length;
                  for ( ; x < pathLen; ++x ) {
                     if ( events[i].event.path[x].termKey !== 'football' ) {
                        compinedPath.push(events[i].event.path[x].termKey);
                     }
                  }
                  var y = 0, filterLen = this.scope.args.filters[group].length;
                  for ( ; y < filterLen; ++y ) {
                     if ( compinedPath.join('/') === this.scope.args.filters[group][y] ) {
                        if ( eventGroups[dateRange].hasOwnProperty(group) ) {
                           eventGroups[dateRange][group].push(events[i]);
                        } else {
                           eventGroups[dateRange][group] = [events[i]];
                        }
                     }
                  }
               }
            }
         }
         // console.debug(eventGroups);
         // Concatenate the events in the new order
         for ( var dateRange in eventGroups ) {
            if ( eventGroups.hasOwnProperty(dateRange) ) {
               for ( group in eventGroups[dateRange] ) {
                  if ( eventGroups[dateRange].hasOwnProperty(group) ) {
                     sortedEvents = sortedEvents.concat(eventGroups[dateRange][group]);
                  }
               }
            }
         }
         return sortedEvents;
      },

      adjustHeight () {
         CoreLibrary.widgetModule.setWidgetHeight(this.footerHeight + this.headerHeight + (this.scope.listLimit * this.rowHeight));
      }
   });

   var comboWidget = new ComboWidget({
      rootElement: 'html'
   });
})();
