goog.provide('gmf-drawfeature');

goog.require('gmf.Features');
goog.require('gmf.drawfeatureDirective');
goog.require('gmf.mapDirective');
goog.require('ngeo.ToolActivate');
goog.require('ngeo.ToolActivateMgr');
goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.layer.Tile');
goog.require('ol.source.OSM');


/** @const **/
var app = {};


/** @type {!angular.Module} **/
app.module = angular.module('app', ['gmf']);


/**
 * @param {!angular.Scope} $scope Angular scope.
 * @param {ngeo.ToolActivateMgr} ngeoToolActivateMgr Ngeo ToolActivate manager
 *     service.
 * @param {ol.Collection.<ol.Feature>} gmfFeatures Collection of features.
 * @constructor
 */
app.MainController = function($scope, ngeoToolActivateMgr, gmfFeatures) {

  /**
   * @type {!angular.Scope}
   * @private
   */
  this.scope_ = $scope;

  var vector = new ol.layer.Vector({
    source: new ol.source.Vector({
      wrapX: false,
      features: gmfFeatures
    })
  });

  /**
   * @type {ol.Map}
   * @export
   */
  this.map = new ol.Map({
    layers: [
      new ol.layer.Tile({
        source: new ol.source.OSM()
      }),
      vector
    ],
    view: new ol.View({
      center: [0, 0],
      zoom: 3
    })
  });

  /**
   * @type {boolean}
   * @export
   */
  this.drawActive = false;

  var drawToolActivate = new ngeo.ToolActivate(this, 'drawActive');
  ngeoToolActivateMgr.registerTool('mapTools', drawToolActivate, false);

  /**
   * @type {boolean}
   * @export
   */
  this.dummyActive = true;

  var dummyToolActivate = new ngeo.ToolActivate(this, 'dummyActive');
  ngeoToolActivateMgr.registerTool('mapTools', dummyToolActivate, true);
};


app.module.controller('MainController', app.MainController);
