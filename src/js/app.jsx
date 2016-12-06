import React from 'react';
import ReactDOM from 'react-dom';
import { coreLibrary, widgetModule } from 'kambi-widget-core-library';
import ComboWidget from './Components/ComboWidget';
import store from './Store/store';

coreLibrary.init({
   widgetTrackingName: 'gm-combo-widget',
   sport: 'FOOTBALL',
   defaultListLimit: 2, // A default setting for the size of the list, used when resetting
   selectionLimit: 5, // The maximum allowed selections, the bet slip supports up to 12 outcomes
   replaceOutcomes: true, // When selecting a different outcome in a betoffer that has already been added to the betslip, should we replace it?
   oddsRange: [1, 8] // An array containing 2 numeric values. Widget will filter out events that don't have betoutcomes inside this range
})
.then(() => store.getEvents(coreLibrary.args.sport, coreLibrary.args.defaultListLimit, coreLibrary.args.oddsRange.sort()))
.then((events) => {

   if (events.length <= 1) {
      throw new Error('Not enough events')
   }
   coreLibrary.setWidgetTrackingName(coreLibrary.args.widgetTrackingName);

   ReactDOM.render(
      <ComboWidget
         events={events}
         defaultListLimit={coreLibrary.args.defaultListLimit}
         selectionLimit={coreLibrary.args.selectionLimit}
         replaceOutcome={coreLibrary.args.replaceOutcomes}
      />,
      document.getElementById('root')
   );
})
.catch((error) => {
   widgetModule.removeWidget();
   throw error;
});
