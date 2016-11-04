import React, { Component } from 'react';
import { coreLibrary, widgetModule, utilModule } from 'kambi-widget-core-library';
import { OutcomeButtonUI } from 'kambi-widget-components';

/**
 * Returns initial state.
 * @param {object} outcome Outcome entity
 * @returns {{selected: boolean}}
 */
const getInitialState = (outcome) => {
   return {
      selected: outcome.selected == null ? false : outcome.selected
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

      this.toggleOutcome = this.toggleOutcome.bind(this);
      // compute initial state
      this.state = getInitialState(props.outcome);

      this.oddsFormatHandler = () => {
         this.forceUpdate();
      }
   }

   /**
    * Called just before creating component's DOM.
    */
   componentDidMount() {
      widgetModule.events.subscribe('ODDS:FORMAT', this.oddsFormatHandler);
   }

   /**
    * Called just before changing properties of component.
    * @param {object} nextProps New properties
    */
   componentWillReceiveProps(nextProps) {
      this.setState(getInitialState(nextProps.outcome));
   }

   /**
    * Called before removing component.
    */
   componentWillUnmount() {
      widgetModule.events.unsubscribe('ODDS:FORMAT', this.oddsFormatHandler);
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
      return utilModule.getOutcomeLabel(this.props.outcome, this.props.event.event);
   }


   /**
    * Returns component's template.
    * @returns {XML}
    */
   render() {
      let suspended = false;
      if (this.betOffer && this.betOffer.suspended) {
         suspended = true;
      }
      return (
         <div className={'l-ml-6 l-flexbox l-flex-1'}>
            <OutcomeButtonUI
               label={this.label}
               odds={this.oddsFormatted}
               suspended={suspended}
               selected={this.state.selected}
               onClick={this.toggleOutcome}
            />
         </div>
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
