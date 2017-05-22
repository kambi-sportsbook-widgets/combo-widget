import React from 'react';
import PropTypes from 'prop-types';

const Main = ({ children }) => (
   <main className='kw-main'>
      {children}
   </main>
);

Main.propTypes = {
   /**
    * Inner components
    */
   children: PropTypes.arrayOf(PropTypes.element).isRequired,
};

export default Main;
