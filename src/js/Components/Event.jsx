import React from 'react';
import PropTypes from 'prop-types';
import styles from './Event.scss';

const Event = ({ children, homeName, awayName, onClose, onClick, path }) => {
   return (
      <div className='kw-event KambiWidget-card-background-color--hoverable'>
         <div className={'KambiWidget-card-support-text-color '.concat(styles.closeSign)} onClick={onClose} />
         <div className='kw-event__participants' onClick={onClick}>
            <span className='kw-event__participants__item'>{homeName}</span>
            <span className='kw-event__participants__divider'>-</span>
            <span className='kw-event__participants__item'>{awayName}</span>
         </div>
         <div className='kw-event__path KambiWidget-card-support-text-color'>
            {path.map((part, i) => <span key={i} className='kw-event__path__part'>{part}</span>)}
         </div>
         <div className='kw-event__outcomes'>
            {children.length <= 3 && children}
         </div>
      </div>
   );
};

Event.propTypes = {
   /**
    * Inner components
    */
   children: PropTypes.arrayOf(PropTypes.element).isRequired,

   /**
    * Home participant name
    */
   homeName: PropTypes.string.isRequired,

   /**
    * Away participant name
    */
   awayName: PropTypes.string.isRequired,

   /**
    * Event path
    */
   path: PropTypes.arrayOf(PropTypes.string).isRequired,

   /**
    * Header click handler
    */
   onClick: PropTypes.func.isRequired,

   /**
    * Header on close handler
    */

   onClose: PropTypes.func.isRequired
};

export default Event;
