import React from 'react';
import ReactDOM from 'react-dom';
import { coreLibrary, widgetModule } from 'kambi-widget-core-library';
import ComboWidget from './Components/ComboWidget';
import store from './Store/store';

coreLibrary.init({
   widgetTrackingName: 'gm-combo-widget',
   sport: 'FOOTBALL',
   defaultListLimit: 3, // A default setting for the size of the list, used when resetting
   selectionLimit: 12, // The maximum allowed selections, the bet slip supports up to 12 outcomes
   replaceOutcomes: true // When selecting a different outcome in a betoffer that has already been added to the betslip, should we replace it?
})
.then(() => store.getEvents(coreLibrary.args.sport, coreLibrary.args.defaultListLimit))
.then((events) => {
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
