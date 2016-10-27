import React from 'react';

const AddEventButton = ({ disabled, action }) => {
   return (
      <div className="l-flexbox">
         <div
            className={['kw-btn', 'kw-plain'].concat(disabled ? ['disabled'] : []).join(' ')}
            onClick={action}
         >
            <i className="icon-plus" />
         </div>
      </div>
   );
};

AddEventButton.propTypes = {
   /**
    * Controls button disabled state
    */
   disabled: React.PropTypes.bool,

   /**
    * Button click handler
    */
   action: React.PropTypes.func.isRequired
};

AddEventButton.defaultProps = {
   disabled: false
};

export default AddEventButton;
