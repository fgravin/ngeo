/**
 * @externs
 */


/**
 * @type {Object}
 */
var ol = {};


/**
 * @constructor
 */
ol.Map = function() {};

/**
 * @param {Element|string|undefined} target
 */
ol.Map.prototype.setTarget = function(target) {};


/**
 * @type {Object}
 */
ol.layer = {};


/**
 * @constructor
 */
ol.layer.Base = function() {};

/**
 * @return {boolean|undefined}
 */
ol.layer.Base.prototype.getVisible = function() {};

/**
 * @return {number|undefined}
 */
ol.layer.Base.prototype.getOpacity = function() {};

/**
 * @param {boolean|undefined} visible
 */
ol.layer.Base.prototype.setVisible = function(visible) {};

/**
 * @param {number|undefined} opacity
 */
ol.layer.Base.prototype.setOpacity = function(opacity) {};


/**
 * @constructor
 * @extends {ol.layer.Base}
 */
ol.layer.Layer = function() {};

/**
 * @constructor
 * @extends {ol.layer.Layer}
 */
ol.layer.Tile = function() {};

/**
 * @type {Object}
 */
ol.format = {};

/**
 * @constructor
 */
ol.format.WMSCapabilities = function() {};

/**
 * @param {Document|Node|string}
 * @return {Object}
 */
ol.format.WMSCapabilities.prototype.read = function(data) {};