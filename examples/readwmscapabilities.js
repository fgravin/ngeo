goog.provide('readwmscapabilities');

goog.require('go_config_service');
goog.require('go_map_directive');
goog.require('go_map_service');
goog.require('go_ows_service');
goog.require('go_urlutils_service');
goog.require('ol.Map');
goog.require('ol.View2D');
goog.require('ol.layer.Tile');
goog.require('ol.source.OSM');

(function() {
  var module = angular.module('app', ['go']);

  module.controller('MainController', [
    '$scope',
    'goOws',
    'goMap',
    'goConfig',

    /**
     * @param {angular.Scope} $scope Scope.
     */
    function($scope, goOws, goMap, goConfig) {

      goConfig.proxy = undefined;

      var url = 'http://localhost:3000/examples/resources/wmscapabilities_1-3-0_geoserver.xml';
      goOws.loadWMSCapabilities(url).then(function(data) {
        $scope['layers'] = goOws.getOlLayersFromGetCapLayers(data);
      });

      /**
       * @param {ol.layer.Layer} layer
       */
      $scope.addLayerToMap = function(layer) {
        if(!goog.isDef($scope.map.removeLayer(layer))) {
          $scope.map.addLayer(layer);
        }
      };

      /** @type {ol.Map} */
      $scope.map = new ol.Map({
        layers: [
          new ol.layer.Tile({
            source: new ol.source.OSM()
          })
        ],
        view: new ol.View2D({
          center: [0, 0],
          zoom: 4
        })
      });
    }]);
})();
