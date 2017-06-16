import React, { Children } from 'react';
import PropTypes from 'prop-types';
import styles from './TopBar.scss';

const TopBar = ({ children }) => (
   <div className={styles.bar}>
      {Children.map(children, button =>
         <div className={styles.button}>
            {button}
         </div>)}
   </div>
);

TopBar.propTypes = {
   /**
    * Inner components
    */
   children: PropTypes.arrayOf(PropTypes.element).isRequired,
};

export default TopBar;
