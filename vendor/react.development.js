/**
 * @license React
 * react.development.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (global = global || self, factory(global.React = {}));
}(this, (function (exports) { 'use strict';

var ReactVersion = '18.2.0';

// ATTENTION
// When adding new symbols to this file,
// Please consider also adding to 'react-devtools-shared/src/backend/ReactSymbols'
// The Symbol used to tag the ReactElement-like types.
var REACT_ELEMENT_TYPE = Symbol.for('react.element');
var REACT_PORTAL_TYPE = Symbol.for('react.portal');
var REACT_FRAGMENT_TYPE = Symbol.for('react.fragment');
var REACT_STRICT_MODE_TYPE = Symbol.for('react.strict_mode');
var REACT_PROFILER_TYPE = Symbol.for('react.profiler');
var REACT_PROVIDER_TYPE = Symbol.for('react.provider');
var REACT_CONTEXT_TYPE = Symbol.for('react.context');
var REACT_FORWARD_REF_TYPE = Symbol.for('react.forward_ref');
var REACT_SUSPENSE_TYPE = Symbol.for('react.suspense');
var REACT_SUSPENSE_LIST_TYPE = Symbol.for('react.suspense_list');
var REACT_MEMO_TYPE = Symbol.for('react.memo');
var REACT_LAZY_TYPE = Symbol.for('react.lazy');
var REACT_OFFSCREEN_TYPE = Symbol.for('react.offscreen');
var REACT_CACHE_TYPE = Symbol.for('react.cache');
var REACT_SERVER_CONTEXT_TYPE = Symbol.for('react.server_context');

// As of React 18, DevTools checks symbols recursively.
// This avoids needing to patch DevTools every time a new symbol is added.
var symbolFor = Symbol.for;
var REACT_ELEMENT_TYPE$1 = symbolFor('react.element');
var REACT_PORTAL_TYPE$1 = symbolFor('react.portal');
var REACT_FRAGMENT_TYPE$1 = symbolFor('react.fragment');
var REACT_STRICT_MODE_TYPE$1 = symbolFor('react.strict_mode');
var REACT_PROFILER_TYPE$1 = symbolFor('react.profiler');
var REACT_PROVIDER_TYPE$1 = symbolFor('react.provider');
var REACT_CONTEXT_TYPE$1 = symbolFor('react.context');
var REACT_FORWARD_REF_TYPE$1 = symbolFor('react.forward_ref');
var REACT_SUSPENSE_TYPE$1 = symbolFor('react.suspense');
var REACT_SUSPENSE_LIST_TYPE$1 = symbolFor('react.suspense_list');
var REACT_MEMO_TYPE$1 = symbolFor('react.memo');
var REACT_LAZY_TYPE$1 = symbolFor('react.lazy');
var REACT_OFFSCREEN_TYPE$1 = symbolFor('react.offscreen');
var REACT_CACHE_TYPE$1 = symbolFor('react.cache');
var REACT_SERVER_CONTEXT_TYPE$1 = symbolFor('react.server_context');
var MAYBE_ITERATOR_SYMBOL = Symbol.iterator;
var FAUX_ITERATOR_SYMBOL = '@@iterator';
function getIteratorFn(maybeIterable) {
  if (maybeIterable === null || typeof maybeIterable !== 'object') {
    return null;
  }

  var maybeIterator = MAYBE_ITERATOR_SYMBOL && maybeIterable[MAYBE_ITERATOR_SYMBOL] || maybeIterable[FAUX_ITERATOR_SYMBOL];

  if (typeof maybeIterator === 'function') {
    return maybeIterator;
  }

  return null;
}

var ReactCurrentDispatcher = {
  current: null
};

var ReactCurrentBatchConfig = {
  transition: null
};

var ReactCurrentOwner = {
  current: null
};

var ReactDebugCurrentFrame = {};
var currentExtraStackFrame = null;
function setExtraStackFrame(stack) {
  {
    currentExtraStackFrame = stack;
    ReactDebugCurrentFrame.setExtraStackFrame = setExtraStackFrame;
  }
}

{
  ReactDebugCurrentFrame.setExtraStackFrame = function (stack) {
    {
      currentExtraStackFrame = stack;
    }
  };

  ReactDebugCurrentFrame.getCurrentStack = null;

  ReactDebugCurrentFrame.getStackAddendum = function () {
    var stack = '';

    if (currentExtraStackFrame) {
      stack += currentExtraStackFrame;
    }

    var impl = ReactDebugCurrentFrame.getCurrentStack;

    if (impl) {
      stack += impl() || '';
    }

    return stack;
  };
}

var IsSomeRendererActing = {
  current: false
};

var ReactSharedInternals = {
  ReactCurrentDispatcher: ReactCurrentDispatcher,
  ReactCurrentBatchConfig: ReactCurrentBatchConfig,
  ReactCurrentOwner: ReactCurrentOwner,
  IsSomeRendererActing: IsSomeRendererActing,
  assign: Object.assign
};

{
  ReactSharedInternals.ReactDebugCurrentFrame = ReactDebugCurrentFrame;
}

function warn(format) {
  {
    {
      for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        args[_key - 1] = arguments[_key];
      }

      printWarning('warn', format, args);
    }
  }
}
function error(format) {
  {
    {
      for (var _len2 = arguments.length, args = new Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
        args[_key2 - 1] = arguments[_key2];
      }

      printWarning('error', format, args);
    }
  }
}

function printWarning(level, format, args) {
  {
    var ReactDebugCurrentFrame = ReactSharedInternals.ReactDebugCurrentFrame;
    var stack = ReactDebugCurrentFrame.getStackAddendum();

    if (stack !== '') {
      format += '%s';
      args = args.concat([stack]);
    }

    var argsWithFormat = args.map(function (item) {
      return String(item);
    });
    argsWithFormat.unshift('Warning: ' + format);
    Function.prototype.apply.call(console[level], console, argsWithFormat);
  }
}

var didWarnStateUpdateForUnmountedComponent = {};

function warnNoop(publicInstance, callerName) {
  {
    var _constructor = publicInstance.constructor;
    var componentName = _constructor && (_constructor.displayName || _constructor.name) || 'ReactClass';
    var warningKey = componentName + "." + callerName;

    if (didWarnStateUpdateForUnmountedComponent[warningKey]) {
      return;
    }

    error("Can't call %s on a component that is not yet mounted. " + 'This is a no-op, but it might indicate a bug in your application. ' + 'Instead, assign to `this.state` directly or define a `state = {};` ' + 'class property with the desired state in the %s component.', callerName, componentName);

    didWarnStateUpdateForUnmountedComponent[warningKey] = true;
  }
}

var ReactNoopUpdateQueue = {
  isMounted: function (publicInstance) {
    return false;
  },
  enqueueForceUpdate: function (publicInstance, callback, callerName) {
    warnNoop(publicInstance, 'forceUpdate');
  },
  enqueueReplaceState: function (publicInstance, completeState, callback, callerName) {
    warnNoop(publicInstance, 'replaceState');
  },
  enqueueSetState: function (publicInstance, partialState, callback, callerName) {
    warnNoop(publicInstance, 'setState');
  }
};

var assign = Object.assign;

var emptyObject = {};

{
  Object.freeze(emptyObject);
}

function Component(props, context, updater) {
  this.props = props;
  this.context = context;
  this.refs = emptyObject;
  this.updater = updater || ReactNoopUpdateQueue;
}

Component.prototype.isReactComponent = {};

Component.prototype.setState = function (partialState, callback) {
  if (typeof partialState !== 'object' && typeof partialState !== 'function' && partialState != null) {
    throw new Error('setState(...): takes an object of state variables to update or a ' + 'function which returns an object of state variables.');
  }

  this.updater.enqueueSetState(this, partialState, callback, 'setState');
};

Component.prototype.forceUpdate = function (callback) {
  this.updater.enqueueForceUpdate(this, callback, 'forceUpdate');
};

{
  var deprecatedAPIs = {
    isMounted: ['isMounted', 'Instead, make sure to clean up subscriptions and pending requests in ' + 'componentWillUnmount to prevent memory leaks.'],
    replaceState: ['replaceState', 'Refactor your code to use setState instead (see ' + 'https://github.com/facebook/react/issues/3236).']
  };

  var defineDeprecationWarning = function (methodName, info) {
    Object.defineProperty(Component.prototype, methodName, {
      get: function () {
        warn('%s(...) is deprecated in plain JavaScript React classes. %s', info[0], info[1]);

        return undefined;
      }
    });
  };

  for (var fnName in deprecatedAPIs) {
    if (deprecatedAPIs.hasOwnProperty(fnName)) {
      defineDeprecationWarning(fnName, deprecatedAPIs[fnName]);
    }
  }
}

function PureComponent(props, context, updater) {
  this.props = props;
  this.context = context;
  this.refs = emptyObject;
  this.updater = updater || ReactNoopUpdateQueue;
}

var pureComponentPrototype = PureComponent.prototype = new Component();
pureComponentPrototype.constructor = PureComponent;
assign(pureComponentPrototype, Component.prototype);
pureComponentPrototype.isPureReactComponent = true;

function ComponentDummy() {}

ComponentDummy.prototype = Component.prototype;

function getClassicComponentFromComposite(CompositeComponent) {
  if (CompositeComponent.prototype && CompositeComponent.prototype.isReactComponent) {
    return CompositeComponent;
  }

  return null;
}

function createRef() {
  var refObject = {
    current: null
  };

  {
    Object.seal(refObject);
  }

  return refObject;
}

var isArrayImpl = Array.isArray;

function isArray(a) {
  return isArrayImpl(a);
}

function typeName(value) {
  {
    var hasToStringTag = typeof Symbol === 'function' && Symbol.toStringTag;
    var type = hasToStringTag && value[Symbol.toStringTag] || value.constructor.name || 'Object';
    return type;
  }
}

function willCoercionThrow(value) {
  {
    try {
      testStringCoercion(value);
      return false;
    } catch (e) {
      return true;
    }
  }
}

function testStringCoercion(value) {
  return '' + value;
}

function checkKeyStringCoercion(value) {
  {
    if (willCoercionThrow(value)) {
      error('The provided key is an unsupported type %s. ' + 'This value must be coerced to a string before before using it here.', typeName(value));

      return testStringCoercion(value);
    }
  }
}

function getWrappedName(outerType, innerType, wrapperName) {
  var displayName = outerType.displayName;

  if (displayName) {
    return displayName;
  }

  var functionName = innerType.displayName || innerType.name || '';
  return functionName !== '' ? wrapperName + "(" + functionName + ")" : wrapperName;
}

function getContextName(type) {
  return type.displayName || 'Context';
}

function getComponentNameFromType(type) {
  if (type == null) {
    return null;
  }

  {
    if (typeof type.tag === 'number') {
      error('Received an unexpected object in getComponentNameFromType(). ' + 'This is likely a bug in React. Please file an issue.');
    }
  }

  if (typeof type === 'function') {
    return type.displayName || type.name || null;
  }

  if (typeof type === 'string') {
    return type;
  }

  switch (type) {
    case REACT_FRAGMENT_TYPE$1:
      return 'Fragment';

    case REACT_PORTAL_TYPE$1:
      return 'Portal';

    case REACT_PROFILER_TYPE$1:
      return 'Profiler';

    case REACT_STRICT_MODE_TYPE$1:
      return 'StrictMode';

    case REACT_SUSPENSE_TYPE$1:
      return 'Suspense';

    case REACT_SUSPENSE_LIST_TYPE$1:
      return 'SuspenseList';

    case REACT_CACHE_TYPE$1:
      return 'Cache';
  }

  if (typeof type === 'object') {
    switch (type.$$typeof) {
      case REACT_CONTEXT_TYPE$1:
        var context = type;
        return getContextName(context) + '.Consumer';

      case REACT_PROVIDER_TYPE$1:
        var provider = type;
        return getContextName(provider._context) + '.Provider';

      case REACT_FORWARD_REF_TYPE$1:
        return getWrappedName(type, type.render, 'ForwardRef');

      case REACT_MEMO_TYPE$1:
        var outerName = type.displayName || null;

        if (outerName !== null) {
          return outerName;
        }

        return getComponentNameFromType(type.type);

      case REACT_LAZY_TYPE$1:
        {
          var lazyComponent = type;
          var payload = lazyComponent._payload;
          var init = lazyComponent._init;

          try {
            return getComponentNameFromType(init(payload));
          } catch (x) {
            return null;
          }
        }
    }
  }

  return null;
}

var hasOwnProperty = Object.prototype.hasOwnProperty;

var RESERVED_PROPS = {
  key: true,
  ref: true,
  __self: true,
  __source: true
};
var specialPropKeyWarningShown, specialPropRefWarningShown, didWarnAboutStringRefs;

{
  didWarnAboutStringRefs = {};
}

function hasValidRef(config) {
  {
    if (hasOwnProperty.call(config, 'ref')) {
      var ref = config.ref;

      if (ref !== null && typeof ref !== 'function' && typeof ref !== 'object') {
        if (!specialPropRefWarningShown) {
          specialPropRefWarningShown = true;

          error('Special prop `ref` should be a function, a string, an object returned by React.createRef(), or null. ' + 'Your `%s` has a ref object that is not a React ref. Did you mean to pass a string ref instead?', getComponentNameFromType(config.type));
        }

        return false;
      }
    }
  }

  return true;
}

function hasValidKey(config) {
  {
    if (hasOwnProperty.call(config, 'key')) {
      var key = config.key;

      if (key !== undefined) {
        checkKeyStringCoercion(key);
      }
    }
  }

  return true;
}

function defineKeyPropWarningGetter(props, displayName) {
  var warnAboutAccessingKey = function () {
    if (!specialPropKeyWarningShown) {
      specialPropKeyWarningShown = true;

      error('%s: `key` is not a prop. Trying to access it will result ' + 'in `undefined` being returned. If you need to access the same ' + 'value within the child component, you should pass it as a different ' + 'prop. (https://reactjs.org/link/special-props)', displayName);
    }
  };

  warnAboutAccessingKey.isReactWarning = true;
  Object.defineProperty(props, 'key', {
    get: warnAboutAccessingKey,
    configurable: true
  });
}

function defineRefPropWarningGetter(props, displayName) {
  var warnAboutAccessingRef = function () {
    if (!specialPropRefWarningShown) {
      specialPropRefWarningShown = true;

      error('%s: `ref` is not a prop. Trying to access it will result ' + 'in `undefined` being returned. If you need to access the same ' + 'value within the child component, you should pass it as a different ' + 'prop. (https://reactjs.org/link/special-props)', displayName);
    }
  };

  warnAboutAccessingRef.isReactWarning = true;
  Object.defineProperty(props, 'ref', {
    get: warnAboutAccessingRef,
    configurable: true
  });
}

function warnIfStringRefCannotBeAutoConverted(config) {
  {
    if (typeof config.ref === 'string' && ReactCurrentOwner.current && config.__self && ReactCurrentOwner.current.stateNode !== config.__self) {
      var componentName = getComponentNameFromType(config.type);

      if (!didWarnAboutStringRefs[componentName]) {
        error('Component "%s" contains the string ref "%s". ' + 'Support for string refs will be removed in a future major release. ' + 'This case cannot be automatically converted to an arrow function. ' + 'We ask you to manually fix this case by using useRef() or createRef() instead. ' + 'Learn more about using refs safely here: ' + 'https://reactjs.org/link/strict-mode-string-ref', componentName, config.ref);

        didWarnAboutStringRefs[componentName] = true;
      }
    }
  }
}

var ReactElement = function (type, key, ref, self, source, owner, props) {
  var element = {
    $$typeof: REACT_ELEMENT_TYPE$1,
    type: type,
    key: key,
    ref: ref,
    props: props,
    _owner: owner
  };

  {
    element._store = {};
    Object.defineProperty(element._store, 'validated', {
      configurable: false,
      enumerable: false,
      writable: true,
      value: false
    });
    Object.defineProperty(element, '_self', {
      configurable: false,
      enumerable: false,
      writable: false,
      value: self
    });
    Object.defineProperty(element, '_source', {
      configurable: false,
      enumerable: false,
      writable: false,
      value: source
    });

    if (Object.freeze) {
      Object.freeze(element.props);
      Object.freeze(element);
    }
  }

  return element;
};

function createElement(type, config, children) {
  var propName;
  var props = {};
  var key = null;
  var ref = null;
  var self = null;
  var source = null;

  if (config != null) {
    if (hasValidRef(config)) {
      ref = config.ref;

      {
        warnIfStringRefCannotBeAutoConverted(config);
      }
    }

    if (hasValidKey(config)) {
      {
        key = '' + config.key;
      }
    }

    self = config.__self === undefined ? null : config.__self;
    source = config.__source === undefined ? null : config.__source;

    for (propName in config) {
      if (hasOwnProperty.call(config, propName) && !RESERVED_PROPS.hasOwnProperty(propName)) {
        props[propName] = config[propName];
      }
    }
  }

  var childrenLength = arguments.length - 2;

  if (childrenLength === 1) {
    props.children = children;
  } else if (childrenLength > 1) {
    var childArray = Array(childrenLength);

    for (var i = 0; i < childrenLength; i++) {
      childArray[i] = arguments[i + 2];
    }

    {
      if (Object.freeze) {
        Object.freeze(childArray);
      }
    }

    props.children = childArray;
  }

  if (type && type.defaultProps) {
    var defaultProps = type.defaultProps;

    for (propName in defaultProps) {
      if (props[propName] === undefined) {
        props[propName] = defaultProps[propName];
      }
    }
  }

  {
    if (key || ref) {
      var displayName = typeof type === 'function' ? type.displayName || type.name || 'Unknown' : type;

      if (key) {
        defineKeyPropWarningGetter(props, displayName);
      }

      if (ref) {
        defineRefPropWarningGetter(props, displayName);
      }
    }
  }

  return ReactElement(type, key, ref, self, source, ReactCurrentOwner.current, props);
}

function cloneAndReplaceKey(oldElement, newKey) {
  var newElement = ReactElement(oldElement.type, newKey, oldElement.ref, oldElement._self, oldElement._source, oldElement._owner, oldElement.props);
  return newElement;
}

function createFactory(type) {
  var factory = createElement.bind(null, type);
  factory.type = type;
  return factory;
}

function cloneElement(element, config, children) {
  if (element === null || element === undefined) {
    throw new Error("React.cloneElement(...): The argument must be a React element, but you passed " + element + ".");
  }

  var propName;
  var props = assign({}, element.props);
  var key = element.key;
  var ref = element.ref;
  var self = element._self;
  var source = element._source;
  var owner = element._owner;

  if (config != null) {
    if (hasValidRef(config)) {
      ref = config.ref;
      owner = ReactCurrentOwner.current;
    }

    if (hasValidKey(config)) {
      {
        key = '' + config.key;
      }
    }

    var defaultProps;

    if (element.type && element.type.defaultProps) {
      defaultProps = element.type.defaultProps;
    }

    for (propName in config) {
      if (hasOwnProperty.call(config, propName) && !RESERVED_PROPS.hasOwnProperty(propName)) {
        if (config[propName] === undefined && defaultProps !== undefined) {
          props[propName] = defaultProps[propName];
        } else {
          props[propName] = config[propName];
        }
      }
    }
  }

  var childrenLength = arguments.length - 2;

  if (childrenLength === 1) {
    props.children = children;
  } else if (childrenLength > 1) {
    var childArray = Array(childrenLength);

    for (var i = 0; i < childrenLength; i++) {
      childArray[i] = arguments[i + 2];
    }

    props.children = childArray;
  }

  return ReactElement(element.type, key, ref, self, source, owner, props);
}

function isValidElement(object) {
  return typeof object === 'object' && object !== null && object.$$typeof === REACT_ELEMENT_TYPE$1;
}

var SEPARATOR = '.';
var SUBSEPARATOR = ':';

function escape(key) {
  var escapeRegex = /[=:]/g;
  var escaperLookup = {
    '=': '=0',
    ':': '=2'
  };
  var escapedString = key.replace(escapeRegex, function (match) {
    return escaperLookup[match];
  });
  return '$' + escapedString;
}

var didWarnAboutMaps = false;
var userProvidedKeyEscapeRegex = /\/+/g;

function escapeUserProvidedKey(text) {
  return text.replace(userProvidedKeyEscapeRegex, '$&/');
}

function getElementKey(element, index) {
  if (typeof element === 'object' && element !== null && element.key != null) {
    {
      checkKeyStringCoercion(element.key);
    }

    return escape('' + element.key);
  }

  return index.toString(36);
}

function mapIntoArray(children, array, escapedPrefix, nameSoFar, callback) {
  var type = typeof children;

  if (type === 'undefined' || type === 'boolean') {
    children = null;
  }

  var invokeCallback = false;

  if (children === null) {
    invokeCallback = true;
  } else {
    switch (type) {
      case 'string':
      case 'number':
        invokeCallback = true;
        break;

      case 'object':
        switch (children.$$typeof) {
          case REACT_ELEMENT_TYPE$1:
          case REACT_PORTAL_TYPE$1:
            invokeCallback = true;
        }

    }
  }

  if (invokeCallback) {
    var _child = children;
    var mappedChild = callback(_child);
    var childKey = nameSoFar === '' ? SEPARATOR + getElementKey(_child, 0) : nameSoFar;

    if (isArray(mappedChild)) {
      var escapedChildKey = '';

      if (childKey != null) {
        escapedChildKey = escapeUserProvidedKey(childKey) + '/';
      }

      mapIntoArray(mappedChild, array, escapedChildKey, '', function (c) {
        return c;
      });
    } else if (mappedChild != null) {
      if (isValidElement(mappedChild)) {
        {
          if (mappedChild.key && (!_child || _child.key !== mappedChild.key)) {
            checkKeyStringCoercion(mappedChild.key);
          }
        }

        mappedChild = cloneAndReplaceKey(mappedChild, escapedPrefix + (mappedChild.key && (!_child || _child.key !== mappedChild.key) ? escapeUserProvidedKey('' + mappedChild.key) + '/' : '') + childKey);
      }

      array.push(mappedChild);
    }

    return 1;
  }

  var child;
  var nextName;
  var subtreeCount = 0;
  var nextNamePrefix = nameSoFar === '' ? SEPARATOR : nameSoFar + SUBSEPARATOR;

  if (isArray(children)) {
    for (var i = 0; i < children.length; i++) {
      child = children[i];
      nextName = nextNamePrefix + getElementKey(child, i);
      subtreeCount += mapIntoArray(child, array, escapedPrefix, nextName, callback);
    }
  } else {
    var iteratorFn = getIteratorFn(children);

    if (typeof iteratorFn === 'function') {
      var iterableChildren = children;

      {
        if (iteratorFn === iterableChildren.entries) {
          if (!didWarnAboutMaps) {
            warn('Using Maps as children is not supported. ' + 'Use an array of keyed ReactElements instead.');
          }

          didWarnAboutMaps = true;
        }
      }

      var iterator = iteratorFn.call(iterableChildren);
      var step;
      var ii = 0;

      while (!(step = iterator.next()).done) {
        child = step.value;
        nextName = nextNamePrefix + getElementKey(child, ii++);
        subtreeCount += mapIntoArray(child, array, escapedPrefix, nextName, callback);
      }
    } else if (type === 'object') {
      var newChildren = String(children);
      throw new Error("Objects are not valid as a React child (found: " + (newChildren === '[object Object]' ? 'object with keys {' + Object.keys(children).join(', ') + '}' : newChildren) + "). " + 'If you meant to render a collection of children, use an array ' + 'instead.');
    }
  }

  return subtreeCount;
}

function mapChildren(children, func, context) {
  if (children == null) {
    return children;
  }

  var result = [];
  var count = 0;
  mapIntoArray(children, result, '', '', function (child) {
    return func.call(context, child, count++);
  });
  return result;
}

function countChildren(children) {
  var n = 0;
  mapChildren(children, function () {
    n++;
  });
  return n;
}

function forEachChildren(children, forEachFunc, forEachContext) {
  mapChildren(children, function () {
    forEachFunc.apply(this, arguments);
  }, forEachContext);
}

function toArray(children) {
  return mapChildren(children, function (child) {
    return child;
  }) || [];
}

function onlyChild(children) {
  if (!isValidElement(children)) {
    throw new Error('React.Children.only expected to receive a single React element child.');
  }

  return children;
}

function createContext(defaultValue) {
  var context = {
    $$typeof: REACT_CONTEXT_TYPE$1,
    _currentValue: defaultValue,
    _currentValue2: defaultValue,
    _threadCount: 0,
    Provider: null,
    Consumer: null,
    _defaultValue: null,
    _globalName: null
  };
  context.Provider = {
    $$typeof: REACT_PROVIDER_TYPE$1,
    _context: context
  };
  var consumer = {
    $$typeof: REACT_CONTEXT_TYPE$1,
    _context: context
  };

  {
    consumer.Consumer = consumer;
  }

  context.Consumer = consumer;

  {
    context._currentRenderer = null;
    context._currentRenderer2 = null;
  }

  return context;
}

var Uninitialized = -1;
var Pending = 0;
var Resolved = 1;
var Rejected = 2;

function lazyInitializer(payload) {
  if (payload._status === Uninitialized) {
    var ctor = payload._result;
    var thenable = ctor();
    thenable.then(function (moduleObject) {
      if (payload._status === Pending || payload._status === Uninitialized) {
        var resolved = payload;
        resolved._status = Resolved;
        resolved._result = moduleObject;
      }
    }, function (error) {
      if (payload._status === Pending || payload._status === Uninitialized) {
        var rejected = payload;
        rejected._status = Rejected;
        rejected._result = error;
      }
    });

    if (payload._status === Uninitialized) {
      var pending = payload;
      pending._status = Pending;
      pending._result = thenable;
    }
  }

  if (payload._status === Resolved) {
    var moduleObject = payload._result;

    {
      if (moduleObject === undefined) {
        error('lazy: Expected the result of a dynamic import() call. ' + 'Instead received: %s\n\nYour code should look like: \n' + "  const MyComponent = lazy(() => import('./MyComponent'))", moduleObject);
      }
    }

    if (moduleObject === undefined) {
      throw new Error('lazy: Expected the result of a dynamic import() call. ' + 'Instead received: ' + moduleObject);
    }

    return moduleObject.default;
  } else {
    throw payload._result;
  }
}

function lazy(ctor) {
  var payload = {
    _status: Uninitialized,
    _result: ctor
  };
  var lazyType = {
    $$typeof: REACT_LAZY_TYPE$1,
    _payload: payload,
    _init: lazyInitializer
  };

  {
    var defaultProps;
    var propTypes;
    Object.defineProperties(lazyType, {
      defaultProps: {
        configurable: true,
        get: function () {
          return defaultProps;
        },
        set: function (newDefaultProps) {
          error('React.lazy(...): It is not supported to assign `defaultProps` to ' + 'a lazy component import. Either specify them where the component ' + 'is defined, or create a wrapping component around it.');

          defaultProps = newDefaultProps;
          Object.defineProperty(lazyType, 'defaultProps', {
            enumerable: true
          });
        }
      },
      propTypes: {
        configurable: true,
        get: function () {
          return propTypes;
        },
        set: function (newPropTypes) {
          error('React.lazy(...): It is not supported to assign `propTypes` to ' + 'a lazy component import. Either specify them where the component ' + 'is defined, or create a wrapping component around it.');

          propTypes = newPropTypes;
          Object.defineProperty(lazyType, 'propTypes', {
            enumerable: true
          });
        }
      }
    });
  }

  return lazyType;
}

function forwardRef(render) {
  {
    if (typeof render !== 'function') {
      error('forwardRef requires a render function but was given %s.', render === null ? 'null' : typeof render);
    } else {
      if (render.length !== 0 && render.length !== 2) {
        error('forwardRef render functions accept either zero or two ' + 'arguments: props and ref. %s', render.length === 1 ? 'Did you forget to use the ref parameter?' : 'Any additional arguments will be ignored.');
      }
    }

    if (render != null) {
      if (render.defaultProps != null || render.propTypes != null) {
        error('forwardRef render functions do not support propTypes or ' + 'defaultProps. Did you accidentally pass a React component?');
      }
    }
  }

  var forwarded = {
    $$typeof: REACT_FORWARD_REF_TYPE$1,
    render: render
  };

  {
    var 'displayName';
    Object.defineProperty(forwarded, 'displayName', {
      enumerable: true,
      configurable: true,
      get: function () {
        return displayName;
      },
      set: function (value) {
        displayName = value;

        if (render.displayName == null) {
          render.displayName = value;
        }
      }
    });
  }

  return forwarded;
}

function isValidElementType(type) {
  if (typeof type === 'string' || typeof type === 'function') {
    return true;
  }

  if (type !== null && typeof type === 'object') {
    if (type.$$typeof === REACT_LAZY_TYPE$1) {
      return true;
    }

    var $$typeof = type.$$typeof;

    if ($$typeof === REACT_FORWARD_REF_TYPE$1 || $$typeof === REACT_MEMO_TYPE$1 || $$typeof === REACT_PROVIDER_TYPE$1 || $$typeof === REACT_CONTEXT_TYPE$1 || $$typeof === REACT_PROFILER_TYPE$1 || $$typeof === REACT_STRICT_MODE_TYPE$1 || $$typeof === REACT_SUSPENSE_TYPE$1 || $$typeof === REACT_SUSPENSE_LIST_TYPE$1 || $$typeof === REACT_OFFSCREEN_TYPE$1) {
      return true;
    }

    if (type.$$typeof === REACT_LAZY_TYPE$1) {
      return true;
    }
  }

  return false;
}

function memo(type, compare) {
  {
    if (!isValidElementType(type)) {
      error('memo: The first argument must be a component. Instead ' + 'received: %s', type === null ? 'null' : typeof type);
    }
  }

  var memoizedType = {
    $$typeof: REACT_MEMO_TYPE$1,
    type: type,
    compare: compare === undefined ? null : compare
  };

  {
    var displayName;
    Object.defineProperty(memoizedType, 'displayName', {
      enumerable: true,
      configurable: true,
      get: function () {
        return displayName;
      },
      set: function (value) {
        displayName = value;

        if (type.displayName == null) {
          type.displayName = value;
        }
      }
    });
  }

  return memoizedType;
}

function useTransition() {
  var dispatcher = ReactCurrentDispatcher.current;
  return dispatcher.useTransition();
}

function startTransition(scope, options) {
  var prevTransition = ReactCurrentBatchConfig.transition;
  ReactCurrentBatchConfig.transition = {};
  var currentTransition = ReactCurrentBatchConfig.transition;

  {
    ReactCurrentBatchConfig.transition.name = scope.name;
    ReactCurrentBatchConfig.transition.startTime = -1;
  }

  try {
    var returnValue = scope();
    return returnValue;
  } finally {
    ReactCurrentBatchConfig.transition = prevTransition;
  }
}

function useDeferredValue(value) {
  var dispatcher = ReactCurrentDispatcher.current;
  return dispatcher.useDeferredValue(value);
}

function useId() {
  var dispatcher = ReactCurrentDispatcher.current;
  return dispatcher.useId();
}

function useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot) {
  var dispatcher = ReactCurrentDispatcher.current;
  return dispatcher.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

function useCacheRefresh() {
  var dispatcher = ReactCurrentDispatcher.current;
  return dispatcher.useCacheRefresh();
}

function use(promise) {
  var dispatcher = ReactCurrentDispatcher.current;
  return dispatcher.use(promise);
}

function useOptimistic(passthrough, reducer) {
  var dispatcher = ReactCurrentDispatcher.current;
  return dispatcher.useOptimistic(passthrough, reducer);
}

function act(callback) {
  var actingUpdatesScope = ReactSharedInternals.IsSomeRendererActing;
  var previousActingUpdatesScope = actingUpdatesScope.current;
  actingUpdatesScope.current = true;

  try {
    return callback();
  } finally {
    actingUpdatesScope.current = previousActingUpdatesScope;
  }
}

function useCallback(callback, deps) {
  var dispatcher = ReactCurrentDispatcher.current;
  return dispatcher.useCallback(callback, deps);
}

function useContext(Context) {
  var dispatcher = ReactCurrentDispatcher.current;

  {
    if (Context._context !== undefined) {
      var realContext = Context._context;

      if (realContext.Consumer === Context) {
        error('You are wrapping a Context.Consumer inside a ' + 'Context.Provider. This is not supported and will cause ' + 'unexpected behavior because Context.Consumer is not a ' + 'renderable component. Did you mean to pass a child to the ' + 'Context.Provider?');
      } else if (realContext.Provider === Context) {
        error('You are trying to render a Context.Provider ' + 'without a value, which is not supported. You passed ' + 'undefined to the value prop. Did you forget to pass a ' + 'value?');
      }
    }
  }

  return dispatcher.useContext(Context);
}

function useDebugValue(value, formatterFn) {
  var dispatcher = ReactCurrentDispatcher.current;
  return dispatcher.useDebugValue(value, formatterFn);
}

function useEffect(create, deps) {
  var dispatcher = ReactCurrentDispatcher.current;
  return dispatcher.useEffect(create, deps);
}

function useImperativeHandle(ref, create, deps) {
  var dispatcher = ReactCurrentDispatcher.current;
  return dispatcher.useImperativeHandle(ref, create, deps);
}

function useInsertionEffect(create, deps) {
  var dispatcher = ReactCurrentDispatcher.current;
  return dispatcher.useInsertionEffect(create, deps);
}

function useLayoutEffect(create, deps) {
  var dispatcher = ReactCurrentDispatcher.current;
  return dispatcher.useLayoutEffect(create, deps);
}

function useMemo(create, deps) {
  var dispatcher = ReactCurrentDispatcher.current;
  return dispatcher.useMemo(create, deps);
}

function useReducer(reducer, initialArg, init) {
  var dispatcher = ReactCurrentDispatcher.current;
  return dispatcher.useReducer(reducer, initialArg, init);
}

function useRef(initialValue) {
  var dispatcher = ReactCurrentDispatcher.current;
  return dispatcher.useRef(initialValue);
}

function useState(initialState) {
  var dispatcher = ReactCurrentDispatcher.current;
  return dispatcher.useState(initialState);
}

var Children = {
  map: mapChildren,
  forEach: forEachChildren,
  count: countChildren,
  toArray: toArray,
  only: onlyChild
};

exports.Children = Children;
exports.Component = Component;
exports.Fragment = REACT_FRAGMENT_TYPE$1;
exports.Profiler = REACT_PROFILER_TYPE$1;
exports.PureComponent = PureComponent;
exports.StrictMode = REACT_STRICT_MODE_TYPE$1;
exports.Suspense = REACT_SUSPENSE_TYPE$1;
exports.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = ReactSharedInternals;
exports.cloneElement = cloneElement;
exports.createContext = createContext;
exports.createElement = createElement;
exports.createFactory = createFactory;
exports.createRef = createRef;
exports.forwardRef = forwardRef;
exports.isValidElement = isValidElement;
exports.lazy = lazy;
exports.memo = memo;
exports.startTransition = startTransition;
exports.unstable_act = act;
exports.unstable_useCacheRefresh = useCacheRefresh;
exports.unstable_useOptimistic = useOptimistic;
exports.use = use;
exports.useCallback = useCallback;
exports.useContext = useContext;
exports.useDebugValue = useDebugValue;
exports.useDeferredValue = useDeferredValue;
exports.useEffect = useEffect;
exports.useId = useId;
exports.useImperativeHandle = useImperativeHandle;
exports.useInsertionEffect = useInsertionEffect;
exports.useLayoutEffect = useLayoutEffect;
exports.useMemo = useMemo;
exports.useReducer = useReducer;
exports.useRef = useRef;
exports.useState = useState;
exports.useSyncExternalStore = useSyncExternalStore;
exports.useTransition = useTransition;
exports.version = ReactVersion;

})));
