import { offeringModule, widgetModule } from 'widget-core-library';

/**
 * Perform a quicksort on the bet offers based on their lowest outcome
 * @param {Array} items an array of bet offers
 * @param {number} [left] Optional start index
 * @param {number} [right] Option end index
 * @returns {Array} Returns an array of bet offers
 */
const quickSortBetEvents = function(items, left, right) {
   function swap ( items, firstIndex, secondIndex ) {
      const temp = items[firstIndex];
      items[firstIndex] = items[secondIndex];
      items[secondIndex] = temp;
   }

   function partition ( items, left, right ) {
      const pivot = items[Math.floor((right + left) / 2)];
      let i = left,
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

         if ( i <= j ) {
            swap(items, i, j);
            i++;
            j--;
         }
      }

      return i;
   }

   let index;

   if (items.length > 1) {
      left = typeof left !== 'number' ? 0 : left;
      right = typeof right !== 'number' ? items.length - 1 : right;

      index = partition(items, left, right);

      if (left < index - 1) {
         quickSortBetEvents(items, left, index - 1);
      }

      if (index < right) {
         quickSortBetEvents(items, index, right);
      }
   }

   return items;
};

/**
 * Sorts the events bases on the lowest outcome odds in the first offer, if it has any offer
 * If the event does not contain a bet offer then it is filtered out
 * @param {Array.<Object>} events An array of events, each containing events and betOffers.
 * @returns {Array} The sorted and filtered array
 */
const sortEventOffers = function(events) {
   const len = events.length,
      eventsWithOffers = [];

   for (let i = 0; i < len; ++i) {
      // Find the lowest outcome odds in the offering, store the index of the lowest outcome in the object for reference, rather than sorting the outcomes
      if (events[i].betOffers != null && events[i].betOffers.outcomes != null && events[i].betOffers.outcomes.length > 0 &&
         events[i].betOffers.outcomes.length <= 3 && events[i].event.openForLiveBetting !== true) {
         const outcomesLen = events[i].betOffers.outcomes.length;
         let lowestOutcome = 0;

         for (let j = 1; j < outcomesLen; ++j) {
            if (events[i].betOffers.outcomes[j].odds < events[i].betOffers.outcomes[lowestOutcome].odds) {
               lowestOutcome = j;
            }
         }

         events[i].betOffers.lowestOutcome = lowestOutcome;

         eventsWithOffers.push(events[i]);
      }
   }

   // Sort the events based on their lowest outcome
   return quickSortBetEvents(eventsWithOffers);
};

const getEvents = function(sport, defaultListLimit) {
   // Call the api and get the filtered events
   return offeringModule.getHighlight()
      .then((response) => {
         if (!Array.isArray(response.groups)) {
            throw new Error('Invalid response from highlights api');
         }

         // extract separate filters from higlights
         const filters = response.groups
            .filter(group => group.sport === sport)
            .map(group => group.pathTermId);

         // create single filter for Kambi API query
         const filter = widgetModule.createFilterUrl(filters)
            .replace(/#.*filter\//, '');

         return offeringModule.getEventsByFilter(filter);
      })
      .then((response) => {
         const events = [];

         for (let i = 0; i < response.events.length; i++) {
            response.events[i].betOffers = response.events[i].betOffers[0];
         }

         const sortedEvents = sortEventOffers(response.events);

         const len = sortedEvents.length,
            addedTeams = [];

         let selectionCounter = 0;

         for (let i = 0; i < len; ++i) {
            // Check that the participants are not a in a previously added event, since they can only be in one outcome on the betslip
            let participantsExist = false;

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
               if (selectionCounter < defaultListLimit) {
                  sortedEvents[i].betOffers.outcomes[sortedEvents[i].betOffers.lowestOutcome].selected = true;
                  selectionCounter++;
               }

               events.push(sortedEvents[i]);
            }
         }

         return events;
      });
};

export default { getEvents };
