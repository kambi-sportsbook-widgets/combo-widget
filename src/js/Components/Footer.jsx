import React from 'react';

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
   children: React.PropTypes.arrayOf(React.PropTypes.element).isRequired,
};

export default Footer;
