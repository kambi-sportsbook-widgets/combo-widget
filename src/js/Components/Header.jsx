import React from 'react';

const Header = ({ title }) => {
   return (
      <header className="kw-header">{title}</header>
   );
};

Header.propTypes = {
   /**
    * Header's title
    */
   title: React.PropTypes.string
};

Header.HEIGHT = 37;

export default Header;
