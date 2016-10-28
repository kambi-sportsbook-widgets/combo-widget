import React from 'react';

const AddEventButton = ({ disabled, action }) => {
   const className = ['kw-button__add']
      .concat(disabled ? ['kw-button--disabled'] : [])
      .join(' ');

   return (
      <div className={className} onClick={action}>
         <i className="kw-button__add__icon" />
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
