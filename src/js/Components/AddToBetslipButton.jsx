import React from 'react';
import { translationModule } from 'widget-core-library';

const AddToBetslipButton = ({ action, odds }) => {
   const t = translationModule.getTranslation.bind(translationModule);

   return (
      <div className="l-flexbox l-flex-1 l-pack-end">
         <div className="kw-btn-outer l-flexbox l-align-center l-flex-1">
            <div
               className="kw-btn kw-plain l-flex-1"
               id="add-to-betslip"
               onClick={action}
            >
               <div className="l-flexbox l-pack-justify">
                  <div className="kw-btn-label l-flexbox l-pack-start l-mr-6">
                     <span className="text-truncate" title={t('Add to betslip')}>{t('Add to betslip')}</span>
                  </div>
                  <div className="kw-event-outcome-odd">
                     <strong>{odds}</strong>
                  </div>
               </div>
            </div>
         </div>
      </div>
   );
};

AddToBetslipButton.propTypes = {
   /**
    * Odds to display on button
    */
   odds: React.PropTypes.string.isRequired,

   /**
    * Button click handler
    */
   action: React.PropTypes.func.isRequired
};

AddToBetslipButton.defaultProps = {
   disabled: false
};

export default AddToBetslipButton;
