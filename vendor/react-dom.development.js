/**
 * @license React
 * react-dom.development.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
(function (global, factory) {
  // Force browser path
  factory(global.ReactDOM = {}, global.React);
}(this, (function (exports, React) { 'use strict';

var ReactVersion = '18.2.0';

var ReactSharedInternals = React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;

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

var FunctionComponent = 0;
var ClassComponent = 1;
var IndeterminateComponent = 2;
var HostRoot = 3;
var HostPortal = 4;
var HostComponent = 5;
var HostText = 6;
var Fragment = 7;
var Mode = 8;
var ContextConsumer = 9;
var ContextProvider = 10;
var ForwardRef = 11;
var Profiler = 12;
var SuspenseComponent = 13;
var MemoComponent = 14;
var SimpleMemoComponent = 15;
var LazyComponent = 16;
var IncompleteClassComponent = 17;
var DehydratedFragment = 18;
var SuspenseListComponent = 19;
var ScopeComponent = 21;
var OffscreenComponent = 22;
var LegacyHiddenComponent = 23;
var CacheComponent = 24;
var TracingMarkerComponent = 25;
var HostHoistable = 26;
var HostSingleton = 27;

var enableClientRenderFallbackOnTextMismatch = true;
var enableFormActions = true;
var enableAsyncActions = true;
var enableScope = true;
var enableSuspenseCallback = true;
var enableLegacyHidden = true;
var enableDebugTracing = true;

var ReactCurrentDispatcher = ReactSharedInternals.ReactCurrentDispatcher,
    ReactCurrentOwner = ReactSharedInternals.ReactCurrentOwner,
    ReactCurrentBatchConfig = ReactSharedInternals.ReactCurrentBatchConfig,
    IsSomeRendererActing = ReactSharedInternals.IsSomeRendererActing;
var getComponentNameFromFiber = React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.getComponentNameFromFiber;

var assign = Object.assign;

var actScopeDepth = 0;
var didWarnAboutUsingActInProd = false;
function act(callback) {
  {
    if (!didWarnAboutUsingActInProd) {
      didWarnAboutUsingActInProd = true;
      error('act(...) is not supported in production builds of React, and might not behave as expected.');
    }
  }

  var prevActScopeDepth = actScopeDepth;
  actScopeDepth++;

  try {
    return callback();
  } finally {
    actScopeDepth--;
  }
}

var isModernBrowser = typeof document !== 'undefined' && typeof document.createElement === 'function';

var TEXT_NODE = 3;

function getElementNamespace(type, parentNamespace) {
  if (parentNamespace == null || parentNamespace === 'http://www.w3.org/1999/xhtml') {
    if (type === 'svg') {
      return 'http://www.w3.org/2000/svg';
    }

    if (type === 'math') {
      return 'http://www.w3.org/1998/Math/MathML';
    }
  }

  return parentNamespace;
}

function createElement(namespace, type, props, ownerDocument) {
  var domElement = ownerDocument.createElementNS(namespace, type);

  if (namespace === 'http://www.w3.org/2000/svg' && 'className' in props) {
    domElement.setAttribute('class', props.className);
  }

  return domElement;
}

function createTextNode(text, ownerDocument) {
  return ownerDocument.createTextNode(text);
}

function isAttributeNameSafe(attributeName) {
  if (/[><"']/.test(attributeName)) {
    error('Invalid attribute name: `%s`', attributeName);

    return false;
  }

  return true;
}

function getPropertyInfo(name) {
  return properties.hasOwnProperty(name) ? properties[name] : null;
}

function shouldIgnoreAttribute(name, propertyInfo, isCustomComponentTag) {
  if (propertyInfo !== null) {
    return propertyInfo.type === 0;
  }

  if (isCustomComponentTag) {
    return false;
  }

  if (name.length > 2 && (name[0] === 'o' || name[0] === 'O') && (name[1] === 'n' || name[1] === 'N')) {
    return true;
  }

  return false;
}

function shouldRemoveAttribute(name, value, propertyInfo, isCustomComponentTag) {
  if (value === null || typeof value === 'undefined') {
    return true;
  }

  if (propertyInfo !== null) {
    switch (propertyInfo.type) {
      case 3:
        return !value;

      case 4:
        return value === false;

      case 5:
        return isNaN(value);

      case 6:
        return isNaN(value) || value < 1;
    }
  }

  return false;
}

var properties = {};
var RESERVED = 0;
var STRING = 1;
var BOOLEANISH_STRING = 2;
var BOOLEAN = 3;
var OVERLOADED_BOOLEAN = 4;
var NUMERIC = 5;
var POSITIVE_NUMERIC = 6;
var ATTRIBUTE_NAME_START_CHAR = ':A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD';
var ATTRIBUTE_NAME_CHAR = ATTRIBUTE_NAME_START_CHAR + '\\-.0-9\\u00B7\\u0300-\\u036F\\u203F-\\u2040';
var VALID_ATTRIBUTE_NAME_REGEX = new RegExp('^[' + ATTRIBUTE_NAME_START_CHAR + '][' + ATTRIBUTE_NAME_CHAR + ']*$');
var illegalAttributeNameCache = {};
var validatedAttributeNameCache = {};
function isAttributeNameSafe$1(attributeName) {
  if (validatedAttributeNameCache.hasOwnProperty(attributeName)) {
    return true;
  }

  if (illegalAttributeNameCache.hasOwnProperty(attributeName)) {
    return false;
  }

  if (VALID_ATTRIBUTE_NAME_REGEX.test(attributeName)) {
    validatedAttributeNameCache[attributeName] = true;
    return true;
  }

  illegalAttributeNameCache[attributeName] = true;

  {
    error('Invalid attribute name: `%s`', attributeName);
  }

  return false;
}
function getPropertyInfo$1(name) {
  return properties$1.hasOwnProperty(name) ? properties$1[name] : null;
}
function shouldIgnoreAttribute$1(name, propertyInfo, isCustomComponentTag) {
  if (propertyInfo !== null) {
    return propertyInfo.type === RESERVED;
  }

  if (isCustomComponentTag) {
    return false;
  }

  if (name.length > 2 && (name[0] === 'o' || name[0] === 'O') && (name[1] === 'n' || name[1] === 'N')) {
    return true;
  }

  return false;
}
function shouldRemoveAttribute$1(name, value, propertyInfo, isCustomComponentTag) {
  if (value === null || typeof value === 'undefined') {
    return true;
  }

  if (propertyInfo !== null) {
    switch (propertyInfo.type) {
      case BOOLEAN:
        return !value;

      case OVERLOADED_BOOLEAN:
        return value === false;

      case NUMERIC:
        return isNaN(value);

      case POSITIVE_NUMERIC:
        return isNaN(value) || value < 1;
    }
  }

  return false;
}
var properties$1 = {};
var reservedProps = ['children', 'dangerouslySetInnerHTML', 'defaultValue', 'defaultChecked', 'innerHTML', 'suppressContentEditableWarning', 'suppressHydrationWarning', 'style'];
reservedProps.forEach(function (name) {
  properties$1[name] = new PropertyInfoRecord(name, RESERVED, false, name, null, false, false);
});
[['acceptCharset', 'accept-charset'], ['className', 'class'], ['htmlFor', 'for'], ['httpEquiv', 'http-equiv']].forEach(function (_ref) {
  var name = _ref[0],
      attributeName = _ref[1];
  properties$1[name] = new PropertyInfoRecord(name, STRING, false, attributeName, null, false, false);
});
['contentEditable', 'draggable', 'spellCheck', 'value'].forEach(function (name) {
  properties$1[name] = new PropertyInfoRecord(name, BOOLEANISH_STRING, false, name.toLowerCase(), null, false, false);
});
['autoReverse', 'externalResourcesRequired', 'focusable', 'preserveAlpha'].forEach(function (name) {
  properties$1[name] = new PropertyInfoRecord(name, BOOLEANISH_STRING, false, name, null, false, false);
});
['allowFullScreen', 'async', 'autoFocus', 'autoPlay', 'controls', 'default', 'defer', 'disabled', 'disablePictureInPicture', 'disableRemotePlayback', 'formNoValidate', 'hidden', 'loop', 'noModule', 'noValidate', 'open', 'playsInline', 'readOnly', 'required', 'reversed', 'scoped', 'seamless', 'itemScope'].forEach(function (name) {
  properties$1[name] = new PropertyInfoRecord(name, BOOLEAN, false, name.toLowerCase(), null, false, false);
});
['checked', 'multiple', 'muted', 'selected'].forEach(function (name) {
  properties$1[name] = new PropertyInfoRecord(name, BOOLEAN, true, name, null, false, false);
});
['capture', 'download'].forEach(function (name) {
  properties$1[name] = new PropertyInfoRecord(name, OVERLOADED_BOOLEAN, false, name, null, false, false);
});
['cols', 'rows', 'size', 'span'].forEach(function (name) {
  properties$1[name] = new PropertyInfoRecord(name, POSITIVE_NUMERIC, false, name, null, false, false);
});
['rowSpan', 'start'].forEach(function (name) {
  properties$1[name] = new PropertyInfoRecord(name, NUMERIC, false, name.toLowerCase(), null, false, false);
});
var CAMELIZE = /[\-\:]([a-z])/g;

var camelize = function (string) {
  return string.replace(CAMELIZE, function (g) {
    return g[1].toUpperCase();
  });
};

var capitalize = function (string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
};

var HYPHENATE = /([A-Z])/g;

var hyphenate = function (string) {
  return string.replace(HYPHENATE, '-$1').toLowerCase();
};

function getAttributeAlias(name) {
  return properties$1.hasOwnProperty(name) ? properties$1[name].attributeName : name;
}
function PropertyInfoRecord(name, type, mustUseProperty, attributeName, attributeNamespace, sanitizeURL, removeEmptyString) {
  this.acceptsBooleans = type === BOOLEANISH_STRING || type === BOOLEAN || type === OVERLOADED_BOOLEAN;
  this.attributeName = attributeName;
  this.attributeNamespace = attributeNamespace;
  this.mustUseProperty = mustUseProperty;
  this.propertyName = name;
  this.type = type;
  this.sanitizeURL = sanitizeURL;
  this.removeEmptyString = removeEmptyString;
}

var isCustomElement = function (tagName, props) {
  return tagName.indexOf('-') >= 0 || props.is != null;
};

var possibleStandardNames = {
  accept: 'accept',
  acceptcharset: 'acceptCharset',
  'accept-charset': 'acceptCharset',
  accesskey: 'accessKey',
  action: 'action',
  allowfullscreen: 'allowFullScreen',
  alt: 'alt',
  as: 'as',
  async: 'async',
  autocapitalize: 'autoCapitalize',
  autocomplete: 'autoComplete',
  autocorrect: 'autoCorrect',
  autofocus: 'autoFocus',
  autoplay: 'autoPlay',
  autosave: 'autoSave',
  capture: 'capture',
  cellpadding: 'cellPadding',
  cellspacing: 'cellSpacing',
  challenge: 'challenge',
  charset: 'charSet',
  checked: 'checked',
  children: 'children',
  cite: 'cite',
  class: 'className',
  classid: 'classID',
  classname: 'className',
  cols: 'cols',
  colspan: 'colSpan',
  content: 'content',
  contenteditable: 'contentEditable',
  contextmenu: 'contextMenu',
  controls: 'controls',
  controlslist: 'controlsList',
  coords: 'coords',
  crossorigin: 'crossOrigin',
  dangerouslysetinnerhtml: 'dangerouslySetInnerHTML',
  data: 'data',
  datetime: 'dateTime',
  default: 'default',
  defaultchecked: 'defaultChecked',
  defaultvalue: 'defaultValue',
  defer: 'defer',
  dir: 'dir',
  disabled: 'disabled',
  disablepictureinpicture: 'disablePictureInPicture',
  disableremoteplayback: 'disableRemotePlayback',
  download: 'download',
  draggable: 'draggable',
  enctype: 'encType',
  enterkeyhint: 'enterKeyHint',
  for: 'htmlFor',
  form: 'form',
  formaction: 'formAction',
  formenctype: 'formEncType',
  formmethod: 'formMethod',
  formnovalidate: 'formNoValidate',
  formtarget: 'formTarget',
  frameborder: 'frameBorder',
  headers: 'headers',
  height: 'height',
  hidden: 'hidden',
  high: 'high',
  href: 'href',
  hreflang: 'hrefLang',
  htmlfor: 'htmlFor',
  httpequiv: 'httpEquiv',
  'http-equiv': 'httpEquiv',
  icon: 'icon',
  id: 'id',
  imagesizes: 'imageSizes',
  imagesrcset: 'imageSrcSet',
  innerhtml: 'innerHTML',
  inputmode: 'inputMode',
  integrity: 'integrity',
  is: 'is',
  itemid: 'itemID',
  itemprop: 'itemProp',
  itemref: 'itemRef',
  itemscope: 'itemScope',
  itemtype: 'itemType',
  keyparams: 'keyParams',
  keytype: 'keyType',
  kind: 'kind',
  label: 'label',
  lang: 'lang',
  list: 'list',
  loop: 'loop',
  low: 'low',
  manifest: 'manifest',
  marginheight: 'marginHeight',
  marginwidth: 'marginWidth',
  max: 'max',
  maxlength: 'maxLength',
  media: 'media',
  mediagroup: 'mediaGroup',
  method: 'method',
  min: 'min',
  minlength: 'minLength',
  multiple: 'multiple',
  muted: 'muted',
  name: 'name',
  nomodule: 'noModule',
  nonce: 'nonce',
  novalidate: 'noValidate',
  open: 'open',
  optimum: 'optimum',
  pattern: 'pattern',
  placeholder: 'placeholder',
  playsinline: 'playsInline',
  poster: 'poster',
  preload: 'preload',
  profile: 'profile',
  radiogroup: 'radioGroup',
  readonly: 'readOnly',
  referrerpolicy: 'referrerPolicy',
  rel: 'rel',
  required: 'required',
  reversed: 'reversed',
  role: 'role',
  rows: 'rows',
  rowspan: 'rowSpan',
  sandbox: 'sandbox',
  scope: 'scope',
  scoped: 'scoped',
  scrolling: 'scrolling',
  seamless: 'seamless',
  selected: 'selected',
  shape: 'shape',
  size: 'size',
  sizes: 'sizes',
  span: 'span',
  spellcheck: 'spellCheck',
  src: 'src',
  srcdoc: 'srcDoc',
  srclang: 'srcLang',
  srcset: 'srcSet',
  start: 'start',
  step: 'step',
  style: 'style',
  summary: 'summary',
  tabindex: 'tabIndex',
  target: 'target',
  title: 'title',
  translate: 'translate',
  type: 'type',
  usemap: 'useMap',
  value: 'value',
  width: 'width',
  wmode: 'wmode',
  wrap: 'wrap',
  about: 'about',
  accentheight: 'accentHeight',
  'accent-height': 'accentHeight',
  accumulate: 'accumulate',
  additive: 'additive',
  alignmentbaseline: 'alignmentBaseline',
  'alignment-baseline': 'alignmentBaseline',
  allowreorder: 'allowReorder',
  alphabetic: 'alphabetic',
  amplitude: 'amplitude',
  arabicform: 'arabicForm',
  'arabic-form': 'arabicForm',
  ascent: 'ascent',
  attributename: 'attributeName',
  attributetype: 'attributeType',
  autoreverse: 'autoReverse',
  azimuth: 'azimuth',
  basefrequency: 'baseFrequency',
  baselineshift: 'baselineShift',
  'baseline-shift': 'baselineShift',
  baseprofile: 'baseProfile',
  bbox: 'bbox',
  begin: 'begin',
  bias: 'bias',
  by: 'by',
  calcmode: 'calcMode',
  capheight: 'capHeight',
  'cap-height': 'capHeight',
  clip: 'clip',
  clippath: 'clipPath',
  'clip-path': 'clipPath',
  clippathunits: 'clipPathUnits',
  cliprule: 'clipRule',
  'clip-rule': 'clipRule',
  color: 'color',
  colorinterpolation: 'colorInterpolation',
  'color-interpolation': 'colorInterpolation',
  colorinterpolationfilters: 'colorInterpolationFilters',
  'color-interpolation-filters': 'colorInterpolationFilters',
  colorprofile: 'colorProfile',
  'color-profile': 'colorProfile',
  colorrendering: 'colorRendering',
  'color-rendering': 'colorRendering',
  contentscripttype: 'contentScriptType',
  contentstyletype: 'contentStyleType',
  cursor: 'cursor',
  cx: 'cx',
  cy: 'cy',
  d: 'd',
  datatype: 'datatype',
  decelerate: 'decelerate',
  descent: 'descent',
  diffuseconstant: 'diffuseConstant',
  direction: 'direction',
  display: 'display',
  divisor: 'divisor',
  dominantbaseline: 'dominantBaseline',
  'dominant-baseline': 'dominantBaseline',
  dur: 'dur',
  dx: 'dx',
  dy: 'dy',
  edgemode: 'edgeMode',
  elevation: 'elevation',
  enablebackground: 'enableBackground',
  'enable-background': 'enableBackground',
  end: 'end',
  exponent: 'exponent',
  externalresourcesrequired: 'externalResourcesRequired',
  fill: 'fill',
  fillopacity: 'fillOpacity',
  'fill-opacity': 'fillOpacity',
  fillrule: 'fillRule',
  'fill-rule': 'fillRule',
  filter: 'filter',
  filterres: 'filterRes',
  filterunits: 'filterUnits',
  floodcolor: 'floodColor',
  'flood-color': 'floodColor',
  floodopacity: 'floodOpacity',
  'flood-opacity': 'floodOpacity',
  focusable: 'focusable',
  fontfamily: 'fontFamily',
  'font-family': 'fontFamily',
  fontsize: 'fontSize',
  'font-size': 'fontSize',
  fontsizeadjust: 'fontSizeAdjust',
  'font-size-adjust': 'fontSizeAdjust',
  fontstretch: 'fontStretch',
  'font-stretch': 'fontStretch',
  fontstyle: 'fontStyle',
  'font-style': 'fontStyle',
  fontvariant: 'fontVariant',
  'font-variant': 'fontVariant',
  fontweight: 'fontWeight',
  'font-weight': 'fontWeight',
  format: 'format',
  from: 'from',
  fx: 'fx',
  fy: 'fy',
  g1: 'g1',
  g2: 'g2',
  glyphname: 'glyphName',
  'glyph-name': 'glyphName',
  glyphorientationhorizontal: 'glyphOrientationHorizontal',
  'glyph-orientation-horizontal': 'glyphOrientationHorizontal',
  glyphorientationvertical: 'glyphOrientationVertical',
  'glyph-orientation-vertical': 'glyphOrientationVertical',
  glyphref: 'glyphRef',
  gradienttransform: 'gradientTransform',
  gradientunits: 'gradientUnits',
  hanging: 'hanging',
  horizadvx: 'horizAdvX',
  'horiz-adv-x': 'horizAdvX',
  horizoriginx: 'horizOriginX',
  'horiz-origin-x': 'horizOriginX',
  ideographic: 'ideographic',
  imagerendering: 'imageRendering',
  'image-rendering': 'imageRendering',
  in2: 'in2',
  in: 'in',
  inlist: 'inlist',
  intercept: 'intercept',
  k1: 'k1',
  k2: 'k2',
  k3: 'k3',
  k4: 'k4',
  k: 'k',
  kernelmatrix: 'kernelMatrix',
  kernelunitlength: 'kernelUnitLength',
  kerning: 'kerning',
  keypoints: 'keyPoints',
  keysplines: 'keySplines',
  keytimes: 'keyTimes',
  lengthadjust: 'lengthAdjust',
  letterspacing: 'letterSpacing',
  'letter-spacing': 'letterSpacing',
  lightingcolor: 'lightingColor',
  'lighting-color': 'lightingColor',
  limitingconeangle: 'limitingConeAngle',
  local: 'local',
  markerend: 'markerEnd',
  'marker-end': 'markerEnd',
  markerheight: 'markerHeight',
  markermid: 'markerMid',
  'marker-mid': 'markerMid',
  markerstart: 'markerStart',
  'marker-start': 'markerStart',
  markerunits: 'markerUnits',
  markerwidth: 'markerWidth',
  mask: 'mask',
  maskcontentunits: 'maskContentUnits',
  maskunits: 'maskUnits',
  mathematical: 'mathematical',
  mode: 'mode',
  numoctaves: 'numOctaves',
  offset: 'offset',
  opacity: 'opacity',
  operator: 'operator',
  order: 'order',
  orient: 'orient',
  orientation: 'orientation',
  origin: 'origin',
  overflow: 'overflow',
  overlineposition: 'overlinePosition',
  'overline-position': 'overlinePosition',
  overlinethickness: 'overlineThickness',
  'overline-thickness': 'overlineThickness',
  paintorder: 'paintOrder',
  'paint-order': 'paintOrder',
  panose1: 'panose1',
  'panose-1': 'panose1',
  pathlength: 'pathLength',
  patterncontentunits: 'patternContentUnits',
  patterntransform: 'patternTransform',
  patternunits: 'patternUnits',
  pointerevents: 'pointerEvents',
  'pointer-events': 'pointerEvents',
  points: 'points',
  pointsatx: 'pointsAtX',
  pointsaty: 'pointsAtY',
  pointsatz: 'pointsAtZ',
  prefix: 'prefix',
  preservealpha: 'preserveAlpha',
  preserveaspectratio: 'preserveAspectRatio',
  primitiveunits: 'primitiveUnits',
  property: 'property',
  r: 'r',
  radius: 'radius',
  refx: 'refX',
  refy: 'refY',
  renderingintent: 'renderingIntent',
  'rendering-intent': 'renderingIntent',
  repeatcount: 'repeatCount',
  repeatdur: 'repeatDur',
  requiredextensions: 'requiredExtensions',
  requiredfeatures: 'requiredFeatures',
  resource: 'resource',
  restart: 'restart',
  result: 'result',
  results: 'results',
  rotate: 'rotate',
  rx: 'rx',
  ry: 'ry',
  scale: 'scale',
  security: 'security',
  seed: 'seed',
  shaperendering: 'shapeRendering',
  'shape-rendering': 'shapeRendering',
  slope: 'slope',
  spacing: 'spacing',
  specularconstant: 'specularConstant',
  specularexponent: 'specularExponent',
  speed: 'speed',
  spreadmethod: 'spreadMethod',
  startoffset: 'startOffset',
  stddeviation: 'stdDeviation',
  stemh: 'stemh',
  stemv: 'stemv',
  stitchtiles: 'stitchTiles',
  stopcolor: 'stopColor',
  'stop-color': 'stopColor',
  stopopacity: 'stopOpacity',
  'stop-opacity': 'stopOpacity',
  strikethroughposition: 'strikethroughPosition',
  'strikethrough-position': 'strikethroughPosition',
  strikethroughthickness: 'strikethroughThickness',
  'strikethrough-thickness': 'strikethroughThickness',
  string: 'string',
  stroke: 'stroke',
  strokedasharray: 'strokeDasharray',
  'stroke-dasharray': 'strokeDasharray',
  strokedashoffset: 'strokeDashoffset',
  'stroke-dashoffset': 'strokeDashoffset',
  strokelinecap: 'strokeLinecap',
  'stroke-linecap': 'strokeLinecap',
  strokelinejoin: 'strokeLinejoin',
  'stroke-linejoin': 'strokeLinejoin',
  strokemiterlimit: 'strokeMiterlimit',
  'stroke-miterlimit': 'strokeMiterlimit',
  strokeopacity: 'strokeOpacity',
  'stroke-opacity': 'strokeOpacity',
  strokewidth: 'strokeWidth',
  'stroke-width': 'strokeWidth',
  surfacescale: 'surfaceScale',
  systemlanguage: 'systemLanguage',
  tablevalues: 'tableValues',
  targetx: 'targetX',
  targety: 'targetY',
  textanchor: 'textAnchor',
  'text-anchor': 'textAnchor',
  textdecoration: 'textDecoration',
  'text-decoration': 'textDecoration',
  textlength: 'textLength',
  textrendering: 'textRendering',
  'text-rendering': 'textRendering',
  to: 'to',
  transform: 'transform',
  typeof: 'typeof',
  u1: 'u1',
  u2: 'u2',
  underlineposition: 'underlinePosition',
  'underline-position': 'underlinePosition',
  underlinethickness: 'underlineThickness',
  'underline-thickness': 'underlineThickness',
  unicode: 'unicode',
  unicodebidi: 'unicodeBidi',
  'unicode-bidi': 'unicodeBidi',
  unicoderange: 'unicodeRange',
  'unicode-range': 'unicodeRange',
  unitsperem: 'unitsPerEm',
  'units-per-em': 'unitsPerEm',
  unselectable: 'unselectable',
  valphabetic: 'vAlphabetic',
  'v-alphabetic': 'vAlphabetic',
  vectoreffect: 'vectorEffect',
  'vector-effect': 'vectorEffect',
  version: 'version',
  verthoriginx: 'vertOriginX',
  'vert-origin-x': 'vertOriginX',
  verthoriginy: 'vertOriginY',
  'vert-origin-y': 'vertOriginY',
  vhanging: 'vHanging',
  'v-hanging': 'vHanging',
  videographic: 'vIdeographic',
  'v-ideographic': 'vIdeographic',
  viewbox: 'viewBox',
  viewtarget: 'viewTarget',
  visibility: 'visibility',
  vmathematical: 'vMathematical',
  'v-mathematical': 'vMathematical',
  vocab: 'vocab',
  widths: 'widths',
  wordspacing: 'wordSpacing',
  'word-spacing': 'wordSpacing',
  writingmode: 'writingMode',
  'writing-mode': 'writingMode',
  x1: 'x1',
  x2: 'x2',
  x: 'x',
  xchannelselector: 'xChannelSelector',
  xheight: 'xHeight',
  'x-height': 'xHeight',
  xlinkactuate: 'xlinkActuate',
  'xlink:actuate': 'xlinkActuate',
  xlinkarcrole: 'xlinkArcrole',
  'xlink:arcrole': 'xlinkArcrole',
  xlinkhref: 'xlinkHref',
  'xlink:href': 'xlinkHref',
  xlinkrole: 'xlinkRole',
  'xlink:role': 'xlinkRole',
  xlinkshow: 'xlinkShow',
  'xlink:show': 'xlinkShow',
  xlinktitle: 'xlinkTitle',
  'xlink:title': 'xlinkTitle',
  xlinktype: 'xlinkType',
  'xlink:type': 'xlinkType',
  xmlbase: 'xmlBase',
  'xml:base': 'xmlBase',
  xmllang: 'xmlLang',
  'xml:lang': 'xmlLang',
  xmlns: 'xmlns',
  'xml:space': 'xmlSpace',
  xmlnsxlink: 'xmlnsXlink',
  'xmlns:xlink': 'xmlnsXlink',
  xmlspace: 'xmlSpace',
  y1: 'y1',
  y2: 'y2',
  y: 'y',
  ychannelselector: 'yChannelSelector',
  z: 'z',
  zoomandpan: 'zoomAndPan'
};

var hasOwnProperty = Object.prototype.hasOwnProperty;
var STYLE = 'style';
var RESERVED_PROPS$1 = new Set(['children', 'dangerouslySetInnerHTML', 'defaultValue', 'defaultChecked', 'innerHTML', 'suppressContentEditableWarning', 'suppressHydrationWarning', 'style']);

function getValueForProperty(node, name, expected, propertyInfo) {
  {
    if (propertyInfo.mustUseProperty) {
      var propertyName = propertyInfo.propertyName;
      return node[propertyName];
    } else {
      if (propertyInfo.attributeName === 'style') {
        var _ret = {
          v: null
        };

        _forEach(node.style, function (value, key) {
          if (!_ret.v) {
            _ret.v = {};
          }

          _ret.v[key] = value;
        });

        return _ret.v;
      }

      var attributeName = propertyInfo.attributeName;

      if (propertyInfo.type === 3) {
        return node.hasAttribute(attributeName);
      }

      var attributeValue = node.getAttribute(attributeName);

      if (propertyInfo.type === 4 && attributeValue === '') {
        return true;
      }

      return attributeValue;
    }
  }
}

function getValueForAttribute(node, name, expected) {
  {
    if (!isAttributeNameSafe$1(name)) {
      return;
    }

    if (isCustomElement(node.tagName.toLowerCase(), node.attributes)) {
      return node.getAttribute(name);
    }

    var propertyInfo = getPropertyInfo$1(name);

    if (propertyInfo !== null) {
      if (shouldIgnoreAttribute$1(name, propertyInfo, false)) {
        return;
      }

      if (shouldRemoveAttribute$1(name, expected, propertyInfo, false)) {
        return;
      }

      if (propertyInfo.mustUseProperty) {
        return node[propertyInfo.propertyName];
      } else {
        return node.getAttribute(propertyInfo.attributeName);
      }
    } else {
      return node.getAttribute(name);
    }
  }
}

function setValueForProperty(node, name, value, isCustomComponentTag) {
  var propertyInfo = getPropertyInfo$1(name);

  if (shouldIgnoreAttribute$1(name, propertyInfo, isCustomComponentTag)) {
    return;
  }

  if (shouldRemoveAttribute$1(name, value, propertyInfo, isCustomComponentTag)) {
    value = null;
  }

  if (isCustomComponentTag || propertyInfo === null) {
    if (isAttributeNameSafe$1(name)) {
      var _attributeName = name;

      if (value === null) {
        node.removeAttribute(_attributeName);
      } else {
        node.setAttribute(_attributeName, '' + value);
      }
    }

    return;
  }

  var mustUseProperty = propertyInfo.mustUseProperty;

  if (mustUseProperty) {
    var propertyName = propertyInfo.propertyName;

    if (value === null) {
      var type = propertyInfo.type;
      node[propertyName] = type === 3 ? false : '';
    } else {
      node[propertyName] = value;
    }

    return;
  }

  var attributeName = propertyInfo.attributeName,
      attributeNamespace = propertyInfo.attributeNamespace;

  if (value === null) {
    node.removeAttribute(attributeName);
  } else {
    var _type = propertyInfo.type;
    var attributeValue;

    if (_type === 3 || _type === 4 && value === true) {
      attributeValue = '';
    } else {
      attributeValue = '' + value;
    }

    if (attributeNamespace) {
      node.setAttributeNS(attributeNamespace, attributeName, attributeValue);
    } else {
      node.setAttribute(attributeName, attributeValue);
    }
  }
}

var DOCUMENT_NODE = 9;

function getOwnerDocument(node) {
  return node.nodeType === DOCUMENT_NODE ? node : node.ownerDocument;
}

function getActiveElement(doc) {
  doc = doc || (typeof document !== 'undefined' ? document : undefined);

  if (typeof doc === 'undefined') {
    return null;
  }

  try {
    return doc.activeElement || doc.body;
  } catch (e) {
    return doc.body;
  }
}

var isArray$1 = Array.isArray;

function getHostProps(fiber) {
  var props = fiber.memoizedProps;

  if (props == null) {
    props = {};
  }

  return props;
}

function getHostContext() {
  return null;
}

function getRootHostContext(rootContainerInstance) {
  var type;
  var namespace;
  var nodeType = rootContainerInstance.nodeType;

  switch (nodeType) {
    case 9:
    case 11:
      type = nodeType === 9 ? '#document' : '#fragment';
      var root = rootContainerInstance.documentElement;
      namespace = root ? root.namespaceURI : getElementNamespace(null, '');
      break;

    default:
      {
        var container = nodeType === 8 ? rootContainerInstance.parentNode : rootContainerInstance;
        var ownNamespace = container.namespaceURI || null;
        type = container.tagName;
        namespace = getElementNamespace(type, ownNamespace);
        break;
      }
  }

  return namespace;
}

function getChildHostContext(parentHostContext, type, rootContainerInstance) {
  var parentNamespace = parentHostContext;
  return getElementNamespace(type, parentNamespace);
}

function getPublicInstance(instance) {
  return instance;
}

function prepareForCommit(containerInfo) {
  return null;
}

function resetAfterCommit(containerInfo) {}

function createInstance(type, props, rootContainerInstance, hostContext, internalInstanceHandle) {
  var ownerDocument = getOwnerDocument(rootContainerInstance);
  var domElement = createElement(hostContext, type, props, ownerDocument);
  precacheFiberNode(internalInstanceHandle, domElement);
  updateFiberProps(domElement, props);
  return domElement;
}

function appendInitialChild(parentInstance, child) {
  parentInstance.appendChild(child);
}

function finalizeInitialChildren(domElement, type, props, rootContainerInstance, hostContext) {
  setInitialProperties(domElement, type, props, rootContainerInstance);
  return shouldAutoFocusHostComponent(type, props);
}

function shouldAutoFocusHostComponent(type, props) {
  return props.autoFocus;
}

function shouldSetTextContent(type, props) {
  return typeof props.children === 'string' || typeof props.children === 'number';
}

function createTextInstance$1(text, rootContainerInstance, hostContext, internalInstanceHandle) {
  var ownerDocument = getOwnerDocument(rootContainerInstance);
  var textNode = createTextNode(text, ownerContainerInstance);
  precacheFiberNode(internalInstanceHandle, textNode);
  return textNode;
}

function scheduleTimeout(handler, timeout) {
  return setTimeout(handler, timeout);
}

function cancelTimeout(id) {
  clearTimeout(id);
}

function noTimeout() {
  return -1;
}

function preparePortalMount(containerInfo) {}

var randomKey = Math.random().toString(36).slice(2);
var internalInstanceKey = '__reactFiber$' + randomKey;
var internalPropsKey = '__reactProps$' + randomKey;
var internalContainerInstanceKey = '__reactContainer$' + randomKey;
var internalEventHandlersKey = '__reactEvents$' + randomKey;
var internalEventHandlerListenersKey = '__reactListeners$' + randomKey;
var internalEventHandlesKey = '__reactHandles$' + randomKey;
function precacheFiberNode(hostInst, node) {
  node[internalInstanceKey] = hostInst;
}
function markContainerAsRoot(hostRoot, node) {
  node[internalContainerInstanceKey] = hostRoot;
}
function unmarkContainerAsRoot(node) {
  node[internalContainerInstanceKey] = null;
}
function isContainerMarkedAsRoot(node) {
  return node[internalContainerInstanceKey] != null;
}
function getClosestInstanceFromNode(targetNode) {
  var targetInst = targetNode[internalInstanceKey];

  if (targetInst) {
    var nearestMounted = getNearestMountedFiber(targetInst);

    if (nearestMounted !== null && nearestMounted.tag === HostComponent) {
      return nearestMounted;
    }
  }

  return null;
}
function getInstanceFromNode(node) {
  var inst = node[internalInstanceKey];

  if (inst) {
    if (inst.tag === HostComponent || inst.tag === HostText || inst.tag === SuspenseComponent || inst.tag === DehydratedFragment) {
      return inst;
    } else {
      return null;
    }
  }

  return null;
}
function getNodeFromInstance(inst) {
  if (inst.tag === HostComponent || inst.tag === HostText) {
    return inst.stateNode;
  }

  throw new Error('getNodeFromInstance: Invalid argument.');
}
function getFiberCurrentPropsFromNode(node) {
  return node[internalPropsKey] || null;
}
function updateFiberProps(node, props) {
  node[internalPropsKey] = props;
}
function getEventListenerSet(node) {
  var elementListenerSet = node[internalEventHandlersKey];

  if (elementListenerSet === undefined) {
    elementListenerSet = node[internalEventHandlersKey] = new Set();
  }

  return elementListenerSet;
}

var scheduleCallback = null;
var cancelCallback = null;
var shouldYield = null;
var requestPaint = null;
var now = null;
var getCurrentTime = null;
var forceFrameRate = null;

var unstable_now = Date.now;

var ImmediatePriority = 1,
    UserBlockingPriority = 2,
    NormalPriority = 3,
    LowPriority = 4,
    IdlePriority = 5;

function scheduler_flush(callback) {
  var flushed = false;

  try {
    while (!flushed) {
      flushed = callback();
    }
  } finally {
    return;
  }
}

function scheduler_scheduleCallback(priorityLevel, callback, options) {
  var timeout = -1;

  if (options != null && typeof options.timeout === 'number') {
    timeout = options.timeout;
  }

  switch (priorityLevel) {
    case ImmediatePriority:
    case UserBlockingPriority:
      return unstable_scheduleCallback(priorityLevel, callback, {
        timeout: timeout
      });

    case NormalPriority:
    case LowPriority:
    case IdlePriority:
      return unstable_scheduleCallback(priorityLevel, callback, {
        timeout: timeout
      });
  }
}

var a = null,
    b = !1,
    c = 3,
    d = -1,
    e = -1,
    f = !1,
    g = !1;

function h() {
  f = !1;
  d = -1;
  e = -1;
}

function k() {
  return f ? d : -1;
}

function l(a) {
  var b = a.alternate;
  a = a.pending;
  null === b ? (b = m(a), b.next = b) : (b.next = a.next, a.next = b);
  a.flags = 1;
  b.flags = 1;
  return b;
}

function m(a) {
  var b = {
    expirationTime: 0,
    next: null,
    priorityLevel: 0,
    callback: null,
    nextCallback: null,
    flags: 0
  };
  b.callback = a;
  return b;
}

function n(a, b) {
  var c = a.next;
  a.next = b;
  b.next = c;
}

function p(a, b) {
  if (null !== a.next && a.next.priorityLevel >= b) return !1;
  var c = a.callback;
  a.callback = null;
  a.priorityLevel = 0;
  var d = c(b);
  "function" === typeof d ? (a.callback = d, a.priorityLevel = b) : a.callback = null;
  return null !== a.callback;
}

function q() {
  if (g) return;
  g = !0;
  var a = 0,
      b = c;

  try {
    var d = r();
    if (null !== d) for (; null !== d && (!f || d.expirationTime <= e);) {
      var h = d.callback;

      if (null !== h) {
        d.callback = null;
        var k = d.priorityLevel;
        var l = d.expirationTime;
        var m = h(k, l);
        "function" === typeof m ? d.callback = m : d === r() && t();
      } else t();

      d = r();
    } else g = !1;
  } finally {
    c = b, g = !1;
  }
}

function r() {
  return null === a ? null : a.next;
}

function t() {
  var b = a.next;
  null === b ? a = null : (a.next = b.next, b.next = null);
  return b;
}

var u = unstable_now,
    v = [],
    w = [],
    x = 1,
    y = null,
    z = 3,
    A = !1,
    B = !1,
    C = !1;

function D(a) {
  for (var b = v[0]; void 0 !== b;) {
    if (b.expirationTime > a) break;
    var c = b.callback;

    if (null !== c) {
      b.callback = null;
      var d = b.priorityLevel;
      var e = b.expirationTime;
      var f = c(d, e);
      "function" === typeof f ? b.callback = f : b === v[0] && v.shift();
    } else v.shift();

    b = v[0];
  }
}

function E(a) {
  if (C) return;
  C = !0;
  var b = 0,
      c = z;

  try {
    var d = A;
    A = !0;
    var e = w[0];
    if (void 0 !== e) for (; e.expirationTime <= a;) {
      var f = e.callback;

      if (null !== f) {
        e.callback = null;
        var g = e.priorityLevel;
        var h = e.expirationTime;
        var k = f(g, h);
        "function" === typeof k ? e.callback = k : e === w[0] && w.shift();
      } else w.shift();

      e = w[0];
    } else A = !1;
  } finally {
    z = c, C = !1;
  }
}

var F = unstable_scheduleCallback,
    G = unstable_cancelCallback;

function H(a) {
  F(a);
}

function I(a) {
  G(a);
}

var J = "function" === typeof setTimeout ? setTimeout : null,
    K = "function" === typeof clearTimeout ? clearTimeout : null,
    L = "function" === typeof setImmediate ? setImmediate : null;

function M(a) {
  var b = u();
  a > b ? J(N, a - b) : (O(), H(P));
}

function N() {
  O();
  H(P);
}

function O() {
  y = null;
  K(y);
}

function P() {
  if (null !== w[0]) {
    E(u());
    var a = w[0];
    void 0 !== a && (null !== a.callback ? M(a.expirationTime) : (w.shift(), P()));
  }
}

var unstable_scheduleCallback = function (a, b, c) {
  var d = u();
  var e;
  "object" === typeof c && null !== c ? (e = c.timeout, e = d + e) : e = d + 5E3;
  c = {
    callback: b,
    priorityLevel: a,
    expirationTime: e,
    next: null,
    sortIndex: -1
  };
  a > NormalPriority ? (c.sortIndex = e, w.push(c), null === y && (y = J(N, e - d))) : (c.sortIndex = -1, v.push(c), A || B || (A = !0, H(D)));
  return c;
};

var unstable_cancelCallback = function (a) {
  a.callback = null;
};

var unstable_getCurrentPriorityLevel = function () {
  return z;
};

var unstable_shouldYield = function () {
  var a = u();
  D(a);
  var b = v[0];
  return void 0 !== b && b.expirationTime < a || null !== w[0] && w[0].expirationTime < a;
};

var unstable_requestPaint = function () {};

var unstable_forceFrameRate = function (a) {};

var unstable_getFirstCallbackNode = function () {
  return v[0];
};

var unstable_runWithPriority = function (a, b) {
  var c = z;
  z = a;

  try {
    return b();
  } finally {
    z = c;
  }
};

var unstable_next = function (a) {
  var b = z;
  z = NormalPriority;

  try {
    return a();
  } finally {
    z = b;
  }
};

var unstable_continueExecution = function () {
  A || B || (A = !0, H(D));
};

var unstable_pauseExecution = function () {};

var unstable_wrapCallback = function (a) {
  var b = z;
  return function () {
    var c = z;
    z = b;

    try {
      return a.apply(this, arguments);
    } finally {
      z = c;
    }
  };
};

var unstable_Profiling = null;

var Scheduler = {
  __proto__: null,
  unstable_ImmediatePriority: ImmediatePriority,
  unstable_UserBlockingPriority: UserBlockingPriority,
  unstable_NormalPriority: NormalPriority,
  unstable_LowPriority: LowPriority,
  unstable_IdlePriority: IdlePriority,
  unstable_scheduleCallback: scheduler_scheduleCallback,
  unstable_cancelCallback: unstable_cancelCallback,
  unstable_shouldYield: unstable_shouldYield,
  unstable_requestPaint: unstable_requestPaint,
  unstable_now: unstable_now,
  unstable_getCurrentPriorityLevel: unstable_getCurrentPriorityLevel,
  unstable_runWithPriority: unstable_runWithPriority,
  unstable_next: unstable_next,
  unstable_continueExecution: unstable_continueExecution,
  unstable_pauseExecution: unstable_pauseExecution,
  unstable_wrapCallback: unstable_wrapCallback,
  unstable_getFirstCallbackNode: unstable_getFirstCallbackNode,
  unstable_Profiling: unstable_Profiling
};

var DiscreteEventPriority = 1;
var ContinuousEventPriority = 4;
var DefaultEventPriority = 16;
var IdleEventPriority = 32;
var currentUpdatePriority = DefaultEventPriority;
function getCurrentUpdatePriority() {
  return currentUpdatePriority;
}
function setCurrentUpdatePriority(newPriority) {
  currentUpdatePriority = newPriority;
}
function runWithPriority(priority, fn) {
  var previousPriority = currentUpdatePriority;

  try {
    currentUpdatePriority = priority;
    return fn();
  } finally {
    currentUpdatePriority = previousPriority;
  }
}

var ReactCurrentOwner$1 = React.ReactCurrentOwner;
function getNearestMountedFiber(fiber) {
  var node = fiber;
  var nearestMounted = fiber;

  if (!fiber.alternate) {
    var nextNode = node;

    while (nextNode) {
      node = nextNode;

      if (node.flags & (2 | 4)) {
        nearestMounted = node.return;
      }

      nextNode = node.return;
    }
  } else {
    while (node.return) {
      node = node.return;
    }
  }

  if (node.tag === 3) {
    return nearestMounted;
  }

  return null;
}
function getSuspenseInstanceFromFiber(fiber) {
  if (fiber.tag === 13) {
    var suspenseState = fiber.memoizedState;

    if (suspenseState === null) {
      var current = fiber.alternate;

      if (current !== null) {
        suspenseState = current.memoizedState;
      }
    }

    if (suspenseState !== null) {
      return suspenseState.dehydrated;
    }
  }

  return null;
}
function getContainerFromFiber(fiber) {
  return fiber.tag === 3 ? fiber.stateNode.containerInfo : null;
}
function getHostSibling(fiber) {
  var node = fiber;

  siblings: while (true) {
    while (node.sibling === null) {
      if (node.return === null || node.return.tag === 3) {
        return null;
      }

      node = node.return;
    }

    node.sibling.return = node.return;
    node = node.sibling;

    while (node.tag !== 5 && node.tag !== 6 && node.tag !== 18) {
      if (node.flags & 2) {
        continue siblings;
      }

      if (node.child === null || node.tag === 4) {
        continue siblings;
      } else {
        node.child.return = node;
        node = node.child;
      }
    }

    if (!(node.flags & 2)) {
      return node.stateNode;
    }
  }
}
function getHostStack() {
  var hostStack = [];
  var getHostStackImpl = React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.getStack;

  if (getHostStackImpl) {
    var frames = getHostStackImpl();

    for (var i = 0; i < frames.length; i++) {
      var frame = frames[i];
      var owner = frame.owner;
      var ownerName = getComponentNameFromFiber(owner);

      if (ownerName) {
        hostStack.push({
          name: ownerName,
          owner: owner
        });
      }
    }
  }

  return hostStack;
}

var attemptSynchronousHydration;
function setAttemptSynchronousHydration(fn) {
  attemptSynchronousHydration = fn;
}
var attemptUserBlockingHydration;
function setAttemptUserBlockingHydration(fn) {
  attemptUserBlockingHydration = fn;
}
var attemptContinuousHydration;
function setAttemptContinuousHydration(fn) {
  attemptContinuousHydration = fn;
}
var attemptHydrationAtCurrentPriority;
function setAttemptHydrationAtCurrentPriority(fn) {
  attemptHydrationAtCurrentPriority = fn;
}
var hasScheduledReplayAttempt = false;
var findHostInstancesForRefresh;
function setFindHostInstancesForRefresh(fn) {
  findHostInstancesForRefresh = fn;
}
var scheduleRefresh;
function setScheduleRefresh(fn) {
  scheduleRefresh = fn;
}
var scheduleRoot;
function setScheduleRoot(fn) {
  scheduleRoot = fn;
}
var setRefreshHandler;
function setSetRefreshHandler(fn) {
  setRefreshHandler = fn;
}
var findHostInstancesForMatchingFibers;
function setFindHostInstancesForMatchingFibers(fn) {
  findHostInstancesForMatchingFibers = fn;
}

var findFiberByHostInstance = function () {
  return null;
};

function findHostInstanceByFiber(fiber) {
  var hostFiber = findCurrentHostFiber(fiber);

  if (hostFiber === null) {
    return null;
  }

  return hostFiber.stateNode;
}

function emptyFindFiberByHostInstance(instance) {
  return null;
}

function getCurrentFiberForDevTools() {
  return ReactCurrentOwner$1.current;
}

var topLevelUpdateWarnings;
var warnOnUndefinedCallback;
var didWarnAboutUnstableCreatePortal = false;

{
  topLevelUpdateWarnings = function (container) {
    if (container._reactRootContainer && container.nodeType !== 9) {
      var hostInstance = findHostInstanceByFiber(container._reactRootContainer.current);

      if (hostInstance) {
        if (hostInstance.parentNode !== container) {
          error('render(...): It looks like the React-rendered content of this ' + 'container was removed without using React. This is not ' + 'supported and will cause errors. Instead, call ' + 'ReactDOM.unmountComponentAtNode to empty a container.');
        }
      }
    }

    var isRootRenderedBySomeReact = !!container._reactRootContainer;
    var rootEl = getReactRootElementInContainer(container);
    var hasNonRootReactChild = !!(rootEl && getInstanceFromNode(rootEl));

    if (hasNonRootReactChild && !isRootRenderedBySomeReact) {
      error('render(...): Replacing React-rendered content with top-level ' + 'React render is not supported. Instead, render a single ' + 'component directly into ' + container.nodeName + ' and make sure ' + 'its children are not rendered by React.');
    }
  };

  warnOnUndefinedCallback = function (callback, callerName) {
    if (callback !== undefined && typeof callback !== 'function') {
      error('%s(...): Expected the last optional `callback` argument to be a ' + 'function. Instead received: %s.', callerName, callback);
    }
  };
}

function getReactRootElementInContainer(container) {
  if (!container) {
    return null;
  }

  if (container.nodeType === 9) {
    return container.documentElement;
  } else {
    return container.firstChild;
  }
}

function legacyCreateRootFromDOMContainer(container, forceHydrate) {
  var shouldHydrate = forceHydrate || shouldHydrateDueToLegacyHeuristic(container);

  if (!shouldHydrate) {
    var rootSibling;

    while (rootSibling = container.lastChild) {
      container.removeChild(rootSibling);
    }
  }

  var root = createLegacyRoot(container, shouldHydrate ? {
    hydrate: true
  } : undefined);
  return new ReactDOMLegacyRoot(root);
}

function shouldHydrateDueToLegacyHeuristic(container) {
  var rootElement = getReactRootElementInContainer(container);
  return !!(rootElement && rootElement.nodeType === 1 && rootElement.hasAttribute('data-reactroot'));
}

function legacyRenderSubtreeIntoContainer(parentComponent, children, container, forceHydrate, callback) {
  {
    topLevelUpdateWarnings(container);
    warnOnUndefinedCallback(callback, 'render');
  }

  var root = container._reactRootContainer;
  var fiberRoot;

  if (!root) {
    root = container._reactRootContainer = legacyCreateRootFromDOMContainer(container, forceHydrate);
    fiberRoot = root._internalRoot;

    if (typeof callback === 'function') {
      var originalCallback = callback;

      callback = function () {
        var instance = getPublicRootInstance(fiberRoot);
        originalCallback.call(instance);
      };
    }

    unbatchedUpdates(function () {
      updateContainer(children, fiberRoot, parentComponent, callback);
    });
  } else {
    fiberRoot = root._internalRoot;

    if (typeof callback === 'function') {
      var _originalCallback = callback;

      callback = function () {
        var instance = getPublicRootInstance(fiberRoot);

        _originalCallback.call(instance);
      };
    }

    updateContainer(children, fiberRoot, parentComponent, callback);
  }

  return getPublicRootInstance(fiberRoot);
}

function createPortal(children, container) {
  var key = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;

  if (!isValidContainer(container)) {
    throw new Error('Target container is not a DOM element.');
  }

  return createPortal$1(children, container, null, key);
}

var ReactCurrentOwner$2 = React.ReactCurrentOwner;
var topLevelUpdateWarnings$1;
var warnOnUndefinedCallback$1;

{
  topLevelUpdateWarnings$1 = function (container) {
    if (container._reactRootContainer && container.nodeType !== 9) {
      var hostInstance = findHostInstanceByFiber(container._reactRootContainer.current);

      if (hostInstance) {
        if (hostInstance.parentNode !== container) {
          error('render(...): It looks like the React-rendered content of this ' + 'container was removed without using React. This is not ' + 'supported and will cause errors. Instead, call ' + 'ReactDOM.unmountComponentAtNode to empty a container.');
        }
      }
    }

    var isRootRenderedBySomeReact = !!container._reactRootContainer;
    var rootEl = getReactRootElementInContainer(container);
    var hasNonRootReactChild = !!(rootEl && getInstanceFromNode(rootEl));

    if (hasNonRootReactChild && !isRootRenderedBySomeReact) {
      error('render(...): Replacing React-rendered content with top-level ' + 'React render is not supported. Instead, render a single ' + 'component directly into ' + container.nodeName + ' and make sure ' + 'its children are not rendered by React.');
    }
  };

  warnOnUndefinedCallback$1 = function (callback, callerName) {
    if (callback !== undefined && typeof callback !== 'function') {
      error('%s(...): Expected the last optional `callback` argument to be a ' + 'function. Instead received: %s.', callerName, callback);
    }
  };
}

function getReactRootElementInContainer$1(container) {
  if (!container) {
    return null;
  }

  if (container.nodeType === 9) {
    return container.documentElement;
  } else {
    return container.firstChild;
  }
}

function legacyCreateRootFromDOMContainer$1(container, forceHydrate) {
  var shouldHydrate = forceHydrate || shouldHydrateDueToLegacyHeuristic$1(container);

  if (!shouldHydrate) {
    var rootSibling;

    while (rootSibling = container.lastChild) {
      container.removeChild(rootSibling);
    }
  }

  var root = createLegacyRoot(container, shouldHydrate ? {
    hydrate: true
  } : undefined);
  return new ReactDOMLegacyRoot(root);
}

function shouldHydrateDueToLegacyHeuristic$1(container) {
  var rootElement = getReactRootElementInContainer$1(container);
  return !!(rootElement && rootElement.nodeType === 1 && rootElement.hasAttribute('data-reactroot'));
}

function legacyRenderSubtreeIntoContainer$1(parentComponent, children, container, forceHydrate, callback) {
  {
    topLevelUpdateWarnings$1(container);
    warnOnUndefinedCallback$1(callback, 'render');
  }

  var root = container._reactRootContainer;
  var fiberRoot;

  if (!root) {
    root = container._reactRootContainer = legacyCreateRootFromDOMContainer$1(container, forceHydrate);
    fiberRoot = root._internalRoot;

    if (typeof callback === 'function') {
      var originalCallback = callback;

      callback = function () {
        var instance = getPublicRootInstance(fiberRoot);
        originalCallback.call(instance);
      };
    }

    unbatchedUpdates(function () {
      updateContainer(children, fiberRoot, parentComponent, callback);
    });
  } else {
    fiberRoot = root._internalRoot;

    if (typeof callback === 'function') {
      var _originalCallback = callback;

      callback = function () {
        var instance = getPublicRootInstance(fiberRoot);

        _originalCallback.call(instance);
      };
    }

    updateContainer(children, fiberRoot, parentComponent, callback);
  }

  return getPublicRootInstance(fiberRoot);
}

function findDOMNode(componentOrElement) {
  {
    var owner = ReactCurrentOwner$2.current;

    if (owner !== null && owner.stateNode !== null) {
      var warnedAboutRefsInRender = owner.stateNode._warnedAboutRefsInRender;

      if (!warnedAboutRefsInRender) {
        error('%s is accessing findDOMNode inside its render(). ' + 'render() should be a pure function of props and state. It should ' + 'never access something that requires stale data from the DOM, ' + 'such as a DOM node. ' + 'https://reactjs.org/link/ ReactDOM- внутри-render', getComponentNameFromFiber(owner) || 'Unknown');
      }

      owner.stateNode._warnedAboutRefsInRender = true;
    }
  }

  if (componentOrElement == null) {
    return null;
  }

  if (componentOrElement.nodeType === 1) {
    return componentOrElement;
  }

  var inst = getClosestInstanceFromNode(componentOrElement);

  if (inst) {
    return findHostInstance(inst);
  }

  if (typeof componentOrElement.render === 'function') {
    throw new Error('Unable to find node on an unmounted component.');
  } else {
    throw new Error('Element appears to be neither ReactComponent nor DOMNode. Keys: ' + Object.keys(componentOrElement));
  }
}

function hydrate(element, container, callback) {
  if (!isValidContainer(container)) {
    throw new Error('Target container is not a DOM element.');
  }

  {
    warnIfReactDOMContainerInDEV(container);
  }

  return legacyRenderSubtreeIntoContainer$1(null, element, container, true, callback);
}

function render(element, container, callback) {
  if (!isValidContainer(container)) {
    throw new Error('Target container is not a DOM element.');
  }

  {
    warnIfReactDOMContainerInDEV(container);
  }

  return legacyRenderSubtreeIntoContainer$1(null, element, container, false, callback);
}

function unmountComponentAtNode(container) {
  if (!isValidContainer(container)) {
    throw new Error('unmountComponentAtNode(...): Target container is not a DOM element.');
  }

  {
    warnIfReactDOMContainerInDEV(container);
  }

  if (container._reactRootContainer) {
    unbatchedUpdates(function () {
      legacyRenderSubtreeIntoContainer$1(null, null, container, false, function () {
        container._reactRootContainer = null;
        unmarkContainerAsRoot(container);
      });
    });
    return true;
  } else {
    return false;
  }
}

var Internals = {
  Events: [getInstanceFromNode, getNodeFromInstance, getFiberCurrentPropsFromNode, injection.injectEventPluginsByName, eventNameDispatchConfigs, accumulateTwoPhaseDispatches, accumulateDirectDispatches, enqueueStateRestore, restoreStateIfNeeded, dispatchEvent, runEventsInBatch, flushPassiveEffects, IsThisRendererActing]
};

var foundDevTools = false;
var testDevToolsCallback;

{
  testDevToolsCallback = function (iframe) {
    if (iframe.contentWindow.opener) {
      var inner = iframe.contentWindow.document.createElement('div');
      iframe.contentWindow.document.body.appendChild(inner);
      var a = iframe.contentWindow.document.createEvent('MouseEvents');
      a.initMouseEvent('click', true, true, iframe.contentWindow, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
      inner.dispatchEvent(a);
      var b = iframe.contentWindow.document.createEvent('MouseEvents');
      b.initMouseEvent('click', true, true, iframe.contentWindow, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
      inner.dispatchEvent(b);
    }
  };
}

function injectIntoDevTools(devToolsConfig) {
  var findFiberByHostInstance = devToolsConfig.findFiberByHostInstance;
  var ReactCurrentDispatcher = ReactSharedInternals.ReactCurrentDispatcher;
  return injectInternals({
    bundleType: devToolsConfig.bundleType,
    version: ReactVersion,
    rendererPackageName: 'react-dom',
    rendererConfig: {
      findFiberByHostInstance: findFiberByHostInstance,
      bundleType: devToolsConfig.bundleType,
      version: ReactVersion,
      rendererPackageName: 'react-dom',
      overrideHookState: null,
      overrideHookStateDeletePath: null,
      overrideHookStateRenamePath: null,
      overrideProps: null,
      overridePropsDeletePath: null,
      overridePropsRenamePath: null,
      setSuspenseHandler: null,
      scheduleUpdate: null,
      currentDispatcherRef: ReactCurrentDispatcher,
      findHostInstancesForRefresh: findHostInstancesForRefresh,
      scheduleRefresh: scheduleRefresh,
      scheduleRoot: scheduleRoot,
      setRefreshHandler: setRefreshHandler,
      getCurrentFiber: getCurrentFiberForDevTools,
      findHostInstancesForMatchingFibers: findHostInstancesForMatchingFibers
    },
    ownerHasCatchPolyfill: false,
    ownerHasErrorBoundaries: false
  });
}

exports.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = Internals;
exports.createPortal = createPortal;
exports.findDOMNode = findDOMNode;
exports.flushSync = flushSync;
exports.hydrate = hydrate;
exports.render = render;
exports.unmountComponentAtNode = unmountComponentAtNode;
exports.unstable_batchedUpdates = batchedUpdates;
exports.unstable_createPortal = createPortal;
exports.unstable_renderSubtreeIntoContainer = legacyRenderSubtreeIntoContainer;
exports.version = ReactVersion;

})));
