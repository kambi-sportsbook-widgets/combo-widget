import ReactDOM from 'react-dom';
import React from 'react';
import { coreLibrary, widgetModule, translationModule, offeringModule, utilModule } from 'widget-core-library';
import CustomOutcomeComponent from './CustomOutcomeComponent/CustomOutcomeComponent.jsx';

class ComboWidgetController {

   constructor() {

      const defaultArgs = {
         widgetTrackingName: 'gm-combo-widget',
         sport: 'FOOTBALL',
         defaultListLimit: 3, // A default setting for the size of the list, used when resetting
         selectionLimit: 12, // The maximum allowed selections, the bet slip supports up to 12 outcomes
         replaceOutcomes: true // When selecting a different outcome in a betoffer that has already been added to the betslip, should we replace it?
      };

      this.args = defaultArgs;
   }

   static swap(items, firstIndex, secondIndex) {
      var temp = items[firstIndex];
      items[firstIndex] = items[secondIndex];
      items[secondIndex] = temp;
   }

   static partition(items, left, right) {
      var pivot = items[Math.floor((right + left) / 2)],
         i = left,
         j = right;

      while (i <= j) {
         while (items[i].betOffers.outcomes[items[i].betOffers.lowestOutcome].odds <
         pivot.betOffers.outcomes[pivot.betOffers.lowestOutcome].odds) {
            i++;
         }

         while (items[j].betOffers.outcomes[items[j].betOffers.lowestOutcome].odds >
         pivot.betOffers.outcomes[pivot.betOffers.lowestOutcome].odds) {
            j--;
         }

         if (i <= j) {
            ComboWidgetController.swap(items, i, j);
            i++;
            j--;
         }
      }

      return i;
   }

   static quickSortBetEvents(items, left, right) {

      var index;

      if (items.length > 1) {
         left = typeof left !== 'number' ? 0 : left;
         right = typeof right !== 'number' ? items.length - 1 : right;

         index = ComboWidgetController.partition(items, left, right);

         if (left < index - 1) {
            ComboWidgetController.quickSortBetEvents(items, left, index - 1);
         }

         if (index < right) {
            ComboWidgetController.quickSortBetEvents(items, index, right);
         }
      }

      return items;
   }

   selectOutcome(outcomeId, betOfferId) {
      this.events.forEach((event) => {
         if (event.betOffers.id === betOfferId) {
            event.betOffers.outcomes.forEach((outcome) => {
               if (outcome.id === outcomeId) {
                  outcome.selected = outcome.selected !== true;
               } else {
                  outcome.selected = false;
               }
            });
         }
      });
      this.calculateCombinedOdds();
   }

   addOutcomesToBetslip() {
      // Create a removable listener that calls the api for the betslip betoffers

      var betslipListener = (betslipOffers, event) => {
         console.debug('listener');
         console.debug(event, betslipOffers);
         // Remove the listener once we get the items from the betslip
         /* widgetModule.events.off('OUTCOMES:UPDATE', betslipListener);*/

         var i = 0;
         var outcomes = [];
         var remove = [];
         var betslipLen = betslipOffers.outcomes.length;

         for (var k = 0; i < this.listLimit; ++i) {
            var j = 0, outcomesLen = this.events[i].betOffers.outcomes.length;
            for (; j < outcomesLen; ++j) {
               if (this.events[i].betOffers.outcomes[j].selected) {
                  outcomes.push(this.events[i].betOffers.outcomes[j].id);
               }
            }
            if (this.args.replaceOutcomes === true) {
               k = 0;
               for (; k < betslipLen; ++k) {
                  if (betslipOffers.outcomes[k].eventId === this.events[i].event.id && outcomes.indexOf(betslipOffers.outcomes[k].id) === -1 &&
                     betslipOffers.outcomes[k].id !== outcomes) {
                     remove.push(betslipOffers.outcomes[k].id);
                  }
               }
            }
         }
         if (this.args.replaceOutcomes === true) {
            widgetModule.removeOutcomeFromBetslip(remove);
         }
         widgetModule.addOutcomeToBetslip(outcomes);
      };
      /* widgetModule.events.on('OUTCOMES:UPDATE', betslipListener); */
      widgetModule.requestBetslipOutcomes();
   }

   resetSelection() {
      var selectionCounter = 0;
      for (var i = 0; i < this.events.length; ++i) {
         var outcomeLen = this.events[i].betOffers.outcomes.length;
         for (var j = 0; j < outcomeLen; ++j) {
            if (selectionCounter < this.args.defaultListLimit && j === this.events[i].betOffers.lowestOutcome) {
               this.events[i].betOffers.outcomes[j].selected = true;
               selectionCounter++;
            } else {
               this.events[i].betOffers.outcomes[j].selected = false;
            }

         }
      }
      // Reset the list size and height
      this.listLimit = this.args.defaultListLimit;
      // this.currentHeight = this.defaultHeight;
      // widgetModule.setWidgetHeight(this.currentHeight);
      this.adjustHeight();
      this.calculateCombinedOdds();
   }

   selectNextOutcome() {
      var i = 0, len = this.events.length, selectedCount = 0, alreadySelected = 0;
      for (; i < len; ++i) {
         var j = 0, outcomeLen = this.events[i].betOffers.outcomes.length, hasSelected = false;
         for (; j < outcomeLen; ++j) {
            if (this.events[i].betOffers.outcomes[j].selected === true) {
               hasSelected = true;
               alreadySelected++;
            }
         }
         if (alreadySelected >= this.args.selectionLimit) {
            return false;
         }
         if (hasSelected === false) {
            if (selectedCount === this.listLimit) {
               this.listLimit = this.listLimit + 1;
               // this.currentHeight += this.rowHeight;
               // widgetModule.setWidgetHeight(this.currentHeight);
               this.adjustHeight();
            }
            this.events[i].betOffers.outcomes[this.events[i].betOffers.lowestOutcome].selected = true;
            this.calculateCombinedOdds();
            return true;
         } else {
            selectedCount++;
         }
      }
      return false;
   }

   static navigateToEvent(clickEvent, eventData) {
      widgetModule.navigateToEvent(eventData.event.event.id);
   }

   static sortEventOffers(events) {
      var i = 0, len = events.length, eventsWithOffers = [];
      for (; i < len; ++i) {
         // Find the lowest outcome odds in the offering, store the index of the lowest outcome in the object for reference, rather than sorting the outcomes
         if (events[i].betOffers != null && events[i].betOffers.outcomes != null && events[i].betOffers.outcomes.length > 0 &&
            events[i].betOffers.outcomes.length <= 3 && events[i].event.openForLiveBetting !== true) {
            var j = 1, outcomesLen = events[i].betOffers.outcomes.length, lowestOutcome = 0;
            for (; j < outcomesLen; ++j) {
               if (events[i].betOffers.outcomes[j].odds < events[i].betOffers.outcomes[lowestOutcome].odds) {
                  lowestOutcome = j;
               }
            }
            events[i].betOffers.lowestOutcome = lowestOutcome;
            eventsWithOffers.push(events[i]);
         }
      }
      // Sort the events based on their lowest outcome
      return ComboWidgetController.quickSortBetEvents(eventsWithOffers);
   }

   /**
    * Calculates the combined odds of the selected outcomes
    */

   calculateCombinedOdds() {
      var i = 0, result = 1;
      var outcomes = [];
      if (this.events.length > 0) {
         for (; i < this.events.length; ++i) {
            var j = 0, outcomesLen = this.events[i].betOffers.outcomes.length;
            for (; j < outcomesLen; ++j) {
               if (this.events[i].betOffers.outcomes[j].selected === true) {
                  outcomes.push(this.events[i].betOffers.outcomes[j]);
                  result *= (this.events[i].betOffers.outcomes[j].odds / 1000);
               }
            }
         }
         ComboWidgetController.getFormattedOdds(Math.floor(result * 1000))
         .then((odds) => {
            this.combinedOdds = odds;
         });
      } else {
         this.combinedOdds = '';
      }
   }

   static getFormattedOdds(odds) {
      switch (coreLibrary.config.oddsFormat) {
         case 'fractional':
            return widgetModule.requestOddsAsFractional(odds);
         case 'american':
            return widgetModule.requestOddsAsAmerican(odds);
         default:
            return new Promise((resolve, reject) => {
               var res = utilModule.getOddsDecimalValue(odds / 1000);
               resolve(res);
            });
      }
   }

   adjustHeight() {
      widgetModule.setWidgetHeight(this.footerHeight + this.headerHeight + (this.listLimit * this.rowHeight));
   }

   init() {

      /*
       this.view.formatters['checkBetOffers'] = (betOffers) => {
       return betOffers.outcomes.length <= 3;
       };

       this.view.formatters['eventFormatter'] = (arr, listLimit) => {
       return arr.slice(0, listLimit);
       };

       this.view.formatters['disablePlusIcon'] = (listLimit) => {
       return listLimit >= this.scope.args.selectionLimit;
       }; */

      /* Stapes.on('CUSTOM:OUTCOME:SELECTED', (data, event) => {
       this.scope.selectOutcome(data.outcomeId, data.betOfferId);
       });

       Stapes.on('CUSTOM:OUTCOME:DESELECTED', (data, event) => {
       this.scope.selectOutcome(data.outcomeId, data.betOfferId);
       });*/

      /* widgetModule.events.on('ODDS:FORMAT', () => {
         this.calculateCombinedOdds();
      }); */

      coreLibrary.setWidgetTrackingName(this.args.widgetTrackingName);

      // The actual limit of the list
      this.listLimit = this.args.defaultListLimit;

      // The height of a row, used when adding more events
      this.rowHeight = 115;
      this.headerHeight = 37;
      this.footerHeight = 58;

      // Loading flag
      this.loaded = false;
      this.addToBetslipString = translationModule.getTranslation('Add to betslip');

      // Call the api and get the filtered events
      return offeringModule.getHighlight()
      .then((response) => {
         if (!Array.isArray(response.groups)) {
            throw new Error('Invalid response from highlights api');
         }

         // extract separate filters from higlights
         var filters = response.groups
         .filter(group => group.sport === this.args.sport)
         .map(group => group.pathTermId);

         var filter;

         // create single filter for Kambi API query
         filter = widgetModule.createFilterUrl(filters)
         .replace(/#.*filter\//, '');

         return offeringModule.getEventsByFilter(filter);
      })
      .then((response) => {

         this.events = [];
         for (var i = 0; i < response.events.length; i++) {
            response.events[i].betOffers = response.events[i].betOffers[0];
         }

         var sortedEvents = ComboWidgetController.sortEventOffers(response.events);
         var len = sortedEvents.length;
         var selectionCounter = 0;
         var addedTeams = [];

         for (var i = 0; i < len; ++i) {
            // Check that the participants are not a in a previously added event, since they can only be in one outcome on the betslip
            var participantsExist = false;

            if (sortedEvents[i].event.homeName != null) {
               if (addedTeams.indexOf(sortedEvents[i].event.homeName) === -1) {
                  addedTeams.push(sortedEvents[i].event.homeName);
               } else {
                  participantsExist = true;
               }
            }

            if (sortedEvents[i].event.awayName != null) {
               if (addedTeams.indexOf(sortedEvents[i].event.awayName) === -1) {
                  addedTeams.push(sortedEvents[i].event.awayName);
               } else {
                  participantsExist = true;
               }
            }

            // Finally if the participant hasn't already been added, add it now
            if (!participantsExist) {
               if (selectionCounter < this.args.defaultListLimit) {
                  sortedEvents[i].betOffers.outcomes[sortedEvents[i].betOffers.lowestOutcome].selected = true;
                  selectionCounter++;
               }
               this.events.push(sortedEvents[i]);
            }
         }
         this.adjustHeight();
         // Calculate the odds for the selected bets
         this.calculateCombinedOdds();
      }, (response) => {
         console.warn('%c Failed to load betoffer data', 'color:red;');
         console.warn(response);
      })
      .then(() => {
         // Unset the loading flag
         this.loaded = true;
      });
   }
}

coreLibrary.init({
   widgetTrackingName: 'gm-combo-widget',
   sport: 'FOOTBALL',
   defaultListLimit: 3,
   selectionLimit: 12,
   replaceOutcomes: true
})
.then(() => {
   ReactDOM.render(<CustomOutcomeComponent filter="/football/england/premier_league" criterionId="1001221607" />, document.getElementById('root'));
   var comboWidgetController = new ComboWidgetController();
   comboWidgetController.init();
});
