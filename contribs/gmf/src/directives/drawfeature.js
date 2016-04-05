goog.provide('gmf.DrawfeatureController');
goog.provide('gmf.drawfeatureDirective');

goog.require('gmf');
goog.require('ngeo.DecorateInteraction');
goog.require('ngeo.FeatureHelper');
/** @suppress {extraRequire} */
goog.require('ngeo.btngroupDirective');
goog.require('ngeo.interaction.MeasureArea');
goog.require('ngeo.interaction.MeasureAzimut');
goog.require('ngeo.interaction.MeasureLength');
goog.require('ol.Feature');
goog.require('ol.geom.GeometryType');
goog.require('ol.geom.Polygon');
goog.require('ol.interaction.Draw');
goog.require('ol.style.Style');


/**
 * Directive used to draw vector features on a map.
 * Example:
 *
 *     <gmf-drawfeature
 *       gmf-drawfeature-active="ctrl.drawActive"
 *       gmf-drawfeature-map="::ctrl.map">
 *     </gmf-drawfeature>
 *
 * @htmlAttribute {ol.Map} gmf-drawfeature-map The map.
 * @return {angular.Directive} The directive specs.
 * @ngInject
 * @ngdoc directive
 * @ngname gmfDrawfeature
 */
gmf.drawfeatureDirective = function() {
  return {
    controller: 'GmfDrawfeatureController',
    scope: {
      'active': '=gmfDrawfeatureActive',
      'map': '=gmfDrawfeatureMap'
    },
    bindToController: true,
    controllerAs: 'dfCtrl',
    templateUrl: gmf.baseTemplateUrl + '/drawfeature.html'
  };
};

gmf.module.directive('gmfDrawfeature', gmf.drawfeatureDirective);


/**
 * @param {!angular.Scope} $scope Scope.
 * @param {angular.$compile} $compile Angular compile service.
 * @param {angular.$sce} $sce Angular sce service.
 * @param {gettext} gettext Gettext service.
 * @param {angularGettext.Catalog} gettextCatalog Gettext service.
 * @param {ngeo.DecorateInteraction} ngeoDecorateInteraction Decorate
 *     interaction service.
 * @param {ngeo.FeatureHelper} ngeoFeatureHelper Gmf feature helper service.
 * @param {ol.Collection.<ol.Feature>} ngeoFeatures Collection of features.
 * @constructor
 * @ngInject
 * @ngdoc controller
 * @ngname GmfDrawfeatureController
 */
gmf.DrawfeatureController = function($scope, $compile, $sce, gettext,
    gettextCatalog, ngeoDecorateInteraction, ngeoFeatureHelper, ngeoFeatures) {

  /**
   * @type {ol.Map}
   * @export
   */
  this.map;

  /**
   * @type {boolean}
   * @export
   */
  this.active;

  if (this.active === undefined) {
    this.active = false;
  }

  /**
   * @type {angularGettext.Catalog}
   * @private
   */
  this.gettextCatalog_ = gettextCatalog;

  /**
   * @type {ngeo.FeatureHelper}
   * @private
   */
  this.featureHelper_ = ngeoFeatureHelper;

  /**
   * @type {ol.Collection.<ol.Feature>}
   * @private
   */
  this.features_ = ngeoFeatures;

  /**
   * @type {Object}
   * @export
   */
  this.measureStartMsg = null;

  /**
   * @type {Object}
   * @export
   */
  this.measureLengthContinueMsg = null;

  /**
   * @type {Object}
   * @export
   */
  this.measureAreaContinueMsg = null;

  /**
   * @type {Object}
   * @export
   */
  this.measureAzimutContinueMsg = null;

  /**
   * @type {Array.<ol.interaction.Interaction>}
   * @private
   */
  this.interactions_ = [];

  var geomType = ngeo.GeometryType;

  // === POINT ===

  /**
   * @type {ol.interaction.Draw}
   * @export
   */
  this.drawPoint = new ol.interaction.Draw({
    type: ol.geom.GeometryType.POINT
  });

  var drawPoint = this.drawPoint;
  this.interactions_.push(drawPoint);
  ol.events.listen(drawPoint, ol.interaction.DrawEventType.DRAWEND,
      this.handleDrawEnd_.bind(this, geomType.POINT), this);
  ol.events.listen(drawPoint,
      ol.Object.getChangeEventType(ol.interaction.InteractionProperty.ACTIVE),
      this.handleActiveChange_, this);


  // === LENGTH / LINE_STRING ===

  var helpMsg = gettext('Click to start drawing length');
  var contMsg = gettext('Click to continue drawing<br/>' +
      'Double-click or click last point to finish');

  /**
   * @type {ngeo.interaction.MeasureLength}
   * @export
   */
  this.measureLength = new ngeo.interaction.MeasureLength({
    style: new ol.style.Style(),
    startMsg: $compile('<div translate>' + helpMsg + '</div>')($scope)[0],
    continueMsg: $compile('<div translate>' + contMsg + '</div>')($scope)[0]
  });

  var measureLength = this.measureLength;
  this.interactions_.push(measureLength);
  ol.events.listen(measureLength, ngeo.MeasureEventType.MEASUREEND,
      this.handleDrawEnd_.bind(this, geomType.LINE_STRING), this);
  ol.events.listen(measureLength,
      ol.Object.getChangeEventType(ol.interaction.InteractionProperty.ACTIVE),
      this.handleActiveChange_, this);


  // === AREA / POLYGON ===

  helpMsg = gettext('Click to start drawing area');
  contMsg = gettext('Click to continue drawing<br/>' +
      'Double-click or click starting point to finish');

  /**
   * @type {ngeo.interaction.MeasureArea}
   * @export
   */
  this.measureArea = new ngeo.interaction.MeasureArea({
    style: new ol.style.Style(),
    startMsg: $compile('<div translate>' + helpMsg + '</div>')($scope)[0],
    continueMsg: $compile('<div translate>' + contMsg + '</div>')($scope)[0]
  });

  var measureArea = this.measureArea;
  this.interactions_.push(measureArea);
  ol.events.listen(measureArea, ngeo.MeasureEventType.MEASUREEND,
      this.handleDrawEnd_.bind(this, geomType.POLYGON), this);
  ol.events.listen(measureArea,
      ol.Object.getChangeEventType(ol.interaction.InteractionProperty.ACTIVE),
      this.handleActiveChange_, this);


  // === AZIMUT / CIRCLE ===

  helpMsg = gettext('Click to start drawing azimut');
  contMsg = gettext('Click to finish');

  /**
   * @type {ngeo.interaction.MeasureAzimut}
   * @export
   */
  this.measureAzimut = new ngeo.interaction.MeasureAzimut({
    style: new ol.style.Style(),
    startMsg: $compile('<div translate>' + helpMsg + '</div>')($scope)[0],
    continueMsg: $compile('<div translate>' + contMsg + '</div>')($scope)[0]
  });

  var measureAzimut = this.measureAzimut;
  this.interactions_.push(measureAzimut);
  ol.events.listen(measureAzimut, ngeo.MeasureEventType.MEASUREEND,
      /**
       * @param {ngeo.MeasureEvent} event Event.
       */
      function(event) {
        // In the case of azimut measure interaction, the feature's geometry is
        // actually a collection (line + circle)
        // For our purpose here, we only need the circle.
        var geometry = /** @type {ol.geom.GeometryCollection} */
            (event.feature.getGeometry());
        event.feature = new ol.Feature(geometry.getGeometries()[1]);
        this.handleDrawEnd_(ngeo.GeometryType.CIRCLE, event);
      }, this);
  ol.events.listen(measureAzimut,
      ol.Object.getChangeEventType(ol.interaction.InteractionProperty.ACTIVE),
      this.handleActiveChange_, this);


  // === RECTANGLE ===

  /**
   * @type {ol.interaction.Draw}
   * @export
   */
  this.drawRectangle = new ol.interaction.Draw({
    type: ol.geom.GeometryType.LINE_STRING,
    geometryFunction: function(coordinates, geometry) {
      if (!geometry) {
        geometry = new ol.geom.Polygon(null);
      }
      var start = coordinates[0];
      var end = coordinates[1];
      geometry.setCoordinates([
        [start, [start[0], end[1]], end, [end[0], start[1]], start]
      ]);
      return geometry;
    },
    maxPoints: 2
  });

  var drawRectangle = this.drawRectangle;
  this.interactions_.push(drawRectangle);
  ol.events.listen(drawRectangle, ol.interaction.DrawEventType.DRAWEND,
      this.handleDrawEnd_.bind(this, geomType.RECTANGLE), this);
  ol.events.listen(drawRectangle,
      ol.Object.getChangeEventType(ol.interaction.InteractionProperty.ACTIVE),
      this.handleActiveChange_, this);


  // === TEXT ===

  /**
   * @type {ol.interaction.Draw}
   * @export
   */
  this.drawText = new ol.interaction.Draw({
    type: ol.geom.GeometryType.POINT
  });

  var drawText = this.drawText;
  this.interactions_.push(drawText);
  ol.events.listen(drawText, ol.interaction.DrawEventType.DRAWEND,
      this.handleDrawEnd_.bind(this, geomType.TEXT), this);
  ol.events.listen(drawText,
      ol.Object.getChangeEventType(ol.interaction.InteractionProperty.ACTIVE),
      this.handleActiveChange_, this);


  // setActive, decorate and add interaction
  this.interactions_.forEach(function(interaction) {
    interaction.setActive(false);
    ngeoDecorateInteraction(interaction);
    this.map.addInteraction(interaction);
  }, this);


  // Watch the "active" property, and disable the draw interactions
  // when "active" gets set to false.
  $scope.$watch(
    function() {
      return this.active;
    }.bind(this),
    function(newVal) {
      if (newVal === false) {
        this.interactions_.forEach(function(interaction) {
          interaction.setActive(false);
        }, this);
      }
    }.bind(this)
  );

};


/**
 * @param {ol.ObjectEvent} event Event.
 * @private
 */
gmf.DrawfeatureController.prototype.handleActiveChange_ = function(event) {
  this.active = this.interactions_.some(function(interaction) {
    return interaction.getActive();
  }, this);
};


/**
 * Called when a feature is finished being drawn. Set the default properties
 * for its style, then set its style and add it to the features collection.
 * @param {string} type Type of geometry being drawn.
 * @param {ol.interaction.DrawEvent|ngeo.MeasureEvent} event Event.
 * @private
 */
gmf.DrawfeatureController.prototype.handleDrawEnd_ = function(type, event) {
  var feature = event.feature;

  var prop = ngeo.FeatureProperties;

  switch (type) {
    case ngeo.GeometryType.CIRCLE:
      var featureGeom = /** @type {ol.geom.Circle} */ (feature.getGeometry());
      feature.setGeometry(
          ol.geom.Polygon.fromCircle(featureGeom, 64)
      );
      feature.set(prop.IS_CIRCLE, true);
      break;
    case ngeo.GeometryType.TEXT:
      feature.set(prop.IS_TEXT, true);
      break;
    case ngeo.GeometryType.RECTANGLE:
      feature.set(prop.IS_RECTANGLE, true);
      break;
    default:
      break;
  }

  /**
   * @type {string}
   */
  var name = this.gettextCatalog_.getString(type);
  feature.set(prop.NAME, name + ' ' + (this.features_.getLength() + 1));

  feature.set(prop.ANGLE, 0);
  feature.set(prop.COLOR, '#ed1c24');
  feature.set(prop.OPACITY, 0.2);
  feature.set(prop.SHOW_MEASURE, false);
  feature.set(prop.SIZE, 10);
  feature.set(prop.STROKE, 1);

  // set style
  this.featureHelper_.setStyle(feature);

  // push in collection
  this.features_.push(feature);
};

gmf.module.controller('GmfDrawfeatureController', gmf.DrawfeatureController);
