import React from 'react';

const Event = ({ children, homeName, awayName, onClick, path }) => {
   return (
      <div className="kw-event KambiWidget-card-background-color--hoverable">
         <div className="kw-event__participants" onClick={onClick}>
            <span className="kw-event__participants__item">{homeName}</span>
            <span className="kw-event__participants__divider">-</span>
            <span className="kw-event__participants__item">{awayName}</span>
         </div>
         <div className="kw-event__path KambiWidget-card-support-text-color">
            {path.map((part, i) => <span key={i} className="kw-event__path__part">{part}</span>)}
         </div>
         <div className="kw-event__outcomes">
            {children.length <= 3 && children}
         </div>
      </div>
   );
};

Event.propTypes = {
   /**
    * Inner components
    */
   children: React.PropTypes.arrayOf(React.PropTypes.element).isRequired,

   /**
    * Home participant name
    */
   homeName: React.PropTypes.string.isRequired,

   /**
    * Away participant name
    */
   awayName: React.PropTypes.string.isRequired,

   /**
    * Event path
    */
   path: React.PropTypes.arrayOf(React.PropTypes.string).isRequired,

   /**
    * Header click handler
    */
   onClick: React.PropTypes.func.isRequired
};

Event.HEIGHT = 115;

export default Event;
