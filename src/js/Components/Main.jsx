import React from 'react';

const Main = ({ children }) => {
   return (
      <main className="l-flexbox l-vertical l-flexed l-pack-start main">
         {children}
      </main>
   );
};

Main.propTypes = {
   /**
    * Inner components
    */
   children: React.PropTypes.arrayOf(React.PropTypes.element).isRequired,
};

export default Main;
