import React, { Children } from 'react';
import PropTypes from 'prop-types';
import styles from './BottomBar.scss';

const BottomBar = ({ children }) => (
   <div className={styles.bar}>
      {Children.map(children, button =>
         <div className={styles.button}>
            {button}
         </div>)}
   </div>
);

BottomBar.propTypes = {
   /**
    * Inner components
    */
   children: PropTypes.node.isRequired,
};

export default BottomBar;
