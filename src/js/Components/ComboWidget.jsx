import React from 'react';
import PropTypes from 'prop-types';
import { coreLibrary, widgetModule, eventsModule, utilModule, translationModule } from 'kambi-widget-core-library';
import { Header, ActionButton } from 'kambi-widget-components';
import CustomOutcomeButton from './CustomOutcomeButton';
import TopBar from './TopBar';
import BottomBar from './BottomBar';
import KambiActionButton from './KambiActionButton';
import Event from './Event';

const t = translationModule.getTranslation.bind(translationModule);

const getFormattedOdds = function(odds) {
   switch (coreLibrary.config.oddsFormat) {
      case 'fractional':
         return widgetModule.requestOddsAsFractional(odds);
      case 'american':
         return widgetModule.requestOddsAsAmerican(odds);
      default:
         return new Promise(( resolve, reject ) => {
            resolve(utilModule.getOddsDecimalValue(odds / 1000));
         });
   }
};

class ComboWidget extends React.Component {

   /**
    * Constructs.
    * @param {object} props Widget properties
    */
   constructor(props) {
      super(props);

      this.state = {
         combinedOdds: '',
         events: this.initialStateEvents,
         tail: this.props.defaultListLimit - 1
      };

      this.addOutcomesToBetslip = this.addOutcomesToBetslip.bind(this);
      this.renderCombinedOdds = this.renderCombinedOdds.bind(this);
   }

   /**
    * Called before mounting component.
    */
   componentWillMount() {
      eventsModule.subscribe('ODDS:FORMAT', this.renderCombinedOdds.bind(this));
      this.renderCombinedOdds();
   }

   /**
    * Called after mounting component to DOM.
    */
   componentDidMount() {
      widgetModule.adaptWidgetHeight();
   }

   /**
    * Called after updating component's DOM.
    */
   componentWillReceiveProps() {
      this.resetEvents();
   }

   /**
    * Called after state/props update.
    */
   componentDidUpdate() {
      widgetModule.adaptWidgetHeight();
   }

   /**
    * Called just before unmounting the component.
    */
   componentWillUnmount() {
      eventsModule.unsubscribe('ODDS:FORMAT', this.oddsFormatHandler);
   }

   /**
    * Create initial state events array.
    */
   get initialStateEvents() {
      return this.props.events.map((event, i) => ({
         event,
         visible: i < this.props.defaultListLimit,
         selectedOutcomeIdx: event.betOffers.lowestOutcome,
         get selectedOutcome() { return this.event.betOffers.outcomes[this.selectedOutcomeIdx] }
      }));
   }

   /**
    * Makes next event visible.
    */
   addEvent() {
      if (this.visibleEvents.length >= this.props.selectionLimit) {
         return;
      }

      this.state.events[++this.state.tail].visible = true;
      this.setState({ events: this.state.events }, this.renderCombinedOdds);
   }

   /**
    * Removes given event from the list.
    * @param {object} event Event entity
    */
   removeEvent(event) {
      if (this.visibleEvents.length <= 1) {
         // do not remove last event
         return;
      }

      this.state.events[this.props.events.indexOf(event)].visible = false;
      this.setState({ events: this.state.events }, this.renderCombinedOdds);
   }

   /**
    * Resets events list to initial state.
    */
   resetEvents() {
      this.setState(
         {
            events: this.initialStateEvents,
            tail: this.props.defaultListLimit - 1
         },
         this.renderCombinedOdds
      );
   }

   /**
    * Navigates to given event.
    * @param {object} event
    */
   navigateToEvent(event) {
      widgetModule.navigateToEvent(event.event.id);
   }

   /**
    * Selects given outcome.
    * @param {object} outcome Outcome instance
    * @param {object} event Event instance
    */
   selectOutcome(outcome, event) {
      this.state.events[this.props.events.indexOf(event)].selectedOutcomeIdx =
         event.betOffers.outcomes.indexOf(outcome);
      this.setState({ events: this.state.events }, this.renderCombinedOdds);
   }

   /**
    * Adds selected outcomes to BetSlip.
    */
   addOutcomesToBetslip() {
      const outcomeIds = this.state.events
         .filter(stateEvent => stateEvent.visible)
         .map(stateEvent => stateEvent.selectedOutcome.id);

      widgetModule.addOutcomeToBetslip(
         outcomeIds,
         null,
         this.props.replaceOutcomes ? 'replace' : null
      );
   }

   /**
    * Visible events list
    * @returns {object[]}
    */
   get visibleEvents() {
      return this.state.events.filter(stateEvent => stateEvent.visible)
         .map(stateEvent => stateEvent.event);
   }

   /**
    * Combined odds for currently visible events
    * @returns {number}
    */
   get combinedOdds() {
      return this.state.events.reduce((result, stateEvent) => {
         return stateEvent.visible
            ? result * (stateEvent.selectedOutcome.odds / 1000)
            : result;
      }, 1);
   }

   /**
    * Determines whether given outcome is currently selected.
    * @param {object} outcome Outcome instance
    * @param {object} event Event instance
    * @returns {boolean}
    */
   isOutcomeSelected(outcome, event) {
      return this.state.events[this.props.events.indexOf(event)].selectedOutcomeIdx
         === event.betOffers.outcomes.indexOf(outcome);
   }

   /**
    * Renders calculated combined odds.
    */
   renderCombinedOdds() {
      getFormattedOdds(this.combinedOdds * 1000)
         .then(combinedOdds => this.setState({ combinedOdds }));
   }

   /**
    * Renders widget.
    * @returns {XML}
    */
   render() {
      return (
         <div>
            <Header>
               <span>{t('Combo builder')}</span>
            </Header>

            <TopBar>
               <ActionButton
                  action={this.addEvent.bind(this)}
                  type='secondary'
                  disabled={
                     this.visibleEvents.length >= this.props.selectionLimit || this.props.events.length <= this.props.selectionLimit
                  }
               >
                  { t('Add') }
               </ActionButton>
               <ActionButton
                  action={this.resetEvents.bind(this)}
                  type='secondary'
               >
                  { t('Reset') }
               </ActionButton>
            </TopBar>

            {this.visibleEvents.map(event => (
               <Event
                  key={event.event.id}
                  homeName={event.event.homeName}
                  awayName={event.event.awayName}
                  onClick={this.navigateToEvent.bind(this, event)}
                  onClose={this.removeEvent.bind(this, event)}
                  path={event.event.path.map(part => part.name)}
               >
                  {event.betOffers.outcomes.map(outcome =>
                     <CustomOutcomeButton
                        key={outcome.id}
                        outcome={outcome}
                        event={event}
                        selected={this.isOutcomeSelected(outcome, event)}
                        onClick={this.selectOutcome.bind(this, outcome, event)}
                     />)}
               </Event>
            ))}

            <BottomBar>
               <KambiActionButton
                  label={t('AddToBetslip') + ' ' + this.state.combinedOdds}
                  onClick={this.addOutcomesToBetslip}
               />
            </BottomBar>
         </div>
      );
   }
}

ComboWidget.propTypes = {
   /**
    * Events array
    */
   events: PropTypes.array.isRequired,

   /**
    * How many events show on the beginning
    */
   defaultListLimit: PropTypes.number,

   /**
    * How many event user can select
    */
   selectionLimit: PropTypes.number,

   /**
    * Should Betslip list be cleaned before adding selected outcomes
    */
   replaceOutcomes: PropTypes.bool
};

ComboWidget.defaultProps = {
   defaultListLimit: 2,
   selectionLimit: 12,
   replaceOutcomes: true
};

export default ComboWidget;
