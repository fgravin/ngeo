goog.provide('wmsimport');

goog.require('go');
goog.require('go_map_directive');
goog.require('ol.Map');
goog.require('ol.View2D');
goog.require('ol.format.WMSCapabilities');
goog.require('ol.layer.Tile');
goog.require('ol.source.OSM');
goog.require('ol.source.TileWMS');

(function() {
  var module = angular.module('app', ['go']);

  module.controller('MainController', ['$scope', 'MainService',

    /**
     * @param {angular.Scope} $scope Scope.
     */
    function($scope, ows) {

      $scope['url'] = 'http://localhost:3000/examples/resources/' +
          'wmscapabilities_1-3-0_geoserver.xml';

      $scope['servicesList'] = [
        'http://ids.pigma.org/geoserver/wms?service=wms&request=getcapabilities',
        'http://www.cigalsace.org/geoserver/wms?service=wms&request=getcapabilities'
      ];

      /** @type {ol.layer.Layer} */
      $scope.layer = new ol.layer.Tile({
        source: new ol.source.OSM()
      });

      /** @type {ol.Map} */
      $scope.map = new ol.Map({
        layers: [
          $scope.layer
        ],
        view: new ol.View2D({
          center: [0, 0],
          zoom: 4
        })
      });

      /**
       *
       * @param {string} url capabilities url to load
       */
      $scope['load'] = function(url) {
        if (goog.isDef(url)) {
          ows.loadWMSCapabilities(url).then(function(data) {
            $scope['layers'] = data;
          });
        }
      };

      /**
       *
       * @param {ol.layer.Layer} layer to add to map
       */
      $scope['addLayerToMap'] = function(layer) {
        /** @type {ol.layer.Layer} */
        var olLayer = ows.getOlLayerFromGetCapLayer(layer);
        if (!goog.isDef($scope.map.removeLayer(layer))) {
          $scope.map.addLayer(olLayer);
        }
      };

      $scope['load']($scope['url']);

    }]);

  module.service('MainService', [
    '$http',
    '$q',

    function($http, $q) {

      /**
       * @param {!Object} obj
       */
      var propertiesToLowerCase = function(obj) {
        for (var p in obj) {
          obj[p.toLowerCase()] = obj[p];
          if (p !== p.toLowerCase()) {
            delete obj[p];
          }
        }
      };

      /**
       * @param {Object} params
       * @param {!Object} options
       * @return {ol.layer.Layer}
       */
      var createWmsLayer = function(params, options) {
        options = options || {};

        /** @type {ol.source.TileWMS} */
        var source = new ol.source.TileWMS({
          params: params,
          url: options.url,
          extent: options.extent,
          ratio: options.ratio || 1
        });

        /** @type {ol.layer.Layer} */
        var layer = new ol.layer.Tile({
          url: options.url,
          type: 'WMS',
          opacity: options.opacity,
          visible: options.visible,
          source: source
        });

        return layer;
      };

      /**
       * @param {string} data
       * @return {Array}
       */
      var readWmsCapabilities = function(data) {

        /** @type {ol.format.WMSCapabilities} */
        var parser = new ol.format.WMSCapabilities();
        var result = parser.read(data);
        var layers = [];

        if (goog.isDef(result.Capability) &&
            goog.isDef(result.Capability.Layer) &&
            goog.isDef(result.Capability.Layer.Layer)) {
          layers = result.Capability.Layer.Layer;

          for (var i = 0; i < layers.length; ++i) {
            propertiesToLowerCase(layers[i]);
            layers[i].wmsurl = result.Capability.Request.
                GetMap.DCPType[0].HTTP.Get.OnlineResource;
          }
        }
        return layers;
      };

      /**
       * @param {string} url
       * @return {!angular.$q.Promise}
       */
      this.loadWMSCapabilities = function(url) {
        var defer = $q.defer();

        $http.get(url)
          .success(function(data, status, headers, config) {
              defer.resolve(readWmsCapabilities(data));
            })
          .error(function(data, status, headers, config) {
              defer.reject(status);
            });
        return defer.promise;
      };

      this.getOlLayerFromGetCapLayer = function(getCapLayer) {
        var wmsParams = {LAYERS: getCapLayer.name};
        var wmsOptions = {
          url: getCapLayer.wmsurl,
          label: getCapLayer.title,
          extent: getCapLayer.extent
        };
        return createWmsLayer(wmsParams, wmsOptions);
      };
    }]);
})();
