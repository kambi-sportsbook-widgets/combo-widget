import React, { Component } from 'react';
import { coreLibrary, widgetModule, statisticsModule, offeringModule } from 'widget-core-library';
import { OutcomeComponent } from 'widget-components'

class CustomOutcomeComponent extends Component {

   componentDidMount () {
      this.refresh();
   }

   getLabel () {

      if (this.data.customLabel) {
         return this.data.customLabel;
      }

      if (this.data.outcomeAttr != null) {
         if (this.data.eventAttr != null) {
            return coreLibrary.utilModule.getOutcomeLabel(this.data.outcomeAttr, this.data.eventAttr.event);
         } else {
            return this.data.outcomeAttr.label;
         }
      }
   }

   getCompetitionEvent (filter) {
      const criterionId = parseInt(this.props.criterionId, 10);
      // modify filter to match only competitions
      const competitionsFilter = (() => {
         const parts = filter.split('/').filter(termKey => !!termKey);
         for (let i = parts.length; i < 4; i++) {
            parts.push('all');
         }

         parts.push('competitions');
         return parts.join('/');
      })();

      // fetch competitions for previously prepared filter
      return offeringModule.getEventsByFilter(competitionsFilter)
         .then((response) => {
            if (!response || !Array.isArray(response.events)) {
               throw new Error('Invalid response from Kambi API');
            }

            // if criterion identifier is not set just find first event which is a competition
            if (Number.isNaN(criterionId)) {
               return response.events.find(ev => ev.event.type === 'ET_COMPETITION');
            }

            // search for event which is a competition and has a betOffer with given criterion identifier
            return response.events.find((ev) => {
               return ev.event.type === 'ET_COMPETITION' &&
                  ev.betOffers.find(bo => bo.criterion.id === criterionId);
            });
         })
         .then((event) => {
            if (!event) {
               throw new Error(`Competition not found for filter=${filter} and criterionId=${criterionId}`);
            }

            // following request will respond with all betOffers
            return offeringModule.getEvent(event.event.id);
         })
         .then((event) => {
            if (event === null) {
               throw new Error('Event not found');
            }

            return event;
         });
   }

   get filter () {

      if (this.props.filter) {
         return this.props.filter;
      }

      if (coreLibrary.pageInfo.leaguePaths != null && coreLibrary.pageInfo.leaguePaths.length === 1) {
         return coreLibrary.pageInfo.leaguePaths[0];
      }

      return null;
   }

   refresh () {
      const filter = this.filter;

      console.log('filter', filter);

      if (!filter) {
         widgetModule.removeWidget();
      }

      Promise.all([
         this.getCompetitionEvent(filter),
         statisticsModule.getLeagueTableStatistics(filter)
      ])
         .then(([event, statistics]) => {
            const criterionId = parseInt(this.props.criterionId, 10);

            // don't look for bet offers if criterion identifier is not set
            const betOffers = Number.isNaN(criterionId) ? []
               : event.betOffers.filter(bo => bo.criterion.id === this.props.criterionId);

            this.setState({
               title: this.getTitle(event),
               updated: (new Date(statistics.updated)).toString(),
               event: event,
               betOffers: betOffers,
               participants: statistics.leagueTableRows.map((row) => {
                  row.goalsDifference = row.goalsFor - row.goalsAgainst;
                  row.outcomes = betOffers.map(bo => bo.outcomes.find(oc => oc.participantId === row.participantId));
                  return row;
               })
            });
         })
         .catch((error) => {
            console.error(error);
            widgetModule.removeWidget();
         });
   }

   render () {
      return <OutcomeComponent outcome={{}} withLabel />
   }
}

CustomOutcomeComponent.propTypes = {
   filter: React.PropTypes.object,
   criterionId: React.PropTypes.string
};

export default CustomOutcomeComponent;

/*
 var Module = Stapes.subclass();

 rivets.binders['outcome-suspended'] = function (el, property) {
 var cssClass = 'KambiWidget-outcome--suspended';
 if (property === true) {
 el.classList.add(cssClass);
 } else {
 el.classList.remove(cssClass);
 }
 };

 rivets.binders['outcome-selected'] = function (el, property) {
 var cssClass = 'KambiWidget-outcome--selected';

 if (property === true) {
 el.classList.add(cssClass);
 } else {
 el.classList.remove(cssClass);
 }
 };

 var OutcomeViewController = function (attributes) {
 this.data = attributes;
 this.selected = false;
 this.label = '';
 this.coreLibraryConfig = CoreLibrary.config;

 var module = new Module();

 this.betOffer = this.data.eventAttr.betOffers;


 this.getOddsFormat = function () {
 switch (this.coreLibraryConfig.oddsFormat) {
 case 'fractional':
 return this.data.outcomeAttr.oddsFractional;
 case 'american':
 return this.data.outcomeAttr.oddsAmerican;
 default:
 return CoreLibrary.utilModule.getOddsDecimalValue(this.data.outcomeAttr.odds / 1000);
 }
 };
 };

 rivets.components['custom-outcome-component'] = {
 template: function () {
 return `
 <button
 rv-on-click="toggleOutcome"
 rv-disabled="betOffer.suspended | == true"
 rv-outcome-selected="data.outcomeAttr.selected"
 rv-outcome-suspended="betOffer.suspended"
 type="button"
 role="button"
 class="KambiWidget-outcome kw-link l-flex-1 l-ml-6">
 <div class="KambiWidget-outcome__flexwrap">
 <div class="KambiWidget-outcome__label-wrapper">
 <span
 class="KambiWidget-outcome__label"
 rv-text="getLabel < data.outcomeAttr.odds data.eventAttr.event">
 </span>
 <span class="KambiWidget-outcome__line"></span>
 </div>
 <div class="KambiWidget-outcome__odds-wrapper">
 <span
 class="KambiWidget-outcome__odds"
 rv-text="getOddsFormat < data.outcomeAttr.odds coreLibraryConfig.oddsFormat">
 </span>
 </div>
 </button>
 `;
 },

 initialize: function (el, attributes) {
 if (attributes.outcomeAttr == null) {
 return false;
 }
 el.classList.add('l-flexbox');
 el.classList.add('l-flex-1');
 return new OutcomeViewController(attributes);
 }
 };
 */
