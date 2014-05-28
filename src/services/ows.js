goog.provide('go_ows_service');

goog.require('go');
goog.require('goog.asserts');
goog.require('ol.format.WMSCapabilities');
goog.require('ol.layer.Tile');
goog.require('ol.source.TileWMS');

goModule.service('goOws', [
  'goConfig',
  'goUrlUtils',
  '$http',
  '$q',

  function(goConfig, goUrlUtils, $http, $q) {

    /**
     * @param {!Object} obj
     */
    var propertiesToLowerCase = function(obj) {
      for(var p in obj) {
        obj[p.toLowerCase()] = obj[p];
        if(p !== p.toLowerCase()) {
          delete obj[p];
        }
      }
    };

    /**
     * @param {string} url
     * @returns {string}
     */
    var prepareWmsCapabilitiesParams = function(url) {
      var parts = url.split('?');

      var urlParams = goog.isDef(parts[1]) ?
        goUrlUtils.parseKeyValue(parts[1].toLowerCase()) :
      {};

      var defaultParams = {
        service: 'WMS',
        request: 'getCapabilities'
      };
      angular.extend(defaultParams, urlParams);

      url = goUrlUtils.append(parts[0],
        goUrlUtils.toKeyValue(defaultParams));

      return url;
    };

    /**
     * @param {Object} params
     * @param {!Object} options
     * @returns {ol.layer.Layer}
     */
    var createWmsLayer = function(params, options) {
      options = options || {};

      var source = new ol.source.TileWMS({
        params: params,
        url: options.url,
        extent: options.extent,
        ratio: options.ratio || 1
      });

      var layer = new ol.layer.Tile({
        url: options.url,
        type: 'WMS',
        opacity: options.opacity,
        visible: options.visible,
        source: source
      });
      layer['label'] = options.label;

      return layer;
    };

    /**
     * @param data
     * @returns {Array}
     */
    var readWmsCapabilities = function(data) {

      /** @type {ol.format.WMSCapabilities} */
      var parser = new ol.format.WMSCapabilities();
      var result = parser.read(data);
      var layers = [];

      if(goog.isDef(result.Capability) && goog.isDef(result.Capability.Layer)
        && goog.isDef(result.Capability.Layer.Layer)) {
        layers = result.Capability.Layer.Layer;

        for(var i=0;i<layers.length;++i) {
          propertiesToLowerCase(layers[i]);
          layers[i].wmsurl = result.Capability.Request.GetMap.DCPType[0].HTTP.Get.OnlineResource;
        }
      }
      return layers;
    };

    /**
     * @param {string} url
     * @returns {!angular.$q.Promise}
     */
    this.loadWMSCapabilities = function(url) {
      var defer = $q.defer();
        if (goUrlUtils.isValid(url)) {

          url = prepareWmsCapabilitiesParams(url);

          if(goog.isDef(goConfig.proxy)) {
            url = goConfig.proxy + encodeURIComponent(url);
          }
          $http.get(url)
            .success(function (data, status, headers, config) {
              defer.resolve(readWmsCapabilities(data));
            })
            .error(function (data, status, headers, config) {
              defer.reject(status);
            });
        }
      return defer.promise;
    };

    var getOlLayerFromGetCapLayer = function(getCapLayer) {
      var wmsParams = {LAYERS: getCapLayer.name};
      var wmsOptions = {
        url: getCapLayer.wmsurl,
        label: getCapLayer.title,
        extent: getCapLayer.extent
      };
      return createWmsLayer(wmsParams, wmsOptions);
    };

    /**
     *
     * @param {Array|Object} capLayers
     */
    this.getOlLayersFromGetCapLayers = function(capLayers) {
      if(goog.isArray(capLayers)) {
        var layers = [];
        for(var i=0;i<capLayers.length;++i) {
          layers.push(getOlLayerFromGetCapLayer(capLayers[i]));
        }
        return layers;
      }
      if(goog.isObject(capLayers)) {
        return getOlLayerFromGetCapLayer(capLayers);
      }
    }
  }]);