import React from 'react';

const Event = ({ children, homeName, awayName, onClick, path }) => {
   return (
      <div className="kw-event KambiWidget-card-background-color--hoverable l-flexbox l-vertical l-pb-12 l-pt-12">
         <div className="kw-event-name-container l-flexbox l-vertical l-pack-center l-pl-16 l-pr-16">
            <div className="kw-event-name l-flexbox l-pb-6" onClick={onClick}>
               <div className="l-flexbox">
                  <span className="text-truncate">{homeName}</span>
               </div>
               <div className="kw-event-name-divider l-pl-6 l-pr-6">-</div>
               <div className="l-flexbox">
                  <span className="text-truncate">{awayName}</span>
               </div>
            </div>
            <div className="KambiWidget-card-support-text-color l-flexbox l-horizontal">
               <div className="kw-event-path l-flexbox l-horizontal l-pack-center">
                  {path.map((part, i) => {
                     return (
                        <div key={i} className="l-flexbox">
                           <span className="kw-event-path-name l-flexbox">
                              <span className="text-truncate">{part}</span>
                           </span>
                        </div>
                     );
                  })}
               </div>
            </div>
         </div>
         <div className="kw-event-outcomes l-flexbox l-mt-12 l-pr-6">
            {
               children.length <= 3 &&
                  <div className="l-flexbox l-flex-1">
                     {children}
                  </div>
            }
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
