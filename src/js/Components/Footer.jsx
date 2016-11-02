import React from 'react';

const Footer = ({ children }) => {
   return (
      <footer className="kw-footer">
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

Footer.HEIGHT = 62;

export default Footer;
