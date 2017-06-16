import React, { Children } from 'react';
import PropTypes from 'prop-types';
import styles from './Event.scss';

const Event = ({ children, homeName, awayName, onClose, onClick, path }) => (
   <div className={`${styles.general} KambiWidget-card-background-color--hoverable`}>
      <div className={`KambiWidget-card-support-text-color ${styles.closeSign}`} onClick={onClose} />
      <div className={styles.participants} onClick={onClick}>
         <span className={styles.item}>{homeName}</span>
         <span className={styles.divider}>-</span>
         <span className={styles.item}>{awayName}</span>
      </div>
      <div className={`${styles.path} KambiWidget-card-support-text-color`}>
         {path.map((part, i) => <span key={i} className={styles.part}>{part}</span>)}
      </div>
      <div className={styles.outcomes}>
         {children.length <= 3 && Children.map(children, child =>
            <div className={styles.outcome}>{child}</div>)}
      </div>
   </div>
);

Event.propTypes = {
   /**
    * Inner components
    */
   children: PropTypes.node.isRequired,

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
