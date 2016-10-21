/*
(function () {

   var Module = Stapes.subclass();

   rivets.binders['outcome-suspended'] = function ( el, property ) {
      var cssClass = 'KambiWidget-outcome--suspended';
      if ( property === true ) {
         el.classList.add(cssClass);
      } else {
         el.classList.remove(cssClass);
      }
   };

   rivets.binders['outcome-selected'] = function ( el, property ) {
      var cssClass = 'KambiWidget-outcome--selected';

      if ( property === true ) {
         el.classList.add(cssClass);
      } else {
         el.classList.remove(cssClass);
      }
   };


   rivets.components['custom-outcome-component'] = {
      template: function () {
         return `
<button
      rv-on-click="toggleOutcome"
      rv-disabled="betOffer.suspended | == true"
      rv-outcome-selected="data.outcomeAttr.selected"
      rv-outcome-suspended="betOffer.suspended"
      type="button"
      role="button"
      class="KambiWidget-outcome kw-link l-flex-1 l-ml-6">
   <div class="KambiWidget-outcome__flexwrap">
      <div class="KambiWidget-outcome__label-wrapper">
         <span
               class="KambiWidget-outcome__label"
               rv-text="getLabel < data.outcomeAttr.odds data.eventAttr.event">
         </span>
         <span class="KambiWidget-outcome__line"></span>
      </div>
   <div class="KambiWidget-outcome__odds-wrapper">
      <span
            class="KambiWidget-outcome__odds"
            rv-text="getOddsFormat < data.outcomeAttr.odds coreLibraryConfig.oddsFormat">
      </span>
   </div>
</button>
         `;
      },

      initialize: function ( el, attributes ) {
         if ( attributes.outcomeAttr == null ) {
            return false;
         }
         el.classList.add('l-flexbox');
         el.classList.add('l-flex-1');
         return new OutcomeViewController(attributes);
      }
   };
})();
*/
