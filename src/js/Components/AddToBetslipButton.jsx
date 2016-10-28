import React from 'react';
import { translationModule } from 'kambi-widget-core-library';

const AddToBetslipButton = ({ action, odds }) => {
   const t = translationModule.getTranslation.bind(translationModule);

   return (
      <div className="kw-button__addtobetslip" onClick={action}>
         <span className="kw-button_addtobetslip__label" title={t('Add to betslip')}>{t('Add to betslip')}</span>
         <strong>{odds}</strong>
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
