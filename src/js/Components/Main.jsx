import React from 'react';

const Main = ({ children }) => {
   return (
      <main className='kw-main'>
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
