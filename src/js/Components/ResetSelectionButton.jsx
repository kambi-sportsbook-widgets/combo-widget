import React from 'react';
import { translationModule } from 'widget-core-library';

const ResetSelectionButton = ({ action }) => {
   const t = translationModule.getTranslation.bind(translationModule);

   return (
      <div className="kw-button__reset" onClick={action}>
         <i className="kw-button__reset__icon" />{t('Reset')}
      </div>
   );
};

ResetSelectionButton.propTypes = {
   /**
    * Button click handler
    */
   action: React.PropTypes.func.isRequired
};

export default ResetSelectionButton;
