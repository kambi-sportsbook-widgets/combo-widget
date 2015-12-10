(function () {

   var arrDependencies;

   arrDependencies = [
      'widgetCore',
      'ngAnimate'
   ];

   (function ( $app ) {
      'use strict';

      return $app;
   })(angular.module('comboWidget', arrDependencies));
}).call(this);
