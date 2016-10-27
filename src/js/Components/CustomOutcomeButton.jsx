import React, { Component } from 'react';
import { coreLibrary, widgetModule, utilModule } from 'widget-core-library';

/**
 * Converts map of CSS classes into className string
 * @param {object<string, bool>} classNames Map of CSS classes
 * @returns {string}
 */
const convertClassNames = (classNames) => {
   return Object.keys(classNames)
      .reduce((str, key) => str + (classNames[key] ? ` ${key}` : ''), '');
};

/**
 * Returns initial state.
 * @param {object} outcome Outcome entity
 * @returns {{selected: boolean}}
 */
const getInitialState = (outcome) => {
   return {
      selected: outcome.selected
   };
};

/**
 * Renders an outcome button.
 */
class CustomOutcomeButton extends Component {

   /**
    * Outcome component constructor.
    * @param {object} props Component properties
    */
   constructor(props) {
      super(props);

      // compute initial state
      this.state = getInitialState(props.outcome);
   }

   /**
    * Called just before changing properties of component.
    * @param {object} nextProps New properties
    */
   componentWillReceiveProps(nextProps) {
      this.setState(getInitialState(nextProps.outcome));
   }

   /**
    * Handles outcome button's click event.
    */
   toggleOutcome() {
      if (this.state.selected) {
         widgetModule.events.publish('CUSTOM:OUTCOME:DESELECTED', {
            betOfferId: this.betOffer.id,
            outcomeId: this.props.outcome.id
         });
      } else {
         widgetModule.events.publish('CUSTOM:OUTCOME:SELECTED', {
            betOfferId: this.betOffer.id,
            outcomeId: this.props.outcome.id
         });
      }
   }

   /**
    * Bet offer entity which matches given outcome
    * @returns {object|null}
    */
   get betOffer() {
      return this.props.event.betOffers;
   }

   /**
    * Properly formatted odds
    * @returns {number}
    */
   get oddsFormatted() {
      switch (coreLibrary.config.oddsFormat) {
         case 'fractional':
            return this.props.outcome.oddsFractional;
         case 'american':
            return this.props.outcome.oddsAmerican;
         default:
            return utilModule.getOddsDecimalValue(this.props.outcome.odds / 1000);
      }
   }

   /**
    * Button's label
    * @returns {string}
    */
   get label() {
      return utilModule.getOutcomeLabel(this.props.outcome, this.props.event);
   }

   /**
    * Computed className based on current state
    * @returns {string}
    */
   get className() {
      return convertClassNames({
         'KambiWidget-outcome': true,
         'kw-link': true,
         'l-flex-1': true,
         'l-ml-6': true,
         'KambiWidget-outcome--selected': this.state.selected,
         'KambiWidget-outcome--suspended': this.betOffer ? this.betOffer.suspended : false
      });
   }

   /**
    * Returns component's template.
    * @returns {XML}
    */
   render() {
      return (
         <button
            type="button"
            role="button"
            disabled={this.betOffer ? this.betOffer.suspended : false}
            className={this.className}
            onClick={this.toggleOutcome.bind(this)}
         >
            <div className="KambiWidget-outcome__flexwrap">
               <div className="KambiWidget-outcome__label-wrapper">
                  <span className="KambiWidget-outcome__label">{this.label}</span>
                  <span className="KambiWidget-outcome__line" />
               </div>
               <div className="KambiWidget-outcome__odds-wrapper">
                  <span className="KambiWidget-outcome__odds">{this.oddsFormatted}</span>
               </div>
            </div>
         </button>
      );
   }
}

CustomOutcomeButton.propTypes = {
   /**
    * Outcome entity
    */
   outcome: React.PropTypes.object.isRequired,

   /**
    * Event entity
    */
   event: React.PropTypes.object.isRequired,
};

export default CustomOutcomeButton;
