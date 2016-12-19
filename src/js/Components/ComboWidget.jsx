import React from 'react';
import { coreLibrary, widgetModule, utilModule, translationModule } from 'kambi-widget-core-library';
import { Header, ActionButton } from 'kambi-widget-components';
import CustomOutcomeButton from './CustomOutcomeButton';
import Main from './Main';
import Event from './Event';
import Footer from './Footer';

const getFormattedOdds = function(odds) {
   switch (coreLibrary.config.oddsFormat) {
      case 'fractional':
         return widgetModule.requestOddsAsFractional(odds);
      case 'american':
         return widgetModule.requestOddsAsAmerican(odds);
      default:
         return new Promise(( resolve, reject ) => {
            var res = utilModule.getOddsDecimalValue(odds / 1000);
            resolve(res);
         });
   }
};

const navigateToEvent = function(event) {
   widgetModule.navigateToEvent(event.event.id);
};

const adjustHeight = () => {
   widgetModule.adaptWidgetHeight();
};

class ComboWidget extends React.Component {

   /**
    * Constructs.
    * @param {object} props Widget properties
    */

   constructor(props) {
      super(props);

      this.state = {
         listLimit: props.defaultListLimit,
         combinedOdds: ''
      };

      // create event handlers
      this.outcomeSelectedHandler = data => this.selectOutcome(data.outcomeId, data.betOfferId);
      this.outcomeDeselectedHandler = data => this.selectOutcome(data.outcomeId, data.betOfferId);
      this.oddsFormatHandler = () => this.calculateCombinedOdds();
   }

   componentWillMount() {
      widgetModule.events.subscribe('CUSTOM:OUTCOME:SELECTED', this.outcomeSelectedHandler);
      widgetModule.events.subscribe('CUSTOM:OUTCOME:DESELECTED', this.outcomeDeselectedHandler);
      widgetModule.events.subscribe('ODDS:FORMAT', this.oddsFormatHandler);

      this.calculateCombinedOdds();
   }

   componentDidMount() {
      adjustHeight();
   }

   /**
    * Called after updating component's DOM.
    */
   componentWillReceiveProps(nextProps) {
      this.setState({
         listLimit: nextProps.defaultListLimit,
         combinedOdds: ''
      });
   }

   componentDidUpdate() {
      adjustHeight();
   }

   componentWillUnmount() {
      widgetModule.events.unsubscribe('CUSTOM:OUTCOME:SELECTED', this.outcomeSelectedHandler);
      widgetModule.events.unsubscribe('CUSTOM:OUTCOME:DESELECTED', this.outcomeDeselectedHandler);
      widgetModule.events.unsubscribe('ODDS:FORMAT', this.oddsFormatHandler);
   }

   selectOutcome(outcomeId, betOfferId) {
      this.props.events.forEach((event) => {
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

   resetSelection() {
      let selectionCounter = 0;
      for (let i = 0; i < this.props.events.length; ++i) {
         const outcomeLen = this.props.events[i].betOffers.outcomes.length;
         for (let j = 0; j < outcomeLen; ++j) {
            if (selectionCounter < this.props.defaultListLimit && j === this.props.events[i].betOffers.lowestOutcome) {
               this.props.events[i].betOffers.outcomes[j].selected = true;
               selectionCounter++;
            } else {
               this.props.events[i].betOffers.outcomes[j].selected = false;
            }

         }
      }
      // Reset the list size
      this.setState({
         listLimit: this.props.defaultListLimit
      });

      this.calculateCombinedOdds();
   }

   /**
    * Calculates the combined odds of the selected outcomes
    */
   calculateCombinedOdds() {
      let result = 1;
      const outcomes = [];

      if (this.props.events.length > 0) {
         for (let i = 0; i < this.props.events.length; ++i) {
            const outcomesLen = this.props.events[i].betOffers.outcomes.length;
            for (let j = 0; j < outcomesLen; ++j) {
               if (this.props.events[i].betOffers.outcomes[j].selected === true) {
                  outcomes.push(this.props.events[i].betOffers.outcomes[j]);
                  result *= (this.props.events[i].betOffers.outcomes[j].odds / 1000);
               }
            }
         }

         getFormattedOdds(Math.floor(result * 1000))
            .then((odds) => {
               this.setState({
                  combinedOdds: odds
               });
            });
      } else {
         this.setState({
            combinedOdds: ''
         });
      }
   }

   selectNextOutcome() {
      const len = this.props.events.length;
      let selectedCount = 0,
         alreadySelected = 0;

      for (let i = 0; i < len; ++i) {
         const outcomeLen = this.props.events[i].betOffers.outcomes.length;
         let hasSelected = false;

         for (let j = 0; j < outcomeLen; ++j) {
            if (this.props.events[i].betOffers.outcomes[j].selected === true) {
               hasSelected = true;
               alreadySelected++;
            }
         }

         if (alreadySelected >= this.props.selectionLimit) {
            return false;
         }

         if (hasSelected === false && i >= this.state.listLimit) {
            if (selectedCount === this.state.listLimit) {
               this.setState({
                  listLimit: this.state.listLimit + 1
               });
            }

            this.props.events[i].betOffers.outcomes[this.props.events[i].betOffers.lowestOutcome].selected = true;

            this.calculateCombinedOdds();

            return true;
         } else {
            selectedCount++;
         }
      }
      return false;
   }

   addOutcomesToBetslip() {
      // Create a removable listener that calls the api for the betslip betoffers
      const betslipListener = (betslipOffers, event) => {
         console.debug('listener');
         console.debug(event, betslipOffers);

         // Remove the listener once we get the items from the betslip
         widgetModule.events.unsubscribe('OUTCOMES:UPDATE', betslipListener);

         const outcomes = [],
            remove = [],
            betslipLen = betslipOffers.outcomes.length;

         for (let i = 0; i < this.state.listLimit; ++i) {
            const outcomesLen = this.props.events[i].betOffers.outcomes.length;

            for (let j = 0; j < outcomesLen; ++j) {
               if (this.props.events[i].betOffers.outcomes[j].selected) {
                  outcomes.push(this.props.events[i].betOffers.outcomes[j].id);
               }
            }

            if (this.props.replaceOutcomes === true) {
               for (let k = 0; k < betslipLen; ++k) {
                  if (betslipOffers.outcomes[k].eventId === this.props.events[i].event.id && outcomes.indexOf(betslipOffers.outcomes[k].id) === -1 &&
                     betslipOffers.outcomes[k].id !== outcomes ) {
                     remove.push(betslipOffers.outcomes[k].id);
                  }
               }
            }
         }

         if (this.props.replaceOutcomes === true) {
            widgetModule.removeOutcomeFromBetslip(remove);
         }

         widgetModule.addOutcomeToBetslip(outcomes);
      };

      widgetModule.events.subscribe('OUTCOMES:UPDATE', betslipListener);
      widgetModule.requestBetslipOutcomes();
   }

   /**
    * Creates widget template.
    * @returns {XML}
    */
   render() {
      const t = translationModule.getTranslation.bind(translationModule);

      return (
         <div>
            <Header>
               <span>{t('Combo builder')}</span>
            </Header>
            <Main>
               {this.props.events.slice(0, this.state.listLimit).map((event) => {
                  return (
                     <Event
                        key={event.event.id}
                        homeName={event.event.homeName}
                        awayName={event.event.awayName}
                        onClick={navigateToEvent.bind(null, event)}
                        path={event.event.path.map(part => part.name)}
                     >
                        {event.betOffers.outcomes.map((outcome, index) => {
                           let style;
                           if (index !== 0) {
                              style = { marginLeft: '3px' };
                           }
                           return (
                              <div className='l-flexbox l-flex-1' style={style} key={outcome.id}>
                                 <CustomOutcomeButton
                                    outcome={outcome}
                                    event={event}
                                 />
                              </div>
                           )
                        }
                        )}
                     </Event>
                  );
               })}
            </Main>
            <Footer>
               <div className='kw-footer__add'>
                  <ActionButton
                     action={this.selectNextOutcome.bind(this)}
                     type='secondary'
                     disabled={
                        this.state.listLimit >= this.props.selectionLimit || this.props.events.length <= this.state.listLimit
                     }
                  >
                     { t('Add') }
                  </ActionButton>
               </div>
               <div className='kw-footer__reset'>
                  <ActionButton
                     action={this.resetSelection.bind(this)}
                     type='secondary'
                  >
                     { t('Reset') }
                  </ActionButton>
               </div>
               <div className='kw-footer__addbetslip'>
                  <ActionButton
                     action={this.addOutcomesToBetslip.bind(this)}
                     type='primary'
                  >
                     { t('AddToBetslip') + ' ' + this.state.combinedOdds }
                  </ActionButton>
               </div>
            </Footer>
         </div>
      );
   }
}

ComboWidget.propTypes = {
   /**
    * Events array
    */
   events: React.PropTypes.array.isRequired,

   /**
    * How many events show on the beginning
    */
   defaultListLimit: React.PropTypes.number,

   /**
    * How many event user can select
    */
   selectionLimit: React.PropTypes.number,

   /**
    * Should Betslip list be cleaned before adding selected outcomes
    */
   replaceOutcomes: React.PropTypes.bool
};

ComboWidget.defaultProps = {
   defaultListLimit: 2,
   selectionLimit: 12,
   replaceOutcome: true
};

export default ComboWidget;
