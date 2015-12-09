# GMF Developper Guide

The purpose of this guideline is to help the developper to contribute in the 
best way to `ngeo` and `gmf` cores.
It will describe the golbal philosophy of `ngeo` design, and set base rules to 
apply when you want to add a new feature.

## Main principle
Before starting to code a new feature in `gmf`, you must determine if this feature
 is 100% `gmf` specific, or if the feature is generic and could be added to `ngeo` 
 core. You also need to check in `ngeo` core and examples if you don't find
  anything that could fit with your needs.
 
 
The main principle is to put everything you can in `ngeo`, and put in `gmf` only 
what is specific.
When you develop into `gmf` contribs, you must consider that you are developing a
 client application, and try your best to extract from your code all things that
  could go into `ngeo`, to shared with other projects.
You must not consider that `gmf` is a real part of `ngeo`, and that there is no real
 importance to put your stuff into `ngeo` or `gmf` cores, it does. 
This point is essential to be sure `ngeo` is going in the good direction: 
maintainable, reusable, evolving.

## 1. Make your code generic in `ngeo`
In `ngeo`, we want to have very generic code that will be shared between `gmf` and 
other web map applications. When you add some code in `ngeo`, you need to follow 
some rules that helps the code to be easly usable and customisable.

### Avoid template when not needed.
For example, if you want to create a new directive for a button that will have 
an action on click.
The bad way to write it in ngeo:

```js
/**
 * @return {angular.Directive} Directive Definition Object.
 */
ngeo.foobarDirective = function() {
  return {
    restricted: 'E',
    template: '<button ng-click="ctrl.doAction()" />',
    controllerAs: 'ctrl',  
    ....
  }
};

/**
 * @constructor
 * @ngInject
 * @export
 */
ngeo.NgeoFoobarController = function() {
  this.doAction = function() {console.log('Action');}
};
```

Now the right approach:

```js
/**
 * @return {angular.Directive} Directive Definition Object.
 */
ngeo.foobarDirective = function() {
  return {
    restricted: 'A',
    template: undefined,  
    ....
  }
};
```

You can then bind the click in from the controller of your directive :

```js
/**
 * @constructor
 * @param {angular.JQLite} $element Element.
 * @ngInject
 * @export
 */
ngeo.NgeoFoobarController = function($element) {
  $element.on('click', function() {console.log('Action');});
};    
```

Or from the link function of your directive:

```js
link:
  /**
   * @param {!angular.Scope} scope Scope.
   * @param {angular.JQLite} element Element.
   * @param {angular.Attributes} attrs Attributes.
   * @param {!Array.<!Object>} ctrls Controllers.
   */
  function(scope, element, attrs, ctrls) {
    element.on('click', function() {console.log('Action');});
};    
```


In the second case, the directive has no template and is restricted to the 
attribute declaration. It will just add custom behavior to the HTML element 
it's attached to.
Try to create directive in this perspective the more you can when you are 
in `ngeo`.

This example of the `<button>` tag could be extended to the use of `<select>` 
`<options>` `<a href="">` or any other HTML tags.

### Directive scoping

When creating a "widget" directive (i.e. directive with templates/partials) it
is usually recommended to use an *isolate* scope for the directive.

In the case of `ngeo` we want to be able to override directive templates at the
application level. And when overriding a directive's template one expects to be
able to use properties of an application-defined scope. This is not possible if
the template is processed in the context of an isolate scope.

So this is what `ngeo` "widget" directives should look like:

```js
/**
 * @return {angular.Directive} Directive Definition Object.
 */
ngeo.foobarDirective = function() {
  return {
    restrict: 'A',
    scope: true,
    templateUrl: …
    // …
  };
};
```

We still use `scope: true` so that a new, non-isolate, scope is created for the
directive. In this way the directive will write to its own scope when adding
new properties to the scope passed to `link` or to the directive's controller.

Note that even with a `scope: true` definition, a directive can take benefit
of the `bindToController` and `controllerAs` declarations.
Even with a non-isolate scope, you can bind attributes variable to the 
directive controller (as the isolate scope does). For this, you need to use
the `bindToController` as an object for mapping definitions:

```js
/**
 * @return {angular.Directive} Directive Definition Object.
 */
ngeo.foobarDirective = function() {
  return {
    restrict: 'A',
    scope: true,
    bindToController: {
     prop1: '='
    },
    controllerAs: 'myCtrl',
    templateUrl: …
    // …
  };
};
```

Here the `prop1` property of the parent scope will be bound to the `prop1` 
property of the directive controller.

## 2. Customize your code in `gmf`

### Specific templates

In `gmf`, if you are sure that all the UIs will use the exact same HTML view, 
you can add templates to your directives, even small templates that just define 
a button.

Generally, if your widget could be in `ngeo`, you have to create a new directive
with no template in `ngeo`, then to avoid to have too much HTML in the main 
`gmf` view, you can create a new directive in `gmf` on top of the `ngeo` one, that
will just define a template including the `ngeo` directive.

For example, the gmf directive `gmf-layertree` will declare a template that will
include the `ngeo-layertree` directive.

```js
/**
 * @return {angular.Directive} The directive Definition Object.
 * @ngInject
 */
gmf.layertreeDirective = function() {
  return {
    ...
    template:
        '<div ngeo-layertree="gmfLayertreeCtrl.tree" ' +
        'ngeo-layertree-map="gmfLayertreeCtrl.map" ' +
        'ngeo-layertree-nodelayer="gmfLayertreeCtrl.getLayer(node)" ' +
        'ngeo-layertree-templateurl="' + gmf.layertreeTemplateUrl + '"' +
        '<div>'
  };
```

In general, when creating a new directive in `gmf`, you must rely as much as 
possible on `ngeo` core directives. For example in the layertree, it would
make no sense to create a new directive from scratch, you must rely on `ngeo` 
layer tree. 

Taking care of this point will help you to create more generic directives 
in `ngeo`. 

### Directive scoping

In `gmf`, you are pretty sure of what template you want to bind to your directive.
Regarding this point, you are not under the constraint not to use an `isolate 
scope`.

## 3. In general

### Avoid two-way bindings when not needed

#### In templates

In angularJs, `$scope` values are mapped to HTML view through expressions.
Add `::` at the beginning of the expression to mark it as a single evaluated
expression. Once the expression is evaluated and resolved, the watchers are removed and the
expression won't be evaluated again.

See [AnguarJs doc](https://docs.angularjs.org/guide/expression#one-time-binding).
 
#### Through directive scopes

Be carefull when you use isolate scope and `bindToController` objects to pass 
variable through scope inheritance.

```js
/**
 * @return {angular.Directive} Directive Definition Object.
 */
ngeo.foobarDirective = function() {
  return {
    scope: {
      foo: '='
    }
```

A declaration like the one above with the symbol `'='` will create an isolate 
scope for the directive and
 will create a two-way data bindings between the isolate scope `foo` property 
 and the `$parent` scope property whose name is given in `foo` HTML attribute.
 
It's important to note that they don't share the same reference, but both are 
watched and updated concurrently. AngularJs adds `$watchers` each time you 
have a two-way bindings pattern in your application. As mentionned before, this
should be avoided when not needed.

Here the way to get a one time binding when using `scope` or `bindToController` 
as an object:

```js
/**
 * @return {angular.Directive} Directive Definition Object.
 */
ngeo.foobarDirective = function() {
  return {
    scope: {
      fooFn: '&'
    }
    // …
};

/**
 * @constructor
 * @param {angular.Scope} $scope The directive's scope.
 * @ngInject
 * @export
 */
ngeo.NgeoFoobarController = function($scope) {
  var foo = $scope['fooFn']();
};    

```

In this example we tell Angular to create a function `fooFn` that evaluates 
the expression in the context of the parent/user scope. There is no binding,
just an expression, and we get the `foo` variable only once.

Note:
- if you need consistency, of course use the `'='` symbol.
- if you need a one time binding to a string, use the `'&'` symbol.

## Usage of the closure-library

See [ol3 guidelines](https://github.com/openlayers/ol3/blob/master/CONTRIBUTING.md#follow-openlayers-3s-coding-style)
about the usage of `goog` in openlayers3 project. We want to follow those
guidelines in `ngeo` as well.

### Declaring an event

When you declare an event on ol3 object, please use
- the `goog.events.listen` function
- the ol3 constant to identify the event

This is wrong:

```js
this.geolocation_.on('change:accuracyGeometry', function() {
  ...
});  
```

This is the correct syntax:

```js
goog.events.listen(this.geolocation_,
  ol.Object.getChangeEventType(ol.GeolocationProperty.ACCURACY_GEOMETRY),
  function() {
  }, false, this);
```
