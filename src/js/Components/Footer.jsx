import React from 'react';

const Footer = ({ children }) => {
   return (
      <footer className="l-flexbox l-align-center l-mr-16 l-ml-16 l-mb-12">
         <div className="l-flexbox l-flex-1">
            {children}
         </div>
      </footer>
   );
};

Footer.propTypes = {
   /**
    * Inner components
    */
   children: React.PropTypes.arrayOf(React.PropTypes.element).isRequired,
};

Footer.HEIGHT = 58;

export default Footer;
