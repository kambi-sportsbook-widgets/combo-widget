import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { coreLibrary, utilModule, eventsModule } from 'kambi-widget-core-library';
import { OutcomeButtonUI } from 'kambi-widget-components';

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

      this.oddsFormatHandler = () => this.forceUpdate()
   }

   /**
    * Called just before creating component's DOM.
    */
   componentDidMount() {
      eventsModule.subscribe('ODDS:FORMAT', this.oddsFormatHandler);
   }

   /**
    * Called before removing component.
    */
   componentWillUnmount() {
      eventsModule.unsubscribe('ODDS:FORMAT', this.oddsFormatHandler);
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
      switch (coreLibrary.oddsFormat) {
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
      return utilModule.getOutcomeLabel(this.props.outcome, this.props.event.event);
   }


   /**
    * Returns component's template.
    * @returns {XML}
    */
   render() {
      return (
         <OutcomeButtonUI
            label={this.label}
            odds={this.oddsFormatted}
            suspended={this.betOffer && this.betOffer.suspended}
            selected={this.props.selected}
            onClick={this.props.onClick}
         />
      );
   }
}

CustomOutcomeButton.propTypes = {
   /**
    * Outcome entity
    */
   outcome: PropTypes.object.isRequired,

   /**
    * Event entity
    */
   event: PropTypes.object.isRequired,

   /**
    * Outcome button selected state
    */
   selected: PropTypes.bool.isRequired,

   /**
    * Handler for button click action
    */
   onClick: PropTypes.func.isRequired
};

export default CustomOutcomeButton;
