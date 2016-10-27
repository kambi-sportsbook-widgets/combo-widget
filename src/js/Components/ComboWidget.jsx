import React from 'react';
import { coreLibrary, widgetModule, utilModule, translationModule } from 'widget-core-library';
import CustomOutcomeButton from './CustomOutcomeButton';

const ROW_HEIGHT = 115;

const HEADER_HEIGHT = 37;

const FOOTER_HEIGHT = 58;

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

class ComboWidget extends React.Component {

   /**
    * Constructs.
    * @param {object} props Widget properties
    */

   constructor(props) {
      super(props);

      widgetModule.enableWidgetTransition(true);

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

      this.adjustHeight();
      this.calculateCombinedOdds();
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
      this.adjustHeight();
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
      // Reset the list size and height
      this.setState({
         listLimit: this.props.defaultListLimit
      });

      this.adjustHeight();

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

   adjustHeight() {
      widgetModule.setWidgetHeight(
         FOOTER_HEIGHT + HEADER_HEIGHT + (this.state.listLimit * ROW_HEIGHT)
      );
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

         if (hasSelected === false) {
            if (selectedCount === this.state.listLimit) {
               this.setState({
                  listLimit: this.state.listLimit + 1
               });
            }

            this.props.events[i].betOffers.outcomes[this.props.events[i].betOffers.lowestOutcome].selected = true;

            this.calculateCombinedOdds();

            this.adjustHeight();

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
            <header className="kw-header l-pl-16">{t('Combo builder')}</header>
            <main className="l-flexbox l-vertical l-flexed l-pack-start main">
               {this.props.events.slice(0, this.state.listLimit).map((event) => {
                  return (
                     <div key={event.event.id} className="kw-event KambiWidget-card-background-color--hoverable l-flexbox l-vertical l-pb-12 l-pt-12">
                        <div className="kw-event-name-container l-flexbox l-vertical l-pack-center l-pl-16 l-pr-16">
                           <div className="kw-event-name l-flexbox l-pb-6" onClick={navigateToEvent.bind(null, event)}>
                              <div className="l-flexbox">
                                 <span className="text-truncate">{event.event.homeName}</span>
                              </div>
                              <div className="kw-event-name-divider l-pl-6 l-pr-6">-</div>
                              <div className="l-flexbox">
                                 <span className="text-truncate">{event.event.awayName}</span>
                              </div>
                           </div>
                           <div className="KambiWidget-card-support-text-color l-flexbox l-horizontal">
                              <div className="kw-event-path l-flexbox l-horizontal l-pack-center">
                                 {event.event.path.map((pathPart) => {
                                    return (
                                       <div key={pathPart.id} className="l-flexbox">
                                          <span className="kw-event-path-name l-flexbox">
                                             <span className="text-truncate">{pathPart.name}</span>
                                          </span>
                                       </div>
                                    );
                                 })}
                              </div>
                           </div>
                        </div>
                        <div className="kw-event-outcomes l-flexbox l-mt-12 l-pr-6">
                           {
                              event.betOffers.outcomes.length <= 3 &&
                                 <div className="l-flexbox l-flex-1">
                                    {event.betOffers.outcomes.map((outcome) => {
                                       return (
                                          <CustomOutcomeButton
                                             key={outcome.id}
                                             outcome={outcome}
                                             event={event}
                                          />
                                       );
                                    })}
                                 </div>
                           }
                        </div>
                     </div>
                  );
               })}
            </main>
            <footer className="l-flexbox l-align-center l-mr-16 l-ml-16 l-mb-12">
               <div className="l-flexbox l-flex-1">
                  <div className="l-flexbox">
                     <div
                        className={['kw-btn', 'kw-plain'].concat(this.state.listLimit >= this.props.selectionLimit ? ['disabled'] : []).join(' ')}
                        onClick={this.selectNextOutcome.bind(this)}
                     >
                        <i className="icon-plus" />
                     </div>
                  </div>
                  <div className="l-flexbox l-mr-6 l-ml-6 ">
                     <div
                        className="kw-btn kw-plain"
                        onClick={this.resetSelection.bind(this)}
                     >
                        <i className="icon-rotate-right l-mr-6" />{t('Reset')}
                     </div>
                  </div>
                  <div className="l-flexbox l-flex-1 l-pack-end">
                     <div className="kw-btn-outer l-flexbox l-align-center l-flex-1">
                        <div
                           className="kw-btn kw-plain l-flex-1"
                           id="add-to-betslip"
                           onClick={this.addOutcomesToBetslip.bind(this)}
                        >
                           <div className="l-flexbox l-pack-justify">
                              <div className="kw-btn-label l-flexbox l-pack-start l-mr-6">
                                 <span className="text-truncate" title={t('Add to betslip')}>{t('Add to betslip')}</span>
                              </div>
                              <div className="kw-event-outcome-odd">
                                 <strong>{this.state.combinedOdds}</strong>
                              </div>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
            </footer>
         </div>
      );
   }
}

ComboWidget.propTypes = {
   events: React.PropTypes.array.isRequired,
   defaultListLimit: React.PropTypes.number,
   selectionLimit: React.PropTypes.number,
   replaceOutcomes: React.PropTypes.bool
};

ComboWidget.defaultProps = {
   defaultListLimit: 2,
   selectionLimit: 12,
   replaceOutcome: true
};

export default ComboWidget;
