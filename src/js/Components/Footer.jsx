import React from 'react';
import PropTypes from 'prop-types';

const Footer = ({ children }) => {
   return (
      <footer className='kw-footer'>
         {children}
      </footer>
   );
};

Footer.propTypes = {
   /**
    * Inner components
    */
   children: PropTypes.arrayOf(PropTypes.element).isRequired,
};

export default Footer;
