import React from 'react';
import { translationModule } from 'widget-core-library';

const ResetSelectionButton = ({ action }) => {
   const t = translationModule.getTranslation.bind(translationModule);

   return (
      <div className="l-flexbox l-mr-6 l-ml-6 ">
         <div
            className="kw-btn kw-plain"
            onClick={action}
         >
            <i className="icon-rotate-right l-mr-6" />{t('Reset')}
         </div>
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
