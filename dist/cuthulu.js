// @bun
var __create = Object.create;
var __getProtoOf = Object.getPrototypeOf;
var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __toESM = (mod, isNodeMode, target) => {
  target = mod != null ? __create(__getProtoOf(mod)) : {};
  const to = isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target;
  for (let key of __getOwnPropNames(mod))
    if (!__hasOwnProp.call(to, key))
      __defProp(to, key, {
        get: () => mod[key],
        enumerable: true
      });
  return to;
};
var __commonJS = (cb, mod) => () => (mod || cb((mod = { exports: {} }).exports, mod), mod.exports);
var __require = import.meta.require;

// node_modules/@opentelemetry/api/build/src/platform/node/globalThis.js
var require_globalThis = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports._globalThis = undefined;
  exports._globalThis = typeof globalThis === "object" ? globalThis : global;
});

// node_modules/@opentelemetry/api/build/src/platform/node/index.js
var require_node = __commonJS((exports) => {
  var __createBinding = exports && exports.__createBinding || (Object.create ? function(o, m, k, k2) {
    if (k2 === undefined)
      k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() {
      return m[k];
    } });
  } : function(o, m, k, k2) {
    if (k2 === undefined)
      k2 = k;
    o[k2] = m[k];
  });
  var __exportStar = exports && exports.__exportStar || function(m, exports2) {
    for (var p in m)
      if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p))
        __createBinding(exports2, m, p);
  };
  Object.defineProperty(exports, "__esModule", { value: true });
  __exportStar(require_globalThis(), exports);
});

// node_modules/@opentelemetry/api/build/src/platform/index.js
var require_platform = __commonJS((exports) => {
  var __createBinding = exports && exports.__createBinding || (Object.create ? function(o, m, k, k2) {
    if (k2 === undefined)
      k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() {
      return m[k];
    } });
  } : function(o, m, k, k2) {
    if (k2 === undefined)
      k2 = k;
    o[k2] = m[k];
  });
  var __exportStar = exports && exports.__exportStar || function(m, exports2) {
    for (var p in m)
      if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p))
        __createBinding(exports2, m, p);
  };
  Object.defineProperty(exports, "__esModule", { value: true });
  __exportStar(require_node(), exports);
});

// node_modules/@opentelemetry/api/build/src/version.js
var require_version = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.VERSION = undefined;
  exports.VERSION = "1.9.0";
});

// node_modules/@opentelemetry/api/build/src/internal/semver.js
var require_semver = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.isCompatible = exports._makeCompatibilityCheck = undefined;
  var version_1 = require_version();
  var re = /^(\d+)\.(\d+)\.(\d+)(-(.+))?$/;
  function _makeCompatibilityCheck(ownVersion) {
    const acceptedVersions = new Set([ownVersion]);
    const rejectedVersions = new Set;
    const myVersionMatch = ownVersion.match(re);
    if (!myVersionMatch) {
      return () => false;
    }
    const ownVersionParsed = {
      major: +myVersionMatch[1],
      minor: +myVersionMatch[2],
      patch: +myVersionMatch[3],
      prerelease: myVersionMatch[4]
    };
    if (ownVersionParsed.prerelease != null) {
      return function isExactmatch(globalVersion) {
        return globalVersion === ownVersion;
      };
    }
    function _reject(v) {
      rejectedVersions.add(v);
      return false;
    }
    function _accept(v) {
      acceptedVersions.add(v);
      return true;
    }
    return function isCompatible(globalVersion) {
      if (acceptedVersions.has(globalVersion)) {
        return true;
      }
      if (rejectedVersions.has(globalVersion)) {
        return false;
      }
      const globalVersionMatch = globalVersion.match(re);
      if (!globalVersionMatch) {
        return _reject(globalVersion);
      }
      const globalVersionParsed = {
        major: +globalVersionMatch[1],
        minor: +globalVersionMatch[2],
        patch: +globalVersionMatch[3],
        prerelease: globalVersionMatch[4]
      };
      if (globalVersionParsed.prerelease != null) {
        return _reject(globalVersion);
      }
      if (ownVersionParsed.major !== globalVersionParsed.major) {
        return _reject(globalVersion);
      }
      if (ownVersionParsed.major === 0) {
        if (ownVersionParsed.minor === globalVersionParsed.minor && ownVersionParsed.patch <= globalVersionParsed.patch) {
          return _accept(globalVersion);
        }
        return _reject(globalVersion);
      }
      if (ownVersionParsed.minor <= globalVersionParsed.minor) {
        return _accept(globalVersion);
      }
      return _reject(globalVersion);
    };
  }
  exports._makeCompatibilityCheck = _makeCompatibilityCheck;
  exports.isCompatible = _makeCompatibilityCheck(version_1.VERSION);
});

// node_modules/@opentelemetry/api/build/src/internal/global-utils.js
var require_global_utils = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.unregisterGlobal = exports.getGlobal = exports.registerGlobal = undefined;
  var platform_1 = require_platform();
  var version_1 = require_version();
  var semver_1 = require_semver();
  var major = version_1.VERSION.split(".")[0];
  var GLOBAL_OPENTELEMETRY_API_KEY = Symbol.for(`opentelemetry.js.api.${major}`);
  var _global = platform_1._globalThis;
  function registerGlobal(type, instance, diag, allowOverride = false) {
    var _a;
    const api = _global[GLOBAL_OPENTELEMETRY_API_KEY] = (_a = _global[GLOBAL_OPENTELEMETRY_API_KEY]) !== null && _a !== undefined ? _a : {
      version: version_1.VERSION
    };
    if (!allowOverride && api[type]) {
      const err = new Error(`@opentelemetry/api: Attempted duplicate registration of API: ${type}`);
      diag.error(err.stack || err.message);
      return false;
    }
    if (api.version !== version_1.VERSION) {
      const err = new Error(`@opentelemetry/api: Registration of version v${api.version} for ${type} does not match previously registered API v${version_1.VERSION}`);
      diag.error(err.stack || err.message);
      return false;
    }
    api[type] = instance;
    diag.debug(`@opentelemetry/api: Registered a global for ${type} v${version_1.VERSION}.`);
    return true;
  }
  exports.registerGlobal = registerGlobal;
  function getGlobal(type) {
    var _a, _b;
    const globalVersion = (_a = _global[GLOBAL_OPENTELEMETRY_API_KEY]) === null || _a === undefined ? undefined : _a.version;
    if (!globalVersion || !(0, semver_1.isCompatible)(globalVersion)) {
      return;
    }
    return (_b = _global[GLOBAL_OPENTELEMETRY_API_KEY]) === null || _b === undefined ? undefined : _b[type];
  }
  exports.getGlobal = getGlobal;
  function unregisterGlobal(type, diag) {
    diag.debug(`@opentelemetry/api: Unregistering a global for ${type} v${version_1.VERSION}.`);
    const api = _global[GLOBAL_OPENTELEMETRY_API_KEY];
    if (api) {
      delete api[type];
    }
  }
  exports.unregisterGlobal = unregisterGlobal;
});

// node_modules/@opentelemetry/api/build/src/diag/ComponentLogger.js
var require_ComponentLogger = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.DiagComponentLogger = undefined;
  var global_utils_1 = require_global_utils();

  class DiagComponentLogger {
    constructor(props) {
      this._namespace = props.namespace || "DiagComponentLogger";
    }
    debug(...args) {
      return logProxy("debug", this._namespace, args);
    }
    error(...args) {
      return logProxy("error", this._namespace, args);
    }
    info(...args) {
      return logProxy("info", this._namespace, args);
    }
    warn(...args) {
      return logProxy("warn", this._namespace, args);
    }
    verbose(...args) {
      return logProxy("verbose", this._namespace, args);
    }
  }
  exports.DiagComponentLogger = DiagComponentLogger;
  function logProxy(funcName, namespace, args) {
    const logger = (0, global_utils_1.getGlobal)("diag");
    if (!logger) {
      return;
    }
    args.unshift(namespace);
    return logger[funcName](...args);
  }
});

// node_modules/@opentelemetry/api/build/src/diag/types.js
var require_types = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.DiagLogLevel = undefined;
  var DiagLogLevel;
  (function(DiagLogLevel2) {
    DiagLogLevel2[DiagLogLevel2["NONE"] = 0] = "NONE";
    DiagLogLevel2[DiagLogLevel2["ERROR"] = 30] = "ERROR";
    DiagLogLevel2[DiagLogLevel2["WARN"] = 50] = "WARN";
    DiagLogLevel2[DiagLogLevel2["INFO"] = 60] = "INFO";
    DiagLogLevel2[DiagLogLevel2["DEBUG"] = 70] = "DEBUG";
    DiagLogLevel2[DiagLogLevel2["VERBOSE"] = 80] = "VERBOSE";
    DiagLogLevel2[DiagLogLevel2["ALL"] = 9999] = "ALL";
  })(DiagLogLevel = exports.DiagLogLevel || (exports.DiagLogLevel = {}));
});

// node_modules/@opentelemetry/api/build/src/diag/internal/logLevelLogger.js
var require_logLevelLogger = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.createLogLevelDiagLogger = undefined;
  var types_1 = require_types();
  function createLogLevelDiagLogger(maxLevel, logger) {
    if (maxLevel < types_1.DiagLogLevel.NONE) {
      maxLevel = types_1.DiagLogLevel.NONE;
    } else if (maxLevel > types_1.DiagLogLevel.ALL) {
      maxLevel = types_1.DiagLogLevel.ALL;
    }
    logger = logger || {};
    function _filterFunc(funcName, theLevel) {
      const theFunc = logger[funcName];
      if (typeof theFunc === "function" && maxLevel >= theLevel) {
        return theFunc.bind(logger);
      }
      return function() {};
    }
    return {
      error: _filterFunc("error", types_1.DiagLogLevel.ERROR),
      warn: _filterFunc("warn", types_1.DiagLogLevel.WARN),
      info: _filterFunc("info", types_1.DiagLogLevel.INFO),
      debug: _filterFunc("debug", types_1.DiagLogLevel.DEBUG),
      verbose: _filterFunc("verbose", types_1.DiagLogLevel.VERBOSE)
    };
  }
  exports.createLogLevelDiagLogger = createLogLevelDiagLogger;
});

// node_modules/@opentelemetry/api/build/src/api/diag.js
var require_diag = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.DiagAPI = undefined;
  var ComponentLogger_1 = require_ComponentLogger();
  var logLevelLogger_1 = require_logLevelLogger();
  var types_1 = require_types();
  var global_utils_1 = require_global_utils();
  var API_NAME = "diag";

  class DiagAPI {
    constructor() {
      function _logProxy(funcName) {
        return function(...args) {
          const logger = (0, global_utils_1.getGlobal)("diag");
          if (!logger)
            return;
          return logger[funcName](...args);
        };
      }
      const self = this;
      const setLogger = (logger, optionsOrLogLevel = { logLevel: types_1.DiagLogLevel.INFO }) => {
        var _a, _b, _c;
        if (logger === self) {
          const err = new Error("Cannot use diag as the logger for itself. Please use a DiagLogger implementation like ConsoleDiagLogger or a custom implementation");
          self.error((_a = err.stack) !== null && _a !== undefined ? _a : err.message);
          return false;
        }
        if (typeof optionsOrLogLevel === "number") {
          optionsOrLogLevel = {
            logLevel: optionsOrLogLevel
          };
        }
        const oldLogger = (0, global_utils_1.getGlobal)("diag");
        const newLogger = (0, logLevelLogger_1.createLogLevelDiagLogger)((_b = optionsOrLogLevel.logLevel) !== null && _b !== undefined ? _b : types_1.DiagLogLevel.INFO, logger);
        if (oldLogger && !optionsOrLogLevel.suppressOverrideMessage) {
          const stack = (_c = new Error().stack) !== null && _c !== undefined ? _c : "<failed to generate stacktrace>";
          oldLogger.warn(`Current logger will be overwritten from ${stack}`);
          newLogger.warn(`Current logger will overwrite one already registered from ${stack}`);
        }
        return (0, global_utils_1.registerGlobal)("diag", newLogger, self, true);
      };
      self.setLogger = setLogger;
      self.disable = () => {
        (0, global_utils_1.unregisterGlobal)(API_NAME, self);
      };
      self.createComponentLogger = (options) => {
        return new ComponentLogger_1.DiagComponentLogger(options);
      };
      self.verbose = _logProxy("verbose");
      self.debug = _logProxy("debug");
      self.info = _logProxy("info");
      self.warn = _logProxy("warn");
      self.error = _logProxy("error");
    }
    static instance() {
      if (!this._instance) {
        this._instance = new DiagAPI;
      }
      return this._instance;
    }
  }
  exports.DiagAPI = DiagAPI;
});

// node_modules/@opentelemetry/api/build/src/baggage/internal/baggage-impl.js
var require_baggage_impl = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.BaggageImpl = undefined;

  class BaggageImpl {
    constructor(entries) {
      this._entries = entries ? new Map(entries) : new Map;
    }
    getEntry(key) {
      const entry = this._entries.get(key);
      if (!entry) {
        return;
      }
      return Object.assign({}, entry);
    }
    getAllEntries() {
      return Array.from(this._entries.entries()).map(([k, v]) => [k, v]);
    }
    setEntry(key, entry) {
      const newBaggage = new BaggageImpl(this._entries);
      newBaggage._entries.set(key, entry);
      return newBaggage;
    }
    removeEntry(key) {
      const newBaggage = new BaggageImpl(this._entries);
      newBaggage._entries.delete(key);
      return newBaggage;
    }
    removeEntries(...keys) {
      const newBaggage = new BaggageImpl(this._entries);
      for (const key of keys) {
        newBaggage._entries.delete(key);
      }
      return newBaggage;
    }
    clear() {
      return new BaggageImpl;
    }
  }
  exports.BaggageImpl = BaggageImpl;
});

// node_modules/@opentelemetry/api/build/src/baggage/internal/symbol.js
var require_symbol = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.baggageEntryMetadataSymbol = undefined;
  exports.baggageEntryMetadataSymbol = Symbol("BaggageEntryMetadata");
});

// node_modules/@opentelemetry/api/build/src/baggage/utils.js
var require_utils = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.baggageEntryMetadataFromString = exports.createBaggage = undefined;
  var diag_1 = require_diag();
  var baggage_impl_1 = require_baggage_impl();
  var symbol_1 = require_symbol();
  var diag = diag_1.DiagAPI.instance();
  function createBaggage(entries = {}) {
    return new baggage_impl_1.BaggageImpl(new Map(Object.entries(entries)));
  }
  exports.createBaggage = createBaggage;
  function baggageEntryMetadataFromString(str) {
    if (typeof str !== "string") {
      diag.error(`Cannot create baggage metadata from unknown type: ${typeof str}`);
      str = "";
    }
    return {
      __TYPE__: symbol_1.baggageEntryMetadataSymbol,
      toString() {
        return str;
      }
    };
  }
  exports.baggageEntryMetadataFromString = baggageEntryMetadataFromString;
});

// node_modules/@opentelemetry/api/build/src/context/context.js
var require_context = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.ROOT_CONTEXT = exports.createContextKey = undefined;
  function createContextKey(description) {
    return Symbol.for(description);
  }
  exports.createContextKey = createContextKey;

  class BaseContext {
    constructor(parentContext) {
      const self = this;
      self._currentContext = parentContext ? new Map(parentContext) : new Map;
      self.getValue = (key) => self._currentContext.get(key);
      self.setValue = (key, value) => {
        const context = new BaseContext(self._currentContext);
        context._currentContext.set(key, value);
        return context;
      };
      self.deleteValue = (key) => {
        const context = new BaseContext(self._currentContext);
        context._currentContext.delete(key);
        return context;
      };
    }
  }
  exports.ROOT_CONTEXT = new BaseContext;
});

// node_modules/@opentelemetry/api/build/src/diag/consoleLogger.js
var require_consoleLogger = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.DiagConsoleLogger = undefined;
  var consoleMap = [
    { n: "error", c: "error" },
    { n: "warn", c: "warn" },
    { n: "info", c: "info" },
    { n: "debug", c: "debug" },
    { n: "verbose", c: "trace" }
  ];

  class DiagConsoleLogger {
    constructor() {
      function _consoleFunc(funcName) {
        return function(...args) {
          if (console) {
            let theFunc = console[funcName];
            if (typeof theFunc !== "function") {
              theFunc = console.log;
            }
            if (typeof theFunc === "function") {
              return theFunc.apply(console, args);
            }
          }
        };
      }
      for (let i = 0;i < consoleMap.length; i++) {
        this[consoleMap[i].n] = _consoleFunc(consoleMap[i].c);
      }
    }
  }
  exports.DiagConsoleLogger = DiagConsoleLogger;
});

// node_modules/@opentelemetry/api/build/src/metrics/NoopMeter.js
var require_NoopMeter = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.createNoopMeter = exports.NOOP_OBSERVABLE_UP_DOWN_COUNTER_METRIC = exports.NOOP_OBSERVABLE_GAUGE_METRIC = exports.NOOP_OBSERVABLE_COUNTER_METRIC = exports.NOOP_UP_DOWN_COUNTER_METRIC = exports.NOOP_HISTOGRAM_METRIC = exports.NOOP_GAUGE_METRIC = exports.NOOP_COUNTER_METRIC = exports.NOOP_METER = exports.NoopObservableUpDownCounterMetric = exports.NoopObservableGaugeMetric = exports.NoopObservableCounterMetric = exports.NoopObservableMetric = exports.NoopHistogramMetric = exports.NoopGaugeMetric = exports.NoopUpDownCounterMetric = exports.NoopCounterMetric = exports.NoopMetric = exports.NoopMeter = undefined;

  class NoopMeter {
    constructor() {}
    createGauge(_name, _options) {
      return exports.NOOP_GAUGE_METRIC;
    }
    createHistogram(_name, _options) {
      return exports.NOOP_HISTOGRAM_METRIC;
    }
    createCounter(_name, _options) {
      return exports.NOOP_COUNTER_METRIC;
    }
    createUpDownCounter(_name, _options) {
      return exports.NOOP_UP_DOWN_COUNTER_METRIC;
    }
    createObservableGauge(_name, _options) {
      return exports.NOOP_OBSERVABLE_GAUGE_METRIC;
    }
    createObservableCounter(_name, _options) {
      return exports.NOOP_OBSERVABLE_COUNTER_METRIC;
    }
    createObservableUpDownCounter(_name, _options) {
      return exports.NOOP_OBSERVABLE_UP_DOWN_COUNTER_METRIC;
    }
    addBatchObservableCallback(_callback, _observables) {}
    removeBatchObservableCallback(_callback) {}
  }
  exports.NoopMeter = NoopMeter;

  class NoopMetric {
  }
  exports.NoopMetric = NoopMetric;

  class NoopCounterMetric extends NoopMetric {
    add(_value, _attributes) {}
  }
  exports.NoopCounterMetric = NoopCounterMetric;

  class NoopUpDownCounterMetric extends NoopMetric {
    add(_value, _attributes) {}
  }
  exports.NoopUpDownCounterMetric = NoopUpDownCounterMetric;

  class NoopGaugeMetric extends NoopMetric {
    record(_value, _attributes) {}
  }
  exports.NoopGaugeMetric = NoopGaugeMetric;

  class NoopHistogramMetric extends NoopMetric {
    record(_value, _attributes) {}
  }
  exports.NoopHistogramMetric = NoopHistogramMetric;

  class NoopObservableMetric {
    addCallback(_callback) {}
    removeCallback(_callback) {}
  }
  exports.NoopObservableMetric = NoopObservableMetric;

  class NoopObservableCounterMetric extends NoopObservableMetric {
  }
  exports.NoopObservableCounterMetric = NoopObservableCounterMetric;

  class NoopObservableGaugeMetric extends NoopObservableMetric {
  }
  exports.NoopObservableGaugeMetric = NoopObservableGaugeMetric;

  class NoopObservableUpDownCounterMetric extends NoopObservableMetric {
  }
  exports.NoopObservableUpDownCounterMetric = NoopObservableUpDownCounterMetric;
  exports.NOOP_METER = new NoopMeter;
  exports.NOOP_COUNTER_METRIC = new NoopCounterMetric;
  exports.NOOP_GAUGE_METRIC = new NoopGaugeMetric;
  exports.NOOP_HISTOGRAM_METRIC = new NoopHistogramMetric;
  exports.NOOP_UP_DOWN_COUNTER_METRIC = new NoopUpDownCounterMetric;
  exports.NOOP_OBSERVABLE_COUNTER_METRIC = new NoopObservableCounterMetric;
  exports.NOOP_OBSERVABLE_GAUGE_METRIC = new NoopObservableGaugeMetric;
  exports.NOOP_OBSERVABLE_UP_DOWN_COUNTER_METRIC = new NoopObservableUpDownCounterMetric;
  function createNoopMeter() {
    return exports.NOOP_METER;
  }
  exports.createNoopMeter = createNoopMeter;
});

// node_modules/@opentelemetry/api/build/src/metrics/Metric.js
var require_Metric = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.ValueType = undefined;
  var ValueType;
  (function(ValueType2) {
    ValueType2[ValueType2["INT"] = 0] = "INT";
    ValueType2[ValueType2["DOUBLE"] = 1] = "DOUBLE";
  })(ValueType = exports.ValueType || (exports.ValueType = {}));
});

// node_modules/@opentelemetry/api/build/src/propagation/TextMapPropagator.js
var require_TextMapPropagator = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.defaultTextMapSetter = exports.defaultTextMapGetter = undefined;
  exports.defaultTextMapGetter = {
    get(carrier, key) {
      if (carrier == null) {
        return;
      }
      return carrier[key];
    },
    keys(carrier) {
      if (carrier == null) {
        return [];
      }
      return Object.keys(carrier);
    }
  };
  exports.defaultTextMapSetter = {
    set(carrier, key, value) {
      if (carrier == null) {
        return;
      }
      carrier[key] = value;
    }
  };
});

// node_modules/@opentelemetry/api/build/src/context/NoopContextManager.js
var require_NoopContextManager = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.NoopContextManager = undefined;
  var context_1 = require_context();

  class NoopContextManager {
    active() {
      return context_1.ROOT_CONTEXT;
    }
    with(_context, fn, thisArg, ...args) {
      return fn.call(thisArg, ...args);
    }
    bind(_context, target) {
      return target;
    }
    enable() {
      return this;
    }
    disable() {
      return this;
    }
  }
  exports.NoopContextManager = NoopContextManager;
});

// node_modules/@opentelemetry/api/build/src/api/context.js
var require_context2 = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.ContextAPI = undefined;
  var NoopContextManager_1 = require_NoopContextManager();
  var global_utils_1 = require_global_utils();
  var diag_1 = require_diag();
  var API_NAME = "context";
  var NOOP_CONTEXT_MANAGER = new NoopContextManager_1.NoopContextManager;

  class ContextAPI {
    constructor() {}
    static getInstance() {
      if (!this._instance) {
        this._instance = new ContextAPI;
      }
      return this._instance;
    }
    setGlobalContextManager(contextManager) {
      return (0, global_utils_1.registerGlobal)(API_NAME, contextManager, diag_1.DiagAPI.instance());
    }
    active() {
      return this._getContextManager().active();
    }
    with(context, fn, thisArg, ...args) {
      return this._getContextManager().with(context, fn, thisArg, ...args);
    }
    bind(context, target) {
      return this._getContextManager().bind(context, target);
    }
    _getContextManager() {
      return (0, global_utils_1.getGlobal)(API_NAME) || NOOP_CONTEXT_MANAGER;
    }
    disable() {
      this._getContextManager().disable();
      (0, global_utils_1.unregisterGlobal)(API_NAME, diag_1.DiagAPI.instance());
    }
  }
  exports.ContextAPI = ContextAPI;
});

// node_modules/@opentelemetry/api/build/src/trace/trace_flags.js
var require_trace_flags = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.TraceFlags = undefined;
  var TraceFlags;
  (function(TraceFlags2) {
    TraceFlags2[TraceFlags2["NONE"] = 0] = "NONE";
    TraceFlags2[TraceFlags2["SAMPLED"] = 1] = "SAMPLED";
  })(TraceFlags = exports.TraceFlags || (exports.TraceFlags = {}));
});

// node_modules/@opentelemetry/api/build/src/trace/invalid-span-constants.js
var require_invalid_span_constants = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.INVALID_SPAN_CONTEXT = exports.INVALID_TRACEID = exports.INVALID_SPANID = undefined;
  var trace_flags_1 = require_trace_flags();
  exports.INVALID_SPANID = "0000000000000000";
  exports.INVALID_TRACEID = "00000000000000000000000000000000";
  exports.INVALID_SPAN_CONTEXT = {
    traceId: exports.INVALID_TRACEID,
    spanId: exports.INVALID_SPANID,
    traceFlags: trace_flags_1.TraceFlags.NONE
  };
});

// node_modules/@opentelemetry/api/build/src/trace/NonRecordingSpan.js
var require_NonRecordingSpan = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.NonRecordingSpan = undefined;
  var invalid_span_constants_1 = require_invalid_span_constants();

  class NonRecordingSpan {
    constructor(_spanContext = invalid_span_constants_1.INVALID_SPAN_CONTEXT) {
      this._spanContext = _spanContext;
    }
    spanContext() {
      return this._spanContext;
    }
    setAttribute(_key, _value) {
      return this;
    }
    setAttributes(_attributes) {
      return this;
    }
    addEvent(_name, _attributes) {
      return this;
    }
    addLink(_link) {
      return this;
    }
    addLinks(_links) {
      return this;
    }
    setStatus(_status) {
      return this;
    }
    updateName(_name) {
      return this;
    }
    end(_endTime) {}
    isRecording() {
      return false;
    }
    recordException(_exception, _time) {}
  }
  exports.NonRecordingSpan = NonRecordingSpan;
});

// node_modules/@opentelemetry/api/build/src/trace/context-utils.js
var require_context_utils = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.getSpanContext = exports.setSpanContext = exports.deleteSpan = exports.setSpan = exports.getActiveSpan = exports.getSpan = undefined;
  var context_1 = require_context();
  var NonRecordingSpan_1 = require_NonRecordingSpan();
  var context_2 = require_context2();
  var SPAN_KEY = (0, context_1.createContextKey)("OpenTelemetry Context Key SPAN");
  function getSpan(context) {
    return context.getValue(SPAN_KEY) || undefined;
  }
  exports.getSpan = getSpan;
  function getActiveSpan() {
    return getSpan(context_2.ContextAPI.getInstance().active());
  }
  exports.getActiveSpan = getActiveSpan;
  function setSpan(context, span) {
    return context.setValue(SPAN_KEY, span);
  }
  exports.setSpan = setSpan;
  function deleteSpan(context) {
    return context.deleteValue(SPAN_KEY);
  }
  exports.deleteSpan = deleteSpan;
  function setSpanContext(context, spanContext) {
    return setSpan(context, new NonRecordingSpan_1.NonRecordingSpan(spanContext));
  }
  exports.setSpanContext = setSpanContext;
  function getSpanContext(context) {
    var _a;
    return (_a = getSpan(context)) === null || _a === undefined ? undefined : _a.spanContext();
  }
  exports.getSpanContext = getSpanContext;
});

// node_modules/@opentelemetry/api/build/src/trace/spancontext-utils.js
var require_spancontext_utils = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.wrapSpanContext = exports.isSpanContextValid = exports.isValidSpanId = exports.isValidTraceId = undefined;
  var invalid_span_constants_1 = require_invalid_span_constants();
  var NonRecordingSpan_1 = require_NonRecordingSpan();
  var VALID_TRACEID_REGEX = /^([0-9a-f]{32})$/i;
  var VALID_SPANID_REGEX = /^[0-9a-f]{16}$/i;
  function isValidTraceId(traceId) {
    return VALID_TRACEID_REGEX.test(traceId) && traceId !== invalid_span_constants_1.INVALID_TRACEID;
  }
  exports.isValidTraceId = isValidTraceId;
  function isValidSpanId(spanId) {
    return VALID_SPANID_REGEX.test(spanId) && spanId !== invalid_span_constants_1.INVALID_SPANID;
  }
  exports.isValidSpanId = isValidSpanId;
  function isSpanContextValid(spanContext) {
    return isValidTraceId(spanContext.traceId) && isValidSpanId(spanContext.spanId);
  }
  exports.isSpanContextValid = isSpanContextValid;
  function wrapSpanContext(spanContext) {
    return new NonRecordingSpan_1.NonRecordingSpan(spanContext);
  }
  exports.wrapSpanContext = wrapSpanContext;
});

// node_modules/@opentelemetry/api/build/src/trace/NoopTracer.js
var require_NoopTracer = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.NoopTracer = undefined;
  var context_1 = require_context2();
  var context_utils_1 = require_context_utils();
  var NonRecordingSpan_1 = require_NonRecordingSpan();
  var spancontext_utils_1 = require_spancontext_utils();
  var contextApi = context_1.ContextAPI.getInstance();

  class NoopTracer {
    startSpan(name, options, context = contextApi.active()) {
      const root = Boolean(options === null || options === undefined ? undefined : options.root);
      if (root) {
        return new NonRecordingSpan_1.NonRecordingSpan;
      }
      const parentFromContext = context && (0, context_utils_1.getSpanContext)(context);
      if (isSpanContext(parentFromContext) && (0, spancontext_utils_1.isSpanContextValid)(parentFromContext)) {
        return new NonRecordingSpan_1.NonRecordingSpan(parentFromContext);
      } else {
        return new NonRecordingSpan_1.NonRecordingSpan;
      }
    }
    startActiveSpan(name, arg2, arg3, arg4) {
      let opts;
      let ctx;
      let fn;
      if (arguments.length < 2) {
        return;
      } else if (arguments.length === 2) {
        fn = arg2;
      } else if (arguments.length === 3) {
        opts = arg2;
        fn = arg3;
      } else {
        opts = arg2;
        ctx = arg3;
        fn = arg4;
      }
      const parentContext = ctx !== null && ctx !== undefined ? ctx : contextApi.active();
      const span = this.startSpan(name, opts, parentContext);
      const contextWithSpanSet = (0, context_utils_1.setSpan)(parentContext, span);
      return contextApi.with(contextWithSpanSet, fn, undefined, span);
    }
  }
  exports.NoopTracer = NoopTracer;
  function isSpanContext(spanContext) {
    return typeof spanContext === "object" && typeof spanContext["spanId"] === "string" && typeof spanContext["traceId"] === "string" && typeof spanContext["traceFlags"] === "number";
  }
});

// node_modules/@opentelemetry/api/build/src/trace/ProxyTracer.js
var require_ProxyTracer = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.ProxyTracer = undefined;
  var NoopTracer_1 = require_NoopTracer();
  var NOOP_TRACER = new NoopTracer_1.NoopTracer;

  class ProxyTracer {
    constructor(_provider, name, version, options) {
      this._provider = _provider;
      this.name = name;
      this.version = version;
      this.options = options;
    }
    startSpan(name, options, context) {
      return this._getTracer().startSpan(name, options, context);
    }
    startActiveSpan(_name, _options, _context, _fn) {
      const tracer = this._getTracer();
      return Reflect.apply(tracer.startActiveSpan, tracer, arguments);
    }
    _getTracer() {
      if (this._delegate) {
        return this._delegate;
      }
      const tracer = this._provider.getDelegateTracer(this.name, this.version, this.options);
      if (!tracer) {
        return NOOP_TRACER;
      }
      this._delegate = tracer;
      return this._delegate;
    }
  }
  exports.ProxyTracer = ProxyTracer;
});

// node_modules/@opentelemetry/api/build/src/trace/NoopTracerProvider.js
var require_NoopTracerProvider = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.NoopTracerProvider = undefined;
  var NoopTracer_1 = require_NoopTracer();

  class NoopTracerProvider {
    getTracer(_name, _version, _options) {
      return new NoopTracer_1.NoopTracer;
    }
  }
  exports.NoopTracerProvider = NoopTracerProvider;
});

// node_modules/@opentelemetry/api/build/src/trace/ProxyTracerProvider.js
var require_ProxyTracerProvider = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.ProxyTracerProvider = undefined;
  var ProxyTracer_1 = require_ProxyTracer();
  var NoopTracerProvider_1 = require_NoopTracerProvider();
  var NOOP_TRACER_PROVIDER = new NoopTracerProvider_1.NoopTracerProvider;

  class ProxyTracerProvider {
    getTracer(name, version, options) {
      var _a;
      return (_a = this.getDelegateTracer(name, version, options)) !== null && _a !== undefined ? _a : new ProxyTracer_1.ProxyTracer(this, name, version, options);
    }
    getDelegate() {
      var _a;
      return (_a = this._delegate) !== null && _a !== undefined ? _a : NOOP_TRACER_PROVIDER;
    }
    setDelegate(delegate) {
      this._delegate = delegate;
    }
    getDelegateTracer(name, version, options) {
      var _a;
      return (_a = this._delegate) === null || _a === undefined ? undefined : _a.getTracer(name, version, options);
    }
  }
  exports.ProxyTracerProvider = ProxyTracerProvider;
});

// node_modules/@opentelemetry/api/build/src/trace/SamplingResult.js
var require_SamplingResult = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.SamplingDecision = undefined;
  var SamplingDecision;
  (function(SamplingDecision2) {
    SamplingDecision2[SamplingDecision2["NOT_RECORD"] = 0] = "NOT_RECORD";
    SamplingDecision2[SamplingDecision2["RECORD"] = 1] = "RECORD";
    SamplingDecision2[SamplingDecision2["RECORD_AND_SAMPLED"] = 2] = "RECORD_AND_SAMPLED";
  })(SamplingDecision = exports.SamplingDecision || (exports.SamplingDecision = {}));
});

// node_modules/@opentelemetry/api/build/src/trace/span_kind.js
var require_span_kind = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.SpanKind = undefined;
  var SpanKind;
  (function(SpanKind2) {
    SpanKind2[SpanKind2["INTERNAL"] = 0] = "INTERNAL";
    SpanKind2[SpanKind2["SERVER"] = 1] = "SERVER";
    SpanKind2[SpanKind2["CLIENT"] = 2] = "CLIENT";
    SpanKind2[SpanKind2["PRODUCER"] = 3] = "PRODUCER";
    SpanKind2[SpanKind2["CONSUMER"] = 4] = "CONSUMER";
  })(SpanKind = exports.SpanKind || (exports.SpanKind = {}));
});

// node_modules/@opentelemetry/api/build/src/trace/status.js
var require_status = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.SpanStatusCode = undefined;
  var SpanStatusCode;
  (function(SpanStatusCode2) {
    SpanStatusCode2[SpanStatusCode2["UNSET"] = 0] = "UNSET";
    SpanStatusCode2[SpanStatusCode2["OK"] = 1] = "OK";
    SpanStatusCode2[SpanStatusCode2["ERROR"] = 2] = "ERROR";
  })(SpanStatusCode = exports.SpanStatusCode || (exports.SpanStatusCode = {}));
});

// node_modules/@opentelemetry/api/build/src/trace/internal/tracestate-validators.js
var require_tracestate_validators = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.validateValue = exports.validateKey = undefined;
  var VALID_KEY_CHAR_RANGE = "[_0-9a-z-*/]";
  var VALID_KEY = `[a-z]${VALID_KEY_CHAR_RANGE}{0,255}`;
  var VALID_VENDOR_KEY = `[a-z0-9]${VALID_KEY_CHAR_RANGE}{0,240}@[a-z]${VALID_KEY_CHAR_RANGE}{0,13}`;
  var VALID_KEY_REGEX = new RegExp(`^(?:${VALID_KEY}|${VALID_VENDOR_KEY})$`);
  var VALID_VALUE_BASE_REGEX = /^[ -~]{0,255}[!-~]$/;
  var INVALID_VALUE_COMMA_EQUAL_REGEX = /,|=/;
  function validateKey(key) {
    return VALID_KEY_REGEX.test(key);
  }
  exports.validateKey = validateKey;
  function validateValue(value) {
    return VALID_VALUE_BASE_REGEX.test(value) && !INVALID_VALUE_COMMA_EQUAL_REGEX.test(value);
  }
  exports.validateValue = validateValue;
});

// node_modules/@opentelemetry/api/build/src/trace/internal/tracestate-impl.js
var require_tracestate_impl = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.TraceStateImpl = undefined;
  var tracestate_validators_1 = require_tracestate_validators();
  var MAX_TRACE_STATE_ITEMS = 32;
  var MAX_TRACE_STATE_LEN = 512;
  var LIST_MEMBERS_SEPARATOR = ",";
  var LIST_MEMBER_KEY_VALUE_SPLITTER = "=";

  class TraceStateImpl {
    constructor(rawTraceState) {
      this._internalState = new Map;
      if (rawTraceState)
        this._parse(rawTraceState);
    }
    set(key, value) {
      const traceState = this._clone();
      if (traceState._internalState.has(key)) {
        traceState._internalState.delete(key);
      }
      traceState._internalState.set(key, value);
      return traceState;
    }
    unset(key) {
      const traceState = this._clone();
      traceState._internalState.delete(key);
      return traceState;
    }
    get(key) {
      return this._internalState.get(key);
    }
    serialize() {
      return this._keys().reduce((agg, key) => {
        agg.push(key + LIST_MEMBER_KEY_VALUE_SPLITTER + this.get(key));
        return agg;
      }, []).join(LIST_MEMBERS_SEPARATOR);
    }
    _parse(rawTraceState) {
      if (rawTraceState.length > MAX_TRACE_STATE_LEN)
        return;
      this._internalState = rawTraceState.split(LIST_MEMBERS_SEPARATOR).reverse().reduce((agg, part) => {
        const listMember = part.trim();
        const i = listMember.indexOf(LIST_MEMBER_KEY_VALUE_SPLITTER);
        if (i !== -1) {
          const key = listMember.slice(0, i);
          const value = listMember.slice(i + 1, part.length);
          if ((0, tracestate_validators_1.validateKey)(key) && (0, tracestate_validators_1.validateValue)(value)) {
            agg.set(key, value);
          } else {}
        }
        return agg;
      }, new Map);
      if (this._internalState.size > MAX_TRACE_STATE_ITEMS) {
        this._internalState = new Map(Array.from(this._internalState.entries()).reverse().slice(0, MAX_TRACE_STATE_ITEMS));
      }
    }
    _keys() {
      return Array.from(this._internalState.keys()).reverse();
    }
    _clone() {
      const traceState = new TraceStateImpl;
      traceState._internalState = new Map(this._internalState);
      return traceState;
    }
  }
  exports.TraceStateImpl = TraceStateImpl;
});

// node_modules/@opentelemetry/api/build/src/trace/internal/utils.js
var require_utils2 = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.createTraceState = undefined;
  var tracestate_impl_1 = require_tracestate_impl();
  function createTraceState(rawTraceState) {
    return new tracestate_impl_1.TraceStateImpl(rawTraceState);
  }
  exports.createTraceState = createTraceState;
});

// node_modules/@opentelemetry/api/build/src/context-api.js
var require_context_api = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.context = undefined;
  var context_1 = require_context2();
  exports.context = context_1.ContextAPI.getInstance();
});

// node_modules/@opentelemetry/api/build/src/diag-api.js
var require_diag_api = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.diag = undefined;
  var diag_1 = require_diag();
  exports.diag = diag_1.DiagAPI.instance();
});

// node_modules/@opentelemetry/api/build/src/metrics/NoopMeterProvider.js
var require_NoopMeterProvider = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.NOOP_METER_PROVIDER = exports.NoopMeterProvider = undefined;
  var NoopMeter_1 = require_NoopMeter();

  class NoopMeterProvider {
    getMeter(_name, _version, _options) {
      return NoopMeter_1.NOOP_METER;
    }
  }
  exports.NoopMeterProvider = NoopMeterProvider;
  exports.NOOP_METER_PROVIDER = new NoopMeterProvider;
});

// node_modules/@opentelemetry/api/build/src/api/metrics.js
var require_metrics = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.MetricsAPI = undefined;
  var NoopMeterProvider_1 = require_NoopMeterProvider();
  var global_utils_1 = require_global_utils();
  var diag_1 = require_diag();
  var API_NAME = "metrics";

  class MetricsAPI {
    constructor() {}
    static getInstance() {
      if (!this._instance) {
        this._instance = new MetricsAPI;
      }
      return this._instance;
    }
    setGlobalMeterProvider(provider) {
      return (0, global_utils_1.registerGlobal)(API_NAME, provider, diag_1.DiagAPI.instance());
    }
    getMeterProvider() {
      return (0, global_utils_1.getGlobal)(API_NAME) || NoopMeterProvider_1.NOOP_METER_PROVIDER;
    }
    getMeter(name, version, options) {
      return this.getMeterProvider().getMeter(name, version, options);
    }
    disable() {
      (0, global_utils_1.unregisterGlobal)(API_NAME, diag_1.DiagAPI.instance());
    }
  }
  exports.MetricsAPI = MetricsAPI;
});

// node_modules/@opentelemetry/api/build/src/metrics-api.js
var require_metrics_api = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.metrics = undefined;
  var metrics_1 = require_metrics();
  exports.metrics = metrics_1.MetricsAPI.getInstance();
});

// node_modules/@opentelemetry/api/build/src/propagation/NoopTextMapPropagator.js
var require_NoopTextMapPropagator = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.NoopTextMapPropagator = undefined;

  class NoopTextMapPropagator {
    inject(_context, _carrier) {}
    extract(context, _carrier) {
      return context;
    }
    fields() {
      return [];
    }
  }
  exports.NoopTextMapPropagator = NoopTextMapPropagator;
});

// node_modules/@opentelemetry/api/build/src/baggage/context-helpers.js
var require_context_helpers = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.deleteBaggage = exports.setBaggage = exports.getActiveBaggage = exports.getBaggage = undefined;
  var context_1 = require_context2();
  var context_2 = require_context();
  var BAGGAGE_KEY = (0, context_2.createContextKey)("OpenTelemetry Baggage Key");
  function getBaggage(context) {
    return context.getValue(BAGGAGE_KEY) || undefined;
  }
  exports.getBaggage = getBaggage;
  function getActiveBaggage() {
    return getBaggage(context_1.ContextAPI.getInstance().active());
  }
  exports.getActiveBaggage = getActiveBaggage;
  function setBaggage(context, baggage) {
    return context.setValue(BAGGAGE_KEY, baggage);
  }
  exports.setBaggage = setBaggage;
  function deleteBaggage(context) {
    return context.deleteValue(BAGGAGE_KEY);
  }
  exports.deleteBaggage = deleteBaggage;
});

// node_modules/@opentelemetry/api/build/src/api/propagation.js
var require_propagation = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.PropagationAPI = undefined;
  var global_utils_1 = require_global_utils();
  var NoopTextMapPropagator_1 = require_NoopTextMapPropagator();
  var TextMapPropagator_1 = require_TextMapPropagator();
  var context_helpers_1 = require_context_helpers();
  var utils_1 = require_utils();
  var diag_1 = require_diag();
  var API_NAME = "propagation";
  var NOOP_TEXT_MAP_PROPAGATOR = new NoopTextMapPropagator_1.NoopTextMapPropagator;

  class PropagationAPI {
    constructor() {
      this.createBaggage = utils_1.createBaggage;
      this.getBaggage = context_helpers_1.getBaggage;
      this.getActiveBaggage = context_helpers_1.getActiveBaggage;
      this.setBaggage = context_helpers_1.setBaggage;
      this.deleteBaggage = context_helpers_1.deleteBaggage;
    }
    static getInstance() {
      if (!this._instance) {
        this._instance = new PropagationAPI;
      }
      return this._instance;
    }
    setGlobalPropagator(propagator) {
      return (0, global_utils_1.registerGlobal)(API_NAME, propagator, diag_1.DiagAPI.instance());
    }
    inject(context, carrier, setter = TextMapPropagator_1.defaultTextMapSetter) {
      return this._getGlobalPropagator().inject(context, carrier, setter);
    }
    extract(context, carrier, getter = TextMapPropagator_1.defaultTextMapGetter) {
      return this._getGlobalPropagator().extract(context, carrier, getter);
    }
    fields() {
      return this._getGlobalPropagator().fields();
    }
    disable() {
      (0, global_utils_1.unregisterGlobal)(API_NAME, diag_1.DiagAPI.instance());
    }
    _getGlobalPropagator() {
      return (0, global_utils_1.getGlobal)(API_NAME) || NOOP_TEXT_MAP_PROPAGATOR;
    }
  }
  exports.PropagationAPI = PropagationAPI;
});

// node_modules/@opentelemetry/api/build/src/propagation-api.js
var require_propagation_api = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.propagation = undefined;
  var propagation_1 = require_propagation();
  exports.propagation = propagation_1.PropagationAPI.getInstance();
});

// node_modules/@opentelemetry/api/build/src/api/trace.js
var require_trace = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.TraceAPI = undefined;
  var global_utils_1 = require_global_utils();
  var ProxyTracerProvider_1 = require_ProxyTracerProvider();
  var spancontext_utils_1 = require_spancontext_utils();
  var context_utils_1 = require_context_utils();
  var diag_1 = require_diag();
  var API_NAME = "trace";

  class TraceAPI {
    constructor() {
      this._proxyTracerProvider = new ProxyTracerProvider_1.ProxyTracerProvider;
      this.wrapSpanContext = spancontext_utils_1.wrapSpanContext;
      this.isSpanContextValid = spancontext_utils_1.isSpanContextValid;
      this.deleteSpan = context_utils_1.deleteSpan;
      this.getSpan = context_utils_1.getSpan;
      this.getActiveSpan = context_utils_1.getActiveSpan;
      this.getSpanContext = context_utils_1.getSpanContext;
      this.setSpan = context_utils_1.setSpan;
      this.setSpanContext = context_utils_1.setSpanContext;
    }
    static getInstance() {
      if (!this._instance) {
        this._instance = new TraceAPI;
      }
      return this._instance;
    }
    setGlobalTracerProvider(provider) {
      const success = (0, global_utils_1.registerGlobal)(API_NAME, this._proxyTracerProvider, diag_1.DiagAPI.instance());
      if (success) {
        this._proxyTracerProvider.setDelegate(provider);
      }
      return success;
    }
    getTracerProvider() {
      return (0, global_utils_1.getGlobal)(API_NAME) || this._proxyTracerProvider;
    }
    getTracer(name, version) {
      return this.getTracerProvider().getTracer(name, version);
    }
    disable() {
      (0, global_utils_1.unregisterGlobal)(API_NAME, diag_1.DiagAPI.instance());
      this._proxyTracerProvider = new ProxyTracerProvider_1.ProxyTracerProvider;
    }
  }
  exports.TraceAPI = TraceAPI;
});

// node_modules/@opentelemetry/api/build/src/trace-api.js
var require_trace_api = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.trace = undefined;
  var trace_1 = require_trace();
  exports.trace = trace_1.TraceAPI.getInstance();
});

// node_modules/@opentelemetry/api/build/src/index.js
var require_src = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.trace = exports.propagation = exports.metrics = exports.diag = exports.context = exports.INVALID_SPAN_CONTEXT = exports.INVALID_TRACEID = exports.INVALID_SPANID = exports.isValidSpanId = exports.isValidTraceId = exports.isSpanContextValid = exports.createTraceState = exports.TraceFlags = exports.SpanStatusCode = exports.SpanKind = exports.SamplingDecision = exports.ProxyTracerProvider = exports.ProxyTracer = exports.defaultTextMapSetter = exports.defaultTextMapGetter = exports.ValueType = exports.createNoopMeter = exports.DiagLogLevel = exports.DiagConsoleLogger = exports.ROOT_CONTEXT = exports.createContextKey = exports.baggageEntryMetadataFromString = undefined;
  var utils_1 = require_utils();
  Object.defineProperty(exports, "baggageEntryMetadataFromString", { enumerable: true, get: function() {
    return utils_1.baggageEntryMetadataFromString;
  } });
  var context_1 = require_context();
  Object.defineProperty(exports, "createContextKey", { enumerable: true, get: function() {
    return context_1.createContextKey;
  } });
  Object.defineProperty(exports, "ROOT_CONTEXT", { enumerable: true, get: function() {
    return context_1.ROOT_CONTEXT;
  } });
  var consoleLogger_1 = require_consoleLogger();
  Object.defineProperty(exports, "DiagConsoleLogger", { enumerable: true, get: function() {
    return consoleLogger_1.DiagConsoleLogger;
  } });
  var types_1 = require_types();
  Object.defineProperty(exports, "DiagLogLevel", { enumerable: true, get: function() {
    return types_1.DiagLogLevel;
  } });
  var NoopMeter_1 = require_NoopMeter();
  Object.defineProperty(exports, "createNoopMeter", { enumerable: true, get: function() {
    return NoopMeter_1.createNoopMeter;
  } });
  var Metric_1 = require_Metric();
  Object.defineProperty(exports, "ValueType", { enumerable: true, get: function() {
    return Metric_1.ValueType;
  } });
  var TextMapPropagator_1 = require_TextMapPropagator();
  Object.defineProperty(exports, "defaultTextMapGetter", { enumerable: true, get: function() {
    return TextMapPropagator_1.defaultTextMapGetter;
  } });
  Object.defineProperty(exports, "defaultTextMapSetter", { enumerable: true, get: function() {
    return TextMapPropagator_1.defaultTextMapSetter;
  } });
  var ProxyTracer_1 = require_ProxyTracer();
  Object.defineProperty(exports, "ProxyTracer", { enumerable: true, get: function() {
    return ProxyTracer_1.ProxyTracer;
  } });
  var ProxyTracerProvider_1 = require_ProxyTracerProvider();
  Object.defineProperty(exports, "ProxyTracerProvider", { enumerable: true, get: function() {
    return ProxyTracerProvider_1.ProxyTracerProvider;
  } });
  var SamplingResult_1 = require_SamplingResult();
  Object.defineProperty(exports, "SamplingDecision", { enumerable: true, get: function() {
    return SamplingResult_1.SamplingDecision;
  } });
  var span_kind_1 = require_span_kind();
  Object.defineProperty(exports, "SpanKind", { enumerable: true, get: function() {
    return span_kind_1.SpanKind;
  } });
  var status_1 = require_status();
  Object.defineProperty(exports, "SpanStatusCode", { enumerable: true, get: function() {
    return status_1.SpanStatusCode;
  } });
  var trace_flags_1 = require_trace_flags();
  Object.defineProperty(exports, "TraceFlags", { enumerable: true, get: function() {
    return trace_flags_1.TraceFlags;
  } });
  var utils_2 = require_utils2();
  Object.defineProperty(exports, "createTraceState", { enumerable: true, get: function() {
    return utils_2.createTraceState;
  } });
  var spancontext_utils_1 = require_spancontext_utils();
  Object.defineProperty(exports, "isSpanContextValid", { enumerable: true, get: function() {
    return spancontext_utils_1.isSpanContextValid;
  } });
  Object.defineProperty(exports, "isValidTraceId", { enumerable: true, get: function() {
    return spancontext_utils_1.isValidTraceId;
  } });
  Object.defineProperty(exports, "isValidSpanId", { enumerable: true, get: function() {
    return spancontext_utils_1.isValidSpanId;
  } });
  var invalid_span_constants_1 = require_invalid_span_constants();
  Object.defineProperty(exports, "INVALID_SPANID", { enumerable: true, get: function() {
    return invalid_span_constants_1.INVALID_SPANID;
  } });
  Object.defineProperty(exports, "INVALID_TRACEID", { enumerable: true, get: function() {
    return invalid_span_constants_1.INVALID_TRACEID;
  } });
  Object.defineProperty(exports, "INVALID_SPAN_CONTEXT", { enumerable: true, get: function() {
    return invalid_span_constants_1.INVALID_SPAN_CONTEXT;
  } });
  var context_api_1 = require_context_api();
  Object.defineProperty(exports, "context", { enumerable: true, get: function() {
    return context_api_1.context;
  } });
  var diag_api_1 = require_diag_api();
  Object.defineProperty(exports, "diag", { enumerable: true, get: function() {
    return diag_api_1.diag;
  } });
  var metrics_api_1 = require_metrics_api();
  Object.defineProperty(exports, "metrics", { enumerable: true, get: function() {
    return metrics_api_1.metrics;
  } });
  var propagation_api_1 = require_propagation_api();
  Object.defineProperty(exports, "propagation", { enumerable: true, get: function() {
    return propagation_api_1.propagation;
  } });
  var trace_api_1 = require_trace_api();
  Object.defineProperty(exports, "trace", { enumerable: true, get: function() {
    return trace_api_1.trace;
  } });
  exports.default = {
    context: context_api_1.context,
    diag: diag_api_1.diag,
    metrics: metrics_api_1.metrics,
    propagation: propagation_api_1.propagation,
    trace: trace_api_1.trace
  };
});

// node_modules/@opentelemetry/core/build/src/trace/suppress-tracing.js
var require_suppress_tracing = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.isTracingSuppressed = exports.unsuppressTracing = exports.suppressTracing = undefined;
  var api_1 = require_src();
  var SUPPRESS_TRACING_KEY = (0, api_1.createContextKey)("OpenTelemetry SDK Context Key SUPPRESS_TRACING");
  function suppressTracing(context) {
    return context.setValue(SUPPRESS_TRACING_KEY, true);
  }
  exports.suppressTracing = suppressTracing;
  function unsuppressTracing(context) {
    return context.deleteValue(SUPPRESS_TRACING_KEY);
  }
  exports.unsuppressTracing = unsuppressTracing;
  function isTracingSuppressed(context) {
    return context.getValue(SUPPRESS_TRACING_KEY) === true;
  }
  exports.isTracingSuppressed = isTracingSuppressed;
});

// node_modules/@opentelemetry/core/build/src/baggage/constants.js
var require_constants = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.BAGGAGE_MAX_TOTAL_LENGTH = exports.BAGGAGE_MAX_PER_NAME_VALUE_PAIRS = exports.BAGGAGE_MAX_NAME_VALUE_PAIRS = exports.BAGGAGE_HEADER = exports.BAGGAGE_ITEMS_SEPARATOR = exports.BAGGAGE_PROPERTIES_SEPARATOR = exports.BAGGAGE_KEY_PAIR_SEPARATOR = undefined;
  exports.BAGGAGE_KEY_PAIR_SEPARATOR = "=";
  exports.BAGGAGE_PROPERTIES_SEPARATOR = ";";
  exports.BAGGAGE_ITEMS_SEPARATOR = ",";
  exports.BAGGAGE_HEADER = "baggage";
  exports.BAGGAGE_MAX_NAME_VALUE_PAIRS = 180;
  exports.BAGGAGE_MAX_PER_NAME_VALUE_PAIRS = 4096;
  exports.BAGGAGE_MAX_TOTAL_LENGTH = 8192;
});

// node_modules/@opentelemetry/core/build/src/baggage/utils.js
var require_utils3 = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.parseKeyPairsIntoRecord = exports.parsePairKeyValue = exports.getKeyPairs = exports.serializeKeyPairs = undefined;
  var api_1 = require_src();
  var constants_1 = require_constants();
  function serializeKeyPairs(keyPairs) {
    return keyPairs.reduce((hValue, current) => {
      const value = `${hValue}${hValue !== "" ? constants_1.BAGGAGE_ITEMS_SEPARATOR : ""}${current}`;
      return value.length > constants_1.BAGGAGE_MAX_TOTAL_LENGTH ? hValue : value;
    }, "");
  }
  exports.serializeKeyPairs = serializeKeyPairs;
  function getKeyPairs(baggage) {
    return baggage.getAllEntries().map(([key, value]) => {
      let entry = `${encodeURIComponent(key)}=${encodeURIComponent(value.value)}`;
      if (value.metadata !== undefined) {
        entry += constants_1.BAGGAGE_PROPERTIES_SEPARATOR + value.metadata.toString();
      }
      return entry;
    });
  }
  exports.getKeyPairs = getKeyPairs;
  function parsePairKeyValue(entry) {
    const valueProps = entry.split(constants_1.BAGGAGE_PROPERTIES_SEPARATOR);
    if (valueProps.length <= 0)
      return;
    const keyPairPart = valueProps.shift();
    if (!keyPairPart)
      return;
    const separatorIndex = keyPairPart.indexOf(constants_1.BAGGAGE_KEY_PAIR_SEPARATOR);
    if (separatorIndex <= 0)
      return;
    const key = decodeURIComponent(keyPairPart.substring(0, separatorIndex).trim());
    const value = decodeURIComponent(keyPairPart.substring(separatorIndex + 1).trim());
    let metadata;
    if (valueProps.length > 0) {
      metadata = (0, api_1.baggageEntryMetadataFromString)(valueProps.join(constants_1.BAGGAGE_PROPERTIES_SEPARATOR));
    }
    return { key, value, metadata };
  }
  exports.parsePairKeyValue = parsePairKeyValue;
  function parseKeyPairsIntoRecord(value) {
    if (typeof value !== "string" || value.length === 0)
      return {};
    return value.split(constants_1.BAGGAGE_ITEMS_SEPARATOR).map((entry) => {
      return parsePairKeyValue(entry);
    }).filter((keyPair) => keyPair !== undefined && keyPair.value.length > 0).reduce((headers, keyPair) => {
      headers[keyPair.key] = keyPair.value;
      return headers;
    }, {});
  }
  exports.parseKeyPairsIntoRecord = parseKeyPairsIntoRecord;
});

// node_modules/@opentelemetry/core/build/src/baggage/propagation/W3CBaggagePropagator.js
var require_W3CBaggagePropagator = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.W3CBaggagePropagator = undefined;
  var api_1 = require_src();
  var suppress_tracing_1 = require_suppress_tracing();
  var constants_1 = require_constants();
  var utils_1 = require_utils3();

  class W3CBaggagePropagator {
    inject(context, carrier, setter) {
      const baggage = api_1.propagation.getBaggage(context);
      if (!baggage || (0, suppress_tracing_1.isTracingSuppressed)(context))
        return;
      const keyPairs = (0, utils_1.getKeyPairs)(baggage).filter((pair) => {
        return pair.length <= constants_1.BAGGAGE_MAX_PER_NAME_VALUE_PAIRS;
      }).slice(0, constants_1.BAGGAGE_MAX_NAME_VALUE_PAIRS);
      const headerValue = (0, utils_1.serializeKeyPairs)(keyPairs);
      if (headerValue.length > 0) {
        setter.set(carrier, constants_1.BAGGAGE_HEADER, headerValue);
      }
    }
    extract(context, carrier, getter) {
      const headerValue = getter.get(carrier, constants_1.BAGGAGE_HEADER);
      const baggageString = Array.isArray(headerValue) ? headerValue.join(constants_1.BAGGAGE_ITEMS_SEPARATOR) : headerValue;
      if (!baggageString)
        return context;
      const baggage = {};
      if (baggageString.length === 0) {
        return context;
      }
      const pairs = baggageString.split(constants_1.BAGGAGE_ITEMS_SEPARATOR);
      pairs.forEach((entry) => {
        const keyPair = (0, utils_1.parsePairKeyValue)(entry);
        if (keyPair) {
          const baggageEntry = { value: keyPair.value };
          if (keyPair.metadata) {
            baggageEntry.metadata = keyPair.metadata;
          }
          baggage[keyPair.key] = baggageEntry;
        }
      });
      if (Object.entries(baggage).length === 0) {
        return context;
      }
      return api_1.propagation.setBaggage(context, api_1.propagation.createBaggage(baggage));
    }
    fields() {
      return [constants_1.BAGGAGE_HEADER];
    }
  }
  exports.W3CBaggagePropagator = W3CBaggagePropagator;
});

// node_modules/@opentelemetry/core/build/src/common/anchored-clock.js
var require_anchored_clock = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.AnchoredClock = undefined;

  class AnchoredClock {
    constructor(systemClock, monotonicClock) {
      this._monotonicClock = monotonicClock;
      this._epochMillis = systemClock.now();
      this._performanceMillis = monotonicClock.now();
    }
    now() {
      const delta = this._monotonicClock.now() - this._performanceMillis;
      return this._epochMillis + delta;
    }
  }
  exports.AnchoredClock = AnchoredClock;
});

// node_modules/@opentelemetry/core/build/src/common/attributes.js
var require_attributes = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.isAttributeValue = exports.isAttributeKey = exports.sanitizeAttributes = undefined;
  var api_1 = require_src();
  function sanitizeAttributes(attributes) {
    const out = {};
    if (typeof attributes !== "object" || attributes == null) {
      return out;
    }
    for (const [key, val] of Object.entries(attributes)) {
      if (!isAttributeKey(key)) {
        api_1.diag.warn(`Invalid attribute key: ${key}`);
        continue;
      }
      if (!isAttributeValue(val)) {
        api_1.diag.warn(`Invalid attribute value set for key: ${key}`);
        continue;
      }
      if (Array.isArray(val)) {
        out[key] = val.slice();
      } else {
        out[key] = val;
      }
    }
    return out;
  }
  exports.sanitizeAttributes = sanitizeAttributes;
  function isAttributeKey(key) {
    return typeof key === "string" && key.length > 0;
  }
  exports.isAttributeKey = isAttributeKey;
  function isAttributeValue(val) {
    if (val == null) {
      return true;
    }
    if (Array.isArray(val)) {
      return isHomogeneousAttributeValueArray(val);
    }
    return isValidPrimitiveAttributeValue(val);
  }
  exports.isAttributeValue = isAttributeValue;
  function isHomogeneousAttributeValueArray(arr) {
    let type;
    for (const element of arr) {
      if (element == null)
        continue;
      if (!type) {
        if (isValidPrimitiveAttributeValue(element)) {
          type = typeof element;
          continue;
        }
        return false;
      }
      if (typeof element === type) {
        continue;
      }
      return false;
    }
    return true;
  }
  function isValidPrimitiveAttributeValue(val) {
    switch (typeof val) {
      case "number":
      case "boolean":
      case "string":
        return true;
    }
    return false;
  }
});

// node_modules/@opentelemetry/core/build/src/common/logging-error-handler.js
var require_logging_error_handler = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.loggingErrorHandler = undefined;
  var api_1 = require_src();
  function loggingErrorHandler() {
    return (ex) => {
      api_1.diag.error(stringifyException(ex));
    };
  }
  exports.loggingErrorHandler = loggingErrorHandler;
  function stringifyException(ex) {
    if (typeof ex === "string") {
      return ex;
    } else {
      return JSON.stringify(flattenException(ex));
    }
  }
  function flattenException(ex) {
    const result = {};
    let current = ex;
    while (current !== null) {
      Object.getOwnPropertyNames(current).forEach((propertyName) => {
        if (result[propertyName])
          return;
        const value = current[propertyName];
        if (value) {
          result[propertyName] = String(value);
        }
      });
      current = Object.getPrototypeOf(current);
    }
    return result;
  }
});

// node_modules/@opentelemetry/core/build/src/common/global-error-handler.js
var require_global_error_handler = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.globalErrorHandler = exports.setGlobalErrorHandler = undefined;
  var logging_error_handler_1 = require_logging_error_handler();
  var delegateHandler = (0, logging_error_handler_1.loggingErrorHandler)();
  function setGlobalErrorHandler(handler) {
    delegateHandler = handler;
  }
  exports.setGlobalErrorHandler = setGlobalErrorHandler;
  function globalErrorHandler(ex) {
    try {
      delegateHandler(ex);
    } catch (_a) {}
  }
  exports.globalErrorHandler = globalErrorHandler;
});

// node_modules/@opentelemetry/core/build/src/utils/sampling.js
var require_sampling = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.TracesSamplerValues = undefined;
  var TracesSamplerValues;
  (function(TracesSamplerValues2) {
    TracesSamplerValues2["AlwaysOff"] = "always_off";
    TracesSamplerValues2["AlwaysOn"] = "always_on";
    TracesSamplerValues2["ParentBasedAlwaysOff"] = "parentbased_always_off";
    TracesSamplerValues2["ParentBasedAlwaysOn"] = "parentbased_always_on";
    TracesSamplerValues2["ParentBasedTraceIdRatio"] = "parentbased_traceidratio";
    TracesSamplerValues2["TraceIdRatio"] = "traceidratio";
  })(TracesSamplerValues = exports.TracesSamplerValues || (exports.TracesSamplerValues = {}));
});

// node_modules/@opentelemetry/core/build/src/utils/environment.js
var require_environment = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.parseEnvironment = exports.DEFAULT_ENVIRONMENT = exports.DEFAULT_SPAN_ATTRIBUTE_PER_LINK_COUNT_LIMIT = exports.DEFAULT_SPAN_ATTRIBUTE_PER_EVENT_COUNT_LIMIT = exports.DEFAULT_ATTRIBUTE_COUNT_LIMIT = exports.DEFAULT_ATTRIBUTE_VALUE_LENGTH_LIMIT = undefined;
  var api_1 = require_src();
  var sampling_1 = require_sampling();
  var DEFAULT_LIST_SEPARATOR = ",";
  var ENVIRONMENT_BOOLEAN_KEYS = ["OTEL_SDK_DISABLED"];
  function isEnvVarABoolean(key) {
    return ENVIRONMENT_BOOLEAN_KEYS.indexOf(key) > -1;
  }
  var ENVIRONMENT_NUMBERS_KEYS = [
    "OTEL_BSP_EXPORT_TIMEOUT",
    "OTEL_BSP_MAX_EXPORT_BATCH_SIZE",
    "OTEL_BSP_MAX_QUEUE_SIZE",
    "OTEL_BSP_SCHEDULE_DELAY",
    "OTEL_BLRP_EXPORT_TIMEOUT",
    "OTEL_BLRP_MAX_EXPORT_BATCH_SIZE",
    "OTEL_BLRP_MAX_QUEUE_SIZE",
    "OTEL_BLRP_SCHEDULE_DELAY",
    "OTEL_ATTRIBUTE_VALUE_LENGTH_LIMIT",
    "OTEL_ATTRIBUTE_COUNT_LIMIT",
    "OTEL_SPAN_ATTRIBUTE_VALUE_LENGTH_LIMIT",
    "OTEL_SPAN_ATTRIBUTE_COUNT_LIMIT",
    "OTEL_LOGRECORD_ATTRIBUTE_VALUE_LENGTH_LIMIT",
    "OTEL_LOGRECORD_ATTRIBUTE_COUNT_LIMIT",
    "OTEL_SPAN_EVENT_COUNT_LIMIT",
    "OTEL_SPAN_LINK_COUNT_LIMIT",
    "OTEL_SPAN_ATTRIBUTE_PER_EVENT_COUNT_LIMIT",
    "OTEL_SPAN_ATTRIBUTE_PER_LINK_COUNT_LIMIT",
    "OTEL_EXPORTER_OTLP_TIMEOUT",
    "OTEL_EXPORTER_OTLP_TRACES_TIMEOUT",
    "OTEL_EXPORTER_OTLP_METRICS_TIMEOUT",
    "OTEL_EXPORTER_OTLP_LOGS_TIMEOUT",
    "OTEL_EXPORTER_JAEGER_AGENT_PORT"
  ];
  function isEnvVarANumber(key) {
    return ENVIRONMENT_NUMBERS_KEYS.indexOf(key) > -1;
  }
  var ENVIRONMENT_LISTS_KEYS = [
    "OTEL_NO_PATCH_MODULES",
    "OTEL_PROPAGATORS",
    "OTEL_SEMCONV_STABILITY_OPT_IN"
  ];
  function isEnvVarAList(key) {
    return ENVIRONMENT_LISTS_KEYS.indexOf(key) > -1;
  }
  exports.DEFAULT_ATTRIBUTE_VALUE_LENGTH_LIMIT = Infinity;
  exports.DEFAULT_ATTRIBUTE_COUNT_LIMIT = 128;
  exports.DEFAULT_SPAN_ATTRIBUTE_PER_EVENT_COUNT_LIMIT = 128;
  exports.DEFAULT_SPAN_ATTRIBUTE_PER_LINK_COUNT_LIMIT = 128;
  exports.DEFAULT_ENVIRONMENT = {
    OTEL_SDK_DISABLED: false,
    CONTAINER_NAME: "",
    ECS_CONTAINER_METADATA_URI_V4: "",
    ECS_CONTAINER_METADATA_URI: "",
    HOSTNAME: "",
    KUBERNETES_SERVICE_HOST: "",
    NAMESPACE: "",
    OTEL_BSP_EXPORT_TIMEOUT: 30000,
    OTEL_BSP_MAX_EXPORT_BATCH_SIZE: 512,
    OTEL_BSP_MAX_QUEUE_SIZE: 2048,
    OTEL_BSP_SCHEDULE_DELAY: 5000,
    OTEL_BLRP_EXPORT_TIMEOUT: 30000,
    OTEL_BLRP_MAX_EXPORT_BATCH_SIZE: 512,
    OTEL_BLRP_MAX_QUEUE_SIZE: 2048,
    OTEL_BLRP_SCHEDULE_DELAY: 5000,
    OTEL_EXPORTER_JAEGER_AGENT_HOST: "",
    OTEL_EXPORTER_JAEGER_AGENT_PORT: 6832,
    OTEL_EXPORTER_JAEGER_ENDPOINT: "",
    OTEL_EXPORTER_JAEGER_PASSWORD: "",
    OTEL_EXPORTER_JAEGER_USER: "",
    OTEL_EXPORTER_OTLP_ENDPOINT: "",
    OTEL_EXPORTER_OTLP_TRACES_ENDPOINT: "",
    OTEL_EXPORTER_OTLP_METRICS_ENDPOINT: "",
    OTEL_EXPORTER_OTLP_LOGS_ENDPOINT: "",
    OTEL_EXPORTER_OTLP_HEADERS: "",
    OTEL_EXPORTER_OTLP_TRACES_HEADERS: "",
    OTEL_EXPORTER_OTLP_METRICS_HEADERS: "",
    OTEL_EXPORTER_OTLP_LOGS_HEADERS: "",
    OTEL_EXPORTER_OTLP_TIMEOUT: 1e4,
    OTEL_EXPORTER_OTLP_TRACES_TIMEOUT: 1e4,
    OTEL_EXPORTER_OTLP_METRICS_TIMEOUT: 1e4,
    OTEL_EXPORTER_OTLP_LOGS_TIMEOUT: 1e4,
    OTEL_EXPORTER_ZIPKIN_ENDPOINT: "http://localhost:9411/api/v2/spans",
    OTEL_LOG_LEVEL: api_1.DiagLogLevel.INFO,
    OTEL_NO_PATCH_MODULES: [],
    OTEL_PROPAGATORS: ["tracecontext", "baggage"],
    OTEL_RESOURCE_ATTRIBUTES: "",
    OTEL_SERVICE_NAME: "",
    OTEL_ATTRIBUTE_VALUE_LENGTH_LIMIT: exports.DEFAULT_ATTRIBUTE_VALUE_LENGTH_LIMIT,
    OTEL_ATTRIBUTE_COUNT_LIMIT: exports.DEFAULT_ATTRIBUTE_COUNT_LIMIT,
    OTEL_SPAN_ATTRIBUTE_VALUE_LENGTH_LIMIT: exports.DEFAULT_ATTRIBUTE_VALUE_LENGTH_LIMIT,
    OTEL_SPAN_ATTRIBUTE_COUNT_LIMIT: exports.DEFAULT_ATTRIBUTE_COUNT_LIMIT,
    OTEL_LOGRECORD_ATTRIBUTE_VALUE_LENGTH_LIMIT: exports.DEFAULT_ATTRIBUTE_VALUE_LENGTH_LIMIT,
    OTEL_LOGRECORD_ATTRIBUTE_COUNT_LIMIT: exports.DEFAULT_ATTRIBUTE_COUNT_LIMIT,
    OTEL_SPAN_EVENT_COUNT_LIMIT: 128,
    OTEL_SPAN_LINK_COUNT_LIMIT: 128,
    OTEL_SPAN_ATTRIBUTE_PER_EVENT_COUNT_LIMIT: exports.DEFAULT_SPAN_ATTRIBUTE_PER_EVENT_COUNT_LIMIT,
    OTEL_SPAN_ATTRIBUTE_PER_LINK_COUNT_LIMIT: exports.DEFAULT_SPAN_ATTRIBUTE_PER_LINK_COUNT_LIMIT,
    OTEL_TRACES_EXPORTER: "",
    OTEL_TRACES_SAMPLER: sampling_1.TracesSamplerValues.ParentBasedAlwaysOn,
    OTEL_TRACES_SAMPLER_ARG: "",
    OTEL_LOGS_EXPORTER: "",
    OTEL_EXPORTER_OTLP_INSECURE: "",
    OTEL_EXPORTER_OTLP_TRACES_INSECURE: "",
    OTEL_EXPORTER_OTLP_METRICS_INSECURE: "",
    OTEL_EXPORTER_OTLP_LOGS_INSECURE: "",
    OTEL_EXPORTER_OTLP_CERTIFICATE: "",
    OTEL_EXPORTER_OTLP_TRACES_CERTIFICATE: "",
    OTEL_EXPORTER_OTLP_METRICS_CERTIFICATE: "",
    OTEL_EXPORTER_OTLP_LOGS_CERTIFICATE: "",
    OTEL_EXPORTER_OTLP_COMPRESSION: "",
    OTEL_EXPORTER_OTLP_TRACES_COMPRESSION: "",
    OTEL_EXPORTER_OTLP_METRICS_COMPRESSION: "",
    OTEL_EXPORTER_OTLP_LOGS_COMPRESSION: "",
    OTEL_EXPORTER_OTLP_CLIENT_KEY: "",
    OTEL_EXPORTER_OTLP_TRACES_CLIENT_KEY: "",
    OTEL_EXPORTER_OTLP_METRICS_CLIENT_KEY: "",
    OTEL_EXPORTER_OTLP_LOGS_CLIENT_KEY: "",
    OTEL_EXPORTER_OTLP_CLIENT_CERTIFICATE: "",
    OTEL_EXPORTER_OTLP_TRACES_CLIENT_CERTIFICATE: "",
    OTEL_EXPORTER_OTLP_METRICS_CLIENT_CERTIFICATE: "",
    OTEL_EXPORTER_OTLP_LOGS_CLIENT_CERTIFICATE: "",
    OTEL_EXPORTER_OTLP_PROTOCOL: "http/protobuf",
    OTEL_EXPORTER_OTLP_TRACES_PROTOCOL: "http/protobuf",
    OTEL_EXPORTER_OTLP_METRICS_PROTOCOL: "http/protobuf",
    OTEL_EXPORTER_OTLP_LOGS_PROTOCOL: "http/protobuf",
    OTEL_EXPORTER_OTLP_METRICS_TEMPORALITY_PREFERENCE: "cumulative",
    OTEL_SEMCONV_STABILITY_OPT_IN: []
  };
  function parseBoolean(key, environment, values) {
    if (typeof values[key] === "undefined") {
      return;
    }
    const value = String(values[key]);
    environment[key] = value.toLowerCase() === "true";
  }
  function parseNumber(name, environment, values, min = -Infinity, max = Infinity) {
    if (typeof values[name] !== "undefined") {
      const value = Number(values[name]);
      if (!isNaN(value)) {
        if (value < min) {
          environment[name] = min;
        } else if (value > max) {
          environment[name] = max;
        } else {
          environment[name] = value;
        }
      }
    }
  }
  function parseStringList(name, output, input, separator = DEFAULT_LIST_SEPARATOR) {
    const givenValue = input[name];
    if (typeof givenValue === "string") {
      output[name] = givenValue.split(separator).map((v) => v.trim());
    }
  }
  var logLevelMap = {
    ALL: api_1.DiagLogLevel.ALL,
    VERBOSE: api_1.DiagLogLevel.VERBOSE,
    DEBUG: api_1.DiagLogLevel.DEBUG,
    INFO: api_1.DiagLogLevel.INFO,
    WARN: api_1.DiagLogLevel.WARN,
    ERROR: api_1.DiagLogLevel.ERROR,
    NONE: api_1.DiagLogLevel.NONE
  };
  function setLogLevelFromEnv(key, environment, values) {
    const value = values[key];
    if (typeof value === "string") {
      const theLevel = logLevelMap[value.toUpperCase()];
      if (theLevel != null) {
        environment[key] = theLevel;
      }
    }
  }
  function parseEnvironment(values) {
    const environment = {};
    for (const env in exports.DEFAULT_ENVIRONMENT) {
      const key = env;
      switch (key) {
        case "OTEL_LOG_LEVEL":
          setLogLevelFromEnv(key, environment, values);
          break;
        default:
          if (isEnvVarABoolean(key)) {
            parseBoolean(key, environment, values);
          } else if (isEnvVarANumber(key)) {
            parseNumber(key, environment, values);
          } else if (isEnvVarAList(key)) {
            parseStringList(key, environment, values);
          } else {
            const value = values[key];
            if (typeof value !== "undefined" && value !== null) {
              environment[key] = String(value);
            }
          }
      }
    }
    return environment;
  }
  exports.parseEnvironment = parseEnvironment;
});

// node_modules/@opentelemetry/core/build/src/platform/node/environment.js
var require_environment2 = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.getEnvWithoutDefaults = exports.getEnv = undefined;
  var environment_1 = require_environment();
  function getEnv() {
    const processEnv = (0, environment_1.parseEnvironment)(process.env);
    return Object.assign({}, environment_1.DEFAULT_ENVIRONMENT, processEnv);
  }
  exports.getEnv = getEnv;
  function getEnvWithoutDefaults() {
    return (0, environment_1.parseEnvironment)(process.env);
  }
  exports.getEnvWithoutDefaults = getEnvWithoutDefaults;
});

// node_modules/@opentelemetry/core/build/src/platform/node/globalThis.js
var require_globalThis2 = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports._globalThis = undefined;
  exports._globalThis = typeof globalThis === "object" ? globalThis : global;
});

// node_modules/@opentelemetry/core/build/src/common/hex-to-binary.js
var require_hex_to_binary = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.hexToBinary = undefined;
  function intValue(charCode) {
    if (charCode >= 48 && charCode <= 57) {
      return charCode - 48;
    }
    if (charCode >= 97 && charCode <= 102) {
      return charCode - 87;
    }
    return charCode - 55;
  }
  function hexToBinary(hexStr) {
    const buf = new Uint8Array(hexStr.length / 2);
    let offset = 0;
    for (let i = 0;i < hexStr.length; i += 2) {
      const hi = intValue(hexStr.charCodeAt(i));
      const lo = intValue(hexStr.charCodeAt(i + 1));
      buf[offset++] = hi << 4 | lo;
    }
    return buf;
  }
  exports.hexToBinary = hexToBinary;
});

// node_modules/@opentelemetry/core/build/src/platform/node/hex-to-base64.js
var require_hex_to_base64 = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.hexToBase64 = undefined;
  var hex_to_binary_1 = require_hex_to_binary();
  function hexToBase64(hexStr) {
    return Buffer.from((0, hex_to_binary_1.hexToBinary)(hexStr)).toString("base64");
  }
  exports.hexToBase64 = hexToBase64;
});

// node_modules/@opentelemetry/core/build/src/platform/node/RandomIdGenerator.js
var require_RandomIdGenerator = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.RandomIdGenerator = undefined;
  var SPAN_ID_BYTES = 8;
  var TRACE_ID_BYTES = 16;

  class RandomIdGenerator {
    constructor() {
      this.generateTraceId = getIdGenerator(TRACE_ID_BYTES);
      this.generateSpanId = getIdGenerator(SPAN_ID_BYTES);
    }
  }
  exports.RandomIdGenerator = RandomIdGenerator;
  var SHARED_BUFFER = Buffer.allocUnsafe(TRACE_ID_BYTES);
  function getIdGenerator(bytes) {
    return function generateId() {
      for (let i = 0;i < bytes / 4; i++) {
        SHARED_BUFFER.writeUInt32BE(Math.random() * 2 ** 32 >>> 0, i * 4);
      }
      for (let i = 0;i < bytes; i++) {
        if (SHARED_BUFFER[i] > 0) {
          break;
        } else if (i === bytes - 1) {
          SHARED_BUFFER[bytes - 1] = 1;
        }
      }
      return SHARED_BUFFER.toString("hex", 0, bytes);
    };
  }
});

// node_modules/@opentelemetry/core/build/src/platform/node/performance.js
var require_performance = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.otperformance = undefined;
  var perf_hooks_1 = __require("perf_hooks");
  exports.otperformance = perf_hooks_1.performance;
});

// node_modules/@opentelemetry/core/build/src/version.js
var require_version2 = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.VERSION = undefined;
  exports.VERSION = "1.30.1";
});

// node_modules/@opentelemetry/core/node_modules/@opentelemetry/semantic-conventions/build/src/internal/utils.js
var require_utils4 = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.createConstMap = undefined;
  function createConstMap(values) {
    let res = {};
    const len = values.length;
    for (let lp = 0;lp < len; lp++) {
      const val = values[lp];
      if (val) {
        res[String(val).toUpperCase().replace(/[-.]/g, "_")] = val;
      }
    }
    return res;
  }
  exports.createConstMap = createConstMap;
});

// node_modules/@opentelemetry/core/node_modules/@opentelemetry/semantic-conventions/build/src/trace/SemanticAttributes.js
var require_SemanticAttributes = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.SEMATTRS_NET_HOST_CARRIER_ICC = exports.SEMATTRS_NET_HOST_CARRIER_MNC = exports.SEMATTRS_NET_HOST_CARRIER_MCC = exports.SEMATTRS_NET_HOST_CARRIER_NAME = exports.SEMATTRS_NET_HOST_CONNECTION_SUBTYPE = exports.SEMATTRS_NET_HOST_CONNECTION_TYPE = exports.SEMATTRS_NET_HOST_NAME = exports.SEMATTRS_NET_HOST_PORT = exports.SEMATTRS_NET_HOST_IP = exports.SEMATTRS_NET_PEER_NAME = exports.SEMATTRS_NET_PEER_PORT = exports.SEMATTRS_NET_PEER_IP = exports.SEMATTRS_NET_TRANSPORT = exports.SEMATTRS_FAAS_INVOKED_REGION = exports.SEMATTRS_FAAS_INVOKED_PROVIDER = exports.SEMATTRS_FAAS_INVOKED_NAME = exports.SEMATTRS_FAAS_COLDSTART = exports.SEMATTRS_FAAS_CRON = exports.SEMATTRS_FAAS_TIME = exports.SEMATTRS_FAAS_DOCUMENT_NAME = exports.SEMATTRS_FAAS_DOCUMENT_TIME = exports.SEMATTRS_FAAS_DOCUMENT_OPERATION = exports.SEMATTRS_FAAS_DOCUMENT_COLLECTION = exports.SEMATTRS_FAAS_EXECUTION = exports.SEMATTRS_FAAS_TRIGGER = exports.SEMATTRS_EXCEPTION_ESCAPED = exports.SEMATTRS_EXCEPTION_STACKTRACE = exports.SEMATTRS_EXCEPTION_MESSAGE = exports.SEMATTRS_EXCEPTION_TYPE = exports.SEMATTRS_DB_SQL_TABLE = exports.SEMATTRS_DB_MONGODB_COLLECTION = exports.SEMATTRS_DB_REDIS_DATABASE_INDEX = exports.SEMATTRS_DB_HBASE_NAMESPACE = exports.SEMATTRS_DB_CASSANDRA_COORDINATOR_DC = exports.SEMATTRS_DB_CASSANDRA_COORDINATOR_ID = exports.SEMATTRS_DB_CASSANDRA_SPECULATIVE_EXECUTION_COUNT = exports.SEMATTRS_DB_CASSANDRA_IDEMPOTENCE = exports.SEMATTRS_DB_CASSANDRA_TABLE = exports.SEMATTRS_DB_CASSANDRA_CONSISTENCY_LEVEL = exports.SEMATTRS_DB_CASSANDRA_PAGE_SIZE = exports.SEMATTRS_DB_CASSANDRA_KEYSPACE = exports.SEMATTRS_DB_MSSQL_INSTANCE_NAME = exports.SEMATTRS_DB_OPERATION = exports.SEMATTRS_DB_STATEMENT = exports.SEMATTRS_DB_NAME = exports.SEMATTRS_DB_JDBC_DRIVER_CLASSNAME = exports.SEMATTRS_DB_USER = exports.SEMATTRS_DB_CONNECTION_STRING = exports.SEMATTRS_DB_SYSTEM = exports.SEMATTRS_AWS_LAMBDA_INVOKED_ARN = undefined;
  exports.SEMATTRS_MESSAGING_DESTINATION_KIND = exports.SEMATTRS_MESSAGING_DESTINATION = exports.SEMATTRS_MESSAGING_SYSTEM = exports.SEMATTRS_AWS_DYNAMODB_GLOBAL_SECONDARY_INDEX_UPDATES = exports.SEMATTRS_AWS_DYNAMODB_ATTRIBUTE_DEFINITIONS = exports.SEMATTRS_AWS_DYNAMODB_SCANNED_COUNT = exports.SEMATTRS_AWS_DYNAMODB_COUNT = exports.SEMATTRS_AWS_DYNAMODB_TOTAL_SEGMENTS = exports.SEMATTRS_AWS_DYNAMODB_SEGMENT = exports.SEMATTRS_AWS_DYNAMODB_SCAN_FORWARD = exports.SEMATTRS_AWS_DYNAMODB_TABLE_COUNT = exports.SEMATTRS_AWS_DYNAMODB_EXCLUSIVE_START_TABLE = exports.SEMATTRS_AWS_DYNAMODB_LOCAL_SECONDARY_INDEXES = exports.SEMATTRS_AWS_DYNAMODB_GLOBAL_SECONDARY_INDEXES = exports.SEMATTRS_AWS_DYNAMODB_SELECT = exports.SEMATTRS_AWS_DYNAMODB_INDEX_NAME = exports.SEMATTRS_AWS_DYNAMODB_ATTRIBUTES_TO_GET = exports.SEMATTRS_AWS_DYNAMODB_LIMIT = exports.SEMATTRS_AWS_DYNAMODB_PROJECTION = exports.SEMATTRS_AWS_DYNAMODB_CONSISTENT_READ = exports.SEMATTRS_AWS_DYNAMODB_PROVISIONED_WRITE_CAPACITY = exports.SEMATTRS_AWS_DYNAMODB_PROVISIONED_READ_CAPACITY = exports.SEMATTRS_AWS_DYNAMODB_ITEM_COLLECTION_METRICS = exports.SEMATTRS_AWS_DYNAMODB_CONSUMED_CAPACITY = exports.SEMATTRS_AWS_DYNAMODB_TABLE_NAMES = exports.SEMATTRS_HTTP_CLIENT_IP = exports.SEMATTRS_HTTP_ROUTE = exports.SEMATTRS_HTTP_SERVER_NAME = exports.SEMATTRS_HTTP_RESPONSE_CONTENT_LENGTH_UNCOMPRESSED = exports.SEMATTRS_HTTP_RESPONSE_CONTENT_LENGTH = exports.SEMATTRS_HTTP_REQUEST_CONTENT_LENGTH_UNCOMPRESSED = exports.SEMATTRS_HTTP_REQUEST_CONTENT_LENGTH = exports.SEMATTRS_HTTP_USER_AGENT = exports.SEMATTRS_HTTP_FLAVOR = exports.SEMATTRS_HTTP_STATUS_CODE = exports.SEMATTRS_HTTP_SCHEME = exports.SEMATTRS_HTTP_HOST = exports.SEMATTRS_HTTP_TARGET = exports.SEMATTRS_HTTP_URL = exports.SEMATTRS_HTTP_METHOD = exports.SEMATTRS_CODE_LINENO = exports.SEMATTRS_CODE_FILEPATH = exports.SEMATTRS_CODE_NAMESPACE = exports.SEMATTRS_CODE_FUNCTION = exports.SEMATTRS_THREAD_NAME = exports.SEMATTRS_THREAD_ID = exports.SEMATTRS_ENDUSER_SCOPE = exports.SEMATTRS_ENDUSER_ROLE = exports.SEMATTRS_ENDUSER_ID = exports.SEMATTRS_PEER_SERVICE = undefined;
  exports.DBSYSTEMVALUES_FILEMAKER = exports.DBSYSTEMVALUES_DERBY = exports.DBSYSTEMVALUES_FIREBIRD = exports.DBSYSTEMVALUES_ADABAS = exports.DBSYSTEMVALUES_CACHE = exports.DBSYSTEMVALUES_EDB = exports.DBSYSTEMVALUES_FIRSTSQL = exports.DBSYSTEMVALUES_INGRES = exports.DBSYSTEMVALUES_HANADB = exports.DBSYSTEMVALUES_MAXDB = exports.DBSYSTEMVALUES_PROGRESS = exports.DBSYSTEMVALUES_HSQLDB = exports.DBSYSTEMVALUES_CLOUDSCAPE = exports.DBSYSTEMVALUES_HIVE = exports.DBSYSTEMVALUES_REDSHIFT = exports.DBSYSTEMVALUES_POSTGRESQL = exports.DBSYSTEMVALUES_DB2 = exports.DBSYSTEMVALUES_ORACLE = exports.DBSYSTEMVALUES_MYSQL = exports.DBSYSTEMVALUES_MSSQL = exports.DBSYSTEMVALUES_OTHER_SQL = exports.SemanticAttributes = exports.SEMATTRS_MESSAGE_UNCOMPRESSED_SIZE = exports.SEMATTRS_MESSAGE_COMPRESSED_SIZE = exports.SEMATTRS_MESSAGE_ID = exports.SEMATTRS_MESSAGE_TYPE = exports.SEMATTRS_RPC_JSONRPC_ERROR_MESSAGE = exports.SEMATTRS_RPC_JSONRPC_ERROR_CODE = exports.SEMATTRS_RPC_JSONRPC_REQUEST_ID = exports.SEMATTRS_RPC_JSONRPC_VERSION = exports.SEMATTRS_RPC_GRPC_STATUS_CODE = exports.SEMATTRS_RPC_METHOD = exports.SEMATTRS_RPC_SERVICE = exports.SEMATTRS_RPC_SYSTEM = exports.SEMATTRS_MESSAGING_KAFKA_TOMBSTONE = exports.SEMATTRS_MESSAGING_KAFKA_PARTITION = exports.SEMATTRS_MESSAGING_KAFKA_CLIENT_ID = exports.SEMATTRS_MESSAGING_KAFKA_CONSUMER_GROUP = exports.SEMATTRS_MESSAGING_KAFKA_MESSAGE_KEY = exports.SEMATTRS_MESSAGING_RABBITMQ_ROUTING_KEY = exports.SEMATTRS_MESSAGING_CONSUMER_ID = exports.SEMATTRS_MESSAGING_OPERATION = exports.SEMATTRS_MESSAGING_MESSAGE_PAYLOAD_COMPRESSED_SIZE_BYTES = exports.SEMATTRS_MESSAGING_MESSAGE_PAYLOAD_SIZE_BYTES = exports.SEMATTRS_MESSAGING_CONVERSATION_ID = exports.SEMATTRS_MESSAGING_MESSAGE_ID = exports.SEMATTRS_MESSAGING_URL = exports.SEMATTRS_MESSAGING_PROTOCOL_VERSION = exports.SEMATTRS_MESSAGING_PROTOCOL = exports.SEMATTRS_MESSAGING_TEMP_DESTINATION = undefined;
  exports.FAASINVOKEDPROVIDERVALUES_ALIBABA_CLOUD = exports.FaasDocumentOperationValues = exports.FAASDOCUMENTOPERATIONVALUES_DELETE = exports.FAASDOCUMENTOPERATIONVALUES_EDIT = exports.FAASDOCUMENTOPERATIONVALUES_INSERT = exports.FaasTriggerValues = exports.FAASTRIGGERVALUES_OTHER = exports.FAASTRIGGERVALUES_TIMER = exports.FAASTRIGGERVALUES_PUBSUB = exports.FAASTRIGGERVALUES_HTTP = exports.FAASTRIGGERVALUES_DATASOURCE = exports.DbCassandraConsistencyLevelValues = exports.DBCASSANDRACONSISTENCYLEVELVALUES_LOCAL_SERIAL = exports.DBCASSANDRACONSISTENCYLEVELVALUES_SERIAL = exports.DBCASSANDRACONSISTENCYLEVELVALUES_ANY = exports.DBCASSANDRACONSISTENCYLEVELVALUES_LOCAL_ONE = exports.DBCASSANDRACONSISTENCYLEVELVALUES_THREE = exports.DBCASSANDRACONSISTENCYLEVELVALUES_TWO = exports.DBCASSANDRACONSISTENCYLEVELVALUES_ONE = exports.DBCASSANDRACONSISTENCYLEVELVALUES_LOCAL_QUORUM = exports.DBCASSANDRACONSISTENCYLEVELVALUES_QUORUM = exports.DBCASSANDRACONSISTENCYLEVELVALUES_EACH_QUORUM = exports.DBCASSANDRACONSISTENCYLEVELVALUES_ALL = exports.DbSystemValues = exports.DBSYSTEMVALUES_COCKROACHDB = exports.DBSYSTEMVALUES_MEMCACHED = exports.DBSYSTEMVALUES_ELASTICSEARCH = exports.DBSYSTEMVALUES_GEODE = exports.DBSYSTEMVALUES_NEO4J = exports.DBSYSTEMVALUES_DYNAMODB = exports.DBSYSTEMVALUES_COSMOSDB = exports.DBSYSTEMVALUES_COUCHDB = exports.DBSYSTEMVALUES_COUCHBASE = exports.DBSYSTEMVALUES_REDIS = exports.DBSYSTEMVALUES_MONGODB = exports.DBSYSTEMVALUES_HBASE = exports.DBSYSTEMVALUES_CASSANDRA = exports.DBSYSTEMVALUES_COLDFUSION = exports.DBSYSTEMVALUES_H2 = exports.DBSYSTEMVALUES_VERTICA = exports.DBSYSTEMVALUES_TERADATA = exports.DBSYSTEMVALUES_SYBASE = exports.DBSYSTEMVALUES_SQLITE = exports.DBSYSTEMVALUES_POINTBASE = exports.DBSYSTEMVALUES_PERVASIVE = exports.DBSYSTEMVALUES_NETEZZA = exports.DBSYSTEMVALUES_MARIADB = exports.DBSYSTEMVALUES_INTERBASE = exports.DBSYSTEMVALUES_INSTANTDB = exports.DBSYSTEMVALUES_INFORMIX = undefined;
  exports.MESSAGINGOPERATIONVALUES_RECEIVE = exports.MessagingDestinationKindValues = exports.MESSAGINGDESTINATIONKINDVALUES_TOPIC = exports.MESSAGINGDESTINATIONKINDVALUES_QUEUE = exports.HttpFlavorValues = exports.HTTPFLAVORVALUES_QUIC = exports.HTTPFLAVORVALUES_SPDY = exports.HTTPFLAVORVALUES_HTTP_2_0 = exports.HTTPFLAVORVALUES_HTTP_1_1 = exports.HTTPFLAVORVALUES_HTTP_1_0 = exports.NetHostConnectionSubtypeValues = exports.NETHOSTCONNECTIONSUBTYPEVALUES_LTE_CA = exports.NETHOSTCONNECTIONSUBTYPEVALUES_NRNSA = exports.NETHOSTCONNECTIONSUBTYPEVALUES_NR = exports.NETHOSTCONNECTIONSUBTYPEVALUES_IWLAN = exports.NETHOSTCONNECTIONSUBTYPEVALUES_TD_SCDMA = exports.NETHOSTCONNECTIONSUBTYPEVALUES_GSM = exports.NETHOSTCONNECTIONSUBTYPEVALUES_HSPAP = exports.NETHOSTCONNECTIONSUBTYPEVALUES_EHRPD = exports.NETHOSTCONNECTIONSUBTYPEVALUES_LTE = exports.NETHOSTCONNECTIONSUBTYPEVALUES_EVDO_B = exports.NETHOSTCONNECTIONSUBTYPEVALUES_IDEN = exports.NETHOSTCONNECTIONSUBTYPEVALUES_HSPA = exports.NETHOSTCONNECTIONSUBTYPEVALUES_HSUPA = exports.NETHOSTCONNECTIONSUBTYPEVALUES_HSDPA = exports.NETHOSTCONNECTIONSUBTYPEVALUES_CDMA2000_1XRTT = exports.NETHOSTCONNECTIONSUBTYPEVALUES_EVDO_A = exports.NETHOSTCONNECTIONSUBTYPEVALUES_EVDO_0 = exports.NETHOSTCONNECTIONSUBTYPEVALUES_CDMA = exports.NETHOSTCONNECTIONSUBTYPEVALUES_UMTS = exports.NETHOSTCONNECTIONSUBTYPEVALUES_EDGE = exports.NETHOSTCONNECTIONSUBTYPEVALUES_GPRS = exports.NetHostConnectionTypeValues = exports.NETHOSTCONNECTIONTYPEVALUES_UNKNOWN = exports.NETHOSTCONNECTIONTYPEVALUES_UNAVAILABLE = exports.NETHOSTCONNECTIONTYPEVALUES_CELL = exports.NETHOSTCONNECTIONTYPEVALUES_WIRED = exports.NETHOSTCONNECTIONTYPEVALUES_WIFI = exports.NetTransportValues = exports.NETTRANSPORTVALUES_OTHER = exports.NETTRANSPORTVALUES_INPROC = exports.NETTRANSPORTVALUES_PIPE = exports.NETTRANSPORTVALUES_UNIX = exports.NETTRANSPORTVALUES_IP = exports.NETTRANSPORTVALUES_IP_UDP = exports.NETTRANSPORTVALUES_IP_TCP = exports.FaasInvokedProviderValues = exports.FAASINVOKEDPROVIDERVALUES_GCP = exports.FAASINVOKEDPROVIDERVALUES_AZURE = exports.FAASINVOKEDPROVIDERVALUES_AWS = undefined;
  exports.MessageTypeValues = exports.MESSAGETYPEVALUES_RECEIVED = exports.MESSAGETYPEVALUES_SENT = exports.RpcGrpcStatusCodeValues = exports.RPCGRPCSTATUSCODEVALUES_UNAUTHENTICATED = exports.RPCGRPCSTATUSCODEVALUES_DATA_LOSS = exports.RPCGRPCSTATUSCODEVALUES_UNAVAILABLE = exports.RPCGRPCSTATUSCODEVALUES_INTERNAL = exports.RPCGRPCSTATUSCODEVALUES_UNIMPLEMENTED = exports.RPCGRPCSTATUSCODEVALUES_OUT_OF_RANGE = exports.RPCGRPCSTATUSCODEVALUES_ABORTED = exports.RPCGRPCSTATUSCODEVALUES_FAILED_PRECONDITION = exports.RPCGRPCSTATUSCODEVALUES_RESOURCE_EXHAUSTED = exports.RPCGRPCSTATUSCODEVALUES_PERMISSION_DENIED = exports.RPCGRPCSTATUSCODEVALUES_ALREADY_EXISTS = exports.RPCGRPCSTATUSCODEVALUES_NOT_FOUND = exports.RPCGRPCSTATUSCODEVALUES_DEADLINE_EXCEEDED = exports.RPCGRPCSTATUSCODEVALUES_INVALID_ARGUMENT = exports.RPCGRPCSTATUSCODEVALUES_UNKNOWN = exports.RPCGRPCSTATUSCODEVALUES_CANCELLED = exports.RPCGRPCSTATUSCODEVALUES_OK = exports.MessagingOperationValues = exports.MESSAGINGOPERATIONVALUES_PROCESS = undefined;
  var utils_1 = require_utils4();
  var TMP_AWS_LAMBDA_INVOKED_ARN = "aws.lambda.invoked_arn";
  var TMP_DB_SYSTEM = "db.system";
  var TMP_DB_CONNECTION_STRING = "db.connection_string";
  var TMP_DB_USER = "db.user";
  var TMP_DB_JDBC_DRIVER_CLASSNAME = "db.jdbc.driver_classname";
  var TMP_DB_NAME = "db.name";
  var TMP_DB_STATEMENT = "db.statement";
  var TMP_DB_OPERATION = "db.operation";
  var TMP_DB_MSSQL_INSTANCE_NAME = "db.mssql.instance_name";
  var TMP_DB_CASSANDRA_KEYSPACE = "db.cassandra.keyspace";
  var TMP_DB_CASSANDRA_PAGE_SIZE = "db.cassandra.page_size";
  var TMP_DB_CASSANDRA_CONSISTENCY_LEVEL = "db.cassandra.consistency_level";
  var TMP_DB_CASSANDRA_TABLE = "db.cassandra.table";
  var TMP_DB_CASSANDRA_IDEMPOTENCE = "db.cassandra.idempotence";
  var TMP_DB_CASSANDRA_SPECULATIVE_EXECUTION_COUNT = "db.cassandra.speculative_execution_count";
  var TMP_DB_CASSANDRA_COORDINATOR_ID = "db.cassandra.coordinator.id";
  var TMP_DB_CASSANDRA_COORDINATOR_DC = "db.cassandra.coordinator.dc";
  var TMP_DB_HBASE_NAMESPACE = "db.hbase.namespace";
  var TMP_DB_REDIS_DATABASE_INDEX = "db.redis.database_index";
  var TMP_DB_MONGODB_COLLECTION = "db.mongodb.collection";
  var TMP_DB_SQL_TABLE = "db.sql.table";
  var TMP_EXCEPTION_TYPE = "exception.type";
  var TMP_EXCEPTION_MESSAGE = "exception.message";
  var TMP_EXCEPTION_STACKTRACE = "exception.stacktrace";
  var TMP_EXCEPTION_ESCAPED = "exception.escaped";
  var TMP_FAAS_TRIGGER = "faas.trigger";
  var TMP_FAAS_EXECUTION = "faas.execution";
  var TMP_FAAS_DOCUMENT_COLLECTION = "faas.document.collection";
  var TMP_FAAS_DOCUMENT_OPERATION = "faas.document.operation";
  var TMP_FAAS_DOCUMENT_TIME = "faas.document.time";
  var TMP_FAAS_DOCUMENT_NAME = "faas.document.name";
  var TMP_FAAS_TIME = "faas.time";
  var TMP_FAAS_CRON = "faas.cron";
  var TMP_FAAS_COLDSTART = "faas.coldstart";
  var TMP_FAAS_INVOKED_NAME = "faas.invoked_name";
  var TMP_FAAS_INVOKED_PROVIDER = "faas.invoked_provider";
  var TMP_FAAS_INVOKED_REGION = "faas.invoked_region";
  var TMP_NET_TRANSPORT = "net.transport";
  var TMP_NET_PEER_IP = "net.peer.ip";
  var TMP_NET_PEER_PORT = "net.peer.port";
  var TMP_NET_PEER_NAME = "net.peer.name";
  var TMP_NET_HOST_IP = "net.host.ip";
  var TMP_NET_HOST_PORT = "net.host.port";
  var TMP_NET_HOST_NAME = "net.host.name";
  var TMP_NET_HOST_CONNECTION_TYPE = "net.host.connection.type";
  var TMP_NET_HOST_CONNECTION_SUBTYPE = "net.host.connection.subtype";
  var TMP_NET_HOST_CARRIER_NAME = "net.host.carrier.name";
  var TMP_NET_HOST_CARRIER_MCC = "net.host.carrier.mcc";
  var TMP_NET_HOST_CARRIER_MNC = "net.host.carrier.mnc";
  var TMP_NET_HOST_CARRIER_ICC = "net.host.carrier.icc";
  var TMP_PEER_SERVICE = "peer.service";
  var TMP_ENDUSER_ID = "enduser.id";
  var TMP_ENDUSER_ROLE = "enduser.role";
  var TMP_ENDUSER_SCOPE = "enduser.scope";
  var TMP_THREAD_ID = "thread.id";
  var TMP_THREAD_NAME = "thread.name";
  var TMP_CODE_FUNCTION = "code.function";
  var TMP_CODE_NAMESPACE = "code.namespace";
  var TMP_CODE_FILEPATH = "code.filepath";
  var TMP_CODE_LINENO = "code.lineno";
  var TMP_HTTP_METHOD = "http.method";
  var TMP_HTTP_URL = "http.url";
  var TMP_HTTP_TARGET = "http.target";
  var TMP_HTTP_HOST = "http.host";
  var TMP_HTTP_SCHEME = "http.scheme";
  var TMP_HTTP_STATUS_CODE = "http.status_code";
  var TMP_HTTP_FLAVOR = "http.flavor";
  var TMP_HTTP_USER_AGENT = "http.user_agent";
  var TMP_HTTP_REQUEST_CONTENT_LENGTH = "http.request_content_length";
  var TMP_HTTP_REQUEST_CONTENT_LENGTH_UNCOMPRESSED = "http.request_content_length_uncompressed";
  var TMP_HTTP_RESPONSE_CONTENT_LENGTH = "http.response_content_length";
  var TMP_HTTP_RESPONSE_CONTENT_LENGTH_UNCOMPRESSED = "http.response_content_length_uncompressed";
  var TMP_HTTP_SERVER_NAME = "http.server_name";
  var TMP_HTTP_ROUTE = "http.route";
  var TMP_HTTP_CLIENT_IP = "http.client_ip";
  var TMP_AWS_DYNAMODB_TABLE_NAMES = "aws.dynamodb.table_names";
  var TMP_AWS_DYNAMODB_CONSUMED_CAPACITY = "aws.dynamodb.consumed_capacity";
  var TMP_AWS_DYNAMODB_ITEM_COLLECTION_METRICS = "aws.dynamodb.item_collection_metrics";
  var TMP_AWS_DYNAMODB_PROVISIONED_READ_CAPACITY = "aws.dynamodb.provisioned_read_capacity";
  var TMP_AWS_DYNAMODB_PROVISIONED_WRITE_CAPACITY = "aws.dynamodb.provisioned_write_capacity";
  var TMP_AWS_DYNAMODB_CONSISTENT_READ = "aws.dynamodb.consistent_read";
  var TMP_AWS_DYNAMODB_PROJECTION = "aws.dynamodb.projection";
  var TMP_AWS_DYNAMODB_LIMIT = "aws.dynamodb.limit";
  var TMP_AWS_DYNAMODB_ATTRIBUTES_TO_GET = "aws.dynamodb.attributes_to_get";
  var TMP_AWS_DYNAMODB_INDEX_NAME = "aws.dynamodb.index_name";
  var TMP_AWS_DYNAMODB_SELECT = "aws.dynamodb.select";
  var TMP_AWS_DYNAMODB_GLOBAL_SECONDARY_INDEXES = "aws.dynamodb.global_secondary_indexes";
  var TMP_AWS_DYNAMODB_LOCAL_SECONDARY_INDEXES = "aws.dynamodb.local_secondary_indexes";
  var TMP_AWS_DYNAMODB_EXCLUSIVE_START_TABLE = "aws.dynamodb.exclusive_start_table";
  var TMP_AWS_DYNAMODB_TABLE_COUNT = "aws.dynamodb.table_count";
  var TMP_AWS_DYNAMODB_SCAN_FORWARD = "aws.dynamodb.scan_forward";
  var TMP_AWS_DYNAMODB_SEGMENT = "aws.dynamodb.segment";
  var TMP_AWS_DYNAMODB_TOTAL_SEGMENTS = "aws.dynamodb.total_segments";
  var TMP_AWS_DYNAMODB_COUNT = "aws.dynamodb.count";
  var TMP_AWS_DYNAMODB_SCANNED_COUNT = "aws.dynamodb.scanned_count";
  var TMP_AWS_DYNAMODB_ATTRIBUTE_DEFINITIONS = "aws.dynamodb.attribute_definitions";
  var TMP_AWS_DYNAMODB_GLOBAL_SECONDARY_INDEX_UPDATES = "aws.dynamodb.global_secondary_index_updates";
  var TMP_MESSAGING_SYSTEM = "messaging.system";
  var TMP_MESSAGING_DESTINATION = "messaging.destination";
  var TMP_MESSAGING_DESTINATION_KIND = "messaging.destination_kind";
  var TMP_MESSAGING_TEMP_DESTINATION = "messaging.temp_destination";
  var TMP_MESSAGING_PROTOCOL = "messaging.protocol";
  var TMP_MESSAGING_PROTOCOL_VERSION = "messaging.protocol_version";
  var TMP_MESSAGING_URL = "messaging.url";
  var TMP_MESSAGING_MESSAGE_ID = "messaging.message_id";
  var TMP_MESSAGING_CONVERSATION_ID = "messaging.conversation_id";
  var TMP_MESSAGING_MESSAGE_PAYLOAD_SIZE_BYTES = "messaging.message_payload_size_bytes";
  var TMP_MESSAGING_MESSAGE_PAYLOAD_COMPRESSED_SIZE_BYTES = "messaging.message_payload_compressed_size_bytes";
  var TMP_MESSAGING_OPERATION = "messaging.operation";
  var TMP_MESSAGING_CONSUMER_ID = "messaging.consumer_id";
  var TMP_MESSAGING_RABBITMQ_ROUTING_KEY = "messaging.rabbitmq.routing_key";
  var TMP_MESSAGING_KAFKA_MESSAGE_KEY = "messaging.kafka.message_key";
  var TMP_MESSAGING_KAFKA_CONSUMER_GROUP = "messaging.kafka.consumer_group";
  var TMP_MESSAGING_KAFKA_CLIENT_ID = "messaging.kafka.client_id";
  var TMP_MESSAGING_KAFKA_PARTITION = "messaging.kafka.partition";
  var TMP_MESSAGING_KAFKA_TOMBSTONE = "messaging.kafka.tombstone";
  var TMP_RPC_SYSTEM = "rpc.system";
  var TMP_RPC_SERVICE = "rpc.service";
  var TMP_RPC_METHOD = "rpc.method";
  var TMP_RPC_GRPC_STATUS_CODE = "rpc.grpc.status_code";
  var TMP_RPC_JSONRPC_VERSION = "rpc.jsonrpc.version";
  var TMP_RPC_JSONRPC_REQUEST_ID = "rpc.jsonrpc.request_id";
  var TMP_RPC_JSONRPC_ERROR_CODE = "rpc.jsonrpc.error_code";
  var TMP_RPC_JSONRPC_ERROR_MESSAGE = "rpc.jsonrpc.error_message";
  var TMP_MESSAGE_TYPE = "message.type";
  var TMP_MESSAGE_ID = "message.id";
  var TMP_MESSAGE_COMPRESSED_SIZE = "message.compressed_size";
  var TMP_MESSAGE_UNCOMPRESSED_SIZE = "message.uncompressed_size";
  exports.SEMATTRS_AWS_LAMBDA_INVOKED_ARN = TMP_AWS_LAMBDA_INVOKED_ARN;
  exports.SEMATTRS_DB_SYSTEM = TMP_DB_SYSTEM;
  exports.SEMATTRS_DB_CONNECTION_STRING = TMP_DB_CONNECTION_STRING;
  exports.SEMATTRS_DB_USER = TMP_DB_USER;
  exports.SEMATTRS_DB_JDBC_DRIVER_CLASSNAME = TMP_DB_JDBC_DRIVER_CLASSNAME;
  exports.SEMATTRS_DB_NAME = TMP_DB_NAME;
  exports.SEMATTRS_DB_STATEMENT = TMP_DB_STATEMENT;
  exports.SEMATTRS_DB_OPERATION = TMP_DB_OPERATION;
  exports.SEMATTRS_DB_MSSQL_INSTANCE_NAME = TMP_DB_MSSQL_INSTANCE_NAME;
  exports.SEMATTRS_DB_CASSANDRA_KEYSPACE = TMP_DB_CASSANDRA_KEYSPACE;
  exports.SEMATTRS_DB_CASSANDRA_PAGE_SIZE = TMP_DB_CASSANDRA_PAGE_SIZE;
  exports.SEMATTRS_DB_CASSANDRA_CONSISTENCY_LEVEL = TMP_DB_CASSANDRA_CONSISTENCY_LEVEL;
  exports.SEMATTRS_DB_CASSANDRA_TABLE = TMP_DB_CASSANDRA_TABLE;
  exports.SEMATTRS_DB_CASSANDRA_IDEMPOTENCE = TMP_DB_CASSANDRA_IDEMPOTENCE;
  exports.SEMATTRS_DB_CASSANDRA_SPECULATIVE_EXECUTION_COUNT = TMP_DB_CASSANDRA_SPECULATIVE_EXECUTION_COUNT;
  exports.SEMATTRS_DB_CASSANDRA_COORDINATOR_ID = TMP_DB_CASSANDRA_COORDINATOR_ID;
  exports.SEMATTRS_DB_CASSANDRA_COORDINATOR_DC = TMP_DB_CASSANDRA_COORDINATOR_DC;
  exports.SEMATTRS_DB_HBASE_NAMESPACE = TMP_DB_HBASE_NAMESPACE;
  exports.SEMATTRS_DB_REDIS_DATABASE_INDEX = TMP_DB_REDIS_DATABASE_INDEX;
  exports.SEMATTRS_DB_MONGODB_COLLECTION = TMP_DB_MONGODB_COLLECTION;
  exports.SEMATTRS_DB_SQL_TABLE = TMP_DB_SQL_TABLE;
  exports.SEMATTRS_EXCEPTION_TYPE = TMP_EXCEPTION_TYPE;
  exports.SEMATTRS_EXCEPTION_MESSAGE = TMP_EXCEPTION_MESSAGE;
  exports.SEMATTRS_EXCEPTION_STACKTRACE = TMP_EXCEPTION_STACKTRACE;
  exports.SEMATTRS_EXCEPTION_ESCAPED = TMP_EXCEPTION_ESCAPED;
  exports.SEMATTRS_FAAS_TRIGGER = TMP_FAAS_TRIGGER;
  exports.SEMATTRS_FAAS_EXECUTION = TMP_FAAS_EXECUTION;
  exports.SEMATTRS_FAAS_DOCUMENT_COLLECTION = TMP_FAAS_DOCUMENT_COLLECTION;
  exports.SEMATTRS_FAAS_DOCUMENT_OPERATION = TMP_FAAS_DOCUMENT_OPERATION;
  exports.SEMATTRS_FAAS_DOCUMENT_TIME = TMP_FAAS_DOCUMENT_TIME;
  exports.SEMATTRS_FAAS_DOCUMENT_NAME = TMP_FAAS_DOCUMENT_NAME;
  exports.SEMATTRS_FAAS_TIME = TMP_FAAS_TIME;
  exports.SEMATTRS_FAAS_CRON = TMP_FAAS_CRON;
  exports.SEMATTRS_FAAS_COLDSTART = TMP_FAAS_COLDSTART;
  exports.SEMATTRS_FAAS_INVOKED_NAME = TMP_FAAS_INVOKED_NAME;
  exports.SEMATTRS_FAAS_INVOKED_PROVIDER = TMP_FAAS_INVOKED_PROVIDER;
  exports.SEMATTRS_FAAS_INVOKED_REGION = TMP_FAAS_INVOKED_REGION;
  exports.SEMATTRS_NET_TRANSPORT = TMP_NET_TRANSPORT;
  exports.SEMATTRS_NET_PEER_IP = TMP_NET_PEER_IP;
  exports.SEMATTRS_NET_PEER_PORT = TMP_NET_PEER_PORT;
  exports.SEMATTRS_NET_PEER_NAME = TMP_NET_PEER_NAME;
  exports.SEMATTRS_NET_HOST_IP = TMP_NET_HOST_IP;
  exports.SEMATTRS_NET_HOST_PORT = TMP_NET_HOST_PORT;
  exports.SEMATTRS_NET_HOST_NAME = TMP_NET_HOST_NAME;
  exports.SEMATTRS_NET_HOST_CONNECTION_TYPE = TMP_NET_HOST_CONNECTION_TYPE;
  exports.SEMATTRS_NET_HOST_CONNECTION_SUBTYPE = TMP_NET_HOST_CONNECTION_SUBTYPE;
  exports.SEMATTRS_NET_HOST_CARRIER_NAME = TMP_NET_HOST_CARRIER_NAME;
  exports.SEMATTRS_NET_HOST_CARRIER_MCC = TMP_NET_HOST_CARRIER_MCC;
  exports.SEMATTRS_NET_HOST_CARRIER_MNC = TMP_NET_HOST_CARRIER_MNC;
  exports.SEMATTRS_NET_HOST_CARRIER_ICC = TMP_NET_HOST_CARRIER_ICC;
  exports.SEMATTRS_PEER_SERVICE = TMP_PEER_SERVICE;
  exports.SEMATTRS_ENDUSER_ID = TMP_ENDUSER_ID;
  exports.SEMATTRS_ENDUSER_ROLE = TMP_ENDUSER_ROLE;
  exports.SEMATTRS_ENDUSER_SCOPE = TMP_ENDUSER_SCOPE;
  exports.SEMATTRS_THREAD_ID = TMP_THREAD_ID;
  exports.SEMATTRS_THREAD_NAME = TMP_THREAD_NAME;
  exports.SEMATTRS_CODE_FUNCTION = TMP_CODE_FUNCTION;
  exports.SEMATTRS_CODE_NAMESPACE = TMP_CODE_NAMESPACE;
  exports.SEMATTRS_CODE_FILEPATH = TMP_CODE_FILEPATH;
  exports.SEMATTRS_CODE_LINENO = TMP_CODE_LINENO;
  exports.SEMATTRS_HTTP_METHOD = TMP_HTTP_METHOD;
  exports.SEMATTRS_HTTP_URL = TMP_HTTP_URL;
  exports.SEMATTRS_HTTP_TARGET = TMP_HTTP_TARGET;
  exports.SEMATTRS_HTTP_HOST = TMP_HTTP_HOST;
  exports.SEMATTRS_HTTP_SCHEME = TMP_HTTP_SCHEME;
  exports.SEMATTRS_HTTP_STATUS_CODE = TMP_HTTP_STATUS_CODE;
  exports.SEMATTRS_HTTP_FLAVOR = TMP_HTTP_FLAVOR;
  exports.SEMATTRS_HTTP_USER_AGENT = TMP_HTTP_USER_AGENT;
  exports.SEMATTRS_HTTP_REQUEST_CONTENT_LENGTH = TMP_HTTP_REQUEST_CONTENT_LENGTH;
  exports.SEMATTRS_HTTP_REQUEST_CONTENT_LENGTH_UNCOMPRESSED = TMP_HTTP_REQUEST_CONTENT_LENGTH_UNCOMPRESSED;
  exports.SEMATTRS_HTTP_RESPONSE_CONTENT_LENGTH = TMP_HTTP_RESPONSE_CONTENT_LENGTH;
  exports.SEMATTRS_HTTP_RESPONSE_CONTENT_LENGTH_UNCOMPRESSED = TMP_HTTP_RESPONSE_CONTENT_LENGTH_UNCOMPRESSED;
  exports.SEMATTRS_HTTP_SERVER_NAME = TMP_HTTP_SERVER_NAME;
  exports.SEMATTRS_HTTP_ROUTE = TMP_HTTP_ROUTE;
  exports.SEMATTRS_HTTP_CLIENT_IP = TMP_HTTP_CLIENT_IP;
  exports.SEMATTRS_AWS_DYNAMODB_TABLE_NAMES = TMP_AWS_DYNAMODB_TABLE_NAMES;
  exports.SEMATTRS_AWS_DYNAMODB_CONSUMED_CAPACITY = TMP_AWS_DYNAMODB_CONSUMED_CAPACITY;
  exports.SEMATTRS_AWS_DYNAMODB_ITEM_COLLECTION_METRICS = TMP_AWS_DYNAMODB_ITEM_COLLECTION_METRICS;
  exports.SEMATTRS_AWS_DYNAMODB_PROVISIONED_READ_CAPACITY = TMP_AWS_DYNAMODB_PROVISIONED_READ_CAPACITY;
  exports.SEMATTRS_AWS_DYNAMODB_PROVISIONED_WRITE_CAPACITY = TMP_AWS_DYNAMODB_PROVISIONED_WRITE_CAPACITY;
  exports.SEMATTRS_AWS_DYNAMODB_CONSISTENT_READ = TMP_AWS_DYNAMODB_CONSISTENT_READ;
  exports.SEMATTRS_AWS_DYNAMODB_PROJECTION = TMP_AWS_DYNAMODB_PROJECTION;
  exports.SEMATTRS_AWS_DYNAMODB_LIMIT = TMP_AWS_DYNAMODB_LIMIT;
  exports.SEMATTRS_AWS_DYNAMODB_ATTRIBUTES_TO_GET = TMP_AWS_DYNAMODB_ATTRIBUTES_TO_GET;
  exports.SEMATTRS_AWS_DYNAMODB_INDEX_NAME = TMP_AWS_DYNAMODB_INDEX_NAME;
  exports.SEMATTRS_AWS_DYNAMODB_SELECT = TMP_AWS_DYNAMODB_SELECT;
  exports.SEMATTRS_AWS_DYNAMODB_GLOBAL_SECONDARY_INDEXES = TMP_AWS_DYNAMODB_GLOBAL_SECONDARY_INDEXES;
  exports.SEMATTRS_AWS_DYNAMODB_LOCAL_SECONDARY_INDEXES = TMP_AWS_DYNAMODB_LOCAL_SECONDARY_INDEXES;
  exports.SEMATTRS_AWS_DYNAMODB_EXCLUSIVE_START_TABLE = TMP_AWS_DYNAMODB_EXCLUSIVE_START_TABLE;
  exports.SEMATTRS_AWS_DYNAMODB_TABLE_COUNT = TMP_AWS_DYNAMODB_TABLE_COUNT;
  exports.SEMATTRS_AWS_DYNAMODB_SCAN_FORWARD = TMP_AWS_DYNAMODB_SCAN_FORWARD;
  exports.SEMATTRS_AWS_DYNAMODB_SEGMENT = TMP_AWS_DYNAMODB_SEGMENT;
  exports.SEMATTRS_AWS_DYNAMODB_TOTAL_SEGMENTS = TMP_AWS_DYNAMODB_TOTAL_SEGMENTS;
  exports.SEMATTRS_AWS_DYNAMODB_COUNT = TMP_AWS_DYNAMODB_COUNT;
  exports.SEMATTRS_AWS_DYNAMODB_SCANNED_COUNT = TMP_AWS_DYNAMODB_SCANNED_COUNT;
  exports.SEMATTRS_AWS_DYNAMODB_ATTRIBUTE_DEFINITIONS = TMP_AWS_DYNAMODB_ATTRIBUTE_DEFINITIONS;
  exports.SEMATTRS_AWS_DYNAMODB_GLOBAL_SECONDARY_INDEX_UPDATES = TMP_AWS_DYNAMODB_GLOBAL_SECONDARY_INDEX_UPDATES;
  exports.SEMATTRS_MESSAGING_SYSTEM = TMP_MESSAGING_SYSTEM;
  exports.SEMATTRS_MESSAGING_DESTINATION = TMP_MESSAGING_DESTINATION;
  exports.SEMATTRS_MESSAGING_DESTINATION_KIND = TMP_MESSAGING_DESTINATION_KIND;
  exports.SEMATTRS_MESSAGING_TEMP_DESTINATION = TMP_MESSAGING_TEMP_DESTINATION;
  exports.SEMATTRS_MESSAGING_PROTOCOL = TMP_MESSAGING_PROTOCOL;
  exports.SEMATTRS_MESSAGING_PROTOCOL_VERSION = TMP_MESSAGING_PROTOCOL_VERSION;
  exports.SEMATTRS_MESSAGING_URL = TMP_MESSAGING_URL;
  exports.SEMATTRS_MESSAGING_MESSAGE_ID = TMP_MESSAGING_MESSAGE_ID;
  exports.SEMATTRS_MESSAGING_CONVERSATION_ID = TMP_MESSAGING_CONVERSATION_ID;
  exports.SEMATTRS_MESSAGING_MESSAGE_PAYLOAD_SIZE_BYTES = TMP_MESSAGING_MESSAGE_PAYLOAD_SIZE_BYTES;
  exports.SEMATTRS_MESSAGING_MESSAGE_PAYLOAD_COMPRESSED_SIZE_BYTES = TMP_MESSAGING_MESSAGE_PAYLOAD_COMPRESSED_SIZE_BYTES;
  exports.SEMATTRS_MESSAGING_OPERATION = TMP_MESSAGING_OPERATION;
  exports.SEMATTRS_MESSAGING_CONSUMER_ID = TMP_MESSAGING_CONSUMER_ID;
  exports.SEMATTRS_MESSAGING_RABBITMQ_ROUTING_KEY = TMP_MESSAGING_RABBITMQ_ROUTING_KEY;
  exports.SEMATTRS_MESSAGING_KAFKA_MESSAGE_KEY = TMP_MESSAGING_KAFKA_MESSAGE_KEY;
  exports.SEMATTRS_MESSAGING_KAFKA_CONSUMER_GROUP = TMP_MESSAGING_KAFKA_CONSUMER_GROUP;
  exports.SEMATTRS_MESSAGING_KAFKA_CLIENT_ID = TMP_MESSAGING_KAFKA_CLIENT_ID;
  exports.SEMATTRS_MESSAGING_KAFKA_PARTITION = TMP_MESSAGING_KAFKA_PARTITION;
  exports.SEMATTRS_MESSAGING_KAFKA_TOMBSTONE = TMP_MESSAGING_KAFKA_TOMBSTONE;
  exports.SEMATTRS_RPC_SYSTEM = TMP_RPC_SYSTEM;
  exports.SEMATTRS_RPC_SERVICE = TMP_RPC_SERVICE;
  exports.SEMATTRS_RPC_METHOD = TMP_RPC_METHOD;
  exports.SEMATTRS_RPC_GRPC_STATUS_CODE = TMP_RPC_GRPC_STATUS_CODE;
  exports.SEMATTRS_RPC_JSONRPC_VERSION = TMP_RPC_JSONRPC_VERSION;
  exports.SEMATTRS_RPC_JSONRPC_REQUEST_ID = TMP_RPC_JSONRPC_REQUEST_ID;
  exports.SEMATTRS_RPC_JSONRPC_ERROR_CODE = TMP_RPC_JSONRPC_ERROR_CODE;
  exports.SEMATTRS_RPC_JSONRPC_ERROR_MESSAGE = TMP_RPC_JSONRPC_ERROR_MESSAGE;
  exports.SEMATTRS_MESSAGE_TYPE = TMP_MESSAGE_TYPE;
  exports.SEMATTRS_MESSAGE_ID = TMP_MESSAGE_ID;
  exports.SEMATTRS_MESSAGE_COMPRESSED_SIZE = TMP_MESSAGE_COMPRESSED_SIZE;
  exports.SEMATTRS_MESSAGE_UNCOMPRESSED_SIZE = TMP_MESSAGE_UNCOMPRESSED_SIZE;
  exports.SemanticAttributes = /* @__PURE__ */ (0, utils_1.createConstMap)([
    TMP_AWS_LAMBDA_INVOKED_ARN,
    TMP_DB_SYSTEM,
    TMP_DB_CONNECTION_STRING,
    TMP_DB_USER,
    TMP_DB_JDBC_DRIVER_CLASSNAME,
    TMP_DB_NAME,
    TMP_DB_STATEMENT,
    TMP_DB_OPERATION,
    TMP_DB_MSSQL_INSTANCE_NAME,
    TMP_DB_CASSANDRA_KEYSPACE,
    TMP_DB_CASSANDRA_PAGE_SIZE,
    TMP_DB_CASSANDRA_CONSISTENCY_LEVEL,
    TMP_DB_CASSANDRA_TABLE,
    TMP_DB_CASSANDRA_IDEMPOTENCE,
    TMP_DB_CASSANDRA_SPECULATIVE_EXECUTION_COUNT,
    TMP_DB_CASSANDRA_COORDINATOR_ID,
    TMP_DB_CASSANDRA_COORDINATOR_DC,
    TMP_DB_HBASE_NAMESPACE,
    TMP_DB_REDIS_DATABASE_INDEX,
    TMP_DB_MONGODB_COLLECTION,
    TMP_DB_SQL_TABLE,
    TMP_EXCEPTION_TYPE,
    TMP_EXCEPTION_MESSAGE,
    TMP_EXCEPTION_STACKTRACE,
    TMP_EXCEPTION_ESCAPED,
    TMP_FAAS_TRIGGER,
    TMP_FAAS_EXECUTION,
    TMP_FAAS_DOCUMENT_COLLECTION,
    TMP_FAAS_DOCUMENT_OPERATION,
    TMP_FAAS_DOCUMENT_TIME,
    TMP_FAAS_DOCUMENT_NAME,
    TMP_FAAS_TIME,
    TMP_FAAS_CRON,
    TMP_FAAS_COLDSTART,
    TMP_FAAS_INVOKED_NAME,
    TMP_FAAS_INVOKED_PROVIDER,
    TMP_FAAS_INVOKED_REGION,
    TMP_NET_TRANSPORT,
    TMP_NET_PEER_IP,
    TMP_NET_PEER_PORT,
    TMP_NET_PEER_NAME,
    TMP_NET_HOST_IP,
    TMP_NET_HOST_PORT,
    TMP_NET_HOST_NAME,
    TMP_NET_HOST_CONNECTION_TYPE,
    TMP_NET_HOST_CONNECTION_SUBTYPE,
    TMP_NET_HOST_CARRIER_NAME,
    TMP_NET_HOST_CARRIER_MCC,
    TMP_NET_HOST_CARRIER_MNC,
    TMP_NET_HOST_CARRIER_ICC,
    TMP_PEER_SERVICE,
    TMP_ENDUSER_ID,
    TMP_ENDUSER_ROLE,
    TMP_ENDUSER_SCOPE,
    TMP_THREAD_ID,
    TMP_THREAD_NAME,
    TMP_CODE_FUNCTION,
    TMP_CODE_NAMESPACE,
    TMP_CODE_FILEPATH,
    TMP_CODE_LINENO,
    TMP_HTTP_METHOD,
    TMP_HTTP_URL,
    TMP_HTTP_TARGET,
    TMP_HTTP_HOST,
    TMP_HTTP_SCHEME,
    TMP_HTTP_STATUS_CODE,
    TMP_HTTP_FLAVOR,
    TMP_HTTP_USER_AGENT,
    TMP_HTTP_REQUEST_CONTENT_LENGTH,
    TMP_HTTP_REQUEST_CONTENT_LENGTH_UNCOMPRESSED,
    TMP_HTTP_RESPONSE_CONTENT_LENGTH,
    TMP_HTTP_RESPONSE_CONTENT_LENGTH_UNCOMPRESSED,
    TMP_HTTP_SERVER_NAME,
    TMP_HTTP_ROUTE,
    TMP_HTTP_CLIENT_IP,
    TMP_AWS_DYNAMODB_TABLE_NAMES,
    TMP_AWS_DYNAMODB_CONSUMED_CAPACITY,
    TMP_AWS_DYNAMODB_ITEM_COLLECTION_METRICS,
    TMP_AWS_DYNAMODB_PROVISIONED_READ_CAPACITY,
    TMP_AWS_DYNAMODB_PROVISIONED_WRITE_CAPACITY,
    TMP_AWS_DYNAMODB_CONSISTENT_READ,
    TMP_AWS_DYNAMODB_PROJECTION,
    TMP_AWS_DYNAMODB_LIMIT,
    TMP_AWS_DYNAMODB_ATTRIBUTES_TO_GET,
    TMP_AWS_DYNAMODB_INDEX_NAME,
    TMP_AWS_DYNAMODB_SELECT,
    TMP_AWS_DYNAMODB_GLOBAL_SECONDARY_INDEXES,
    TMP_AWS_DYNAMODB_LOCAL_SECONDARY_INDEXES,
    TMP_AWS_DYNAMODB_EXCLUSIVE_START_TABLE,
    TMP_AWS_DYNAMODB_TABLE_COUNT,
    TMP_AWS_DYNAMODB_SCAN_FORWARD,
    TMP_AWS_DYNAMODB_SEGMENT,
    TMP_AWS_DYNAMODB_TOTAL_SEGMENTS,
    TMP_AWS_DYNAMODB_COUNT,
    TMP_AWS_DYNAMODB_SCANNED_COUNT,
    TMP_AWS_DYNAMODB_ATTRIBUTE_DEFINITIONS,
    TMP_AWS_DYNAMODB_GLOBAL_SECONDARY_INDEX_UPDATES,
    TMP_MESSAGING_SYSTEM,
    TMP_MESSAGING_DESTINATION,
    TMP_MESSAGING_DESTINATION_KIND,
    TMP_MESSAGING_TEMP_DESTINATION,
    TMP_MESSAGING_PROTOCOL,
    TMP_MESSAGING_PROTOCOL_VERSION,
    TMP_MESSAGING_URL,
    TMP_MESSAGING_MESSAGE_ID,
    TMP_MESSAGING_CONVERSATION_ID,
    TMP_MESSAGING_MESSAGE_PAYLOAD_SIZE_BYTES,
    TMP_MESSAGING_MESSAGE_PAYLOAD_COMPRESSED_SIZE_BYTES,
    TMP_MESSAGING_OPERATION,
    TMP_MESSAGING_CONSUMER_ID,
    TMP_MESSAGING_RABBITMQ_ROUTING_KEY,
    TMP_MESSAGING_KAFKA_MESSAGE_KEY,
    TMP_MESSAGING_KAFKA_CONSUMER_GROUP,
    TMP_MESSAGING_KAFKA_CLIENT_ID,
    TMP_MESSAGING_KAFKA_PARTITION,
    TMP_MESSAGING_KAFKA_TOMBSTONE,
    TMP_RPC_SYSTEM,
    TMP_RPC_SERVICE,
    TMP_RPC_METHOD,
    TMP_RPC_GRPC_STATUS_CODE,
    TMP_RPC_JSONRPC_VERSION,
    TMP_RPC_JSONRPC_REQUEST_ID,
    TMP_RPC_JSONRPC_ERROR_CODE,
    TMP_RPC_JSONRPC_ERROR_MESSAGE,
    TMP_MESSAGE_TYPE,
    TMP_MESSAGE_ID,
    TMP_MESSAGE_COMPRESSED_SIZE,
    TMP_MESSAGE_UNCOMPRESSED_SIZE
  ]);
  var TMP_DBSYSTEMVALUES_OTHER_SQL = "other_sql";
  var TMP_DBSYSTEMVALUES_MSSQL = "mssql";
  var TMP_DBSYSTEMVALUES_MYSQL = "mysql";
  var TMP_DBSYSTEMVALUES_ORACLE = "oracle";
  var TMP_DBSYSTEMVALUES_DB2 = "db2";
  var TMP_DBSYSTEMVALUES_POSTGRESQL = "postgresql";
  var TMP_DBSYSTEMVALUES_REDSHIFT = "redshift";
  var TMP_DBSYSTEMVALUES_HIVE = "hive";
  var TMP_DBSYSTEMVALUES_CLOUDSCAPE = "cloudscape";
  var TMP_DBSYSTEMVALUES_HSQLDB = "hsqldb";
  var TMP_DBSYSTEMVALUES_PROGRESS = "progress";
  var TMP_DBSYSTEMVALUES_MAXDB = "maxdb";
  var TMP_DBSYSTEMVALUES_HANADB = "hanadb";
  var TMP_DBSYSTEMVALUES_INGRES = "ingres";
  var TMP_DBSYSTEMVALUES_FIRSTSQL = "firstsql";
  var TMP_DBSYSTEMVALUES_EDB = "edb";
  var TMP_DBSYSTEMVALUES_CACHE = "cache";
  var TMP_DBSYSTEMVALUES_ADABAS = "adabas";
  var TMP_DBSYSTEMVALUES_FIREBIRD = "firebird";
  var TMP_DBSYSTEMVALUES_DERBY = "derby";
  var TMP_DBSYSTEMVALUES_FILEMAKER = "filemaker";
  var TMP_DBSYSTEMVALUES_INFORMIX = "informix";
  var TMP_DBSYSTEMVALUES_INSTANTDB = "instantdb";
  var TMP_DBSYSTEMVALUES_INTERBASE = "interbase";
  var TMP_DBSYSTEMVALUES_MARIADB = "mariadb";
  var TMP_DBSYSTEMVALUES_NETEZZA = "netezza";
  var TMP_DBSYSTEMVALUES_PERVASIVE = "pervasive";
  var TMP_DBSYSTEMVALUES_POINTBASE = "pointbase";
  var TMP_DBSYSTEMVALUES_SQLITE = "sqlite";
  var TMP_DBSYSTEMVALUES_SYBASE = "sybase";
  var TMP_DBSYSTEMVALUES_TERADATA = "teradata";
  var TMP_DBSYSTEMVALUES_VERTICA = "vertica";
  var TMP_DBSYSTEMVALUES_H2 = "h2";
  var TMP_DBSYSTEMVALUES_COLDFUSION = "coldfusion";
  var TMP_DBSYSTEMVALUES_CASSANDRA = "cassandra";
  var TMP_DBSYSTEMVALUES_HBASE = "hbase";
  var TMP_DBSYSTEMVALUES_MONGODB = "mongodb";
  var TMP_DBSYSTEMVALUES_REDIS = "redis";
  var TMP_DBSYSTEMVALUES_COUCHBASE = "couchbase";
  var TMP_DBSYSTEMVALUES_COUCHDB = "couchdb";
  var TMP_DBSYSTEMVALUES_COSMOSDB = "cosmosdb";
  var TMP_DBSYSTEMVALUES_DYNAMODB = "dynamodb";
  var TMP_DBSYSTEMVALUES_NEO4J = "neo4j";
  var TMP_DBSYSTEMVALUES_GEODE = "geode";
  var TMP_DBSYSTEMVALUES_ELASTICSEARCH = "elasticsearch";
  var TMP_DBSYSTEMVALUES_MEMCACHED = "memcached";
  var TMP_DBSYSTEMVALUES_COCKROACHDB = "cockroachdb";
  exports.DBSYSTEMVALUES_OTHER_SQL = TMP_DBSYSTEMVALUES_OTHER_SQL;
  exports.DBSYSTEMVALUES_MSSQL = TMP_DBSYSTEMVALUES_MSSQL;
  exports.DBSYSTEMVALUES_MYSQL = TMP_DBSYSTEMVALUES_MYSQL;
  exports.DBSYSTEMVALUES_ORACLE = TMP_DBSYSTEMVALUES_ORACLE;
  exports.DBSYSTEMVALUES_DB2 = TMP_DBSYSTEMVALUES_DB2;
  exports.DBSYSTEMVALUES_POSTGRESQL = TMP_DBSYSTEMVALUES_POSTGRESQL;
  exports.DBSYSTEMVALUES_REDSHIFT = TMP_DBSYSTEMVALUES_REDSHIFT;
  exports.DBSYSTEMVALUES_HIVE = TMP_DBSYSTEMVALUES_HIVE;
  exports.DBSYSTEMVALUES_CLOUDSCAPE = TMP_DBSYSTEMVALUES_CLOUDSCAPE;
  exports.DBSYSTEMVALUES_HSQLDB = TMP_DBSYSTEMVALUES_HSQLDB;
  exports.DBSYSTEMVALUES_PROGRESS = TMP_DBSYSTEMVALUES_PROGRESS;
  exports.DBSYSTEMVALUES_MAXDB = TMP_DBSYSTEMVALUES_MAXDB;
  exports.DBSYSTEMVALUES_HANADB = TMP_DBSYSTEMVALUES_HANADB;
  exports.DBSYSTEMVALUES_INGRES = TMP_DBSYSTEMVALUES_INGRES;
  exports.DBSYSTEMVALUES_FIRSTSQL = TMP_DBSYSTEMVALUES_FIRSTSQL;
  exports.DBSYSTEMVALUES_EDB = TMP_DBSYSTEMVALUES_EDB;
  exports.DBSYSTEMVALUES_CACHE = TMP_DBSYSTEMVALUES_CACHE;
  exports.DBSYSTEMVALUES_ADABAS = TMP_DBSYSTEMVALUES_ADABAS;
  exports.DBSYSTEMVALUES_FIREBIRD = TMP_DBSYSTEMVALUES_FIREBIRD;
  exports.DBSYSTEMVALUES_DERBY = TMP_DBSYSTEMVALUES_DERBY;
  exports.DBSYSTEMVALUES_FILEMAKER = TMP_DBSYSTEMVALUES_FILEMAKER;
  exports.DBSYSTEMVALUES_INFORMIX = TMP_DBSYSTEMVALUES_INFORMIX;
  exports.DBSYSTEMVALUES_INSTANTDB = TMP_DBSYSTEMVALUES_INSTANTDB;
  exports.DBSYSTEMVALUES_INTERBASE = TMP_DBSYSTEMVALUES_INTERBASE;
  exports.DBSYSTEMVALUES_MARIADB = TMP_DBSYSTEMVALUES_MARIADB;
  exports.DBSYSTEMVALUES_NETEZZA = TMP_DBSYSTEMVALUES_NETEZZA;
  exports.DBSYSTEMVALUES_PERVASIVE = TMP_DBSYSTEMVALUES_PERVASIVE;
  exports.DBSYSTEMVALUES_POINTBASE = TMP_DBSYSTEMVALUES_POINTBASE;
  exports.DBSYSTEMVALUES_SQLITE = TMP_DBSYSTEMVALUES_SQLITE;
  exports.DBSYSTEMVALUES_SYBASE = TMP_DBSYSTEMVALUES_SYBASE;
  exports.DBSYSTEMVALUES_TERADATA = TMP_DBSYSTEMVALUES_TERADATA;
  exports.DBSYSTEMVALUES_VERTICA = TMP_DBSYSTEMVALUES_VERTICA;
  exports.DBSYSTEMVALUES_H2 = TMP_DBSYSTEMVALUES_H2;
  exports.DBSYSTEMVALUES_COLDFUSION = TMP_DBSYSTEMVALUES_COLDFUSION;
  exports.DBSYSTEMVALUES_CASSANDRA = TMP_DBSYSTEMVALUES_CASSANDRA;
  exports.DBSYSTEMVALUES_HBASE = TMP_DBSYSTEMVALUES_HBASE;
  exports.DBSYSTEMVALUES_MONGODB = TMP_DBSYSTEMVALUES_MONGODB;
  exports.DBSYSTEMVALUES_REDIS = TMP_DBSYSTEMVALUES_REDIS;
  exports.DBSYSTEMVALUES_COUCHBASE = TMP_DBSYSTEMVALUES_COUCHBASE;
  exports.DBSYSTEMVALUES_COUCHDB = TMP_DBSYSTEMVALUES_COUCHDB;
  exports.DBSYSTEMVALUES_COSMOSDB = TMP_DBSYSTEMVALUES_COSMOSDB;
  exports.DBSYSTEMVALUES_DYNAMODB = TMP_DBSYSTEMVALUES_DYNAMODB;
  exports.DBSYSTEMVALUES_NEO4J = TMP_DBSYSTEMVALUES_NEO4J;
  exports.DBSYSTEMVALUES_GEODE = TMP_DBSYSTEMVALUES_GEODE;
  exports.DBSYSTEMVALUES_ELASTICSEARCH = TMP_DBSYSTEMVALUES_ELASTICSEARCH;
  exports.DBSYSTEMVALUES_MEMCACHED = TMP_DBSYSTEMVALUES_MEMCACHED;
  exports.DBSYSTEMVALUES_COCKROACHDB = TMP_DBSYSTEMVALUES_COCKROACHDB;
  exports.DbSystemValues = /* @__PURE__ */ (0, utils_1.createConstMap)([
    TMP_DBSYSTEMVALUES_OTHER_SQL,
    TMP_DBSYSTEMVALUES_MSSQL,
    TMP_DBSYSTEMVALUES_MYSQL,
    TMP_DBSYSTEMVALUES_ORACLE,
    TMP_DBSYSTEMVALUES_DB2,
    TMP_DBSYSTEMVALUES_POSTGRESQL,
    TMP_DBSYSTEMVALUES_REDSHIFT,
    TMP_DBSYSTEMVALUES_HIVE,
    TMP_DBSYSTEMVALUES_CLOUDSCAPE,
    TMP_DBSYSTEMVALUES_HSQLDB,
    TMP_DBSYSTEMVALUES_PROGRESS,
    TMP_DBSYSTEMVALUES_MAXDB,
    TMP_DBSYSTEMVALUES_HANADB,
    TMP_DBSYSTEMVALUES_INGRES,
    TMP_DBSYSTEMVALUES_FIRSTSQL,
    TMP_DBSYSTEMVALUES_EDB,
    TMP_DBSYSTEMVALUES_CACHE,
    TMP_DBSYSTEMVALUES_ADABAS,
    TMP_DBSYSTEMVALUES_FIREBIRD,
    TMP_DBSYSTEMVALUES_DERBY,
    TMP_DBSYSTEMVALUES_FILEMAKER,
    TMP_DBSYSTEMVALUES_INFORMIX,
    TMP_DBSYSTEMVALUES_INSTANTDB,
    TMP_DBSYSTEMVALUES_INTERBASE,
    TMP_DBSYSTEMVALUES_MARIADB,
    TMP_DBSYSTEMVALUES_NETEZZA,
    TMP_DBSYSTEMVALUES_PERVASIVE,
    TMP_DBSYSTEMVALUES_POINTBASE,
    TMP_DBSYSTEMVALUES_SQLITE,
    TMP_DBSYSTEMVALUES_SYBASE,
    TMP_DBSYSTEMVALUES_TERADATA,
    TMP_DBSYSTEMVALUES_VERTICA,
    TMP_DBSYSTEMVALUES_H2,
    TMP_DBSYSTEMVALUES_COLDFUSION,
    TMP_DBSYSTEMVALUES_CASSANDRA,
    TMP_DBSYSTEMVALUES_HBASE,
    TMP_DBSYSTEMVALUES_MONGODB,
    TMP_DBSYSTEMVALUES_REDIS,
    TMP_DBSYSTEMVALUES_COUCHBASE,
    TMP_DBSYSTEMVALUES_COUCHDB,
    TMP_DBSYSTEMVALUES_COSMOSDB,
    TMP_DBSYSTEMVALUES_DYNAMODB,
    TMP_DBSYSTEMVALUES_NEO4J,
    TMP_DBSYSTEMVALUES_GEODE,
    TMP_DBSYSTEMVALUES_ELASTICSEARCH,
    TMP_DBSYSTEMVALUES_MEMCACHED,
    TMP_DBSYSTEMVALUES_COCKROACHDB
  ]);
  var TMP_DBCASSANDRACONSISTENCYLEVELVALUES_ALL = "all";
  var TMP_DBCASSANDRACONSISTENCYLEVELVALUES_EACH_QUORUM = "each_quorum";
  var TMP_DBCASSANDRACONSISTENCYLEVELVALUES_QUORUM = "quorum";
  var TMP_DBCASSANDRACONSISTENCYLEVELVALUES_LOCAL_QUORUM = "local_quorum";
  var TMP_DBCASSANDRACONSISTENCYLEVELVALUES_ONE = "one";
  var TMP_DBCASSANDRACONSISTENCYLEVELVALUES_TWO = "two";
  var TMP_DBCASSANDRACONSISTENCYLEVELVALUES_THREE = "three";
  var TMP_DBCASSANDRACONSISTENCYLEVELVALUES_LOCAL_ONE = "local_one";
  var TMP_DBCASSANDRACONSISTENCYLEVELVALUES_ANY = "any";
  var TMP_DBCASSANDRACONSISTENCYLEVELVALUES_SERIAL = "serial";
  var TMP_DBCASSANDRACONSISTENCYLEVELVALUES_LOCAL_SERIAL = "local_serial";
  exports.DBCASSANDRACONSISTENCYLEVELVALUES_ALL = TMP_DBCASSANDRACONSISTENCYLEVELVALUES_ALL;
  exports.DBCASSANDRACONSISTENCYLEVELVALUES_EACH_QUORUM = TMP_DBCASSANDRACONSISTENCYLEVELVALUES_EACH_QUORUM;
  exports.DBCASSANDRACONSISTENCYLEVELVALUES_QUORUM = TMP_DBCASSANDRACONSISTENCYLEVELVALUES_QUORUM;
  exports.DBCASSANDRACONSISTENCYLEVELVALUES_LOCAL_QUORUM = TMP_DBCASSANDRACONSISTENCYLEVELVALUES_LOCAL_QUORUM;
  exports.DBCASSANDRACONSISTENCYLEVELVALUES_ONE = TMP_DBCASSANDRACONSISTENCYLEVELVALUES_ONE;
  exports.DBCASSANDRACONSISTENCYLEVELVALUES_TWO = TMP_DBCASSANDRACONSISTENCYLEVELVALUES_TWO;
  exports.DBCASSANDRACONSISTENCYLEVELVALUES_THREE = TMP_DBCASSANDRACONSISTENCYLEVELVALUES_THREE;
  exports.DBCASSANDRACONSISTENCYLEVELVALUES_LOCAL_ONE = TMP_DBCASSANDRACONSISTENCYLEVELVALUES_LOCAL_ONE;
  exports.DBCASSANDRACONSISTENCYLEVELVALUES_ANY = TMP_DBCASSANDRACONSISTENCYLEVELVALUES_ANY;
  exports.DBCASSANDRACONSISTENCYLEVELVALUES_SERIAL = TMP_DBCASSANDRACONSISTENCYLEVELVALUES_SERIAL;
  exports.DBCASSANDRACONSISTENCYLEVELVALUES_LOCAL_SERIAL = TMP_DBCASSANDRACONSISTENCYLEVELVALUES_LOCAL_SERIAL;
  exports.DbCassandraConsistencyLevelValues = /* @__PURE__ */ (0, utils_1.createConstMap)([
    TMP_DBCASSANDRACONSISTENCYLEVELVALUES_ALL,
    TMP_DBCASSANDRACONSISTENCYLEVELVALUES_EACH_QUORUM,
    TMP_DBCASSANDRACONSISTENCYLEVELVALUES_QUORUM,
    TMP_DBCASSANDRACONSISTENCYLEVELVALUES_LOCAL_QUORUM,
    TMP_DBCASSANDRACONSISTENCYLEVELVALUES_ONE,
    TMP_DBCASSANDRACONSISTENCYLEVELVALUES_TWO,
    TMP_DBCASSANDRACONSISTENCYLEVELVALUES_THREE,
    TMP_DBCASSANDRACONSISTENCYLEVELVALUES_LOCAL_ONE,
    TMP_DBCASSANDRACONSISTENCYLEVELVALUES_ANY,
    TMP_DBCASSANDRACONSISTENCYLEVELVALUES_SERIAL,
    TMP_DBCASSANDRACONSISTENCYLEVELVALUES_LOCAL_SERIAL
  ]);
  var TMP_FAASTRIGGERVALUES_DATASOURCE = "datasource";
  var TMP_FAASTRIGGERVALUES_HTTP = "http";
  var TMP_FAASTRIGGERVALUES_PUBSUB = "pubsub";
  var TMP_FAASTRIGGERVALUES_TIMER = "timer";
  var TMP_FAASTRIGGERVALUES_OTHER = "other";
  exports.FAASTRIGGERVALUES_DATASOURCE = TMP_FAASTRIGGERVALUES_DATASOURCE;
  exports.FAASTRIGGERVALUES_HTTP = TMP_FAASTRIGGERVALUES_HTTP;
  exports.FAASTRIGGERVALUES_PUBSUB = TMP_FAASTRIGGERVALUES_PUBSUB;
  exports.FAASTRIGGERVALUES_TIMER = TMP_FAASTRIGGERVALUES_TIMER;
  exports.FAASTRIGGERVALUES_OTHER = TMP_FAASTRIGGERVALUES_OTHER;
  exports.FaasTriggerValues = /* @__PURE__ */ (0, utils_1.createConstMap)([
    TMP_FAASTRIGGERVALUES_DATASOURCE,
    TMP_FAASTRIGGERVALUES_HTTP,
    TMP_FAASTRIGGERVALUES_PUBSUB,
    TMP_FAASTRIGGERVALUES_TIMER,
    TMP_FAASTRIGGERVALUES_OTHER
  ]);
  var TMP_FAASDOCUMENTOPERATIONVALUES_INSERT = "insert";
  var TMP_FAASDOCUMENTOPERATIONVALUES_EDIT = "edit";
  var TMP_FAASDOCUMENTOPERATIONVALUES_DELETE = "delete";
  exports.FAASDOCUMENTOPERATIONVALUES_INSERT = TMP_FAASDOCUMENTOPERATIONVALUES_INSERT;
  exports.FAASDOCUMENTOPERATIONVALUES_EDIT = TMP_FAASDOCUMENTOPERATIONVALUES_EDIT;
  exports.FAASDOCUMENTOPERATIONVALUES_DELETE = TMP_FAASDOCUMENTOPERATIONVALUES_DELETE;
  exports.FaasDocumentOperationValues = /* @__PURE__ */ (0, utils_1.createConstMap)([
    TMP_FAASDOCUMENTOPERATIONVALUES_INSERT,
    TMP_FAASDOCUMENTOPERATIONVALUES_EDIT,
    TMP_FAASDOCUMENTOPERATIONVALUES_DELETE
  ]);
  var TMP_FAASINVOKEDPROVIDERVALUES_ALIBABA_CLOUD = "alibaba_cloud";
  var TMP_FAASINVOKEDPROVIDERVALUES_AWS = "aws";
  var TMP_FAASINVOKEDPROVIDERVALUES_AZURE = "azure";
  var TMP_FAASINVOKEDPROVIDERVALUES_GCP = "gcp";
  exports.FAASINVOKEDPROVIDERVALUES_ALIBABA_CLOUD = TMP_FAASINVOKEDPROVIDERVALUES_ALIBABA_CLOUD;
  exports.FAASINVOKEDPROVIDERVALUES_AWS = TMP_FAASINVOKEDPROVIDERVALUES_AWS;
  exports.FAASINVOKEDPROVIDERVALUES_AZURE = TMP_FAASINVOKEDPROVIDERVALUES_AZURE;
  exports.FAASINVOKEDPROVIDERVALUES_GCP = TMP_FAASINVOKEDPROVIDERVALUES_GCP;
  exports.FaasInvokedProviderValues = /* @__PURE__ */ (0, utils_1.createConstMap)([
    TMP_FAASINVOKEDPROVIDERVALUES_ALIBABA_CLOUD,
    TMP_FAASINVOKEDPROVIDERVALUES_AWS,
    TMP_FAASINVOKEDPROVIDERVALUES_AZURE,
    TMP_FAASINVOKEDPROVIDERVALUES_GCP
  ]);
  var TMP_NETTRANSPORTVALUES_IP_TCP = "ip_tcp";
  var TMP_NETTRANSPORTVALUES_IP_UDP = "ip_udp";
  var TMP_NETTRANSPORTVALUES_IP = "ip";
  var TMP_NETTRANSPORTVALUES_UNIX = "unix";
  var TMP_NETTRANSPORTVALUES_PIPE = "pipe";
  var TMP_NETTRANSPORTVALUES_INPROC = "inproc";
  var TMP_NETTRANSPORTVALUES_OTHER = "other";
  exports.NETTRANSPORTVALUES_IP_TCP = TMP_NETTRANSPORTVALUES_IP_TCP;
  exports.NETTRANSPORTVALUES_IP_UDP = TMP_NETTRANSPORTVALUES_IP_UDP;
  exports.NETTRANSPORTVALUES_IP = TMP_NETTRANSPORTVALUES_IP;
  exports.NETTRANSPORTVALUES_UNIX = TMP_NETTRANSPORTVALUES_UNIX;
  exports.NETTRANSPORTVALUES_PIPE = TMP_NETTRANSPORTVALUES_PIPE;
  exports.NETTRANSPORTVALUES_INPROC = TMP_NETTRANSPORTVALUES_INPROC;
  exports.NETTRANSPORTVALUES_OTHER = TMP_NETTRANSPORTVALUES_OTHER;
  exports.NetTransportValues = /* @__PURE__ */ (0, utils_1.createConstMap)([
    TMP_NETTRANSPORTVALUES_IP_TCP,
    TMP_NETTRANSPORTVALUES_IP_UDP,
    TMP_NETTRANSPORTVALUES_IP,
    TMP_NETTRANSPORTVALUES_UNIX,
    TMP_NETTRANSPORTVALUES_PIPE,
    TMP_NETTRANSPORTVALUES_INPROC,
    TMP_NETTRANSPORTVALUES_OTHER
  ]);
  var TMP_NETHOSTCONNECTIONTYPEVALUES_WIFI = "wifi";
  var TMP_NETHOSTCONNECTIONTYPEVALUES_WIRED = "wired";
  var TMP_NETHOSTCONNECTIONTYPEVALUES_CELL = "cell";
  var TMP_NETHOSTCONNECTIONTYPEVALUES_UNAVAILABLE = "unavailable";
  var TMP_NETHOSTCONNECTIONTYPEVALUES_UNKNOWN = "unknown";
  exports.NETHOSTCONNECTIONTYPEVALUES_WIFI = TMP_NETHOSTCONNECTIONTYPEVALUES_WIFI;
  exports.NETHOSTCONNECTIONTYPEVALUES_WIRED = TMP_NETHOSTCONNECTIONTYPEVALUES_WIRED;
  exports.NETHOSTCONNECTIONTYPEVALUES_CELL = TMP_NETHOSTCONNECTIONTYPEVALUES_CELL;
  exports.NETHOSTCONNECTIONTYPEVALUES_UNAVAILABLE = TMP_NETHOSTCONNECTIONTYPEVALUES_UNAVAILABLE;
  exports.NETHOSTCONNECTIONTYPEVALUES_UNKNOWN = TMP_NETHOSTCONNECTIONTYPEVALUES_UNKNOWN;
  exports.NetHostConnectionTypeValues = /* @__PURE__ */ (0, utils_1.createConstMap)([
    TMP_NETHOSTCONNECTIONTYPEVALUES_WIFI,
    TMP_NETHOSTCONNECTIONTYPEVALUES_WIRED,
    TMP_NETHOSTCONNECTIONTYPEVALUES_CELL,
    TMP_NETHOSTCONNECTIONTYPEVALUES_UNAVAILABLE,
    TMP_NETHOSTCONNECTIONTYPEVALUES_UNKNOWN
  ]);
  var TMP_NETHOSTCONNECTIONSUBTYPEVALUES_GPRS = "gprs";
  var TMP_NETHOSTCONNECTIONSUBTYPEVALUES_EDGE = "edge";
  var TMP_NETHOSTCONNECTIONSUBTYPEVALUES_UMTS = "umts";
  var TMP_NETHOSTCONNECTIONSUBTYPEVALUES_CDMA = "cdma";
  var TMP_NETHOSTCONNECTIONSUBTYPEVALUES_EVDO_0 = "evdo_0";
  var TMP_NETHOSTCONNECTIONSUBTYPEVALUES_EVDO_A = "evdo_a";
  var TMP_NETHOSTCONNECTIONSUBTYPEVALUES_CDMA2000_1XRTT = "cdma2000_1xrtt";
  var TMP_NETHOSTCONNECTIONSUBTYPEVALUES_HSDPA = "hsdpa";
  var TMP_NETHOSTCONNECTIONSUBTYPEVALUES_HSUPA = "hsupa";
  var TMP_NETHOSTCONNECTIONSUBTYPEVALUES_HSPA = "hspa";
  var TMP_NETHOSTCONNECTIONSUBTYPEVALUES_IDEN = "iden";
  var TMP_NETHOSTCONNECTIONSUBTYPEVALUES_EVDO_B = "evdo_b";
  var TMP_NETHOSTCONNECTIONSUBTYPEVALUES_LTE = "lte";
  var TMP_NETHOSTCONNECTIONSUBTYPEVALUES_EHRPD = "ehrpd";
  var TMP_NETHOSTCONNECTIONSUBTYPEVALUES_HSPAP = "hspap";
  var TMP_NETHOSTCONNECTIONSUBTYPEVALUES_GSM = "gsm";
  var TMP_NETHOSTCONNECTIONSUBTYPEVALUES_TD_SCDMA = "td_scdma";
  var TMP_NETHOSTCONNECTIONSUBTYPEVALUES_IWLAN = "iwlan";
  var TMP_NETHOSTCONNECTIONSUBTYPEVALUES_NR = "nr";
  var TMP_NETHOSTCONNECTIONSUBTYPEVALUES_NRNSA = "nrnsa";
  var TMP_NETHOSTCONNECTIONSUBTYPEVALUES_LTE_CA = "lte_ca";
  exports.NETHOSTCONNECTIONSUBTYPEVALUES_GPRS = TMP_NETHOSTCONNECTIONSUBTYPEVALUES_GPRS;
  exports.NETHOSTCONNECTIONSUBTYPEVALUES_EDGE = TMP_NETHOSTCONNECTIONSUBTYPEVALUES_EDGE;
  exports.NETHOSTCONNECTIONSUBTYPEVALUES_UMTS = TMP_NETHOSTCONNECTIONSUBTYPEVALUES_UMTS;
  exports.NETHOSTCONNECTIONSUBTYPEVALUES_CDMA = TMP_NETHOSTCONNECTIONSUBTYPEVALUES_CDMA;
  exports.NETHOSTCONNECTIONSUBTYPEVALUES_EVDO_0 = TMP_NETHOSTCONNECTIONSUBTYPEVALUES_EVDO_0;
  exports.NETHOSTCONNECTIONSUBTYPEVALUES_EVDO_A = TMP_NETHOSTCONNECTIONSUBTYPEVALUES_EVDO_A;
  exports.NETHOSTCONNECTIONSUBTYPEVALUES_CDMA2000_1XRTT = TMP_NETHOSTCONNECTIONSUBTYPEVALUES_CDMA2000_1XRTT;
  exports.NETHOSTCONNECTIONSUBTYPEVALUES_HSDPA = TMP_NETHOSTCONNECTIONSUBTYPEVALUES_HSDPA;
  exports.NETHOSTCONNECTIONSUBTYPEVALUES_HSUPA = TMP_NETHOSTCONNECTIONSUBTYPEVALUES_HSUPA;
  exports.NETHOSTCONNECTIONSUBTYPEVALUES_HSPA = TMP_NETHOSTCONNECTIONSUBTYPEVALUES_HSPA;
  exports.NETHOSTCONNECTIONSUBTYPEVALUES_IDEN = TMP_NETHOSTCONNECTIONSUBTYPEVALUES_IDEN;
  exports.NETHOSTCONNECTIONSUBTYPEVALUES_EVDO_B = TMP_NETHOSTCONNECTIONSUBTYPEVALUES_EVDO_B;
  exports.NETHOSTCONNECTIONSUBTYPEVALUES_LTE = TMP_NETHOSTCONNECTIONSUBTYPEVALUES_LTE;
  exports.NETHOSTCONNECTIONSUBTYPEVALUES_EHRPD = TMP_NETHOSTCONNECTIONSUBTYPEVALUES_EHRPD;
  exports.NETHOSTCONNECTIONSUBTYPEVALUES_HSPAP = TMP_NETHOSTCONNECTIONSUBTYPEVALUES_HSPAP;
  exports.NETHOSTCONNECTIONSUBTYPEVALUES_GSM = TMP_NETHOSTCONNECTIONSUBTYPEVALUES_GSM;
  exports.NETHOSTCONNECTIONSUBTYPEVALUES_TD_SCDMA = TMP_NETHOSTCONNECTIONSUBTYPEVALUES_TD_SCDMA;
  exports.NETHOSTCONNECTIONSUBTYPEVALUES_IWLAN = TMP_NETHOSTCONNECTIONSUBTYPEVALUES_IWLAN;
  exports.NETHOSTCONNECTIONSUBTYPEVALUES_NR = TMP_NETHOSTCONNECTIONSUBTYPEVALUES_NR;
  exports.NETHOSTCONNECTIONSUBTYPEVALUES_NRNSA = TMP_NETHOSTCONNECTIONSUBTYPEVALUES_NRNSA;
  exports.NETHOSTCONNECTIONSUBTYPEVALUES_LTE_CA = TMP_NETHOSTCONNECTIONSUBTYPEVALUES_LTE_CA;
  exports.NetHostConnectionSubtypeValues = /* @__PURE__ */ (0, utils_1.createConstMap)([
    TMP_NETHOSTCONNECTIONSUBTYPEVALUES_GPRS,
    TMP_NETHOSTCONNECTIONSUBTYPEVALUES_EDGE,
    TMP_NETHOSTCONNECTIONSUBTYPEVALUES_UMTS,
    TMP_NETHOSTCONNECTIONSUBTYPEVALUES_CDMA,
    TMP_NETHOSTCONNECTIONSUBTYPEVALUES_EVDO_0,
    TMP_NETHOSTCONNECTIONSUBTYPEVALUES_EVDO_A,
    TMP_NETHOSTCONNECTIONSUBTYPEVALUES_CDMA2000_1XRTT,
    TMP_NETHOSTCONNECTIONSUBTYPEVALUES_HSDPA,
    TMP_NETHOSTCONNECTIONSUBTYPEVALUES_HSUPA,
    TMP_NETHOSTCONNECTIONSUBTYPEVALUES_HSPA,
    TMP_NETHOSTCONNECTIONSUBTYPEVALUES_IDEN,
    TMP_NETHOSTCONNECTIONSUBTYPEVALUES_EVDO_B,
    TMP_NETHOSTCONNECTIONSUBTYPEVALUES_LTE,
    TMP_NETHOSTCONNECTIONSUBTYPEVALUES_EHRPD,
    TMP_NETHOSTCONNECTIONSUBTYPEVALUES_HSPAP,
    TMP_NETHOSTCONNECTIONSUBTYPEVALUES_GSM,
    TMP_NETHOSTCONNECTIONSUBTYPEVALUES_TD_SCDMA,
    TMP_NETHOSTCONNECTIONSUBTYPEVALUES_IWLAN,
    TMP_NETHOSTCONNECTIONSUBTYPEVALUES_NR,
    TMP_NETHOSTCONNECTIONSUBTYPEVALUES_NRNSA,
    TMP_NETHOSTCONNECTIONSUBTYPEVALUES_LTE_CA
  ]);
  var TMP_HTTPFLAVORVALUES_HTTP_1_0 = "1.0";
  var TMP_HTTPFLAVORVALUES_HTTP_1_1 = "1.1";
  var TMP_HTTPFLAVORVALUES_HTTP_2_0 = "2.0";
  var TMP_HTTPFLAVORVALUES_SPDY = "SPDY";
  var TMP_HTTPFLAVORVALUES_QUIC = "QUIC";
  exports.HTTPFLAVORVALUES_HTTP_1_0 = TMP_HTTPFLAVORVALUES_HTTP_1_0;
  exports.HTTPFLAVORVALUES_HTTP_1_1 = TMP_HTTPFLAVORVALUES_HTTP_1_1;
  exports.HTTPFLAVORVALUES_HTTP_2_0 = TMP_HTTPFLAVORVALUES_HTTP_2_0;
  exports.HTTPFLAVORVALUES_SPDY = TMP_HTTPFLAVORVALUES_SPDY;
  exports.HTTPFLAVORVALUES_QUIC = TMP_HTTPFLAVORVALUES_QUIC;
  exports.HttpFlavorValues = {
    HTTP_1_0: TMP_HTTPFLAVORVALUES_HTTP_1_0,
    HTTP_1_1: TMP_HTTPFLAVORVALUES_HTTP_1_1,
    HTTP_2_0: TMP_HTTPFLAVORVALUES_HTTP_2_0,
    SPDY: TMP_HTTPFLAVORVALUES_SPDY,
    QUIC: TMP_HTTPFLAVORVALUES_QUIC
  };
  var TMP_MESSAGINGDESTINATIONKINDVALUES_QUEUE = "queue";
  var TMP_MESSAGINGDESTINATIONKINDVALUES_TOPIC = "topic";
  exports.MESSAGINGDESTINATIONKINDVALUES_QUEUE = TMP_MESSAGINGDESTINATIONKINDVALUES_QUEUE;
  exports.MESSAGINGDESTINATIONKINDVALUES_TOPIC = TMP_MESSAGINGDESTINATIONKINDVALUES_TOPIC;
  exports.MessagingDestinationKindValues = /* @__PURE__ */ (0, utils_1.createConstMap)([
    TMP_MESSAGINGDESTINATIONKINDVALUES_QUEUE,
    TMP_MESSAGINGDESTINATIONKINDVALUES_TOPIC
  ]);
  var TMP_MESSAGINGOPERATIONVALUES_RECEIVE = "receive";
  var TMP_MESSAGINGOPERATIONVALUES_PROCESS = "process";
  exports.MESSAGINGOPERATIONVALUES_RECEIVE = TMP_MESSAGINGOPERATIONVALUES_RECEIVE;
  exports.MESSAGINGOPERATIONVALUES_PROCESS = TMP_MESSAGINGOPERATIONVALUES_PROCESS;
  exports.MessagingOperationValues = /* @__PURE__ */ (0, utils_1.createConstMap)([
    TMP_MESSAGINGOPERATIONVALUES_RECEIVE,
    TMP_MESSAGINGOPERATIONVALUES_PROCESS
  ]);
  var TMP_RPCGRPCSTATUSCODEVALUES_OK = 0;
  var TMP_RPCGRPCSTATUSCODEVALUES_CANCELLED = 1;
  var TMP_RPCGRPCSTATUSCODEVALUES_UNKNOWN = 2;
  var TMP_RPCGRPCSTATUSCODEVALUES_INVALID_ARGUMENT = 3;
  var TMP_RPCGRPCSTATUSCODEVALUES_DEADLINE_EXCEEDED = 4;
  var TMP_RPCGRPCSTATUSCODEVALUES_NOT_FOUND = 5;
  var TMP_RPCGRPCSTATUSCODEVALUES_ALREADY_EXISTS = 6;
  var TMP_RPCGRPCSTATUSCODEVALUES_PERMISSION_DENIED = 7;
  var TMP_RPCGRPCSTATUSCODEVALUES_RESOURCE_EXHAUSTED = 8;
  var TMP_RPCGRPCSTATUSCODEVALUES_FAILED_PRECONDITION = 9;
  var TMP_RPCGRPCSTATUSCODEVALUES_ABORTED = 10;
  var TMP_RPCGRPCSTATUSCODEVALUES_OUT_OF_RANGE = 11;
  var TMP_RPCGRPCSTATUSCODEVALUES_UNIMPLEMENTED = 12;
  var TMP_RPCGRPCSTATUSCODEVALUES_INTERNAL = 13;
  var TMP_RPCGRPCSTATUSCODEVALUES_UNAVAILABLE = 14;
  var TMP_RPCGRPCSTATUSCODEVALUES_DATA_LOSS = 15;
  var TMP_RPCGRPCSTATUSCODEVALUES_UNAUTHENTICATED = 16;
  exports.RPCGRPCSTATUSCODEVALUES_OK = TMP_RPCGRPCSTATUSCODEVALUES_OK;
  exports.RPCGRPCSTATUSCODEVALUES_CANCELLED = TMP_RPCGRPCSTATUSCODEVALUES_CANCELLED;
  exports.RPCGRPCSTATUSCODEVALUES_UNKNOWN = TMP_RPCGRPCSTATUSCODEVALUES_UNKNOWN;
  exports.RPCGRPCSTATUSCODEVALUES_INVALID_ARGUMENT = TMP_RPCGRPCSTATUSCODEVALUES_INVALID_ARGUMENT;
  exports.RPCGRPCSTATUSCODEVALUES_DEADLINE_EXCEEDED = TMP_RPCGRPCSTATUSCODEVALUES_DEADLINE_EXCEEDED;
  exports.RPCGRPCSTATUSCODEVALUES_NOT_FOUND = TMP_RPCGRPCSTATUSCODEVALUES_NOT_FOUND;
  exports.RPCGRPCSTATUSCODEVALUES_ALREADY_EXISTS = TMP_RPCGRPCSTATUSCODEVALUES_ALREADY_EXISTS;
  exports.RPCGRPCSTATUSCODEVALUES_PERMISSION_DENIED = TMP_RPCGRPCSTATUSCODEVALUES_PERMISSION_DENIED;
  exports.RPCGRPCSTATUSCODEVALUES_RESOURCE_EXHAUSTED = TMP_RPCGRPCSTATUSCODEVALUES_RESOURCE_EXHAUSTED;
  exports.RPCGRPCSTATUSCODEVALUES_FAILED_PRECONDITION = TMP_RPCGRPCSTATUSCODEVALUES_FAILED_PRECONDITION;
  exports.RPCGRPCSTATUSCODEVALUES_ABORTED = TMP_RPCGRPCSTATUSCODEVALUES_ABORTED;
  exports.RPCGRPCSTATUSCODEVALUES_OUT_OF_RANGE = TMP_RPCGRPCSTATUSCODEVALUES_OUT_OF_RANGE;
  exports.RPCGRPCSTATUSCODEVALUES_UNIMPLEMENTED = TMP_RPCGRPCSTATUSCODEVALUES_UNIMPLEMENTED;
  exports.RPCGRPCSTATUSCODEVALUES_INTERNAL = TMP_RPCGRPCSTATUSCODEVALUES_INTERNAL;
  exports.RPCGRPCSTATUSCODEVALUES_UNAVAILABLE = TMP_RPCGRPCSTATUSCODEVALUES_UNAVAILABLE;
  exports.RPCGRPCSTATUSCODEVALUES_DATA_LOSS = TMP_RPCGRPCSTATUSCODEVALUES_DATA_LOSS;
  exports.RPCGRPCSTATUSCODEVALUES_UNAUTHENTICATED = TMP_RPCGRPCSTATUSCODEVALUES_UNAUTHENTICATED;
  exports.RpcGrpcStatusCodeValues = {
    OK: TMP_RPCGRPCSTATUSCODEVALUES_OK,
    CANCELLED: TMP_RPCGRPCSTATUSCODEVALUES_CANCELLED,
    UNKNOWN: TMP_RPCGRPCSTATUSCODEVALUES_UNKNOWN,
    INVALID_ARGUMENT: TMP_RPCGRPCSTATUSCODEVALUES_INVALID_ARGUMENT,
    DEADLINE_EXCEEDED: TMP_RPCGRPCSTATUSCODEVALUES_DEADLINE_EXCEEDED,
    NOT_FOUND: TMP_RPCGRPCSTATUSCODEVALUES_NOT_FOUND,
    ALREADY_EXISTS: TMP_RPCGRPCSTATUSCODEVALUES_ALREADY_EXISTS,
    PERMISSION_DENIED: TMP_RPCGRPCSTATUSCODEVALUES_PERMISSION_DENIED,
    RESOURCE_EXHAUSTED: TMP_RPCGRPCSTATUSCODEVALUES_RESOURCE_EXHAUSTED,
    FAILED_PRECONDITION: TMP_RPCGRPCSTATUSCODEVALUES_FAILED_PRECONDITION,
    ABORTED: TMP_RPCGRPCSTATUSCODEVALUES_ABORTED,
    OUT_OF_RANGE: TMP_RPCGRPCSTATUSCODEVALUES_OUT_OF_RANGE,
    UNIMPLEMENTED: TMP_RPCGRPCSTATUSCODEVALUES_UNIMPLEMENTED,
    INTERNAL: TMP_RPCGRPCSTATUSCODEVALUES_INTERNAL,
    UNAVAILABLE: TMP_RPCGRPCSTATUSCODEVALUES_UNAVAILABLE,
    DATA_LOSS: TMP_RPCGRPCSTATUSCODEVALUES_DATA_LOSS,
    UNAUTHENTICATED: TMP_RPCGRPCSTATUSCODEVALUES_UNAUTHENTICATED
  };
  var TMP_MESSAGETYPEVALUES_SENT = "SENT";
  var TMP_MESSAGETYPEVALUES_RECEIVED = "RECEIVED";
  exports.MESSAGETYPEVALUES_SENT = TMP_MESSAGETYPEVALUES_SENT;
  exports.MESSAGETYPEVALUES_RECEIVED = TMP_MESSAGETYPEVALUES_RECEIVED;
  exports.MessageTypeValues = /* @__PURE__ */ (0, utils_1.createConstMap)([
    TMP_MESSAGETYPEVALUES_SENT,
    TMP_MESSAGETYPEVALUES_RECEIVED
  ]);
});

// node_modules/@opentelemetry/core/node_modules/@opentelemetry/semantic-conventions/build/src/trace/index.js
var require_trace2 = __commonJS((exports) => {
  var __createBinding = exports && exports.__createBinding || (Object.create ? function(o, m, k, k2) {
    if (k2 === undefined)
      k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() {
      return m[k];
    } });
  } : function(o, m, k, k2) {
    if (k2 === undefined)
      k2 = k;
    o[k2] = m[k];
  });
  var __exportStar = exports && exports.__exportStar || function(m, exports2) {
    for (var p in m)
      if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p))
        __createBinding(exports2, m, p);
  };
  Object.defineProperty(exports, "__esModule", { value: true });
  __exportStar(require_SemanticAttributes(), exports);
});

// node_modules/@opentelemetry/core/node_modules/@opentelemetry/semantic-conventions/build/src/resource/SemanticResourceAttributes.js
var require_SemanticResourceAttributes = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.SEMRESATTRS_K8S_STATEFULSET_NAME = exports.SEMRESATTRS_K8S_STATEFULSET_UID = exports.SEMRESATTRS_K8S_DEPLOYMENT_NAME = exports.SEMRESATTRS_K8S_DEPLOYMENT_UID = exports.SEMRESATTRS_K8S_REPLICASET_NAME = exports.SEMRESATTRS_K8S_REPLICASET_UID = exports.SEMRESATTRS_K8S_CONTAINER_NAME = exports.SEMRESATTRS_K8S_POD_NAME = exports.SEMRESATTRS_K8S_POD_UID = exports.SEMRESATTRS_K8S_NAMESPACE_NAME = exports.SEMRESATTRS_K8S_NODE_UID = exports.SEMRESATTRS_K8S_NODE_NAME = exports.SEMRESATTRS_K8S_CLUSTER_NAME = exports.SEMRESATTRS_HOST_IMAGE_VERSION = exports.SEMRESATTRS_HOST_IMAGE_ID = exports.SEMRESATTRS_HOST_IMAGE_NAME = exports.SEMRESATTRS_HOST_ARCH = exports.SEMRESATTRS_HOST_TYPE = exports.SEMRESATTRS_HOST_NAME = exports.SEMRESATTRS_HOST_ID = exports.SEMRESATTRS_FAAS_MAX_MEMORY = exports.SEMRESATTRS_FAAS_INSTANCE = exports.SEMRESATTRS_FAAS_VERSION = exports.SEMRESATTRS_FAAS_ID = exports.SEMRESATTRS_FAAS_NAME = exports.SEMRESATTRS_DEVICE_MODEL_NAME = exports.SEMRESATTRS_DEVICE_MODEL_IDENTIFIER = exports.SEMRESATTRS_DEVICE_ID = exports.SEMRESATTRS_DEPLOYMENT_ENVIRONMENT = exports.SEMRESATTRS_CONTAINER_IMAGE_TAG = exports.SEMRESATTRS_CONTAINER_IMAGE_NAME = exports.SEMRESATTRS_CONTAINER_RUNTIME = exports.SEMRESATTRS_CONTAINER_ID = exports.SEMRESATTRS_CONTAINER_NAME = exports.SEMRESATTRS_AWS_LOG_STREAM_ARNS = exports.SEMRESATTRS_AWS_LOG_STREAM_NAMES = exports.SEMRESATTRS_AWS_LOG_GROUP_ARNS = exports.SEMRESATTRS_AWS_LOG_GROUP_NAMES = exports.SEMRESATTRS_AWS_EKS_CLUSTER_ARN = exports.SEMRESATTRS_AWS_ECS_TASK_REVISION = exports.SEMRESATTRS_AWS_ECS_TASK_FAMILY = exports.SEMRESATTRS_AWS_ECS_TASK_ARN = exports.SEMRESATTRS_AWS_ECS_LAUNCHTYPE = exports.SEMRESATTRS_AWS_ECS_CLUSTER_ARN = exports.SEMRESATTRS_AWS_ECS_CONTAINER_ARN = exports.SEMRESATTRS_CLOUD_PLATFORM = exports.SEMRESATTRS_CLOUD_AVAILABILITY_ZONE = exports.SEMRESATTRS_CLOUD_REGION = exports.SEMRESATTRS_CLOUD_ACCOUNT_ID = exports.SEMRESATTRS_CLOUD_PROVIDER = undefined;
  exports.CLOUDPLATFORMVALUES_GCP_COMPUTE_ENGINE = exports.CLOUDPLATFORMVALUES_AZURE_APP_SERVICE = exports.CLOUDPLATFORMVALUES_AZURE_FUNCTIONS = exports.CLOUDPLATFORMVALUES_AZURE_AKS = exports.CLOUDPLATFORMVALUES_AZURE_CONTAINER_INSTANCES = exports.CLOUDPLATFORMVALUES_AZURE_VM = exports.CLOUDPLATFORMVALUES_AWS_ELASTIC_BEANSTALK = exports.CLOUDPLATFORMVALUES_AWS_LAMBDA = exports.CLOUDPLATFORMVALUES_AWS_EKS = exports.CLOUDPLATFORMVALUES_AWS_ECS = exports.CLOUDPLATFORMVALUES_AWS_EC2 = exports.CLOUDPLATFORMVALUES_ALIBABA_CLOUD_FC = exports.CLOUDPLATFORMVALUES_ALIBABA_CLOUD_ECS = exports.CloudProviderValues = exports.CLOUDPROVIDERVALUES_GCP = exports.CLOUDPROVIDERVALUES_AZURE = exports.CLOUDPROVIDERVALUES_AWS = exports.CLOUDPROVIDERVALUES_ALIBABA_CLOUD = exports.SemanticResourceAttributes = exports.SEMRESATTRS_WEBENGINE_DESCRIPTION = exports.SEMRESATTRS_WEBENGINE_VERSION = exports.SEMRESATTRS_WEBENGINE_NAME = exports.SEMRESATTRS_TELEMETRY_AUTO_VERSION = exports.SEMRESATTRS_TELEMETRY_SDK_VERSION = exports.SEMRESATTRS_TELEMETRY_SDK_LANGUAGE = exports.SEMRESATTRS_TELEMETRY_SDK_NAME = exports.SEMRESATTRS_SERVICE_VERSION = exports.SEMRESATTRS_SERVICE_INSTANCE_ID = exports.SEMRESATTRS_SERVICE_NAMESPACE = exports.SEMRESATTRS_SERVICE_NAME = exports.SEMRESATTRS_PROCESS_RUNTIME_DESCRIPTION = exports.SEMRESATTRS_PROCESS_RUNTIME_VERSION = exports.SEMRESATTRS_PROCESS_RUNTIME_NAME = exports.SEMRESATTRS_PROCESS_OWNER = exports.SEMRESATTRS_PROCESS_COMMAND_ARGS = exports.SEMRESATTRS_PROCESS_COMMAND_LINE = exports.SEMRESATTRS_PROCESS_COMMAND = exports.SEMRESATTRS_PROCESS_EXECUTABLE_PATH = exports.SEMRESATTRS_PROCESS_EXECUTABLE_NAME = exports.SEMRESATTRS_PROCESS_PID = exports.SEMRESATTRS_OS_VERSION = exports.SEMRESATTRS_OS_NAME = exports.SEMRESATTRS_OS_DESCRIPTION = exports.SEMRESATTRS_OS_TYPE = exports.SEMRESATTRS_K8S_CRONJOB_NAME = exports.SEMRESATTRS_K8S_CRONJOB_UID = exports.SEMRESATTRS_K8S_JOB_NAME = exports.SEMRESATTRS_K8S_JOB_UID = exports.SEMRESATTRS_K8S_DAEMONSET_NAME = exports.SEMRESATTRS_K8S_DAEMONSET_UID = undefined;
  exports.TelemetrySdkLanguageValues = exports.TELEMETRYSDKLANGUAGEVALUES_WEBJS = exports.TELEMETRYSDKLANGUAGEVALUES_RUBY = exports.TELEMETRYSDKLANGUAGEVALUES_PYTHON = exports.TELEMETRYSDKLANGUAGEVALUES_PHP = exports.TELEMETRYSDKLANGUAGEVALUES_NODEJS = exports.TELEMETRYSDKLANGUAGEVALUES_JAVA = exports.TELEMETRYSDKLANGUAGEVALUES_GO = exports.TELEMETRYSDKLANGUAGEVALUES_ERLANG = exports.TELEMETRYSDKLANGUAGEVALUES_DOTNET = exports.TELEMETRYSDKLANGUAGEVALUES_CPP = exports.OsTypeValues = exports.OSTYPEVALUES_Z_OS = exports.OSTYPEVALUES_SOLARIS = exports.OSTYPEVALUES_AIX = exports.OSTYPEVALUES_HPUX = exports.OSTYPEVALUES_DRAGONFLYBSD = exports.OSTYPEVALUES_OPENBSD = exports.OSTYPEVALUES_NETBSD = exports.OSTYPEVALUES_FREEBSD = exports.OSTYPEVALUES_DARWIN = exports.OSTYPEVALUES_LINUX = exports.OSTYPEVALUES_WINDOWS = exports.HostArchValues = exports.HOSTARCHVALUES_X86 = exports.HOSTARCHVALUES_PPC64 = exports.HOSTARCHVALUES_PPC32 = exports.HOSTARCHVALUES_IA64 = exports.HOSTARCHVALUES_ARM64 = exports.HOSTARCHVALUES_ARM32 = exports.HOSTARCHVALUES_AMD64 = exports.AwsEcsLaunchtypeValues = exports.AWSECSLAUNCHTYPEVALUES_FARGATE = exports.AWSECSLAUNCHTYPEVALUES_EC2 = exports.CloudPlatformValues = exports.CLOUDPLATFORMVALUES_GCP_APP_ENGINE = exports.CLOUDPLATFORMVALUES_GCP_CLOUD_FUNCTIONS = exports.CLOUDPLATFORMVALUES_GCP_KUBERNETES_ENGINE = exports.CLOUDPLATFORMVALUES_GCP_CLOUD_RUN = undefined;
  var utils_1 = require_utils4();
  var TMP_CLOUD_PROVIDER = "cloud.provider";
  var TMP_CLOUD_ACCOUNT_ID = "cloud.account.id";
  var TMP_CLOUD_REGION = "cloud.region";
  var TMP_CLOUD_AVAILABILITY_ZONE = "cloud.availability_zone";
  var TMP_CLOUD_PLATFORM = "cloud.platform";
  var TMP_AWS_ECS_CONTAINER_ARN = "aws.ecs.container.arn";
  var TMP_AWS_ECS_CLUSTER_ARN = "aws.ecs.cluster.arn";
  var TMP_AWS_ECS_LAUNCHTYPE = "aws.ecs.launchtype";
  var TMP_AWS_ECS_TASK_ARN = "aws.ecs.task.arn";
  var TMP_AWS_ECS_TASK_FAMILY = "aws.ecs.task.family";
  var TMP_AWS_ECS_TASK_REVISION = "aws.ecs.task.revision";
  var TMP_AWS_EKS_CLUSTER_ARN = "aws.eks.cluster.arn";
  var TMP_AWS_LOG_GROUP_NAMES = "aws.log.group.names";
  var TMP_AWS_LOG_GROUP_ARNS = "aws.log.group.arns";
  var TMP_AWS_LOG_STREAM_NAMES = "aws.log.stream.names";
  var TMP_AWS_LOG_STREAM_ARNS = "aws.log.stream.arns";
  var TMP_CONTAINER_NAME = "container.name";
  var TMP_CONTAINER_ID = "container.id";
  var TMP_CONTAINER_RUNTIME = "container.runtime";
  var TMP_CONTAINER_IMAGE_NAME = "container.image.name";
  var TMP_CONTAINER_IMAGE_TAG = "container.image.tag";
  var TMP_DEPLOYMENT_ENVIRONMENT = "deployment.environment";
  var TMP_DEVICE_ID = "device.id";
  var TMP_DEVICE_MODEL_IDENTIFIER = "device.model.identifier";
  var TMP_DEVICE_MODEL_NAME = "device.model.name";
  var TMP_FAAS_NAME = "faas.name";
  var TMP_FAAS_ID = "faas.id";
  var TMP_FAAS_VERSION = "faas.version";
  var TMP_FAAS_INSTANCE = "faas.instance";
  var TMP_FAAS_MAX_MEMORY = "faas.max_memory";
  var TMP_HOST_ID = "host.id";
  var TMP_HOST_NAME = "host.name";
  var TMP_HOST_TYPE = "host.type";
  var TMP_HOST_ARCH = "host.arch";
  var TMP_HOST_IMAGE_NAME = "host.image.name";
  var TMP_HOST_IMAGE_ID = "host.image.id";
  var TMP_HOST_IMAGE_VERSION = "host.image.version";
  var TMP_K8S_CLUSTER_NAME = "k8s.cluster.name";
  var TMP_K8S_NODE_NAME = "k8s.node.name";
  var TMP_K8S_NODE_UID = "k8s.node.uid";
  var TMP_K8S_NAMESPACE_NAME = "k8s.namespace.name";
  var TMP_K8S_POD_UID = "k8s.pod.uid";
  var TMP_K8S_POD_NAME = "k8s.pod.name";
  var TMP_K8S_CONTAINER_NAME = "k8s.container.name";
  var TMP_K8S_REPLICASET_UID = "k8s.replicaset.uid";
  var TMP_K8S_REPLICASET_NAME = "k8s.replicaset.name";
  var TMP_K8S_DEPLOYMENT_UID = "k8s.deployment.uid";
  var TMP_K8S_DEPLOYMENT_NAME = "k8s.deployment.name";
  var TMP_K8S_STATEFULSET_UID = "k8s.statefulset.uid";
  var TMP_K8S_STATEFULSET_NAME = "k8s.statefulset.name";
  var TMP_K8S_DAEMONSET_UID = "k8s.daemonset.uid";
  var TMP_K8S_DAEMONSET_NAME = "k8s.daemonset.name";
  var TMP_K8S_JOB_UID = "k8s.job.uid";
  var TMP_K8S_JOB_NAME = "k8s.job.name";
  var TMP_K8S_CRONJOB_UID = "k8s.cronjob.uid";
  var TMP_K8S_CRONJOB_NAME = "k8s.cronjob.name";
  var TMP_OS_TYPE = "os.type";
  var TMP_OS_DESCRIPTION = "os.description";
  var TMP_OS_NAME = "os.name";
  var TMP_OS_VERSION = "os.version";
  var TMP_PROCESS_PID = "process.pid";
  var TMP_PROCESS_EXECUTABLE_NAME = "process.executable.name";
  var TMP_PROCESS_EXECUTABLE_PATH = "process.executable.path";
  var TMP_PROCESS_COMMAND = "process.command";
  var TMP_PROCESS_COMMAND_LINE = "process.command_line";
  var TMP_PROCESS_COMMAND_ARGS = "process.command_args";
  var TMP_PROCESS_OWNER = "process.owner";
  var TMP_PROCESS_RUNTIME_NAME = "process.runtime.name";
  var TMP_PROCESS_RUNTIME_VERSION = "process.runtime.version";
  var TMP_PROCESS_RUNTIME_DESCRIPTION = "process.runtime.description";
  var TMP_SERVICE_NAME = "service.name";
  var TMP_SERVICE_NAMESPACE = "service.namespace";
  var TMP_SERVICE_INSTANCE_ID = "service.instance.id";
  var TMP_SERVICE_VERSION = "service.version";
  var TMP_TELEMETRY_SDK_NAME = "telemetry.sdk.name";
  var TMP_TELEMETRY_SDK_LANGUAGE = "telemetry.sdk.language";
  var TMP_TELEMETRY_SDK_VERSION = "telemetry.sdk.version";
  var TMP_TELEMETRY_AUTO_VERSION = "telemetry.auto.version";
  var TMP_WEBENGINE_NAME = "webengine.name";
  var TMP_WEBENGINE_VERSION = "webengine.version";
  var TMP_WEBENGINE_DESCRIPTION = "webengine.description";
  exports.SEMRESATTRS_CLOUD_PROVIDER = TMP_CLOUD_PROVIDER;
  exports.SEMRESATTRS_CLOUD_ACCOUNT_ID = TMP_CLOUD_ACCOUNT_ID;
  exports.SEMRESATTRS_CLOUD_REGION = TMP_CLOUD_REGION;
  exports.SEMRESATTRS_CLOUD_AVAILABILITY_ZONE = TMP_CLOUD_AVAILABILITY_ZONE;
  exports.SEMRESATTRS_CLOUD_PLATFORM = TMP_CLOUD_PLATFORM;
  exports.SEMRESATTRS_AWS_ECS_CONTAINER_ARN = TMP_AWS_ECS_CONTAINER_ARN;
  exports.SEMRESATTRS_AWS_ECS_CLUSTER_ARN = TMP_AWS_ECS_CLUSTER_ARN;
  exports.SEMRESATTRS_AWS_ECS_LAUNCHTYPE = TMP_AWS_ECS_LAUNCHTYPE;
  exports.SEMRESATTRS_AWS_ECS_TASK_ARN = TMP_AWS_ECS_TASK_ARN;
  exports.SEMRESATTRS_AWS_ECS_TASK_FAMILY = TMP_AWS_ECS_TASK_FAMILY;
  exports.SEMRESATTRS_AWS_ECS_TASK_REVISION = TMP_AWS_ECS_TASK_REVISION;
  exports.SEMRESATTRS_AWS_EKS_CLUSTER_ARN = TMP_AWS_EKS_CLUSTER_ARN;
  exports.SEMRESATTRS_AWS_LOG_GROUP_NAMES = TMP_AWS_LOG_GROUP_NAMES;
  exports.SEMRESATTRS_AWS_LOG_GROUP_ARNS = TMP_AWS_LOG_GROUP_ARNS;
  exports.SEMRESATTRS_AWS_LOG_STREAM_NAMES = TMP_AWS_LOG_STREAM_NAMES;
  exports.SEMRESATTRS_AWS_LOG_STREAM_ARNS = TMP_AWS_LOG_STREAM_ARNS;
  exports.SEMRESATTRS_CONTAINER_NAME = TMP_CONTAINER_NAME;
  exports.SEMRESATTRS_CONTAINER_ID = TMP_CONTAINER_ID;
  exports.SEMRESATTRS_CONTAINER_RUNTIME = TMP_CONTAINER_RUNTIME;
  exports.SEMRESATTRS_CONTAINER_IMAGE_NAME = TMP_CONTAINER_IMAGE_NAME;
  exports.SEMRESATTRS_CONTAINER_IMAGE_TAG = TMP_CONTAINER_IMAGE_TAG;
  exports.SEMRESATTRS_DEPLOYMENT_ENVIRONMENT = TMP_DEPLOYMENT_ENVIRONMENT;
  exports.SEMRESATTRS_DEVICE_ID = TMP_DEVICE_ID;
  exports.SEMRESATTRS_DEVICE_MODEL_IDENTIFIER = TMP_DEVICE_MODEL_IDENTIFIER;
  exports.SEMRESATTRS_DEVICE_MODEL_NAME = TMP_DEVICE_MODEL_NAME;
  exports.SEMRESATTRS_FAAS_NAME = TMP_FAAS_NAME;
  exports.SEMRESATTRS_FAAS_ID = TMP_FAAS_ID;
  exports.SEMRESATTRS_FAAS_VERSION = TMP_FAAS_VERSION;
  exports.SEMRESATTRS_FAAS_INSTANCE = TMP_FAAS_INSTANCE;
  exports.SEMRESATTRS_FAAS_MAX_MEMORY = TMP_FAAS_MAX_MEMORY;
  exports.SEMRESATTRS_HOST_ID = TMP_HOST_ID;
  exports.SEMRESATTRS_HOST_NAME = TMP_HOST_NAME;
  exports.SEMRESATTRS_HOST_TYPE = TMP_HOST_TYPE;
  exports.SEMRESATTRS_HOST_ARCH = TMP_HOST_ARCH;
  exports.SEMRESATTRS_HOST_IMAGE_NAME = TMP_HOST_IMAGE_NAME;
  exports.SEMRESATTRS_HOST_IMAGE_ID = TMP_HOST_IMAGE_ID;
  exports.SEMRESATTRS_HOST_IMAGE_VERSION = TMP_HOST_IMAGE_VERSION;
  exports.SEMRESATTRS_K8S_CLUSTER_NAME = TMP_K8S_CLUSTER_NAME;
  exports.SEMRESATTRS_K8S_NODE_NAME = TMP_K8S_NODE_NAME;
  exports.SEMRESATTRS_K8S_NODE_UID = TMP_K8S_NODE_UID;
  exports.SEMRESATTRS_K8S_NAMESPACE_NAME = TMP_K8S_NAMESPACE_NAME;
  exports.SEMRESATTRS_K8S_POD_UID = TMP_K8S_POD_UID;
  exports.SEMRESATTRS_K8S_POD_NAME = TMP_K8S_POD_NAME;
  exports.SEMRESATTRS_K8S_CONTAINER_NAME = TMP_K8S_CONTAINER_NAME;
  exports.SEMRESATTRS_K8S_REPLICASET_UID = TMP_K8S_REPLICASET_UID;
  exports.SEMRESATTRS_K8S_REPLICASET_NAME = TMP_K8S_REPLICASET_NAME;
  exports.SEMRESATTRS_K8S_DEPLOYMENT_UID = TMP_K8S_DEPLOYMENT_UID;
  exports.SEMRESATTRS_K8S_DEPLOYMENT_NAME = TMP_K8S_DEPLOYMENT_NAME;
  exports.SEMRESATTRS_K8S_STATEFULSET_UID = TMP_K8S_STATEFULSET_UID;
  exports.SEMRESATTRS_K8S_STATEFULSET_NAME = TMP_K8S_STATEFULSET_NAME;
  exports.SEMRESATTRS_K8S_DAEMONSET_UID = TMP_K8S_DAEMONSET_UID;
  exports.SEMRESATTRS_K8S_DAEMONSET_NAME = TMP_K8S_DAEMONSET_NAME;
  exports.SEMRESATTRS_K8S_JOB_UID = TMP_K8S_JOB_UID;
  exports.SEMRESATTRS_K8S_JOB_NAME = TMP_K8S_JOB_NAME;
  exports.SEMRESATTRS_K8S_CRONJOB_UID = TMP_K8S_CRONJOB_UID;
  exports.SEMRESATTRS_K8S_CRONJOB_NAME = TMP_K8S_CRONJOB_NAME;
  exports.SEMRESATTRS_OS_TYPE = TMP_OS_TYPE;
  exports.SEMRESATTRS_OS_DESCRIPTION = TMP_OS_DESCRIPTION;
  exports.SEMRESATTRS_OS_NAME = TMP_OS_NAME;
  exports.SEMRESATTRS_OS_VERSION = TMP_OS_VERSION;
  exports.SEMRESATTRS_PROCESS_PID = TMP_PROCESS_PID;
  exports.SEMRESATTRS_PROCESS_EXECUTABLE_NAME = TMP_PROCESS_EXECUTABLE_NAME;
  exports.SEMRESATTRS_PROCESS_EXECUTABLE_PATH = TMP_PROCESS_EXECUTABLE_PATH;
  exports.SEMRESATTRS_PROCESS_COMMAND = TMP_PROCESS_COMMAND;
  exports.SEMRESATTRS_PROCESS_COMMAND_LINE = TMP_PROCESS_COMMAND_LINE;
  exports.SEMRESATTRS_PROCESS_COMMAND_ARGS = TMP_PROCESS_COMMAND_ARGS;
  exports.SEMRESATTRS_PROCESS_OWNER = TMP_PROCESS_OWNER;
  exports.SEMRESATTRS_PROCESS_RUNTIME_NAME = TMP_PROCESS_RUNTIME_NAME;
  exports.SEMRESATTRS_PROCESS_RUNTIME_VERSION = TMP_PROCESS_RUNTIME_VERSION;
  exports.SEMRESATTRS_PROCESS_RUNTIME_DESCRIPTION = TMP_PROCESS_RUNTIME_DESCRIPTION;
  exports.SEMRESATTRS_SERVICE_NAME = TMP_SERVICE_NAME;
  exports.SEMRESATTRS_SERVICE_NAMESPACE = TMP_SERVICE_NAMESPACE;
  exports.SEMRESATTRS_SERVICE_INSTANCE_ID = TMP_SERVICE_INSTANCE_ID;
  exports.SEMRESATTRS_SERVICE_VERSION = TMP_SERVICE_VERSION;
  exports.SEMRESATTRS_TELEMETRY_SDK_NAME = TMP_TELEMETRY_SDK_NAME;
  exports.SEMRESATTRS_TELEMETRY_SDK_LANGUAGE = TMP_TELEMETRY_SDK_LANGUAGE;
  exports.SEMRESATTRS_TELEMETRY_SDK_VERSION = TMP_TELEMETRY_SDK_VERSION;
  exports.SEMRESATTRS_TELEMETRY_AUTO_VERSION = TMP_TELEMETRY_AUTO_VERSION;
  exports.SEMRESATTRS_WEBENGINE_NAME = TMP_WEBENGINE_NAME;
  exports.SEMRESATTRS_WEBENGINE_VERSION = TMP_WEBENGINE_VERSION;
  exports.SEMRESATTRS_WEBENGINE_DESCRIPTION = TMP_WEBENGINE_DESCRIPTION;
  exports.SemanticResourceAttributes = /* @__PURE__ */ (0, utils_1.createConstMap)([
    TMP_CLOUD_PROVIDER,
    TMP_CLOUD_ACCOUNT_ID,
    TMP_CLOUD_REGION,
    TMP_CLOUD_AVAILABILITY_ZONE,
    TMP_CLOUD_PLATFORM,
    TMP_AWS_ECS_CONTAINER_ARN,
    TMP_AWS_ECS_CLUSTER_ARN,
    TMP_AWS_ECS_LAUNCHTYPE,
    TMP_AWS_ECS_TASK_ARN,
    TMP_AWS_ECS_TASK_FAMILY,
    TMP_AWS_ECS_TASK_REVISION,
    TMP_AWS_EKS_CLUSTER_ARN,
    TMP_AWS_LOG_GROUP_NAMES,
    TMP_AWS_LOG_GROUP_ARNS,
    TMP_AWS_LOG_STREAM_NAMES,
    TMP_AWS_LOG_STREAM_ARNS,
    TMP_CONTAINER_NAME,
    TMP_CONTAINER_ID,
    TMP_CONTAINER_RUNTIME,
    TMP_CONTAINER_IMAGE_NAME,
    TMP_CONTAINER_IMAGE_TAG,
    TMP_DEPLOYMENT_ENVIRONMENT,
    TMP_DEVICE_ID,
    TMP_DEVICE_MODEL_IDENTIFIER,
    TMP_DEVICE_MODEL_NAME,
    TMP_FAAS_NAME,
    TMP_FAAS_ID,
    TMP_FAAS_VERSION,
    TMP_FAAS_INSTANCE,
    TMP_FAAS_MAX_MEMORY,
    TMP_HOST_ID,
    TMP_HOST_NAME,
    TMP_HOST_TYPE,
    TMP_HOST_ARCH,
    TMP_HOST_IMAGE_NAME,
    TMP_HOST_IMAGE_ID,
    TMP_HOST_IMAGE_VERSION,
    TMP_K8S_CLUSTER_NAME,
    TMP_K8S_NODE_NAME,
    TMP_K8S_NODE_UID,
    TMP_K8S_NAMESPACE_NAME,
    TMP_K8S_POD_UID,
    TMP_K8S_POD_NAME,
    TMP_K8S_CONTAINER_NAME,
    TMP_K8S_REPLICASET_UID,
    TMP_K8S_REPLICASET_NAME,
    TMP_K8S_DEPLOYMENT_UID,
    TMP_K8S_DEPLOYMENT_NAME,
    TMP_K8S_STATEFULSET_UID,
    TMP_K8S_STATEFULSET_NAME,
    TMP_K8S_DAEMONSET_UID,
    TMP_K8S_DAEMONSET_NAME,
    TMP_K8S_JOB_UID,
    TMP_K8S_JOB_NAME,
    TMP_K8S_CRONJOB_UID,
    TMP_K8S_CRONJOB_NAME,
    TMP_OS_TYPE,
    TMP_OS_DESCRIPTION,
    TMP_OS_NAME,
    TMP_OS_VERSION,
    TMP_PROCESS_PID,
    TMP_PROCESS_EXECUTABLE_NAME,
    TMP_PROCESS_EXECUTABLE_PATH,
    TMP_PROCESS_COMMAND,
    TMP_PROCESS_COMMAND_LINE,
    TMP_PROCESS_COMMAND_ARGS,
    TMP_PROCESS_OWNER,
    TMP_PROCESS_RUNTIME_NAME,
    TMP_PROCESS_RUNTIME_VERSION,
    TMP_PROCESS_RUNTIME_DESCRIPTION,
    TMP_SERVICE_NAME,
    TMP_SERVICE_NAMESPACE,
    TMP_SERVICE_INSTANCE_ID,
    TMP_SERVICE_VERSION,
    TMP_TELEMETRY_SDK_NAME,
    TMP_TELEMETRY_SDK_LANGUAGE,
    TMP_TELEMETRY_SDK_VERSION,
    TMP_TELEMETRY_AUTO_VERSION,
    TMP_WEBENGINE_NAME,
    TMP_WEBENGINE_VERSION,
    TMP_WEBENGINE_DESCRIPTION
  ]);
  var TMP_CLOUDPROVIDERVALUES_ALIBABA_CLOUD = "alibaba_cloud";
  var TMP_CLOUDPROVIDERVALUES_AWS = "aws";
  var TMP_CLOUDPROVIDERVALUES_AZURE = "azure";
  var TMP_CLOUDPROVIDERVALUES_GCP = "gcp";
  exports.CLOUDPROVIDERVALUES_ALIBABA_CLOUD = TMP_CLOUDPROVIDERVALUES_ALIBABA_CLOUD;
  exports.CLOUDPROVIDERVALUES_AWS = TMP_CLOUDPROVIDERVALUES_AWS;
  exports.CLOUDPROVIDERVALUES_AZURE = TMP_CLOUDPROVIDERVALUES_AZURE;
  exports.CLOUDPROVIDERVALUES_GCP = TMP_CLOUDPROVIDERVALUES_GCP;
  exports.CloudProviderValues = /* @__PURE__ */ (0, utils_1.createConstMap)([
    TMP_CLOUDPROVIDERVALUES_ALIBABA_CLOUD,
    TMP_CLOUDPROVIDERVALUES_AWS,
    TMP_CLOUDPROVIDERVALUES_AZURE,
    TMP_CLOUDPROVIDERVALUES_GCP
  ]);
  var TMP_CLOUDPLATFORMVALUES_ALIBABA_CLOUD_ECS = "alibaba_cloud_ecs";
  var TMP_CLOUDPLATFORMVALUES_ALIBABA_CLOUD_FC = "alibaba_cloud_fc";
  var TMP_CLOUDPLATFORMVALUES_AWS_EC2 = "aws_ec2";
  var TMP_CLOUDPLATFORMVALUES_AWS_ECS = "aws_ecs";
  var TMP_CLOUDPLATFORMVALUES_AWS_EKS = "aws_eks";
  var TMP_CLOUDPLATFORMVALUES_AWS_LAMBDA = "aws_lambda";
  var TMP_CLOUDPLATFORMVALUES_AWS_ELASTIC_BEANSTALK = "aws_elastic_beanstalk";
  var TMP_CLOUDPLATFORMVALUES_AZURE_VM = "azure_vm";
  var TMP_CLOUDPLATFORMVALUES_AZURE_CONTAINER_INSTANCES = "azure_container_instances";
  var TMP_CLOUDPLATFORMVALUES_AZURE_AKS = "azure_aks";
  var TMP_CLOUDPLATFORMVALUES_AZURE_FUNCTIONS = "azure_functions";
  var TMP_CLOUDPLATFORMVALUES_AZURE_APP_SERVICE = "azure_app_service";
  var TMP_CLOUDPLATFORMVALUES_GCP_COMPUTE_ENGINE = "gcp_compute_engine";
  var TMP_CLOUDPLATFORMVALUES_GCP_CLOUD_RUN = "gcp_cloud_run";
  var TMP_CLOUDPLATFORMVALUES_GCP_KUBERNETES_ENGINE = "gcp_kubernetes_engine";
  var TMP_CLOUDPLATFORMVALUES_GCP_CLOUD_FUNCTIONS = "gcp_cloud_functions";
  var TMP_CLOUDPLATFORMVALUES_GCP_APP_ENGINE = "gcp_app_engine";
  exports.CLOUDPLATFORMVALUES_ALIBABA_CLOUD_ECS = TMP_CLOUDPLATFORMVALUES_ALIBABA_CLOUD_ECS;
  exports.CLOUDPLATFORMVALUES_ALIBABA_CLOUD_FC = TMP_CLOUDPLATFORMVALUES_ALIBABA_CLOUD_FC;
  exports.CLOUDPLATFORMVALUES_AWS_EC2 = TMP_CLOUDPLATFORMVALUES_AWS_EC2;
  exports.CLOUDPLATFORMVALUES_AWS_ECS = TMP_CLOUDPLATFORMVALUES_AWS_ECS;
  exports.CLOUDPLATFORMVALUES_AWS_EKS = TMP_CLOUDPLATFORMVALUES_AWS_EKS;
  exports.CLOUDPLATFORMVALUES_AWS_LAMBDA = TMP_CLOUDPLATFORMVALUES_AWS_LAMBDA;
  exports.CLOUDPLATFORMVALUES_AWS_ELASTIC_BEANSTALK = TMP_CLOUDPLATFORMVALUES_AWS_ELASTIC_BEANSTALK;
  exports.CLOUDPLATFORMVALUES_AZURE_VM = TMP_CLOUDPLATFORMVALUES_AZURE_VM;
  exports.CLOUDPLATFORMVALUES_AZURE_CONTAINER_INSTANCES = TMP_CLOUDPLATFORMVALUES_AZURE_CONTAINER_INSTANCES;
  exports.CLOUDPLATFORMVALUES_AZURE_AKS = TMP_CLOUDPLATFORMVALUES_AZURE_AKS;
  exports.CLOUDPLATFORMVALUES_AZURE_FUNCTIONS = TMP_CLOUDPLATFORMVALUES_AZURE_FUNCTIONS;
  exports.CLOUDPLATFORMVALUES_AZURE_APP_SERVICE = TMP_CLOUDPLATFORMVALUES_AZURE_APP_SERVICE;
  exports.CLOUDPLATFORMVALUES_GCP_COMPUTE_ENGINE = TMP_CLOUDPLATFORMVALUES_GCP_COMPUTE_ENGINE;
  exports.CLOUDPLATFORMVALUES_GCP_CLOUD_RUN = TMP_CLOUDPLATFORMVALUES_GCP_CLOUD_RUN;
  exports.CLOUDPLATFORMVALUES_GCP_KUBERNETES_ENGINE = TMP_CLOUDPLATFORMVALUES_GCP_KUBERNETES_ENGINE;
  exports.CLOUDPLATFORMVALUES_GCP_CLOUD_FUNCTIONS = TMP_CLOUDPLATFORMVALUES_GCP_CLOUD_FUNCTIONS;
  exports.CLOUDPLATFORMVALUES_GCP_APP_ENGINE = TMP_CLOUDPLATFORMVALUES_GCP_APP_ENGINE;
  exports.CloudPlatformValues = /* @__PURE__ */ (0, utils_1.createConstMap)([
    TMP_CLOUDPLATFORMVALUES_ALIBABA_CLOUD_ECS,
    TMP_CLOUDPLATFORMVALUES_ALIBABA_CLOUD_FC,
    TMP_CLOUDPLATFORMVALUES_AWS_EC2,
    TMP_CLOUDPLATFORMVALUES_AWS_ECS,
    TMP_CLOUDPLATFORMVALUES_AWS_EKS,
    TMP_CLOUDPLATFORMVALUES_AWS_LAMBDA,
    TMP_CLOUDPLATFORMVALUES_AWS_ELASTIC_BEANSTALK,
    TMP_CLOUDPLATFORMVALUES_AZURE_VM,
    TMP_CLOUDPLATFORMVALUES_AZURE_CONTAINER_INSTANCES,
    TMP_CLOUDPLATFORMVALUES_AZURE_AKS,
    TMP_CLOUDPLATFORMVALUES_AZURE_FUNCTIONS,
    TMP_CLOUDPLATFORMVALUES_AZURE_APP_SERVICE,
    TMP_CLOUDPLATFORMVALUES_GCP_COMPUTE_ENGINE,
    TMP_CLOUDPLATFORMVALUES_GCP_CLOUD_RUN,
    TMP_CLOUDPLATFORMVALUES_GCP_KUBERNETES_ENGINE,
    TMP_CLOUDPLATFORMVALUES_GCP_CLOUD_FUNCTIONS,
    TMP_CLOUDPLATFORMVALUES_GCP_APP_ENGINE
  ]);
  var TMP_AWSECSLAUNCHTYPEVALUES_EC2 = "ec2";
  var TMP_AWSECSLAUNCHTYPEVALUES_FARGATE = "fargate";
  exports.AWSECSLAUNCHTYPEVALUES_EC2 = TMP_AWSECSLAUNCHTYPEVALUES_EC2;
  exports.AWSECSLAUNCHTYPEVALUES_FARGATE = TMP_AWSECSLAUNCHTYPEVALUES_FARGATE;
  exports.AwsEcsLaunchtypeValues = /* @__PURE__ */ (0, utils_1.createConstMap)([
    TMP_AWSECSLAUNCHTYPEVALUES_EC2,
    TMP_AWSECSLAUNCHTYPEVALUES_FARGATE
  ]);
  var TMP_HOSTARCHVALUES_AMD64 = "amd64";
  var TMP_HOSTARCHVALUES_ARM32 = "arm32";
  var TMP_HOSTARCHVALUES_ARM64 = "arm64";
  var TMP_HOSTARCHVALUES_IA64 = "ia64";
  var TMP_HOSTARCHVALUES_PPC32 = "ppc32";
  var TMP_HOSTARCHVALUES_PPC64 = "ppc64";
  var TMP_HOSTARCHVALUES_X86 = "x86";
  exports.HOSTARCHVALUES_AMD64 = TMP_HOSTARCHVALUES_AMD64;
  exports.HOSTARCHVALUES_ARM32 = TMP_HOSTARCHVALUES_ARM32;
  exports.HOSTARCHVALUES_ARM64 = TMP_HOSTARCHVALUES_ARM64;
  exports.HOSTARCHVALUES_IA64 = TMP_HOSTARCHVALUES_IA64;
  exports.HOSTARCHVALUES_PPC32 = TMP_HOSTARCHVALUES_PPC32;
  exports.HOSTARCHVALUES_PPC64 = TMP_HOSTARCHVALUES_PPC64;
  exports.HOSTARCHVALUES_X86 = TMP_HOSTARCHVALUES_X86;
  exports.HostArchValues = /* @__PURE__ */ (0, utils_1.createConstMap)([
    TMP_HOSTARCHVALUES_AMD64,
    TMP_HOSTARCHVALUES_ARM32,
    TMP_HOSTARCHVALUES_ARM64,
    TMP_HOSTARCHVALUES_IA64,
    TMP_HOSTARCHVALUES_PPC32,
    TMP_HOSTARCHVALUES_PPC64,
    TMP_HOSTARCHVALUES_X86
  ]);
  var TMP_OSTYPEVALUES_WINDOWS = "windows";
  var TMP_OSTYPEVALUES_LINUX = "linux";
  var TMP_OSTYPEVALUES_DARWIN = "darwin";
  var TMP_OSTYPEVALUES_FREEBSD = "freebsd";
  var TMP_OSTYPEVALUES_NETBSD = "netbsd";
  var TMP_OSTYPEVALUES_OPENBSD = "openbsd";
  var TMP_OSTYPEVALUES_DRAGONFLYBSD = "dragonflybsd";
  var TMP_OSTYPEVALUES_HPUX = "hpux";
  var TMP_OSTYPEVALUES_AIX = "aix";
  var TMP_OSTYPEVALUES_SOLARIS = "solaris";
  var TMP_OSTYPEVALUES_Z_OS = "z_os";
  exports.OSTYPEVALUES_WINDOWS = TMP_OSTYPEVALUES_WINDOWS;
  exports.OSTYPEVALUES_LINUX = TMP_OSTYPEVALUES_LINUX;
  exports.OSTYPEVALUES_DARWIN = TMP_OSTYPEVALUES_DARWIN;
  exports.OSTYPEVALUES_FREEBSD = TMP_OSTYPEVALUES_FREEBSD;
  exports.OSTYPEVALUES_NETBSD = TMP_OSTYPEVALUES_NETBSD;
  exports.OSTYPEVALUES_OPENBSD = TMP_OSTYPEVALUES_OPENBSD;
  exports.OSTYPEVALUES_DRAGONFLYBSD = TMP_OSTYPEVALUES_DRAGONFLYBSD;
  exports.OSTYPEVALUES_HPUX = TMP_OSTYPEVALUES_HPUX;
  exports.OSTYPEVALUES_AIX = TMP_OSTYPEVALUES_AIX;
  exports.OSTYPEVALUES_SOLARIS = TMP_OSTYPEVALUES_SOLARIS;
  exports.OSTYPEVALUES_Z_OS = TMP_OSTYPEVALUES_Z_OS;
  exports.OsTypeValues = /* @__PURE__ */ (0, utils_1.createConstMap)([
    TMP_OSTYPEVALUES_WINDOWS,
    TMP_OSTYPEVALUES_LINUX,
    TMP_OSTYPEVALUES_DARWIN,
    TMP_OSTYPEVALUES_FREEBSD,
    TMP_OSTYPEVALUES_NETBSD,
    TMP_OSTYPEVALUES_OPENBSD,
    TMP_OSTYPEVALUES_DRAGONFLYBSD,
    TMP_OSTYPEVALUES_HPUX,
    TMP_OSTYPEVALUES_AIX,
    TMP_OSTYPEVALUES_SOLARIS,
    TMP_OSTYPEVALUES_Z_OS
  ]);
  var TMP_TELEMETRYSDKLANGUAGEVALUES_CPP = "cpp";
  var TMP_TELEMETRYSDKLANGUAGEVALUES_DOTNET = "dotnet";
  var TMP_TELEMETRYSDKLANGUAGEVALUES_ERLANG = "erlang";
  var TMP_TELEMETRYSDKLANGUAGEVALUES_GO = "go";
  var TMP_TELEMETRYSDKLANGUAGEVALUES_JAVA = "java";
  var TMP_TELEMETRYSDKLANGUAGEVALUES_NODEJS = "nodejs";
  var TMP_TELEMETRYSDKLANGUAGEVALUES_PHP = "php";
  var TMP_TELEMETRYSDKLANGUAGEVALUES_PYTHON = "python";
  var TMP_TELEMETRYSDKLANGUAGEVALUES_RUBY = "ruby";
  var TMP_TELEMETRYSDKLANGUAGEVALUES_WEBJS = "webjs";
  exports.TELEMETRYSDKLANGUAGEVALUES_CPP = TMP_TELEMETRYSDKLANGUAGEVALUES_CPP;
  exports.TELEMETRYSDKLANGUAGEVALUES_DOTNET = TMP_TELEMETRYSDKLANGUAGEVALUES_DOTNET;
  exports.TELEMETRYSDKLANGUAGEVALUES_ERLANG = TMP_TELEMETRYSDKLANGUAGEVALUES_ERLANG;
  exports.TELEMETRYSDKLANGUAGEVALUES_GO = TMP_TELEMETRYSDKLANGUAGEVALUES_GO;
  exports.TELEMETRYSDKLANGUAGEVALUES_JAVA = TMP_TELEMETRYSDKLANGUAGEVALUES_JAVA;
  exports.TELEMETRYSDKLANGUAGEVALUES_NODEJS = TMP_TELEMETRYSDKLANGUAGEVALUES_NODEJS;
  exports.TELEMETRYSDKLANGUAGEVALUES_PHP = TMP_TELEMETRYSDKLANGUAGEVALUES_PHP;
  exports.TELEMETRYSDKLANGUAGEVALUES_PYTHON = TMP_TELEMETRYSDKLANGUAGEVALUES_PYTHON;
  exports.TELEMETRYSDKLANGUAGEVALUES_RUBY = TMP_TELEMETRYSDKLANGUAGEVALUES_RUBY;
  exports.TELEMETRYSDKLANGUAGEVALUES_WEBJS = TMP_TELEMETRYSDKLANGUAGEVALUES_WEBJS;
  exports.TelemetrySdkLanguageValues = /* @__PURE__ */ (0, utils_1.createConstMap)([
    TMP_TELEMETRYSDKLANGUAGEVALUES_CPP,
    TMP_TELEMETRYSDKLANGUAGEVALUES_DOTNET,
    TMP_TELEMETRYSDKLANGUAGEVALUES_ERLANG,
    TMP_TELEMETRYSDKLANGUAGEVALUES_GO,
    TMP_TELEMETRYSDKLANGUAGEVALUES_JAVA,
    TMP_TELEMETRYSDKLANGUAGEVALUES_NODEJS,
    TMP_TELEMETRYSDKLANGUAGEVALUES_PHP,
    TMP_TELEMETRYSDKLANGUAGEVALUES_PYTHON,
    TMP_TELEMETRYSDKLANGUAGEVALUES_RUBY,
    TMP_TELEMETRYSDKLANGUAGEVALUES_WEBJS
  ]);
});

// node_modules/@opentelemetry/core/node_modules/@opentelemetry/semantic-conventions/build/src/resource/index.js
var require_resource = __commonJS((exports) => {
  var __createBinding = exports && exports.__createBinding || (Object.create ? function(o, m, k, k2) {
    if (k2 === undefined)
      k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() {
      return m[k];
    } });
  } : function(o, m, k, k2) {
    if (k2 === undefined)
      k2 = k;
    o[k2] = m[k];
  });
  var __exportStar = exports && exports.__exportStar || function(m, exports2) {
    for (var p in m)
      if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p))
        __createBinding(exports2, m, p);
  };
  Object.defineProperty(exports, "__esModule", { value: true });
  __exportStar(require_SemanticResourceAttributes(), exports);
});

// node_modules/@opentelemetry/core/node_modules/@opentelemetry/semantic-conventions/build/src/stable_attributes.js
var require_stable_attributes = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.HTTP_REQUEST_METHOD_VALUE_POST = exports.HTTP_REQUEST_METHOD_VALUE_PATCH = exports.HTTP_REQUEST_METHOD_VALUE_OPTIONS = exports.HTTP_REQUEST_METHOD_VALUE_HEAD = exports.HTTP_REQUEST_METHOD_VALUE_GET = exports.HTTP_REQUEST_METHOD_VALUE_DELETE = exports.HTTP_REQUEST_METHOD_VALUE_CONNECT = exports.HTTP_REQUEST_METHOD_VALUE_OTHER = exports.ATTR_HTTP_REQUEST_METHOD = exports.ATTR_HTTP_REQUEST_HEADER = exports.ATTR_EXCEPTION_TYPE = exports.ATTR_EXCEPTION_STACKTRACE = exports.ATTR_EXCEPTION_MESSAGE = exports.ATTR_EXCEPTION_ESCAPED = exports.ERROR_TYPE_VALUE_OTHER = exports.ATTR_ERROR_TYPE = exports.ATTR_CLIENT_PORT = exports.ATTR_CLIENT_ADDRESS = exports.ASPNETCORE_ROUTING_MATCH_STATUS_VALUE_SUCCESS = exports.ASPNETCORE_ROUTING_MATCH_STATUS_VALUE_FAILURE = exports.ATTR_ASPNETCORE_ROUTING_MATCH_STATUS = exports.ATTR_ASPNETCORE_ROUTING_IS_FALLBACK = exports.ATTR_ASPNETCORE_REQUEST_IS_UNHANDLED = exports.ATTR_ASPNETCORE_RATE_LIMITING_POLICY = exports.ASPNETCORE_DIAGNOSTICS_EXCEPTION_RESULT_VALUE_UNHANDLED = exports.ASPNETCORE_DIAGNOSTICS_EXCEPTION_RESULT_VALUE_SKIPPED = exports.ASPNETCORE_DIAGNOSTICS_EXCEPTION_RESULT_VALUE_HANDLED = exports.ASPNETCORE_DIAGNOSTICS_EXCEPTION_RESULT_VALUE_ABORTED = exports.ATTR_ASPNETCORE_DIAGNOSTICS_EXCEPTION_RESULT = exports.ATTR_ASPNETCORE_DIAGNOSTICS_HANDLER_TYPE = exports.ATTR_TELEMETRY_SDK_VERSION = exports.ATTR_TELEMETRY_SDK_NAME = exports.TELEMETRY_SDK_LANGUAGE_VALUE_WEBJS = exports.TELEMETRY_SDK_LANGUAGE_VALUE_SWIFT = exports.TELEMETRY_SDK_LANGUAGE_VALUE_RUST = exports.TELEMETRY_SDK_LANGUAGE_VALUE_RUBY = exports.TELEMETRY_SDK_LANGUAGE_VALUE_PYTHON = exports.TELEMETRY_SDK_LANGUAGE_VALUE_PHP = exports.TELEMETRY_SDK_LANGUAGE_VALUE_NODEJS = exports.TELEMETRY_SDK_LANGUAGE_VALUE_JAVA = exports.TELEMETRY_SDK_LANGUAGE_VALUE_GO = exports.TELEMETRY_SDK_LANGUAGE_VALUE_ERLANG = exports.TELEMETRY_SDK_LANGUAGE_VALUE_DOTNET = exports.TELEMETRY_SDK_LANGUAGE_VALUE_CPP = exports.ATTR_TELEMETRY_SDK_LANGUAGE = exports.ASPNETCORE_RATE_LIMITING_RESULT_VALUE_REQUEST_CANCELED = exports.ASPNETCORE_RATE_LIMITING_RESULT_VALUE_GLOBAL_LIMITER = exports.ASPNETCORE_RATE_LIMITING_RESULT_VALUE_ENDPOINT_LIMITER = exports.ASPNETCORE_RATE_LIMITING_RESULT_VALUE_ACQUIRED = exports.ATTR_ASPNETCORE_RATE_LIMITING_RESULT = undefined;
  exports.SIGNALR_CONNECTION_STATUS_VALUE_TIMEOUT = exports.SIGNALR_CONNECTION_STATUS_VALUE_NORMAL_CLOSURE = exports.SIGNALR_CONNECTION_STATUS_VALUE_APP_SHUTDOWN = exports.ATTR_SIGNALR_CONNECTION_STATUS = exports.ATTR_SERVICE_VERSION = exports.ATTR_SERVICE_NAME = exports.ATTR_SERVER_PORT = exports.ATTR_SERVER_ADDRESS = exports.ATTR_OTEL_STATUS_DESCRIPTION = exports.OTEL_STATUS_CODE_VALUE_OK = exports.OTEL_STATUS_CODE_VALUE_ERROR = exports.ATTR_OTEL_STATUS_CODE = exports.ATTR_OTEL_SCOPE_VERSION = exports.ATTR_OTEL_SCOPE_NAME = exports.NETWORK_TYPE_VALUE_IPV6 = exports.NETWORK_TYPE_VALUE_IPV4 = exports.ATTR_NETWORK_TYPE = exports.NETWORK_TRANSPORT_VALUE_UNIX = exports.NETWORK_TRANSPORT_VALUE_UDP = exports.NETWORK_TRANSPORT_VALUE_TCP = exports.NETWORK_TRANSPORT_VALUE_QUIC = exports.NETWORK_TRANSPORT_VALUE_PIPE = exports.ATTR_NETWORK_TRANSPORT = exports.ATTR_NETWORK_PROTOCOL_VERSION = exports.ATTR_NETWORK_PROTOCOL_NAME = exports.ATTR_NETWORK_PEER_PORT = exports.ATTR_NETWORK_PEER_ADDRESS = exports.ATTR_NETWORK_LOCAL_PORT = exports.ATTR_NETWORK_LOCAL_ADDRESS = exports.JVM_THREAD_STATE_VALUE_WAITING = exports.JVM_THREAD_STATE_VALUE_TIMED_WAITING = exports.JVM_THREAD_STATE_VALUE_TERMINATED = exports.JVM_THREAD_STATE_VALUE_RUNNABLE = exports.JVM_THREAD_STATE_VALUE_NEW = exports.JVM_THREAD_STATE_VALUE_BLOCKED = exports.ATTR_JVM_THREAD_STATE = exports.ATTR_JVM_THREAD_DAEMON = exports.JVM_MEMORY_TYPE_VALUE_NON_HEAP = exports.JVM_MEMORY_TYPE_VALUE_HEAP = exports.ATTR_JVM_MEMORY_TYPE = exports.ATTR_JVM_MEMORY_POOL_NAME = exports.ATTR_JVM_GC_NAME = exports.ATTR_JVM_GC_ACTION = exports.ATTR_HTTP_ROUTE = exports.ATTR_HTTP_RESPONSE_STATUS_CODE = exports.ATTR_HTTP_RESPONSE_HEADER = exports.ATTR_HTTP_REQUEST_RESEND_COUNT = exports.ATTR_HTTP_REQUEST_METHOD_ORIGINAL = exports.HTTP_REQUEST_METHOD_VALUE_TRACE = exports.HTTP_REQUEST_METHOD_VALUE_PUT = undefined;
  exports.ATTR_USER_AGENT_ORIGINAL = exports.ATTR_URL_SCHEME = exports.ATTR_URL_QUERY = exports.ATTR_URL_PATH = exports.ATTR_URL_FULL = exports.ATTR_URL_FRAGMENT = exports.SIGNALR_TRANSPORT_VALUE_WEB_SOCKETS = exports.SIGNALR_TRANSPORT_VALUE_SERVER_SENT_EVENTS = exports.SIGNALR_TRANSPORT_VALUE_LONG_POLLING = exports.ATTR_SIGNALR_TRANSPORT = undefined;
  exports.ATTR_ASPNETCORE_RATE_LIMITING_RESULT = "aspnetcore.rate_limiting.result";
  exports.ASPNETCORE_RATE_LIMITING_RESULT_VALUE_ACQUIRED = "acquired";
  exports.ASPNETCORE_RATE_LIMITING_RESULT_VALUE_ENDPOINT_LIMITER = "endpoint_limiter";
  exports.ASPNETCORE_RATE_LIMITING_RESULT_VALUE_GLOBAL_LIMITER = "global_limiter";
  exports.ASPNETCORE_RATE_LIMITING_RESULT_VALUE_REQUEST_CANCELED = "request_canceled";
  exports.ATTR_TELEMETRY_SDK_LANGUAGE = "telemetry.sdk.language";
  exports.TELEMETRY_SDK_LANGUAGE_VALUE_CPP = "cpp";
  exports.TELEMETRY_SDK_LANGUAGE_VALUE_DOTNET = "dotnet";
  exports.TELEMETRY_SDK_LANGUAGE_VALUE_ERLANG = "erlang";
  exports.TELEMETRY_SDK_LANGUAGE_VALUE_GO = "go";
  exports.TELEMETRY_SDK_LANGUAGE_VALUE_JAVA = "java";
  exports.TELEMETRY_SDK_LANGUAGE_VALUE_NODEJS = "nodejs";
  exports.TELEMETRY_SDK_LANGUAGE_VALUE_PHP = "php";
  exports.TELEMETRY_SDK_LANGUAGE_VALUE_PYTHON = "python";
  exports.TELEMETRY_SDK_LANGUAGE_VALUE_RUBY = "ruby";
  exports.TELEMETRY_SDK_LANGUAGE_VALUE_RUST = "rust";
  exports.TELEMETRY_SDK_LANGUAGE_VALUE_SWIFT = "swift";
  exports.TELEMETRY_SDK_LANGUAGE_VALUE_WEBJS = "webjs";
  exports.ATTR_TELEMETRY_SDK_NAME = "telemetry.sdk.name";
  exports.ATTR_TELEMETRY_SDK_VERSION = "telemetry.sdk.version";
  exports.ATTR_ASPNETCORE_DIAGNOSTICS_HANDLER_TYPE = "aspnetcore.diagnostics.handler.type";
  exports.ATTR_ASPNETCORE_DIAGNOSTICS_EXCEPTION_RESULT = "aspnetcore.diagnostics.exception.result";
  exports.ASPNETCORE_DIAGNOSTICS_EXCEPTION_RESULT_VALUE_ABORTED = "aborted";
  exports.ASPNETCORE_DIAGNOSTICS_EXCEPTION_RESULT_VALUE_HANDLED = "handled";
  exports.ASPNETCORE_DIAGNOSTICS_EXCEPTION_RESULT_VALUE_SKIPPED = "skipped";
  exports.ASPNETCORE_DIAGNOSTICS_EXCEPTION_RESULT_VALUE_UNHANDLED = "unhandled";
  exports.ATTR_ASPNETCORE_RATE_LIMITING_POLICY = "aspnetcore.rate_limiting.policy";
  exports.ATTR_ASPNETCORE_REQUEST_IS_UNHANDLED = "aspnetcore.request.is_unhandled";
  exports.ATTR_ASPNETCORE_ROUTING_IS_FALLBACK = "aspnetcore.routing.is_fallback";
  exports.ATTR_ASPNETCORE_ROUTING_MATCH_STATUS = "aspnetcore.routing.match_status";
  exports.ASPNETCORE_ROUTING_MATCH_STATUS_VALUE_FAILURE = "failure";
  exports.ASPNETCORE_ROUTING_MATCH_STATUS_VALUE_SUCCESS = "success";
  exports.ATTR_CLIENT_ADDRESS = "client.address";
  exports.ATTR_CLIENT_PORT = "client.port";
  exports.ATTR_ERROR_TYPE = "error.type";
  exports.ERROR_TYPE_VALUE_OTHER = "_OTHER";
  exports.ATTR_EXCEPTION_ESCAPED = "exception.escaped";
  exports.ATTR_EXCEPTION_MESSAGE = "exception.message";
  exports.ATTR_EXCEPTION_STACKTRACE = "exception.stacktrace";
  exports.ATTR_EXCEPTION_TYPE = "exception.type";
  var ATTR_HTTP_REQUEST_HEADER = (key) => `http.request.header.${key}`;
  exports.ATTR_HTTP_REQUEST_HEADER = ATTR_HTTP_REQUEST_HEADER;
  exports.ATTR_HTTP_REQUEST_METHOD = "http.request.method";
  exports.HTTP_REQUEST_METHOD_VALUE_OTHER = "_OTHER";
  exports.HTTP_REQUEST_METHOD_VALUE_CONNECT = "CONNECT";
  exports.HTTP_REQUEST_METHOD_VALUE_DELETE = "DELETE";
  exports.HTTP_REQUEST_METHOD_VALUE_GET = "GET";
  exports.HTTP_REQUEST_METHOD_VALUE_HEAD = "HEAD";
  exports.HTTP_REQUEST_METHOD_VALUE_OPTIONS = "OPTIONS";
  exports.HTTP_REQUEST_METHOD_VALUE_PATCH = "PATCH";
  exports.HTTP_REQUEST_METHOD_VALUE_POST = "POST";
  exports.HTTP_REQUEST_METHOD_VALUE_PUT = "PUT";
  exports.HTTP_REQUEST_METHOD_VALUE_TRACE = "TRACE";
  exports.ATTR_HTTP_REQUEST_METHOD_ORIGINAL = "http.request.method_original";
  exports.ATTR_HTTP_REQUEST_RESEND_COUNT = "http.request.resend_count";
  var ATTR_HTTP_RESPONSE_HEADER = (key) => `http.response.header.${key}`;
  exports.ATTR_HTTP_RESPONSE_HEADER = ATTR_HTTP_RESPONSE_HEADER;
  exports.ATTR_HTTP_RESPONSE_STATUS_CODE = "http.response.status_code";
  exports.ATTR_HTTP_ROUTE = "http.route";
  exports.ATTR_JVM_GC_ACTION = "jvm.gc.action";
  exports.ATTR_JVM_GC_NAME = "jvm.gc.name";
  exports.ATTR_JVM_MEMORY_POOL_NAME = "jvm.memory.pool.name";
  exports.ATTR_JVM_MEMORY_TYPE = "jvm.memory.type";
  exports.JVM_MEMORY_TYPE_VALUE_HEAP = "heap";
  exports.JVM_MEMORY_TYPE_VALUE_NON_HEAP = "non_heap";
  exports.ATTR_JVM_THREAD_DAEMON = "jvm.thread.daemon";
  exports.ATTR_JVM_THREAD_STATE = "jvm.thread.state";
  exports.JVM_THREAD_STATE_VALUE_BLOCKED = "blocked";
  exports.JVM_THREAD_STATE_VALUE_NEW = "new";
  exports.JVM_THREAD_STATE_VALUE_RUNNABLE = "runnable";
  exports.JVM_THREAD_STATE_VALUE_TERMINATED = "terminated";
  exports.JVM_THREAD_STATE_VALUE_TIMED_WAITING = "timed_waiting";
  exports.JVM_THREAD_STATE_VALUE_WAITING = "waiting";
  exports.ATTR_NETWORK_LOCAL_ADDRESS = "network.local.address";
  exports.ATTR_NETWORK_LOCAL_PORT = "network.local.port";
  exports.ATTR_NETWORK_PEER_ADDRESS = "network.peer.address";
  exports.ATTR_NETWORK_PEER_PORT = "network.peer.port";
  exports.ATTR_NETWORK_PROTOCOL_NAME = "network.protocol.name";
  exports.ATTR_NETWORK_PROTOCOL_VERSION = "network.protocol.version";
  exports.ATTR_NETWORK_TRANSPORT = "network.transport";
  exports.NETWORK_TRANSPORT_VALUE_PIPE = "pipe";
  exports.NETWORK_TRANSPORT_VALUE_QUIC = "quic";
  exports.NETWORK_TRANSPORT_VALUE_TCP = "tcp";
  exports.NETWORK_TRANSPORT_VALUE_UDP = "udp";
  exports.NETWORK_TRANSPORT_VALUE_UNIX = "unix";
  exports.ATTR_NETWORK_TYPE = "network.type";
  exports.NETWORK_TYPE_VALUE_IPV4 = "ipv4";
  exports.NETWORK_TYPE_VALUE_IPV6 = "ipv6";
  exports.ATTR_OTEL_SCOPE_NAME = "otel.scope.name";
  exports.ATTR_OTEL_SCOPE_VERSION = "otel.scope.version";
  exports.ATTR_OTEL_STATUS_CODE = "otel.status_code";
  exports.OTEL_STATUS_CODE_VALUE_ERROR = "ERROR";
  exports.OTEL_STATUS_CODE_VALUE_OK = "OK";
  exports.ATTR_OTEL_STATUS_DESCRIPTION = "otel.status_description";
  exports.ATTR_SERVER_ADDRESS = "server.address";
  exports.ATTR_SERVER_PORT = "server.port";
  exports.ATTR_SERVICE_NAME = "service.name";
  exports.ATTR_SERVICE_VERSION = "service.version";
  exports.ATTR_SIGNALR_CONNECTION_STATUS = "signalr.connection.status";
  exports.SIGNALR_CONNECTION_STATUS_VALUE_APP_SHUTDOWN = "app_shutdown";
  exports.SIGNALR_CONNECTION_STATUS_VALUE_NORMAL_CLOSURE = "normal_closure";
  exports.SIGNALR_CONNECTION_STATUS_VALUE_TIMEOUT = "timeout";
  exports.ATTR_SIGNALR_TRANSPORT = "signalr.transport";
  exports.SIGNALR_TRANSPORT_VALUE_LONG_POLLING = "long_polling";
  exports.SIGNALR_TRANSPORT_VALUE_SERVER_SENT_EVENTS = "server_sent_events";
  exports.SIGNALR_TRANSPORT_VALUE_WEB_SOCKETS = "web_sockets";
  exports.ATTR_URL_FRAGMENT = "url.fragment";
  exports.ATTR_URL_FULL = "url.full";
  exports.ATTR_URL_PATH = "url.path";
  exports.ATTR_URL_QUERY = "url.query";
  exports.ATTR_URL_SCHEME = "url.scheme";
  exports.ATTR_USER_AGENT_ORIGINAL = "user_agent.original";
});

// node_modules/@opentelemetry/core/node_modules/@opentelemetry/semantic-conventions/build/src/stable_metrics.js
var require_stable_metrics = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.METRIC_SIGNALR_SERVER_CONNECTION_DURATION = exports.METRIC_SIGNALR_SERVER_ACTIVE_CONNECTIONS = exports.METRIC_KESTREL_UPGRADED_CONNECTIONS = exports.METRIC_KESTREL_TLS_HANDSHAKE_DURATION = exports.METRIC_KESTREL_REJECTED_CONNECTIONS = exports.METRIC_KESTREL_QUEUED_REQUESTS = exports.METRIC_KESTREL_QUEUED_CONNECTIONS = exports.METRIC_KESTREL_CONNECTION_DURATION = exports.METRIC_KESTREL_ACTIVE_TLS_HANDSHAKES = exports.METRIC_KESTREL_ACTIVE_CONNECTIONS = exports.METRIC_JVM_THREAD_COUNT = exports.METRIC_JVM_MEMORY_USED_AFTER_LAST_GC = exports.METRIC_JVM_MEMORY_USED = exports.METRIC_JVM_MEMORY_LIMIT = exports.METRIC_JVM_MEMORY_COMMITTED = exports.METRIC_JVM_GC_DURATION = exports.METRIC_JVM_CPU_TIME = exports.METRIC_JVM_CPU_RECENT_UTILIZATION = exports.METRIC_JVM_CPU_COUNT = exports.METRIC_JVM_CLASS_UNLOADED = exports.METRIC_JVM_CLASS_LOADED = exports.METRIC_JVM_CLASS_COUNT = exports.METRIC_HTTP_SERVER_REQUEST_DURATION = exports.METRIC_HTTP_CLIENT_REQUEST_DURATION = exports.METRIC_ASPNETCORE_ROUTING_MATCH_ATTEMPTS = exports.METRIC_ASPNETCORE_RATE_LIMITING_REQUESTS = exports.METRIC_ASPNETCORE_RATE_LIMITING_REQUEST_LEASE_DURATION = exports.METRIC_ASPNETCORE_RATE_LIMITING_REQUEST_TIME_IN_QUEUE = exports.METRIC_ASPNETCORE_RATE_LIMITING_QUEUED_REQUESTS = exports.METRIC_ASPNETCORE_RATE_LIMITING_ACTIVE_REQUEST_LEASES = exports.METRIC_ASPNETCORE_DIAGNOSTICS_EXCEPTIONS = undefined;
  exports.METRIC_ASPNETCORE_DIAGNOSTICS_EXCEPTIONS = "aspnetcore.diagnostics.exceptions";
  exports.METRIC_ASPNETCORE_RATE_LIMITING_ACTIVE_REQUEST_LEASES = "aspnetcore.rate_limiting.active_request_leases";
  exports.METRIC_ASPNETCORE_RATE_LIMITING_QUEUED_REQUESTS = "aspnetcore.rate_limiting.queued_requests";
  exports.METRIC_ASPNETCORE_RATE_LIMITING_REQUEST_TIME_IN_QUEUE = "aspnetcore.rate_limiting.request.time_in_queue";
  exports.METRIC_ASPNETCORE_RATE_LIMITING_REQUEST_LEASE_DURATION = "aspnetcore.rate_limiting.request_lease.duration";
  exports.METRIC_ASPNETCORE_RATE_LIMITING_REQUESTS = "aspnetcore.rate_limiting.requests";
  exports.METRIC_ASPNETCORE_ROUTING_MATCH_ATTEMPTS = "aspnetcore.routing.match_attempts";
  exports.METRIC_HTTP_CLIENT_REQUEST_DURATION = "http.client.request.duration";
  exports.METRIC_HTTP_SERVER_REQUEST_DURATION = "http.server.request.duration";
  exports.METRIC_JVM_CLASS_COUNT = "jvm.class.count";
  exports.METRIC_JVM_CLASS_LOADED = "jvm.class.loaded";
  exports.METRIC_JVM_CLASS_UNLOADED = "jvm.class.unloaded";
  exports.METRIC_JVM_CPU_COUNT = "jvm.cpu.count";
  exports.METRIC_JVM_CPU_RECENT_UTILIZATION = "jvm.cpu.recent_utilization";
  exports.METRIC_JVM_CPU_TIME = "jvm.cpu.time";
  exports.METRIC_JVM_GC_DURATION = "jvm.gc.duration";
  exports.METRIC_JVM_MEMORY_COMMITTED = "jvm.memory.committed";
  exports.METRIC_JVM_MEMORY_LIMIT = "jvm.memory.limit";
  exports.METRIC_JVM_MEMORY_USED = "jvm.memory.used";
  exports.METRIC_JVM_MEMORY_USED_AFTER_LAST_GC = "jvm.memory.used_after_last_gc";
  exports.METRIC_JVM_THREAD_COUNT = "jvm.thread.count";
  exports.METRIC_KESTREL_ACTIVE_CONNECTIONS = "kestrel.active_connections";
  exports.METRIC_KESTREL_ACTIVE_TLS_HANDSHAKES = "kestrel.active_tls_handshakes";
  exports.METRIC_KESTREL_CONNECTION_DURATION = "kestrel.connection.duration";
  exports.METRIC_KESTREL_QUEUED_CONNECTIONS = "kestrel.queued_connections";
  exports.METRIC_KESTREL_QUEUED_REQUESTS = "kestrel.queued_requests";
  exports.METRIC_KESTREL_REJECTED_CONNECTIONS = "kestrel.rejected_connections";
  exports.METRIC_KESTREL_TLS_HANDSHAKE_DURATION = "kestrel.tls_handshake.duration";
  exports.METRIC_KESTREL_UPGRADED_CONNECTIONS = "kestrel.upgraded_connections";
  exports.METRIC_SIGNALR_SERVER_ACTIVE_CONNECTIONS = "signalr.server.active_connections";
  exports.METRIC_SIGNALR_SERVER_CONNECTION_DURATION = "signalr.server.connection.duration";
});

// node_modules/@opentelemetry/core/node_modules/@opentelemetry/semantic-conventions/build/src/index.js
var require_src2 = __commonJS((exports) => {
  var __createBinding = exports && exports.__createBinding || (Object.create ? function(o, m, k, k2) {
    if (k2 === undefined)
      k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() {
      return m[k];
    } });
  } : function(o, m, k, k2) {
    if (k2 === undefined)
      k2 = k;
    o[k2] = m[k];
  });
  var __exportStar = exports && exports.__exportStar || function(m, exports2) {
    for (var p in m)
      if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p))
        __createBinding(exports2, m, p);
  };
  Object.defineProperty(exports, "__esModule", { value: true });
  __exportStar(require_trace2(), exports);
  __exportStar(require_resource(), exports);
  __exportStar(require_stable_attributes(), exports);
  __exportStar(require_stable_metrics(), exports);
});

// node_modules/@opentelemetry/core/build/src/platform/node/sdk-info.js
var require_sdk_info = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.SDK_INFO = undefined;
  var version_1 = require_version2();
  var semantic_conventions_1 = require_src2();
  exports.SDK_INFO = {
    [semantic_conventions_1.SEMRESATTRS_TELEMETRY_SDK_NAME]: "opentelemetry",
    [semantic_conventions_1.SEMRESATTRS_PROCESS_RUNTIME_NAME]: "node",
    [semantic_conventions_1.SEMRESATTRS_TELEMETRY_SDK_LANGUAGE]: semantic_conventions_1.TELEMETRYSDKLANGUAGEVALUES_NODEJS,
    [semantic_conventions_1.SEMRESATTRS_TELEMETRY_SDK_VERSION]: version_1.VERSION
  };
});

// node_modules/@opentelemetry/core/build/src/platform/node/timer-util.js
var require_timer_util = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.unrefTimer = undefined;
  function unrefTimer(timer) {
    timer.unref();
  }
  exports.unrefTimer = unrefTimer;
});

// node_modules/@opentelemetry/core/build/src/platform/node/index.js
var require_node2 = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.unrefTimer = exports.SDK_INFO = exports.otperformance = exports.RandomIdGenerator = exports.hexToBase64 = exports._globalThis = exports.getEnv = exports.getEnvWithoutDefaults = undefined;
  var environment_1 = require_environment2();
  Object.defineProperty(exports, "getEnvWithoutDefaults", { enumerable: true, get: function() {
    return environment_1.getEnvWithoutDefaults;
  } });
  Object.defineProperty(exports, "getEnv", { enumerable: true, get: function() {
    return environment_1.getEnv;
  } });
  var globalThis_1 = require_globalThis2();
  Object.defineProperty(exports, "_globalThis", { enumerable: true, get: function() {
    return globalThis_1._globalThis;
  } });
  var hex_to_base64_1 = require_hex_to_base64();
  Object.defineProperty(exports, "hexToBase64", { enumerable: true, get: function() {
    return hex_to_base64_1.hexToBase64;
  } });
  var RandomIdGenerator_1 = require_RandomIdGenerator();
  Object.defineProperty(exports, "RandomIdGenerator", { enumerable: true, get: function() {
    return RandomIdGenerator_1.RandomIdGenerator;
  } });
  var performance_1 = require_performance();
  Object.defineProperty(exports, "otperformance", { enumerable: true, get: function() {
    return performance_1.otperformance;
  } });
  var sdk_info_1 = require_sdk_info();
  Object.defineProperty(exports, "SDK_INFO", { enumerable: true, get: function() {
    return sdk_info_1.SDK_INFO;
  } });
  var timer_util_1 = require_timer_util();
  Object.defineProperty(exports, "unrefTimer", { enumerable: true, get: function() {
    return timer_util_1.unrefTimer;
  } });
});

// node_modules/@opentelemetry/core/build/src/platform/index.js
var require_platform2 = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.unrefTimer = exports.otperformance = exports.hexToBase64 = exports.getEnvWithoutDefaults = exports.getEnv = exports._globalThis = exports.SDK_INFO = exports.RandomIdGenerator = undefined;
  var node_1 = require_node2();
  Object.defineProperty(exports, "RandomIdGenerator", { enumerable: true, get: function() {
    return node_1.RandomIdGenerator;
  } });
  Object.defineProperty(exports, "SDK_INFO", { enumerable: true, get: function() {
    return node_1.SDK_INFO;
  } });
  Object.defineProperty(exports, "_globalThis", { enumerable: true, get: function() {
    return node_1._globalThis;
  } });
  Object.defineProperty(exports, "getEnv", { enumerable: true, get: function() {
    return node_1.getEnv;
  } });
  Object.defineProperty(exports, "getEnvWithoutDefaults", { enumerable: true, get: function() {
    return node_1.getEnvWithoutDefaults;
  } });
  Object.defineProperty(exports, "hexToBase64", { enumerable: true, get: function() {
    return node_1.hexToBase64;
  } });
  Object.defineProperty(exports, "otperformance", { enumerable: true, get: function() {
    return node_1.otperformance;
  } });
  Object.defineProperty(exports, "unrefTimer", { enumerable: true, get: function() {
    return node_1.unrefTimer;
  } });
});

// node_modules/@opentelemetry/core/build/src/common/time.js
var require_time = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.addHrTimes = exports.isTimeInput = exports.isTimeInputHrTime = exports.hrTimeToMicroseconds = exports.hrTimeToMilliseconds = exports.hrTimeToNanoseconds = exports.hrTimeToTimeStamp = exports.hrTimeDuration = exports.timeInputToHrTime = exports.hrTime = exports.getTimeOrigin = exports.millisToHrTime = undefined;
  var platform_1 = require_platform2();
  var NANOSECOND_DIGITS = 9;
  var NANOSECOND_DIGITS_IN_MILLIS = 6;
  var MILLISECONDS_TO_NANOSECONDS = Math.pow(10, NANOSECOND_DIGITS_IN_MILLIS);
  var SECOND_TO_NANOSECONDS = Math.pow(10, NANOSECOND_DIGITS);
  function millisToHrTime(epochMillis) {
    const epochSeconds = epochMillis / 1000;
    const seconds = Math.trunc(epochSeconds);
    const nanos = Math.round(epochMillis % 1000 * MILLISECONDS_TO_NANOSECONDS);
    return [seconds, nanos];
  }
  exports.millisToHrTime = millisToHrTime;
  function getTimeOrigin() {
    let timeOrigin = platform_1.otperformance.timeOrigin;
    if (typeof timeOrigin !== "number") {
      const perf = platform_1.otperformance;
      timeOrigin = perf.timing && perf.timing.fetchStart;
    }
    return timeOrigin;
  }
  exports.getTimeOrigin = getTimeOrigin;
  function hrTime(performanceNow) {
    const timeOrigin = millisToHrTime(getTimeOrigin());
    const now = millisToHrTime(typeof performanceNow === "number" ? performanceNow : platform_1.otperformance.now());
    return addHrTimes(timeOrigin, now);
  }
  exports.hrTime = hrTime;
  function timeInputToHrTime(time) {
    if (isTimeInputHrTime(time)) {
      return time;
    } else if (typeof time === "number") {
      if (time < getTimeOrigin()) {
        return hrTime(time);
      } else {
        return millisToHrTime(time);
      }
    } else if (time instanceof Date) {
      return millisToHrTime(time.getTime());
    } else {
      throw TypeError("Invalid input type");
    }
  }
  exports.timeInputToHrTime = timeInputToHrTime;
  function hrTimeDuration(startTime, endTime) {
    let seconds = endTime[0] - startTime[0];
    let nanos = endTime[1] - startTime[1];
    if (nanos < 0) {
      seconds -= 1;
      nanos += SECOND_TO_NANOSECONDS;
    }
    return [seconds, nanos];
  }
  exports.hrTimeDuration = hrTimeDuration;
  function hrTimeToTimeStamp(time) {
    const precision = NANOSECOND_DIGITS;
    const tmp = `${"0".repeat(precision)}${time[1]}Z`;
    const nanoString = tmp.substring(tmp.length - precision - 1);
    const date = new Date(time[0] * 1000).toISOString();
    return date.replace("000Z", nanoString);
  }
  exports.hrTimeToTimeStamp = hrTimeToTimeStamp;
  function hrTimeToNanoseconds(time) {
    return time[0] * SECOND_TO_NANOSECONDS + time[1];
  }
  exports.hrTimeToNanoseconds = hrTimeToNanoseconds;
  function hrTimeToMilliseconds(time) {
    return time[0] * 1000 + time[1] / 1e6;
  }
  exports.hrTimeToMilliseconds = hrTimeToMilliseconds;
  function hrTimeToMicroseconds(time) {
    return time[0] * 1e6 + time[1] / 1000;
  }
  exports.hrTimeToMicroseconds = hrTimeToMicroseconds;
  function isTimeInputHrTime(value) {
    return Array.isArray(value) && value.length === 2 && typeof value[0] === "number" && typeof value[1] === "number";
  }
  exports.isTimeInputHrTime = isTimeInputHrTime;
  function isTimeInput(value) {
    return isTimeInputHrTime(value) || typeof value === "number" || value instanceof Date;
  }
  exports.isTimeInput = isTimeInput;
  function addHrTimes(time1, time2) {
    const out = [time1[0] + time2[0], time1[1] + time2[1]];
    if (out[1] >= SECOND_TO_NANOSECONDS) {
      out[1] -= SECOND_TO_NANOSECONDS;
      out[0] += 1;
    }
    return out;
  }
  exports.addHrTimes = addHrTimes;
});

// node_modules/@opentelemetry/core/build/src/ExportResult.js
var require_ExportResult = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.ExportResultCode = undefined;
  var ExportResultCode;
  (function(ExportResultCode2) {
    ExportResultCode2[ExportResultCode2["SUCCESS"] = 0] = "SUCCESS";
    ExportResultCode2[ExportResultCode2["FAILED"] = 1] = "FAILED";
  })(ExportResultCode = exports.ExportResultCode || (exports.ExportResultCode = {}));
});

// node_modules/@opentelemetry/core/build/src/propagation/composite.js
var require_composite = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.CompositePropagator = undefined;
  var api_1 = require_src();

  class CompositePropagator {
    constructor(config = {}) {
      var _a;
      this._propagators = (_a = config.propagators) !== null && _a !== undefined ? _a : [];
      this._fields = Array.from(new Set(this._propagators.map((p) => typeof p.fields === "function" ? p.fields() : []).reduce((x, y) => x.concat(y), [])));
    }
    inject(context, carrier, setter) {
      for (const propagator of this._propagators) {
        try {
          propagator.inject(context, carrier, setter);
        } catch (err) {
          api_1.diag.warn(`Failed to inject with ${propagator.constructor.name}. Err: ${err.message}`);
        }
      }
    }
    extract(context, carrier, getter) {
      return this._propagators.reduce((ctx, propagator) => {
        try {
          return propagator.extract(ctx, carrier, getter);
        } catch (err) {
          api_1.diag.warn(`Failed to extract with ${propagator.constructor.name}. Err: ${err.message}`);
        }
        return ctx;
      }, context);
    }
    fields() {
      return this._fields.slice();
    }
  }
  exports.CompositePropagator = CompositePropagator;
});

// node_modules/@opentelemetry/core/build/src/internal/validators.js
var require_validators = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.validateValue = exports.validateKey = undefined;
  var VALID_KEY_CHAR_RANGE = "[_0-9a-z-*/]";
  var VALID_KEY = `[a-z]${VALID_KEY_CHAR_RANGE}{0,255}`;
  var VALID_VENDOR_KEY = `[a-z0-9]${VALID_KEY_CHAR_RANGE}{0,240}@[a-z]${VALID_KEY_CHAR_RANGE}{0,13}`;
  var VALID_KEY_REGEX = new RegExp(`^(?:${VALID_KEY}|${VALID_VENDOR_KEY})$`);
  var VALID_VALUE_BASE_REGEX = /^[ -~]{0,255}[!-~]$/;
  var INVALID_VALUE_COMMA_EQUAL_REGEX = /,|=/;
  function validateKey(key) {
    return VALID_KEY_REGEX.test(key);
  }
  exports.validateKey = validateKey;
  function validateValue(value) {
    return VALID_VALUE_BASE_REGEX.test(value) && !INVALID_VALUE_COMMA_EQUAL_REGEX.test(value);
  }
  exports.validateValue = validateValue;
});

// node_modules/@opentelemetry/core/build/src/trace/TraceState.js
var require_TraceState = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.TraceState = undefined;
  var validators_1 = require_validators();
  var MAX_TRACE_STATE_ITEMS = 32;
  var MAX_TRACE_STATE_LEN = 512;
  var LIST_MEMBERS_SEPARATOR = ",";
  var LIST_MEMBER_KEY_VALUE_SPLITTER = "=";

  class TraceState {
    constructor(rawTraceState) {
      this._internalState = new Map;
      if (rawTraceState)
        this._parse(rawTraceState);
    }
    set(key, value) {
      const traceState = this._clone();
      if (traceState._internalState.has(key)) {
        traceState._internalState.delete(key);
      }
      traceState._internalState.set(key, value);
      return traceState;
    }
    unset(key) {
      const traceState = this._clone();
      traceState._internalState.delete(key);
      return traceState;
    }
    get(key) {
      return this._internalState.get(key);
    }
    serialize() {
      return this._keys().reduce((agg, key) => {
        agg.push(key + LIST_MEMBER_KEY_VALUE_SPLITTER + this.get(key));
        return agg;
      }, []).join(LIST_MEMBERS_SEPARATOR);
    }
    _parse(rawTraceState) {
      if (rawTraceState.length > MAX_TRACE_STATE_LEN)
        return;
      this._internalState = rawTraceState.split(LIST_MEMBERS_SEPARATOR).reverse().reduce((agg, part) => {
        const listMember = part.trim();
        const i = listMember.indexOf(LIST_MEMBER_KEY_VALUE_SPLITTER);
        if (i !== -1) {
          const key = listMember.slice(0, i);
          const value = listMember.slice(i + 1, part.length);
          if ((0, validators_1.validateKey)(key) && (0, validators_1.validateValue)(value)) {
            agg.set(key, value);
          } else {}
        }
        return agg;
      }, new Map);
      if (this._internalState.size > MAX_TRACE_STATE_ITEMS) {
        this._internalState = new Map(Array.from(this._internalState.entries()).reverse().slice(0, MAX_TRACE_STATE_ITEMS));
      }
    }
    _keys() {
      return Array.from(this._internalState.keys()).reverse();
    }
    _clone() {
      const traceState = new TraceState;
      traceState._internalState = new Map(this._internalState);
      return traceState;
    }
  }
  exports.TraceState = TraceState;
});

// node_modules/@opentelemetry/core/build/src/trace/W3CTraceContextPropagator.js
var require_W3CTraceContextPropagator = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.W3CTraceContextPropagator = exports.parseTraceParent = exports.TRACE_STATE_HEADER = exports.TRACE_PARENT_HEADER = undefined;
  var api_1 = require_src();
  var suppress_tracing_1 = require_suppress_tracing();
  var TraceState_1 = require_TraceState();
  exports.TRACE_PARENT_HEADER = "traceparent";
  exports.TRACE_STATE_HEADER = "tracestate";
  var VERSION = "00";
  var VERSION_PART = "(?!ff)[\\da-f]{2}";
  var TRACE_ID_PART = "(?![0]{32})[\\da-f]{32}";
  var PARENT_ID_PART = "(?![0]{16})[\\da-f]{16}";
  var FLAGS_PART = "[\\da-f]{2}";
  var TRACE_PARENT_REGEX = new RegExp(`^\\s?(${VERSION_PART})-(${TRACE_ID_PART})-(${PARENT_ID_PART})-(${FLAGS_PART})(-.*)?\\s?$`);
  function parseTraceParent(traceParent) {
    const match = TRACE_PARENT_REGEX.exec(traceParent);
    if (!match)
      return null;
    if (match[1] === "00" && match[5])
      return null;
    return {
      traceId: match[2],
      spanId: match[3],
      traceFlags: parseInt(match[4], 16)
    };
  }
  exports.parseTraceParent = parseTraceParent;

  class W3CTraceContextPropagator {
    inject(context, carrier, setter) {
      const spanContext = api_1.trace.getSpanContext(context);
      if (!spanContext || (0, suppress_tracing_1.isTracingSuppressed)(context) || !(0, api_1.isSpanContextValid)(spanContext))
        return;
      const traceParent = `${VERSION}-${spanContext.traceId}-${spanContext.spanId}-0${Number(spanContext.traceFlags || api_1.TraceFlags.NONE).toString(16)}`;
      setter.set(carrier, exports.TRACE_PARENT_HEADER, traceParent);
      if (spanContext.traceState) {
        setter.set(carrier, exports.TRACE_STATE_HEADER, spanContext.traceState.serialize());
      }
    }
    extract(context, carrier, getter) {
      const traceParentHeader = getter.get(carrier, exports.TRACE_PARENT_HEADER);
      if (!traceParentHeader)
        return context;
      const traceParent = Array.isArray(traceParentHeader) ? traceParentHeader[0] : traceParentHeader;
      if (typeof traceParent !== "string")
        return context;
      const spanContext = parseTraceParent(traceParent);
      if (!spanContext)
        return context;
      spanContext.isRemote = true;
      const traceStateHeader = getter.get(carrier, exports.TRACE_STATE_HEADER);
      if (traceStateHeader) {
        const state = Array.isArray(traceStateHeader) ? traceStateHeader.join(",") : traceStateHeader;
        spanContext.traceState = new TraceState_1.TraceState(typeof state === "string" ? state : undefined);
      }
      return api_1.trace.setSpanContext(context, spanContext);
    }
    fields() {
      return [exports.TRACE_PARENT_HEADER, exports.TRACE_STATE_HEADER];
    }
  }
  exports.W3CTraceContextPropagator = W3CTraceContextPropagator;
});

// node_modules/@opentelemetry/core/build/src/trace/rpc-metadata.js
var require_rpc_metadata = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.getRPCMetadata = exports.deleteRPCMetadata = exports.setRPCMetadata = exports.RPCType = undefined;
  var api_1 = require_src();
  var RPC_METADATA_KEY = (0, api_1.createContextKey)("OpenTelemetry SDK Context Key RPC_METADATA");
  var RPCType;
  (function(RPCType2) {
    RPCType2["HTTP"] = "http";
  })(RPCType = exports.RPCType || (exports.RPCType = {}));
  function setRPCMetadata(context, meta) {
    return context.setValue(RPC_METADATA_KEY, meta);
  }
  exports.setRPCMetadata = setRPCMetadata;
  function deleteRPCMetadata(context) {
    return context.deleteValue(RPC_METADATA_KEY);
  }
  exports.deleteRPCMetadata = deleteRPCMetadata;
  function getRPCMetadata(context) {
    return context.getValue(RPC_METADATA_KEY);
  }
  exports.getRPCMetadata = getRPCMetadata;
});

// node_modules/@opentelemetry/core/build/src/trace/sampler/AlwaysOffSampler.js
var require_AlwaysOffSampler = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.AlwaysOffSampler = undefined;
  var api_1 = require_src();

  class AlwaysOffSampler {
    shouldSample() {
      return {
        decision: api_1.SamplingDecision.NOT_RECORD
      };
    }
    toString() {
      return "AlwaysOffSampler";
    }
  }
  exports.AlwaysOffSampler = AlwaysOffSampler;
});

// node_modules/@opentelemetry/core/build/src/trace/sampler/AlwaysOnSampler.js
var require_AlwaysOnSampler = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.AlwaysOnSampler = undefined;
  var api_1 = require_src();

  class AlwaysOnSampler {
    shouldSample() {
      return {
        decision: api_1.SamplingDecision.RECORD_AND_SAMPLED
      };
    }
    toString() {
      return "AlwaysOnSampler";
    }
  }
  exports.AlwaysOnSampler = AlwaysOnSampler;
});

// node_modules/@opentelemetry/core/build/src/trace/sampler/ParentBasedSampler.js
var require_ParentBasedSampler = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.ParentBasedSampler = undefined;
  var api_1 = require_src();
  var global_error_handler_1 = require_global_error_handler();
  var AlwaysOffSampler_1 = require_AlwaysOffSampler();
  var AlwaysOnSampler_1 = require_AlwaysOnSampler();

  class ParentBasedSampler {
    constructor(config) {
      var _a, _b, _c, _d;
      this._root = config.root;
      if (!this._root) {
        (0, global_error_handler_1.globalErrorHandler)(new Error("ParentBasedSampler must have a root sampler configured"));
        this._root = new AlwaysOnSampler_1.AlwaysOnSampler;
      }
      this._remoteParentSampled = (_a = config.remoteParentSampled) !== null && _a !== undefined ? _a : new AlwaysOnSampler_1.AlwaysOnSampler;
      this._remoteParentNotSampled = (_b = config.remoteParentNotSampled) !== null && _b !== undefined ? _b : new AlwaysOffSampler_1.AlwaysOffSampler;
      this._localParentSampled = (_c = config.localParentSampled) !== null && _c !== undefined ? _c : new AlwaysOnSampler_1.AlwaysOnSampler;
      this._localParentNotSampled = (_d = config.localParentNotSampled) !== null && _d !== undefined ? _d : new AlwaysOffSampler_1.AlwaysOffSampler;
    }
    shouldSample(context, traceId, spanName, spanKind, attributes, links) {
      const parentContext = api_1.trace.getSpanContext(context);
      if (!parentContext || !(0, api_1.isSpanContextValid)(parentContext)) {
        return this._root.shouldSample(context, traceId, spanName, spanKind, attributes, links);
      }
      if (parentContext.isRemote) {
        if (parentContext.traceFlags & api_1.TraceFlags.SAMPLED) {
          return this._remoteParentSampled.shouldSample(context, traceId, spanName, spanKind, attributes, links);
        }
        return this._remoteParentNotSampled.shouldSample(context, traceId, spanName, spanKind, attributes, links);
      }
      if (parentContext.traceFlags & api_1.TraceFlags.SAMPLED) {
        return this._localParentSampled.shouldSample(context, traceId, spanName, spanKind, attributes, links);
      }
      return this._localParentNotSampled.shouldSample(context, traceId, spanName, spanKind, attributes, links);
    }
    toString() {
      return `ParentBased{root=${this._root.toString()}, remoteParentSampled=${this._remoteParentSampled.toString()}, remoteParentNotSampled=${this._remoteParentNotSampled.toString()}, localParentSampled=${this._localParentSampled.toString()}, localParentNotSampled=${this._localParentNotSampled.toString()}}`;
    }
  }
  exports.ParentBasedSampler = ParentBasedSampler;
});

// node_modules/@opentelemetry/core/build/src/trace/sampler/TraceIdRatioBasedSampler.js
var require_TraceIdRatioBasedSampler = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.TraceIdRatioBasedSampler = undefined;
  var api_1 = require_src();

  class TraceIdRatioBasedSampler {
    constructor(_ratio = 0) {
      this._ratio = _ratio;
      this._ratio = this._normalize(_ratio);
      this._upperBound = Math.floor(this._ratio * 4294967295);
    }
    shouldSample(context, traceId) {
      return {
        decision: (0, api_1.isValidTraceId)(traceId) && this._accumulate(traceId) < this._upperBound ? api_1.SamplingDecision.RECORD_AND_SAMPLED : api_1.SamplingDecision.NOT_RECORD
      };
    }
    toString() {
      return `TraceIdRatioBased{${this._ratio}}`;
    }
    _normalize(ratio) {
      if (typeof ratio !== "number" || isNaN(ratio))
        return 0;
      return ratio >= 1 ? 1 : ratio <= 0 ? 0 : ratio;
    }
    _accumulate(traceId) {
      let accumulation = 0;
      for (let i = 0;i < traceId.length / 8; i++) {
        const pos = i * 8;
        const part = parseInt(traceId.slice(pos, pos + 8), 16);
        accumulation = (accumulation ^ part) >>> 0;
      }
      return accumulation;
    }
  }
  exports.TraceIdRatioBasedSampler = TraceIdRatioBasedSampler;
});

// node_modules/@opentelemetry/core/build/src/utils/lodash.merge.js
var require_lodash_merge = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.isPlainObject = undefined;
  var objectTag = "[object Object]";
  var nullTag = "[object Null]";
  var undefinedTag = "[object Undefined]";
  var funcProto = Function.prototype;
  var funcToString = funcProto.toString;
  var objectCtorString = funcToString.call(Object);
  var getPrototype = overArg(Object.getPrototypeOf, Object);
  var objectProto = Object.prototype;
  var hasOwnProperty = objectProto.hasOwnProperty;
  var symToStringTag = Symbol ? Symbol.toStringTag : undefined;
  var nativeObjectToString = objectProto.toString;
  function overArg(func, transform) {
    return function(arg) {
      return func(transform(arg));
    };
  }
  function isPlainObject(value) {
    if (!isObjectLike(value) || baseGetTag(value) !== objectTag) {
      return false;
    }
    const proto = getPrototype(value);
    if (proto === null) {
      return true;
    }
    const Ctor = hasOwnProperty.call(proto, "constructor") && proto.constructor;
    return typeof Ctor == "function" && Ctor instanceof Ctor && funcToString.call(Ctor) === objectCtorString;
  }
  exports.isPlainObject = isPlainObject;
  function isObjectLike(value) {
    return value != null && typeof value == "object";
  }
  function baseGetTag(value) {
    if (value == null) {
      return value === undefined ? undefinedTag : nullTag;
    }
    return symToStringTag && symToStringTag in Object(value) ? getRawTag(value) : objectToString(value);
  }
  function getRawTag(value) {
    const isOwn = hasOwnProperty.call(value, symToStringTag), tag = value[symToStringTag];
    let unmasked = false;
    try {
      value[symToStringTag] = undefined;
      unmasked = true;
    } catch (e) {}
    const result = nativeObjectToString.call(value);
    if (unmasked) {
      if (isOwn) {
        value[symToStringTag] = tag;
      } else {
        delete value[symToStringTag];
      }
    }
    return result;
  }
  function objectToString(value) {
    return nativeObjectToString.call(value);
  }
});

// node_modules/@opentelemetry/core/build/src/utils/merge.js
var require_merge = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.merge = undefined;
  var lodash_merge_1 = require_lodash_merge();
  var MAX_LEVEL = 20;
  function merge(...args) {
    let result = args.shift();
    const objects = new WeakMap;
    while (args.length > 0) {
      result = mergeTwoObjects(result, args.shift(), 0, objects);
    }
    return result;
  }
  exports.merge = merge;
  function takeValue(value) {
    if (isArray(value)) {
      return value.slice();
    }
    return value;
  }
  function mergeTwoObjects(one, two, level = 0, objects) {
    let result;
    if (level > MAX_LEVEL) {
      return;
    }
    level++;
    if (isPrimitive(one) || isPrimitive(two) || isFunction(two)) {
      result = takeValue(two);
    } else if (isArray(one)) {
      result = one.slice();
      if (isArray(two)) {
        for (let i = 0, j = two.length;i < j; i++) {
          result.push(takeValue(two[i]));
        }
      } else if (isObject(two)) {
        const keys = Object.keys(two);
        for (let i = 0, j = keys.length;i < j; i++) {
          const key = keys[i];
          result[key] = takeValue(two[key]);
        }
      }
    } else if (isObject(one)) {
      if (isObject(two)) {
        if (!shouldMerge(one, two)) {
          return two;
        }
        result = Object.assign({}, one);
        const keys = Object.keys(two);
        for (let i = 0, j = keys.length;i < j; i++) {
          const key = keys[i];
          const twoValue = two[key];
          if (isPrimitive(twoValue)) {
            if (typeof twoValue === "undefined") {
              delete result[key];
            } else {
              result[key] = twoValue;
            }
          } else {
            const obj1 = result[key];
            const obj2 = twoValue;
            if (wasObjectReferenced(one, key, objects) || wasObjectReferenced(two, key, objects)) {
              delete result[key];
            } else {
              if (isObject(obj1) && isObject(obj2)) {
                const arr1 = objects.get(obj1) || [];
                const arr2 = objects.get(obj2) || [];
                arr1.push({ obj: one, key });
                arr2.push({ obj: two, key });
                objects.set(obj1, arr1);
                objects.set(obj2, arr2);
              }
              result[key] = mergeTwoObjects(result[key], twoValue, level, objects);
            }
          }
        }
      } else {
        result = two;
      }
    }
    return result;
  }
  function wasObjectReferenced(obj, key, objects) {
    const arr = objects.get(obj[key]) || [];
    for (let i = 0, j = arr.length;i < j; i++) {
      const info = arr[i];
      if (info.key === key && info.obj === obj) {
        return true;
      }
    }
    return false;
  }
  function isArray(value) {
    return Array.isArray(value);
  }
  function isFunction(value) {
    return typeof value === "function";
  }
  function isObject(value) {
    return !isPrimitive(value) && !isArray(value) && !isFunction(value) && typeof value === "object";
  }
  function isPrimitive(value) {
    return typeof value === "string" || typeof value === "number" || typeof value === "boolean" || typeof value === "undefined" || value instanceof Date || value instanceof RegExp || value === null;
  }
  function shouldMerge(one, two) {
    if (!(0, lodash_merge_1.isPlainObject)(one) || !(0, lodash_merge_1.isPlainObject)(two)) {
      return false;
    }
    return true;
  }
});

// node_modules/@opentelemetry/core/build/src/utils/timeout.js
var require_timeout = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.callWithTimeout = exports.TimeoutError = undefined;

  class TimeoutError extends Error {
    constructor(message) {
      super(message);
      Object.setPrototypeOf(this, TimeoutError.prototype);
    }
  }
  exports.TimeoutError = TimeoutError;
  function callWithTimeout(promise, timeout) {
    let timeoutHandle;
    const timeoutPromise = new Promise(function timeoutFunction(_resolve, reject) {
      timeoutHandle = setTimeout(function timeoutHandler() {
        reject(new TimeoutError("Operation timed out."));
      }, timeout);
    });
    return Promise.race([promise, timeoutPromise]).then((result) => {
      clearTimeout(timeoutHandle);
      return result;
    }, (reason) => {
      clearTimeout(timeoutHandle);
      throw reason;
    });
  }
  exports.callWithTimeout = callWithTimeout;
});

// node_modules/@opentelemetry/core/build/src/utils/url.js
var require_url = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.isUrlIgnored = exports.urlMatches = undefined;
  function urlMatches(url, urlToMatch) {
    if (typeof urlToMatch === "string") {
      return url === urlToMatch;
    } else {
      return !!url.match(urlToMatch);
    }
  }
  exports.urlMatches = urlMatches;
  function isUrlIgnored(url, ignoredUrls) {
    if (!ignoredUrls) {
      return false;
    }
    for (const ignoreUrl of ignoredUrls) {
      if (urlMatches(url, ignoreUrl)) {
        return true;
      }
    }
    return false;
  }
  exports.isUrlIgnored = isUrlIgnored;
});

// node_modules/@opentelemetry/core/build/src/utils/wrap.js
var require_wrap = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.isWrapped = undefined;
  function isWrapped(func) {
    return typeof func === "function" && typeof func.__original === "function" && typeof func.__unwrap === "function" && func.__wrapped === true;
  }
  exports.isWrapped = isWrapped;
});

// node_modules/@opentelemetry/core/build/src/utils/promise.js
var require_promise = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.Deferred = undefined;

  class Deferred {
    constructor() {
      this._promise = new Promise((resolve, reject) => {
        this._resolve = resolve;
        this._reject = reject;
      });
    }
    get promise() {
      return this._promise;
    }
    resolve(val) {
      this._resolve(val);
    }
    reject(err) {
      this._reject(err);
    }
  }
  exports.Deferred = Deferred;
});

// node_modules/@opentelemetry/core/build/src/utils/callback.js
var require_callback = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.BindOnceFuture = undefined;
  var promise_1 = require_promise();

  class BindOnceFuture {
    constructor(_callback, _that) {
      this._callback = _callback;
      this._that = _that;
      this._isCalled = false;
      this._deferred = new promise_1.Deferred;
    }
    get isCalled() {
      return this._isCalled;
    }
    get promise() {
      return this._deferred.promise;
    }
    call(...args) {
      if (!this._isCalled) {
        this._isCalled = true;
        try {
          Promise.resolve(this._callback.call(this._that, ...args)).then((val) => this._deferred.resolve(val), (err) => this._deferred.reject(err));
        } catch (err) {
          this._deferred.reject(err);
        }
      }
      return this._deferred.promise;
    }
  }
  exports.BindOnceFuture = BindOnceFuture;
});

// node_modules/@opentelemetry/core/build/src/internal/exporter.js
var require_exporter = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports._export = undefined;
  var api_1 = require_src();
  var suppress_tracing_1 = require_suppress_tracing();
  function _export(exporter, arg) {
    return new Promise((resolve) => {
      api_1.context.with((0, suppress_tracing_1.suppressTracing)(api_1.context.active()), () => {
        exporter.export(arg, (result) => {
          resolve(result);
        });
      });
    });
  }
  exports._export = _export;
});

// node_modules/@opentelemetry/core/build/src/index.js
var require_src3 = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.DEFAULT_ATTRIBUTE_VALUE_LENGTH_LIMIT = exports.DEFAULT_ATTRIBUTE_COUNT_LIMIT = exports.TraceState = exports.unsuppressTracing = exports.suppressTracing = exports.isTracingSuppressed = exports.TraceIdRatioBasedSampler = exports.ParentBasedSampler = exports.AlwaysOnSampler = exports.AlwaysOffSampler = exports.setRPCMetadata = exports.getRPCMetadata = exports.deleteRPCMetadata = exports.RPCType = exports.parseTraceParent = exports.W3CTraceContextPropagator = exports.TRACE_STATE_HEADER = exports.TRACE_PARENT_HEADER = exports.CompositePropagator = exports.unrefTimer = exports.otperformance = exports.hexToBase64 = exports.getEnvWithoutDefaults = exports.getEnv = exports._globalThis = exports.SDK_INFO = exports.RandomIdGenerator = exports.baggageUtils = exports.ExportResultCode = exports.hexToBinary = exports.timeInputToHrTime = exports.millisToHrTime = exports.isTimeInputHrTime = exports.isTimeInput = exports.hrTimeToTimeStamp = exports.hrTimeToNanoseconds = exports.hrTimeToMilliseconds = exports.hrTimeToMicroseconds = exports.hrTimeDuration = exports.hrTime = exports.getTimeOrigin = exports.addHrTimes = exports.loggingErrorHandler = exports.setGlobalErrorHandler = exports.globalErrorHandler = exports.sanitizeAttributes = exports.isAttributeValue = exports.isAttributeKey = exports.AnchoredClock = exports.W3CBaggagePropagator = undefined;
  exports.internal = exports.VERSION = exports.BindOnceFuture = exports.isWrapped = exports.urlMatches = exports.isUrlIgnored = exports.callWithTimeout = exports.TimeoutError = exports.TracesSamplerValues = exports.merge = exports.parseEnvironment = exports.DEFAULT_SPAN_ATTRIBUTE_PER_LINK_COUNT_LIMIT = exports.DEFAULT_SPAN_ATTRIBUTE_PER_EVENT_COUNT_LIMIT = exports.DEFAULT_ENVIRONMENT = undefined;
  var W3CBaggagePropagator_1 = require_W3CBaggagePropagator();
  Object.defineProperty(exports, "W3CBaggagePropagator", { enumerable: true, get: function() {
    return W3CBaggagePropagator_1.W3CBaggagePropagator;
  } });
  var anchored_clock_1 = require_anchored_clock();
  Object.defineProperty(exports, "AnchoredClock", { enumerable: true, get: function() {
    return anchored_clock_1.AnchoredClock;
  } });
  var attributes_1 = require_attributes();
  Object.defineProperty(exports, "isAttributeKey", { enumerable: true, get: function() {
    return attributes_1.isAttributeKey;
  } });
  Object.defineProperty(exports, "isAttributeValue", { enumerable: true, get: function() {
    return attributes_1.isAttributeValue;
  } });
  Object.defineProperty(exports, "sanitizeAttributes", { enumerable: true, get: function() {
    return attributes_1.sanitizeAttributes;
  } });
  var global_error_handler_1 = require_global_error_handler();
  Object.defineProperty(exports, "globalErrorHandler", { enumerable: true, get: function() {
    return global_error_handler_1.globalErrorHandler;
  } });
  Object.defineProperty(exports, "setGlobalErrorHandler", { enumerable: true, get: function() {
    return global_error_handler_1.setGlobalErrorHandler;
  } });
  var logging_error_handler_1 = require_logging_error_handler();
  Object.defineProperty(exports, "loggingErrorHandler", { enumerable: true, get: function() {
    return logging_error_handler_1.loggingErrorHandler;
  } });
  var time_1 = require_time();
  Object.defineProperty(exports, "addHrTimes", { enumerable: true, get: function() {
    return time_1.addHrTimes;
  } });
  Object.defineProperty(exports, "getTimeOrigin", { enumerable: true, get: function() {
    return time_1.getTimeOrigin;
  } });
  Object.defineProperty(exports, "hrTime", { enumerable: true, get: function() {
    return time_1.hrTime;
  } });
  Object.defineProperty(exports, "hrTimeDuration", { enumerable: true, get: function() {
    return time_1.hrTimeDuration;
  } });
  Object.defineProperty(exports, "hrTimeToMicroseconds", { enumerable: true, get: function() {
    return time_1.hrTimeToMicroseconds;
  } });
  Object.defineProperty(exports, "hrTimeToMilliseconds", { enumerable: true, get: function() {
    return time_1.hrTimeToMilliseconds;
  } });
  Object.defineProperty(exports, "hrTimeToNanoseconds", { enumerable: true, get: function() {
    return time_1.hrTimeToNanoseconds;
  } });
  Object.defineProperty(exports, "hrTimeToTimeStamp", { enumerable: true, get: function() {
    return time_1.hrTimeToTimeStamp;
  } });
  Object.defineProperty(exports, "isTimeInput", { enumerable: true, get: function() {
    return time_1.isTimeInput;
  } });
  Object.defineProperty(exports, "isTimeInputHrTime", { enumerable: true, get: function() {
    return time_1.isTimeInputHrTime;
  } });
  Object.defineProperty(exports, "millisToHrTime", { enumerable: true, get: function() {
    return time_1.millisToHrTime;
  } });
  Object.defineProperty(exports, "timeInputToHrTime", { enumerable: true, get: function() {
    return time_1.timeInputToHrTime;
  } });
  var hex_to_binary_1 = require_hex_to_binary();
  Object.defineProperty(exports, "hexToBinary", { enumerable: true, get: function() {
    return hex_to_binary_1.hexToBinary;
  } });
  var ExportResult_1 = require_ExportResult();
  Object.defineProperty(exports, "ExportResultCode", { enumerable: true, get: function() {
    return ExportResult_1.ExportResultCode;
  } });
  var utils_1 = require_utils3();
  exports.baggageUtils = {
    getKeyPairs: utils_1.getKeyPairs,
    serializeKeyPairs: utils_1.serializeKeyPairs,
    parseKeyPairsIntoRecord: utils_1.parseKeyPairsIntoRecord,
    parsePairKeyValue: utils_1.parsePairKeyValue
  };
  var platform_1 = require_platform2();
  Object.defineProperty(exports, "RandomIdGenerator", { enumerable: true, get: function() {
    return platform_1.RandomIdGenerator;
  } });
  Object.defineProperty(exports, "SDK_INFO", { enumerable: true, get: function() {
    return platform_1.SDK_INFO;
  } });
  Object.defineProperty(exports, "_globalThis", { enumerable: true, get: function() {
    return platform_1._globalThis;
  } });
  Object.defineProperty(exports, "getEnv", { enumerable: true, get: function() {
    return platform_1.getEnv;
  } });
  Object.defineProperty(exports, "getEnvWithoutDefaults", { enumerable: true, get: function() {
    return platform_1.getEnvWithoutDefaults;
  } });
  Object.defineProperty(exports, "hexToBase64", { enumerable: true, get: function() {
    return platform_1.hexToBase64;
  } });
  Object.defineProperty(exports, "otperformance", { enumerable: true, get: function() {
    return platform_1.otperformance;
  } });
  Object.defineProperty(exports, "unrefTimer", { enumerable: true, get: function() {
    return platform_1.unrefTimer;
  } });
  var composite_1 = require_composite();
  Object.defineProperty(exports, "CompositePropagator", { enumerable: true, get: function() {
    return composite_1.CompositePropagator;
  } });
  var W3CTraceContextPropagator_1 = require_W3CTraceContextPropagator();
  Object.defineProperty(exports, "TRACE_PARENT_HEADER", { enumerable: true, get: function() {
    return W3CTraceContextPropagator_1.TRACE_PARENT_HEADER;
  } });
  Object.defineProperty(exports, "TRACE_STATE_HEADER", { enumerable: true, get: function() {
    return W3CTraceContextPropagator_1.TRACE_STATE_HEADER;
  } });
  Object.defineProperty(exports, "W3CTraceContextPropagator", { enumerable: true, get: function() {
    return W3CTraceContextPropagator_1.W3CTraceContextPropagator;
  } });
  Object.defineProperty(exports, "parseTraceParent", { enumerable: true, get: function() {
    return W3CTraceContextPropagator_1.parseTraceParent;
  } });
  var rpc_metadata_1 = require_rpc_metadata();
  Object.defineProperty(exports, "RPCType", { enumerable: true, get: function() {
    return rpc_metadata_1.RPCType;
  } });
  Object.defineProperty(exports, "deleteRPCMetadata", { enumerable: true, get: function() {
    return rpc_metadata_1.deleteRPCMetadata;
  } });
  Object.defineProperty(exports, "getRPCMetadata", { enumerable: true, get: function() {
    return rpc_metadata_1.getRPCMetadata;
  } });
  Object.defineProperty(exports, "setRPCMetadata", { enumerable: true, get: function() {
    return rpc_metadata_1.setRPCMetadata;
  } });
  var AlwaysOffSampler_1 = require_AlwaysOffSampler();
  Object.defineProperty(exports, "AlwaysOffSampler", { enumerable: true, get: function() {
    return AlwaysOffSampler_1.AlwaysOffSampler;
  } });
  var AlwaysOnSampler_1 = require_AlwaysOnSampler();
  Object.defineProperty(exports, "AlwaysOnSampler", { enumerable: true, get: function() {
    return AlwaysOnSampler_1.AlwaysOnSampler;
  } });
  var ParentBasedSampler_1 = require_ParentBasedSampler();
  Object.defineProperty(exports, "ParentBasedSampler", { enumerable: true, get: function() {
    return ParentBasedSampler_1.ParentBasedSampler;
  } });
  var TraceIdRatioBasedSampler_1 = require_TraceIdRatioBasedSampler();
  Object.defineProperty(exports, "TraceIdRatioBasedSampler", { enumerable: true, get: function() {
    return TraceIdRatioBasedSampler_1.TraceIdRatioBasedSampler;
  } });
  var suppress_tracing_1 = require_suppress_tracing();
  Object.defineProperty(exports, "isTracingSuppressed", { enumerable: true, get: function() {
    return suppress_tracing_1.isTracingSuppressed;
  } });
  Object.defineProperty(exports, "suppressTracing", { enumerable: true, get: function() {
    return suppress_tracing_1.suppressTracing;
  } });
  Object.defineProperty(exports, "unsuppressTracing", { enumerable: true, get: function() {
    return suppress_tracing_1.unsuppressTracing;
  } });
  var TraceState_1 = require_TraceState();
  Object.defineProperty(exports, "TraceState", { enumerable: true, get: function() {
    return TraceState_1.TraceState;
  } });
  var environment_1 = require_environment();
  Object.defineProperty(exports, "DEFAULT_ATTRIBUTE_COUNT_LIMIT", { enumerable: true, get: function() {
    return environment_1.DEFAULT_ATTRIBUTE_COUNT_LIMIT;
  } });
  Object.defineProperty(exports, "DEFAULT_ATTRIBUTE_VALUE_LENGTH_LIMIT", { enumerable: true, get: function() {
    return environment_1.DEFAULT_ATTRIBUTE_VALUE_LENGTH_LIMIT;
  } });
  Object.defineProperty(exports, "DEFAULT_ENVIRONMENT", { enumerable: true, get: function() {
    return environment_1.DEFAULT_ENVIRONMENT;
  } });
  Object.defineProperty(exports, "DEFAULT_SPAN_ATTRIBUTE_PER_EVENT_COUNT_LIMIT", { enumerable: true, get: function() {
    return environment_1.DEFAULT_SPAN_ATTRIBUTE_PER_EVENT_COUNT_LIMIT;
  } });
  Object.defineProperty(exports, "DEFAULT_SPAN_ATTRIBUTE_PER_LINK_COUNT_LIMIT", { enumerable: true, get: function() {
    return environment_1.DEFAULT_SPAN_ATTRIBUTE_PER_LINK_COUNT_LIMIT;
  } });
  Object.defineProperty(exports, "parseEnvironment", { enumerable: true, get: function() {
    return environment_1.parseEnvironment;
  } });
  var merge_1 = require_merge();
  Object.defineProperty(exports, "merge", { enumerable: true, get: function() {
    return merge_1.merge;
  } });
  var sampling_1 = require_sampling();
  Object.defineProperty(exports, "TracesSamplerValues", { enumerable: true, get: function() {
    return sampling_1.TracesSamplerValues;
  } });
  var timeout_1 = require_timeout();
  Object.defineProperty(exports, "TimeoutError", { enumerable: true, get: function() {
    return timeout_1.TimeoutError;
  } });
  Object.defineProperty(exports, "callWithTimeout", { enumerable: true, get: function() {
    return timeout_1.callWithTimeout;
  } });
  var url_1 = require_url();
  Object.defineProperty(exports, "isUrlIgnored", { enumerable: true, get: function() {
    return url_1.isUrlIgnored;
  } });
  Object.defineProperty(exports, "urlMatches", { enumerable: true, get: function() {
    return url_1.urlMatches;
  } });
  var wrap_1 = require_wrap();
  Object.defineProperty(exports, "isWrapped", { enumerable: true, get: function() {
    return wrap_1.isWrapped;
  } });
  var callback_1 = require_callback();
  Object.defineProperty(exports, "BindOnceFuture", { enumerable: true, get: function() {
    return callback_1.BindOnceFuture;
  } });
  var version_1 = require_version2();
  Object.defineProperty(exports, "VERSION", { enumerable: true, get: function() {
    return version_1.VERSION;
  } });
  var exporter_1 = require_exporter();
  exports.internal = {
    _export: exporter_1._export
  };
});

// node_modules/@opentelemetry/sdk-trace-base/node_modules/@opentelemetry/semantic-conventions/build/src/internal/utils.js
var require_utils5 = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.createConstMap = undefined;
  function createConstMap(values) {
    let res = {};
    const len = values.length;
    for (let lp = 0;lp < len; lp++) {
      const val = values[lp];
      if (val) {
        res[String(val).toUpperCase().replace(/[-.]/g, "_")] = val;
      }
    }
    return res;
  }
  exports.createConstMap = createConstMap;
});

// node_modules/@opentelemetry/sdk-trace-base/node_modules/@opentelemetry/semantic-conventions/build/src/trace/SemanticAttributes.js
var require_SemanticAttributes2 = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.SEMATTRS_NET_HOST_CARRIER_ICC = exports.SEMATTRS_NET_HOST_CARRIER_MNC = exports.SEMATTRS_NET_HOST_CARRIER_MCC = exports.SEMATTRS_NET_HOST_CARRIER_NAME = exports.SEMATTRS_NET_HOST_CONNECTION_SUBTYPE = exports.SEMATTRS_NET_HOST_CONNECTION_TYPE = exports.SEMATTRS_NET_HOST_NAME = exports.SEMATTRS_NET_HOST_PORT = exports.SEMATTRS_NET_HOST_IP = exports.SEMATTRS_NET_PEER_NAME = exports.SEMATTRS_NET_PEER_PORT = exports.SEMATTRS_NET_PEER_IP = exports.SEMATTRS_NET_TRANSPORT = exports.SEMATTRS_FAAS_INVOKED_REGION = exports.SEMATTRS_FAAS_INVOKED_PROVIDER = exports.SEMATTRS_FAAS_INVOKED_NAME = exports.SEMATTRS_FAAS_COLDSTART = exports.SEMATTRS_FAAS_CRON = exports.SEMATTRS_FAAS_TIME = exports.SEMATTRS_FAAS_DOCUMENT_NAME = exports.SEMATTRS_FAAS_DOCUMENT_TIME = exports.SEMATTRS_FAAS_DOCUMENT_OPERATION = exports.SEMATTRS_FAAS_DOCUMENT_COLLECTION = exports.SEMATTRS_FAAS_EXECUTION = exports.SEMATTRS_FAAS_TRIGGER = exports.SEMATTRS_EXCEPTION_ESCAPED = exports.SEMATTRS_EXCEPTION_STACKTRACE = exports.SEMATTRS_EXCEPTION_MESSAGE = exports.SEMATTRS_EXCEPTION_TYPE = exports.SEMATTRS_DB_SQL_TABLE = exports.SEMATTRS_DB_MONGODB_COLLECTION = exports.SEMATTRS_DB_REDIS_DATABASE_INDEX = exports.SEMATTRS_DB_HBASE_NAMESPACE = exports.SEMATTRS_DB_CASSANDRA_COORDINATOR_DC = exports.SEMATTRS_DB_CASSANDRA_COORDINATOR_ID = exports.SEMATTRS_DB_CASSANDRA_SPECULATIVE_EXECUTION_COUNT = exports.SEMATTRS_DB_CASSANDRA_IDEMPOTENCE = exports.SEMATTRS_DB_CASSANDRA_TABLE = exports.SEMATTRS_DB_CASSANDRA_CONSISTENCY_LEVEL = exports.SEMATTRS_DB_CASSANDRA_PAGE_SIZE = exports.SEMATTRS_DB_CASSANDRA_KEYSPACE = exports.SEMATTRS_DB_MSSQL_INSTANCE_NAME = exports.SEMATTRS_DB_OPERATION = exports.SEMATTRS_DB_STATEMENT = exports.SEMATTRS_DB_NAME = exports.SEMATTRS_DB_JDBC_DRIVER_CLASSNAME = exports.SEMATTRS_DB_USER = exports.SEMATTRS_DB_CONNECTION_STRING = exports.SEMATTRS_DB_SYSTEM = exports.SEMATTRS_AWS_LAMBDA_INVOKED_ARN = undefined;
  exports.SEMATTRS_MESSAGING_DESTINATION_KIND = exports.SEMATTRS_MESSAGING_DESTINATION = exports.SEMATTRS_MESSAGING_SYSTEM = exports.SEMATTRS_AWS_DYNAMODB_GLOBAL_SECONDARY_INDEX_UPDATES = exports.SEMATTRS_AWS_DYNAMODB_ATTRIBUTE_DEFINITIONS = exports.SEMATTRS_AWS_DYNAMODB_SCANNED_COUNT = exports.SEMATTRS_AWS_DYNAMODB_COUNT = exports.SEMATTRS_AWS_DYNAMODB_TOTAL_SEGMENTS = exports.SEMATTRS_AWS_DYNAMODB_SEGMENT = exports.SEMATTRS_AWS_DYNAMODB_SCAN_FORWARD = exports.SEMATTRS_AWS_DYNAMODB_TABLE_COUNT = exports.SEMATTRS_AWS_DYNAMODB_EXCLUSIVE_START_TABLE = exports.SEMATTRS_AWS_DYNAMODB_LOCAL_SECONDARY_INDEXES = exports.SEMATTRS_AWS_DYNAMODB_GLOBAL_SECONDARY_INDEXES = exports.SEMATTRS_AWS_DYNAMODB_SELECT = exports.SEMATTRS_AWS_DYNAMODB_INDEX_NAME = exports.SEMATTRS_AWS_DYNAMODB_ATTRIBUTES_TO_GET = exports.SEMATTRS_AWS_DYNAMODB_LIMIT = exports.SEMATTRS_AWS_DYNAMODB_PROJECTION = exports.SEMATTRS_AWS_DYNAMODB_CONSISTENT_READ = exports.SEMATTRS_AWS_DYNAMODB_PROVISIONED_WRITE_CAPACITY = exports.SEMATTRS_AWS_DYNAMODB_PROVISIONED_READ_CAPACITY = exports.SEMATTRS_AWS_DYNAMODB_ITEM_COLLECTION_METRICS = exports.SEMATTRS_AWS_DYNAMODB_CONSUMED_CAPACITY = exports.SEMATTRS_AWS_DYNAMODB_TABLE_NAMES = exports.SEMATTRS_HTTP_CLIENT_IP = exports.SEMATTRS_HTTP_ROUTE = exports.SEMATTRS_HTTP_SERVER_NAME = exports.SEMATTRS_HTTP_RESPONSE_CONTENT_LENGTH_UNCOMPRESSED = exports.SEMATTRS_HTTP_RESPONSE_CONTENT_LENGTH = exports.SEMATTRS_HTTP_REQUEST_CONTENT_LENGTH_UNCOMPRESSED = exports.SEMATTRS_HTTP_REQUEST_CONTENT_LENGTH = exports.SEMATTRS_HTTP_USER_AGENT = exports.SEMATTRS_HTTP_FLAVOR = exports.SEMATTRS_HTTP_STATUS_CODE = exports.SEMATTRS_HTTP_SCHEME = exports.SEMATTRS_HTTP_HOST = exports.SEMATTRS_HTTP_TARGET = exports.SEMATTRS_HTTP_URL = exports.SEMATTRS_HTTP_METHOD = exports.SEMATTRS_CODE_LINENO = exports.SEMATTRS_CODE_FILEPATH = exports.SEMATTRS_CODE_NAMESPACE = exports.SEMATTRS_CODE_FUNCTION = exports.SEMATTRS_THREAD_NAME = exports.SEMATTRS_THREAD_ID = exports.SEMATTRS_ENDUSER_SCOPE = exports.SEMATTRS_ENDUSER_ROLE = exports.SEMATTRS_ENDUSER_ID = exports.SEMATTRS_PEER_SERVICE = undefined;
  exports.DBSYSTEMVALUES_FILEMAKER = exports.DBSYSTEMVALUES_DERBY = exports.DBSYSTEMVALUES_FIREBIRD = exports.DBSYSTEMVALUES_ADABAS = exports.DBSYSTEMVALUES_CACHE = exports.DBSYSTEMVALUES_EDB = exports.DBSYSTEMVALUES_FIRSTSQL = exports.DBSYSTEMVALUES_INGRES = exports.DBSYSTEMVALUES_HANADB = exports.DBSYSTEMVALUES_MAXDB = exports.DBSYSTEMVALUES_PROGRESS = exports.DBSYSTEMVALUES_HSQLDB = exports.DBSYSTEMVALUES_CLOUDSCAPE = exports.DBSYSTEMVALUES_HIVE = exports.DBSYSTEMVALUES_REDSHIFT = exports.DBSYSTEMVALUES_POSTGRESQL = exports.DBSYSTEMVALUES_DB2 = exports.DBSYSTEMVALUES_ORACLE = exports.DBSYSTEMVALUES_MYSQL = exports.DBSYSTEMVALUES_MSSQL = exports.DBSYSTEMVALUES_OTHER_SQL = exports.SemanticAttributes = exports.SEMATTRS_MESSAGE_UNCOMPRESSED_SIZE = exports.SEMATTRS_MESSAGE_COMPRESSED_SIZE = exports.SEMATTRS_MESSAGE_ID = exports.SEMATTRS_MESSAGE_TYPE = exports.SEMATTRS_RPC_JSONRPC_ERROR_MESSAGE = exports.SEMATTRS_RPC_JSONRPC_ERROR_CODE = exports.SEMATTRS_RPC_JSONRPC_REQUEST_ID = exports.SEMATTRS_RPC_JSONRPC_VERSION = exports.SEMATTRS_RPC_GRPC_STATUS_CODE = exports.SEMATTRS_RPC_METHOD = exports.SEMATTRS_RPC_SERVICE = exports.SEMATTRS_RPC_SYSTEM = exports.SEMATTRS_MESSAGING_KAFKA_TOMBSTONE = exports.SEMATTRS_MESSAGING_KAFKA_PARTITION = exports.SEMATTRS_MESSAGING_KAFKA_CLIENT_ID = exports.SEMATTRS_MESSAGING_KAFKA_CONSUMER_GROUP = exports.SEMATTRS_MESSAGING_KAFKA_MESSAGE_KEY = exports.SEMATTRS_MESSAGING_RABBITMQ_ROUTING_KEY = exports.SEMATTRS_MESSAGING_CONSUMER_ID = exports.SEMATTRS_MESSAGING_OPERATION = exports.SEMATTRS_MESSAGING_MESSAGE_PAYLOAD_COMPRESSED_SIZE_BYTES = exports.SEMATTRS_MESSAGING_MESSAGE_PAYLOAD_SIZE_BYTES = exports.SEMATTRS_MESSAGING_CONVERSATION_ID = exports.SEMATTRS_MESSAGING_MESSAGE_ID = exports.SEMATTRS_MESSAGING_URL = exports.SEMATTRS_MESSAGING_PROTOCOL_VERSION = exports.SEMATTRS_MESSAGING_PROTOCOL = exports.SEMATTRS_MESSAGING_TEMP_DESTINATION = undefined;
  exports.FAASINVOKEDPROVIDERVALUES_ALIBABA_CLOUD = exports.FaasDocumentOperationValues = exports.FAASDOCUMENTOPERATIONVALUES_DELETE = exports.FAASDOCUMENTOPERATIONVALUES_EDIT = exports.FAASDOCUMENTOPERATIONVALUES_INSERT = exports.FaasTriggerValues = exports.FAASTRIGGERVALUES_OTHER = exports.FAASTRIGGERVALUES_TIMER = exports.FAASTRIGGERVALUES_PUBSUB = exports.FAASTRIGGERVALUES_HTTP = exports.FAASTRIGGERVALUES_DATASOURCE = exports.DbCassandraConsistencyLevelValues = exports.DBCASSANDRACONSISTENCYLEVELVALUES_LOCAL_SERIAL = exports.DBCASSANDRACONSISTENCYLEVELVALUES_SERIAL = exports.DBCASSANDRACONSISTENCYLEVELVALUES_ANY = exports.DBCASSANDRACONSISTENCYLEVELVALUES_LOCAL_ONE = exports.DBCASSANDRACONSISTENCYLEVELVALUES_THREE = exports.DBCASSANDRACONSISTENCYLEVELVALUES_TWO = exports.DBCASSANDRACONSISTENCYLEVELVALUES_ONE = exports.DBCASSANDRACONSISTENCYLEVELVALUES_LOCAL_QUORUM = exports.DBCASSANDRACONSISTENCYLEVELVALUES_QUORUM = exports.DBCASSANDRACONSISTENCYLEVELVALUES_EACH_QUORUM = exports.DBCASSANDRACONSISTENCYLEVELVALUES_ALL = exports.DbSystemValues = exports.DBSYSTEMVALUES_COCKROACHDB = exports.DBSYSTEMVALUES_MEMCACHED = exports.DBSYSTEMVALUES_ELASTICSEARCH = exports.DBSYSTEMVALUES_GEODE = exports.DBSYSTEMVALUES_NEO4J = exports.DBSYSTEMVALUES_DYNAMODB = exports.DBSYSTEMVALUES_COSMOSDB = exports.DBSYSTEMVALUES_COUCHDB = exports.DBSYSTEMVALUES_COUCHBASE = exports.DBSYSTEMVALUES_REDIS = exports.DBSYSTEMVALUES_MONGODB = exports.DBSYSTEMVALUES_HBASE = exports.DBSYSTEMVALUES_CASSANDRA = exports.DBSYSTEMVALUES_COLDFUSION = exports.DBSYSTEMVALUES_H2 = exports.DBSYSTEMVALUES_VERTICA = exports.DBSYSTEMVALUES_TERADATA = exports.DBSYSTEMVALUES_SYBASE = exports.DBSYSTEMVALUES_SQLITE = exports.DBSYSTEMVALUES_POINTBASE = exports.DBSYSTEMVALUES_PERVASIVE = exports.DBSYSTEMVALUES_NETEZZA = exports.DBSYSTEMVALUES_MARIADB = exports.DBSYSTEMVALUES_INTERBASE = exports.DBSYSTEMVALUES_INSTANTDB = exports.DBSYSTEMVALUES_INFORMIX = undefined;
  exports.MESSAGINGOPERATIONVALUES_RECEIVE = exports.MessagingDestinationKindValues = exports.MESSAGINGDESTINATIONKINDVALUES_TOPIC = exports.MESSAGINGDESTINATIONKINDVALUES_QUEUE = exports.HttpFlavorValues = exports.HTTPFLAVORVALUES_QUIC = exports.HTTPFLAVORVALUES_SPDY = exports.HTTPFLAVORVALUES_HTTP_2_0 = exports.HTTPFLAVORVALUES_HTTP_1_1 = exports.HTTPFLAVORVALUES_HTTP_1_0 = exports.NetHostConnectionSubtypeValues = exports.NETHOSTCONNECTIONSUBTYPEVALUES_LTE_CA = exports.NETHOSTCONNECTIONSUBTYPEVALUES_NRNSA = exports.NETHOSTCONNECTIONSUBTYPEVALUES_NR = exports.NETHOSTCONNECTIONSUBTYPEVALUES_IWLAN = exports.NETHOSTCONNECTIONSUBTYPEVALUES_TD_SCDMA = exports.NETHOSTCONNECTIONSUBTYPEVALUES_GSM = exports.NETHOSTCONNECTIONSUBTYPEVALUES_HSPAP = exports.NETHOSTCONNECTIONSUBTYPEVALUES_EHRPD = exports.NETHOSTCONNECTIONSUBTYPEVALUES_LTE = exports.NETHOSTCONNECTIONSUBTYPEVALUES_EVDO_B = exports.NETHOSTCONNECTIONSUBTYPEVALUES_IDEN = exports.NETHOSTCONNECTIONSUBTYPEVALUES_HSPA = exports.NETHOSTCONNECTIONSUBTYPEVALUES_HSUPA = exports.NETHOSTCONNECTIONSUBTYPEVALUES_HSDPA = exports.NETHOSTCONNECTIONSUBTYPEVALUES_CDMA2000_1XRTT = exports.NETHOSTCONNECTIONSUBTYPEVALUES_EVDO_A = exports.NETHOSTCONNECTIONSUBTYPEVALUES_EVDO_0 = exports.NETHOSTCONNECTIONSUBTYPEVALUES_CDMA = exports.NETHOSTCONNECTIONSUBTYPEVALUES_UMTS = exports.NETHOSTCONNECTIONSUBTYPEVALUES_EDGE = exports.NETHOSTCONNECTIONSUBTYPEVALUES_GPRS = exports.NetHostConnectionTypeValues = exports.NETHOSTCONNECTIONTYPEVALUES_UNKNOWN = exports.NETHOSTCONNECTIONTYPEVALUES_UNAVAILABLE = exports.NETHOSTCONNECTIONTYPEVALUES_CELL = exports.NETHOSTCONNECTIONTYPEVALUES_WIRED = exports.NETHOSTCONNECTIONTYPEVALUES_WIFI = exports.NetTransportValues = exports.NETTRANSPORTVALUES_OTHER = exports.NETTRANSPORTVALUES_INPROC = exports.NETTRANSPORTVALUES_PIPE = exports.NETTRANSPORTVALUES_UNIX = exports.NETTRANSPORTVALUES_IP = exports.NETTRANSPORTVALUES_IP_UDP = exports.NETTRANSPORTVALUES_IP_TCP = exports.FaasInvokedProviderValues = exports.FAASINVOKEDPROVIDERVALUES_GCP = exports.FAASINVOKEDPROVIDERVALUES_AZURE = exports.FAASINVOKEDPROVIDERVALUES_AWS = undefined;
  exports.MessageTypeValues = exports.MESSAGETYPEVALUES_RECEIVED = exports.MESSAGETYPEVALUES_SENT = exports.RpcGrpcStatusCodeValues = exports.RPCGRPCSTATUSCODEVALUES_UNAUTHENTICATED = exports.RPCGRPCSTATUSCODEVALUES_DATA_LOSS = exports.RPCGRPCSTATUSCODEVALUES_UNAVAILABLE = exports.RPCGRPCSTATUSCODEVALUES_INTERNAL = exports.RPCGRPCSTATUSCODEVALUES_UNIMPLEMENTED = exports.RPCGRPCSTATUSCODEVALUES_OUT_OF_RANGE = exports.RPCGRPCSTATUSCODEVALUES_ABORTED = exports.RPCGRPCSTATUSCODEVALUES_FAILED_PRECONDITION = exports.RPCGRPCSTATUSCODEVALUES_RESOURCE_EXHAUSTED = exports.RPCGRPCSTATUSCODEVALUES_PERMISSION_DENIED = exports.RPCGRPCSTATUSCODEVALUES_ALREADY_EXISTS = exports.RPCGRPCSTATUSCODEVALUES_NOT_FOUND = exports.RPCGRPCSTATUSCODEVALUES_DEADLINE_EXCEEDED = exports.RPCGRPCSTATUSCODEVALUES_INVALID_ARGUMENT = exports.RPCGRPCSTATUSCODEVALUES_UNKNOWN = exports.RPCGRPCSTATUSCODEVALUES_CANCELLED = exports.RPCGRPCSTATUSCODEVALUES_OK = exports.MessagingOperationValues = exports.MESSAGINGOPERATIONVALUES_PROCESS = undefined;
  var utils_1 = require_utils5();
  var TMP_AWS_LAMBDA_INVOKED_ARN = "aws.lambda.invoked_arn";
  var TMP_DB_SYSTEM = "db.system";
  var TMP_DB_CONNECTION_STRING = "db.connection_string";
  var TMP_DB_USER = "db.user";
  var TMP_DB_JDBC_DRIVER_CLASSNAME = "db.jdbc.driver_classname";
  var TMP_DB_NAME = "db.name";
  var TMP_DB_STATEMENT = "db.statement";
  var TMP_DB_OPERATION = "db.operation";
  var TMP_DB_MSSQL_INSTANCE_NAME = "db.mssql.instance_name";
  var TMP_DB_CASSANDRA_KEYSPACE = "db.cassandra.keyspace";
  var TMP_DB_CASSANDRA_PAGE_SIZE = "db.cassandra.page_size";
  var TMP_DB_CASSANDRA_CONSISTENCY_LEVEL = "db.cassandra.consistency_level";
  var TMP_DB_CASSANDRA_TABLE = "db.cassandra.table";
  var TMP_DB_CASSANDRA_IDEMPOTENCE = "db.cassandra.idempotence";
  var TMP_DB_CASSANDRA_SPECULATIVE_EXECUTION_COUNT = "db.cassandra.speculative_execution_count";
  var TMP_DB_CASSANDRA_COORDINATOR_ID = "db.cassandra.coordinator.id";
  var TMP_DB_CASSANDRA_COORDINATOR_DC = "db.cassandra.coordinator.dc";
  var TMP_DB_HBASE_NAMESPACE = "db.hbase.namespace";
  var TMP_DB_REDIS_DATABASE_INDEX = "db.redis.database_index";
  var TMP_DB_MONGODB_COLLECTION = "db.mongodb.collection";
  var TMP_DB_SQL_TABLE = "db.sql.table";
  var TMP_EXCEPTION_TYPE = "exception.type";
  var TMP_EXCEPTION_MESSAGE = "exception.message";
  var TMP_EXCEPTION_STACKTRACE = "exception.stacktrace";
  var TMP_EXCEPTION_ESCAPED = "exception.escaped";
  var TMP_FAAS_TRIGGER = "faas.trigger";
  var TMP_FAAS_EXECUTION = "faas.execution";
  var TMP_FAAS_DOCUMENT_COLLECTION = "faas.document.collection";
  var TMP_FAAS_DOCUMENT_OPERATION = "faas.document.operation";
  var TMP_FAAS_DOCUMENT_TIME = "faas.document.time";
  var TMP_FAAS_DOCUMENT_NAME = "faas.document.name";
  var TMP_FAAS_TIME = "faas.time";
  var TMP_FAAS_CRON = "faas.cron";
  var TMP_FAAS_COLDSTART = "faas.coldstart";
  var TMP_FAAS_INVOKED_NAME = "faas.invoked_name";
  var TMP_FAAS_INVOKED_PROVIDER = "faas.invoked_provider";
  var TMP_FAAS_INVOKED_REGION = "faas.invoked_region";
  var TMP_NET_TRANSPORT = "net.transport";
  var TMP_NET_PEER_IP = "net.peer.ip";
  var TMP_NET_PEER_PORT = "net.peer.port";
  var TMP_NET_PEER_NAME = "net.peer.name";
  var TMP_NET_HOST_IP = "net.host.ip";
  var TMP_NET_HOST_PORT = "net.host.port";
  var TMP_NET_HOST_NAME = "net.host.name";
  var TMP_NET_HOST_CONNECTION_TYPE = "net.host.connection.type";
  var TMP_NET_HOST_CONNECTION_SUBTYPE = "net.host.connection.subtype";
  var TMP_NET_HOST_CARRIER_NAME = "net.host.carrier.name";
  var TMP_NET_HOST_CARRIER_MCC = "net.host.carrier.mcc";
  var TMP_NET_HOST_CARRIER_MNC = "net.host.carrier.mnc";
  var TMP_NET_HOST_CARRIER_ICC = "net.host.carrier.icc";
  var TMP_PEER_SERVICE = "peer.service";
  var TMP_ENDUSER_ID = "enduser.id";
  var TMP_ENDUSER_ROLE = "enduser.role";
  var TMP_ENDUSER_SCOPE = "enduser.scope";
  var TMP_THREAD_ID = "thread.id";
  var TMP_THREAD_NAME = "thread.name";
  var TMP_CODE_FUNCTION = "code.function";
  var TMP_CODE_NAMESPACE = "code.namespace";
  var TMP_CODE_FILEPATH = "code.filepath";
  var TMP_CODE_LINENO = "code.lineno";
  var TMP_HTTP_METHOD = "http.method";
  var TMP_HTTP_URL = "http.url";
  var TMP_HTTP_TARGET = "http.target";
  var TMP_HTTP_HOST = "http.host";
  var TMP_HTTP_SCHEME = "http.scheme";
  var TMP_HTTP_STATUS_CODE = "http.status_code";
  var TMP_HTTP_FLAVOR = "http.flavor";
  var TMP_HTTP_USER_AGENT = "http.user_agent";
  var TMP_HTTP_REQUEST_CONTENT_LENGTH = "http.request_content_length";
  var TMP_HTTP_REQUEST_CONTENT_LENGTH_UNCOMPRESSED = "http.request_content_length_uncompressed";
  var TMP_HTTP_RESPONSE_CONTENT_LENGTH = "http.response_content_length";
  var TMP_HTTP_RESPONSE_CONTENT_LENGTH_UNCOMPRESSED = "http.response_content_length_uncompressed";
  var TMP_HTTP_SERVER_NAME = "http.server_name";
  var TMP_HTTP_ROUTE = "http.route";
  var TMP_HTTP_CLIENT_IP = "http.client_ip";
  var TMP_AWS_DYNAMODB_TABLE_NAMES = "aws.dynamodb.table_names";
  var TMP_AWS_DYNAMODB_CONSUMED_CAPACITY = "aws.dynamodb.consumed_capacity";
  var TMP_AWS_DYNAMODB_ITEM_COLLECTION_METRICS = "aws.dynamodb.item_collection_metrics";
  var TMP_AWS_DYNAMODB_PROVISIONED_READ_CAPACITY = "aws.dynamodb.provisioned_read_capacity";
  var TMP_AWS_DYNAMODB_PROVISIONED_WRITE_CAPACITY = "aws.dynamodb.provisioned_write_capacity";
  var TMP_AWS_DYNAMODB_CONSISTENT_READ = "aws.dynamodb.consistent_read";
  var TMP_AWS_DYNAMODB_PROJECTION = "aws.dynamodb.projection";
  var TMP_AWS_DYNAMODB_LIMIT = "aws.dynamodb.limit";
  var TMP_AWS_DYNAMODB_ATTRIBUTES_TO_GET = "aws.dynamodb.attributes_to_get";
  var TMP_AWS_DYNAMODB_INDEX_NAME = "aws.dynamodb.index_name";
  var TMP_AWS_DYNAMODB_SELECT = "aws.dynamodb.select";
  var TMP_AWS_DYNAMODB_GLOBAL_SECONDARY_INDEXES = "aws.dynamodb.global_secondary_indexes";
  var TMP_AWS_DYNAMODB_LOCAL_SECONDARY_INDEXES = "aws.dynamodb.local_secondary_indexes";
  var TMP_AWS_DYNAMODB_EXCLUSIVE_START_TABLE = "aws.dynamodb.exclusive_start_table";
  var TMP_AWS_DYNAMODB_TABLE_COUNT = "aws.dynamodb.table_count";
  var TMP_AWS_DYNAMODB_SCAN_FORWARD = "aws.dynamodb.scan_forward";
  var TMP_AWS_DYNAMODB_SEGMENT = "aws.dynamodb.segment";
  var TMP_AWS_DYNAMODB_TOTAL_SEGMENTS = "aws.dynamodb.total_segments";
  var TMP_AWS_DYNAMODB_COUNT = "aws.dynamodb.count";
  var TMP_AWS_DYNAMODB_SCANNED_COUNT = "aws.dynamodb.scanned_count";
  var TMP_AWS_DYNAMODB_ATTRIBUTE_DEFINITIONS = "aws.dynamodb.attribute_definitions";
  var TMP_AWS_DYNAMODB_GLOBAL_SECONDARY_INDEX_UPDATES = "aws.dynamodb.global_secondary_index_updates";
  var TMP_MESSAGING_SYSTEM = "messaging.system";
  var TMP_MESSAGING_DESTINATION = "messaging.destination";
  var TMP_MESSAGING_DESTINATION_KIND = "messaging.destination_kind";
  var TMP_MESSAGING_TEMP_DESTINATION = "messaging.temp_destination";
  var TMP_MESSAGING_PROTOCOL = "messaging.protocol";
  var TMP_MESSAGING_PROTOCOL_VERSION = "messaging.protocol_version";
  var TMP_MESSAGING_URL = "messaging.url";
  var TMP_MESSAGING_MESSAGE_ID = "messaging.message_id";
  var TMP_MESSAGING_CONVERSATION_ID = "messaging.conversation_id";
  var TMP_MESSAGING_MESSAGE_PAYLOAD_SIZE_BYTES = "messaging.message_payload_size_bytes";
  var TMP_MESSAGING_MESSAGE_PAYLOAD_COMPRESSED_SIZE_BYTES = "messaging.message_payload_compressed_size_bytes";
  var TMP_MESSAGING_OPERATION = "messaging.operation";
  var TMP_MESSAGING_CONSUMER_ID = "messaging.consumer_id";
  var TMP_MESSAGING_RABBITMQ_ROUTING_KEY = "messaging.rabbitmq.routing_key";
  var TMP_MESSAGING_KAFKA_MESSAGE_KEY = "messaging.kafka.message_key";
  var TMP_MESSAGING_KAFKA_CONSUMER_GROUP = "messaging.kafka.consumer_group";
  var TMP_MESSAGING_KAFKA_CLIENT_ID = "messaging.kafka.client_id";
  var TMP_MESSAGING_KAFKA_PARTITION = "messaging.kafka.partition";
  var TMP_MESSAGING_KAFKA_TOMBSTONE = "messaging.kafka.tombstone";
  var TMP_RPC_SYSTEM = "rpc.system";
  var TMP_RPC_SERVICE = "rpc.service";
  var TMP_RPC_METHOD = "rpc.method";
  var TMP_RPC_GRPC_STATUS_CODE = "rpc.grpc.status_code";
  var TMP_RPC_JSONRPC_VERSION = "rpc.jsonrpc.version";
  var TMP_RPC_JSONRPC_REQUEST_ID = "rpc.jsonrpc.request_id";
  var TMP_RPC_JSONRPC_ERROR_CODE = "rpc.jsonrpc.error_code";
  var TMP_RPC_JSONRPC_ERROR_MESSAGE = "rpc.jsonrpc.error_message";
  var TMP_MESSAGE_TYPE = "message.type";
  var TMP_MESSAGE_ID = "message.id";
  var TMP_MESSAGE_COMPRESSED_SIZE = "message.compressed_size";
  var TMP_MESSAGE_UNCOMPRESSED_SIZE = "message.uncompressed_size";
  exports.SEMATTRS_AWS_LAMBDA_INVOKED_ARN = TMP_AWS_LAMBDA_INVOKED_ARN;
  exports.SEMATTRS_DB_SYSTEM = TMP_DB_SYSTEM;
  exports.SEMATTRS_DB_CONNECTION_STRING = TMP_DB_CONNECTION_STRING;
  exports.SEMATTRS_DB_USER = TMP_DB_USER;
  exports.SEMATTRS_DB_JDBC_DRIVER_CLASSNAME = TMP_DB_JDBC_DRIVER_CLASSNAME;
  exports.SEMATTRS_DB_NAME = TMP_DB_NAME;
  exports.SEMATTRS_DB_STATEMENT = TMP_DB_STATEMENT;
  exports.SEMATTRS_DB_OPERATION = TMP_DB_OPERATION;
  exports.SEMATTRS_DB_MSSQL_INSTANCE_NAME = TMP_DB_MSSQL_INSTANCE_NAME;
  exports.SEMATTRS_DB_CASSANDRA_KEYSPACE = TMP_DB_CASSANDRA_KEYSPACE;
  exports.SEMATTRS_DB_CASSANDRA_PAGE_SIZE = TMP_DB_CASSANDRA_PAGE_SIZE;
  exports.SEMATTRS_DB_CASSANDRA_CONSISTENCY_LEVEL = TMP_DB_CASSANDRA_CONSISTENCY_LEVEL;
  exports.SEMATTRS_DB_CASSANDRA_TABLE = TMP_DB_CASSANDRA_TABLE;
  exports.SEMATTRS_DB_CASSANDRA_IDEMPOTENCE = TMP_DB_CASSANDRA_IDEMPOTENCE;
  exports.SEMATTRS_DB_CASSANDRA_SPECULATIVE_EXECUTION_COUNT = TMP_DB_CASSANDRA_SPECULATIVE_EXECUTION_COUNT;
  exports.SEMATTRS_DB_CASSANDRA_COORDINATOR_ID = TMP_DB_CASSANDRA_COORDINATOR_ID;
  exports.SEMATTRS_DB_CASSANDRA_COORDINATOR_DC = TMP_DB_CASSANDRA_COORDINATOR_DC;
  exports.SEMATTRS_DB_HBASE_NAMESPACE = TMP_DB_HBASE_NAMESPACE;
  exports.SEMATTRS_DB_REDIS_DATABASE_INDEX = TMP_DB_REDIS_DATABASE_INDEX;
  exports.SEMATTRS_DB_MONGODB_COLLECTION = TMP_DB_MONGODB_COLLECTION;
  exports.SEMATTRS_DB_SQL_TABLE = TMP_DB_SQL_TABLE;
  exports.SEMATTRS_EXCEPTION_TYPE = TMP_EXCEPTION_TYPE;
  exports.SEMATTRS_EXCEPTION_MESSAGE = TMP_EXCEPTION_MESSAGE;
  exports.SEMATTRS_EXCEPTION_STACKTRACE = TMP_EXCEPTION_STACKTRACE;
  exports.SEMATTRS_EXCEPTION_ESCAPED = TMP_EXCEPTION_ESCAPED;
  exports.SEMATTRS_FAAS_TRIGGER = TMP_FAAS_TRIGGER;
  exports.SEMATTRS_FAAS_EXECUTION = TMP_FAAS_EXECUTION;
  exports.SEMATTRS_FAAS_DOCUMENT_COLLECTION = TMP_FAAS_DOCUMENT_COLLECTION;
  exports.SEMATTRS_FAAS_DOCUMENT_OPERATION = TMP_FAAS_DOCUMENT_OPERATION;
  exports.SEMATTRS_FAAS_DOCUMENT_TIME = TMP_FAAS_DOCUMENT_TIME;
  exports.SEMATTRS_FAAS_DOCUMENT_NAME = TMP_FAAS_DOCUMENT_NAME;
  exports.SEMATTRS_FAAS_TIME = TMP_FAAS_TIME;
  exports.SEMATTRS_FAAS_CRON = TMP_FAAS_CRON;
  exports.SEMATTRS_FAAS_COLDSTART = TMP_FAAS_COLDSTART;
  exports.SEMATTRS_FAAS_INVOKED_NAME = TMP_FAAS_INVOKED_NAME;
  exports.SEMATTRS_FAAS_INVOKED_PROVIDER = TMP_FAAS_INVOKED_PROVIDER;
  exports.SEMATTRS_FAAS_INVOKED_REGION = TMP_FAAS_INVOKED_REGION;
  exports.SEMATTRS_NET_TRANSPORT = TMP_NET_TRANSPORT;
  exports.SEMATTRS_NET_PEER_IP = TMP_NET_PEER_IP;
  exports.SEMATTRS_NET_PEER_PORT = TMP_NET_PEER_PORT;
  exports.SEMATTRS_NET_PEER_NAME = TMP_NET_PEER_NAME;
  exports.SEMATTRS_NET_HOST_IP = TMP_NET_HOST_IP;
  exports.SEMATTRS_NET_HOST_PORT = TMP_NET_HOST_PORT;
  exports.SEMATTRS_NET_HOST_NAME = TMP_NET_HOST_NAME;
  exports.SEMATTRS_NET_HOST_CONNECTION_TYPE = TMP_NET_HOST_CONNECTION_TYPE;
  exports.SEMATTRS_NET_HOST_CONNECTION_SUBTYPE = TMP_NET_HOST_CONNECTION_SUBTYPE;
  exports.SEMATTRS_NET_HOST_CARRIER_NAME = TMP_NET_HOST_CARRIER_NAME;
  exports.SEMATTRS_NET_HOST_CARRIER_MCC = TMP_NET_HOST_CARRIER_MCC;
  exports.SEMATTRS_NET_HOST_CARRIER_MNC = TMP_NET_HOST_CARRIER_MNC;
  exports.SEMATTRS_NET_HOST_CARRIER_ICC = TMP_NET_HOST_CARRIER_ICC;
  exports.SEMATTRS_PEER_SERVICE = TMP_PEER_SERVICE;
  exports.SEMATTRS_ENDUSER_ID = TMP_ENDUSER_ID;
  exports.SEMATTRS_ENDUSER_ROLE = TMP_ENDUSER_ROLE;
  exports.SEMATTRS_ENDUSER_SCOPE = TMP_ENDUSER_SCOPE;
  exports.SEMATTRS_THREAD_ID = TMP_THREAD_ID;
  exports.SEMATTRS_THREAD_NAME = TMP_THREAD_NAME;
  exports.SEMATTRS_CODE_FUNCTION = TMP_CODE_FUNCTION;
  exports.SEMATTRS_CODE_NAMESPACE = TMP_CODE_NAMESPACE;
  exports.SEMATTRS_CODE_FILEPATH = TMP_CODE_FILEPATH;
  exports.SEMATTRS_CODE_LINENO = TMP_CODE_LINENO;
  exports.SEMATTRS_HTTP_METHOD = TMP_HTTP_METHOD;
  exports.SEMATTRS_HTTP_URL = TMP_HTTP_URL;
  exports.SEMATTRS_HTTP_TARGET = TMP_HTTP_TARGET;
  exports.SEMATTRS_HTTP_HOST = TMP_HTTP_HOST;
  exports.SEMATTRS_HTTP_SCHEME = TMP_HTTP_SCHEME;
  exports.SEMATTRS_HTTP_STATUS_CODE = TMP_HTTP_STATUS_CODE;
  exports.SEMATTRS_HTTP_FLAVOR = TMP_HTTP_FLAVOR;
  exports.SEMATTRS_HTTP_USER_AGENT = TMP_HTTP_USER_AGENT;
  exports.SEMATTRS_HTTP_REQUEST_CONTENT_LENGTH = TMP_HTTP_REQUEST_CONTENT_LENGTH;
  exports.SEMATTRS_HTTP_REQUEST_CONTENT_LENGTH_UNCOMPRESSED = TMP_HTTP_REQUEST_CONTENT_LENGTH_UNCOMPRESSED;
  exports.SEMATTRS_HTTP_RESPONSE_CONTENT_LENGTH = TMP_HTTP_RESPONSE_CONTENT_LENGTH;
  exports.SEMATTRS_HTTP_RESPONSE_CONTENT_LENGTH_UNCOMPRESSED = TMP_HTTP_RESPONSE_CONTENT_LENGTH_UNCOMPRESSED;
  exports.SEMATTRS_HTTP_SERVER_NAME = TMP_HTTP_SERVER_NAME;
  exports.SEMATTRS_HTTP_ROUTE = TMP_HTTP_ROUTE;
  exports.SEMATTRS_HTTP_CLIENT_IP = TMP_HTTP_CLIENT_IP;
  exports.SEMATTRS_AWS_DYNAMODB_TABLE_NAMES = TMP_AWS_DYNAMODB_TABLE_NAMES;
  exports.SEMATTRS_AWS_DYNAMODB_CONSUMED_CAPACITY = TMP_AWS_DYNAMODB_CONSUMED_CAPACITY;
  exports.SEMATTRS_AWS_DYNAMODB_ITEM_COLLECTION_METRICS = TMP_AWS_DYNAMODB_ITEM_COLLECTION_METRICS;
  exports.SEMATTRS_AWS_DYNAMODB_PROVISIONED_READ_CAPACITY = TMP_AWS_DYNAMODB_PROVISIONED_READ_CAPACITY;
  exports.SEMATTRS_AWS_DYNAMODB_PROVISIONED_WRITE_CAPACITY = TMP_AWS_DYNAMODB_PROVISIONED_WRITE_CAPACITY;
  exports.SEMATTRS_AWS_DYNAMODB_CONSISTENT_READ = TMP_AWS_DYNAMODB_CONSISTENT_READ;
  exports.SEMATTRS_AWS_DYNAMODB_PROJECTION = TMP_AWS_DYNAMODB_PROJECTION;
  exports.SEMATTRS_AWS_DYNAMODB_LIMIT = TMP_AWS_DYNAMODB_LIMIT;
  exports.SEMATTRS_AWS_DYNAMODB_ATTRIBUTES_TO_GET = TMP_AWS_DYNAMODB_ATTRIBUTES_TO_GET;
  exports.SEMATTRS_AWS_DYNAMODB_INDEX_NAME = TMP_AWS_DYNAMODB_INDEX_NAME;
  exports.SEMATTRS_AWS_DYNAMODB_SELECT = TMP_AWS_DYNAMODB_SELECT;
  exports.SEMATTRS_AWS_DYNAMODB_GLOBAL_SECONDARY_INDEXES = TMP_AWS_DYNAMODB_GLOBAL_SECONDARY_INDEXES;
  exports.SEMATTRS_AWS_DYNAMODB_LOCAL_SECONDARY_INDEXES = TMP_AWS_DYNAMODB_LOCAL_SECONDARY_INDEXES;
  exports.SEMATTRS_AWS_DYNAMODB_EXCLUSIVE_START_TABLE = TMP_AWS_DYNAMODB_EXCLUSIVE_START_TABLE;
  exports.SEMATTRS_AWS_DYNAMODB_TABLE_COUNT = TMP_AWS_DYNAMODB_TABLE_COUNT;
  exports.SEMATTRS_AWS_DYNAMODB_SCAN_FORWARD = TMP_AWS_DYNAMODB_SCAN_FORWARD;
  exports.SEMATTRS_AWS_DYNAMODB_SEGMENT = TMP_AWS_DYNAMODB_SEGMENT;
  exports.SEMATTRS_AWS_DYNAMODB_TOTAL_SEGMENTS = TMP_AWS_DYNAMODB_TOTAL_SEGMENTS;
  exports.SEMATTRS_AWS_DYNAMODB_COUNT = TMP_AWS_DYNAMODB_COUNT;
  exports.SEMATTRS_AWS_DYNAMODB_SCANNED_COUNT = TMP_AWS_DYNAMODB_SCANNED_COUNT;
  exports.SEMATTRS_AWS_DYNAMODB_ATTRIBUTE_DEFINITIONS = TMP_AWS_DYNAMODB_ATTRIBUTE_DEFINITIONS;
  exports.SEMATTRS_AWS_DYNAMODB_GLOBAL_SECONDARY_INDEX_UPDATES = TMP_AWS_DYNAMODB_GLOBAL_SECONDARY_INDEX_UPDATES;
  exports.SEMATTRS_MESSAGING_SYSTEM = TMP_MESSAGING_SYSTEM;
  exports.SEMATTRS_MESSAGING_DESTINATION = TMP_MESSAGING_DESTINATION;
  exports.SEMATTRS_MESSAGING_DESTINATION_KIND = TMP_MESSAGING_DESTINATION_KIND;
  exports.SEMATTRS_MESSAGING_TEMP_DESTINATION = TMP_MESSAGING_TEMP_DESTINATION;
  exports.SEMATTRS_MESSAGING_PROTOCOL = TMP_MESSAGING_PROTOCOL;
  exports.SEMATTRS_MESSAGING_PROTOCOL_VERSION = TMP_MESSAGING_PROTOCOL_VERSION;
  exports.SEMATTRS_MESSAGING_URL = TMP_MESSAGING_URL;
  exports.SEMATTRS_MESSAGING_MESSAGE_ID = TMP_MESSAGING_MESSAGE_ID;
  exports.SEMATTRS_MESSAGING_CONVERSATION_ID = TMP_MESSAGING_CONVERSATION_ID;
  exports.SEMATTRS_MESSAGING_MESSAGE_PAYLOAD_SIZE_BYTES = TMP_MESSAGING_MESSAGE_PAYLOAD_SIZE_BYTES;
  exports.SEMATTRS_MESSAGING_MESSAGE_PAYLOAD_COMPRESSED_SIZE_BYTES = TMP_MESSAGING_MESSAGE_PAYLOAD_COMPRESSED_SIZE_BYTES;
  exports.SEMATTRS_MESSAGING_OPERATION = TMP_MESSAGING_OPERATION;
  exports.SEMATTRS_MESSAGING_CONSUMER_ID = TMP_MESSAGING_CONSUMER_ID;
  exports.SEMATTRS_MESSAGING_RABBITMQ_ROUTING_KEY = TMP_MESSAGING_RABBITMQ_ROUTING_KEY;
  exports.SEMATTRS_MESSAGING_KAFKA_MESSAGE_KEY = TMP_MESSAGING_KAFKA_MESSAGE_KEY;
  exports.SEMATTRS_MESSAGING_KAFKA_CONSUMER_GROUP = TMP_MESSAGING_KAFKA_CONSUMER_GROUP;
  exports.SEMATTRS_MESSAGING_KAFKA_CLIENT_ID = TMP_MESSAGING_KAFKA_CLIENT_ID;
  exports.SEMATTRS_MESSAGING_KAFKA_PARTITION = TMP_MESSAGING_KAFKA_PARTITION;
  exports.SEMATTRS_MESSAGING_KAFKA_TOMBSTONE = TMP_MESSAGING_KAFKA_TOMBSTONE;
  exports.SEMATTRS_RPC_SYSTEM = TMP_RPC_SYSTEM;
  exports.SEMATTRS_RPC_SERVICE = TMP_RPC_SERVICE;
  exports.SEMATTRS_RPC_METHOD = TMP_RPC_METHOD;
  exports.SEMATTRS_RPC_GRPC_STATUS_CODE = TMP_RPC_GRPC_STATUS_CODE;
  exports.SEMATTRS_RPC_JSONRPC_VERSION = TMP_RPC_JSONRPC_VERSION;
  exports.SEMATTRS_RPC_JSONRPC_REQUEST_ID = TMP_RPC_JSONRPC_REQUEST_ID;
  exports.SEMATTRS_RPC_JSONRPC_ERROR_CODE = TMP_RPC_JSONRPC_ERROR_CODE;
  exports.SEMATTRS_RPC_JSONRPC_ERROR_MESSAGE = TMP_RPC_JSONRPC_ERROR_MESSAGE;
  exports.SEMATTRS_MESSAGE_TYPE = TMP_MESSAGE_TYPE;
  exports.SEMATTRS_MESSAGE_ID = TMP_MESSAGE_ID;
  exports.SEMATTRS_MESSAGE_COMPRESSED_SIZE = TMP_MESSAGE_COMPRESSED_SIZE;
  exports.SEMATTRS_MESSAGE_UNCOMPRESSED_SIZE = TMP_MESSAGE_UNCOMPRESSED_SIZE;
  exports.SemanticAttributes = /* @__PURE__ */ (0, utils_1.createConstMap)([
    TMP_AWS_LAMBDA_INVOKED_ARN,
    TMP_DB_SYSTEM,
    TMP_DB_CONNECTION_STRING,
    TMP_DB_USER,
    TMP_DB_JDBC_DRIVER_CLASSNAME,
    TMP_DB_NAME,
    TMP_DB_STATEMENT,
    TMP_DB_OPERATION,
    TMP_DB_MSSQL_INSTANCE_NAME,
    TMP_DB_CASSANDRA_KEYSPACE,
    TMP_DB_CASSANDRA_PAGE_SIZE,
    TMP_DB_CASSANDRA_CONSISTENCY_LEVEL,
    TMP_DB_CASSANDRA_TABLE,
    TMP_DB_CASSANDRA_IDEMPOTENCE,
    TMP_DB_CASSANDRA_SPECULATIVE_EXECUTION_COUNT,
    TMP_DB_CASSANDRA_COORDINATOR_ID,
    TMP_DB_CASSANDRA_COORDINATOR_DC,
    TMP_DB_HBASE_NAMESPACE,
    TMP_DB_REDIS_DATABASE_INDEX,
    TMP_DB_MONGODB_COLLECTION,
    TMP_DB_SQL_TABLE,
    TMP_EXCEPTION_TYPE,
    TMP_EXCEPTION_MESSAGE,
    TMP_EXCEPTION_STACKTRACE,
    TMP_EXCEPTION_ESCAPED,
    TMP_FAAS_TRIGGER,
    TMP_FAAS_EXECUTION,
    TMP_FAAS_DOCUMENT_COLLECTION,
    TMP_FAAS_DOCUMENT_OPERATION,
    TMP_FAAS_DOCUMENT_TIME,
    TMP_FAAS_DOCUMENT_NAME,
    TMP_FAAS_TIME,
    TMP_FAAS_CRON,
    TMP_FAAS_COLDSTART,
    TMP_FAAS_INVOKED_NAME,
    TMP_FAAS_INVOKED_PROVIDER,
    TMP_FAAS_INVOKED_REGION,
    TMP_NET_TRANSPORT,
    TMP_NET_PEER_IP,
    TMP_NET_PEER_PORT,
    TMP_NET_PEER_NAME,
    TMP_NET_HOST_IP,
    TMP_NET_HOST_PORT,
    TMP_NET_HOST_NAME,
    TMP_NET_HOST_CONNECTION_TYPE,
    TMP_NET_HOST_CONNECTION_SUBTYPE,
    TMP_NET_HOST_CARRIER_NAME,
    TMP_NET_HOST_CARRIER_MCC,
    TMP_NET_HOST_CARRIER_MNC,
    TMP_NET_HOST_CARRIER_ICC,
    TMP_PEER_SERVICE,
    TMP_ENDUSER_ID,
    TMP_ENDUSER_ROLE,
    TMP_ENDUSER_SCOPE,
    TMP_THREAD_ID,
    TMP_THREAD_NAME,
    TMP_CODE_FUNCTION,
    TMP_CODE_NAMESPACE,
    TMP_CODE_FILEPATH,
    TMP_CODE_LINENO,
    TMP_HTTP_METHOD,
    TMP_HTTP_URL,
    TMP_HTTP_TARGET,
    TMP_HTTP_HOST,
    TMP_HTTP_SCHEME,
    TMP_HTTP_STATUS_CODE,
    TMP_HTTP_FLAVOR,
    TMP_HTTP_USER_AGENT,
    TMP_HTTP_REQUEST_CONTENT_LENGTH,
    TMP_HTTP_REQUEST_CONTENT_LENGTH_UNCOMPRESSED,
    TMP_HTTP_RESPONSE_CONTENT_LENGTH,
    TMP_HTTP_RESPONSE_CONTENT_LENGTH_UNCOMPRESSED,
    TMP_HTTP_SERVER_NAME,
    TMP_HTTP_ROUTE,
    TMP_HTTP_CLIENT_IP,
    TMP_AWS_DYNAMODB_TABLE_NAMES,
    TMP_AWS_DYNAMODB_CONSUMED_CAPACITY,
    TMP_AWS_DYNAMODB_ITEM_COLLECTION_METRICS,
    TMP_AWS_DYNAMODB_PROVISIONED_READ_CAPACITY,
    TMP_AWS_DYNAMODB_PROVISIONED_WRITE_CAPACITY,
    TMP_AWS_DYNAMODB_CONSISTENT_READ,
    TMP_AWS_DYNAMODB_PROJECTION,
    TMP_AWS_DYNAMODB_LIMIT,
    TMP_AWS_DYNAMODB_ATTRIBUTES_TO_GET,
    TMP_AWS_DYNAMODB_INDEX_NAME,
    TMP_AWS_DYNAMODB_SELECT,
    TMP_AWS_DYNAMODB_GLOBAL_SECONDARY_INDEXES,
    TMP_AWS_DYNAMODB_LOCAL_SECONDARY_INDEXES,
    TMP_AWS_DYNAMODB_EXCLUSIVE_START_TABLE,
    TMP_AWS_DYNAMODB_TABLE_COUNT,
    TMP_AWS_DYNAMODB_SCAN_FORWARD,
    TMP_AWS_DYNAMODB_SEGMENT,
    TMP_AWS_DYNAMODB_TOTAL_SEGMENTS,
    TMP_AWS_DYNAMODB_COUNT,
    TMP_AWS_DYNAMODB_SCANNED_COUNT,
    TMP_AWS_DYNAMODB_ATTRIBUTE_DEFINITIONS,
    TMP_AWS_DYNAMODB_GLOBAL_SECONDARY_INDEX_UPDATES,
    TMP_MESSAGING_SYSTEM,
    TMP_MESSAGING_DESTINATION,
    TMP_MESSAGING_DESTINATION_KIND,
    TMP_MESSAGING_TEMP_DESTINATION,
    TMP_MESSAGING_PROTOCOL,
    TMP_MESSAGING_PROTOCOL_VERSION,
    TMP_MESSAGING_URL,
    TMP_MESSAGING_MESSAGE_ID,
    TMP_MESSAGING_CONVERSATION_ID,
    TMP_MESSAGING_MESSAGE_PAYLOAD_SIZE_BYTES,
    TMP_MESSAGING_MESSAGE_PAYLOAD_COMPRESSED_SIZE_BYTES,
    TMP_MESSAGING_OPERATION,
    TMP_MESSAGING_CONSUMER_ID,
    TMP_MESSAGING_RABBITMQ_ROUTING_KEY,
    TMP_MESSAGING_KAFKA_MESSAGE_KEY,
    TMP_MESSAGING_KAFKA_CONSUMER_GROUP,
    TMP_MESSAGING_KAFKA_CLIENT_ID,
    TMP_MESSAGING_KAFKA_PARTITION,
    TMP_MESSAGING_KAFKA_TOMBSTONE,
    TMP_RPC_SYSTEM,
    TMP_RPC_SERVICE,
    TMP_RPC_METHOD,
    TMP_RPC_GRPC_STATUS_CODE,
    TMP_RPC_JSONRPC_VERSION,
    TMP_RPC_JSONRPC_REQUEST_ID,
    TMP_RPC_JSONRPC_ERROR_CODE,
    TMP_RPC_JSONRPC_ERROR_MESSAGE,
    TMP_MESSAGE_TYPE,
    TMP_MESSAGE_ID,
    TMP_MESSAGE_COMPRESSED_SIZE,
    TMP_MESSAGE_UNCOMPRESSED_SIZE
  ]);
  var TMP_DBSYSTEMVALUES_OTHER_SQL = "other_sql";
  var TMP_DBSYSTEMVALUES_MSSQL = "mssql";
  var TMP_DBSYSTEMVALUES_MYSQL = "mysql";
  var TMP_DBSYSTEMVALUES_ORACLE = "oracle";
  var TMP_DBSYSTEMVALUES_DB2 = "db2";
  var TMP_DBSYSTEMVALUES_POSTGRESQL = "postgresql";
  var TMP_DBSYSTEMVALUES_REDSHIFT = "redshift";
  var TMP_DBSYSTEMVALUES_HIVE = "hive";
  var TMP_DBSYSTEMVALUES_CLOUDSCAPE = "cloudscape";
  var TMP_DBSYSTEMVALUES_HSQLDB = "hsqldb";
  var TMP_DBSYSTEMVALUES_PROGRESS = "progress";
  var TMP_DBSYSTEMVALUES_MAXDB = "maxdb";
  var TMP_DBSYSTEMVALUES_HANADB = "hanadb";
  var TMP_DBSYSTEMVALUES_INGRES = "ingres";
  var TMP_DBSYSTEMVALUES_FIRSTSQL = "firstsql";
  var TMP_DBSYSTEMVALUES_EDB = "edb";
  var TMP_DBSYSTEMVALUES_CACHE = "cache";
  var TMP_DBSYSTEMVALUES_ADABAS = "adabas";
  var TMP_DBSYSTEMVALUES_FIREBIRD = "firebird";
  var TMP_DBSYSTEMVALUES_DERBY = "derby";
  var TMP_DBSYSTEMVALUES_FILEMAKER = "filemaker";
  var TMP_DBSYSTEMVALUES_INFORMIX = "informix";
  var TMP_DBSYSTEMVALUES_INSTANTDB = "instantdb";
  var TMP_DBSYSTEMVALUES_INTERBASE = "interbase";
  var TMP_DBSYSTEMVALUES_MARIADB = "mariadb";
  var TMP_DBSYSTEMVALUES_NETEZZA = "netezza";
  var TMP_DBSYSTEMVALUES_PERVASIVE = "pervasive";
  var TMP_DBSYSTEMVALUES_POINTBASE = "pointbase";
  var TMP_DBSYSTEMVALUES_SQLITE = "sqlite";
  var TMP_DBSYSTEMVALUES_SYBASE = "sybase";
  var TMP_DBSYSTEMVALUES_TERADATA = "teradata";
  var TMP_DBSYSTEMVALUES_VERTICA = "vertica";
  var TMP_DBSYSTEMVALUES_H2 = "h2";
  var TMP_DBSYSTEMVALUES_COLDFUSION = "coldfusion";
  var TMP_DBSYSTEMVALUES_CASSANDRA = "cassandra";
  var TMP_DBSYSTEMVALUES_HBASE = "hbase";
  var TMP_DBSYSTEMVALUES_MONGODB = "mongodb";
  var TMP_DBSYSTEMVALUES_REDIS = "redis";
  var TMP_DBSYSTEMVALUES_COUCHBASE = "couchbase";
  var TMP_DBSYSTEMVALUES_COUCHDB = "couchdb";
  var TMP_DBSYSTEMVALUES_COSMOSDB = "cosmosdb";
  var TMP_DBSYSTEMVALUES_DYNAMODB = "dynamodb";
  var TMP_DBSYSTEMVALUES_NEO4J = "neo4j";
  var TMP_DBSYSTEMVALUES_GEODE = "geode";
  var TMP_DBSYSTEMVALUES_ELASTICSEARCH = "elasticsearch";
  var TMP_DBSYSTEMVALUES_MEMCACHED = "memcached";
  var TMP_DBSYSTEMVALUES_COCKROACHDB = "cockroachdb";
  exports.DBSYSTEMVALUES_OTHER_SQL = TMP_DBSYSTEMVALUES_OTHER_SQL;
  exports.DBSYSTEMVALUES_MSSQL = TMP_DBSYSTEMVALUES_MSSQL;
  exports.DBSYSTEMVALUES_MYSQL = TMP_DBSYSTEMVALUES_MYSQL;
  exports.DBSYSTEMVALUES_ORACLE = TMP_DBSYSTEMVALUES_ORACLE;
  exports.DBSYSTEMVALUES_DB2 = TMP_DBSYSTEMVALUES_DB2;
  exports.DBSYSTEMVALUES_POSTGRESQL = TMP_DBSYSTEMVALUES_POSTGRESQL;
  exports.DBSYSTEMVALUES_REDSHIFT = TMP_DBSYSTEMVALUES_REDSHIFT;
  exports.DBSYSTEMVALUES_HIVE = TMP_DBSYSTEMVALUES_HIVE;
  exports.DBSYSTEMVALUES_CLOUDSCAPE = TMP_DBSYSTEMVALUES_CLOUDSCAPE;
  exports.DBSYSTEMVALUES_HSQLDB = TMP_DBSYSTEMVALUES_HSQLDB;
  exports.DBSYSTEMVALUES_PROGRESS = TMP_DBSYSTEMVALUES_PROGRESS;
  exports.DBSYSTEMVALUES_MAXDB = TMP_DBSYSTEMVALUES_MAXDB;
  exports.DBSYSTEMVALUES_HANADB = TMP_DBSYSTEMVALUES_HANADB;
  exports.DBSYSTEMVALUES_INGRES = TMP_DBSYSTEMVALUES_INGRES;
  exports.DBSYSTEMVALUES_FIRSTSQL = TMP_DBSYSTEMVALUES_FIRSTSQL;
  exports.DBSYSTEMVALUES_EDB = TMP_DBSYSTEMVALUES_EDB;
  exports.DBSYSTEMVALUES_CACHE = TMP_DBSYSTEMVALUES_CACHE;
  exports.DBSYSTEMVALUES_ADABAS = TMP_DBSYSTEMVALUES_ADABAS;
  exports.DBSYSTEMVALUES_FIREBIRD = TMP_DBSYSTEMVALUES_FIREBIRD;
  exports.DBSYSTEMVALUES_DERBY = TMP_DBSYSTEMVALUES_DERBY;
  exports.DBSYSTEMVALUES_FILEMAKER = TMP_DBSYSTEMVALUES_FILEMAKER;
  exports.DBSYSTEMVALUES_INFORMIX = TMP_DBSYSTEMVALUES_INFORMIX;
  exports.DBSYSTEMVALUES_INSTANTDB = TMP_DBSYSTEMVALUES_INSTANTDB;
  exports.DBSYSTEMVALUES_INTERBASE = TMP_DBSYSTEMVALUES_INTERBASE;
  exports.DBSYSTEMVALUES_MARIADB = TMP_DBSYSTEMVALUES_MARIADB;
  exports.DBSYSTEMVALUES_NETEZZA = TMP_DBSYSTEMVALUES_NETEZZA;
  exports.DBSYSTEMVALUES_PERVASIVE = TMP_DBSYSTEMVALUES_PERVASIVE;
  exports.DBSYSTEMVALUES_POINTBASE = TMP_DBSYSTEMVALUES_POINTBASE;
  exports.DBSYSTEMVALUES_SQLITE = TMP_DBSYSTEMVALUES_SQLITE;
  exports.DBSYSTEMVALUES_SYBASE = TMP_DBSYSTEMVALUES_SYBASE;
  exports.DBSYSTEMVALUES_TERADATA = TMP_DBSYSTEMVALUES_TERADATA;
  exports.DBSYSTEMVALUES_VERTICA = TMP_DBSYSTEMVALUES_VERTICA;
  exports.DBSYSTEMVALUES_H2 = TMP_DBSYSTEMVALUES_H2;
  exports.DBSYSTEMVALUES_COLDFUSION = TMP_DBSYSTEMVALUES_COLDFUSION;
  exports.DBSYSTEMVALUES_CASSANDRA = TMP_DBSYSTEMVALUES_CASSANDRA;
  exports.DBSYSTEMVALUES_HBASE = TMP_DBSYSTEMVALUES_HBASE;
  exports.DBSYSTEMVALUES_MONGODB = TMP_DBSYSTEMVALUES_MONGODB;
  exports.DBSYSTEMVALUES_REDIS = TMP_DBSYSTEMVALUES_REDIS;
  exports.DBSYSTEMVALUES_COUCHBASE = TMP_DBSYSTEMVALUES_COUCHBASE;
  exports.DBSYSTEMVALUES_COUCHDB = TMP_DBSYSTEMVALUES_COUCHDB;
  exports.DBSYSTEMVALUES_COSMOSDB = TMP_DBSYSTEMVALUES_COSMOSDB;
  exports.DBSYSTEMVALUES_DYNAMODB = TMP_DBSYSTEMVALUES_DYNAMODB;
  exports.DBSYSTEMVALUES_NEO4J = TMP_DBSYSTEMVALUES_NEO4J;
  exports.DBSYSTEMVALUES_GEODE = TMP_DBSYSTEMVALUES_GEODE;
  exports.DBSYSTEMVALUES_ELASTICSEARCH = TMP_DBSYSTEMVALUES_ELASTICSEARCH;
  exports.DBSYSTEMVALUES_MEMCACHED = TMP_DBSYSTEMVALUES_MEMCACHED;
  exports.DBSYSTEMVALUES_COCKROACHDB = TMP_DBSYSTEMVALUES_COCKROACHDB;
  exports.DbSystemValues = /* @__PURE__ */ (0, utils_1.createConstMap)([
    TMP_DBSYSTEMVALUES_OTHER_SQL,
    TMP_DBSYSTEMVALUES_MSSQL,
    TMP_DBSYSTEMVALUES_MYSQL,
    TMP_DBSYSTEMVALUES_ORACLE,
    TMP_DBSYSTEMVALUES_DB2,
    TMP_DBSYSTEMVALUES_POSTGRESQL,
    TMP_DBSYSTEMVALUES_REDSHIFT,
    TMP_DBSYSTEMVALUES_HIVE,
    TMP_DBSYSTEMVALUES_CLOUDSCAPE,
    TMP_DBSYSTEMVALUES_HSQLDB,
    TMP_DBSYSTEMVALUES_PROGRESS,
    TMP_DBSYSTEMVALUES_MAXDB,
    TMP_DBSYSTEMVALUES_HANADB,
    TMP_DBSYSTEMVALUES_INGRES,
    TMP_DBSYSTEMVALUES_FIRSTSQL,
    TMP_DBSYSTEMVALUES_EDB,
    TMP_DBSYSTEMVALUES_CACHE,
    TMP_DBSYSTEMVALUES_ADABAS,
    TMP_DBSYSTEMVALUES_FIREBIRD,
    TMP_DBSYSTEMVALUES_DERBY,
    TMP_DBSYSTEMVALUES_FILEMAKER,
    TMP_DBSYSTEMVALUES_INFORMIX,
    TMP_DBSYSTEMVALUES_INSTANTDB,
    TMP_DBSYSTEMVALUES_INTERBASE,
    TMP_DBSYSTEMVALUES_MARIADB,
    TMP_DBSYSTEMVALUES_NETEZZA,
    TMP_DBSYSTEMVALUES_PERVASIVE,
    TMP_DBSYSTEMVALUES_POINTBASE,
    TMP_DBSYSTEMVALUES_SQLITE,
    TMP_DBSYSTEMVALUES_SYBASE,
    TMP_DBSYSTEMVALUES_TERADATA,
    TMP_DBSYSTEMVALUES_VERTICA,
    TMP_DBSYSTEMVALUES_H2,
    TMP_DBSYSTEMVALUES_COLDFUSION,
    TMP_DBSYSTEMVALUES_CASSANDRA,
    TMP_DBSYSTEMVALUES_HBASE,
    TMP_DBSYSTEMVALUES_MONGODB,
    TMP_DBSYSTEMVALUES_REDIS,
    TMP_DBSYSTEMVALUES_COUCHBASE,
    TMP_DBSYSTEMVALUES_COUCHDB,
    TMP_DBSYSTEMVALUES_COSMOSDB,
    TMP_DBSYSTEMVALUES_DYNAMODB,
    TMP_DBSYSTEMVALUES_NEO4J,
    TMP_DBSYSTEMVALUES_GEODE,
    TMP_DBSYSTEMVALUES_ELASTICSEARCH,
    TMP_DBSYSTEMVALUES_MEMCACHED,
    TMP_DBSYSTEMVALUES_COCKROACHDB
  ]);
  var TMP_DBCASSANDRACONSISTENCYLEVELVALUES_ALL = "all";
  var TMP_DBCASSANDRACONSISTENCYLEVELVALUES_EACH_QUORUM = "each_quorum";
  var TMP_DBCASSANDRACONSISTENCYLEVELVALUES_QUORUM = "quorum";
  var TMP_DBCASSANDRACONSISTENCYLEVELVALUES_LOCAL_QUORUM = "local_quorum";
  var TMP_DBCASSANDRACONSISTENCYLEVELVALUES_ONE = "one";
  var TMP_DBCASSANDRACONSISTENCYLEVELVALUES_TWO = "two";
  var TMP_DBCASSANDRACONSISTENCYLEVELVALUES_THREE = "three";
  var TMP_DBCASSANDRACONSISTENCYLEVELVALUES_LOCAL_ONE = "local_one";
  var TMP_DBCASSANDRACONSISTENCYLEVELVALUES_ANY = "any";
  var TMP_DBCASSANDRACONSISTENCYLEVELVALUES_SERIAL = "serial";
  var TMP_DBCASSANDRACONSISTENCYLEVELVALUES_LOCAL_SERIAL = "local_serial";
  exports.DBCASSANDRACONSISTENCYLEVELVALUES_ALL = TMP_DBCASSANDRACONSISTENCYLEVELVALUES_ALL;
  exports.DBCASSANDRACONSISTENCYLEVELVALUES_EACH_QUORUM = TMP_DBCASSANDRACONSISTENCYLEVELVALUES_EACH_QUORUM;
  exports.DBCASSANDRACONSISTENCYLEVELVALUES_QUORUM = TMP_DBCASSANDRACONSISTENCYLEVELVALUES_QUORUM;
  exports.DBCASSANDRACONSISTENCYLEVELVALUES_LOCAL_QUORUM = TMP_DBCASSANDRACONSISTENCYLEVELVALUES_LOCAL_QUORUM;
  exports.DBCASSANDRACONSISTENCYLEVELVALUES_ONE = TMP_DBCASSANDRACONSISTENCYLEVELVALUES_ONE;
  exports.DBCASSANDRACONSISTENCYLEVELVALUES_TWO = TMP_DBCASSANDRACONSISTENCYLEVELVALUES_TWO;
  exports.DBCASSANDRACONSISTENCYLEVELVALUES_THREE = TMP_DBCASSANDRACONSISTENCYLEVELVALUES_THREE;
  exports.DBCASSANDRACONSISTENCYLEVELVALUES_LOCAL_ONE = TMP_DBCASSANDRACONSISTENCYLEVELVALUES_LOCAL_ONE;
  exports.DBCASSANDRACONSISTENCYLEVELVALUES_ANY = TMP_DBCASSANDRACONSISTENCYLEVELVALUES_ANY;
  exports.DBCASSANDRACONSISTENCYLEVELVALUES_SERIAL = TMP_DBCASSANDRACONSISTENCYLEVELVALUES_SERIAL;
  exports.DBCASSANDRACONSISTENCYLEVELVALUES_LOCAL_SERIAL = TMP_DBCASSANDRACONSISTENCYLEVELVALUES_LOCAL_SERIAL;
  exports.DbCassandraConsistencyLevelValues = /* @__PURE__ */ (0, utils_1.createConstMap)([
    TMP_DBCASSANDRACONSISTENCYLEVELVALUES_ALL,
    TMP_DBCASSANDRACONSISTENCYLEVELVALUES_EACH_QUORUM,
    TMP_DBCASSANDRACONSISTENCYLEVELVALUES_QUORUM,
    TMP_DBCASSANDRACONSISTENCYLEVELVALUES_LOCAL_QUORUM,
    TMP_DBCASSANDRACONSISTENCYLEVELVALUES_ONE,
    TMP_DBCASSANDRACONSISTENCYLEVELVALUES_TWO,
    TMP_DBCASSANDRACONSISTENCYLEVELVALUES_THREE,
    TMP_DBCASSANDRACONSISTENCYLEVELVALUES_LOCAL_ONE,
    TMP_DBCASSANDRACONSISTENCYLEVELVALUES_ANY,
    TMP_DBCASSANDRACONSISTENCYLEVELVALUES_SERIAL,
    TMP_DBCASSANDRACONSISTENCYLEVELVALUES_LOCAL_SERIAL
  ]);
  var TMP_FAASTRIGGERVALUES_DATASOURCE = "datasource";
  var TMP_FAASTRIGGERVALUES_HTTP = "http";
  var TMP_FAASTRIGGERVALUES_PUBSUB = "pubsub";
  var TMP_FAASTRIGGERVALUES_TIMER = "timer";
  var TMP_FAASTRIGGERVALUES_OTHER = "other";
  exports.FAASTRIGGERVALUES_DATASOURCE = TMP_FAASTRIGGERVALUES_DATASOURCE;
  exports.FAASTRIGGERVALUES_HTTP = TMP_FAASTRIGGERVALUES_HTTP;
  exports.FAASTRIGGERVALUES_PUBSUB = TMP_FAASTRIGGERVALUES_PUBSUB;
  exports.FAASTRIGGERVALUES_TIMER = TMP_FAASTRIGGERVALUES_TIMER;
  exports.FAASTRIGGERVALUES_OTHER = TMP_FAASTRIGGERVALUES_OTHER;
  exports.FaasTriggerValues = /* @__PURE__ */ (0, utils_1.createConstMap)([
    TMP_FAASTRIGGERVALUES_DATASOURCE,
    TMP_FAASTRIGGERVALUES_HTTP,
    TMP_FAASTRIGGERVALUES_PUBSUB,
    TMP_FAASTRIGGERVALUES_TIMER,
    TMP_FAASTRIGGERVALUES_OTHER
  ]);
  var TMP_FAASDOCUMENTOPERATIONVALUES_INSERT = "insert";
  var TMP_FAASDOCUMENTOPERATIONVALUES_EDIT = "edit";
  var TMP_FAASDOCUMENTOPERATIONVALUES_DELETE = "delete";
  exports.FAASDOCUMENTOPERATIONVALUES_INSERT = TMP_FAASDOCUMENTOPERATIONVALUES_INSERT;
  exports.FAASDOCUMENTOPERATIONVALUES_EDIT = TMP_FAASDOCUMENTOPERATIONVALUES_EDIT;
  exports.FAASDOCUMENTOPERATIONVALUES_DELETE = TMP_FAASDOCUMENTOPERATIONVALUES_DELETE;
  exports.FaasDocumentOperationValues = /* @__PURE__ */ (0, utils_1.createConstMap)([
    TMP_FAASDOCUMENTOPERATIONVALUES_INSERT,
    TMP_FAASDOCUMENTOPERATIONVALUES_EDIT,
    TMP_FAASDOCUMENTOPERATIONVALUES_DELETE
  ]);
  var TMP_FAASINVOKEDPROVIDERVALUES_ALIBABA_CLOUD = "alibaba_cloud";
  var TMP_FAASINVOKEDPROVIDERVALUES_AWS = "aws";
  var TMP_FAASINVOKEDPROVIDERVALUES_AZURE = "azure";
  var TMP_FAASINVOKEDPROVIDERVALUES_GCP = "gcp";
  exports.FAASINVOKEDPROVIDERVALUES_ALIBABA_CLOUD = TMP_FAASINVOKEDPROVIDERVALUES_ALIBABA_CLOUD;
  exports.FAASINVOKEDPROVIDERVALUES_AWS = TMP_FAASINVOKEDPROVIDERVALUES_AWS;
  exports.FAASINVOKEDPROVIDERVALUES_AZURE = TMP_FAASINVOKEDPROVIDERVALUES_AZURE;
  exports.FAASINVOKEDPROVIDERVALUES_GCP = TMP_FAASINVOKEDPROVIDERVALUES_GCP;
  exports.FaasInvokedProviderValues = /* @__PURE__ */ (0, utils_1.createConstMap)([
    TMP_FAASINVOKEDPROVIDERVALUES_ALIBABA_CLOUD,
    TMP_FAASINVOKEDPROVIDERVALUES_AWS,
    TMP_FAASINVOKEDPROVIDERVALUES_AZURE,
    TMP_FAASINVOKEDPROVIDERVALUES_GCP
  ]);
  var TMP_NETTRANSPORTVALUES_IP_TCP = "ip_tcp";
  var TMP_NETTRANSPORTVALUES_IP_UDP = "ip_udp";
  var TMP_NETTRANSPORTVALUES_IP = "ip";
  var TMP_NETTRANSPORTVALUES_UNIX = "unix";
  var TMP_NETTRANSPORTVALUES_PIPE = "pipe";
  var TMP_NETTRANSPORTVALUES_INPROC = "inproc";
  var TMP_NETTRANSPORTVALUES_OTHER = "other";
  exports.NETTRANSPORTVALUES_IP_TCP = TMP_NETTRANSPORTVALUES_IP_TCP;
  exports.NETTRANSPORTVALUES_IP_UDP = TMP_NETTRANSPORTVALUES_IP_UDP;
  exports.NETTRANSPORTVALUES_IP = TMP_NETTRANSPORTVALUES_IP;
  exports.NETTRANSPORTVALUES_UNIX = TMP_NETTRANSPORTVALUES_UNIX;
  exports.NETTRANSPORTVALUES_PIPE = TMP_NETTRANSPORTVALUES_PIPE;
  exports.NETTRANSPORTVALUES_INPROC = TMP_NETTRANSPORTVALUES_INPROC;
  exports.NETTRANSPORTVALUES_OTHER = TMP_NETTRANSPORTVALUES_OTHER;
  exports.NetTransportValues = /* @__PURE__ */ (0, utils_1.createConstMap)([
    TMP_NETTRANSPORTVALUES_IP_TCP,
    TMP_NETTRANSPORTVALUES_IP_UDP,
    TMP_NETTRANSPORTVALUES_IP,
    TMP_NETTRANSPORTVALUES_UNIX,
    TMP_NETTRANSPORTVALUES_PIPE,
    TMP_NETTRANSPORTVALUES_INPROC,
    TMP_NETTRANSPORTVALUES_OTHER
  ]);
  var TMP_NETHOSTCONNECTIONTYPEVALUES_WIFI = "wifi";
  var TMP_NETHOSTCONNECTIONTYPEVALUES_WIRED = "wired";
  var TMP_NETHOSTCONNECTIONTYPEVALUES_CELL = "cell";
  var TMP_NETHOSTCONNECTIONTYPEVALUES_UNAVAILABLE = "unavailable";
  var TMP_NETHOSTCONNECTIONTYPEVALUES_UNKNOWN = "unknown";
  exports.NETHOSTCONNECTIONTYPEVALUES_WIFI = TMP_NETHOSTCONNECTIONTYPEVALUES_WIFI;
  exports.NETHOSTCONNECTIONTYPEVALUES_WIRED = TMP_NETHOSTCONNECTIONTYPEVALUES_WIRED;
  exports.NETHOSTCONNECTIONTYPEVALUES_CELL = TMP_NETHOSTCONNECTIONTYPEVALUES_CELL;
  exports.NETHOSTCONNECTIONTYPEVALUES_UNAVAILABLE = TMP_NETHOSTCONNECTIONTYPEVALUES_UNAVAILABLE;
  exports.NETHOSTCONNECTIONTYPEVALUES_UNKNOWN = TMP_NETHOSTCONNECTIONTYPEVALUES_UNKNOWN;
  exports.NetHostConnectionTypeValues = /* @__PURE__ */ (0, utils_1.createConstMap)([
    TMP_NETHOSTCONNECTIONTYPEVALUES_WIFI,
    TMP_NETHOSTCONNECTIONTYPEVALUES_WIRED,
    TMP_NETHOSTCONNECTIONTYPEVALUES_CELL,
    TMP_NETHOSTCONNECTIONTYPEVALUES_UNAVAILABLE,
    TMP_NETHOSTCONNECTIONTYPEVALUES_UNKNOWN
  ]);
  var TMP_NETHOSTCONNECTIONSUBTYPEVALUES_GPRS = "gprs";
  var TMP_NETHOSTCONNECTIONSUBTYPEVALUES_EDGE = "edge";
  var TMP_NETHOSTCONNECTIONSUBTYPEVALUES_UMTS = "umts";
  var TMP_NETHOSTCONNECTIONSUBTYPEVALUES_CDMA = "cdma";
  var TMP_NETHOSTCONNECTIONSUBTYPEVALUES_EVDO_0 = "evdo_0";
  var TMP_NETHOSTCONNECTIONSUBTYPEVALUES_EVDO_A = "evdo_a";
  var TMP_NETHOSTCONNECTIONSUBTYPEVALUES_CDMA2000_1XRTT = "cdma2000_1xrtt";
  var TMP_NETHOSTCONNECTIONSUBTYPEVALUES_HSDPA = "hsdpa";
  var TMP_NETHOSTCONNECTIONSUBTYPEVALUES_HSUPA = "hsupa";
  var TMP_NETHOSTCONNECTIONSUBTYPEVALUES_HSPA = "hspa";
  var TMP_NETHOSTCONNECTIONSUBTYPEVALUES_IDEN = "iden";
  var TMP_NETHOSTCONNECTIONSUBTYPEVALUES_EVDO_B = "evdo_b";
  var TMP_NETHOSTCONNECTIONSUBTYPEVALUES_LTE = "lte";
  var TMP_NETHOSTCONNECTIONSUBTYPEVALUES_EHRPD = "ehrpd";
  var TMP_NETHOSTCONNECTIONSUBTYPEVALUES_HSPAP = "hspap";
  var TMP_NETHOSTCONNECTIONSUBTYPEVALUES_GSM = "gsm";
  var TMP_NETHOSTCONNECTIONSUBTYPEVALUES_TD_SCDMA = "td_scdma";
  var TMP_NETHOSTCONNECTIONSUBTYPEVALUES_IWLAN = "iwlan";
  var TMP_NETHOSTCONNECTIONSUBTYPEVALUES_NR = "nr";
  var TMP_NETHOSTCONNECTIONSUBTYPEVALUES_NRNSA = "nrnsa";
  var TMP_NETHOSTCONNECTIONSUBTYPEVALUES_LTE_CA = "lte_ca";
  exports.NETHOSTCONNECTIONSUBTYPEVALUES_GPRS = TMP_NETHOSTCONNECTIONSUBTYPEVALUES_GPRS;
  exports.NETHOSTCONNECTIONSUBTYPEVALUES_EDGE = TMP_NETHOSTCONNECTIONSUBTYPEVALUES_EDGE;
  exports.NETHOSTCONNECTIONSUBTYPEVALUES_UMTS = TMP_NETHOSTCONNECTIONSUBTYPEVALUES_UMTS;
  exports.NETHOSTCONNECTIONSUBTYPEVALUES_CDMA = TMP_NETHOSTCONNECTIONSUBTYPEVALUES_CDMA;
  exports.NETHOSTCONNECTIONSUBTYPEVALUES_EVDO_0 = TMP_NETHOSTCONNECTIONSUBTYPEVALUES_EVDO_0;
  exports.NETHOSTCONNECTIONSUBTYPEVALUES_EVDO_A = TMP_NETHOSTCONNECTIONSUBTYPEVALUES_EVDO_A;
  exports.NETHOSTCONNECTIONSUBTYPEVALUES_CDMA2000_1XRTT = TMP_NETHOSTCONNECTIONSUBTYPEVALUES_CDMA2000_1XRTT;
  exports.NETHOSTCONNECTIONSUBTYPEVALUES_HSDPA = TMP_NETHOSTCONNECTIONSUBTYPEVALUES_HSDPA;
  exports.NETHOSTCONNECTIONSUBTYPEVALUES_HSUPA = TMP_NETHOSTCONNECTIONSUBTYPEVALUES_HSUPA;
  exports.NETHOSTCONNECTIONSUBTYPEVALUES_HSPA = TMP_NETHOSTCONNECTIONSUBTYPEVALUES_HSPA;
  exports.NETHOSTCONNECTIONSUBTYPEVALUES_IDEN = TMP_NETHOSTCONNECTIONSUBTYPEVALUES_IDEN;
  exports.NETHOSTCONNECTIONSUBTYPEVALUES_EVDO_B = TMP_NETHOSTCONNECTIONSUBTYPEVALUES_EVDO_B;
  exports.NETHOSTCONNECTIONSUBTYPEVALUES_LTE = TMP_NETHOSTCONNECTIONSUBTYPEVALUES_LTE;
  exports.NETHOSTCONNECTIONSUBTYPEVALUES_EHRPD = TMP_NETHOSTCONNECTIONSUBTYPEVALUES_EHRPD;
  exports.NETHOSTCONNECTIONSUBTYPEVALUES_HSPAP = TMP_NETHOSTCONNECTIONSUBTYPEVALUES_HSPAP;
  exports.NETHOSTCONNECTIONSUBTYPEVALUES_GSM = TMP_NETHOSTCONNECTIONSUBTYPEVALUES_GSM;
  exports.NETHOSTCONNECTIONSUBTYPEVALUES_TD_SCDMA = TMP_NETHOSTCONNECTIONSUBTYPEVALUES_TD_SCDMA;
  exports.NETHOSTCONNECTIONSUBTYPEVALUES_IWLAN = TMP_NETHOSTCONNECTIONSUBTYPEVALUES_IWLAN;
  exports.NETHOSTCONNECTIONSUBTYPEVALUES_NR = TMP_NETHOSTCONNECTIONSUBTYPEVALUES_NR;
  exports.NETHOSTCONNECTIONSUBTYPEVALUES_NRNSA = TMP_NETHOSTCONNECTIONSUBTYPEVALUES_NRNSA;
  exports.NETHOSTCONNECTIONSUBTYPEVALUES_LTE_CA = TMP_NETHOSTCONNECTIONSUBTYPEVALUES_LTE_CA;
  exports.NetHostConnectionSubtypeValues = /* @__PURE__ */ (0, utils_1.createConstMap)([
    TMP_NETHOSTCONNECTIONSUBTYPEVALUES_GPRS,
    TMP_NETHOSTCONNECTIONSUBTYPEVALUES_EDGE,
    TMP_NETHOSTCONNECTIONSUBTYPEVALUES_UMTS,
    TMP_NETHOSTCONNECTIONSUBTYPEVALUES_CDMA,
    TMP_NETHOSTCONNECTIONSUBTYPEVALUES_EVDO_0,
    TMP_NETHOSTCONNECTIONSUBTYPEVALUES_EVDO_A,
    TMP_NETHOSTCONNECTIONSUBTYPEVALUES_CDMA2000_1XRTT,
    TMP_NETHOSTCONNECTIONSUBTYPEVALUES_HSDPA,
    TMP_NETHOSTCONNECTIONSUBTYPEVALUES_HSUPA,
    TMP_NETHOSTCONNECTIONSUBTYPEVALUES_HSPA,
    TMP_NETHOSTCONNECTIONSUBTYPEVALUES_IDEN,
    TMP_NETHOSTCONNECTIONSUBTYPEVALUES_EVDO_B,
    TMP_NETHOSTCONNECTIONSUBTYPEVALUES_LTE,
    TMP_NETHOSTCONNECTIONSUBTYPEVALUES_EHRPD,
    TMP_NETHOSTCONNECTIONSUBTYPEVALUES_HSPAP,
    TMP_NETHOSTCONNECTIONSUBTYPEVALUES_GSM,
    TMP_NETHOSTCONNECTIONSUBTYPEVALUES_TD_SCDMA,
    TMP_NETHOSTCONNECTIONSUBTYPEVALUES_IWLAN,
    TMP_NETHOSTCONNECTIONSUBTYPEVALUES_NR,
    TMP_NETHOSTCONNECTIONSUBTYPEVALUES_NRNSA,
    TMP_NETHOSTCONNECTIONSUBTYPEVALUES_LTE_CA
  ]);
  var TMP_HTTPFLAVORVALUES_HTTP_1_0 = "1.0";
  var TMP_HTTPFLAVORVALUES_HTTP_1_1 = "1.1";
  var TMP_HTTPFLAVORVALUES_HTTP_2_0 = "2.0";
  var TMP_HTTPFLAVORVALUES_SPDY = "SPDY";
  var TMP_HTTPFLAVORVALUES_QUIC = "QUIC";
  exports.HTTPFLAVORVALUES_HTTP_1_0 = TMP_HTTPFLAVORVALUES_HTTP_1_0;
  exports.HTTPFLAVORVALUES_HTTP_1_1 = TMP_HTTPFLAVORVALUES_HTTP_1_1;
  exports.HTTPFLAVORVALUES_HTTP_2_0 = TMP_HTTPFLAVORVALUES_HTTP_2_0;
  exports.HTTPFLAVORVALUES_SPDY = TMP_HTTPFLAVORVALUES_SPDY;
  exports.HTTPFLAVORVALUES_QUIC = TMP_HTTPFLAVORVALUES_QUIC;
  exports.HttpFlavorValues = {
    HTTP_1_0: TMP_HTTPFLAVORVALUES_HTTP_1_0,
    HTTP_1_1: TMP_HTTPFLAVORVALUES_HTTP_1_1,
    HTTP_2_0: TMP_HTTPFLAVORVALUES_HTTP_2_0,
    SPDY: TMP_HTTPFLAVORVALUES_SPDY,
    QUIC: TMP_HTTPFLAVORVALUES_QUIC
  };
  var TMP_MESSAGINGDESTINATIONKINDVALUES_QUEUE = "queue";
  var TMP_MESSAGINGDESTINATIONKINDVALUES_TOPIC = "topic";
  exports.MESSAGINGDESTINATIONKINDVALUES_QUEUE = TMP_MESSAGINGDESTINATIONKINDVALUES_QUEUE;
  exports.MESSAGINGDESTINATIONKINDVALUES_TOPIC = TMP_MESSAGINGDESTINATIONKINDVALUES_TOPIC;
  exports.MessagingDestinationKindValues = /* @__PURE__ */ (0, utils_1.createConstMap)([
    TMP_MESSAGINGDESTINATIONKINDVALUES_QUEUE,
    TMP_MESSAGINGDESTINATIONKINDVALUES_TOPIC
  ]);
  var TMP_MESSAGINGOPERATIONVALUES_RECEIVE = "receive";
  var TMP_MESSAGINGOPERATIONVALUES_PROCESS = "process";
  exports.MESSAGINGOPERATIONVALUES_RECEIVE = TMP_MESSAGINGOPERATIONVALUES_RECEIVE;
  exports.MESSAGINGOPERATIONVALUES_PROCESS = TMP_MESSAGINGOPERATIONVALUES_PROCESS;
  exports.MessagingOperationValues = /* @__PURE__ */ (0, utils_1.createConstMap)([
    TMP_MESSAGINGOPERATIONVALUES_RECEIVE,
    TMP_MESSAGINGOPERATIONVALUES_PROCESS
  ]);
  var TMP_RPCGRPCSTATUSCODEVALUES_OK = 0;
  var TMP_RPCGRPCSTATUSCODEVALUES_CANCELLED = 1;
  var TMP_RPCGRPCSTATUSCODEVALUES_UNKNOWN = 2;
  var TMP_RPCGRPCSTATUSCODEVALUES_INVALID_ARGUMENT = 3;
  var TMP_RPCGRPCSTATUSCODEVALUES_DEADLINE_EXCEEDED = 4;
  var TMP_RPCGRPCSTATUSCODEVALUES_NOT_FOUND = 5;
  var TMP_RPCGRPCSTATUSCODEVALUES_ALREADY_EXISTS = 6;
  var TMP_RPCGRPCSTATUSCODEVALUES_PERMISSION_DENIED = 7;
  var TMP_RPCGRPCSTATUSCODEVALUES_RESOURCE_EXHAUSTED = 8;
  var TMP_RPCGRPCSTATUSCODEVALUES_FAILED_PRECONDITION = 9;
  var TMP_RPCGRPCSTATUSCODEVALUES_ABORTED = 10;
  var TMP_RPCGRPCSTATUSCODEVALUES_OUT_OF_RANGE = 11;
  var TMP_RPCGRPCSTATUSCODEVALUES_UNIMPLEMENTED = 12;
  var TMP_RPCGRPCSTATUSCODEVALUES_INTERNAL = 13;
  var TMP_RPCGRPCSTATUSCODEVALUES_UNAVAILABLE = 14;
  var TMP_RPCGRPCSTATUSCODEVALUES_DATA_LOSS = 15;
  var TMP_RPCGRPCSTATUSCODEVALUES_UNAUTHENTICATED = 16;
  exports.RPCGRPCSTATUSCODEVALUES_OK = TMP_RPCGRPCSTATUSCODEVALUES_OK;
  exports.RPCGRPCSTATUSCODEVALUES_CANCELLED = TMP_RPCGRPCSTATUSCODEVALUES_CANCELLED;
  exports.RPCGRPCSTATUSCODEVALUES_UNKNOWN = TMP_RPCGRPCSTATUSCODEVALUES_UNKNOWN;
  exports.RPCGRPCSTATUSCODEVALUES_INVALID_ARGUMENT = TMP_RPCGRPCSTATUSCODEVALUES_INVALID_ARGUMENT;
  exports.RPCGRPCSTATUSCODEVALUES_DEADLINE_EXCEEDED = TMP_RPCGRPCSTATUSCODEVALUES_DEADLINE_EXCEEDED;
  exports.RPCGRPCSTATUSCODEVALUES_NOT_FOUND = TMP_RPCGRPCSTATUSCODEVALUES_NOT_FOUND;
  exports.RPCGRPCSTATUSCODEVALUES_ALREADY_EXISTS = TMP_RPCGRPCSTATUSCODEVALUES_ALREADY_EXISTS;
  exports.RPCGRPCSTATUSCODEVALUES_PERMISSION_DENIED = TMP_RPCGRPCSTATUSCODEVALUES_PERMISSION_DENIED;
  exports.RPCGRPCSTATUSCODEVALUES_RESOURCE_EXHAUSTED = TMP_RPCGRPCSTATUSCODEVALUES_RESOURCE_EXHAUSTED;
  exports.RPCGRPCSTATUSCODEVALUES_FAILED_PRECONDITION = TMP_RPCGRPCSTATUSCODEVALUES_FAILED_PRECONDITION;
  exports.RPCGRPCSTATUSCODEVALUES_ABORTED = TMP_RPCGRPCSTATUSCODEVALUES_ABORTED;
  exports.RPCGRPCSTATUSCODEVALUES_OUT_OF_RANGE = TMP_RPCGRPCSTATUSCODEVALUES_OUT_OF_RANGE;
  exports.RPCGRPCSTATUSCODEVALUES_UNIMPLEMENTED = TMP_RPCGRPCSTATUSCODEVALUES_UNIMPLEMENTED;
  exports.RPCGRPCSTATUSCODEVALUES_INTERNAL = TMP_RPCGRPCSTATUSCODEVALUES_INTERNAL;
  exports.RPCGRPCSTATUSCODEVALUES_UNAVAILABLE = TMP_RPCGRPCSTATUSCODEVALUES_UNAVAILABLE;
  exports.RPCGRPCSTATUSCODEVALUES_DATA_LOSS = TMP_RPCGRPCSTATUSCODEVALUES_DATA_LOSS;
  exports.RPCGRPCSTATUSCODEVALUES_UNAUTHENTICATED = TMP_RPCGRPCSTATUSCODEVALUES_UNAUTHENTICATED;
  exports.RpcGrpcStatusCodeValues = {
    OK: TMP_RPCGRPCSTATUSCODEVALUES_OK,
    CANCELLED: TMP_RPCGRPCSTATUSCODEVALUES_CANCELLED,
    UNKNOWN: TMP_RPCGRPCSTATUSCODEVALUES_UNKNOWN,
    INVALID_ARGUMENT: TMP_RPCGRPCSTATUSCODEVALUES_INVALID_ARGUMENT,
    DEADLINE_EXCEEDED: TMP_RPCGRPCSTATUSCODEVALUES_DEADLINE_EXCEEDED,
    NOT_FOUND: TMP_RPCGRPCSTATUSCODEVALUES_NOT_FOUND,
    ALREADY_EXISTS: TMP_RPCGRPCSTATUSCODEVALUES_ALREADY_EXISTS,
    PERMISSION_DENIED: TMP_RPCGRPCSTATUSCODEVALUES_PERMISSION_DENIED,
    RESOURCE_EXHAUSTED: TMP_RPCGRPCSTATUSCODEVALUES_RESOURCE_EXHAUSTED,
    FAILED_PRECONDITION: TMP_RPCGRPCSTATUSCODEVALUES_FAILED_PRECONDITION,
    ABORTED: TMP_RPCGRPCSTATUSCODEVALUES_ABORTED,
    OUT_OF_RANGE: TMP_RPCGRPCSTATUSCODEVALUES_OUT_OF_RANGE,
    UNIMPLEMENTED: TMP_RPCGRPCSTATUSCODEVALUES_UNIMPLEMENTED,
    INTERNAL: TMP_RPCGRPCSTATUSCODEVALUES_INTERNAL,
    UNAVAILABLE: TMP_RPCGRPCSTATUSCODEVALUES_UNAVAILABLE,
    DATA_LOSS: TMP_RPCGRPCSTATUSCODEVALUES_DATA_LOSS,
    UNAUTHENTICATED: TMP_RPCGRPCSTATUSCODEVALUES_UNAUTHENTICATED
  };
  var TMP_MESSAGETYPEVALUES_SENT = "SENT";
  var TMP_MESSAGETYPEVALUES_RECEIVED = "RECEIVED";
  exports.MESSAGETYPEVALUES_SENT = TMP_MESSAGETYPEVALUES_SENT;
  exports.MESSAGETYPEVALUES_RECEIVED = TMP_MESSAGETYPEVALUES_RECEIVED;
  exports.MessageTypeValues = /* @__PURE__ */ (0, utils_1.createConstMap)([
    TMP_MESSAGETYPEVALUES_SENT,
    TMP_MESSAGETYPEVALUES_RECEIVED
  ]);
});

// node_modules/@opentelemetry/sdk-trace-base/node_modules/@opentelemetry/semantic-conventions/build/src/trace/index.js
var require_trace3 = __commonJS((exports) => {
  var __createBinding = exports && exports.__createBinding || (Object.create ? function(o, m, k, k2) {
    if (k2 === undefined)
      k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() {
      return m[k];
    } });
  } : function(o, m, k, k2) {
    if (k2 === undefined)
      k2 = k;
    o[k2] = m[k];
  });
  var __exportStar = exports && exports.__exportStar || function(m, exports2) {
    for (var p in m)
      if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p))
        __createBinding(exports2, m, p);
  };
  Object.defineProperty(exports, "__esModule", { value: true });
  __exportStar(require_SemanticAttributes2(), exports);
});

// node_modules/@opentelemetry/sdk-trace-base/node_modules/@opentelemetry/semantic-conventions/build/src/resource/SemanticResourceAttributes.js
var require_SemanticResourceAttributes2 = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.SEMRESATTRS_K8S_STATEFULSET_NAME = exports.SEMRESATTRS_K8S_STATEFULSET_UID = exports.SEMRESATTRS_K8S_DEPLOYMENT_NAME = exports.SEMRESATTRS_K8S_DEPLOYMENT_UID = exports.SEMRESATTRS_K8S_REPLICASET_NAME = exports.SEMRESATTRS_K8S_REPLICASET_UID = exports.SEMRESATTRS_K8S_CONTAINER_NAME = exports.SEMRESATTRS_K8S_POD_NAME = exports.SEMRESATTRS_K8S_POD_UID = exports.SEMRESATTRS_K8S_NAMESPACE_NAME = exports.SEMRESATTRS_K8S_NODE_UID = exports.SEMRESATTRS_K8S_NODE_NAME = exports.SEMRESATTRS_K8S_CLUSTER_NAME = exports.SEMRESATTRS_HOST_IMAGE_VERSION = exports.SEMRESATTRS_HOST_IMAGE_ID = exports.SEMRESATTRS_HOST_IMAGE_NAME = exports.SEMRESATTRS_HOST_ARCH = exports.SEMRESATTRS_HOST_TYPE = exports.SEMRESATTRS_HOST_NAME = exports.SEMRESATTRS_HOST_ID = exports.SEMRESATTRS_FAAS_MAX_MEMORY = exports.SEMRESATTRS_FAAS_INSTANCE = exports.SEMRESATTRS_FAAS_VERSION = exports.SEMRESATTRS_FAAS_ID = exports.SEMRESATTRS_FAAS_NAME = exports.SEMRESATTRS_DEVICE_MODEL_NAME = exports.SEMRESATTRS_DEVICE_MODEL_IDENTIFIER = exports.SEMRESATTRS_DEVICE_ID = exports.SEMRESATTRS_DEPLOYMENT_ENVIRONMENT = exports.SEMRESATTRS_CONTAINER_IMAGE_TAG = exports.SEMRESATTRS_CONTAINER_IMAGE_NAME = exports.SEMRESATTRS_CONTAINER_RUNTIME = exports.SEMRESATTRS_CONTAINER_ID = exports.SEMRESATTRS_CONTAINER_NAME = exports.SEMRESATTRS_AWS_LOG_STREAM_ARNS = exports.SEMRESATTRS_AWS_LOG_STREAM_NAMES = exports.SEMRESATTRS_AWS_LOG_GROUP_ARNS = exports.SEMRESATTRS_AWS_LOG_GROUP_NAMES = exports.SEMRESATTRS_AWS_EKS_CLUSTER_ARN = exports.SEMRESATTRS_AWS_ECS_TASK_REVISION = exports.SEMRESATTRS_AWS_ECS_TASK_FAMILY = exports.SEMRESATTRS_AWS_ECS_TASK_ARN = exports.SEMRESATTRS_AWS_ECS_LAUNCHTYPE = exports.SEMRESATTRS_AWS_ECS_CLUSTER_ARN = exports.SEMRESATTRS_AWS_ECS_CONTAINER_ARN = exports.SEMRESATTRS_CLOUD_PLATFORM = exports.SEMRESATTRS_CLOUD_AVAILABILITY_ZONE = exports.SEMRESATTRS_CLOUD_REGION = exports.SEMRESATTRS_CLOUD_ACCOUNT_ID = exports.SEMRESATTRS_CLOUD_PROVIDER = undefined;
  exports.CLOUDPLATFORMVALUES_GCP_COMPUTE_ENGINE = exports.CLOUDPLATFORMVALUES_AZURE_APP_SERVICE = exports.CLOUDPLATFORMVALUES_AZURE_FUNCTIONS = exports.CLOUDPLATFORMVALUES_AZURE_AKS = exports.CLOUDPLATFORMVALUES_AZURE_CONTAINER_INSTANCES = exports.CLOUDPLATFORMVALUES_AZURE_VM = exports.CLOUDPLATFORMVALUES_AWS_ELASTIC_BEANSTALK = exports.CLOUDPLATFORMVALUES_AWS_LAMBDA = exports.CLOUDPLATFORMVALUES_AWS_EKS = exports.CLOUDPLATFORMVALUES_AWS_ECS = exports.CLOUDPLATFORMVALUES_AWS_EC2 = exports.CLOUDPLATFORMVALUES_ALIBABA_CLOUD_FC = exports.CLOUDPLATFORMVALUES_ALIBABA_CLOUD_ECS = exports.CloudProviderValues = exports.CLOUDPROVIDERVALUES_GCP = exports.CLOUDPROVIDERVALUES_AZURE = exports.CLOUDPROVIDERVALUES_AWS = exports.CLOUDPROVIDERVALUES_ALIBABA_CLOUD = exports.SemanticResourceAttributes = exports.SEMRESATTRS_WEBENGINE_DESCRIPTION = exports.SEMRESATTRS_WEBENGINE_VERSION = exports.SEMRESATTRS_WEBENGINE_NAME = exports.SEMRESATTRS_TELEMETRY_AUTO_VERSION = exports.SEMRESATTRS_TELEMETRY_SDK_VERSION = exports.SEMRESATTRS_TELEMETRY_SDK_LANGUAGE = exports.SEMRESATTRS_TELEMETRY_SDK_NAME = exports.SEMRESATTRS_SERVICE_VERSION = exports.SEMRESATTRS_SERVICE_INSTANCE_ID = exports.SEMRESATTRS_SERVICE_NAMESPACE = exports.SEMRESATTRS_SERVICE_NAME = exports.SEMRESATTRS_PROCESS_RUNTIME_DESCRIPTION = exports.SEMRESATTRS_PROCESS_RUNTIME_VERSION = exports.SEMRESATTRS_PROCESS_RUNTIME_NAME = exports.SEMRESATTRS_PROCESS_OWNER = exports.SEMRESATTRS_PROCESS_COMMAND_ARGS = exports.SEMRESATTRS_PROCESS_COMMAND_LINE = exports.SEMRESATTRS_PROCESS_COMMAND = exports.SEMRESATTRS_PROCESS_EXECUTABLE_PATH = exports.SEMRESATTRS_PROCESS_EXECUTABLE_NAME = exports.SEMRESATTRS_PROCESS_PID = exports.SEMRESATTRS_OS_VERSION = exports.SEMRESATTRS_OS_NAME = exports.SEMRESATTRS_OS_DESCRIPTION = exports.SEMRESATTRS_OS_TYPE = exports.SEMRESATTRS_K8S_CRONJOB_NAME = exports.SEMRESATTRS_K8S_CRONJOB_UID = exports.SEMRESATTRS_K8S_JOB_NAME = exports.SEMRESATTRS_K8S_JOB_UID = exports.SEMRESATTRS_K8S_DAEMONSET_NAME = exports.SEMRESATTRS_K8S_DAEMONSET_UID = undefined;
  exports.TelemetrySdkLanguageValues = exports.TELEMETRYSDKLANGUAGEVALUES_WEBJS = exports.TELEMETRYSDKLANGUAGEVALUES_RUBY = exports.TELEMETRYSDKLANGUAGEVALUES_PYTHON = exports.TELEMETRYSDKLANGUAGEVALUES_PHP = exports.TELEMETRYSDKLANGUAGEVALUES_NODEJS = exports.TELEMETRYSDKLANGUAGEVALUES_JAVA = exports.TELEMETRYSDKLANGUAGEVALUES_GO = exports.TELEMETRYSDKLANGUAGEVALUES_ERLANG = exports.TELEMETRYSDKLANGUAGEVALUES_DOTNET = exports.TELEMETRYSDKLANGUAGEVALUES_CPP = exports.OsTypeValues = exports.OSTYPEVALUES_Z_OS = exports.OSTYPEVALUES_SOLARIS = exports.OSTYPEVALUES_AIX = exports.OSTYPEVALUES_HPUX = exports.OSTYPEVALUES_DRAGONFLYBSD = exports.OSTYPEVALUES_OPENBSD = exports.OSTYPEVALUES_NETBSD = exports.OSTYPEVALUES_FREEBSD = exports.OSTYPEVALUES_DARWIN = exports.OSTYPEVALUES_LINUX = exports.OSTYPEVALUES_WINDOWS = exports.HostArchValues = exports.HOSTARCHVALUES_X86 = exports.HOSTARCHVALUES_PPC64 = exports.HOSTARCHVALUES_PPC32 = exports.HOSTARCHVALUES_IA64 = exports.HOSTARCHVALUES_ARM64 = exports.HOSTARCHVALUES_ARM32 = exports.HOSTARCHVALUES_AMD64 = exports.AwsEcsLaunchtypeValues = exports.AWSECSLAUNCHTYPEVALUES_FARGATE = exports.AWSECSLAUNCHTYPEVALUES_EC2 = exports.CloudPlatformValues = exports.CLOUDPLATFORMVALUES_GCP_APP_ENGINE = exports.CLOUDPLATFORMVALUES_GCP_CLOUD_FUNCTIONS = exports.CLOUDPLATFORMVALUES_GCP_KUBERNETES_ENGINE = exports.CLOUDPLATFORMVALUES_GCP_CLOUD_RUN = undefined;
  var utils_1 = require_utils5();
  var TMP_CLOUD_PROVIDER = "cloud.provider";
  var TMP_CLOUD_ACCOUNT_ID = "cloud.account.id";
  var TMP_CLOUD_REGION = "cloud.region";
  var TMP_CLOUD_AVAILABILITY_ZONE = "cloud.availability_zone";
  var TMP_CLOUD_PLATFORM = "cloud.platform";
  var TMP_AWS_ECS_CONTAINER_ARN = "aws.ecs.container.arn";
  var TMP_AWS_ECS_CLUSTER_ARN = "aws.ecs.cluster.arn";
  var TMP_AWS_ECS_LAUNCHTYPE = "aws.ecs.launchtype";
  var TMP_AWS_ECS_TASK_ARN = "aws.ecs.task.arn";
  var TMP_AWS_ECS_TASK_FAMILY = "aws.ecs.task.family";
  var TMP_AWS_ECS_TASK_REVISION = "aws.ecs.task.revision";
  var TMP_AWS_EKS_CLUSTER_ARN = "aws.eks.cluster.arn";
  var TMP_AWS_LOG_GROUP_NAMES = "aws.log.group.names";
  var TMP_AWS_LOG_GROUP_ARNS = "aws.log.group.arns";
  var TMP_AWS_LOG_STREAM_NAMES = "aws.log.stream.names";
  var TMP_AWS_LOG_STREAM_ARNS = "aws.log.stream.arns";
  var TMP_CONTAINER_NAME = "container.name";
  var TMP_CONTAINER_ID = "container.id";
  var TMP_CONTAINER_RUNTIME = "container.runtime";
  var TMP_CONTAINER_IMAGE_NAME = "container.image.name";
  var TMP_CONTAINER_IMAGE_TAG = "container.image.tag";
  var TMP_DEPLOYMENT_ENVIRONMENT = "deployment.environment";
  var TMP_DEVICE_ID = "device.id";
  var TMP_DEVICE_MODEL_IDENTIFIER = "device.model.identifier";
  var TMP_DEVICE_MODEL_NAME = "device.model.name";
  var TMP_FAAS_NAME = "faas.name";
  var TMP_FAAS_ID = "faas.id";
  var TMP_FAAS_VERSION = "faas.version";
  var TMP_FAAS_INSTANCE = "faas.instance";
  var TMP_FAAS_MAX_MEMORY = "faas.max_memory";
  var TMP_HOST_ID = "host.id";
  var TMP_HOST_NAME = "host.name";
  var TMP_HOST_TYPE = "host.type";
  var TMP_HOST_ARCH = "host.arch";
  var TMP_HOST_IMAGE_NAME = "host.image.name";
  var TMP_HOST_IMAGE_ID = "host.image.id";
  var TMP_HOST_IMAGE_VERSION = "host.image.version";
  var TMP_K8S_CLUSTER_NAME = "k8s.cluster.name";
  var TMP_K8S_NODE_NAME = "k8s.node.name";
  var TMP_K8S_NODE_UID = "k8s.node.uid";
  var TMP_K8S_NAMESPACE_NAME = "k8s.namespace.name";
  var TMP_K8S_POD_UID = "k8s.pod.uid";
  var TMP_K8S_POD_NAME = "k8s.pod.name";
  var TMP_K8S_CONTAINER_NAME = "k8s.container.name";
  var TMP_K8S_REPLICASET_UID = "k8s.replicaset.uid";
  var TMP_K8S_REPLICASET_NAME = "k8s.replicaset.name";
  var TMP_K8S_DEPLOYMENT_UID = "k8s.deployment.uid";
  var TMP_K8S_DEPLOYMENT_NAME = "k8s.deployment.name";
  var TMP_K8S_STATEFULSET_UID = "k8s.statefulset.uid";
  var TMP_K8S_STATEFULSET_NAME = "k8s.statefulset.name";
  var TMP_K8S_DAEMONSET_UID = "k8s.daemonset.uid";
  var TMP_K8S_DAEMONSET_NAME = "k8s.daemonset.name";
  var TMP_K8S_JOB_UID = "k8s.job.uid";
  var TMP_K8S_JOB_NAME = "k8s.job.name";
  var TMP_K8S_CRONJOB_UID = "k8s.cronjob.uid";
  var TMP_K8S_CRONJOB_NAME = "k8s.cronjob.name";
  var TMP_OS_TYPE = "os.type";
  var TMP_OS_DESCRIPTION = "os.description";
  var TMP_OS_NAME = "os.name";
  var TMP_OS_VERSION = "os.version";
  var TMP_PROCESS_PID = "process.pid";
  var TMP_PROCESS_EXECUTABLE_NAME = "process.executable.name";
  var TMP_PROCESS_EXECUTABLE_PATH = "process.executable.path";
  var TMP_PROCESS_COMMAND = "process.command";
  var TMP_PROCESS_COMMAND_LINE = "process.command_line";
  var TMP_PROCESS_COMMAND_ARGS = "process.command_args";
  var TMP_PROCESS_OWNER = "process.owner";
  var TMP_PROCESS_RUNTIME_NAME = "process.runtime.name";
  var TMP_PROCESS_RUNTIME_VERSION = "process.runtime.version";
  var TMP_PROCESS_RUNTIME_DESCRIPTION = "process.runtime.description";
  var TMP_SERVICE_NAME = "service.name";
  var TMP_SERVICE_NAMESPACE = "service.namespace";
  var TMP_SERVICE_INSTANCE_ID = "service.instance.id";
  var TMP_SERVICE_VERSION = "service.version";
  var TMP_TELEMETRY_SDK_NAME = "telemetry.sdk.name";
  var TMP_TELEMETRY_SDK_LANGUAGE = "telemetry.sdk.language";
  var TMP_TELEMETRY_SDK_VERSION = "telemetry.sdk.version";
  var TMP_TELEMETRY_AUTO_VERSION = "telemetry.auto.version";
  var TMP_WEBENGINE_NAME = "webengine.name";
  var TMP_WEBENGINE_VERSION = "webengine.version";
  var TMP_WEBENGINE_DESCRIPTION = "webengine.description";
  exports.SEMRESATTRS_CLOUD_PROVIDER = TMP_CLOUD_PROVIDER;
  exports.SEMRESATTRS_CLOUD_ACCOUNT_ID = TMP_CLOUD_ACCOUNT_ID;
  exports.SEMRESATTRS_CLOUD_REGION = TMP_CLOUD_REGION;
  exports.SEMRESATTRS_CLOUD_AVAILABILITY_ZONE = TMP_CLOUD_AVAILABILITY_ZONE;
  exports.SEMRESATTRS_CLOUD_PLATFORM = TMP_CLOUD_PLATFORM;
  exports.SEMRESATTRS_AWS_ECS_CONTAINER_ARN = TMP_AWS_ECS_CONTAINER_ARN;
  exports.SEMRESATTRS_AWS_ECS_CLUSTER_ARN = TMP_AWS_ECS_CLUSTER_ARN;
  exports.SEMRESATTRS_AWS_ECS_LAUNCHTYPE = TMP_AWS_ECS_LAUNCHTYPE;
  exports.SEMRESATTRS_AWS_ECS_TASK_ARN = TMP_AWS_ECS_TASK_ARN;
  exports.SEMRESATTRS_AWS_ECS_TASK_FAMILY = TMP_AWS_ECS_TASK_FAMILY;
  exports.SEMRESATTRS_AWS_ECS_TASK_REVISION = TMP_AWS_ECS_TASK_REVISION;
  exports.SEMRESATTRS_AWS_EKS_CLUSTER_ARN = TMP_AWS_EKS_CLUSTER_ARN;
  exports.SEMRESATTRS_AWS_LOG_GROUP_NAMES = TMP_AWS_LOG_GROUP_NAMES;
  exports.SEMRESATTRS_AWS_LOG_GROUP_ARNS = TMP_AWS_LOG_GROUP_ARNS;
  exports.SEMRESATTRS_AWS_LOG_STREAM_NAMES = TMP_AWS_LOG_STREAM_NAMES;
  exports.SEMRESATTRS_AWS_LOG_STREAM_ARNS = TMP_AWS_LOG_STREAM_ARNS;
  exports.SEMRESATTRS_CONTAINER_NAME = TMP_CONTAINER_NAME;
  exports.SEMRESATTRS_CONTAINER_ID = TMP_CONTAINER_ID;
  exports.SEMRESATTRS_CONTAINER_RUNTIME = TMP_CONTAINER_RUNTIME;
  exports.SEMRESATTRS_CONTAINER_IMAGE_NAME = TMP_CONTAINER_IMAGE_NAME;
  exports.SEMRESATTRS_CONTAINER_IMAGE_TAG = TMP_CONTAINER_IMAGE_TAG;
  exports.SEMRESATTRS_DEPLOYMENT_ENVIRONMENT = TMP_DEPLOYMENT_ENVIRONMENT;
  exports.SEMRESATTRS_DEVICE_ID = TMP_DEVICE_ID;
  exports.SEMRESATTRS_DEVICE_MODEL_IDENTIFIER = TMP_DEVICE_MODEL_IDENTIFIER;
  exports.SEMRESATTRS_DEVICE_MODEL_NAME = TMP_DEVICE_MODEL_NAME;
  exports.SEMRESATTRS_FAAS_NAME = TMP_FAAS_NAME;
  exports.SEMRESATTRS_FAAS_ID = TMP_FAAS_ID;
  exports.SEMRESATTRS_FAAS_VERSION = TMP_FAAS_VERSION;
  exports.SEMRESATTRS_FAAS_INSTANCE = TMP_FAAS_INSTANCE;
  exports.SEMRESATTRS_FAAS_MAX_MEMORY = TMP_FAAS_MAX_MEMORY;
  exports.SEMRESATTRS_HOST_ID = TMP_HOST_ID;
  exports.SEMRESATTRS_HOST_NAME = TMP_HOST_NAME;
  exports.SEMRESATTRS_HOST_TYPE = TMP_HOST_TYPE;
  exports.SEMRESATTRS_HOST_ARCH = TMP_HOST_ARCH;
  exports.SEMRESATTRS_HOST_IMAGE_NAME = TMP_HOST_IMAGE_NAME;
  exports.SEMRESATTRS_HOST_IMAGE_ID = TMP_HOST_IMAGE_ID;
  exports.SEMRESATTRS_HOST_IMAGE_VERSION = TMP_HOST_IMAGE_VERSION;
  exports.SEMRESATTRS_K8S_CLUSTER_NAME = TMP_K8S_CLUSTER_NAME;
  exports.SEMRESATTRS_K8S_NODE_NAME = TMP_K8S_NODE_NAME;
  exports.SEMRESATTRS_K8S_NODE_UID = TMP_K8S_NODE_UID;
  exports.SEMRESATTRS_K8S_NAMESPACE_NAME = TMP_K8S_NAMESPACE_NAME;
  exports.SEMRESATTRS_K8S_POD_UID = TMP_K8S_POD_UID;
  exports.SEMRESATTRS_K8S_POD_NAME = TMP_K8S_POD_NAME;
  exports.SEMRESATTRS_K8S_CONTAINER_NAME = TMP_K8S_CONTAINER_NAME;
  exports.SEMRESATTRS_K8S_REPLICASET_UID = TMP_K8S_REPLICASET_UID;
  exports.SEMRESATTRS_K8S_REPLICASET_NAME = TMP_K8S_REPLICASET_NAME;
  exports.SEMRESATTRS_K8S_DEPLOYMENT_UID = TMP_K8S_DEPLOYMENT_UID;
  exports.SEMRESATTRS_K8S_DEPLOYMENT_NAME = TMP_K8S_DEPLOYMENT_NAME;
  exports.SEMRESATTRS_K8S_STATEFULSET_UID = TMP_K8S_STATEFULSET_UID;
  exports.SEMRESATTRS_K8S_STATEFULSET_NAME = TMP_K8S_STATEFULSET_NAME;
  exports.SEMRESATTRS_K8S_DAEMONSET_UID = TMP_K8S_DAEMONSET_UID;
  exports.SEMRESATTRS_K8S_DAEMONSET_NAME = TMP_K8S_DAEMONSET_NAME;
  exports.SEMRESATTRS_K8S_JOB_UID = TMP_K8S_JOB_UID;
  exports.SEMRESATTRS_K8S_JOB_NAME = TMP_K8S_JOB_NAME;
  exports.SEMRESATTRS_K8S_CRONJOB_UID = TMP_K8S_CRONJOB_UID;
  exports.SEMRESATTRS_K8S_CRONJOB_NAME = TMP_K8S_CRONJOB_NAME;
  exports.SEMRESATTRS_OS_TYPE = TMP_OS_TYPE;
  exports.SEMRESATTRS_OS_DESCRIPTION = TMP_OS_DESCRIPTION;
  exports.SEMRESATTRS_OS_NAME = TMP_OS_NAME;
  exports.SEMRESATTRS_OS_VERSION = TMP_OS_VERSION;
  exports.SEMRESATTRS_PROCESS_PID = TMP_PROCESS_PID;
  exports.SEMRESATTRS_PROCESS_EXECUTABLE_NAME = TMP_PROCESS_EXECUTABLE_NAME;
  exports.SEMRESATTRS_PROCESS_EXECUTABLE_PATH = TMP_PROCESS_EXECUTABLE_PATH;
  exports.SEMRESATTRS_PROCESS_COMMAND = TMP_PROCESS_COMMAND;
  exports.SEMRESATTRS_PROCESS_COMMAND_LINE = TMP_PROCESS_COMMAND_LINE;
  exports.SEMRESATTRS_PROCESS_COMMAND_ARGS = TMP_PROCESS_COMMAND_ARGS;
  exports.SEMRESATTRS_PROCESS_OWNER = TMP_PROCESS_OWNER;
  exports.SEMRESATTRS_PROCESS_RUNTIME_NAME = TMP_PROCESS_RUNTIME_NAME;
  exports.SEMRESATTRS_PROCESS_RUNTIME_VERSION = TMP_PROCESS_RUNTIME_VERSION;
  exports.SEMRESATTRS_PROCESS_RUNTIME_DESCRIPTION = TMP_PROCESS_RUNTIME_DESCRIPTION;
  exports.SEMRESATTRS_SERVICE_NAME = TMP_SERVICE_NAME;
  exports.SEMRESATTRS_SERVICE_NAMESPACE = TMP_SERVICE_NAMESPACE;
  exports.SEMRESATTRS_SERVICE_INSTANCE_ID = TMP_SERVICE_INSTANCE_ID;
  exports.SEMRESATTRS_SERVICE_VERSION = TMP_SERVICE_VERSION;
  exports.SEMRESATTRS_TELEMETRY_SDK_NAME = TMP_TELEMETRY_SDK_NAME;
  exports.SEMRESATTRS_TELEMETRY_SDK_LANGUAGE = TMP_TELEMETRY_SDK_LANGUAGE;
  exports.SEMRESATTRS_TELEMETRY_SDK_VERSION = TMP_TELEMETRY_SDK_VERSION;
  exports.SEMRESATTRS_TELEMETRY_AUTO_VERSION = TMP_TELEMETRY_AUTO_VERSION;
  exports.SEMRESATTRS_WEBENGINE_NAME = TMP_WEBENGINE_NAME;
  exports.SEMRESATTRS_WEBENGINE_VERSION = TMP_WEBENGINE_VERSION;
  exports.SEMRESATTRS_WEBENGINE_DESCRIPTION = TMP_WEBENGINE_DESCRIPTION;
  exports.SemanticResourceAttributes = /* @__PURE__ */ (0, utils_1.createConstMap)([
    TMP_CLOUD_PROVIDER,
    TMP_CLOUD_ACCOUNT_ID,
    TMP_CLOUD_REGION,
    TMP_CLOUD_AVAILABILITY_ZONE,
    TMP_CLOUD_PLATFORM,
    TMP_AWS_ECS_CONTAINER_ARN,
    TMP_AWS_ECS_CLUSTER_ARN,
    TMP_AWS_ECS_LAUNCHTYPE,
    TMP_AWS_ECS_TASK_ARN,
    TMP_AWS_ECS_TASK_FAMILY,
    TMP_AWS_ECS_TASK_REVISION,
    TMP_AWS_EKS_CLUSTER_ARN,
    TMP_AWS_LOG_GROUP_NAMES,
    TMP_AWS_LOG_GROUP_ARNS,
    TMP_AWS_LOG_STREAM_NAMES,
    TMP_AWS_LOG_STREAM_ARNS,
    TMP_CONTAINER_NAME,
    TMP_CONTAINER_ID,
    TMP_CONTAINER_RUNTIME,
    TMP_CONTAINER_IMAGE_NAME,
    TMP_CONTAINER_IMAGE_TAG,
    TMP_DEPLOYMENT_ENVIRONMENT,
    TMP_DEVICE_ID,
    TMP_DEVICE_MODEL_IDENTIFIER,
    TMP_DEVICE_MODEL_NAME,
    TMP_FAAS_NAME,
    TMP_FAAS_ID,
    TMP_FAAS_VERSION,
    TMP_FAAS_INSTANCE,
    TMP_FAAS_MAX_MEMORY,
    TMP_HOST_ID,
    TMP_HOST_NAME,
    TMP_HOST_TYPE,
    TMP_HOST_ARCH,
    TMP_HOST_IMAGE_NAME,
    TMP_HOST_IMAGE_ID,
    TMP_HOST_IMAGE_VERSION,
    TMP_K8S_CLUSTER_NAME,
    TMP_K8S_NODE_NAME,
    TMP_K8S_NODE_UID,
    TMP_K8S_NAMESPACE_NAME,
    TMP_K8S_POD_UID,
    TMP_K8S_POD_NAME,
    TMP_K8S_CONTAINER_NAME,
    TMP_K8S_REPLICASET_UID,
    TMP_K8S_REPLICASET_NAME,
    TMP_K8S_DEPLOYMENT_UID,
    TMP_K8S_DEPLOYMENT_NAME,
    TMP_K8S_STATEFULSET_UID,
    TMP_K8S_STATEFULSET_NAME,
    TMP_K8S_DAEMONSET_UID,
    TMP_K8S_DAEMONSET_NAME,
    TMP_K8S_JOB_UID,
    TMP_K8S_JOB_NAME,
    TMP_K8S_CRONJOB_UID,
    TMP_K8S_CRONJOB_NAME,
    TMP_OS_TYPE,
    TMP_OS_DESCRIPTION,
    TMP_OS_NAME,
    TMP_OS_VERSION,
    TMP_PROCESS_PID,
    TMP_PROCESS_EXECUTABLE_NAME,
    TMP_PROCESS_EXECUTABLE_PATH,
    TMP_PROCESS_COMMAND,
    TMP_PROCESS_COMMAND_LINE,
    TMP_PROCESS_COMMAND_ARGS,
    TMP_PROCESS_OWNER,
    TMP_PROCESS_RUNTIME_NAME,
    TMP_PROCESS_RUNTIME_VERSION,
    TMP_PROCESS_RUNTIME_DESCRIPTION,
    TMP_SERVICE_NAME,
    TMP_SERVICE_NAMESPACE,
    TMP_SERVICE_INSTANCE_ID,
    TMP_SERVICE_VERSION,
    TMP_TELEMETRY_SDK_NAME,
    TMP_TELEMETRY_SDK_LANGUAGE,
    TMP_TELEMETRY_SDK_VERSION,
    TMP_TELEMETRY_AUTO_VERSION,
    TMP_WEBENGINE_NAME,
    TMP_WEBENGINE_VERSION,
    TMP_WEBENGINE_DESCRIPTION
  ]);
  var TMP_CLOUDPROVIDERVALUES_ALIBABA_CLOUD = "alibaba_cloud";
  var TMP_CLOUDPROVIDERVALUES_AWS = "aws";
  var TMP_CLOUDPROVIDERVALUES_AZURE = "azure";
  var TMP_CLOUDPROVIDERVALUES_GCP = "gcp";
  exports.CLOUDPROVIDERVALUES_ALIBABA_CLOUD = TMP_CLOUDPROVIDERVALUES_ALIBABA_CLOUD;
  exports.CLOUDPROVIDERVALUES_AWS = TMP_CLOUDPROVIDERVALUES_AWS;
  exports.CLOUDPROVIDERVALUES_AZURE = TMP_CLOUDPROVIDERVALUES_AZURE;
  exports.CLOUDPROVIDERVALUES_GCP = TMP_CLOUDPROVIDERVALUES_GCP;
  exports.CloudProviderValues = /* @__PURE__ */ (0, utils_1.createConstMap)([
    TMP_CLOUDPROVIDERVALUES_ALIBABA_CLOUD,
    TMP_CLOUDPROVIDERVALUES_AWS,
    TMP_CLOUDPROVIDERVALUES_AZURE,
    TMP_CLOUDPROVIDERVALUES_GCP
  ]);
  var TMP_CLOUDPLATFORMVALUES_ALIBABA_CLOUD_ECS = "alibaba_cloud_ecs";
  var TMP_CLOUDPLATFORMVALUES_ALIBABA_CLOUD_FC = "alibaba_cloud_fc";
  var TMP_CLOUDPLATFORMVALUES_AWS_EC2 = "aws_ec2";
  var TMP_CLOUDPLATFORMVALUES_AWS_ECS = "aws_ecs";
  var TMP_CLOUDPLATFORMVALUES_AWS_EKS = "aws_eks";
  var TMP_CLOUDPLATFORMVALUES_AWS_LAMBDA = "aws_lambda";
  var TMP_CLOUDPLATFORMVALUES_AWS_ELASTIC_BEANSTALK = "aws_elastic_beanstalk";
  var TMP_CLOUDPLATFORMVALUES_AZURE_VM = "azure_vm";
  var TMP_CLOUDPLATFORMVALUES_AZURE_CONTAINER_INSTANCES = "azure_container_instances";
  var TMP_CLOUDPLATFORMVALUES_AZURE_AKS = "azure_aks";
  var TMP_CLOUDPLATFORMVALUES_AZURE_FUNCTIONS = "azure_functions";
  var TMP_CLOUDPLATFORMVALUES_AZURE_APP_SERVICE = "azure_app_service";
  var TMP_CLOUDPLATFORMVALUES_GCP_COMPUTE_ENGINE = "gcp_compute_engine";
  var TMP_CLOUDPLATFORMVALUES_GCP_CLOUD_RUN = "gcp_cloud_run";
  var TMP_CLOUDPLATFORMVALUES_GCP_KUBERNETES_ENGINE = "gcp_kubernetes_engine";
  var TMP_CLOUDPLATFORMVALUES_GCP_CLOUD_FUNCTIONS = "gcp_cloud_functions";
  var TMP_CLOUDPLATFORMVALUES_GCP_APP_ENGINE = "gcp_app_engine";
  exports.CLOUDPLATFORMVALUES_ALIBABA_CLOUD_ECS = TMP_CLOUDPLATFORMVALUES_ALIBABA_CLOUD_ECS;
  exports.CLOUDPLATFORMVALUES_ALIBABA_CLOUD_FC = TMP_CLOUDPLATFORMVALUES_ALIBABA_CLOUD_FC;
  exports.CLOUDPLATFORMVALUES_AWS_EC2 = TMP_CLOUDPLATFORMVALUES_AWS_EC2;
  exports.CLOUDPLATFORMVALUES_AWS_ECS = TMP_CLOUDPLATFORMVALUES_AWS_ECS;
  exports.CLOUDPLATFORMVALUES_AWS_EKS = TMP_CLOUDPLATFORMVALUES_AWS_EKS;
  exports.CLOUDPLATFORMVALUES_AWS_LAMBDA = TMP_CLOUDPLATFORMVALUES_AWS_LAMBDA;
  exports.CLOUDPLATFORMVALUES_AWS_ELASTIC_BEANSTALK = TMP_CLOUDPLATFORMVALUES_AWS_ELASTIC_BEANSTALK;
  exports.CLOUDPLATFORMVALUES_AZURE_VM = TMP_CLOUDPLATFORMVALUES_AZURE_VM;
  exports.CLOUDPLATFORMVALUES_AZURE_CONTAINER_INSTANCES = TMP_CLOUDPLATFORMVALUES_AZURE_CONTAINER_INSTANCES;
  exports.CLOUDPLATFORMVALUES_AZURE_AKS = TMP_CLOUDPLATFORMVALUES_AZURE_AKS;
  exports.CLOUDPLATFORMVALUES_AZURE_FUNCTIONS = TMP_CLOUDPLATFORMVALUES_AZURE_FUNCTIONS;
  exports.CLOUDPLATFORMVALUES_AZURE_APP_SERVICE = TMP_CLOUDPLATFORMVALUES_AZURE_APP_SERVICE;
  exports.CLOUDPLATFORMVALUES_GCP_COMPUTE_ENGINE = TMP_CLOUDPLATFORMVALUES_GCP_COMPUTE_ENGINE;
  exports.CLOUDPLATFORMVALUES_GCP_CLOUD_RUN = TMP_CLOUDPLATFORMVALUES_GCP_CLOUD_RUN;
  exports.CLOUDPLATFORMVALUES_GCP_KUBERNETES_ENGINE = TMP_CLOUDPLATFORMVALUES_GCP_KUBERNETES_ENGINE;
  exports.CLOUDPLATFORMVALUES_GCP_CLOUD_FUNCTIONS = TMP_CLOUDPLATFORMVALUES_GCP_CLOUD_FUNCTIONS;
  exports.CLOUDPLATFORMVALUES_GCP_APP_ENGINE = TMP_CLOUDPLATFORMVALUES_GCP_APP_ENGINE;
  exports.CloudPlatformValues = /* @__PURE__ */ (0, utils_1.createConstMap)([
    TMP_CLOUDPLATFORMVALUES_ALIBABA_CLOUD_ECS,
    TMP_CLOUDPLATFORMVALUES_ALIBABA_CLOUD_FC,
    TMP_CLOUDPLATFORMVALUES_AWS_EC2,
    TMP_CLOUDPLATFORMVALUES_AWS_ECS,
    TMP_CLOUDPLATFORMVALUES_AWS_EKS,
    TMP_CLOUDPLATFORMVALUES_AWS_LAMBDA,
    TMP_CLOUDPLATFORMVALUES_AWS_ELASTIC_BEANSTALK,
    TMP_CLOUDPLATFORMVALUES_AZURE_VM,
    TMP_CLOUDPLATFORMVALUES_AZURE_CONTAINER_INSTANCES,
    TMP_CLOUDPLATFORMVALUES_AZURE_AKS,
    TMP_CLOUDPLATFORMVALUES_AZURE_FUNCTIONS,
    TMP_CLOUDPLATFORMVALUES_AZURE_APP_SERVICE,
    TMP_CLOUDPLATFORMVALUES_GCP_COMPUTE_ENGINE,
    TMP_CLOUDPLATFORMVALUES_GCP_CLOUD_RUN,
    TMP_CLOUDPLATFORMVALUES_GCP_KUBERNETES_ENGINE,
    TMP_CLOUDPLATFORMVALUES_GCP_CLOUD_FUNCTIONS,
    TMP_CLOUDPLATFORMVALUES_GCP_APP_ENGINE
  ]);
  var TMP_AWSECSLAUNCHTYPEVALUES_EC2 = "ec2";
  var TMP_AWSECSLAUNCHTYPEVALUES_FARGATE = "fargate";
  exports.AWSECSLAUNCHTYPEVALUES_EC2 = TMP_AWSECSLAUNCHTYPEVALUES_EC2;
  exports.AWSECSLAUNCHTYPEVALUES_FARGATE = TMP_AWSECSLAUNCHTYPEVALUES_FARGATE;
  exports.AwsEcsLaunchtypeValues = /* @__PURE__ */ (0, utils_1.createConstMap)([
    TMP_AWSECSLAUNCHTYPEVALUES_EC2,
    TMP_AWSECSLAUNCHTYPEVALUES_FARGATE
  ]);
  var TMP_HOSTARCHVALUES_AMD64 = "amd64";
  var TMP_HOSTARCHVALUES_ARM32 = "arm32";
  var TMP_HOSTARCHVALUES_ARM64 = "arm64";
  var TMP_HOSTARCHVALUES_IA64 = "ia64";
  var TMP_HOSTARCHVALUES_PPC32 = "ppc32";
  var TMP_HOSTARCHVALUES_PPC64 = "ppc64";
  var TMP_HOSTARCHVALUES_X86 = "x86";
  exports.HOSTARCHVALUES_AMD64 = TMP_HOSTARCHVALUES_AMD64;
  exports.HOSTARCHVALUES_ARM32 = TMP_HOSTARCHVALUES_ARM32;
  exports.HOSTARCHVALUES_ARM64 = TMP_HOSTARCHVALUES_ARM64;
  exports.HOSTARCHVALUES_IA64 = TMP_HOSTARCHVALUES_IA64;
  exports.HOSTARCHVALUES_PPC32 = TMP_HOSTARCHVALUES_PPC32;
  exports.HOSTARCHVALUES_PPC64 = TMP_HOSTARCHVALUES_PPC64;
  exports.HOSTARCHVALUES_X86 = TMP_HOSTARCHVALUES_X86;
  exports.HostArchValues = /* @__PURE__ */ (0, utils_1.createConstMap)([
    TMP_HOSTARCHVALUES_AMD64,
    TMP_HOSTARCHVALUES_ARM32,
    TMP_HOSTARCHVALUES_ARM64,
    TMP_HOSTARCHVALUES_IA64,
    TMP_HOSTARCHVALUES_PPC32,
    TMP_HOSTARCHVALUES_PPC64,
    TMP_HOSTARCHVALUES_X86
  ]);
  var TMP_OSTYPEVALUES_WINDOWS = "windows";
  var TMP_OSTYPEVALUES_LINUX = "linux";
  var TMP_OSTYPEVALUES_DARWIN = "darwin";
  var TMP_OSTYPEVALUES_FREEBSD = "freebsd";
  var TMP_OSTYPEVALUES_NETBSD = "netbsd";
  var TMP_OSTYPEVALUES_OPENBSD = "openbsd";
  var TMP_OSTYPEVALUES_DRAGONFLYBSD = "dragonflybsd";
  var TMP_OSTYPEVALUES_HPUX = "hpux";
  var TMP_OSTYPEVALUES_AIX = "aix";
  var TMP_OSTYPEVALUES_SOLARIS = "solaris";
  var TMP_OSTYPEVALUES_Z_OS = "z_os";
  exports.OSTYPEVALUES_WINDOWS = TMP_OSTYPEVALUES_WINDOWS;
  exports.OSTYPEVALUES_LINUX = TMP_OSTYPEVALUES_LINUX;
  exports.OSTYPEVALUES_DARWIN = TMP_OSTYPEVALUES_DARWIN;
  exports.OSTYPEVALUES_FREEBSD = TMP_OSTYPEVALUES_FREEBSD;
  exports.OSTYPEVALUES_NETBSD = TMP_OSTYPEVALUES_NETBSD;
  exports.OSTYPEVALUES_OPENBSD = TMP_OSTYPEVALUES_OPENBSD;
  exports.OSTYPEVALUES_DRAGONFLYBSD = TMP_OSTYPEVALUES_DRAGONFLYBSD;
  exports.OSTYPEVALUES_HPUX = TMP_OSTYPEVALUES_HPUX;
  exports.OSTYPEVALUES_AIX = TMP_OSTYPEVALUES_AIX;
  exports.OSTYPEVALUES_SOLARIS = TMP_OSTYPEVALUES_SOLARIS;
  exports.OSTYPEVALUES_Z_OS = TMP_OSTYPEVALUES_Z_OS;
  exports.OsTypeValues = /* @__PURE__ */ (0, utils_1.createConstMap)([
    TMP_OSTYPEVALUES_WINDOWS,
    TMP_OSTYPEVALUES_LINUX,
    TMP_OSTYPEVALUES_DARWIN,
    TMP_OSTYPEVALUES_FREEBSD,
    TMP_OSTYPEVALUES_NETBSD,
    TMP_OSTYPEVALUES_OPENBSD,
    TMP_OSTYPEVALUES_DRAGONFLYBSD,
    TMP_OSTYPEVALUES_HPUX,
    TMP_OSTYPEVALUES_AIX,
    TMP_OSTYPEVALUES_SOLARIS,
    TMP_OSTYPEVALUES_Z_OS
  ]);
  var TMP_TELEMETRYSDKLANGUAGEVALUES_CPP = "cpp";
  var TMP_TELEMETRYSDKLANGUAGEVALUES_DOTNET = "dotnet";
  var TMP_TELEMETRYSDKLANGUAGEVALUES_ERLANG = "erlang";
  var TMP_TELEMETRYSDKLANGUAGEVALUES_GO = "go";
  var TMP_TELEMETRYSDKLANGUAGEVALUES_JAVA = "java";
  var TMP_TELEMETRYSDKLANGUAGEVALUES_NODEJS = "nodejs";
  var TMP_TELEMETRYSDKLANGUAGEVALUES_PHP = "php";
  var TMP_TELEMETRYSDKLANGUAGEVALUES_PYTHON = "python";
  var TMP_TELEMETRYSDKLANGUAGEVALUES_RUBY = "ruby";
  var TMP_TELEMETRYSDKLANGUAGEVALUES_WEBJS = "webjs";
  exports.TELEMETRYSDKLANGUAGEVALUES_CPP = TMP_TELEMETRYSDKLANGUAGEVALUES_CPP;
  exports.TELEMETRYSDKLANGUAGEVALUES_DOTNET = TMP_TELEMETRYSDKLANGUAGEVALUES_DOTNET;
  exports.TELEMETRYSDKLANGUAGEVALUES_ERLANG = TMP_TELEMETRYSDKLANGUAGEVALUES_ERLANG;
  exports.TELEMETRYSDKLANGUAGEVALUES_GO = TMP_TELEMETRYSDKLANGUAGEVALUES_GO;
  exports.TELEMETRYSDKLANGUAGEVALUES_JAVA = TMP_TELEMETRYSDKLANGUAGEVALUES_JAVA;
  exports.TELEMETRYSDKLANGUAGEVALUES_NODEJS = TMP_TELEMETRYSDKLANGUAGEVALUES_NODEJS;
  exports.TELEMETRYSDKLANGUAGEVALUES_PHP = TMP_TELEMETRYSDKLANGUAGEVALUES_PHP;
  exports.TELEMETRYSDKLANGUAGEVALUES_PYTHON = TMP_TELEMETRYSDKLANGUAGEVALUES_PYTHON;
  exports.TELEMETRYSDKLANGUAGEVALUES_RUBY = TMP_TELEMETRYSDKLANGUAGEVALUES_RUBY;
  exports.TELEMETRYSDKLANGUAGEVALUES_WEBJS = TMP_TELEMETRYSDKLANGUAGEVALUES_WEBJS;
  exports.TelemetrySdkLanguageValues = /* @__PURE__ */ (0, utils_1.createConstMap)([
    TMP_TELEMETRYSDKLANGUAGEVALUES_CPP,
    TMP_TELEMETRYSDKLANGUAGEVALUES_DOTNET,
    TMP_TELEMETRYSDKLANGUAGEVALUES_ERLANG,
    TMP_TELEMETRYSDKLANGUAGEVALUES_GO,
    TMP_TELEMETRYSDKLANGUAGEVALUES_JAVA,
    TMP_TELEMETRYSDKLANGUAGEVALUES_NODEJS,
    TMP_TELEMETRYSDKLANGUAGEVALUES_PHP,
    TMP_TELEMETRYSDKLANGUAGEVALUES_PYTHON,
    TMP_TELEMETRYSDKLANGUAGEVALUES_RUBY,
    TMP_TELEMETRYSDKLANGUAGEVALUES_WEBJS
  ]);
});

// node_modules/@opentelemetry/sdk-trace-base/node_modules/@opentelemetry/semantic-conventions/build/src/resource/index.js
var require_resource2 = __commonJS((exports) => {
  var __createBinding = exports && exports.__createBinding || (Object.create ? function(o, m, k, k2) {
    if (k2 === undefined)
      k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() {
      return m[k];
    } });
  } : function(o, m, k, k2) {
    if (k2 === undefined)
      k2 = k;
    o[k2] = m[k];
  });
  var __exportStar = exports && exports.__exportStar || function(m, exports2) {
    for (var p in m)
      if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p))
        __createBinding(exports2, m, p);
  };
  Object.defineProperty(exports, "__esModule", { value: true });
  __exportStar(require_SemanticResourceAttributes2(), exports);
});

// node_modules/@opentelemetry/sdk-trace-base/node_modules/@opentelemetry/semantic-conventions/build/src/stable_attributes.js
var require_stable_attributes2 = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.HTTP_REQUEST_METHOD_VALUE_POST = exports.HTTP_REQUEST_METHOD_VALUE_PATCH = exports.HTTP_REQUEST_METHOD_VALUE_OPTIONS = exports.HTTP_REQUEST_METHOD_VALUE_HEAD = exports.HTTP_REQUEST_METHOD_VALUE_GET = exports.HTTP_REQUEST_METHOD_VALUE_DELETE = exports.HTTP_REQUEST_METHOD_VALUE_CONNECT = exports.HTTP_REQUEST_METHOD_VALUE_OTHER = exports.ATTR_HTTP_REQUEST_METHOD = exports.ATTR_HTTP_REQUEST_HEADER = exports.ATTR_EXCEPTION_TYPE = exports.ATTR_EXCEPTION_STACKTRACE = exports.ATTR_EXCEPTION_MESSAGE = exports.ATTR_EXCEPTION_ESCAPED = exports.ERROR_TYPE_VALUE_OTHER = exports.ATTR_ERROR_TYPE = exports.ATTR_CLIENT_PORT = exports.ATTR_CLIENT_ADDRESS = exports.ASPNETCORE_ROUTING_MATCH_STATUS_VALUE_SUCCESS = exports.ASPNETCORE_ROUTING_MATCH_STATUS_VALUE_FAILURE = exports.ATTR_ASPNETCORE_ROUTING_MATCH_STATUS = exports.ATTR_ASPNETCORE_ROUTING_IS_FALLBACK = exports.ATTR_ASPNETCORE_REQUEST_IS_UNHANDLED = exports.ATTR_ASPNETCORE_RATE_LIMITING_POLICY = exports.ASPNETCORE_DIAGNOSTICS_EXCEPTION_RESULT_VALUE_UNHANDLED = exports.ASPNETCORE_DIAGNOSTICS_EXCEPTION_RESULT_VALUE_SKIPPED = exports.ASPNETCORE_DIAGNOSTICS_EXCEPTION_RESULT_VALUE_HANDLED = exports.ASPNETCORE_DIAGNOSTICS_EXCEPTION_RESULT_VALUE_ABORTED = exports.ATTR_ASPNETCORE_DIAGNOSTICS_EXCEPTION_RESULT = exports.ATTR_ASPNETCORE_DIAGNOSTICS_HANDLER_TYPE = exports.ATTR_TELEMETRY_SDK_VERSION = exports.ATTR_TELEMETRY_SDK_NAME = exports.TELEMETRY_SDK_LANGUAGE_VALUE_WEBJS = exports.TELEMETRY_SDK_LANGUAGE_VALUE_SWIFT = exports.TELEMETRY_SDK_LANGUAGE_VALUE_RUST = exports.TELEMETRY_SDK_LANGUAGE_VALUE_RUBY = exports.TELEMETRY_SDK_LANGUAGE_VALUE_PYTHON = exports.TELEMETRY_SDK_LANGUAGE_VALUE_PHP = exports.TELEMETRY_SDK_LANGUAGE_VALUE_NODEJS = exports.TELEMETRY_SDK_LANGUAGE_VALUE_JAVA = exports.TELEMETRY_SDK_LANGUAGE_VALUE_GO = exports.TELEMETRY_SDK_LANGUAGE_VALUE_ERLANG = exports.TELEMETRY_SDK_LANGUAGE_VALUE_DOTNET = exports.TELEMETRY_SDK_LANGUAGE_VALUE_CPP = exports.ATTR_TELEMETRY_SDK_LANGUAGE = exports.ASPNETCORE_RATE_LIMITING_RESULT_VALUE_REQUEST_CANCELED = exports.ASPNETCORE_RATE_LIMITING_RESULT_VALUE_GLOBAL_LIMITER = exports.ASPNETCORE_RATE_LIMITING_RESULT_VALUE_ENDPOINT_LIMITER = exports.ASPNETCORE_RATE_LIMITING_RESULT_VALUE_ACQUIRED = exports.ATTR_ASPNETCORE_RATE_LIMITING_RESULT = undefined;
  exports.SIGNALR_CONNECTION_STATUS_VALUE_TIMEOUT = exports.SIGNALR_CONNECTION_STATUS_VALUE_NORMAL_CLOSURE = exports.SIGNALR_CONNECTION_STATUS_VALUE_APP_SHUTDOWN = exports.ATTR_SIGNALR_CONNECTION_STATUS = exports.ATTR_SERVICE_VERSION = exports.ATTR_SERVICE_NAME = exports.ATTR_SERVER_PORT = exports.ATTR_SERVER_ADDRESS = exports.ATTR_OTEL_STATUS_DESCRIPTION = exports.OTEL_STATUS_CODE_VALUE_OK = exports.OTEL_STATUS_CODE_VALUE_ERROR = exports.ATTR_OTEL_STATUS_CODE = exports.ATTR_OTEL_SCOPE_VERSION = exports.ATTR_OTEL_SCOPE_NAME = exports.NETWORK_TYPE_VALUE_IPV6 = exports.NETWORK_TYPE_VALUE_IPV4 = exports.ATTR_NETWORK_TYPE = exports.NETWORK_TRANSPORT_VALUE_UNIX = exports.NETWORK_TRANSPORT_VALUE_UDP = exports.NETWORK_TRANSPORT_VALUE_TCP = exports.NETWORK_TRANSPORT_VALUE_QUIC = exports.NETWORK_TRANSPORT_VALUE_PIPE = exports.ATTR_NETWORK_TRANSPORT = exports.ATTR_NETWORK_PROTOCOL_VERSION = exports.ATTR_NETWORK_PROTOCOL_NAME = exports.ATTR_NETWORK_PEER_PORT = exports.ATTR_NETWORK_PEER_ADDRESS = exports.ATTR_NETWORK_LOCAL_PORT = exports.ATTR_NETWORK_LOCAL_ADDRESS = exports.JVM_THREAD_STATE_VALUE_WAITING = exports.JVM_THREAD_STATE_VALUE_TIMED_WAITING = exports.JVM_THREAD_STATE_VALUE_TERMINATED = exports.JVM_THREAD_STATE_VALUE_RUNNABLE = exports.JVM_THREAD_STATE_VALUE_NEW = exports.JVM_THREAD_STATE_VALUE_BLOCKED = exports.ATTR_JVM_THREAD_STATE = exports.ATTR_JVM_THREAD_DAEMON = exports.JVM_MEMORY_TYPE_VALUE_NON_HEAP = exports.JVM_MEMORY_TYPE_VALUE_HEAP = exports.ATTR_JVM_MEMORY_TYPE = exports.ATTR_JVM_MEMORY_POOL_NAME = exports.ATTR_JVM_GC_NAME = exports.ATTR_JVM_GC_ACTION = exports.ATTR_HTTP_ROUTE = exports.ATTR_HTTP_RESPONSE_STATUS_CODE = exports.ATTR_HTTP_RESPONSE_HEADER = exports.ATTR_HTTP_REQUEST_RESEND_COUNT = exports.ATTR_HTTP_REQUEST_METHOD_ORIGINAL = exports.HTTP_REQUEST_METHOD_VALUE_TRACE = exports.HTTP_REQUEST_METHOD_VALUE_PUT = undefined;
  exports.ATTR_USER_AGENT_ORIGINAL = exports.ATTR_URL_SCHEME = exports.ATTR_URL_QUERY = exports.ATTR_URL_PATH = exports.ATTR_URL_FULL = exports.ATTR_URL_FRAGMENT = exports.SIGNALR_TRANSPORT_VALUE_WEB_SOCKETS = exports.SIGNALR_TRANSPORT_VALUE_SERVER_SENT_EVENTS = exports.SIGNALR_TRANSPORT_VALUE_LONG_POLLING = exports.ATTR_SIGNALR_TRANSPORT = undefined;
  exports.ATTR_ASPNETCORE_RATE_LIMITING_RESULT = "aspnetcore.rate_limiting.result";
  exports.ASPNETCORE_RATE_LIMITING_RESULT_VALUE_ACQUIRED = "acquired";
  exports.ASPNETCORE_RATE_LIMITING_RESULT_VALUE_ENDPOINT_LIMITER = "endpoint_limiter";
  exports.ASPNETCORE_RATE_LIMITING_RESULT_VALUE_GLOBAL_LIMITER = "global_limiter";
  exports.ASPNETCORE_RATE_LIMITING_RESULT_VALUE_REQUEST_CANCELED = "request_canceled";
  exports.ATTR_TELEMETRY_SDK_LANGUAGE = "telemetry.sdk.language";
  exports.TELEMETRY_SDK_LANGUAGE_VALUE_CPP = "cpp";
  exports.TELEMETRY_SDK_LANGUAGE_VALUE_DOTNET = "dotnet";
  exports.TELEMETRY_SDK_LANGUAGE_VALUE_ERLANG = "erlang";
  exports.TELEMETRY_SDK_LANGUAGE_VALUE_GO = "go";
  exports.TELEMETRY_SDK_LANGUAGE_VALUE_JAVA = "java";
  exports.TELEMETRY_SDK_LANGUAGE_VALUE_NODEJS = "nodejs";
  exports.TELEMETRY_SDK_LANGUAGE_VALUE_PHP = "php";
  exports.TELEMETRY_SDK_LANGUAGE_VALUE_PYTHON = "python";
  exports.TELEMETRY_SDK_LANGUAGE_VALUE_RUBY = "ruby";
  exports.TELEMETRY_SDK_LANGUAGE_VALUE_RUST = "rust";
  exports.TELEMETRY_SDK_LANGUAGE_VALUE_SWIFT = "swift";
  exports.TELEMETRY_SDK_LANGUAGE_VALUE_WEBJS = "webjs";
  exports.ATTR_TELEMETRY_SDK_NAME = "telemetry.sdk.name";
  exports.ATTR_TELEMETRY_SDK_VERSION = "telemetry.sdk.version";
  exports.ATTR_ASPNETCORE_DIAGNOSTICS_HANDLER_TYPE = "aspnetcore.diagnostics.handler.type";
  exports.ATTR_ASPNETCORE_DIAGNOSTICS_EXCEPTION_RESULT = "aspnetcore.diagnostics.exception.result";
  exports.ASPNETCORE_DIAGNOSTICS_EXCEPTION_RESULT_VALUE_ABORTED = "aborted";
  exports.ASPNETCORE_DIAGNOSTICS_EXCEPTION_RESULT_VALUE_HANDLED = "handled";
  exports.ASPNETCORE_DIAGNOSTICS_EXCEPTION_RESULT_VALUE_SKIPPED = "skipped";
  exports.ASPNETCORE_DIAGNOSTICS_EXCEPTION_RESULT_VALUE_UNHANDLED = "unhandled";
  exports.ATTR_ASPNETCORE_RATE_LIMITING_POLICY = "aspnetcore.rate_limiting.policy";
  exports.ATTR_ASPNETCORE_REQUEST_IS_UNHANDLED = "aspnetcore.request.is_unhandled";
  exports.ATTR_ASPNETCORE_ROUTING_IS_FALLBACK = "aspnetcore.routing.is_fallback";
  exports.ATTR_ASPNETCORE_ROUTING_MATCH_STATUS = "aspnetcore.routing.match_status";
  exports.ASPNETCORE_ROUTING_MATCH_STATUS_VALUE_FAILURE = "failure";
  exports.ASPNETCORE_ROUTING_MATCH_STATUS_VALUE_SUCCESS = "success";
  exports.ATTR_CLIENT_ADDRESS = "client.address";
  exports.ATTR_CLIENT_PORT = "client.port";
  exports.ATTR_ERROR_TYPE = "error.type";
  exports.ERROR_TYPE_VALUE_OTHER = "_OTHER";
  exports.ATTR_EXCEPTION_ESCAPED = "exception.escaped";
  exports.ATTR_EXCEPTION_MESSAGE = "exception.message";
  exports.ATTR_EXCEPTION_STACKTRACE = "exception.stacktrace";
  exports.ATTR_EXCEPTION_TYPE = "exception.type";
  var ATTR_HTTP_REQUEST_HEADER = (key) => `http.request.header.${key}`;
  exports.ATTR_HTTP_REQUEST_HEADER = ATTR_HTTP_REQUEST_HEADER;
  exports.ATTR_HTTP_REQUEST_METHOD = "http.request.method";
  exports.HTTP_REQUEST_METHOD_VALUE_OTHER = "_OTHER";
  exports.HTTP_REQUEST_METHOD_VALUE_CONNECT = "CONNECT";
  exports.HTTP_REQUEST_METHOD_VALUE_DELETE = "DELETE";
  exports.HTTP_REQUEST_METHOD_VALUE_GET = "GET";
  exports.HTTP_REQUEST_METHOD_VALUE_HEAD = "HEAD";
  exports.HTTP_REQUEST_METHOD_VALUE_OPTIONS = "OPTIONS";
  exports.HTTP_REQUEST_METHOD_VALUE_PATCH = "PATCH";
  exports.HTTP_REQUEST_METHOD_VALUE_POST = "POST";
  exports.HTTP_REQUEST_METHOD_VALUE_PUT = "PUT";
  exports.HTTP_REQUEST_METHOD_VALUE_TRACE = "TRACE";
  exports.ATTR_HTTP_REQUEST_METHOD_ORIGINAL = "http.request.method_original";
  exports.ATTR_HTTP_REQUEST_RESEND_COUNT = "http.request.resend_count";
  var ATTR_HTTP_RESPONSE_HEADER = (key) => `http.response.header.${key}`;
  exports.ATTR_HTTP_RESPONSE_HEADER = ATTR_HTTP_RESPONSE_HEADER;
  exports.ATTR_HTTP_RESPONSE_STATUS_CODE = "http.response.status_code";
  exports.ATTR_HTTP_ROUTE = "http.route";
  exports.ATTR_JVM_GC_ACTION = "jvm.gc.action";
  exports.ATTR_JVM_GC_NAME = "jvm.gc.name";
  exports.ATTR_JVM_MEMORY_POOL_NAME = "jvm.memory.pool.name";
  exports.ATTR_JVM_MEMORY_TYPE = "jvm.memory.type";
  exports.JVM_MEMORY_TYPE_VALUE_HEAP = "heap";
  exports.JVM_MEMORY_TYPE_VALUE_NON_HEAP = "non_heap";
  exports.ATTR_JVM_THREAD_DAEMON = "jvm.thread.daemon";
  exports.ATTR_JVM_THREAD_STATE = "jvm.thread.state";
  exports.JVM_THREAD_STATE_VALUE_BLOCKED = "blocked";
  exports.JVM_THREAD_STATE_VALUE_NEW = "new";
  exports.JVM_THREAD_STATE_VALUE_RUNNABLE = "runnable";
  exports.JVM_THREAD_STATE_VALUE_TERMINATED = "terminated";
  exports.JVM_THREAD_STATE_VALUE_TIMED_WAITING = "timed_waiting";
  exports.JVM_THREAD_STATE_VALUE_WAITING = "waiting";
  exports.ATTR_NETWORK_LOCAL_ADDRESS = "network.local.address";
  exports.ATTR_NETWORK_LOCAL_PORT = "network.local.port";
  exports.ATTR_NETWORK_PEER_ADDRESS = "network.peer.address";
  exports.ATTR_NETWORK_PEER_PORT = "network.peer.port";
  exports.ATTR_NETWORK_PROTOCOL_NAME = "network.protocol.name";
  exports.ATTR_NETWORK_PROTOCOL_VERSION = "network.protocol.version";
  exports.ATTR_NETWORK_TRANSPORT = "network.transport";
  exports.NETWORK_TRANSPORT_VALUE_PIPE = "pipe";
  exports.NETWORK_TRANSPORT_VALUE_QUIC = "quic";
  exports.NETWORK_TRANSPORT_VALUE_TCP = "tcp";
  exports.NETWORK_TRANSPORT_VALUE_UDP = "udp";
  exports.NETWORK_TRANSPORT_VALUE_UNIX = "unix";
  exports.ATTR_NETWORK_TYPE = "network.type";
  exports.NETWORK_TYPE_VALUE_IPV4 = "ipv4";
  exports.NETWORK_TYPE_VALUE_IPV6 = "ipv6";
  exports.ATTR_OTEL_SCOPE_NAME = "otel.scope.name";
  exports.ATTR_OTEL_SCOPE_VERSION = "otel.scope.version";
  exports.ATTR_OTEL_STATUS_CODE = "otel.status_code";
  exports.OTEL_STATUS_CODE_VALUE_ERROR = "ERROR";
  exports.OTEL_STATUS_CODE_VALUE_OK = "OK";
  exports.ATTR_OTEL_STATUS_DESCRIPTION = "otel.status_description";
  exports.ATTR_SERVER_ADDRESS = "server.address";
  exports.ATTR_SERVER_PORT = "server.port";
  exports.ATTR_SERVICE_NAME = "service.name";
  exports.ATTR_SERVICE_VERSION = "service.version";
  exports.ATTR_SIGNALR_CONNECTION_STATUS = "signalr.connection.status";
  exports.SIGNALR_CONNECTION_STATUS_VALUE_APP_SHUTDOWN = "app_shutdown";
  exports.SIGNALR_CONNECTION_STATUS_VALUE_NORMAL_CLOSURE = "normal_closure";
  exports.SIGNALR_CONNECTION_STATUS_VALUE_TIMEOUT = "timeout";
  exports.ATTR_SIGNALR_TRANSPORT = "signalr.transport";
  exports.SIGNALR_TRANSPORT_VALUE_LONG_POLLING = "long_polling";
  exports.SIGNALR_TRANSPORT_VALUE_SERVER_SENT_EVENTS = "server_sent_events";
  exports.SIGNALR_TRANSPORT_VALUE_WEB_SOCKETS = "web_sockets";
  exports.ATTR_URL_FRAGMENT = "url.fragment";
  exports.ATTR_URL_FULL = "url.full";
  exports.ATTR_URL_PATH = "url.path";
  exports.ATTR_URL_QUERY = "url.query";
  exports.ATTR_URL_SCHEME = "url.scheme";
  exports.ATTR_USER_AGENT_ORIGINAL = "user_agent.original";
});

// node_modules/@opentelemetry/sdk-trace-base/node_modules/@opentelemetry/semantic-conventions/build/src/stable_metrics.js
var require_stable_metrics2 = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.METRIC_SIGNALR_SERVER_CONNECTION_DURATION = exports.METRIC_SIGNALR_SERVER_ACTIVE_CONNECTIONS = exports.METRIC_KESTREL_UPGRADED_CONNECTIONS = exports.METRIC_KESTREL_TLS_HANDSHAKE_DURATION = exports.METRIC_KESTREL_REJECTED_CONNECTIONS = exports.METRIC_KESTREL_QUEUED_REQUESTS = exports.METRIC_KESTREL_QUEUED_CONNECTIONS = exports.METRIC_KESTREL_CONNECTION_DURATION = exports.METRIC_KESTREL_ACTIVE_TLS_HANDSHAKES = exports.METRIC_KESTREL_ACTIVE_CONNECTIONS = exports.METRIC_JVM_THREAD_COUNT = exports.METRIC_JVM_MEMORY_USED_AFTER_LAST_GC = exports.METRIC_JVM_MEMORY_USED = exports.METRIC_JVM_MEMORY_LIMIT = exports.METRIC_JVM_MEMORY_COMMITTED = exports.METRIC_JVM_GC_DURATION = exports.METRIC_JVM_CPU_TIME = exports.METRIC_JVM_CPU_RECENT_UTILIZATION = exports.METRIC_JVM_CPU_COUNT = exports.METRIC_JVM_CLASS_UNLOADED = exports.METRIC_JVM_CLASS_LOADED = exports.METRIC_JVM_CLASS_COUNT = exports.METRIC_HTTP_SERVER_REQUEST_DURATION = exports.METRIC_HTTP_CLIENT_REQUEST_DURATION = exports.METRIC_ASPNETCORE_ROUTING_MATCH_ATTEMPTS = exports.METRIC_ASPNETCORE_RATE_LIMITING_REQUESTS = exports.METRIC_ASPNETCORE_RATE_LIMITING_REQUEST_LEASE_DURATION = exports.METRIC_ASPNETCORE_RATE_LIMITING_REQUEST_TIME_IN_QUEUE = exports.METRIC_ASPNETCORE_RATE_LIMITING_QUEUED_REQUESTS = exports.METRIC_ASPNETCORE_RATE_LIMITING_ACTIVE_REQUEST_LEASES = exports.METRIC_ASPNETCORE_DIAGNOSTICS_EXCEPTIONS = undefined;
  exports.METRIC_ASPNETCORE_DIAGNOSTICS_EXCEPTIONS = "aspnetcore.diagnostics.exceptions";
  exports.METRIC_ASPNETCORE_RATE_LIMITING_ACTIVE_REQUEST_LEASES = "aspnetcore.rate_limiting.active_request_leases";
  exports.METRIC_ASPNETCORE_RATE_LIMITING_QUEUED_REQUESTS = "aspnetcore.rate_limiting.queued_requests";
  exports.METRIC_ASPNETCORE_RATE_LIMITING_REQUEST_TIME_IN_QUEUE = "aspnetcore.rate_limiting.request.time_in_queue";
  exports.METRIC_ASPNETCORE_RATE_LIMITING_REQUEST_LEASE_DURATION = "aspnetcore.rate_limiting.request_lease.duration";
  exports.METRIC_ASPNETCORE_RATE_LIMITING_REQUESTS = "aspnetcore.rate_limiting.requests";
  exports.METRIC_ASPNETCORE_ROUTING_MATCH_ATTEMPTS = "aspnetcore.routing.match_attempts";
  exports.METRIC_HTTP_CLIENT_REQUEST_DURATION = "http.client.request.duration";
  exports.METRIC_HTTP_SERVER_REQUEST_DURATION = "http.server.request.duration";
  exports.METRIC_JVM_CLASS_COUNT = "jvm.class.count";
  exports.METRIC_JVM_CLASS_LOADED = "jvm.class.loaded";
  exports.METRIC_JVM_CLASS_UNLOADED = "jvm.class.unloaded";
  exports.METRIC_JVM_CPU_COUNT = "jvm.cpu.count";
  exports.METRIC_JVM_CPU_RECENT_UTILIZATION = "jvm.cpu.recent_utilization";
  exports.METRIC_JVM_CPU_TIME = "jvm.cpu.time";
  exports.METRIC_JVM_GC_DURATION = "jvm.gc.duration";
  exports.METRIC_JVM_MEMORY_COMMITTED = "jvm.memory.committed";
  exports.METRIC_JVM_MEMORY_LIMIT = "jvm.memory.limit";
  exports.METRIC_JVM_MEMORY_USED = "jvm.memory.used";
  exports.METRIC_JVM_MEMORY_USED_AFTER_LAST_GC = "jvm.memory.used_after_last_gc";
  exports.METRIC_JVM_THREAD_COUNT = "jvm.thread.count";
  exports.METRIC_KESTREL_ACTIVE_CONNECTIONS = "kestrel.active_connections";
  exports.METRIC_KESTREL_ACTIVE_TLS_HANDSHAKES = "kestrel.active_tls_handshakes";
  exports.METRIC_KESTREL_CONNECTION_DURATION = "kestrel.connection.duration";
  exports.METRIC_KESTREL_QUEUED_CONNECTIONS = "kestrel.queued_connections";
  exports.METRIC_KESTREL_QUEUED_REQUESTS = "kestrel.queued_requests";
  exports.METRIC_KESTREL_REJECTED_CONNECTIONS = "kestrel.rejected_connections";
  exports.METRIC_KESTREL_TLS_HANDSHAKE_DURATION = "kestrel.tls_handshake.duration";
  exports.METRIC_KESTREL_UPGRADED_CONNECTIONS = "kestrel.upgraded_connections";
  exports.METRIC_SIGNALR_SERVER_ACTIVE_CONNECTIONS = "signalr.server.active_connections";
  exports.METRIC_SIGNALR_SERVER_CONNECTION_DURATION = "signalr.server.connection.duration";
});

// node_modules/@opentelemetry/sdk-trace-base/node_modules/@opentelemetry/semantic-conventions/build/src/index.js
var require_src4 = __commonJS((exports) => {
  var __createBinding = exports && exports.__createBinding || (Object.create ? function(o, m, k, k2) {
    if (k2 === undefined)
      k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() {
      return m[k];
    } });
  } : function(o, m, k, k2) {
    if (k2 === undefined)
      k2 = k;
    o[k2] = m[k];
  });
  var __exportStar = exports && exports.__exportStar || function(m, exports2) {
    for (var p in m)
      if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p))
        __createBinding(exports2, m, p);
  };
  Object.defineProperty(exports, "__esModule", { value: true });
  __exportStar(require_trace3(), exports);
  __exportStar(require_resource2(), exports);
  __exportStar(require_stable_attributes2(), exports);
  __exportStar(require_stable_metrics2(), exports);
});

// node_modules/@opentelemetry/resources/node_modules/@opentelemetry/semantic-conventions/build/src/internal/utils.js
var require_utils6 = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.createConstMap = undefined;
  function createConstMap(values) {
    let res = {};
    const len = values.length;
    for (let lp = 0;lp < len; lp++) {
      const val = values[lp];
      if (val) {
        res[String(val).toUpperCase().replace(/[-.]/g, "_")] = val;
      }
    }
    return res;
  }
  exports.createConstMap = createConstMap;
});

// node_modules/@opentelemetry/resources/node_modules/@opentelemetry/semantic-conventions/build/src/trace/SemanticAttributes.js
var require_SemanticAttributes3 = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.SEMATTRS_NET_HOST_CARRIER_ICC = exports.SEMATTRS_NET_HOST_CARRIER_MNC = exports.SEMATTRS_NET_HOST_CARRIER_MCC = exports.SEMATTRS_NET_HOST_CARRIER_NAME = exports.SEMATTRS_NET_HOST_CONNECTION_SUBTYPE = exports.SEMATTRS_NET_HOST_CONNECTION_TYPE = exports.SEMATTRS_NET_HOST_NAME = exports.SEMATTRS_NET_HOST_PORT = exports.SEMATTRS_NET_HOST_IP = exports.SEMATTRS_NET_PEER_NAME = exports.SEMATTRS_NET_PEER_PORT = exports.SEMATTRS_NET_PEER_IP = exports.SEMATTRS_NET_TRANSPORT = exports.SEMATTRS_FAAS_INVOKED_REGION = exports.SEMATTRS_FAAS_INVOKED_PROVIDER = exports.SEMATTRS_FAAS_INVOKED_NAME = exports.SEMATTRS_FAAS_COLDSTART = exports.SEMATTRS_FAAS_CRON = exports.SEMATTRS_FAAS_TIME = exports.SEMATTRS_FAAS_DOCUMENT_NAME = exports.SEMATTRS_FAAS_DOCUMENT_TIME = exports.SEMATTRS_FAAS_DOCUMENT_OPERATION = exports.SEMATTRS_FAAS_DOCUMENT_COLLECTION = exports.SEMATTRS_FAAS_EXECUTION = exports.SEMATTRS_FAAS_TRIGGER = exports.SEMATTRS_EXCEPTION_ESCAPED = exports.SEMATTRS_EXCEPTION_STACKTRACE = exports.SEMATTRS_EXCEPTION_MESSAGE = exports.SEMATTRS_EXCEPTION_TYPE = exports.SEMATTRS_DB_SQL_TABLE = exports.SEMATTRS_DB_MONGODB_COLLECTION = exports.SEMATTRS_DB_REDIS_DATABASE_INDEX = exports.SEMATTRS_DB_HBASE_NAMESPACE = exports.SEMATTRS_DB_CASSANDRA_COORDINATOR_DC = exports.SEMATTRS_DB_CASSANDRA_COORDINATOR_ID = exports.SEMATTRS_DB_CASSANDRA_SPECULATIVE_EXECUTION_COUNT = exports.SEMATTRS_DB_CASSANDRA_IDEMPOTENCE = exports.SEMATTRS_DB_CASSANDRA_TABLE = exports.SEMATTRS_DB_CASSANDRA_CONSISTENCY_LEVEL = exports.SEMATTRS_DB_CASSANDRA_PAGE_SIZE = exports.SEMATTRS_DB_CASSANDRA_KEYSPACE = exports.SEMATTRS_DB_MSSQL_INSTANCE_NAME = exports.SEMATTRS_DB_OPERATION = exports.SEMATTRS_DB_STATEMENT = exports.SEMATTRS_DB_NAME = exports.SEMATTRS_DB_JDBC_DRIVER_CLASSNAME = exports.SEMATTRS_DB_USER = exports.SEMATTRS_DB_CONNECTION_STRING = exports.SEMATTRS_DB_SYSTEM = exports.SEMATTRS_AWS_LAMBDA_INVOKED_ARN = undefined;
  exports.SEMATTRS_MESSAGING_DESTINATION_KIND = exports.SEMATTRS_MESSAGING_DESTINATION = exports.SEMATTRS_MESSAGING_SYSTEM = exports.SEMATTRS_AWS_DYNAMODB_GLOBAL_SECONDARY_INDEX_UPDATES = exports.SEMATTRS_AWS_DYNAMODB_ATTRIBUTE_DEFINITIONS = exports.SEMATTRS_AWS_DYNAMODB_SCANNED_COUNT = exports.SEMATTRS_AWS_DYNAMODB_COUNT = exports.SEMATTRS_AWS_DYNAMODB_TOTAL_SEGMENTS = exports.SEMATTRS_AWS_DYNAMODB_SEGMENT = exports.SEMATTRS_AWS_DYNAMODB_SCAN_FORWARD = exports.SEMATTRS_AWS_DYNAMODB_TABLE_COUNT = exports.SEMATTRS_AWS_DYNAMODB_EXCLUSIVE_START_TABLE = exports.SEMATTRS_AWS_DYNAMODB_LOCAL_SECONDARY_INDEXES = exports.SEMATTRS_AWS_DYNAMODB_GLOBAL_SECONDARY_INDEXES = exports.SEMATTRS_AWS_DYNAMODB_SELECT = exports.SEMATTRS_AWS_DYNAMODB_INDEX_NAME = exports.SEMATTRS_AWS_DYNAMODB_ATTRIBUTES_TO_GET = exports.SEMATTRS_AWS_DYNAMODB_LIMIT = exports.SEMATTRS_AWS_DYNAMODB_PROJECTION = exports.SEMATTRS_AWS_DYNAMODB_CONSISTENT_READ = exports.SEMATTRS_AWS_DYNAMODB_PROVISIONED_WRITE_CAPACITY = exports.SEMATTRS_AWS_DYNAMODB_PROVISIONED_READ_CAPACITY = exports.SEMATTRS_AWS_DYNAMODB_ITEM_COLLECTION_METRICS = exports.SEMATTRS_AWS_DYNAMODB_CONSUMED_CAPACITY = exports.SEMATTRS_AWS_DYNAMODB_TABLE_NAMES = exports.SEMATTRS_HTTP_CLIENT_IP = exports.SEMATTRS_HTTP_ROUTE = exports.SEMATTRS_HTTP_SERVER_NAME = exports.SEMATTRS_HTTP_RESPONSE_CONTENT_LENGTH_UNCOMPRESSED = exports.SEMATTRS_HTTP_RESPONSE_CONTENT_LENGTH = exports.SEMATTRS_HTTP_REQUEST_CONTENT_LENGTH_UNCOMPRESSED = exports.SEMATTRS_HTTP_REQUEST_CONTENT_LENGTH = exports.SEMATTRS_HTTP_USER_AGENT = exports.SEMATTRS_HTTP_FLAVOR = exports.SEMATTRS_HTTP_STATUS_CODE = exports.SEMATTRS_HTTP_SCHEME = exports.SEMATTRS_HTTP_HOST = exports.SEMATTRS_HTTP_TARGET = exports.SEMATTRS_HTTP_URL = exports.SEMATTRS_HTTP_METHOD = exports.SEMATTRS_CODE_LINENO = exports.SEMATTRS_CODE_FILEPATH = exports.SEMATTRS_CODE_NAMESPACE = exports.SEMATTRS_CODE_FUNCTION = exports.SEMATTRS_THREAD_NAME = exports.SEMATTRS_THREAD_ID = exports.SEMATTRS_ENDUSER_SCOPE = exports.SEMATTRS_ENDUSER_ROLE = exports.SEMATTRS_ENDUSER_ID = exports.SEMATTRS_PEER_SERVICE = undefined;
  exports.DBSYSTEMVALUES_FILEMAKER = exports.DBSYSTEMVALUES_DERBY = exports.DBSYSTEMVALUES_FIREBIRD = exports.DBSYSTEMVALUES_ADABAS = exports.DBSYSTEMVALUES_CACHE = exports.DBSYSTEMVALUES_EDB = exports.DBSYSTEMVALUES_FIRSTSQL = exports.DBSYSTEMVALUES_INGRES = exports.DBSYSTEMVALUES_HANADB = exports.DBSYSTEMVALUES_MAXDB = exports.DBSYSTEMVALUES_PROGRESS = exports.DBSYSTEMVALUES_HSQLDB = exports.DBSYSTEMVALUES_CLOUDSCAPE = exports.DBSYSTEMVALUES_HIVE = exports.DBSYSTEMVALUES_REDSHIFT = exports.DBSYSTEMVALUES_POSTGRESQL = exports.DBSYSTEMVALUES_DB2 = exports.DBSYSTEMVALUES_ORACLE = exports.DBSYSTEMVALUES_MYSQL = exports.DBSYSTEMVALUES_MSSQL = exports.DBSYSTEMVALUES_OTHER_SQL = exports.SemanticAttributes = exports.SEMATTRS_MESSAGE_UNCOMPRESSED_SIZE = exports.SEMATTRS_MESSAGE_COMPRESSED_SIZE = exports.SEMATTRS_MESSAGE_ID = exports.SEMATTRS_MESSAGE_TYPE = exports.SEMATTRS_RPC_JSONRPC_ERROR_MESSAGE = exports.SEMATTRS_RPC_JSONRPC_ERROR_CODE = exports.SEMATTRS_RPC_JSONRPC_REQUEST_ID = exports.SEMATTRS_RPC_JSONRPC_VERSION = exports.SEMATTRS_RPC_GRPC_STATUS_CODE = exports.SEMATTRS_RPC_METHOD = exports.SEMATTRS_RPC_SERVICE = exports.SEMATTRS_RPC_SYSTEM = exports.SEMATTRS_MESSAGING_KAFKA_TOMBSTONE = exports.SEMATTRS_MESSAGING_KAFKA_PARTITION = exports.SEMATTRS_MESSAGING_KAFKA_CLIENT_ID = exports.SEMATTRS_MESSAGING_KAFKA_CONSUMER_GROUP = exports.SEMATTRS_MESSAGING_KAFKA_MESSAGE_KEY = exports.SEMATTRS_MESSAGING_RABBITMQ_ROUTING_KEY = exports.SEMATTRS_MESSAGING_CONSUMER_ID = exports.SEMATTRS_MESSAGING_OPERATION = exports.SEMATTRS_MESSAGING_MESSAGE_PAYLOAD_COMPRESSED_SIZE_BYTES = exports.SEMATTRS_MESSAGING_MESSAGE_PAYLOAD_SIZE_BYTES = exports.SEMATTRS_MESSAGING_CONVERSATION_ID = exports.SEMATTRS_MESSAGING_MESSAGE_ID = exports.SEMATTRS_MESSAGING_URL = exports.SEMATTRS_MESSAGING_PROTOCOL_VERSION = exports.SEMATTRS_MESSAGING_PROTOCOL = exports.SEMATTRS_MESSAGING_TEMP_DESTINATION = undefined;
  exports.FAASINVOKEDPROVIDERVALUES_ALIBABA_CLOUD = exports.FaasDocumentOperationValues = exports.FAASDOCUMENTOPERATIONVALUES_DELETE = exports.FAASDOCUMENTOPERATIONVALUES_EDIT = exports.FAASDOCUMENTOPERATIONVALUES_INSERT = exports.FaasTriggerValues = exports.FAASTRIGGERVALUES_OTHER = exports.FAASTRIGGERVALUES_TIMER = exports.FAASTRIGGERVALUES_PUBSUB = exports.FAASTRIGGERVALUES_HTTP = exports.FAASTRIGGERVALUES_DATASOURCE = exports.DbCassandraConsistencyLevelValues = exports.DBCASSANDRACONSISTENCYLEVELVALUES_LOCAL_SERIAL = exports.DBCASSANDRACONSISTENCYLEVELVALUES_SERIAL = exports.DBCASSANDRACONSISTENCYLEVELVALUES_ANY = exports.DBCASSANDRACONSISTENCYLEVELVALUES_LOCAL_ONE = exports.DBCASSANDRACONSISTENCYLEVELVALUES_THREE = exports.DBCASSANDRACONSISTENCYLEVELVALUES_TWO = exports.DBCASSANDRACONSISTENCYLEVELVALUES_ONE = exports.DBCASSANDRACONSISTENCYLEVELVALUES_LOCAL_QUORUM = exports.DBCASSANDRACONSISTENCYLEVELVALUES_QUORUM = exports.DBCASSANDRACONSISTENCYLEVELVALUES_EACH_QUORUM = exports.DBCASSANDRACONSISTENCYLEVELVALUES_ALL = exports.DbSystemValues = exports.DBSYSTEMVALUES_COCKROACHDB = exports.DBSYSTEMVALUES_MEMCACHED = exports.DBSYSTEMVALUES_ELASTICSEARCH = exports.DBSYSTEMVALUES_GEODE = exports.DBSYSTEMVALUES_NEO4J = exports.DBSYSTEMVALUES_DYNAMODB = exports.DBSYSTEMVALUES_COSMOSDB = exports.DBSYSTEMVALUES_COUCHDB = exports.DBSYSTEMVALUES_COUCHBASE = exports.DBSYSTEMVALUES_REDIS = exports.DBSYSTEMVALUES_MONGODB = exports.DBSYSTEMVALUES_HBASE = exports.DBSYSTEMVALUES_CASSANDRA = exports.DBSYSTEMVALUES_COLDFUSION = exports.DBSYSTEMVALUES_H2 = exports.DBSYSTEMVALUES_VERTICA = exports.DBSYSTEMVALUES_TERADATA = exports.DBSYSTEMVALUES_SYBASE = exports.DBSYSTEMVALUES_SQLITE = exports.DBSYSTEMVALUES_POINTBASE = exports.DBSYSTEMVALUES_PERVASIVE = exports.DBSYSTEMVALUES_NETEZZA = exports.DBSYSTEMVALUES_MARIADB = exports.DBSYSTEMVALUES_INTERBASE = exports.DBSYSTEMVALUES_INSTANTDB = exports.DBSYSTEMVALUES_INFORMIX = undefined;
  exports.MESSAGINGOPERATIONVALUES_RECEIVE = exports.MessagingDestinationKindValues = exports.MESSAGINGDESTINATIONKINDVALUES_TOPIC = exports.MESSAGINGDESTINATIONKINDVALUES_QUEUE = exports.HttpFlavorValues = exports.HTTPFLAVORVALUES_QUIC = exports.HTTPFLAVORVALUES_SPDY = exports.HTTPFLAVORVALUES_HTTP_2_0 = exports.HTTPFLAVORVALUES_HTTP_1_1 = exports.HTTPFLAVORVALUES_HTTP_1_0 = exports.NetHostConnectionSubtypeValues = exports.NETHOSTCONNECTIONSUBTYPEVALUES_LTE_CA = exports.NETHOSTCONNECTIONSUBTYPEVALUES_NRNSA = exports.NETHOSTCONNECTIONSUBTYPEVALUES_NR = exports.NETHOSTCONNECTIONSUBTYPEVALUES_IWLAN = exports.NETHOSTCONNECTIONSUBTYPEVALUES_TD_SCDMA = exports.NETHOSTCONNECTIONSUBTYPEVALUES_GSM = exports.NETHOSTCONNECTIONSUBTYPEVALUES_HSPAP = exports.NETHOSTCONNECTIONSUBTYPEVALUES_EHRPD = exports.NETHOSTCONNECTIONSUBTYPEVALUES_LTE = exports.NETHOSTCONNECTIONSUBTYPEVALUES_EVDO_B = exports.NETHOSTCONNECTIONSUBTYPEVALUES_IDEN = exports.NETHOSTCONNECTIONSUBTYPEVALUES_HSPA = exports.NETHOSTCONNECTIONSUBTYPEVALUES_HSUPA = exports.NETHOSTCONNECTIONSUBTYPEVALUES_HSDPA = exports.NETHOSTCONNECTIONSUBTYPEVALUES_CDMA2000_1XRTT = exports.NETHOSTCONNECTIONSUBTYPEVALUES_EVDO_A = exports.NETHOSTCONNECTIONSUBTYPEVALUES_EVDO_0 = exports.NETHOSTCONNECTIONSUBTYPEVALUES_CDMA = exports.NETHOSTCONNECTIONSUBTYPEVALUES_UMTS = exports.NETHOSTCONNECTIONSUBTYPEVALUES_EDGE = exports.NETHOSTCONNECTIONSUBTYPEVALUES_GPRS = exports.NetHostConnectionTypeValues = exports.NETHOSTCONNECTIONTYPEVALUES_UNKNOWN = exports.NETHOSTCONNECTIONTYPEVALUES_UNAVAILABLE = exports.NETHOSTCONNECTIONTYPEVALUES_CELL = exports.NETHOSTCONNECTIONTYPEVALUES_WIRED = exports.NETHOSTCONNECTIONTYPEVALUES_WIFI = exports.NetTransportValues = exports.NETTRANSPORTVALUES_OTHER = exports.NETTRANSPORTVALUES_INPROC = exports.NETTRANSPORTVALUES_PIPE = exports.NETTRANSPORTVALUES_UNIX = exports.NETTRANSPORTVALUES_IP = exports.NETTRANSPORTVALUES_IP_UDP = exports.NETTRANSPORTVALUES_IP_TCP = exports.FaasInvokedProviderValues = exports.FAASINVOKEDPROVIDERVALUES_GCP = exports.FAASINVOKEDPROVIDERVALUES_AZURE = exports.FAASINVOKEDPROVIDERVALUES_AWS = undefined;
  exports.MessageTypeValues = exports.MESSAGETYPEVALUES_RECEIVED = exports.MESSAGETYPEVALUES_SENT = exports.RpcGrpcStatusCodeValues = exports.RPCGRPCSTATUSCODEVALUES_UNAUTHENTICATED = exports.RPCGRPCSTATUSCODEVALUES_DATA_LOSS = exports.RPCGRPCSTATUSCODEVALUES_UNAVAILABLE = exports.RPCGRPCSTATUSCODEVALUES_INTERNAL = exports.RPCGRPCSTATUSCODEVALUES_UNIMPLEMENTED = exports.RPCGRPCSTATUSCODEVALUES_OUT_OF_RANGE = exports.RPCGRPCSTATUSCODEVALUES_ABORTED = exports.RPCGRPCSTATUSCODEVALUES_FAILED_PRECONDITION = exports.RPCGRPCSTATUSCODEVALUES_RESOURCE_EXHAUSTED = exports.RPCGRPCSTATUSCODEVALUES_PERMISSION_DENIED = exports.RPCGRPCSTATUSCODEVALUES_ALREADY_EXISTS = exports.RPCGRPCSTATUSCODEVALUES_NOT_FOUND = exports.RPCGRPCSTATUSCODEVALUES_DEADLINE_EXCEEDED = exports.RPCGRPCSTATUSCODEVALUES_INVALID_ARGUMENT = exports.RPCGRPCSTATUSCODEVALUES_UNKNOWN = exports.RPCGRPCSTATUSCODEVALUES_CANCELLED = exports.RPCGRPCSTATUSCODEVALUES_OK = exports.MessagingOperationValues = exports.MESSAGINGOPERATIONVALUES_PROCESS = undefined;
  var utils_1 = require_utils6();
  var TMP_AWS_LAMBDA_INVOKED_ARN = "aws.lambda.invoked_arn";
  var TMP_DB_SYSTEM = "db.system";
  var TMP_DB_CONNECTION_STRING = "db.connection_string";
  var TMP_DB_USER = "db.user";
  var TMP_DB_JDBC_DRIVER_CLASSNAME = "db.jdbc.driver_classname";
  var TMP_DB_NAME = "db.name";
  var TMP_DB_STATEMENT = "db.statement";
  var TMP_DB_OPERATION = "db.operation";
  var TMP_DB_MSSQL_INSTANCE_NAME = "db.mssql.instance_name";
  var TMP_DB_CASSANDRA_KEYSPACE = "db.cassandra.keyspace";
  var TMP_DB_CASSANDRA_PAGE_SIZE = "db.cassandra.page_size";
  var TMP_DB_CASSANDRA_CONSISTENCY_LEVEL = "db.cassandra.consistency_level";
  var TMP_DB_CASSANDRA_TABLE = "db.cassandra.table";
  var TMP_DB_CASSANDRA_IDEMPOTENCE = "db.cassandra.idempotence";
  var TMP_DB_CASSANDRA_SPECULATIVE_EXECUTION_COUNT = "db.cassandra.speculative_execution_count";
  var TMP_DB_CASSANDRA_COORDINATOR_ID = "db.cassandra.coordinator.id";
  var TMP_DB_CASSANDRA_COORDINATOR_DC = "db.cassandra.coordinator.dc";
  var TMP_DB_HBASE_NAMESPACE = "db.hbase.namespace";
  var TMP_DB_REDIS_DATABASE_INDEX = "db.redis.database_index";
  var TMP_DB_MONGODB_COLLECTION = "db.mongodb.collection";
  var TMP_DB_SQL_TABLE = "db.sql.table";
  var TMP_EXCEPTION_TYPE = "exception.type";
  var TMP_EXCEPTION_MESSAGE = "exception.message";
  var TMP_EXCEPTION_STACKTRACE = "exception.stacktrace";
  var TMP_EXCEPTION_ESCAPED = "exception.escaped";
  var TMP_FAAS_TRIGGER = "faas.trigger";
  var TMP_FAAS_EXECUTION = "faas.execution";
  var TMP_FAAS_DOCUMENT_COLLECTION = "faas.document.collection";
  var TMP_FAAS_DOCUMENT_OPERATION = "faas.document.operation";
  var TMP_FAAS_DOCUMENT_TIME = "faas.document.time";
  var TMP_FAAS_DOCUMENT_NAME = "faas.document.name";
  var TMP_FAAS_TIME = "faas.time";
  var TMP_FAAS_CRON = "faas.cron";
  var TMP_FAAS_COLDSTART = "faas.coldstart";
  var TMP_FAAS_INVOKED_NAME = "faas.invoked_name";
  var TMP_FAAS_INVOKED_PROVIDER = "faas.invoked_provider";
  var TMP_FAAS_INVOKED_REGION = "faas.invoked_region";
  var TMP_NET_TRANSPORT = "net.transport";
  var TMP_NET_PEER_IP = "net.peer.ip";
  var TMP_NET_PEER_PORT = "net.peer.port";
  var TMP_NET_PEER_NAME = "net.peer.name";
  var TMP_NET_HOST_IP = "net.host.ip";
  var TMP_NET_HOST_PORT = "net.host.port";
  var TMP_NET_HOST_NAME = "net.host.name";
  var TMP_NET_HOST_CONNECTION_TYPE = "net.host.connection.type";
  var TMP_NET_HOST_CONNECTION_SUBTYPE = "net.host.connection.subtype";
  var TMP_NET_HOST_CARRIER_NAME = "net.host.carrier.name";
  var TMP_NET_HOST_CARRIER_MCC = "net.host.carrier.mcc";
  var TMP_NET_HOST_CARRIER_MNC = "net.host.carrier.mnc";
  var TMP_NET_HOST_CARRIER_ICC = "net.host.carrier.icc";
  var TMP_PEER_SERVICE = "peer.service";
  var TMP_ENDUSER_ID = "enduser.id";
  var TMP_ENDUSER_ROLE = "enduser.role";
  var TMP_ENDUSER_SCOPE = "enduser.scope";
  var TMP_THREAD_ID = "thread.id";
  var TMP_THREAD_NAME = "thread.name";
  var TMP_CODE_FUNCTION = "code.function";
  var TMP_CODE_NAMESPACE = "code.namespace";
  var TMP_CODE_FILEPATH = "code.filepath";
  var TMP_CODE_LINENO = "code.lineno";
  var TMP_HTTP_METHOD = "http.method";
  var TMP_HTTP_URL = "http.url";
  var TMP_HTTP_TARGET = "http.target";
  var TMP_HTTP_HOST = "http.host";
  var TMP_HTTP_SCHEME = "http.scheme";
  var TMP_HTTP_STATUS_CODE = "http.status_code";
  var TMP_HTTP_FLAVOR = "http.flavor";
  var TMP_HTTP_USER_AGENT = "http.user_agent";
  var TMP_HTTP_REQUEST_CONTENT_LENGTH = "http.request_content_length";
  var TMP_HTTP_REQUEST_CONTENT_LENGTH_UNCOMPRESSED = "http.request_content_length_uncompressed";
  var TMP_HTTP_RESPONSE_CONTENT_LENGTH = "http.response_content_length";
  var TMP_HTTP_RESPONSE_CONTENT_LENGTH_UNCOMPRESSED = "http.response_content_length_uncompressed";
  var TMP_HTTP_SERVER_NAME = "http.server_name";
  var TMP_HTTP_ROUTE = "http.route";
  var TMP_HTTP_CLIENT_IP = "http.client_ip";
  var TMP_AWS_DYNAMODB_TABLE_NAMES = "aws.dynamodb.table_names";
  var TMP_AWS_DYNAMODB_CONSUMED_CAPACITY = "aws.dynamodb.consumed_capacity";
  var TMP_AWS_DYNAMODB_ITEM_COLLECTION_METRICS = "aws.dynamodb.item_collection_metrics";
  var TMP_AWS_DYNAMODB_PROVISIONED_READ_CAPACITY = "aws.dynamodb.provisioned_read_capacity";
  var TMP_AWS_DYNAMODB_PROVISIONED_WRITE_CAPACITY = "aws.dynamodb.provisioned_write_capacity";
  var TMP_AWS_DYNAMODB_CONSISTENT_READ = "aws.dynamodb.consistent_read";
  var TMP_AWS_DYNAMODB_PROJECTION = "aws.dynamodb.projection";
  var TMP_AWS_DYNAMODB_LIMIT = "aws.dynamodb.limit";
  var TMP_AWS_DYNAMODB_ATTRIBUTES_TO_GET = "aws.dynamodb.attributes_to_get";
  var TMP_AWS_DYNAMODB_INDEX_NAME = "aws.dynamodb.index_name";
  var TMP_AWS_DYNAMODB_SELECT = "aws.dynamodb.select";
  var TMP_AWS_DYNAMODB_GLOBAL_SECONDARY_INDEXES = "aws.dynamodb.global_secondary_indexes";
  var TMP_AWS_DYNAMODB_LOCAL_SECONDARY_INDEXES = "aws.dynamodb.local_secondary_indexes";
  var TMP_AWS_DYNAMODB_EXCLUSIVE_START_TABLE = "aws.dynamodb.exclusive_start_table";
  var TMP_AWS_DYNAMODB_TABLE_COUNT = "aws.dynamodb.table_count";
  var TMP_AWS_DYNAMODB_SCAN_FORWARD = "aws.dynamodb.scan_forward";
  var TMP_AWS_DYNAMODB_SEGMENT = "aws.dynamodb.segment";
  var TMP_AWS_DYNAMODB_TOTAL_SEGMENTS = "aws.dynamodb.total_segments";
  var TMP_AWS_DYNAMODB_COUNT = "aws.dynamodb.count";
  var TMP_AWS_DYNAMODB_SCANNED_COUNT = "aws.dynamodb.scanned_count";
  var TMP_AWS_DYNAMODB_ATTRIBUTE_DEFINITIONS = "aws.dynamodb.attribute_definitions";
  var TMP_AWS_DYNAMODB_GLOBAL_SECONDARY_INDEX_UPDATES = "aws.dynamodb.global_secondary_index_updates";
  var TMP_MESSAGING_SYSTEM = "messaging.system";
  var TMP_MESSAGING_DESTINATION = "messaging.destination";
  var TMP_MESSAGING_DESTINATION_KIND = "messaging.destination_kind";
  var TMP_MESSAGING_TEMP_DESTINATION = "messaging.temp_destination";
  var TMP_MESSAGING_PROTOCOL = "messaging.protocol";
  var TMP_MESSAGING_PROTOCOL_VERSION = "messaging.protocol_version";
  var TMP_MESSAGING_URL = "messaging.url";
  var TMP_MESSAGING_MESSAGE_ID = "messaging.message_id";
  var TMP_MESSAGING_CONVERSATION_ID = "messaging.conversation_id";
  var TMP_MESSAGING_MESSAGE_PAYLOAD_SIZE_BYTES = "messaging.message_payload_size_bytes";
  var TMP_MESSAGING_MESSAGE_PAYLOAD_COMPRESSED_SIZE_BYTES = "messaging.message_payload_compressed_size_bytes";
  var TMP_MESSAGING_OPERATION = "messaging.operation";
  var TMP_MESSAGING_CONSUMER_ID = "messaging.consumer_id";
  var TMP_MESSAGING_RABBITMQ_ROUTING_KEY = "messaging.rabbitmq.routing_key";
  var TMP_MESSAGING_KAFKA_MESSAGE_KEY = "messaging.kafka.message_key";
  var TMP_MESSAGING_KAFKA_CONSUMER_GROUP = "messaging.kafka.consumer_group";
  var TMP_MESSAGING_KAFKA_CLIENT_ID = "messaging.kafka.client_id";
  var TMP_MESSAGING_KAFKA_PARTITION = "messaging.kafka.partition";
  var TMP_MESSAGING_KAFKA_TOMBSTONE = "messaging.kafka.tombstone";
  var TMP_RPC_SYSTEM = "rpc.system";
  var TMP_RPC_SERVICE = "rpc.service";
  var TMP_RPC_METHOD = "rpc.method";
  var TMP_RPC_GRPC_STATUS_CODE = "rpc.grpc.status_code";
  var TMP_RPC_JSONRPC_VERSION = "rpc.jsonrpc.version";
  var TMP_RPC_JSONRPC_REQUEST_ID = "rpc.jsonrpc.request_id";
  var TMP_RPC_JSONRPC_ERROR_CODE = "rpc.jsonrpc.error_code";
  var TMP_RPC_JSONRPC_ERROR_MESSAGE = "rpc.jsonrpc.error_message";
  var TMP_MESSAGE_TYPE = "message.type";
  var TMP_MESSAGE_ID = "message.id";
  var TMP_MESSAGE_COMPRESSED_SIZE = "message.compressed_size";
  var TMP_MESSAGE_UNCOMPRESSED_SIZE = "message.uncompressed_size";
  exports.SEMATTRS_AWS_LAMBDA_INVOKED_ARN = TMP_AWS_LAMBDA_INVOKED_ARN;
  exports.SEMATTRS_DB_SYSTEM = TMP_DB_SYSTEM;
  exports.SEMATTRS_DB_CONNECTION_STRING = TMP_DB_CONNECTION_STRING;
  exports.SEMATTRS_DB_USER = TMP_DB_USER;
  exports.SEMATTRS_DB_JDBC_DRIVER_CLASSNAME = TMP_DB_JDBC_DRIVER_CLASSNAME;
  exports.SEMATTRS_DB_NAME = TMP_DB_NAME;
  exports.SEMATTRS_DB_STATEMENT = TMP_DB_STATEMENT;
  exports.SEMATTRS_DB_OPERATION = TMP_DB_OPERATION;
  exports.SEMATTRS_DB_MSSQL_INSTANCE_NAME = TMP_DB_MSSQL_INSTANCE_NAME;
  exports.SEMATTRS_DB_CASSANDRA_KEYSPACE = TMP_DB_CASSANDRA_KEYSPACE;
  exports.SEMATTRS_DB_CASSANDRA_PAGE_SIZE = TMP_DB_CASSANDRA_PAGE_SIZE;
  exports.SEMATTRS_DB_CASSANDRA_CONSISTENCY_LEVEL = TMP_DB_CASSANDRA_CONSISTENCY_LEVEL;
  exports.SEMATTRS_DB_CASSANDRA_TABLE = TMP_DB_CASSANDRA_TABLE;
  exports.SEMATTRS_DB_CASSANDRA_IDEMPOTENCE = TMP_DB_CASSANDRA_IDEMPOTENCE;
  exports.SEMATTRS_DB_CASSANDRA_SPECULATIVE_EXECUTION_COUNT = TMP_DB_CASSANDRA_SPECULATIVE_EXECUTION_COUNT;
  exports.SEMATTRS_DB_CASSANDRA_COORDINATOR_ID = TMP_DB_CASSANDRA_COORDINATOR_ID;
  exports.SEMATTRS_DB_CASSANDRA_COORDINATOR_DC = TMP_DB_CASSANDRA_COORDINATOR_DC;
  exports.SEMATTRS_DB_HBASE_NAMESPACE = TMP_DB_HBASE_NAMESPACE;
  exports.SEMATTRS_DB_REDIS_DATABASE_INDEX = TMP_DB_REDIS_DATABASE_INDEX;
  exports.SEMATTRS_DB_MONGODB_COLLECTION = TMP_DB_MONGODB_COLLECTION;
  exports.SEMATTRS_DB_SQL_TABLE = TMP_DB_SQL_TABLE;
  exports.SEMATTRS_EXCEPTION_TYPE = TMP_EXCEPTION_TYPE;
  exports.SEMATTRS_EXCEPTION_MESSAGE = TMP_EXCEPTION_MESSAGE;
  exports.SEMATTRS_EXCEPTION_STACKTRACE = TMP_EXCEPTION_STACKTRACE;
  exports.SEMATTRS_EXCEPTION_ESCAPED = TMP_EXCEPTION_ESCAPED;
  exports.SEMATTRS_FAAS_TRIGGER = TMP_FAAS_TRIGGER;
  exports.SEMATTRS_FAAS_EXECUTION = TMP_FAAS_EXECUTION;
  exports.SEMATTRS_FAAS_DOCUMENT_COLLECTION = TMP_FAAS_DOCUMENT_COLLECTION;
  exports.SEMATTRS_FAAS_DOCUMENT_OPERATION = TMP_FAAS_DOCUMENT_OPERATION;
  exports.SEMATTRS_FAAS_DOCUMENT_TIME = TMP_FAAS_DOCUMENT_TIME;
  exports.SEMATTRS_FAAS_DOCUMENT_NAME = TMP_FAAS_DOCUMENT_NAME;
  exports.SEMATTRS_FAAS_TIME = TMP_FAAS_TIME;
  exports.SEMATTRS_FAAS_CRON = TMP_FAAS_CRON;
  exports.SEMATTRS_FAAS_COLDSTART = TMP_FAAS_COLDSTART;
  exports.SEMATTRS_FAAS_INVOKED_NAME = TMP_FAAS_INVOKED_NAME;
  exports.SEMATTRS_FAAS_INVOKED_PROVIDER = TMP_FAAS_INVOKED_PROVIDER;
  exports.SEMATTRS_FAAS_INVOKED_REGION = TMP_FAAS_INVOKED_REGION;
  exports.SEMATTRS_NET_TRANSPORT = TMP_NET_TRANSPORT;
  exports.SEMATTRS_NET_PEER_IP = TMP_NET_PEER_IP;
  exports.SEMATTRS_NET_PEER_PORT = TMP_NET_PEER_PORT;
  exports.SEMATTRS_NET_PEER_NAME = TMP_NET_PEER_NAME;
  exports.SEMATTRS_NET_HOST_IP = TMP_NET_HOST_IP;
  exports.SEMATTRS_NET_HOST_PORT = TMP_NET_HOST_PORT;
  exports.SEMATTRS_NET_HOST_NAME = TMP_NET_HOST_NAME;
  exports.SEMATTRS_NET_HOST_CONNECTION_TYPE = TMP_NET_HOST_CONNECTION_TYPE;
  exports.SEMATTRS_NET_HOST_CONNECTION_SUBTYPE = TMP_NET_HOST_CONNECTION_SUBTYPE;
  exports.SEMATTRS_NET_HOST_CARRIER_NAME = TMP_NET_HOST_CARRIER_NAME;
  exports.SEMATTRS_NET_HOST_CARRIER_MCC = TMP_NET_HOST_CARRIER_MCC;
  exports.SEMATTRS_NET_HOST_CARRIER_MNC = TMP_NET_HOST_CARRIER_MNC;
  exports.SEMATTRS_NET_HOST_CARRIER_ICC = TMP_NET_HOST_CARRIER_ICC;
  exports.SEMATTRS_PEER_SERVICE = TMP_PEER_SERVICE;
  exports.SEMATTRS_ENDUSER_ID = TMP_ENDUSER_ID;
  exports.SEMATTRS_ENDUSER_ROLE = TMP_ENDUSER_ROLE;
  exports.SEMATTRS_ENDUSER_SCOPE = TMP_ENDUSER_SCOPE;
  exports.SEMATTRS_THREAD_ID = TMP_THREAD_ID;
  exports.SEMATTRS_THREAD_NAME = TMP_THREAD_NAME;
  exports.SEMATTRS_CODE_FUNCTION = TMP_CODE_FUNCTION;
  exports.SEMATTRS_CODE_NAMESPACE = TMP_CODE_NAMESPACE;
  exports.SEMATTRS_CODE_FILEPATH = TMP_CODE_FILEPATH;
  exports.SEMATTRS_CODE_LINENO = TMP_CODE_LINENO;
  exports.SEMATTRS_HTTP_METHOD = TMP_HTTP_METHOD;
  exports.SEMATTRS_HTTP_URL = TMP_HTTP_URL;
  exports.SEMATTRS_HTTP_TARGET = TMP_HTTP_TARGET;
  exports.SEMATTRS_HTTP_HOST = TMP_HTTP_HOST;
  exports.SEMATTRS_HTTP_SCHEME = TMP_HTTP_SCHEME;
  exports.SEMATTRS_HTTP_STATUS_CODE = TMP_HTTP_STATUS_CODE;
  exports.SEMATTRS_HTTP_FLAVOR = TMP_HTTP_FLAVOR;
  exports.SEMATTRS_HTTP_USER_AGENT = TMP_HTTP_USER_AGENT;
  exports.SEMATTRS_HTTP_REQUEST_CONTENT_LENGTH = TMP_HTTP_REQUEST_CONTENT_LENGTH;
  exports.SEMATTRS_HTTP_REQUEST_CONTENT_LENGTH_UNCOMPRESSED = TMP_HTTP_REQUEST_CONTENT_LENGTH_UNCOMPRESSED;
  exports.SEMATTRS_HTTP_RESPONSE_CONTENT_LENGTH = TMP_HTTP_RESPONSE_CONTENT_LENGTH;
  exports.SEMATTRS_HTTP_RESPONSE_CONTENT_LENGTH_UNCOMPRESSED = TMP_HTTP_RESPONSE_CONTENT_LENGTH_UNCOMPRESSED;
  exports.SEMATTRS_HTTP_SERVER_NAME = TMP_HTTP_SERVER_NAME;
  exports.SEMATTRS_HTTP_ROUTE = TMP_HTTP_ROUTE;
  exports.SEMATTRS_HTTP_CLIENT_IP = TMP_HTTP_CLIENT_IP;
  exports.SEMATTRS_AWS_DYNAMODB_TABLE_NAMES = TMP_AWS_DYNAMODB_TABLE_NAMES;
  exports.SEMATTRS_AWS_DYNAMODB_CONSUMED_CAPACITY = TMP_AWS_DYNAMODB_CONSUMED_CAPACITY;
  exports.SEMATTRS_AWS_DYNAMODB_ITEM_COLLECTION_METRICS = TMP_AWS_DYNAMODB_ITEM_COLLECTION_METRICS;
  exports.SEMATTRS_AWS_DYNAMODB_PROVISIONED_READ_CAPACITY = TMP_AWS_DYNAMODB_PROVISIONED_READ_CAPACITY;
  exports.SEMATTRS_AWS_DYNAMODB_PROVISIONED_WRITE_CAPACITY = TMP_AWS_DYNAMODB_PROVISIONED_WRITE_CAPACITY;
  exports.SEMATTRS_AWS_DYNAMODB_CONSISTENT_READ = TMP_AWS_DYNAMODB_CONSISTENT_READ;
  exports.SEMATTRS_AWS_DYNAMODB_PROJECTION = TMP_AWS_DYNAMODB_PROJECTION;
  exports.SEMATTRS_AWS_DYNAMODB_LIMIT = TMP_AWS_DYNAMODB_LIMIT;
  exports.SEMATTRS_AWS_DYNAMODB_ATTRIBUTES_TO_GET = TMP_AWS_DYNAMODB_ATTRIBUTES_TO_GET;
  exports.SEMATTRS_AWS_DYNAMODB_INDEX_NAME = TMP_AWS_DYNAMODB_INDEX_NAME;
  exports.SEMATTRS_AWS_DYNAMODB_SELECT = TMP_AWS_DYNAMODB_SELECT;
  exports.SEMATTRS_AWS_DYNAMODB_GLOBAL_SECONDARY_INDEXES = TMP_AWS_DYNAMODB_GLOBAL_SECONDARY_INDEXES;
  exports.SEMATTRS_AWS_DYNAMODB_LOCAL_SECONDARY_INDEXES = TMP_AWS_DYNAMODB_LOCAL_SECONDARY_INDEXES;
  exports.SEMATTRS_AWS_DYNAMODB_EXCLUSIVE_START_TABLE = TMP_AWS_DYNAMODB_EXCLUSIVE_START_TABLE;
  exports.SEMATTRS_AWS_DYNAMODB_TABLE_COUNT = TMP_AWS_DYNAMODB_TABLE_COUNT;
  exports.SEMATTRS_AWS_DYNAMODB_SCAN_FORWARD = TMP_AWS_DYNAMODB_SCAN_FORWARD;
  exports.SEMATTRS_AWS_DYNAMODB_SEGMENT = TMP_AWS_DYNAMODB_SEGMENT;
  exports.SEMATTRS_AWS_DYNAMODB_TOTAL_SEGMENTS = TMP_AWS_DYNAMODB_TOTAL_SEGMENTS;
  exports.SEMATTRS_AWS_DYNAMODB_COUNT = TMP_AWS_DYNAMODB_COUNT;
  exports.SEMATTRS_AWS_DYNAMODB_SCANNED_COUNT = TMP_AWS_DYNAMODB_SCANNED_COUNT;
  exports.SEMATTRS_AWS_DYNAMODB_ATTRIBUTE_DEFINITIONS = TMP_AWS_DYNAMODB_ATTRIBUTE_DEFINITIONS;
  exports.SEMATTRS_AWS_DYNAMODB_GLOBAL_SECONDARY_INDEX_UPDATES = TMP_AWS_DYNAMODB_GLOBAL_SECONDARY_INDEX_UPDATES;
  exports.SEMATTRS_MESSAGING_SYSTEM = TMP_MESSAGING_SYSTEM;
  exports.SEMATTRS_MESSAGING_DESTINATION = TMP_MESSAGING_DESTINATION;
  exports.SEMATTRS_MESSAGING_DESTINATION_KIND = TMP_MESSAGING_DESTINATION_KIND;
  exports.SEMATTRS_MESSAGING_TEMP_DESTINATION = TMP_MESSAGING_TEMP_DESTINATION;
  exports.SEMATTRS_MESSAGING_PROTOCOL = TMP_MESSAGING_PROTOCOL;
  exports.SEMATTRS_MESSAGING_PROTOCOL_VERSION = TMP_MESSAGING_PROTOCOL_VERSION;
  exports.SEMATTRS_MESSAGING_URL = TMP_MESSAGING_URL;
  exports.SEMATTRS_MESSAGING_MESSAGE_ID = TMP_MESSAGING_MESSAGE_ID;
  exports.SEMATTRS_MESSAGING_CONVERSATION_ID = TMP_MESSAGING_CONVERSATION_ID;
  exports.SEMATTRS_MESSAGING_MESSAGE_PAYLOAD_SIZE_BYTES = TMP_MESSAGING_MESSAGE_PAYLOAD_SIZE_BYTES;
  exports.SEMATTRS_MESSAGING_MESSAGE_PAYLOAD_COMPRESSED_SIZE_BYTES = TMP_MESSAGING_MESSAGE_PAYLOAD_COMPRESSED_SIZE_BYTES;
  exports.SEMATTRS_MESSAGING_OPERATION = TMP_MESSAGING_OPERATION;
  exports.SEMATTRS_MESSAGING_CONSUMER_ID = TMP_MESSAGING_CONSUMER_ID;
  exports.SEMATTRS_MESSAGING_RABBITMQ_ROUTING_KEY = TMP_MESSAGING_RABBITMQ_ROUTING_KEY;
  exports.SEMATTRS_MESSAGING_KAFKA_MESSAGE_KEY = TMP_MESSAGING_KAFKA_MESSAGE_KEY;
  exports.SEMATTRS_MESSAGING_KAFKA_CONSUMER_GROUP = TMP_MESSAGING_KAFKA_CONSUMER_GROUP;
  exports.SEMATTRS_MESSAGING_KAFKA_CLIENT_ID = TMP_MESSAGING_KAFKA_CLIENT_ID;
  exports.SEMATTRS_MESSAGING_KAFKA_PARTITION = TMP_MESSAGING_KAFKA_PARTITION;
  exports.SEMATTRS_MESSAGING_KAFKA_TOMBSTONE = TMP_MESSAGING_KAFKA_TOMBSTONE;
  exports.SEMATTRS_RPC_SYSTEM = TMP_RPC_SYSTEM;
  exports.SEMATTRS_RPC_SERVICE = TMP_RPC_SERVICE;
  exports.SEMATTRS_RPC_METHOD = TMP_RPC_METHOD;
  exports.SEMATTRS_RPC_GRPC_STATUS_CODE = TMP_RPC_GRPC_STATUS_CODE;
  exports.SEMATTRS_RPC_JSONRPC_VERSION = TMP_RPC_JSONRPC_VERSION;
  exports.SEMATTRS_RPC_JSONRPC_REQUEST_ID = TMP_RPC_JSONRPC_REQUEST_ID;
  exports.SEMATTRS_RPC_JSONRPC_ERROR_CODE = TMP_RPC_JSONRPC_ERROR_CODE;
  exports.SEMATTRS_RPC_JSONRPC_ERROR_MESSAGE = TMP_RPC_JSONRPC_ERROR_MESSAGE;
  exports.SEMATTRS_MESSAGE_TYPE = TMP_MESSAGE_TYPE;
  exports.SEMATTRS_MESSAGE_ID = TMP_MESSAGE_ID;
  exports.SEMATTRS_MESSAGE_COMPRESSED_SIZE = TMP_MESSAGE_COMPRESSED_SIZE;
  exports.SEMATTRS_MESSAGE_UNCOMPRESSED_SIZE = TMP_MESSAGE_UNCOMPRESSED_SIZE;
  exports.SemanticAttributes = /* @__PURE__ */ (0, utils_1.createConstMap)([
    TMP_AWS_LAMBDA_INVOKED_ARN,
    TMP_DB_SYSTEM,
    TMP_DB_CONNECTION_STRING,
    TMP_DB_USER,
    TMP_DB_JDBC_DRIVER_CLASSNAME,
    TMP_DB_NAME,
    TMP_DB_STATEMENT,
    TMP_DB_OPERATION,
    TMP_DB_MSSQL_INSTANCE_NAME,
    TMP_DB_CASSANDRA_KEYSPACE,
    TMP_DB_CASSANDRA_PAGE_SIZE,
    TMP_DB_CASSANDRA_CONSISTENCY_LEVEL,
    TMP_DB_CASSANDRA_TABLE,
    TMP_DB_CASSANDRA_IDEMPOTENCE,
    TMP_DB_CASSANDRA_SPECULATIVE_EXECUTION_COUNT,
    TMP_DB_CASSANDRA_COORDINATOR_ID,
    TMP_DB_CASSANDRA_COORDINATOR_DC,
    TMP_DB_HBASE_NAMESPACE,
    TMP_DB_REDIS_DATABASE_INDEX,
    TMP_DB_MONGODB_COLLECTION,
    TMP_DB_SQL_TABLE,
    TMP_EXCEPTION_TYPE,
    TMP_EXCEPTION_MESSAGE,
    TMP_EXCEPTION_STACKTRACE,
    TMP_EXCEPTION_ESCAPED,
    TMP_FAAS_TRIGGER,
    TMP_FAAS_EXECUTION,
    TMP_FAAS_DOCUMENT_COLLECTION,
    TMP_FAAS_DOCUMENT_OPERATION,
    TMP_FAAS_DOCUMENT_TIME,
    TMP_FAAS_DOCUMENT_NAME,
    TMP_FAAS_TIME,
    TMP_FAAS_CRON,
    TMP_FAAS_COLDSTART,
    TMP_FAAS_INVOKED_NAME,
    TMP_FAAS_INVOKED_PROVIDER,
    TMP_FAAS_INVOKED_REGION,
    TMP_NET_TRANSPORT,
    TMP_NET_PEER_IP,
    TMP_NET_PEER_PORT,
    TMP_NET_PEER_NAME,
    TMP_NET_HOST_IP,
    TMP_NET_HOST_PORT,
    TMP_NET_HOST_NAME,
    TMP_NET_HOST_CONNECTION_TYPE,
    TMP_NET_HOST_CONNECTION_SUBTYPE,
    TMP_NET_HOST_CARRIER_NAME,
    TMP_NET_HOST_CARRIER_MCC,
    TMP_NET_HOST_CARRIER_MNC,
    TMP_NET_HOST_CARRIER_ICC,
    TMP_PEER_SERVICE,
    TMP_ENDUSER_ID,
    TMP_ENDUSER_ROLE,
    TMP_ENDUSER_SCOPE,
    TMP_THREAD_ID,
    TMP_THREAD_NAME,
    TMP_CODE_FUNCTION,
    TMP_CODE_NAMESPACE,
    TMP_CODE_FILEPATH,
    TMP_CODE_LINENO,
    TMP_HTTP_METHOD,
    TMP_HTTP_URL,
    TMP_HTTP_TARGET,
    TMP_HTTP_HOST,
    TMP_HTTP_SCHEME,
    TMP_HTTP_STATUS_CODE,
    TMP_HTTP_FLAVOR,
    TMP_HTTP_USER_AGENT,
    TMP_HTTP_REQUEST_CONTENT_LENGTH,
    TMP_HTTP_REQUEST_CONTENT_LENGTH_UNCOMPRESSED,
    TMP_HTTP_RESPONSE_CONTENT_LENGTH,
    TMP_HTTP_RESPONSE_CONTENT_LENGTH_UNCOMPRESSED,
    TMP_HTTP_SERVER_NAME,
    TMP_HTTP_ROUTE,
    TMP_HTTP_CLIENT_IP,
    TMP_AWS_DYNAMODB_TABLE_NAMES,
    TMP_AWS_DYNAMODB_CONSUMED_CAPACITY,
    TMP_AWS_DYNAMODB_ITEM_COLLECTION_METRICS,
    TMP_AWS_DYNAMODB_PROVISIONED_READ_CAPACITY,
    TMP_AWS_DYNAMODB_PROVISIONED_WRITE_CAPACITY,
    TMP_AWS_DYNAMODB_CONSISTENT_READ,
    TMP_AWS_DYNAMODB_PROJECTION,
    TMP_AWS_DYNAMODB_LIMIT,
    TMP_AWS_DYNAMODB_ATTRIBUTES_TO_GET,
    TMP_AWS_DYNAMODB_INDEX_NAME,
    TMP_AWS_DYNAMODB_SELECT,
    TMP_AWS_DYNAMODB_GLOBAL_SECONDARY_INDEXES,
    TMP_AWS_DYNAMODB_LOCAL_SECONDARY_INDEXES,
    TMP_AWS_DYNAMODB_EXCLUSIVE_START_TABLE,
    TMP_AWS_DYNAMODB_TABLE_COUNT,
    TMP_AWS_DYNAMODB_SCAN_FORWARD,
    TMP_AWS_DYNAMODB_SEGMENT,
    TMP_AWS_DYNAMODB_TOTAL_SEGMENTS,
    TMP_AWS_DYNAMODB_COUNT,
    TMP_AWS_DYNAMODB_SCANNED_COUNT,
    TMP_AWS_DYNAMODB_ATTRIBUTE_DEFINITIONS,
    TMP_AWS_DYNAMODB_GLOBAL_SECONDARY_INDEX_UPDATES,
    TMP_MESSAGING_SYSTEM,
    TMP_MESSAGING_DESTINATION,
    TMP_MESSAGING_DESTINATION_KIND,
    TMP_MESSAGING_TEMP_DESTINATION,
    TMP_MESSAGING_PROTOCOL,
    TMP_MESSAGING_PROTOCOL_VERSION,
    TMP_MESSAGING_URL,
    TMP_MESSAGING_MESSAGE_ID,
    TMP_MESSAGING_CONVERSATION_ID,
    TMP_MESSAGING_MESSAGE_PAYLOAD_SIZE_BYTES,
    TMP_MESSAGING_MESSAGE_PAYLOAD_COMPRESSED_SIZE_BYTES,
    TMP_MESSAGING_OPERATION,
    TMP_MESSAGING_CONSUMER_ID,
    TMP_MESSAGING_RABBITMQ_ROUTING_KEY,
    TMP_MESSAGING_KAFKA_MESSAGE_KEY,
    TMP_MESSAGING_KAFKA_CONSUMER_GROUP,
    TMP_MESSAGING_KAFKA_CLIENT_ID,
    TMP_MESSAGING_KAFKA_PARTITION,
    TMP_MESSAGING_KAFKA_TOMBSTONE,
    TMP_RPC_SYSTEM,
    TMP_RPC_SERVICE,
    TMP_RPC_METHOD,
    TMP_RPC_GRPC_STATUS_CODE,
    TMP_RPC_JSONRPC_VERSION,
    TMP_RPC_JSONRPC_REQUEST_ID,
    TMP_RPC_JSONRPC_ERROR_CODE,
    TMP_RPC_JSONRPC_ERROR_MESSAGE,
    TMP_MESSAGE_TYPE,
    TMP_MESSAGE_ID,
    TMP_MESSAGE_COMPRESSED_SIZE,
    TMP_MESSAGE_UNCOMPRESSED_SIZE
  ]);
  var TMP_DBSYSTEMVALUES_OTHER_SQL = "other_sql";
  var TMP_DBSYSTEMVALUES_MSSQL = "mssql";
  var TMP_DBSYSTEMVALUES_MYSQL = "mysql";
  var TMP_DBSYSTEMVALUES_ORACLE = "oracle";
  var TMP_DBSYSTEMVALUES_DB2 = "db2";
  var TMP_DBSYSTEMVALUES_POSTGRESQL = "postgresql";
  var TMP_DBSYSTEMVALUES_REDSHIFT = "redshift";
  var TMP_DBSYSTEMVALUES_HIVE = "hive";
  var TMP_DBSYSTEMVALUES_CLOUDSCAPE = "cloudscape";
  var TMP_DBSYSTEMVALUES_HSQLDB = "hsqldb";
  var TMP_DBSYSTEMVALUES_PROGRESS = "progress";
  var TMP_DBSYSTEMVALUES_MAXDB = "maxdb";
  var TMP_DBSYSTEMVALUES_HANADB = "hanadb";
  var TMP_DBSYSTEMVALUES_INGRES = "ingres";
  var TMP_DBSYSTEMVALUES_FIRSTSQL = "firstsql";
  var TMP_DBSYSTEMVALUES_EDB = "edb";
  var TMP_DBSYSTEMVALUES_CACHE = "cache";
  var TMP_DBSYSTEMVALUES_ADABAS = "adabas";
  var TMP_DBSYSTEMVALUES_FIREBIRD = "firebird";
  var TMP_DBSYSTEMVALUES_DERBY = "derby";
  var TMP_DBSYSTEMVALUES_FILEMAKER = "filemaker";
  var TMP_DBSYSTEMVALUES_INFORMIX = "informix";
  var TMP_DBSYSTEMVALUES_INSTANTDB = "instantdb";
  var TMP_DBSYSTEMVALUES_INTERBASE = "interbase";
  var TMP_DBSYSTEMVALUES_MARIADB = "mariadb";
  var TMP_DBSYSTEMVALUES_NETEZZA = "netezza";
  var TMP_DBSYSTEMVALUES_PERVASIVE = "pervasive";
  var TMP_DBSYSTEMVALUES_POINTBASE = "pointbase";
  var TMP_DBSYSTEMVALUES_SQLITE = "sqlite";
  var TMP_DBSYSTEMVALUES_SYBASE = "sybase";
  var TMP_DBSYSTEMVALUES_TERADATA = "teradata";
  var TMP_DBSYSTEMVALUES_VERTICA = "vertica";
  var TMP_DBSYSTEMVALUES_H2 = "h2";
  var TMP_DBSYSTEMVALUES_COLDFUSION = "coldfusion";
  var TMP_DBSYSTEMVALUES_CASSANDRA = "cassandra";
  var TMP_DBSYSTEMVALUES_HBASE = "hbase";
  var TMP_DBSYSTEMVALUES_MONGODB = "mongodb";
  var TMP_DBSYSTEMVALUES_REDIS = "redis";
  var TMP_DBSYSTEMVALUES_COUCHBASE = "couchbase";
  var TMP_DBSYSTEMVALUES_COUCHDB = "couchdb";
  var TMP_DBSYSTEMVALUES_COSMOSDB = "cosmosdb";
  var TMP_DBSYSTEMVALUES_DYNAMODB = "dynamodb";
  var TMP_DBSYSTEMVALUES_NEO4J = "neo4j";
  var TMP_DBSYSTEMVALUES_GEODE = "geode";
  var TMP_DBSYSTEMVALUES_ELASTICSEARCH = "elasticsearch";
  var TMP_DBSYSTEMVALUES_MEMCACHED = "memcached";
  var TMP_DBSYSTEMVALUES_COCKROACHDB = "cockroachdb";
  exports.DBSYSTEMVALUES_OTHER_SQL = TMP_DBSYSTEMVALUES_OTHER_SQL;
  exports.DBSYSTEMVALUES_MSSQL = TMP_DBSYSTEMVALUES_MSSQL;
  exports.DBSYSTEMVALUES_MYSQL = TMP_DBSYSTEMVALUES_MYSQL;
  exports.DBSYSTEMVALUES_ORACLE = TMP_DBSYSTEMVALUES_ORACLE;
  exports.DBSYSTEMVALUES_DB2 = TMP_DBSYSTEMVALUES_DB2;
  exports.DBSYSTEMVALUES_POSTGRESQL = TMP_DBSYSTEMVALUES_POSTGRESQL;
  exports.DBSYSTEMVALUES_REDSHIFT = TMP_DBSYSTEMVALUES_REDSHIFT;
  exports.DBSYSTEMVALUES_HIVE = TMP_DBSYSTEMVALUES_HIVE;
  exports.DBSYSTEMVALUES_CLOUDSCAPE = TMP_DBSYSTEMVALUES_CLOUDSCAPE;
  exports.DBSYSTEMVALUES_HSQLDB = TMP_DBSYSTEMVALUES_HSQLDB;
  exports.DBSYSTEMVALUES_PROGRESS = TMP_DBSYSTEMVALUES_PROGRESS;
  exports.DBSYSTEMVALUES_MAXDB = TMP_DBSYSTEMVALUES_MAXDB;
  exports.DBSYSTEMVALUES_HANADB = TMP_DBSYSTEMVALUES_HANADB;
  exports.DBSYSTEMVALUES_INGRES = TMP_DBSYSTEMVALUES_INGRES;
  exports.DBSYSTEMVALUES_FIRSTSQL = TMP_DBSYSTEMVALUES_FIRSTSQL;
  exports.DBSYSTEMVALUES_EDB = TMP_DBSYSTEMVALUES_EDB;
  exports.DBSYSTEMVALUES_CACHE = TMP_DBSYSTEMVALUES_CACHE;
  exports.DBSYSTEMVALUES_ADABAS = TMP_DBSYSTEMVALUES_ADABAS;
  exports.DBSYSTEMVALUES_FIREBIRD = TMP_DBSYSTEMVALUES_FIREBIRD;
  exports.DBSYSTEMVALUES_DERBY = TMP_DBSYSTEMVALUES_DERBY;
  exports.DBSYSTEMVALUES_FILEMAKER = TMP_DBSYSTEMVALUES_FILEMAKER;
  exports.DBSYSTEMVALUES_INFORMIX = TMP_DBSYSTEMVALUES_INFORMIX;
  exports.DBSYSTEMVALUES_INSTANTDB = TMP_DBSYSTEMVALUES_INSTANTDB;
  exports.DBSYSTEMVALUES_INTERBASE = TMP_DBSYSTEMVALUES_INTERBASE;
  exports.DBSYSTEMVALUES_MARIADB = TMP_DBSYSTEMVALUES_MARIADB;
  exports.DBSYSTEMVALUES_NETEZZA = TMP_DBSYSTEMVALUES_NETEZZA;
  exports.DBSYSTEMVALUES_PERVASIVE = TMP_DBSYSTEMVALUES_PERVASIVE;
  exports.DBSYSTEMVALUES_POINTBASE = TMP_DBSYSTEMVALUES_POINTBASE;
  exports.DBSYSTEMVALUES_SQLITE = TMP_DBSYSTEMVALUES_SQLITE;
  exports.DBSYSTEMVALUES_SYBASE = TMP_DBSYSTEMVALUES_SYBASE;
  exports.DBSYSTEMVALUES_TERADATA = TMP_DBSYSTEMVALUES_TERADATA;
  exports.DBSYSTEMVALUES_VERTICA = TMP_DBSYSTEMVALUES_VERTICA;
  exports.DBSYSTEMVALUES_H2 = TMP_DBSYSTEMVALUES_H2;
  exports.DBSYSTEMVALUES_COLDFUSION = TMP_DBSYSTEMVALUES_COLDFUSION;
  exports.DBSYSTEMVALUES_CASSANDRA = TMP_DBSYSTEMVALUES_CASSANDRA;
  exports.DBSYSTEMVALUES_HBASE = TMP_DBSYSTEMVALUES_HBASE;
  exports.DBSYSTEMVALUES_MONGODB = TMP_DBSYSTEMVALUES_MONGODB;
  exports.DBSYSTEMVALUES_REDIS = TMP_DBSYSTEMVALUES_REDIS;
  exports.DBSYSTEMVALUES_COUCHBASE = TMP_DBSYSTEMVALUES_COUCHBASE;
  exports.DBSYSTEMVALUES_COUCHDB = TMP_DBSYSTEMVALUES_COUCHDB;
  exports.DBSYSTEMVALUES_COSMOSDB = TMP_DBSYSTEMVALUES_COSMOSDB;
  exports.DBSYSTEMVALUES_DYNAMODB = TMP_DBSYSTEMVALUES_DYNAMODB;
  exports.DBSYSTEMVALUES_NEO4J = TMP_DBSYSTEMVALUES_NEO4J;
  exports.DBSYSTEMVALUES_GEODE = TMP_DBSYSTEMVALUES_GEODE;
  exports.DBSYSTEMVALUES_ELASTICSEARCH = TMP_DBSYSTEMVALUES_ELASTICSEARCH;
  exports.DBSYSTEMVALUES_MEMCACHED = TMP_DBSYSTEMVALUES_MEMCACHED;
  exports.DBSYSTEMVALUES_COCKROACHDB = TMP_DBSYSTEMVALUES_COCKROACHDB;
  exports.DbSystemValues = /* @__PURE__ */ (0, utils_1.createConstMap)([
    TMP_DBSYSTEMVALUES_OTHER_SQL,
    TMP_DBSYSTEMVALUES_MSSQL,
    TMP_DBSYSTEMVALUES_MYSQL,
    TMP_DBSYSTEMVALUES_ORACLE,
    TMP_DBSYSTEMVALUES_DB2,
    TMP_DBSYSTEMVALUES_POSTGRESQL,
    TMP_DBSYSTEMVALUES_REDSHIFT,
    TMP_DBSYSTEMVALUES_HIVE,
    TMP_DBSYSTEMVALUES_CLOUDSCAPE,
    TMP_DBSYSTEMVALUES_HSQLDB,
    TMP_DBSYSTEMVALUES_PROGRESS,
    TMP_DBSYSTEMVALUES_MAXDB,
    TMP_DBSYSTEMVALUES_HANADB,
    TMP_DBSYSTEMVALUES_INGRES,
    TMP_DBSYSTEMVALUES_FIRSTSQL,
    TMP_DBSYSTEMVALUES_EDB,
    TMP_DBSYSTEMVALUES_CACHE,
    TMP_DBSYSTEMVALUES_ADABAS,
    TMP_DBSYSTEMVALUES_FIREBIRD,
    TMP_DBSYSTEMVALUES_DERBY,
    TMP_DBSYSTEMVALUES_FILEMAKER,
    TMP_DBSYSTEMVALUES_INFORMIX,
    TMP_DBSYSTEMVALUES_INSTANTDB,
    TMP_DBSYSTEMVALUES_INTERBASE,
    TMP_DBSYSTEMVALUES_MARIADB,
    TMP_DBSYSTEMVALUES_NETEZZA,
    TMP_DBSYSTEMVALUES_PERVASIVE,
    TMP_DBSYSTEMVALUES_POINTBASE,
    TMP_DBSYSTEMVALUES_SQLITE,
    TMP_DBSYSTEMVALUES_SYBASE,
    TMP_DBSYSTEMVALUES_TERADATA,
    TMP_DBSYSTEMVALUES_VERTICA,
    TMP_DBSYSTEMVALUES_H2,
    TMP_DBSYSTEMVALUES_COLDFUSION,
    TMP_DBSYSTEMVALUES_CASSANDRA,
    TMP_DBSYSTEMVALUES_HBASE,
    TMP_DBSYSTEMVALUES_MONGODB,
    TMP_DBSYSTEMVALUES_REDIS,
    TMP_DBSYSTEMVALUES_COUCHBASE,
    TMP_DBSYSTEMVALUES_COUCHDB,
    TMP_DBSYSTEMVALUES_COSMOSDB,
    TMP_DBSYSTEMVALUES_DYNAMODB,
    TMP_DBSYSTEMVALUES_NEO4J,
    TMP_DBSYSTEMVALUES_GEODE,
    TMP_DBSYSTEMVALUES_ELASTICSEARCH,
    TMP_DBSYSTEMVALUES_MEMCACHED,
    TMP_DBSYSTEMVALUES_COCKROACHDB
  ]);
  var TMP_DBCASSANDRACONSISTENCYLEVELVALUES_ALL = "all";
  var TMP_DBCASSANDRACONSISTENCYLEVELVALUES_EACH_QUORUM = "each_quorum";
  var TMP_DBCASSANDRACONSISTENCYLEVELVALUES_QUORUM = "quorum";
  var TMP_DBCASSANDRACONSISTENCYLEVELVALUES_LOCAL_QUORUM = "local_quorum";
  var TMP_DBCASSANDRACONSISTENCYLEVELVALUES_ONE = "one";
  var TMP_DBCASSANDRACONSISTENCYLEVELVALUES_TWO = "two";
  var TMP_DBCASSANDRACONSISTENCYLEVELVALUES_THREE = "three";
  var TMP_DBCASSANDRACONSISTENCYLEVELVALUES_LOCAL_ONE = "local_one";
  var TMP_DBCASSANDRACONSISTENCYLEVELVALUES_ANY = "any";
  var TMP_DBCASSANDRACONSISTENCYLEVELVALUES_SERIAL = "serial";
  var TMP_DBCASSANDRACONSISTENCYLEVELVALUES_LOCAL_SERIAL = "local_serial";
  exports.DBCASSANDRACONSISTENCYLEVELVALUES_ALL = TMP_DBCASSANDRACONSISTENCYLEVELVALUES_ALL;
  exports.DBCASSANDRACONSISTENCYLEVELVALUES_EACH_QUORUM = TMP_DBCASSANDRACONSISTENCYLEVELVALUES_EACH_QUORUM;
  exports.DBCASSANDRACONSISTENCYLEVELVALUES_QUORUM = TMP_DBCASSANDRACONSISTENCYLEVELVALUES_QUORUM;
  exports.DBCASSANDRACONSISTENCYLEVELVALUES_LOCAL_QUORUM = TMP_DBCASSANDRACONSISTENCYLEVELVALUES_LOCAL_QUORUM;
  exports.DBCASSANDRACONSISTENCYLEVELVALUES_ONE = TMP_DBCASSANDRACONSISTENCYLEVELVALUES_ONE;
  exports.DBCASSANDRACONSISTENCYLEVELVALUES_TWO = TMP_DBCASSANDRACONSISTENCYLEVELVALUES_TWO;
  exports.DBCASSANDRACONSISTENCYLEVELVALUES_THREE = TMP_DBCASSANDRACONSISTENCYLEVELVALUES_THREE;
  exports.DBCASSANDRACONSISTENCYLEVELVALUES_LOCAL_ONE = TMP_DBCASSANDRACONSISTENCYLEVELVALUES_LOCAL_ONE;
  exports.DBCASSANDRACONSISTENCYLEVELVALUES_ANY = TMP_DBCASSANDRACONSISTENCYLEVELVALUES_ANY;
  exports.DBCASSANDRACONSISTENCYLEVELVALUES_SERIAL = TMP_DBCASSANDRACONSISTENCYLEVELVALUES_SERIAL;
  exports.DBCASSANDRACONSISTENCYLEVELVALUES_LOCAL_SERIAL = TMP_DBCASSANDRACONSISTENCYLEVELVALUES_LOCAL_SERIAL;
  exports.DbCassandraConsistencyLevelValues = /* @__PURE__ */ (0, utils_1.createConstMap)([
    TMP_DBCASSANDRACONSISTENCYLEVELVALUES_ALL,
    TMP_DBCASSANDRACONSISTENCYLEVELVALUES_EACH_QUORUM,
    TMP_DBCASSANDRACONSISTENCYLEVELVALUES_QUORUM,
    TMP_DBCASSANDRACONSISTENCYLEVELVALUES_LOCAL_QUORUM,
    TMP_DBCASSANDRACONSISTENCYLEVELVALUES_ONE,
    TMP_DBCASSANDRACONSISTENCYLEVELVALUES_TWO,
    TMP_DBCASSANDRACONSISTENCYLEVELVALUES_THREE,
    TMP_DBCASSANDRACONSISTENCYLEVELVALUES_LOCAL_ONE,
    TMP_DBCASSANDRACONSISTENCYLEVELVALUES_ANY,
    TMP_DBCASSANDRACONSISTENCYLEVELVALUES_SERIAL,
    TMP_DBCASSANDRACONSISTENCYLEVELVALUES_LOCAL_SERIAL
  ]);
  var TMP_FAASTRIGGERVALUES_DATASOURCE = "datasource";
  var TMP_FAASTRIGGERVALUES_HTTP = "http";
  var TMP_FAASTRIGGERVALUES_PUBSUB = "pubsub";
  var TMP_FAASTRIGGERVALUES_TIMER = "timer";
  var TMP_FAASTRIGGERVALUES_OTHER = "other";
  exports.FAASTRIGGERVALUES_DATASOURCE = TMP_FAASTRIGGERVALUES_DATASOURCE;
  exports.FAASTRIGGERVALUES_HTTP = TMP_FAASTRIGGERVALUES_HTTP;
  exports.FAASTRIGGERVALUES_PUBSUB = TMP_FAASTRIGGERVALUES_PUBSUB;
  exports.FAASTRIGGERVALUES_TIMER = TMP_FAASTRIGGERVALUES_TIMER;
  exports.FAASTRIGGERVALUES_OTHER = TMP_FAASTRIGGERVALUES_OTHER;
  exports.FaasTriggerValues = /* @__PURE__ */ (0, utils_1.createConstMap)([
    TMP_FAASTRIGGERVALUES_DATASOURCE,
    TMP_FAASTRIGGERVALUES_HTTP,
    TMP_FAASTRIGGERVALUES_PUBSUB,
    TMP_FAASTRIGGERVALUES_TIMER,
    TMP_FAASTRIGGERVALUES_OTHER
  ]);
  var TMP_FAASDOCUMENTOPERATIONVALUES_INSERT = "insert";
  var TMP_FAASDOCUMENTOPERATIONVALUES_EDIT = "edit";
  var TMP_FAASDOCUMENTOPERATIONVALUES_DELETE = "delete";
  exports.FAASDOCUMENTOPERATIONVALUES_INSERT = TMP_FAASDOCUMENTOPERATIONVALUES_INSERT;
  exports.FAASDOCUMENTOPERATIONVALUES_EDIT = TMP_FAASDOCUMENTOPERATIONVALUES_EDIT;
  exports.FAASDOCUMENTOPERATIONVALUES_DELETE = TMP_FAASDOCUMENTOPERATIONVALUES_DELETE;
  exports.FaasDocumentOperationValues = /* @__PURE__ */ (0, utils_1.createConstMap)([
    TMP_FAASDOCUMENTOPERATIONVALUES_INSERT,
    TMP_FAASDOCUMENTOPERATIONVALUES_EDIT,
    TMP_FAASDOCUMENTOPERATIONVALUES_DELETE
  ]);
  var TMP_FAASINVOKEDPROVIDERVALUES_ALIBABA_CLOUD = "alibaba_cloud";
  var TMP_FAASINVOKEDPROVIDERVALUES_AWS = "aws";
  var TMP_FAASINVOKEDPROVIDERVALUES_AZURE = "azure";
  var TMP_FAASINVOKEDPROVIDERVALUES_GCP = "gcp";
  exports.FAASINVOKEDPROVIDERVALUES_ALIBABA_CLOUD = TMP_FAASINVOKEDPROVIDERVALUES_ALIBABA_CLOUD;
  exports.FAASINVOKEDPROVIDERVALUES_AWS = TMP_FAASINVOKEDPROVIDERVALUES_AWS;
  exports.FAASINVOKEDPROVIDERVALUES_AZURE = TMP_FAASINVOKEDPROVIDERVALUES_AZURE;
  exports.FAASINVOKEDPROVIDERVALUES_GCP = TMP_FAASINVOKEDPROVIDERVALUES_GCP;
  exports.FaasInvokedProviderValues = /* @__PURE__ */ (0, utils_1.createConstMap)([
    TMP_FAASINVOKEDPROVIDERVALUES_ALIBABA_CLOUD,
    TMP_FAASINVOKEDPROVIDERVALUES_AWS,
    TMP_FAASINVOKEDPROVIDERVALUES_AZURE,
    TMP_FAASINVOKEDPROVIDERVALUES_GCP
  ]);
  var TMP_NETTRANSPORTVALUES_IP_TCP = "ip_tcp";
  var TMP_NETTRANSPORTVALUES_IP_UDP = "ip_udp";
  var TMP_NETTRANSPORTVALUES_IP = "ip";
  var TMP_NETTRANSPORTVALUES_UNIX = "unix";
  var TMP_NETTRANSPORTVALUES_PIPE = "pipe";
  var TMP_NETTRANSPORTVALUES_INPROC = "inproc";
  var TMP_NETTRANSPORTVALUES_OTHER = "other";
  exports.NETTRANSPORTVALUES_IP_TCP = TMP_NETTRANSPORTVALUES_IP_TCP;
  exports.NETTRANSPORTVALUES_IP_UDP = TMP_NETTRANSPORTVALUES_IP_UDP;
  exports.NETTRANSPORTVALUES_IP = TMP_NETTRANSPORTVALUES_IP;
  exports.NETTRANSPORTVALUES_UNIX = TMP_NETTRANSPORTVALUES_UNIX;
  exports.NETTRANSPORTVALUES_PIPE = TMP_NETTRANSPORTVALUES_PIPE;
  exports.NETTRANSPORTVALUES_INPROC = TMP_NETTRANSPORTVALUES_INPROC;
  exports.NETTRANSPORTVALUES_OTHER = TMP_NETTRANSPORTVALUES_OTHER;
  exports.NetTransportValues = /* @__PURE__ */ (0, utils_1.createConstMap)([
    TMP_NETTRANSPORTVALUES_IP_TCP,
    TMP_NETTRANSPORTVALUES_IP_UDP,
    TMP_NETTRANSPORTVALUES_IP,
    TMP_NETTRANSPORTVALUES_UNIX,
    TMP_NETTRANSPORTVALUES_PIPE,
    TMP_NETTRANSPORTVALUES_INPROC,
    TMP_NETTRANSPORTVALUES_OTHER
  ]);
  var TMP_NETHOSTCONNECTIONTYPEVALUES_WIFI = "wifi";
  var TMP_NETHOSTCONNECTIONTYPEVALUES_WIRED = "wired";
  var TMP_NETHOSTCONNECTIONTYPEVALUES_CELL = "cell";
  var TMP_NETHOSTCONNECTIONTYPEVALUES_UNAVAILABLE = "unavailable";
  var TMP_NETHOSTCONNECTIONTYPEVALUES_UNKNOWN = "unknown";
  exports.NETHOSTCONNECTIONTYPEVALUES_WIFI = TMP_NETHOSTCONNECTIONTYPEVALUES_WIFI;
  exports.NETHOSTCONNECTIONTYPEVALUES_WIRED = TMP_NETHOSTCONNECTIONTYPEVALUES_WIRED;
  exports.NETHOSTCONNECTIONTYPEVALUES_CELL = TMP_NETHOSTCONNECTIONTYPEVALUES_CELL;
  exports.NETHOSTCONNECTIONTYPEVALUES_UNAVAILABLE = TMP_NETHOSTCONNECTIONTYPEVALUES_UNAVAILABLE;
  exports.NETHOSTCONNECTIONTYPEVALUES_UNKNOWN = TMP_NETHOSTCONNECTIONTYPEVALUES_UNKNOWN;
  exports.NetHostConnectionTypeValues = /* @__PURE__ */ (0, utils_1.createConstMap)([
    TMP_NETHOSTCONNECTIONTYPEVALUES_WIFI,
    TMP_NETHOSTCONNECTIONTYPEVALUES_WIRED,
    TMP_NETHOSTCONNECTIONTYPEVALUES_CELL,
    TMP_NETHOSTCONNECTIONTYPEVALUES_UNAVAILABLE,
    TMP_NETHOSTCONNECTIONTYPEVALUES_UNKNOWN
  ]);
  var TMP_NETHOSTCONNECTIONSUBTYPEVALUES_GPRS = "gprs";
  var TMP_NETHOSTCONNECTIONSUBTYPEVALUES_EDGE = "edge";
  var TMP_NETHOSTCONNECTIONSUBTYPEVALUES_UMTS = "umts";
  var TMP_NETHOSTCONNECTIONSUBTYPEVALUES_CDMA = "cdma";
  var TMP_NETHOSTCONNECTIONSUBTYPEVALUES_EVDO_0 = "evdo_0";
  var TMP_NETHOSTCONNECTIONSUBTYPEVALUES_EVDO_A = "evdo_a";
  var TMP_NETHOSTCONNECTIONSUBTYPEVALUES_CDMA2000_1XRTT = "cdma2000_1xrtt";
  var TMP_NETHOSTCONNECTIONSUBTYPEVALUES_HSDPA = "hsdpa";
  var TMP_NETHOSTCONNECTIONSUBTYPEVALUES_HSUPA = "hsupa";
  var TMP_NETHOSTCONNECTIONSUBTYPEVALUES_HSPA = "hspa";
  var TMP_NETHOSTCONNECTIONSUBTYPEVALUES_IDEN = "iden";
  var TMP_NETHOSTCONNECTIONSUBTYPEVALUES_EVDO_B = "evdo_b";
  var TMP_NETHOSTCONNECTIONSUBTYPEVALUES_LTE = "lte";
  var TMP_NETHOSTCONNECTIONSUBTYPEVALUES_EHRPD = "ehrpd";
  var TMP_NETHOSTCONNECTIONSUBTYPEVALUES_HSPAP = "hspap";
  var TMP_NETHOSTCONNECTIONSUBTYPEVALUES_GSM = "gsm";
  var TMP_NETHOSTCONNECTIONSUBTYPEVALUES_TD_SCDMA = "td_scdma";
  var TMP_NETHOSTCONNECTIONSUBTYPEVALUES_IWLAN = "iwlan";
  var TMP_NETHOSTCONNECTIONSUBTYPEVALUES_NR = "nr";
  var TMP_NETHOSTCONNECTIONSUBTYPEVALUES_NRNSA = "nrnsa";
  var TMP_NETHOSTCONNECTIONSUBTYPEVALUES_LTE_CA = "lte_ca";
  exports.NETHOSTCONNECTIONSUBTYPEVALUES_GPRS = TMP_NETHOSTCONNECTIONSUBTYPEVALUES_GPRS;
  exports.NETHOSTCONNECTIONSUBTYPEVALUES_EDGE = TMP_NETHOSTCONNECTIONSUBTYPEVALUES_EDGE;
  exports.NETHOSTCONNECTIONSUBTYPEVALUES_UMTS = TMP_NETHOSTCONNECTIONSUBTYPEVALUES_UMTS;
  exports.NETHOSTCONNECTIONSUBTYPEVALUES_CDMA = TMP_NETHOSTCONNECTIONSUBTYPEVALUES_CDMA;
  exports.NETHOSTCONNECTIONSUBTYPEVALUES_EVDO_0 = TMP_NETHOSTCONNECTIONSUBTYPEVALUES_EVDO_0;
  exports.NETHOSTCONNECTIONSUBTYPEVALUES_EVDO_A = TMP_NETHOSTCONNECTIONSUBTYPEVALUES_EVDO_A;
  exports.NETHOSTCONNECTIONSUBTYPEVALUES_CDMA2000_1XRTT = TMP_NETHOSTCONNECTIONSUBTYPEVALUES_CDMA2000_1XRTT;
  exports.NETHOSTCONNECTIONSUBTYPEVALUES_HSDPA = TMP_NETHOSTCONNECTIONSUBTYPEVALUES_HSDPA;
  exports.NETHOSTCONNECTIONSUBTYPEVALUES_HSUPA = TMP_NETHOSTCONNECTIONSUBTYPEVALUES_HSUPA;
  exports.NETHOSTCONNECTIONSUBTYPEVALUES_HSPA = TMP_NETHOSTCONNECTIONSUBTYPEVALUES_HSPA;
  exports.NETHOSTCONNECTIONSUBTYPEVALUES_IDEN = TMP_NETHOSTCONNECTIONSUBTYPEVALUES_IDEN;
  exports.NETHOSTCONNECTIONSUBTYPEVALUES_EVDO_B = TMP_NETHOSTCONNECTIONSUBTYPEVALUES_EVDO_B;
  exports.NETHOSTCONNECTIONSUBTYPEVALUES_LTE = TMP_NETHOSTCONNECTIONSUBTYPEVALUES_LTE;
  exports.NETHOSTCONNECTIONSUBTYPEVALUES_EHRPD = TMP_NETHOSTCONNECTIONSUBTYPEVALUES_EHRPD;
  exports.NETHOSTCONNECTIONSUBTYPEVALUES_HSPAP = TMP_NETHOSTCONNECTIONSUBTYPEVALUES_HSPAP;
  exports.NETHOSTCONNECTIONSUBTYPEVALUES_GSM = TMP_NETHOSTCONNECTIONSUBTYPEVALUES_GSM;
  exports.NETHOSTCONNECTIONSUBTYPEVALUES_TD_SCDMA = TMP_NETHOSTCONNECTIONSUBTYPEVALUES_TD_SCDMA;
  exports.NETHOSTCONNECTIONSUBTYPEVALUES_IWLAN = TMP_NETHOSTCONNECTIONSUBTYPEVALUES_IWLAN;
  exports.NETHOSTCONNECTIONSUBTYPEVALUES_NR = TMP_NETHOSTCONNECTIONSUBTYPEVALUES_NR;
  exports.NETHOSTCONNECTIONSUBTYPEVALUES_NRNSA = TMP_NETHOSTCONNECTIONSUBTYPEVALUES_NRNSA;
  exports.NETHOSTCONNECTIONSUBTYPEVALUES_LTE_CA = TMP_NETHOSTCONNECTIONSUBTYPEVALUES_LTE_CA;
  exports.NetHostConnectionSubtypeValues = /* @__PURE__ */ (0, utils_1.createConstMap)([
    TMP_NETHOSTCONNECTIONSUBTYPEVALUES_GPRS,
    TMP_NETHOSTCONNECTIONSUBTYPEVALUES_EDGE,
    TMP_NETHOSTCONNECTIONSUBTYPEVALUES_UMTS,
    TMP_NETHOSTCONNECTIONSUBTYPEVALUES_CDMA,
    TMP_NETHOSTCONNECTIONSUBTYPEVALUES_EVDO_0,
    TMP_NETHOSTCONNECTIONSUBTYPEVALUES_EVDO_A,
    TMP_NETHOSTCONNECTIONSUBTYPEVALUES_CDMA2000_1XRTT,
    TMP_NETHOSTCONNECTIONSUBTYPEVALUES_HSDPA,
    TMP_NETHOSTCONNECTIONSUBTYPEVALUES_HSUPA,
    TMP_NETHOSTCONNECTIONSUBTYPEVALUES_HSPA,
    TMP_NETHOSTCONNECTIONSUBTYPEVALUES_IDEN,
    TMP_NETHOSTCONNECTIONSUBTYPEVALUES_EVDO_B,
    TMP_NETHOSTCONNECTIONSUBTYPEVALUES_LTE,
    TMP_NETHOSTCONNECTIONSUBTYPEVALUES_EHRPD,
    TMP_NETHOSTCONNECTIONSUBTYPEVALUES_HSPAP,
    TMP_NETHOSTCONNECTIONSUBTYPEVALUES_GSM,
    TMP_NETHOSTCONNECTIONSUBTYPEVALUES_TD_SCDMA,
    TMP_NETHOSTCONNECTIONSUBTYPEVALUES_IWLAN,
    TMP_NETHOSTCONNECTIONSUBTYPEVALUES_NR,
    TMP_NETHOSTCONNECTIONSUBTYPEVALUES_NRNSA,
    TMP_NETHOSTCONNECTIONSUBTYPEVALUES_LTE_CA
  ]);
  var TMP_HTTPFLAVORVALUES_HTTP_1_0 = "1.0";
  var TMP_HTTPFLAVORVALUES_HTTP_1_1 = "1.1";
  var TMP_HTTPFLAVORVALUES_HTTP_2_0 = "2.0";
  var TMP_HTTPFLAVORVALUES_SPDY = "SPDY";
  var TMP_HTTPFLAVORVALUES_QUIC = "QUIC";
  exports.HTTPFLAVORVALUES_HTTP_1_0 = TMP_HTTPFLAVORVALUES_HTTP_1_0;
  exports.HTTPFLAVORVALUES_HTTP_1_1 = TMP_HTTPFLAVORVALUES_HTTP_1_1;
  exports.HTTPFLAVORVALUES_HTTP_2_0 = TMP_HTTPFLAVORVALUES_HTTP_2_0;
  exports.HTTPFLAVORVALUES_SPDY = TMP_HTTPFLAVORVALUES_SPDY;
  exports.HTTPFLAVORVALUES_QUIC = TMP_HTTPFLAVORVALUES_QUIC;
  exports.HttpFlavorValues = {
    HTTP_1_0: TMP_HTTPFLAVORVALUES_HTTP_1_0,
    HTTP_1_1: TMP_HTTPFLAVORVALUES_HTTP_1_1,
    HTTP_2_0: TMP_HTTPFLAVORVALUES_HTTP_2_0,
    SPDY: TMP_HTTPFLAVORVALUES_SPDY,
    QUIC: TMP_HTTPFLAVORVALUES_QUIC
  };
  var TMP_MESSAGINGDESTINATIONKINDVALUES_QUEUE = "queue";
  var TMP_MESSAGINGDESTINATIONKINDVALUES_TOPIC = "topic";
  exports.MESSAGINGDESTINATIONKINDVALUES_QUEUE = TMP_MESSAGINGDESTINATIONKINDVALUES_QUEUE;
  exports.MESSAGINGDESTINATIONKINDVALUES_TOPIC = TMP_MESSAGINGDESTINATIONKINDVALUES_TOPIC;
  exports.MessagingDestinationKindValues = /* @__PURE__ */ (0, utils_1.createConstMap)([
    TMP_MESSAGINGDESTINATIONKINDVALUES_QUEUE,
    TMP_MESSAGINGDESTINATIONKINDVALUES_TOPIC
  ]);
  var TMP_MESSAGINGOPERATIONVALUES_RECEIVE = "receive";
  var TMP_MESSAGINGOPERATIONVALUES_PROCESS = "process";
  exports.MESSAGINGOPERATIONVALUES_RECEIVE = TMP_MESSAGINGOPERATIONVALUES_RECEIVE;
  exports.MESSAGINGOPERATIONVALUES_PROCESS = TMP_MESSAGINGOPERATIONVALUES_PROCESS;
  exports.MessagingOperationValues = /* @__PURE__ */ (0, utils_1.createConstMap)([
    TMP_MESSAGINGOPERATIONVALUES_RECEIVE,
    TMP_MESSAGINGOPERATIONVALUES_PROCESS
  ]);
  var TMP_RPCGRPCSTATUSCODEVALUES_OK = 0;
  var TMP_RPCGRPCSTATUSCODEVALUES_CANCELLED = 1;
  var TMP_RPCGRPCSTATUSCODEVALUES_UNKNOWN = 2;
  var TMP_RPCGRPCSTATUSCODEVALUES_INVALID_ARGUMENT = 3;
  var TMP_RPCGRPCSTATUSCODEVALUES_DEADLINE_EXCEEDED = 4;
  var TMP_RPCGRPCSTATUSCODEVALUES_NOT_FOUND = 5;
  var TMP_RPCGRPCSTATUSCODEVALUES_ALREADY_EXISTS = 6;
  var TMP_RPCGRPCSTATUSCODEVALUES_PERMISSION_DENIED = 7;
  var TMP_RPCGRPCSTATUSCODEVALUES_RESOURCE_EXHAUSTED = 8;
  var TMP_RPCGRPCSTATUSCODEVALUES_FAILED_PRECONDITION = 9;
  var TMP_RPCGRPCSTATUSCODEVALUES_ABORTED = 10;
  var TMP_RPCGRPCSTATUSCODEVALUES_OUT_OF_RANGE = 11;
  var TMP_RPCGRPCSTATUSCODEVALUES_UNIMPLEMENTED = 12;
  var TMP_RPCGRPCSTATUSCODEVALUES_INTERNAL = 13;
  var TMP_RPCGRPCSTATUSCODEVALUES_UNAVAILABLE = 14;
  var TMP_RPCGRPCSTATUSCODEVALUES_DATA_LOSS = 15;
  var TMP_RPCGRPCSTATUSCODEVALUES_UNAUTHENTICATED = 16;
  exports.RPCGRPCSTATUSCODEVALUES_OK = TMP_RPCGRPCSTATUSCODEVALUES_OK;
  exports.RPCGRPCSTATUSCODEVALUES_CANCELLED = TMP_RPCGRPCSTATUSCODEVALUES_CANCELLED;
  exports.RPCGRPCSTATUSCODEVALUES_UNKNOWN = TMP_RPCGRPCSTATUSCODEVALUES_UNKNOWN;
  exports.RPCGRPCSTATUSCODEVALUES_INVALID_ARGUMENT = TMP_RPCGRPCSTATUSCODEVALUES_INVALID_ARGUMENT;
  exports.RPCGRPCSTATUSCODEVALUES_DEADLINE_EXCEEDED = TMP_RPCGRPCSTATUSCODEVALUES_DEADLINE_EXCEEDED;
  exports.RPCGRPCSTATUSCODEVALUES_NOT_FOUND = TMP_RPCGRPCSTATUSCODEVALUES_NOT_FOUND;
  exports.RPCGRPCSTATUSCODEVALUES_ALREADY_EXISTS = TMP_RPCGRPCSTATUSCODEVALUES_ALREADY_EXISTS;
  exports.RPCGRPCSTATUSCODEVALUES_PERMISSION_DENIED = TMP_RPCGRPCSTATUSCODEVALUES_PERMISSION_DENIED;
  exports.RPCGRPCSTATUSCODEVALUES_RESOURCE_EXHAUSTED = TMP_RPCGRPCSTATUSCODEVALUES_RESOURCE_EXHAUSTED;
  exports.RPCGRPCSTATUSCODEVALUES_FAILED_PRECONDITION = TMP_RPCGRPCSTATUSCODEVALUES_FAILED_PRECONDITION;
  exports.RPCGRPCSTATUSCODEVALUES_ABORTED = TMP_RPCGRPCSTATUSCODEVALUES_ABORTED;
  exports.RPCGRPCSTATUSCODEVALUES_OUT_OF_RANGE = TMP_RPCGRPCSTATUSCODEVALUES_OUT_OF_RANGE;
  exports.RPCGRPCSTATUSCODEVALUES_UNIMPLEMENTED = TMP_RPCGRPCSTATUSCODEVALUES_UNIMPLEMENTED;
  exports.RPCGRPCSTATUSCODEVALUES_INTERNAL = TMP_RPCGRPCSTATUSCODEVALUES_INTERNAL;
  exports.RPCGRPCSTATUSCODEVALUES_UNAVAILABLE = TMP_RPCGRPCSTATUSCODEVALUES_UNAVAILABLE;
  exports.RPCGRPCSTATUSCODEVALUES_DATA_LOSS = TMP_RPCGRPCSTATUSCODEVALUES_DATA_LOSS;
  exports.RPCGRPCSTATUSCODEVALUES_UNAUTHENTICATED = TMP_RPCGRPCSTATUSCODEVALUES_UNAUTHENTICATED;
  exports.RpcGrpcStatusCodeValues = {
    OK: TMP_RPCGRPCSTATUSCODEVALUES_OK,
    CANCELLED: TMP_RPCGRPCSTATUSCODEVALUES_CANCELLED,
    UNKNOWN: TMP_RPCGRPCSTATUSCODEVALUES_UNKNOWN,
    INVALID_ARGUMENT: TMP_RPCGRPCSTATUSCODEVALUES_INVALID_ARGUMENT,
    DEADLINE_EXCEEDED: TMP_RPCGRPCSTATUSCODEVALUES_DEADLINE_EXCEEDED,
    NOT_FOUND: TMP_RPCGRPCSTATUSCODEVALUES_NOT_FOUND,
    ALREADY_EXISTS: TMP_RPCGRPCSTATUSCODEVALUES_ALREADY_EXISTS,
    PERMISSION_DENIED: TMP_RPCGRPCSTATUSCODEVALUES_PERMISSION_DENIED,
    RESOURCE_EXHAUSTED: TMP_RPCGRPCSTATUSCODEVALUES_RESOURCE_EXHAUSTED,
    FAILED_PRECONDITION: TMP_RPCGRPCSTATUSCODEVALUES_FAILED_PRECONDITION,
    ABORTED: TMP_RPCGRPCSTATUSCODEVALUES_ABORTED,
    OUT_OF_RANGE: TMP_RPCGRPCSTATUSCODEVALUES_OUT_OF_RANGE,
    UNIMPLEMENTED: TMP_RPCGRPCSTATUSCODEVALUES_UNIMPLEMENTED,
    INTERNAL: TMP_RPCGRPCSTATUSCODEVALUES_INTERNAL,
    UNAVAILABLE: TMP_RPCGRPCSTATUSCODEVALUES_UNAVAILABLE,
    DATA_LOSS: TMP_RPCGRPCSTATUSCODEVALUES_DATA_LOSS,
    UNAUTHENTICATED: TMP_RPCGRPCSTATUSCODEVALUES_UNAUTHENTICATED
  };
  var TMP_MESSAGETYPEVALUES_SENT = "SENT";
  var TMP_MESSAGETYPEVALUES_RECEIVED = "RECEIVED";
  exports.MESSAGETYPEVALUES_SENT = TMP_MESSAGETYPEVALUES_SENT;
  exports.MESSAGETYPEVALUES_RECEIVED = TMP_MESSAGETYPEVALUES_RECEIVED;
  exports.MessageTypeValues = /* @__PURE__ */ (0, utils_1.createConstMap)([
    TMP_MESSAGETYPEVALUES_SENT,
    TMP_MESSAGETYPEVALUES_RECEIVED
  ]);
});

// node_modules/@opentelemetry/resources/node_modules/@opentelemetry/semantic-conventions/build/src/trace/index.js
var require_trace4 = __commonJS((exports) => {
  var __createBinding = exports && exports.__createBinding || (Object.create ? function(o, m, k, k2) {
    if (k2 === undefined)
      k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() {
      return m[k];
    } });
  } : function(o, m, k, k2) {
    if (k2 === undefined)
      k2 = k;
    o[k2] = m[k];
  });
  var __exportStar = exports && exports.__exportStar || function(m, exports2) {
    for (var p in m)
      if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p))
        __createBinding(exports2, m, p);
  };
  Object.defineProperty(exports, "__esModule", { value: true });
  __exportStar(require_SemanticAttributes3(), exports);
});

// node_modules/@opentelemetry/resources/node_modules/@opentelemetry/semantic-conventions/build/src/resource/SemanticResourceAttributes.js
var require_SemanticResourceAttributes3 = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.SEMRESATTRS_K8S_STATEFULSET_NAME = exports.SEMRESATTRS_K8S_STATEFULSET_UID = exports.SEMRESATTRS_K8S_DEPLOYMENT_NAME = exports.SEMRESATTRS_K8S_DEPLOYMENT_UID = exports.SEMRESATTRS_K8S_REPLICASET_NAME = exports.SEMRESATTRS_K8S_REPLICASET_UID = exports.SEMRESATTRS_K8S_CONTAINER_NAME = exports.SEMRESATTRS_K8S_POD_NAME = exports.SEMRESATTRS_K8S_POD_UID = exports.SEMRESATTRS_K8S_NAMESPACE_NAME = exports.SEMRESATTRS_K8S_NODE_UID = exports.SEMRESATTRS_K8S_NODE_NAME = exports.SEMRESATTRS_K8S_CLUSTER_NAME = exports.SEMRESATTRS_HOST_IMAGE_VERSION = exports.SEMRESATTRS_HOST_IMAGE_ID = exports.SEMRESATTRS_HOST_IMAGE_NAME = exports.SEMRESATTRS_HOST_ARCH = exports.SEMRESATTRS_HOST_TYPE = exports.SEMRESATTRS_HOST_NAME = exports.SEMRESATTRS_HOST_ID = exports.SEMRESATTRS_FAAS_MAX_MEMORY = exports.SEMRESATTRS_FAAS_INSTANCE = exports.SEMRESATTRS_FAAS_VERSION = exports.SEMRESATTRS_FAAS_ID = exports.SEMRESATTRS_FAAS_NAME = exports.SEMRESATTRS_DEVICE_MODEL_NAME = exports.SEMRESATTRS_DEVICE_MODEL_IDENTIFIER = exports.SEMRESATTRS_DEVICE_ID = exports.SEMRESATTRS_DEPLOYMENT_ENVIRONMENT = exports.SEMRESATTRS_CONTAINER_IMAGE_TAG = exports.SEMRESATTRS_CONTAINER_IMAGE_NAME = exports.SEMRESATTRS_CONTAINER_RUNTIME = exports.SEMRESATTRS_CONTAINER_ID = exports.SEMRESATTRS_CONTAINER_NAME = exports.SEMRESATTRS_AWS_LOG_STREAM_ARNS = exports.SEMRESATTRS_AWS_LOG_STREAM_NAMES = exports.SEMRESATTRS_AWS_LOG_GROUP_ARNS = exports.SEMRESATTRS_AWS_LOG_GROUP_NAMES = exports.SEMRESATTRS_AWS_EKS_CLUSTER_ARN = exports.SEMRESATTRS_AWS_ECS_TASK_REVISION = exports.SEMRESATTRS_AWS_ECS_TASK_FAMILY = exports.SEMRESATTRS_AWS_ECS_TASK_ARN = exports.SEMRESATTRS_AWS_ECS_LAUNCHTYPE = exports.SEMRESATTRS_AWS_ECS_CLUSTER_ARN = exports.SEMRESATTRS_AWS_ECS_CONTAINER_ARN = exports.SEMRESATTRS_CLOUD_PLATFORM = exports.SEMRESATTRS_CLOUD_AVAILABILITY_ZONE = exports.SEMRESATTRS_CLOUD_REGION = exports.SEMRESATTRS_CLOUD_ACCOUNT_ID = exports.SEMRESATTRS_CLOUD_PROVIDER = undefined;
  exports.CLOUDPLATFORMVALUES_GCP_COMPUTE_ENGINE = exports.CLOUDPLATFORMVALUES_AZURE_APP_SERVICE = exports.CLOUDPLATFORMVALUES_AZURE_FUNCTIONS = exports.CLOUDPLATFORMVALUES_AZURE_AKS = exports.CLOUDPLATFORMVALUES_AZURE_CONTAINER_INSTANCES = exports.CLOUDPLATFORMVALUES_AZURE_VM = exports.CLOUDPLATFORMVALUES_AWS_ELASTIC_BEANSTALK = exports.CLOUDPLATFORMVALUES_AWS_LAMBDA = exports.CLOUDPLATFORMVALUES_AWS_EKS = exports.CLOUDPLATFORMVALUES_AWS_ECS = exports.CLOUDPLATFORMVALUES_AWS_EC2 = exports.CLOUDPLATFORMVALUES_ALIBABA_CLOUD_FC = exports.CLOUDPLATFORMVALUES_ALIBABA_CLOUD_ECS = exports.CloudProviderValues = exports.CLOUDPROVIDERVALUES_GCP = exports.CLOUDPROVIDERVALUES_AZURE = exports.CLOUDPROVIDERVALUES_AWS = exports.CLOUDPROVIDERVALUES_ALIBABA_CLOUD = exports.SemanticResourceAttributes = exports.SEMRESATTRS_WEBENGINE_DESCRIPTION = exports.SEMRESATTRS_WEBENGINE_VERSION = exports.SEMRESATTRS_WEBENGINE_NAME = exports.SEMRESATTRS_TELEMETRY_AUTO_VERSION = exports.SEMRESATTRS_TELEMETRY_SDK_VERSION = exports.SEMRESATTRS_TELEMETRY_SDK_LANGUAGE = exports.SEMRESATTRS_TELEMETRY_SDK_NAME = exports.SEMRESATTRS_SERVICE_VERSION = exports.SEMRESATTRS_SERVICE_INSTANCE_ID = exports.SEMRESATTRS_SERVICE_NAMESPACE = exports.SEMRESATTRS_SERVICE_NAME = exports.SEMRESATTRS_PROCESS_RUNTIME_DESCRIPTION = exports.SEMRESATTRS_PROCESS_RUNTIME_VERSION = exports.SEMRESATTRS_PROCESS_RUNTIME_NAME = exports.SEMRESATTRS_PROCESS_OWNER = exports.SEMRESATTRS_PROCESS_COMMAND_ARGS = exports.SEMRESATTRS_PROCESS_COMMAND_LINE = exports.SEMRESATTRS_PROCESS_COMMAND = exports.SEMRESATTRS_PROCESS_EXECUTABLE_PATH = exports.SEMRESATTRS_PROCESS_EXECUTABLE_NAME = exports.SEMRESATTRS_PROCESS_PID = exports.SEMRESATTRS_OS_VERSION = exports.SEMRESATTRS_OS_NAME = exports.SEMRESATTRS_OS_DESCRIPTION = exports.SEMRESATTRS_OS_TYPE = exports.SEMRESATTRS_K8S_CRONJOB_NAME = exports.SEMRESATTRS_K8S_CRONJOB_UID = exports.SEMRESATTRS_K8S_JOB_NAME = exports.SEMRESATTRS_K8S_JOB_UID = exports.SEMRESATTRS_K8S_DAEMONSET_NAME = exports.SEMRESATTRS_K8S_DAEMONSET_UID = undefined;
  exports.TelemetrySdkLanguageValues = exports.TELEMETRYSDKLANGUAGEVALUES_WEBJS = exports.TELEMETRYSDKLANGUAGEVALUES_RUBY = exports.TELEMETRYSDKLANGUAGEVALUES_PYTHON = exports.TELEMETRYSDKLANGUAGEVALUES_PHP = exports.TELEMETRYSDKLANGUAGEVALUES_NODEJS = exports.TELEMETRYSDKLANGUAGEVALUES_JAVA = exports.TELEMETRYSDKLANGUAGEVALUES_GO = exports.TELEMETRYSDKLANGUAGEVALUES_ERLANG = exports.TELEMETRYSDKLANGUAGEVALUES_DOTNET = exports.TELEMETRYSDKLANGUAGEVALUES_CPP = exports.OsTypeValues = exports.OSTYPEVALUES_Z_OS = exports.OSTYPEVALUES_SOLARIS = exports.OSTYPEVALUES_AIX = exports.OSTYPEVALUES_HPUX = exports.OSTYPEVALUES_DRAGONFLYBSD = exports.OSTYPEVALUES_OPENBSD = exports.OSTYPEVALUES_NETBSD = exports.OSTYPEVALUES_FREEBSD = exports.OSTYPEVALUES_DARWIN = exports.OSTYPEVALUES_LINUX = exports.OSTYPEVALUES_WINDOWS = exports.HostArchValues = exports.HOSTARCHVALUES_X86 = exports.HOSTARCHVALUES_PPC64 = exports.HOSTARCHVALUES_PPC32 = exports.HOSTARCHVALUES_IA64 = exports.HOSTARCHVALUES_ARM64 = exports.HOSTARCHVALUES_ARM32 = exports.HOSTARCHVALUES_AMD64 = exports.AwsEcsLaunchtypeValues = exports.AWSECSLAUNCHTYPEVALUES_FARGATE = exports.AWSECSLAUNCHTYPEVALUES_EC2 = exports.CloudPlatformValues = exports.CLOUDPLATFORMVALUES_GCP_APP_ENGINE = exports.CLOUDPLATFORMVALUES_GCP_CLOUD_FUNCTIONS = exports.CLOUDPLATFORMVALUES_GCP_KUBERNETES_ENGINE = exports.CLOUDPLATFORMVALUES_GCP_CLOUD_RUN = undefined;
  var utils_1 = require_utils6();
  var TMP_CLOUD_PROVIDER = "cloud.provider";
  var TMP_CLOUD_ACCOUNT_ID = "cloud.account.id";
  var TMP_CLOUD_REGION = "cloud.region";
  var TMP_CLOUD_AVAILABILITY_ZONE = "cloud.availability_zone";
  var TMP_CLOUD_PLATFORM = "cloud.platform";
  var TMP_AWS_ECS_CONTAINER_ARN = "aws.ecs.container.arn";
  var TMP_AWS_ECS_CLUSTER_ARN = "aws.ecs.cluster.arn";
  var TMP_AWS_ECS_LAUNCHTYPE = "aws.ecs.launchtype";
  var TMP_AWS_ECS_TASK_ARN = "aws.ecs.task.arn";
  var TMP_AWS_ECS_TASK_FAMILY = "aws.ecs.task.family";
  var TMP_AWS_ECS_TASK_REVISION = "aws.ecs.task.revision";
  var TMP_AWS_EKS_CLUSTER_ARN = "aws.eks.cluster.arn";
  var TMP_AWS_LOG_GROUP_NAMES = "aws.log.group.names";
  var TMP_AWS_LOG_GROUP_ARNS = "aws.log.group.arns";
  var TMP_AWS_LOG_STREAM_NAMES = "aws.log.stream.names";
  var TMP_AWS_LOG_STREAM_ARNS = "aws.log.stream.arns";
  var TMP_CONTAINER_NAME = "container.name";
  var TMP_CONTAINER_ID = "container.id";
  var TMP_CONTAINER_RUNTIME = "container.runtime";
  var TMP_CONTAINER_IMAGE_NAME = "container.image.name";
  var TMP_CONTAINER_IMAGE_TAG = "container.image.tag";
  var TMP_DEPLOYMENT_ENVIRONMENT = "deployment.environment";
  var TMP_DEVICE_ID = "device.id";
  var TMP_DEVICE_MODEL_IDENTIFIER = "device.model.identifier";
  var TMP_DEVICE_MODEL_NAME = "device.model.name";
  var TMP_FAAS_NAME = "faas.name";
  var TMP_FAAS_ID = "faas.id";
  var TMP_FAAS_VERSION = "faas.version";
  var TMP_FAAS_INSTANCE = "faas.instance";
  var TMP_FAAS_MAX_MEMORY = "faas.max_memory";
  var TMP_HOST_ID = "host.id";
  var TMP_HOST_NAME = "host.name";
  var TMP_HOST_TYPE = "host.type";
  var TMP_HOST_ARCH = "host.arch";
  var TMP_HOST_IMAGE_NAME = "host.image.name";
  var TMP_HOST_IMAGE_ID = "host.image.id";
  var TMP_HOST_IMAGE_VERSION = "host.image.version";
  var TMP_K8S_CLUSTER_NAME = "k8s.cluster.name";
  var TMP_K8S_NODE_NAME = "k8s.node.name";
  var TMP_K8S_NODE_UID = "k8s.node.uid";
  var TMP_K8S_NAMESPACE_NAME = "k8s.namespace.name";
  var TMP_K8S_POD_UID = "k8s.pod.uid";
  var TMP_K8S_POD_NAME = "k8s.pod.name";
  var TMP_K8S_CONTAINER_NAME = "k8s.container.name";
  var TMP_K8S_REPLICASET_UID = "k8s.replicaset.uid";
  var TMP_K8S_REPLICASET_NAME = "k8s.replicaset.name";
  var TMP_K8S_DEPLOYMENT_UID = "k8s.deployment.uid";
  var TMP_K8S_DEPLOYMENT_NAME = "k8s.deployment.name";
  var TMP_K8S_STATEFULSET_UID = "k8s.statefulset.uid";
  var TMP_K8S_STATEFULSET_NAME = "k8s.statefulset.name";
  var TMP_K8S_DAEMONSET_UID = "k8s.daemonset.uid";
  var TMP_K8S_DAEMONSET_NAME = "k8s.daemonset.name";
  var TMP_K8S_JOB_UID = "k8s.job.uid";
  var TMP_K8S_JOB_NAME = "k8s.job.name";
  var TMP_K8S_CRONJOB_UID = "k8s.cronjob.uid";
  var TMP_K8S_CRONJOB_NAME = "k8s.cronjob.name";
  var TMP_OS_TYPE = "os.type";
  var TMP_OS_DESCRIPTION = "os.description";
  var TMP_OS_NAME = "os.name";
  var TMP_OS_VERSION = "os.version";
  var TMP_PROCESS_PID = "process.pid";
  var TMP_PROCESS_EXECUTABLE_NAME = "process.executable.name";
  var TMP_PROCESS_EXECUTABLE_PATH = "process.executable.path";
  var TMP_PROCESS_COMMAND = "process.command";
  var TMP_PROCESS_COMMAND_LINE = "process.command_line";
  var TMP_PROCESS_COMMAND_ARGS = "process.command_args";
  var TMP_PROCESS_OWNER = "process.owner";
  var TMP_PROCESS_RUNTIME_NAME = "process.runtime.name";
  var TMP_PROCESS_RUNTIME_VERSION = "process.runtime.version";
  var TMP_PROCESS_RUNTIME_DESCRIPTION = "process.runtime.description";
  var TMP_SERVICE_NAME = "service.name";
  var TMP_SERVICE_NAMESPACE = "service.namespace";
  var TMP_SERVICE_INSTANCE_ID = "service.instance.id";
  var TMP_SERVICE_VERSION = "service.version";
  var TMP_TELEMETRY_SDK_NAME = "telemetry.sdk.name";
  var TMP_TELEMETRY_SDK_LANGUAGE = "telemetry.sdk.language";
  var TMP_TELEMETRY_SDK_VERSION = "telemetry.sdk.version";
  var TMP_TELEMETRY_AUTO_VERSION = "telemetry.auto.version";
  var TMP_WEBENGINE_NAME = "webengine.name";
  var TMP_WEBENGINE_VERSION = "webengine.version";
  var TMP_WEBENGINE_DESCRIPTION = "webengine.description";
  exports.SEMRESATTRS_CLOUD_PROVIDER = TMP_CLOUD_PROVIDER;
  exports.SEMRESATTRS_CLOUD_ACCOUNT_ID = TMP_CLOUD_ACCOUNT_ID;
  exports.SEMRESATTRS_CLOUD_REGION = TMP_CLOUD_REGION;
  exports.SEMRESATTRS_CLOUD_AVAILABILITY_ZONE = TMP_CLOUD_AVAILABILITY_ZONE;
  exports.SEMRESATTRS_CLOUD_PLATFORM = TMP_CLOUD_PLATFORM;
  exports.SEMRESATTRS_AWS_ECS_CONTAINER_ARN = TMP_AWS_ECS_CONTAINER_ARN;
  exports.SEMRESATTRS_AWS_ECS_CLUSTER_ARN = TMP_AWS_ECS_CLUSTER_ARN;
  exports.SEMRESATTRS_AWS_ECS_LAUNCHTYPE = TMP_AWS_ECS_LAUNCHTYPE;
  exports.SEMRESATTRS_AWS_ECS_TASK_ARN = TMP_AWS_ECS_TASK_ARN;
  exports.SEMRESATTRS_AWS_ECS_TASK_FAMILY = TMP_AWS_ECS_TASK_FAMILY;
  exports.SEMRESATTRS_AWS_ECS_TASK_REVISION = TMP_AWS_ECS_TASK_REVISION;
  exports.SEMRESATTRS_AWS_EKS_CLUSTER_ARN = TMP_AWS_EKS_CLUSTER_ARN;
  exports.SEMRESATTRS_AWS_LOG_GROUP_NAMES = TMP_AWS_LOG_GROUP_NAMES;
  exports.SEMRESATTRS_AWS_LOG_GROUP_ARNS = TMP_AWS_LOG_GROUP_ARNS;
  exports.SEMRESATTRS_AWS_LOG_STREAM_NAMES = TMP_AWS_LOG_STREAM_NAMES;
  exports.SEMRESATTRS_AWS_LOG_STREAM_ARNS = TMP_AWS_LOG_STREAM_ARNS;
  exports.SEMRESATTRS_CONTAINER_NAME = TMP_CONTAINER_NAME;
  exports.SEMRESATTRS_CONTAINER_ID = TMP_CONTAINER_ID;
  exports.SEMRESATTRS_CONTAINER_RUNTIME = TMP_CONTAINER_RUNTIME;
  exports.SEMRESATTRS_CONTAINER_IMAGE_NAME = TMP_CONTAINER_IMAGE_NAME;
  exports.SEMRESATTRS_CONTAINER_IMAGE_TAG = TMP_CONTAINER_IMAGE_TAG;
  exports.SEMRESATTRS_DEPLOYMENT_ENVIRONMENT = TMP_DEPLOYMENT_ENVIRONMENT;
  exports.SEMRESATTRS_DEVICE_ID = TMP_DEVICE_ID;
  exports.SEMRESATTRS_DEVICE_MODEL_IDENTIFIER = TMP_DEVICE_MODEL_IDENTIFIER;
  exports.SEMRESATTRS_DEVICE_MODEL_NAME = TMP_DEVICE_MODEL_NAME;
  exports.SEMRESATTRS_FAAS_NAME = TMP_FAAS_NAME;
  exports.SEMRESATTRS_FAAS_ID = TMP_FAAS_ID;
  exports.SEMRESATTRS_FAAS_VERSION = TMP_FAAS_VERSION;
  exports.SEMRESATTRS_FAAS_INSTANCE = TMP_FAAS_INSTANCE;
  exports.SEMRESATTRS_FAAS_MAX_MEMORY = TMP_FAAS_MAX_MEMORY;
  exports.SEMRESATTRS_HOST_ID = TMP_HOST_ID;
  exports.SEMRESATTRS_HOST_NAME = TMP_HOST_NAME;
  exports.SEMRESATTRS_HOST_TYPE = TMP_HOST_TYPE;
  exports.SEMRESATTRS_HOST_ARCH = TMP_HOST_ARCH;
  exports.SEMRESATTRS_HOST_IMAGE_NAME = TMP_HOST_IMAGE_NAME;
  exports.SEMRESATTRS_HOST_IMAGE_ID = TMP_HOST_IMAGE_ID;
  exports.SEMRESATTRS_HOST_IMAGE_VERSION = TMP_HOST_IMAGE_VERSION;
  exports.SEMRESATTRS_K8S_CLUSTER_NAME = TMP_K8S_CLUSTER_NAME;
  exports.SEMRESATTRS_K8S_NODE_NAME = TMP_K8S_NODE_NAME;
  exports.SEMRESATTRS_K8S_NODE_UID = TMP_K8S_NODE_UID;
  exports.SEMRESATTRS_K8S_NAMESPACE_NAME = TMP_K8S_NAMESPACE_NAME;
  exports.SEMRESATTRS_K8S_POD_UID = TMP_K8S_POD_UID;
  exports.SEMRESATTRS_K8S_POD_NAME = TMP_K8S_POD_NAME;
  exports.SEMRESATTRS_K8S_CONTAINER_NAME = TMP_K8S_CONTAINER_NAME;
  exports.SEMRESATTRS_K8S_REPLICASET_UID = TMP_K8S_REPLICASET_UID;
  exports.SEMRESATTRS_K8S_REPLICASET_NAME = TMP_K8S_REPLICASET_NAME;
  exports.SEMRESATTRS_K8S_DEPLOYMENT_UID = TMP_K8S_DEPLOYMENT_UID;
  exports.SEMRESATTRS_K8S_DEPLOYMENT_NAME = TMP_K8S_DEPLOYMENT_NAME;
  exports.SEMRESATTRS_K8S_STATEFULSET_UID = TMP_K8S_STATEFULSET_UID;
  exports.SEMRESATTRS_K8S_STATEFULSET_NAME = TMP_K8S_STATEFULSET_NAME;
  exports.SEMRESATTRS_K8S_DAEMONSET_UID = TMP_K8S_DAEMONSET_UID;
  exports.SEMRESATTRS_K8S_DAEMONSET_NAME = TMP_K8S_DAEMONSET_NAME;
  exports.SEMRESATTRS_K8S_JOB_UID = TMP_K8S_JOB_UID;
  exports.SEMRESATTRS_K8S_JOB_NAME = TMP_K8S_JOB_NAME;
  exports.SEMRESATTRS_K8S_CRONJOB_UID = TMP_K8S_CRONJOB_UID;
  exports.SEMRESATTRS_K8S_CRONJOB_NAME = TMP_K8S_CRONJOB_NAME;
  exports.SEMRESATTRS_OS_TYPE = TMP_OS_TYPE;
  exports.SEMRESATTRS_OS_DESCRIPTION = TMP_OS_DESCRIPTION;
  exports.SEMRESATTRS_OS_NAME = TMP_OS_NAME;
  exports.SEMRESATTRS_OS_VERSION = TMP_OS_VERSION;
  exports.SEMRESATTRS_PROCESS_PID = TMP_PROCESS_PID;
  exports.SEMRESATTRS_PROCESS_EXECUTABLE_NAME = TMP_PROCESS_EXECUTABLE_NAME;
  exports.SEMRESATTRS_PROCESS_EXECUTABLE_PATH = TMP_PROCESS_EXECUTABLE_PATH;
  exports.SEMRESATTRS_PROCESS_COMMAND = TMP_PROCESS_COMMAND;
  exports.SEMRESATTRS_PROCESS_COMMAND_LINE = TMP_PROCESS_COMMAND_LINE;
  exports.SEMRESATTRS_PROCESS_COMMAND_ARGS = TMP_PROCESS_COMMAND_ARGS;
  exports.SEMRESATTRS_PROCESS_OWNER = TMP_PROCESS_OWNER;
  exports.SEMRESATTRS_PROCESS_RUNTIME_NAME = TMP_PROCESS_RUNTIME_NAME;
  exports.SEMRESATTRS_PROCESS_RUNTIME_VERSION = TMP_PROCESS_RUNTIME_VERSION;
  exports.SEMRESATTRS_PROCESS_RUNTIME_DESCRIPTION = TMP_PROCESS_RUNTIME_DESCRIPTION;
  exports.SEMRESATTRS_SERVICE_NAME = TMP_SERVICE_NAME;
  exports.SEMRESATTRS_SERVICE_NAMESPACE = TMP_SERVICE_NAMESPACE;
  exports.SEMRESATTRS_SERVICE_INSTANCE_ID = TMP_SERVICE_INSTANCE_ID;
  exports.SEMRESATTRS_SERVICE_VERSION = TMP_SERVICE_VERSION;
  exports.SEMRESATTRS_TELEMETRY_SDK_NAME = TMP_TELEMETRY_SDK_NAME;
  exports.SEMRESATTRS_TELEMETRY_SDK_LANGUAGE = TMP_TELEMETRY_SDK_LANGUAGE;
  exports.SEMRESATTRS_TELEMETRY_SDK_VERSION = TMP_TELEMETRY_SDK_VERSION;
  exports.SEMRESATTRS_TELEMETRY_AUTO_VERSION = TMP_TELEMETRY_AUTO_VERSION;
  exports.SEMRESATTRS_WEBENGINE_NAME = TMP_WEBENGINE_NAME;
  exports.SEMRESATTRS_WEBENGINE_VERSION = TMP_WEBENGINE_VERSION;
  exports.SEMRESATTRS_WEBENGINE_DESCRIPTION = TMP_WEBENGINE_DESCRIPTION;
  exports.SemanticResourceAttributes = /* @__PURE__ */ (0, utils_1.createConstMap)([
    TMP_CLOUD_PROVIDER,
    TMP_CLOUD_ACCOUNT_ID,
    TMP_CLOUD_REGION,
    TMP_CLOUD_AVAILABILITY_ZONE,
    TMP_CLOUD_PLATFORM,
    TMP_AWS_ECS_CONTAINER_ARN,
    TMP_AWS_ECS_CLUSTER_ARN,
    TMP_AWS_ECS_LAUNCHTYPE,
    TMP_AWS_ECS_TASK_ARN,
    TMP_AWS_ECS_TASK_FAMILY,
    TMP_AWS_ECS_TASK_REVISION,
    TMP_AWS_EKS_CLUSTER_ARN,
    TMP_AWS_LOG_GROUP_NAMES,
    TMP_AWS_LOG_GROUP_ARNS,
    TMP_AWS_LOG_STREAM_NAMES,
    TMP_AWS_LOG_STREAM_ARNS,
    TMP_CONTAINER_NAME,
    TMP_CONTAINER_ID,
    TMP_CONTAINER_RUNTIME,
    TMP_CONTAINER_IMAGE_NAME,
    TMP_CONTAINER_IMAGE_TAG,
    TMP_DEPLOYMENT_ENVIRONMENT,
    TMP_DEVICE_ID,
    TMP_DEVICE_MODEL_IDENTIFIER,
    TMP_DEVICE_MODEL_NAME,
    TMP_FAAS_NAME,
    TMP_FAAS_ID,
    TMP_FAAS_VERSION,
    TMP_FAAS_INSTANCE,
    TMP_FAAS_MAX_MEMORY,
    TMP_HOST_ID,
    TMP_HOST_NAME,
    TMP_HOST_TYPE,
    TMP_HOST_ARCH,
    TMP_HOST_IMAGE_NAME,
    TMP_HOST_IMAGE_ID,
    TMP_HOST_IMAGE_VERSION,
    TMP_K8S_CLUSTER_NAME,
    TMP_K8S_NODE_NAME,
    TMP_K8S_NODE_UID,
    TMP_K8S_NAMESPACE_NAME,
    TMP_K8S_POD_UID,
    TMP_K8S_POD_NAME,
    TMP_K8S_CONTAINER_NAME,
    TMP_K8S_REPLICASET_UID,
    TMP_K8S_REPLICASET_NAME,
    TMP_K8S_DEPLOYMENT_UID,
    TMP_K8S_DEPLOYMENT_NAME,
    TMP_K8S_STATEFULSET_UID,
    TMP_K8S_STATEFULSET_NAME,
    TMP_K8S_DAEMONSET_UID,
    TMP_K8S_DAEMONSET_NAME,
    TMP_K8S_JOB_UID,
    TMP_K8S_JOB_NAME,
    TMP_K8S_CRONJOB_UID,
    TMP_K8S_CRONJOB_NAME,
    TMP_OS_TYPE,
    TMP_OS_DESCRIPTION,
    TMP_OS_NAME,
    TMP_OS_VERSION,
    TMP_PROCESS_PID,
    TMP_PROCESS_EXECUTABLE_NAME,
    TMP_PROCESS_EXECUTABLE_PATH,
    TMP_PROCESS_COMMAND,
    TMP_PROCESS_COMMAND_LINE,
    TMP_PROCESS_COMMAND_ARGS,
    TMP_PROCESS_OWNER,
    TMP_PROCESS_RUNTIME_NAME,
    TMP_PROCESS_RUNTIME_VERSION,
    TMP_PROCESS_RUNTIME_DESCRIPTION,
    TMP_SERVICE_NAME,
    TMP_SERVICE_NAMESPACE,
    TMP_SERVICE_INSTANCE_ID,
    TMP_SERVICE_VERSION,
    TMP_TELEMETRY_SDK_NAME,
    TMP_TELEMETRY_SDK_LANGUAGE,
    TMP_TELEMETRY_SDK_VERSION,
    TMP_TELEMETRY_AUTO_VERSION,
    TMP_WEBENGINE_NAME,
    TMP_WEBENGINE_VERSION,
    TMP_WEBENGINE_DESCRIPTION
  ]);
  var TMP_CLOUDPROVIDERVALUES_ALIBABA_CLOUD = "alibaba_cloud";
  var TMP_CLOUDPROVIDERVALUES_AWS = "aws";
  var TMP_CLOUDPROVIDERVALUES_AZURE = "azure";
  var TMP_CLOUDPROVIDERVALUES_GCP = "gcp";
  exports.CLOUDPROVIDERVALUES_ALIBABA_CLOUD = TMP_CLOUDPROVIDERVALUES_ALIBABA_CLOUD;
  exports.CLOUDPROVIDERVALUES_AWS = TMP_CLOUDPROVIDERVALUES_AWS;
  exports.CLOUDPROVIDERVALUES_AZURE = TMP_CLOUDPROVIDERVALUES_AZURE;
  exports.CLOUDPROVIDERVALUES_GCP = TMP_CLOUDPROVIDERVALUES_GCP;
  exports.CloudProviderValues = /* @__PURE__ */ (0, utils_1.createConstMap)([
    TMP_CLOUDPROVIDERVALUES_ALIBABA_CLOUD,
    TMP_CLOUDPROVIDERVALUES_AWS,
    TMP_CLOUDPROVIDERVALUES_AZURE,
    TMP_CLOUDPROVIDERVALUES_GCP
  ]);
  var TMP_CLOUDPLATFORMVALUES_ALIBABA_CLOUD_ECS = "alibaba_cloud_ecs";
  var TMP_CLOUDPLATFORMVALUES_ALIBABA_CLOUD_FC = "alibaba_cloud_fc";
  var TMP_CLOUDPLATFORMVALUES_AWS_EC2 = "aws_ec2";
  var TMP_CLOUDPLATFORMVALUES_AWS_ECS = "aws_ecs";
  var TMP_CLOUDPLATFORMVALUES_AWS_EKS = "aws_eks";
  var TMP_CLOUDPLATFORMVALUES_AWS_LAMBDA = "aws_lambda";
  var TMP_CLOUDPLATFORMVALUES_AWS_ELASTIC_BEANSTALK = "aws_elastic_beanstalk";
  var TMP_CLOUDPLATFORMVALUES_AZURE_VM = "azure_vm";
  var TMP_CLOUDPLATFORMVALUES_AZURE_CONTAINER_INSTANCES = "azure_container_instances";
  var TMP_CLOUDPLATFORMVALUES_AZURE_AKS = "azure_aks";
  var TMP_CLOUDPLATFORMVALUES_AZURE_FUNCTIONS = "azure_functions";
  var TMP_CLOUDPLATFORMVALUES_AZURE_APP_SERVICE = "azure_app_service";
  var TMP_CLOUDPLATFORMVALUES_GCP_COMPUTE_ENGINE = "gcp_compute_engine";
  var TMP_CLOUDPLATFORMVALUES_GCP_CLOUD_RUN = "gcp_cloud_run";
  var TMP_CLOUDPLATFORMVALUES_GCP_KUBERNETES_ENGINE = "gcp_kubernetes_engine";
  var TMP_CLOUDPLATFORMVALUES_GCP_CLOUD_FUNCTIONS = "gcp_cloud_functions";
  var TMP_CLOUDPLATFORMVALUES_GCP_APP_ENGINE = "gcp_app_engine";
  exports.CLOUDPLATFORMVALUES_ALIBABA_CLOUD_ECS = TMP_CLOUDPLATFORMVALUES_ALIBABA_CLOUD_ECS;
  exports.CLOUDPLATFORMVALUES_ALIBABA_CLOUD_FC = TMP_CLOUDPLATFORMVALUES_ALIBABA_CLOUD_FC;
  exports.CLOUDPLATFORMVALUES_AWS_EC2 = TMP_CLOUDPLATFORMVALUES_AWS_EC2;
  exports.CLOUDPLATFORMVALUES_AWS_ECS = TMP_CLOUDPLATFORMVALUES_AWS_ECS;
  exports.CLOUDPLATFORMVALUES_AWS_EKS = TMP_CLOUDPLATFORMVALUES_AWS_EKS;
  exports.CLOUDPLATFORMVALUES_AWS_LAMBDA = TMP_CLOUDPLATFORMVALUES_AWS_LAMBDA;
  exports.CLOUDPLATFORMVALUES_AWS_ELASTIC_BEANSTALK = TMP_CLOUDPLATFORMVALUES_AWS_ELASTIC_BEANSTALK;
  exports.CLOUDPLATFORMVALUES_AZURE_VM = TMP_CLOUDPLATFORMVALUES_AZURE_VM;
  exports.CLOUDPLATFORMVALUES_AZURE_CONTAINER_INSTANCES = TMP_CLOUDPLATFORMVALUES_AZURE_CONTAINER_INSTANCES;
  exports.CLOUDPLATFORMVALUES_AZURE_AKS = TMP_CLOUDPLATFORMVALUES_AZURE_AKS;
  exports.CLOUDPLATFORMVALUES_AZURE_FUNCTIONS = TMP_CLOUDPLATFORMVALUES_AZURE_FUNCTIONS;
  exports.CLOUDPLATFORMVALUES_AZURE_APP_SERVICE = TMP_CLOUDPLATFORMVALUES_AZURE_APP_SERVICE;
  exports.CLOUDPLATFORMVALUES_GCP_COMPUTE_ENGINE = TMP_CLOUDPLATFORMVALUES_GCP_COMPUTE_ENGINE;
  exports.CLOUDPLATFORMVALUES_GCP_CLOUD_RUN = TMP_CLOUDPLATFORMVALUES_GCP_CLOUD_RUN;
  exports.CLOUDPLATFORMVALUES_GCP_KUBERNETES_ENGINE = TMP_CLOUDPLATFORMVALUES_GCP_KUBERNETES_ENGINE;
  exports.CLOUDPLATFORMVALUES_GCP_CLOUD_FUNCTIONS = TMP_CLOUDPLATFORMVALUES_GCP_CLOUD_FUNCTIONS;
  exports.CLOUDPLATFORMVALUES_GCP_APP_ENGINE = TMP_CLOUDPLATFORMVALUES_GCP_APP_ENGINE;
  exports.CloudPlatformValues = /* @__PURE__ */ (0, utils_1.createConstMap)([
    TMP_CLOUDPLATFORMVALUES_ALIBABA_CLOUD_ECS,
    TMP_CLOUDPLATFORMVALUES_ALIBABA_CLOUD_FC,
    TMP_CLOUDPLATFORMVALUES_AWS_EC2,
    TMP_CLOUDPLATFORMVALUES_AWS_ECS,
    TMP_CLOUDPLATFORMVALUES_AWS_EKS,
    TMP_CLOUDPLATFORMVALUES_AWS_LAMBDA,
    TMP_CLOUDPLATFORMVALUES_AWS_ELASTIC_BEANSTALK,
    TMP_CLOUDPLATFORMVALUES_AZURE_VM,
    TMP_CLOUDPLATFORMVALUES_AZURE_CONTAINER_INSTANCES,
    TMP_CLOUDPLATFORMVALUES_AZURE_AKS,
    TMP_CLOUDPLATFORMVALUES_AZURE_FUNCTIONS,
    TMP_CLOUDPLATFORMVALUES_AZURE_APP_SERVICE,
    TMP_CLOUDPLATFORMVALUES_GCP_COMPUTE_ENGINE,
    TMP_CLOUDPLATFORMVALUES_GCP_CLOUD_RUN,
    TMP_CLOUDPLATFORMVALUES_GCP_KUBERNETES_ENGINE,
    TMP_CLOUDPLATFORMVALUES_GCP_CLOUD_FUNCTIONS,
    TMP_CLOUDPLATFORMVALUES_GCP_APP_ENGINE
  ]);
  var TMP_AWSECSLAUNCHTYPEVALUES_EC2 = "ec2";
  var TMP_AWSECSLAUNCHTYPEVALUES_FARGATE = "fargate";
  exports.AWSECSLAUNCHTYPEVALUES_EC2 = TMP_AWSECSLAUNCHTYPEVALUES_EC2;
  exports.AWSECSLAUNCHTYPEVALUES_FARGATE = TMP_AWSECSLAUNCHTYPEVALUES_FARGATE;
  exports.AwsEcsLaunchtypeValues = /* @__PURE__ */ (0, utils_1.createConstMap)([
    TMP_AWSECSLAUNCHTYPEVALUES_EC2,
    TMP_AWSECSLAUNCHTYPEVALUES_FARGATE
  ]);
  var TMP_HOSTARCHVALUES_AMD64 = "amd64";
  var TMP_HOSTARCHVALUES_ARM32 = "arm32";
  var TMP_HOSTARCHVALUES_ARM64 = "arm64";
  var TMP_HOSTARCHVALUES_IA64 = "ia64";
  var TMP_HOSTARCHVALUES_PPC32 = "ppc32";
  var TMP_HOSTARCHVALUES_PPC64 = "ppc64";
  var TMP_HOSTARCHVALUES_X86 = "x86";
  exports.HOSTARCHVALUES_AMD64 = TMP_HOSTARCHVALUES_AMD64;
  exports.HOSTARCHVALUES_ARM32 = TMP_HOSTARCHVALUES_ARM32;
  exports.HOSTARCHVALUES_ARM64 = TMP_HOSTARCHVALUES_ARM64;
  exports.HOSTARCHVALUES_IA64 = TMP_HOSTARCHVALUES_IA64;
  exports.HOSTARCHVALUES_PPC32 = TMP_HOSTARCHVALUES_PPC32;
  exports.HOSTARCHVALUES_PPC64 = TMP_HOSTARCHVALUES_PPC64;
  exports.HOSTARCHVALUES_X86 = TMP_HOSTARCHVALUES_X86;
  exports.HostArchValues = /* @__PURE__ */ (0, utils_1.createConstMap)([
    TMP_HOSTARCHVALUES_AMD64,
    TMP_HOSTARCHVALUES_ARM32,
    TMP_HOSTARCHVALUES_ARM64,
    TMP_HOSTARCHVALUES_IA64,
    TMP_HOSTARCHVALUES_PPC32,
    TMP_HOSTARCHVALUES_PPC64,
    TMP_HOSTARCHVALUES_X86
  ]);
  var TMP_OSTYPEVALUES_WINDOWS = "windows";
  var TMP_OSTYPEVALUES_LINUX = "linux";
  var TMP_OSTYPEVALUES_DARWIN = "darwin";
  var TMP_OSTYPEVALUES_FREEBSD = "freebsd";
  var TMP_OSTYPEVALUES_NETBSD = "netbsd";
  var TMP_OSTYPEVALUES_OPENBSD = "openbsd";
  var TMP_OSTYPEVALUES_DRAGONFLYBSD = "dragonflybsd";
  var TMP_OSTYPEVALUES_HPUX = "hpux";
  var TMP_OSTYPEVALUES_AIX = "aix";
  var TMP_OSTYPEVALUES_SOLARIS = "solaris";
  var TMP_OSTYPEVALUES_Z_OS = "z_os";
  exports.OSTYPEVALUES_WINDOWS = TMP_OSTYPEVALUES_WINDOWS;
  exports.OSTYPEVALUES_LINUX = TMP_OSTYPEVALUES_LINUX;
  exports.OSTYPEVALUES_DARWIN = TMP_OSTYPEVALUES_DARWIN;
  exports.OSTYPEVALUES_FREEBSD = TMP_OSTYPEVALUES_FREEBSD;
  exports.OSTYPEVALUES_NETBSD = TMP_OSTYPEVALUES_NETBSD;
  exports.OSTYPEVALUES_OPENBSD = TMP_OSTYPEVALUES_OPENBSD;
  exports.OSTYPEVALUES_DRAGONFLYBSD = TMP_OSTYPEVALUES_DRAGONFLYBSD;
  exports.OSTYPEVALUES_HPUX = TMP_OSTYPEVALUES_HPUX;
  exports.OSTYPEVALUES_AIX = TMP_OSTYPEVALUES_AIX;
  exports.OSTYPEVALUES_SOLARIS = TMP_OSTYPEVALUES_SOLARIS;
  exports.OSTYPEVALUES_Z_OS = TMP_OSTYPEVALUES_Z_OS;
  exports.OsTypeValues = /* @__PURE__ */ (0, utils_1.createConstMap)([
    TMP_OSTYPEVALUES_WINDOWS,
    TMP_OSTYPEVALUES_LINUX,
    TMP_OSTYPEVALUES_DARWIN,
    TMP_OSTYPEVALUES_FREEBSD,
    TMP_OSTYPEVALUES_NETBSD,
    TMP_OSTYPEVALUES_OPENBSD,
    TMP_OSTYPEVALUES_DRAGONFLYBSD,
    TMP_OSTYPEVALUES_HPUX,
    TMP_OSTYPEVALUES_AIX,
    TMP_OSTYPEVALUES_SOLARIS,
    TMP_OSTYPEVALUES_Z_OS
  ]);
  var TMP_TELEMETRYSDKLANGUAGEVALUES_CPP = "cpp";
  var TMP_TELEMETRYSDKLANGUAGEVALUES_DOTNET = "dotnet";
  var TMP_TELEMETRYSDKLANGUAGEVALUES_ERLANG = "erlang";
  var TMP_TELEMETRYSDKLANGUAGEVALUES_GO = "go";
  var TMP_TELEMETRYSDKLANGUAGEVALUES_JAVA = "java";
  var TMP_TELEMETRYSDKLANGUAGEVALUES_NODEJS = "nodejs";
  var TMP_TELEMETRYSDKLANGUAGEVALUES_PHP = "php";
  var TMP_TELEMETRYSDKLANGUAGEVALUES_PYTHON = "python";
  var TMP_TELEMETRYSDKLANGUAGEVALUES_RUBY = "ruby";
  var TMP_TELEMETRYSDKLANGUAGEVALUES_WEBJS = "webjs";
  exports.TELEMETRYSDKLANGUAGEVALUES_CPP = TMP_TELEMETRYSDKLANGUAGEVALUES_CPP;
  exports.TELEMETRYSDKLANGUAGEVALUES_DOTNET = TMP_TELEMETRYSDKLANGUAGEVALUES_DOTNET;
  exports.TELEMETRYSDKLANGUAGEVALUES_ERLANG = TMP_TELEMETRYSDKLANGUAGEVALUES_ERLANG;
  exports.TELEMETRYSDKLANGUAGEVALUES_GO = TMP_TELEMETRYSDKLANGUAGEVALUES_GO;
  exports.TELEMETRYSDKLANGUAGEVALUES_JAVA = TMP_TELEMETRYSDKLANGUAGEVALUES_JAVA;
  exports.TELEMETRYSDKLANGUAGEVALUES_NODEJS = TMP_TELEMETRYSDKLANGUAGEVALUES_NODEJS;
  exports.TELEMETRYSDKLANGUAGEVALUES_PHP = TMP_TELEMETRYSDKLANGUAGEVALUES_PHP;
  exports.TELEMETRYSDKLANGUAGEVALUES_PYTHON = TMP_TELEMETRYSDKLANGUAGEVALUES_PYTHON;
  exports.TELEMETRYSDKLANGUAGEVALUES_RUBY = TMP_TELEMETRYSDKLANGUAGEVALUES_RUBY;
  exports.TELEMETRYSDKLANGUAGEVALUES_WEBJS = TMP_TELEMETRYSDKLANGUAGEVALUES_WEBJS;
  exports.TelemetrySdkLanguageValues = /* @__PURE__ */ (0, utils_1.createConstMap)([
    TMP_TELEMETRYSDKLANGUAGEVALUES_CPP,
    TMP_TELEMETRYSDKLANGUAGEVALUES_DOTNET,
    TMP_TELEMETRYSDKLANGUAGEVALUES_ERLANG,
    TMP_TELEMETRYSDKLANGUAGEVALUES_GO,
    TMP_TELEMETRYSDKLANGUAGEVALUES_JAVA,
    TMP_TELEMETRYSDKLANGUAGEVALUES_NODEJS,
    TMP_TELEMETRYSDKLANGUAGEVALUES_PHP,
    TMP_TELEMETRYSDKLANGUAGEVALUES_PYTHON,
    TMP_TELEMETRYSDKLANGUAGEVALUES_RUBY,
    TMP_TELEMETRYSDKLANGUAGEVALUES_WEBJS
  ]);
});

// node_modules/@opentelemetry/resources/node_modules/@opentelemetry/semantic-conventions/build/src/resource/index.js
var require_resource3 = __commonJS((exports) => {
  var __createBinding = exports && exports.__createBinding || (Object.create ? function(o, m, k, k2) {
    if (k2 === undefined)
      k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() {
      return m[k];
    } });
  } : function(o, m, k, k2) {
    if (k2 === undefined)
      k2 = k;
    o[k2] = m[k];
  });
  var __exportStar = exports && exports.__exportStar || function(m, exports2) {
    for (var p in m)
      if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p))
        __createBinding(exports2, m, p);
  };
  Object.defineProperty(exports, "__esModule", { value: true });
  __exportStar(require_SemanticResourceAttributes3(), exports);
});

// node_modules/@opentelemetry/resources/node_modules/@opentelemetry/semantic-conventions/build/src/stable_attributes.js
var require_stable_attributes3 = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.HTTP_REQUEST_METHOD_VALUE_POST = exports.HTTP_REQUEST_METHOD_VALUE_PATCH = exports.HTTP_REQUEST_METHOD_VALUE_OPTIONS = exports.HTTP_REQUEST_METHOD_VALUE_HEAD = exports.HTTP_REQUEST_METHOD_VALUE_GET = exports.HTTP_REQUEST_METHOD_VALUE_DELETE = exports.HTTP_REQUEST_METHOD_VALUE_CONNECT = exports.HTTP_REQUEST_METHOD_VALUE_OTHER = exports.ATTR_HTTP_REQUEST_METHOD = exports.ATTR_HTTP_REQUEST_HEADER = exports.ATTR_EXCEPTION_TYPE = exports.ATTR_EXCEPTION_STACKTRACE = exports.ATTR_EXCEPTION_MESSAGE = exports.ATTR_EXCEPTION_ESCAPED = exports.ERROR_TYPE_VALUE_OTHER = exports.ATTR_ERROR_TYPE = exports.ATTR_CLIENT_PORT = exports.ATTR_CLIENT_ADDRESS = exports.ASPNETCORE_ROUTING_MATCH_STATUS_VALUE_SUCCESS = exports.ASPNETCORE_ROUTING_MATCH_STATUS_VALUE_FAILURE = exports.ATTR_ASPNETCORE_ROUTING_MATCH_STATUS = exports.ATTR_ASPNETCORE_ROUTING_IS_FALLBACK = exports.ATTR_ASPNETCORE_REQUEST_IS_UNHANDLED = exports.ATTR_ASPNETCORE_RATE_LIMITING_POLICY = exports.ASPNETCORE_DIAGNOSTICS_EXCEPTION_RESULT_VALUE_UNHANDLED = exports.ASPNETCORE_DIAGNOSTICS_EXCEPTION_RESULT_VALUE_SKIPPED = exports.ASPNETCORE_DIAGNOSTICS_EXCEPTION_RESULT_VALUE_HANDLED = exports.ASPNETCORE_DIAGNOSTICS_EXCEPTION_RESULT_VALUE_ABORTED = exports.ATTR_ASPNETCORE_DIAGNOSTICS_EXCEPTION_RESULT = exports.ATTR_ASPNETCORE_DIAGNOSTICS_HANDLER_TYPE = exports.ATTR_TELEMETRY_SDK_VERSION = exports.ATTR_TELEMETRY_SDK_NAME = exports.TELEMETRY_SDK_LANGUAGE_VALUE_WEBJS = exports.TELEMETRY_SDK_LANGUAGE_VALUE_SWIFT = exports.TELEMETRY_SDK_LANGUAGE_VALUE_RUST = exports.TELEMETRY_SDK_LANGUAGE_VALUE_RUBY = exports.TELEMETRY_SDK_LANGUAGE_VALUE_PYTHON = exports.TELEMETRY_SDK_LANGUAGE_VALUE_PHP = exports.TELEMETRY_SDK_LANGUAGE_VALUE_NODEJS = exports.TELEMETRY_SDK_LANGUAGE_VALUE_JAVA = exports.TELEMETRY_SDK_LANGUAGE_VALUE_GO = exports.TELEMETRY_SDK_LANGUAGE_VALUE_ERLANG = exports.TELEMETRY_SDK_LANGUAGE_VALUE_DOTNET = exports.TELEMETRY_SDK_LANGUAGE_VALUE_CPP = exports.ATTR_TELEMETRY_SDK_LANGUAGE = exports.ASPNETCORE_RATE_LIMITING_RESULT_VALUE_REQUEST_CANCELED = exports.ASPNETCORE_RATE_LIMITING_RESULT_VALUE_GLOBAL_LIMITER = exports.ASPNETCORE_RATE_LIMITING_RESULT_VALUE_ENDPOINT_LIMITER = exports.ASPNETCORE_RATE_LIMITING_RESULT_VALUE_ACQUIRED = exports.ATTR_ASPNETCORE_RATE_LIMITING_RESULT = undefined;
  exports.SIGNALR_CONNECTION_STATUS_VALUE_TIMEOUT = exports.SIGNALR_CONNECTION_STATUS_VALUE_NORMAL_CLOSURE = exports.SIGNALR_CONNECTION_STATUS_VALUE_APP_SHUTDOWN = exports.ATTR_SIGNALR_CONNECTION_STATUS = exports.ATTR_SERVICE_VERSION = exports.ATTR_SERVICE_NAME = exports.ATTR_SERVER_PORT = exports.ATTR_SERVER_ADDRESS = exports.ATTR_OTEL_STATUS_DESCRIPTION = exports.OTEL_STATUS_CODE_VALUE_OK = exports.OTEL_STATUS_CODE_VALUE_ERROR = exports.ATTR_OTEL_STATUS_CODE = exports.ATTR_OTEL_SCOPE_VERSION = exports.ATTR_OTEL_SCOPE_NAME = exports.NETWORK_TYPE_VALUE_IPV6 = exports.NETWORK_TYPE_VALUE_IPV4 = exports.ATTR_NETWORK_TYPE = exports.NETWORK_TRANSPORT_VALUE_UNIX = exports.NETWORK_TRANSPORT_VALUE_UDP = exports.NETWORK_TRANSPORT_VALUE_TCP = exports.NETWORK_TRANSPORT_VALUE_QUIC = exports.NETWORK_TRANSPORT_VALUE_PIPE = exports.ATTR_NETWORK_TRANSPORT = exports.ATTR_NETWORK_PROTOCOL_VERSION = exports.ATTR_NETWORK_PROTOCOL_NAME = exports.ATTR_NETWORK_PEER_PORT = exports.ATTR_NETWORK_PEER_ADDRESS = exports.ATTR_NETWORK_LOCAL_PORT = exports.ATTR_NETWORK_LOCAL_ADDRESS = exports.JVM_THREAD_STATE_VALUE_WAITING = exports.JVM_THREAD_STATE_VALUE_TIMED_WAITING = exports.JVM_THREAD_STATE_VALUE_TERMINATED = exports.JVM_THREAD_STATE_VALUE_RUNNABLE = exports.JVM_THREAD_STATE_VALUE_NEW = exports.JVM_THREAD_STATE_VALUE_BLOCKED = exports.ATTR_JVM_THREAD_STATE = exports.ATTR_JVM_THREAD_DAEMON = exports.JVM_MEMORY_TYPE_VALUE_NON_HEAP = exports.JVM_MEMORY_TYPE_VALUE_HEAP = exports.ATTR_JVM_MEMORY_TYPE = exports.ATTR_JVM_MEMORY_POOL_NAME = exports.ATTR_JVM_GC_NAME = exports.ATTR_JVM_GC_ACTION = exports.ATTR_HTTP_ROUTE = exports.ATTR_HTTP_RESPONSE_STATUS_CODE = exports.ATTR_HTTP_RESPONSE_HEADER = exports.ATTR_HTTP_REQUEST_RESEND_COUNT = exports.ATTR_HTTP_REQUEST_METHOD_ORIGINAL = exports.HTTP_REQUEST_METHOD_VALUE_TRACE = exports.HTTP_REQUEST_METHOD_VALUE_PUT = undefined;
  exports.ATTR_USER_AGENT_ORIGINAL = exports.ATTR_URL_SCHEME = exports.ATTR_URL_QUERY = exports.ATTR_URL_PATH = exports.ATTR_URL_FULL = exports.ATTR_URL_FRAGMENT = exports.SIGNALR_TRANSPORT_VALUE_WEB_SOCKETS = exports.SIGNALR_TRANSPORT_VALUE_SERVER_SENT_EVENTS = exports.SIGNALR_TRANSPORT_VALUE_LONG_POLLING = exports.ATTR_SIGNALR_TRANSPORT = undefined;
  exports.ATTR_ASPNETCORE_RATE_LIMITING_RESULT = "aspnetcore.rate_limiting.result";
  exports.ASPNETCORE_RATE_LIMITING_RESULT_VALUE_ACQUIRED = "acquired";
  exports.ASPNETCORE_RATE_LIMITING_RESULT_VALUE_ENDPOINT_LIMITER = "endpoint_limiter";
  exports.ASPNETCORE_RATE_LIMITING_RESULT_VALUE_GLOBAL_LIMITER = "global_limiter";
  exports.ASPNETCORE_RATE_LIMITING_RESULT_VALUE_REQUEST_CANCELED = "request_canceled";
  exports.ATTR_TELEMETRY_SDK_LANGUAGE = "telemetry.sdk.language";
  exports.TELEMETRY_SDK_LANGUAGE_VALUE_CPP = "cpp";
  exports.TELEMETRY_SDK_LANGUAGE_VALUE_DOTNET = "dotnet";
  exports.TELEMETRY_SDK_LANGUAGE_VALUE_ERLANG = "erlang";
  exports.TELEMETRY_SDK_LANGUAGE_VALUE_GO = "go";
  exports.TELEMETRY_SDK_LANGUAGE_VALUE_JAVA = "java";
  exports.TELEMETRY_SDK_LANGUAGE_VALUE_NODEJS = "nodejs";
  exports.TELEMETRY_SDK_LANGUAGE_VALUE_PHP = "php";
  exports.TELEMETRY_SDK_LANGUAGE_VALUE_PYTHON = "python";
  exports.TELEMETRY_SDK_LANGUAGE_VALUE_RUBY = "ruby";
  exports.TELEMETRY_SDK_LANGUAGE_VALUE_RUST = "rust";
  exports.TELEMETRY_SDK_LANGUAGE_VALUE_SWIFT = "swift";
  exports.TELEMETRY_SDK_LANGUAGE_VALUE_WEBJS = "webjs";
  exports.ATTR_TELEMETRY_SDK_NAME = "telemetry.sdk.name";
  exports.ATTR_TELEMETRY_SDK_VERSION = "telemetry.sdk.version";
  exports.ATTR_ASPNETCORE_DIAGNOSTICS_HANDLER_TYPE = "aspnetcore.diagnostics.handler.type";
  exports.ATTR_ASPNETCORE_DIAGNOSTICS_EXCEPTION_RESULT = "aspnetcore.diagnostics.exception.result";
  exports.ASPNETCORE_DIAGNOSTICS_EXCEPTION_RESULT_VALUE_ABORTED = "aborted";
  exports.ASPNETCORE_DIAGNOSTICS_EXCEPTION_RESULT_VALUE_HANDLED = "handled";
  exports.ASPNETCORE_DIAGNOSTICS_EXCEPTION_RESULT_VALUE_SKIPPED = "skipped";
  exports.ASPNETCORE_DIAGNOSTICS_EXCEPTION_RESULT_VALUE_UNHANDLED = "unhandled";
  exports.ATTR_ASPNETCORE_RATE_LIMITING_POLICY = "aspnetcore.rate_limiting.policy";
  exports.ATTR_ASPNETCORE_REQUEST_IS_UNHANDLED = "aspnetcore.request.is_unhandled";
  exports.ATTR_ASPNETCORE_ROUTING_IS_FALLBACK = "aspnetcore.routing.is_fallback";
  exports.ATTR_ASPNETCORE_ROUTING_MATCH_STATUS = "aspnetcore.routing.match_status";
  exports.ASPNETCORE_ROUTING_MATCH_STATUS_VALUE_FAILURE = "failure";
  exports.ASPNETCORE_ROUTING_MATCH_STATUS_VALUE_SUCCESS = "success";
  exports.ATTR_CLIENT_ADDRESS = "client.address";
  exports.ATTR_CLIENT_PORT = "client.port";
  exports.ATTR_ERROR_TYPE = "error.type";
  exports.ERROR_TYPE_VALUE_OTHER = "_OTHER";
  exports.ATTR_EXCEPTION_ESCAPED = "exception.escaped";
  exports.ATTR_EXCEPTION_MESSAGE = "exception.message";
  exports.ATTR_EXCEPTION_STACKTRACE = "exception.stacktrace";
  exports.ATTR_EXCEPTION_TYPE = "exception.type";
  var ATTR_HTTP_REQUEST_HEADER = (key) => `http.request.header.${key}`;
  exports.ATTR_HTTP_REQUEST_HEADER = ATTR_HTTP_REQUEST_HEADER;
  exports.ATTR_HTTP_REQUEST_METHOD = "http.request.method";
  exports.HTTP_REQUEST_METHOD_VALUE_OTHER = "_OTHER";
  exports.HTTP_REQUEST_METHOD_VALUE_CONNECT = "CONNECT";
  exports.HTTP_REQUEST_METHOD_VALUE_DELETE = "DELETE";
  exports.HTTP_REQUEST_METHOD_VALUE_GET = "GET";
  exports.HTTP_REQUEST_METHOD_VALUE_HEAD = "HEAD";
  exports.HTTP_REQUEST_METHOD_VALUE_OPTIONS = "OPTIONS";
  exports.HTTP_REQUEST_METHOD_VALUE_PATCH = "PATCH";
  exports.HTTP_REQUEST_METHOD_VALUE_POST = "POST";
  exports.HTTP_REQUEST_METHOD_VALUE_PUT = "PUT";
  exports.HTTP_REQUEST_METHOD_VALUE_TRACE = "TRACE";
  exports.ATTR_HTTP_REQUEST_METHOD_ORIGINAL = "http.request.method_original";
  exports.ATTR_HTTP_REQUEST_RESEND_COUNT = "http.request.resend_count";
  var ATTR_HTTP_RESPONSE_HEADER = (key) => `http.response.header.${key}`;
  exports.ATTR_HTTP_RESPONSE_HEADER = ATTR_HTTP_RESPONSE_HEADER;
  exports.ATTR_HTTP_RESPONSE_STATUS_CODE = "http.response.status_code";
  exports.ATTR_HTTP_ROUTE = "http.route";
  exports.ATTR_JVM_GC_ACTION = "jvm.gc.action";
  exports.ATTR_JVM_GC_NAME = "jvm.gc.name";
  exports.ATTR_JVM_MEMORY_POOL_NAME = "jvm.memory.pool.name";
  exports.ATTR_JVM_MEMORY_TYPE = "jvm.memory.type";
  exports.JVM_MEMORY_TYPE_VALUE_HEAP = "heap";
  exports.JVM_MEMORY_TYPE_VALUE_NON_HEAP = "non_heap";
  exports.ATTR_JVM_THREAD_DAEMON = "jvm.thread.daemon";
  exports.ATTR_JVM_THREAD_STATE = "jvm.thread.state";
  exports.JVM_THREAD_STATE_VALUE_BLOCKED = "blocked";
  exports.JVM_THREAD_STATE_VALUE_NEW = "new";
  exports.JVM_THREAD_STATE_VALUE_RUNNABLE = "runnable";
  exports.JVM_THREAD_STATE_VALUE_TERMINATED = "terminated";
  exports.JVM_THREAD_STATE_VALUE_TIMED_WAITING = "timed_waiting";
  exports.JVM_THREAD_STATE_VALUE_WAITING = "waiting";
  exports.ATTR_NETWORK_LOCAL_ADDRESS = "network.local.address";
  exports.ATTR_NETWORK_LOCAL_PORT = "network.local.port";
  exports.ATTR_NETWORK_PEER_ADDRESS = "network.peer.address";
  exports.ATTR_NETWORK_PEER_PORT = "network.peer.port";
  exports.ATTR_NETWORK_PROTOCOL_NAME = "network.protocol.name";
  exports.ATTR_NETWORK_PROTOCOL_VERSION = "network.protocol.version";
  exports.ATTR_NETWORK_TRANSPORT = "network.transport";
  exports.NETWORK_TRANSPORT_VALUE_PIPE = "pipe";
  exports.NETWORK_TRANSPORT_VALUE_QUIC = "quic";
  exports.NETWORK_TRANSPORT_VALUE_TCP = "tcp";
  exports.NETWORK_TRANSPORT_VALUE_UDP = "udp";
  exports.NETWORK_TRANSPORT_VALUE_UNIX = "unix";
  exports.ATTR_NETWORK_TYPE = "network.type";
  exports.NETWORK_TYPE_VALUE_IPV4 = "ipv4";
  exports.NETWORK_TYPE_VALUE_IPV6 = "ipv6";
  exports.ATTR_OTEL_SCOPE_NAME = "otel.scope.name";
  exports.ATTR_OTEL_SCOPE_VERSION = "otel.scope.version";
  exports.ATTR_OTEL_STATUS_CODE = "otel.status_code";
  exports.OTEL_STATUS_CODE_VALUE_ERROR = "ERROR";
  exports.OTEL_STATUS_CODE_VALUE_OK = "OK";
  exports.ATTR_OTEL_STATUS_DESCRIPTION = "otel.status_description";
  exports.ATTR_SERVER_ADDRESS = "server.address";
  exports.ATTR_SERVER_PORT = "server.port";
  exports.ATTR_SERVICE_NAME = "service.name";
  exports.ATTR_SERVICE_VERSION = "service.version";
  exports.ATTR_SIGNALR_CONNECTION_STATUS = "signalr.connection.status";
  exports.SIGNALR_CONNECTION_STATUS_VALUE_APP_SHUTDOWN = "app_shutdown";
  exports.SIGNALR_CONNECTION_STATUS_VALUE_NORMAL_CLOSURE = "normal_closure";
  exports.SIGNALR_CONNECTION_STATUS_VALUE_TIMEOUT = "timeout";
  exports.ATTR_SIGNALR_TRANSPORT = "signalr.transport";
  exports.SIGNALR_TRANSPORT_VALUE_LONG_POLLING = "long_polling";
  exports.SIGNALR_TRANSPORT_VALUE_SERVER_SENT_EVENTS = "server_sent_events";
  exports.SIGNALR_TRANSPORT_VALUE_WEB_SOCKETS = "web_sockets";
  exports.ATTR_URL_FRAGMENT = "url.fragment";
  exports.ATTR_URL_FULL = "url.full";
  exports.ATTR_URL_PATH = "url.path";
  exports.ATTR_URL_QUERY = "url.query";
  exports.ATTR_URL_SCHEME = "url.scheme";
  exports.ATTR_USER_AGENT_ORIGINAL = "user_agent.original";
});

// node_modules/@opentelemetry/resources/node_modules/@opentelemetry/semantic-conventions/build/src/stable_metrics.js
var require_stable_metrics3 = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.METRIC_SIGNALR_SERVER_CONNECTION_DURATION = exports.METRIC_SIGNALR_SERVER_ACTIVE_CONNECTIONS = exports.METRIC_KESTREL_UPGRADED_CONNECTIONS = exports.METRIC_KESTREL_TLS_HANDSHAKE_DURATION = exports.METRIC_KESTREL_REJECTED_CONNECTIONS = exports.METRIC_KESTREL_QUEUED_REQUESTS = exports.METRIC_KESTREL_QUEUED_CONNECTIONS = exports.METRIC_KESTREL_CONNECTION_DURATION = exports.METRIC_KESTREL_ACTIVE_TLS_HANDSHAKES = exports.METRIC_KESTREL_ACTIVE_CONNECTIONS = exports.METRIC_JVM_THREAD_COUNT = exports.METRIC_JVM_MEMORY_USED_AFTER_LAST_GC = exports.METRIC_JVM_MEMORY_USED = exports.METRIC_JVM_MEMORY_LIMIT = exports.METRIC_JVM_MEMORY_COMMITTED = exports.METRIC_JVM_GC_DURATION = exports.METRIC_JVM_CPU_TIME = exports.METRIC_JVM_CPU_RECENT_UTILIZATION = exports.METRIC_JVM_CPU_COUNT = exports.METRIC_JVM_CLASS_UNLOADED = exports.METRIC_JVM_CLASS_LOADED = exports.METRIC_JVM_CLASS_COUNT = exports.METRIC_HTTP_SERVER_REQUEST_DURATION = exports.METRIC_HTTP_CLIENT_REQUEST_DURATION = exports.METRIC_ASPNETCORE_ROUTING_MATCH_ATTEMPTS = exports.METRIC_ASPNETCORE_RATE_LIMITING_REQUESTS = exports.METRIC_ASPNETCORE_RATE_LIMITING_REQUEST_LEASE_DURATION = exports.METRIC_ASPNETCORE_RATE_LIMITING_REQUEST_TIME_IN_QUEUE = exports.METRIC_ASPNETCORE_RATE_LIMITING_QUEUED_REQUESTS = exports.METRIC_ASPNETCORE_RATE_LIMITING_ACTIVE_REQUEST_LEASES = exports.METRIC_ASPNETCORE_DIAGNOSTICS_EXCEPTIONS = undefined;
  exports.METRIC_ASPNETCORE_DIAGNOSTICS_EXCEPTIONS = "aspnetcore.diagnostics.exceptions";
  exports.METRIC_ASPNETCORE_RATE_LIMITING_ACTIVE_REQUEST_LEASES = "aspnetcore.rate_limiting.active_request_leases";
  exports.METRIC_ASPNETCORE_RATE_LIMITING_QUEUED_REQUESTS = "aspnetcore.rate_limiting.queued_requests";
  exports.METRIC_ASPNETCORE_RATE_LIMITING_REQUEST_TIME_IN_QUEUE = "aspnetcore.rate_limiting.request.time_in_queue";
  exports.METRIC_ASPNETCORE_RATE_LIMITING_REQUEST_LEASE_DURATION = "aspnetcore.rate_limiting.request_lease.duration";
  exports.METRIC_ASPNETCORE_RATE_LIMITING_REQUESTS = "aspnetcore.rate_limiting.requests";
  exports.METRIC_ASPNETCORE_ROUTING_MATCH_ATTEMPTS = "aspnetcore.routing.match_attempts";
  exports.METRIC_HTTP_CLIENT_REQUEST_DURATION = "http.client.request.duration";
  exports.METRIC_HTTP_SERVER_REQUEST_DURATION = "http.server.request.duration";
  exports.METRIC_JVM_CLASS_COUNT = "jvm.class.count";
  exports.METRIC_JVM_CLASS_LOADED = "jvm.class.loaded";
  exports.METRIC_JVM_CLASS_UNLOADED = "jvm.class.unloaded";
  exports.METRIC_JVM_CPU_COUNT = "jvm.cpu.count";
  exports.METRIC_JVM_CPU_RECENT_UTILIZATION = "jvm.cpu.recent_utilization";
  exports.METRIC_JVM_CPU_TIME = "jvm.cpu.time";
  exports.METRIC_JVM_GC_DURATION = "jvm.gc.duration";
  exports.METRIC_JVM_MEMORY_COMMITTED = "jvm.memory.committed";
  exports.METRIC_JVM_MEMORY_LIMIT = "jvm.memory.limit";
  exports.METRIC_JVM_MEMORY_USED = "jvm.memory.used";
  exports.METRIC_JVM_MEMORY_USED_AFTER_LAST_GC = "jvm.memory.used_after_last_gc";
  exports.METRIC_JVM_THREAD_COUNT = "jvm.thread.count";
  exports.METRIC_KESTREL_ACTIVE_CONNECTIONS = "kestrel.active_connections";
  exports.METRIC_KESTREL_ACTIVE_TLS_HANDSHAKES = "kestrel.active_tls_handshakes";
  exports.METRIC_KESTREL_CONNECTION_DURATION = "kestrel.connection.duration";
  exports.METRIC_KESTREL_QUEUED_CONNECTIONS = "kestrel.queued_connections";
  exports.METRIC_KESTREL_QUEUED_REQUESTS = "kestrel.queued_requests";
  exports.METRIC_KESTREL_REJECTED_CONNECTIONS = "kestrel.rejected_connections";
  exports.METRIC_KESTREL_TLS_HANDSHAKE_DURATION = "kestrel.tls_handshake.duration";
  exports.METRIC_KESTREL_UPGRADED_CONNECTIONS = "kestrel.upgraded_connections";
  exports.METRIC_SIGNALR_SERVER_ACTIVE_CONNECTIONS = "signalr.server.active_connections";
  exports.METRIC_SIGNALR_SERVER_CONNECTION_DURATION = "signalr.server.connection.duration";
});

// node_modules/@opentelemetry/resources/node_modules/@opentelemetry/semantic-conventions/build/src/index.js
var require_src5 = __commonJS((exports) => {
  var __createBinding = exports && exports.__createBinding || (Object.create ? function(o, m, k, k2) {
    if (k2 === undefined)
      k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() {
      return m[k];
    } });
  } : function(o, m, k, k2) {
    if (k2 === undefined)
      k2 = k;
    o[k2] = m[k];
  });
  var __exportStar = exports && exports.__exportStar || function(m, exports2) {
    for (var p in m)
      if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p))
        __createBinding(exports2, m, p);
  };
  Object.defineProperty(exports, "__esModule", { value: true });
  __exportStar(require_trace4(), exports);
  __exportStar(require_resource3(), exports);
  __exportStar(require_stable_attributes3(), exports);
  __exportStar(require_stable_metrics3(), exports);
});

// node_modules/@opentelemetry/otlp-exporter-base/build/src/OTLPExporterBase.js
var require_OTLPExporterBase = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.OTLPExporterBase = undefined;

  class OTLPExporterBase {
    constructor(_delegate) {
      this._delegate = _delegate;
    }
    export(items, resultCallback) {
      this._delegate.export(items, resultCallback);
    }
    forceFlush() {
      return this._delegate.forceFlush();
    }
    shutdown() {
      return this._delegate.shutdown();
    }
  }
  exports.OTLPExporterBase = OTLPExporterBase;
});

// node_modules/@opentelemetry/otlp-exporter-base/build/src/types.js
var require_types2 = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.OTLPExporterError = undefined;

  class OTLPExporterError extends Error {
    constructor(message, code, data) {
      super(message);
      this.name = "OTLPExporterError";
      this.data = data;
      this.code = code;
    }
  }
  exports.OTLPExporterError = OTLPExporterError;
});

// node_modules/@opentelemetry/otlp-exporter-base/build/src/configuration/shared-configuration.js
var require_shared_configuration = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.getSharedConfigurationDefaults = exports.mergeOtlpSharedConfigurationWithDefaults = exports.wrapStaticHeadersInFunction = exports.validateTimeoutMillis = undefined;
  function validateTimeoutMillis(timeoutMillis) {
    if (!Number.isNaN(timeoutMillis) && Number.isFinite(timeoutMillis) && timeoutMillis > 0) {
      return timeoutMillis;
    }
    throw new Error(`Configuration: timeoutMillis is invalid, expected number greater than 0 (actual: '${timeoutMillis}')`);
  }
  exports.validateTimeoutMillis = validateTimeoutMillis;
  function wrapStaticHeadersInFunction(headers) {
    if (headers == null) {
      return;
    }
    return () => headers;
  }
  exports.wrapStaticHeadersInFunction = wrapStaticHeadersInFunction;
  function mergeOtlpSharedConfigurationWithDefaults(userProvidedConfiguration, fallbackConfiguration, defaultConfiguration) {
    var _a, _b, _c, _d, _e, _f;
    return {
      timeoutMillis: validateTimeoutMillis((_b = (_a = userProvidedConfiguration.timeoutMillis) !== null && _a !== undefined ? _a : fallbackConfiguration.timeoutMillis) !== null && _b !== undefined ? _b : defaultConfiguration.timeoutMillis),
      concurrencyLimit: (_d = (_c = userProvidedConfiguration.concurrencyLimit) !== null && _c !== undefined ? _c : fallbackConfiguration.concurrencyLimit) !== null && _d !== undefined ? _d : defaultConfiguration.concurrencyLimit,
      compression: (_f = (_e = userProvidedConfiguration.compression) !== null && _e !== undefined ? _e : fallbackConfiguration.compression) !== null && _f !== undefined ? _f : defaultConfiguration.compression
    };
  }
  exports.mergeOtlpSharedConfigurationWithDefaults = mergeOtlpSharedConfigurationWithDefaults;
  function getSharedConfigurationDefaults() {
    return {
      timeoutMillis: 1e4,
      concurrencyLimit: 30,
      compression: "none"
    };
  }
  exports.getSharedConfigurationDefaults = getSharedConfigurationDefaults;
});

// node_modules/@opentelemetry/otlp-exporter-base/build/src/configuration/legacy-node-configuration.js
var require_legacy_node_configuration = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.CompressionAlgorithm = undefined;
  var CompressionAlgorithm;
  (function(CompressionAlgorithm2) {
    CompressionAlgorithm2["NONE"] = "none";
    CompressionAlgorithm2["GZIP"] = "gzip";
  })(CompressionAlgorithm = exports.CompressionAlgorithm || (exports.CompressionAlgorithm = {}));
});

// node_modules/@opentelemetry/otlp-exporter-base/build/src/bounded-queue-export-promise-handler.js
var require_bounded_queue_export_promise_handler = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.createBoundedQueueExportPromiseHandler = undefined;

  class BoundedQueueExportPromiseHandler {
    constructor(concurrencyLimit) {
      this._sendingPromises = [];
      this._concurrencyLimit = concurrencyLimit;
    }
    pushPromise(promise) {
      if (this.hasReachedLimit()) {
        throw new Error("Concurrency Limit reached");
      }
      this._sendingPromises.push(promise);
      const popPromise = () => {
        const index = this._sendingPromises.indexOf(promise);
        this._sendingPromises.splice(index, 1);
      };
      promise.then(popPromise, popPromise);
    }
    hasReachedLimit() {
      return this._sendingPromises.length >= this._concurrencyLimit;
    }
    async awaitAll() {
      await Promise.all(this._sendingPromises);
    }
  }
  function createBoundedQueueExportPromiseHandler(options) {
    return new BoundedQueueExportPromiseHandler(options.concurrencyLimit);
  }
  exports.createBoundedQueueExportPromiseHandler = createBoundedQueueExportPromiseHandler;
});

// node_modules/@opentelemetry/otlp-exporter-base/build/src/logging-response-handler.js
var require_logging_response_handler = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.createLoggingPartialSuccessResponseHandler = undefined;
  var api_1 = require_src();
  function isPartialSuccessResponse(response) {
    return Object.prototype.hasOwnProperty.call(response, "partialSuccess");
  }
  function createLoggingPartialSuccessResponseHandler() {
    return {
      handleResponse(response) {
        if (response == null || !isPartialSuccessResponse(response) || response.partialSuccess == null || Object.keys(response.partialSuccess).length === 0) {
          return;
        }
        api_1.diag.warn("Received Partial Success response:", JSON.stringify(response.partialSuccess));
      }
    };
  }
  exports.createLoggingPartialSuccessResponseHandler = createLoggingPartialSuccessResponseHandler;
});

// node_modules/@opentelemetry/otlp-exporter-base/build/src/otlp-export-delegate.js
var require_otlp_export_delegate = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.createOtlpExportDelegate = undefined;
  var core_1 = require_src3();
  var types_1 = require_types2();
  var logging_response_handler_1 = require_logging_response_handler();
  var api_1 = require_src();

  class OTLPExportDelegate {
    constructor(_transport, _serializer, _responseHandler, _promiseQueue, _timeout) {
      this._transport = _transport;
      this._serializer = _serializer;
      this._responseHandler = _responseHandler;
      this._promiseQueue = _promiseQueue;
      this._timeout = _timeout;
      this._diagLogger = api_1.diag.createComponentLogger({
        namespace: "OTLPExportDelegate"
      });
    }
    export(internalRepresentation, resultCallback) {
      this._diagLogger.debug("items to be sent", internalRepresentation);
      if (this._promiseQueue.hasReachedLimit()) {
        resultCallback({
          code: core_1.ExportResultCode.FAILED,
          error: new Error("Concurrent export limit reached")
        });
        return;
      }
      const serializedRequest = this._serializer.serializeRequest(internalRepresentation);
      if (serializedRequest == null) {
        resultCallback({
          code: core_1.ExportResultCode.FAILED,
          error: new Error("Nothing to send")
        });
        return;
      }
      this._promiseQueue.pushPromise(this._transport.send(serializedRequest, this._timeout).then((response) => {
        if (response.status === "success") {
          if (response.data != null) {
            try {
              this._responseHandler.handleResponse(this._serializer.deserializeResponse(response.data));
            } catch (e) {
              this._diagLogger.warn("Export succeeded but could not deserialize response - is the response specification compliant?", e, response.data);
            }
          }
          resultCallback({
            code: core_1.ExportResultCode.SUCCESS
          });
          return;
        } else if (response.status === "failure" && response.error) {
          resultCallback({
            code: core_1.ExportResultCode.FAILED,
            error: response.error
          });
          return;
        } else if (response.status === "retryable") {
          resultCallback({
            code: core_1.ExportResultCode.FAILED,
            error: new types_1.OTLPExporterError("Export failed with retryable status")
          });
        } else {
          resultCallback({
            code: core_1.ExportResultCode.FAILED,
            error: new types_1.OTLPExporterError("Export failed with unknown error")
          });
        }
      }, (reason) => resultCallback({
        code: core_1.ExportResultCode.FAILED,
        error: reason
      })));
    }
    forceFlush() {
      return this._promiseQueue.awaitAll();
    }
    async shutdown() {
      this._diagLogger.debug("shutdown started");
      await this.forceFlush();
      this._transport.shutdown();
    }
  }
  function createOtlpExportDelegate(components, settings) {
    return new OTLPExportDelegate(components.transport, components.serializer, (0, logging_response_handler_1.createLoggingPartialSuccessResponseHandler)(), components.promiseHandler, settings.timeout);
  }
  exports.createOtlpExportDelegate = createOtlpExportDelegate;
});

// node_modules/@opentelemetry/otlp-exporter-base/build/src/otlp-network-export-delegate.js
var require_otlp_network_export_delegate = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.createOtlpNetworkExportDelegate = undefined;
  var bounded_queue_export_promise_handler_1 = require_bounded_queue_export_promise_handler();
  var otlp_export_delegate_1 = require_otlp_export_delegate();
  function createOtlpNetworkExportDelegate(options, serializer, transport) {
    return (0, otlp_export_delegate_1.createOtlpExportDelegate)({
      transport,
      serializer,
      promiseHandler: (0, bounded_queue_export_promise_handler_1.createBoundedQueueExportPromiseHandler)(options)
    }, { timeout: options.timeoutMillis });
  }
  exports.createOtlpNetworkExportDelegate = createOtlpNetworkExportDelegate;
});

// node_modules/@opentelemetry/otlp-exporter-base/build/src/index.js
var require_src6 = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.createOtlpNetworkExportDelegate = exports.CompressionAlgorithm = exports.getSharedConfigurationDefaults = exports.mergeOtlpSharedConfigurationWithDefaults = exports.OTLPExporterError = exports.OTLPExporterBase = undefined;
  var OTLPExporterBase_1 = require_OTLPExporterBase();
  Object.defineProperty(exports, "OTLPExporterBase", { enumerable: true, get: function() {
    return OTLPExporterBase_1.OTLPExporterBase;
  } });
  var types_1 = require_types2();
  Object.defineProperty(exports, "OTLPExporterError", { enumerable: true, get: function() {
    return types_1.OTLPExporterError;
  } });
  var shared_configuration_1 = require_shared_configuration();
  Object.defineProperty(exports, "mergeOtlpSharedConfigurationWithDefaults", { enumerable: true, get: function() {
    return shared_configuration_1.mergeOtlpSharedConfigurationWithDefaults;
  } });
  Object.defineProperty(exports, "getSharedConfigurationDefaults", { enumerable: true, get: function() {
    return shared_configuration_1.getSharedConfigurationDefaults;
  } });
  var legacy_node_configuration_1 = require_legacy_node_configuration();
  Object.defineProperty(exports, "CompressionAlgorithm", { enumerable: true, get: function() {
    return legacy_node_configuration_1.CompressionAlgorithm;
  } });
  var otlp_network_export_delegate_1 = require_otlp_network_export_delegate();
  Object.defineProperty(exports, "createOtlpNetworkExportDelegate", { enumerable: true, get: function() {
    return otlp_network_export_delegate_1.createOtlpNetworkExportDelegate;
  } });
});

// node_modules/@opentelemetry/otlp-exporter-base/build/src/is-export-retryable.js
var require_is_export_retryable = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.parseRetryAfterToMills = exports.isExportRetryable = undefined;
  function isExportRetryable(statusCode) {
    const retryCodes = [429, 502, 503, 504];
    return retryCodes.includes(statusCode);
  }
  exports.isExportRetryable = isExportRetryable;
  function parseRetryAfterToMills(retryAfter) {
    if (retryAfter == null) {
      return;
    }
    const seconds = Number.parseInt(retryAfter, 10);
    if (Number.isInteger(seconds)) {
      return seconds > 0 ? seconds * 1000 : -1;
    }
    const delay = new Date(retryAfter).getTime() - Date.now();
    if (delay >= 0) {
      return delay;
    }
    return 0;
  }
  exports.parseRetryAfterToMills = parseRetryAfterToMills;
});

// node_modules/@opentelemetry/otlp-exporter-base/build/src/transport/http-transport-utils.js
var require_http_transport_utils = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.createHttpAgent = exports.compressAndSend = exports.sendWithHttp = undefined;
  var http = __require("http");
  var https = __require("https");
  var zlib = __require("zlib");
  var stream_1 = __require("stream");
  var is_export_retryable_1 = require_is_export_retryable();
  var types_1 = require_types2();
  function sendWithHttp(params, agent, data, onDone, timeoutMillis) {
    const parsedUrl = new URL(params.url);
    const nodeVersion = Number(process.versions.node.split(".")[0]);
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.pathname,
      method: "POST",
      headers: Object.assign({}, params.headers()),
      agent
    };
    const request = parsedUrl.protocol === "http:" ? http.request : https.request;
    const req = request(options, (res) => {
      const responseData = [];
      res.on("data", (chunk) => responseData.push(chunk));
      res.on("end", () => {
        if (res.statusCode && res.statusCode < 299) {
          onDone({
            status: "success",
            data: Buffer.concat(responseData)
          });
        } else if (res.statusCode && (0, is_export_retryable_1.isExportRetryable)(res.statusCode)) {
          onDone({
            status: "retryable",
            retryInMillis: (0, is_export_retryable_1.parseRetryAfterToMills)(res.headers["retry-after"])
          });
        } else {
          const error = new types_1.OTLPExporterError(res.statusMessage, res.statusCode, Buffer.concat(responseData).toString());
          onDone({
            status: "failure",
            error
          });
        }
      });
    });
    req.setTimeout(timeoutMillis, () => {
      req.destroy();
      onDone({
        status: "failure",
        error: new Error("Request Timeout")
      });
    });
    req.on("error", (error) => {
      onDone({
        status: "failure",
        error
      });
    });
    const reportTimeoutErrorEvent = nodeVersion >= 14 ? "close" : "abort";
    req.on(reportTimeoutErrorEvent, () => {
      onDone({
        status: "failure",
        error: new Error("Request timed out")
      });
    });
    compressAndSend(req, params.compression, data, (error) => {
      onDone({
        status: "failure",
        error
      });
    });
  }
  exports.sendWithHttp = sendWithHttp;
  function compressAndSend(req, compression, data, onError) {
    let dataStream = readableFromUint8Array(data);
    if (compression === "gzip") {
      req.setHeader("Content-Encoding", "gzip");
      dataStream = dataStream.on("error", onError).pipe(zlib.createGzip()).on("error", onError);
    }
    dataStream.pipe(req).on("error", onError);
  }
  exports.compressAndSend = compressAndSend;
  function readableFromUint8Array(buff) {
    const readable = new stream_1.Readable;
    readable.push(buff);
    readable.push(null);
    return readable;
  }
  function createHttpAgent(rawUrl, agentOptions) {
    const parsedUrl = new URL(rawUrl);
    const Agent = parsedUrl.protocol === "http:" ? http.Agent : https.Agent;
    return new Agent(agentOptions);
  }
  exports.createHttpAgent = createHttpAgent;
});

// node_modules/@opentelemetry/otlp-exporter-base/build/src/transport/http-exporter-transport.js
var require_http_exporter_transport = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.createHttpExporterTransport = undefined;

  class HttpExporterTransport {
    constructor(_parameters) {
      this._parameters = _parameters;
      this._send = null;
      this._agent = null;
    }
    async send(data, timeoutMillis) {
      if (this._send == null) {
        const {
          sendWithHttp,
          createHttpAgent
        } = require_http_transport_utils();
        this._agent = createHttpAgent(this._parameters.url, this._parameters.agentOptions);
        this._send = sendWithHttp;
      }
      return new Promise((resolve) => {
        var _a;
        (_a = this._send) === null || _a === undefined || _a.call(this, this._parameters, this._agent, data, (result) => {
          resolve(result);
        }, timeoutMillis);
      });
    }
    shutdown() {}
  }
  function createHttpExporterTransport(parameters) {
    return new HttpExporterTransport(parameters);
  }
  exports.createHttpExporterTransport = createHttpExporterTransport;
});

// node_modules/@opentelemetry/otlp-exporter-base/build/src/retrying-transport.js
var require_retrying_transport = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.createRetryingTransport = undefined;
  var MAX_ATTEMPTS = 5;
  var INITIAL_BACKOFF = 1000;
  var MAX_BACKOFF = 5000;
  var BACKOFF_MULTIPLIER = 1.5;
  var JITTER = 0.2;
  function getJitter() {
    return Math.random() * (2 * JITTER) - JITTER;
  }

  class RetryingTransport {
    constructor(_transport) {
      this._transport = _transport;
    }
    retry(data, timeoutMillis, inMillis) {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          this._transport.send(data, timeoutMillis).then(resolve, reject);
        }, inMillis);
      });
    }
    async send(data, timeoutMillis) {
      var _a;
      const deadline = Date.now() + timeoutMillis;
      let result = await this._transport.send(data, timeoutMillis);
      let attempts = MAX_ATTEMPTS;
      let nextBackoff = INITIAL_BACKOFF;
      while (result.status === "retryable" && attempts > 0) {
        attempts--;
        const backoff = Math.max(Math.min(nextBackoff, MAX_BACKOFF) + getJitter(), 0);
        nextBackoff = nextBackoff * BACKOFF_MULTIPLIER;
        const retryInMillis = (_a = result.retryInMillis) !== null && _a !== undefined ? _a : backoff;
        const remainingTimeoutMillis = deadline - Date.now();
        if (retryInMillis > remainingTimeoutMillis) {
          return result;
        }
        result = await this.retry(data, remainingTimeoutMillis, retryInMillis);
      }
      return result;
    }
    shutdown() {
      return this._transport.shutdown();
    }
  }
  function createRetryingTransport(options) {
    return new RetryingTransport(options.transport);
  }
  exports.createRetryingTransport = createRetryingTransport;
});

// node_modules/@opentelemetry/otlp-exporter-base/build/src/otlp-http-export-delegate.js
var require_otlp_http_export_delegate = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.createOtlpHttpExportDelegate = undefined;
  var otlp_export_delegate_1 = require_otlp_export_delegate();
  var http_exporter_transport_1 = require_http_exporter_transport();
  var bounded_queue_export_promise_handler_1 = require_bounded_queue_export_promise_handler();
  var retrying_transport_1 = require_retrying_transport();
  function createOtlpHttpExportDelegate(options, serializer) {
    return (0, otlp_export_delegate_1.createOtlpExportDelegate)({
      transport: (0, retrying_transport_1.createRetryingTransport)({
        transport: (0, http_exporter_transport_1.createHttpExporterTransport)(options)
      }),
      serializer,
      promiseHandler: (0, bounded_queue_export_promise_handler_1.createBoundedQueueExportPromiseHandler)(options)
    }, { timeout: options.timeoutMillis });
  }
  exports.createOtlpHttpExportDelegate = createOtlpHttpExportDelegate;
});

// node_modules/@opentelemetry/otlp-exporter-base/build/src/configuration/shared-env-configuration.js
var require_shared_env_configuration = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.getSharedConfigurationFromEnvironment = undefined;
  var api_1 = require_src();
  function parseAndValidateTimeoutFromEnv(timeoutEnvVar) {
    var _a;
    const envTimeout = (_a = process.env[timeoutEnvVar]) === null || _a === undefined ? undefined : _a.trim();
    if (envTimeout != null && envTimeout !== "") {
      const definedTimeout = Number(envTimeout);
      if (!Number.isNaN(definedTimeout) && Number.isFinite(definedTimeout) && definedTimeout > 0) {
        return definedTimeout;
      }
      api_1.diag.warn(`Configuration: ${timeoutEnvVar} is invalid, expected number greater than 0 (actual: ${envTimeout})`);
    }
    return;
  }
  function getTimeoutFromEnv(signalIdentifier) {
    const specificTimeout = parseAndValidateTimeoutFromEnv(`OTEL_EXPORTER_OTLP_${signalIdentifier}_TIMEOUT`);
    const nonSpecificTimeout = parseAndValidateTimeoutFromEnv("OTEL_EXPORTER_OTLP_TIMEOUT");
    return specificTimeout !== null && specificTimeout !== undefined ? specificTimeout : nonSpecificTimeout;
  }
  function parseAndValidateCompressionFromEnv(compressionEnvVar) {
    var _a;
    const compression = (_a = process.env[compressionEnvVar]) === null || _a === undefined ? undefined : _a.trim();
    if (compression === "") {
      return;
    }
    if (compression == null || compression === "none" || compression === "gzip") {
      return compression;
    }
    api_1.diag.warn(`Configuration: ${compressionEnvVar} is invalid, expected 'none' or 'gzip' (actual: '${compression}')`);
    return;
  }
  function getCompressionFromEnv(signalIdentifier) {
    const specificCompression = parseAndValidateCompressionFromEnv(`OTEL_EXPORTER_OTLP_${signalIdentifier}_COMPRESSION`);
    const nonSpecificCompression = parseAndValidateCompressionFromEnv("OTEL_EXPORTER_OTLP_COMPRESSION");
    return specificCompression !== null && specificCompression !== undefined ? specificCompression : nonSpecificCompression;
  }
  function getSharedConfigurationFromEnvironment(signalIdentifier) {
    return {
      timeoutMillis: getTimeoutFromEnv(signalIdentifier),
      compression: getCompressionFromEnv(signalIdentifier)
    };
  }
  exports.getSharedConfigurationFromEnvironment = getSharedConfigurationFromEnvironment;
});

// node_modules/@opentelemetry/otlp-exporter-base/build/src/util.js
var require_util = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.validateAndNormalizeHeaders = undefined;
  var api_1 = require_src();
  function validateAndNormalizeHeaders(partialHeaders) {
    return () => {
      var _a;
      const headers = {};
      Object.entries((_a = partialHeaders === null || partialHeaders === undefined ? undefined : partialHeaders()) !== null && _a !== undefined ? _a : {}).forEach(([key, value]) => {
        if (typeof value !== "undefined") {
          headers[key] = String(value);
        } else {
          api_1.diag.warn(`Header "${key}" has invalid value (${value}) and will be ignored`);
        }
      });
      return headers;
    };
  }
  exports.validateAndNormalizeHeaders = validateAndNormalizeHeaders;
});

// node_modules/@opentelemetry/otlp-exporter-base/build/src/configuration/otlp-http-configuration.js
var require_otlp_http_configuration = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.getHttpConfigurationDefaults = exports.mergeOtlpHttpConfigurationWithDefaults = undefined;
  var shared_configuration_1 = require_shared_configuration();
  var util_1 = require_util();
  function mergeHeaders(userProvidedHeaders, fallbackHeaders, defaultHeaders) {
    const requiredHeaders = Object.assign({}, defaultHeaders());
    const headers = {};
    return () => {
      if (fallbackHeaders != null) {
        Object.assign(headers, fallbackHeaders());
      }
      if (userProvidedHeaders != null) {
        Object.assign(headers, userProvidedHeaders());
      }
      return Object.assign(headers, requiredHeaders);
    };
  }
  function validateUserProvidedUrl(url) {
    if (url == null) {
      return;
    }
    try {
      new URL(url);
      return url;
    } catch (e) {
      throw new Error(`Configuration: Could not parse user-provided export URL: '${url}'`);
    }
  }
  function mergeOtlpHttpConfigurationWithDefaults(userProvidedConfiguration, fallbackConfiguration, defaultConfiguration) {
    var _a, _b, _c, _d;
    return Object.assign(Object.assign({}, (0, shared_configuration_1.mergeOtlpSharedConfigurationWithDefaults)(userProvidedConfiguration, fallbackConfiguration, defaultConfiguration)), { headers: mergeHeaders((0, util_1.validateAndNormalizeHeaders)(userProvidedConfiguration.headers), fallbackConfiguration.headers, defaultConfiguration.headers), url: (_b = (_a = validateUserProvidedUrl(userProvidedConfiguration.url)) !== null && _a !== undefined ? _a : fallbackConfiguration.url) !== null && _b !== undefined ? _b : defaultConfiguration.url, agentOptions: (_d = (_c = userProvidedConfiguration.agentOptions) !== null && _c !== undefined ? _c : fallbackConfiguration.agentOptions) !== null && _d !== undefined ? _d : defaultConfiguration.agentOptions });
  }
  exports.mergeOtlpHttpConfigurationWithDefaults = mergeOtlpHttpConfigurationWithDefaults;
  function getHttpConfigurationDefaults(requiredHeaders, signalResourcePath) {
    return Object.assign(Object.assign({}, (0, shared_configuration_1.getSharedConfigurationDefaults)()), { headers: () => requiredHeaders, url: "http://localhost:4318/" + signalResourcePath, agentOptions: { keepAlive: true } });
  }
  exports.getHttpConfigurationDefaults = getHttpConfigurationDefaults;
});

// node_modules/@opentelemetry/otlp-exporter-base/build/src/configuration/otlp-http-env-configuration.js
var require_otlp_http_env_configuration = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.getHttpConfigurationFromEnvironment = undefined;
  var core_1 = require_src3();
  var api_1 = require_src();
  var shared_env_configuration_1 = require_shared_env_configuration();
  var shared_configuration_1 = require_shared_configuration();
  function getStaticHeadersFromEnv(signalIdentifier) {
    var _a, _b;
    const signalSpecificRawHeaders = (_a = process.env[`OTEL_EXPORTER_OTLP_${signalIdentifier}_HEADERS`]) === null || _a === undefined ? undefined : _a.trim();
    const nonSignalSpecificRawHeaders = (_b = process.env["OTEL_EXPORTER_OTLP_HEADERS"]) === null || _b === undefined ? undefined : _b.trim();
    const signalSpecificHeaders = core_1.baggageUtils.parseKeyPairsIntoRecord(signalSpecificRawHeaders);
    const nonSignalSpecificHeaders = core_1.baggageUtils.parseKeyPairsIntoRecord(nonSignalSpecificRawHeaders);
    if (Object.keys(signalSpecificHeaders).length === 0 && Object.keys(nonSignalSpecificHeaders).length === 0) {
      return;
    }
    return Object.assign({}, core_1.baggageUtils.parseKeyPairsIntoRecord(nonSignalSpecificRawHeaders), core_1.baggageUtils.parseKeyPairsIntoRecord(signalSpecificRawHeaders));
  }
  function appendRootPathToUrlIfNeeded(url) {
    try {
      const parsedUrl = new URL(url);
      return parsedUrl.toString();
    } catch (_a) {
      api_1.diag.warn(`Configuration: Could not parse environment-provided export URL: '${url}', falling back to undefined`);
      return;
    }
  }
  function appendResourcePathToUrl(url, path) {
    try {
      new URL(url);
    } catch (_a) {
      api_1.diag.warn(`Configuration: Could not parse environment-provided export URL: '${url}', falling back to undefined`);
      return;
    }
    if (!url.endsWith("/")) {
      url = url + "/";
    }
    url += path;
    try {
      new URL(url);
    } catch (_b) {
      api_1.diag.warn(`Configuration: Provided URL appended with '${path}' is not a valid URL, using 'undefined' instead of '${url}'`);
      return;
    }
    return url;
  }
  function getNonSpecificUrlFromEnv(signalResourcePath) {
    var _a;
    const envUrl = (_a = process.env.OTEL_EXPORTER_OTLP_ENDPOINT) === null || _a === undefined ? undefined : _a.trim();
    if (envUrl == null || envUrl === "") {
      return;
    }
    return appendResourcePathToUrl(envUrl, signalResourcePath);
  }
  function getSpecificUrlFromEnv(signalIdentifier) {
    var _a;
    const envUrl = (_a = process.env[`OTEL_EXPORTER_OTLP_${signalIdentifier}_ENDPOINT`]) === null || _a === undefined ? undefined : _a.trim();
    if (envUrl == null || envUrl === "") {
      return;
    }
    return appendRootPathToUrlIfNeeded(envUrl);
  }
  function getHttpConfigurationFromEnvironment(signalIdentifier, signalResourcePath) {
    var _a;
    return Object.assign(Object.assign({}, (0, shared_env_configuration_1.getSharedConfigurationFromEnvironment)(signalIdentifier)), { url: (_a = getSpecificUrlFromEnv(signalIdentifier)) !== null && _a !== undefined ? _a : getNonSpecificUrlFromEnv(signalResourcePath), headers: (0, shared_configuration_1.wrapStaticHeadersInFunction)(getStaticHeadersFromEnv(signalIdentifier)) });
  }
  exports.getHttpConfigurationFromEnvironment = getHttpConfigurationFromEnvironment;
});

// node_modules/@opentelemetry/otlp-exporter-base/build/src/configuration/convert-legacy-node-http-options.js
var require_convert_legacy_node_http_options = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.convertLegacyHttpOptions = undefined;
  var otlp_http_configuration_1 = require_otlp_http_configuration();
  var otlp_http_env_configuration_1 = require_otlp_http_env_configuration();
  var api_1 = require_src();
  var shared_configuration_1 = require_shared_configuration();
  function convertLegacyAgentOptions(config) {
    if ((config === null || config === undefined ? undefined : config.keepAlive) != null) {
      if (config.httpAgentOptions != null) {
        if (config.httpAgentOptions.keepAlive == null) {
          config.httpAgentOptions.keepAlive = config.keepAlive;
        }
      } else {
        config.httpAgentOptions = {
          keepAlive: config.keepAlive
        };
      }
    }
    return config.httpAgentOptions;
  }
  function convertLegacyHttpOptions(config, signalIdentifier, signalResourcePath, requiredHeaders) {
    if (config.metadata) {
      api_1.diag.warn("Metadata cannot be set when using http");
    }
    return (0, otlp_http_configuration_1.mergeOtlpHttpConfigurationWithDefaults)({
      url: config.url,
      headers: (0, shared_configuration_1.wrapStaticHeadersInFunction)(config.headers),
      concurrencyLimit: config.concurrencyLimit,
      timeoutMillis: config.timeoutMillis,
      compression: config.compression,
      agentOptions: convertLegacyAgentOptions(config)
    }, (0, otlp_http_env_configuration_1.getHttpConfigurationFromEnvironment)(signalIdentifier, signalResourcePath), (0, otlp_http_configuration_1.getHttpConfigurationDefaults)(requiredHeaders, signalResourcePath));
  }
  exports.convertLegacyHttpOptions = convertLegacyHttpOptions;
});

// node_modules/@opentelemetry/otlp-exporter-base/build/src/index-node-http.js
var require_index_node_http = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.convertLegacyHttpOptions = exports.getSharedConfigurationFromEnvironment = exports.createOtlpHttpExportDelegate = undefined;
  var otlp_http_export_delegate_1 = require_otlp_http_export_delegate();
  Object.defineProperty(exports, "createOtlpHttpExportDelegate", { enumerable: true, get: function() {
    return otlp_http_export_delegate_1.createOtlpHttpExportDelegate;
  } });
  var shared_env_configuration_1 = require_shared_env_configuration();
  Object.defineProperty(exports, "getSharedConfigurationFromEnvironment", { enumerable: true, get: function() {
    return shared_env_configuration_1.getSharedConfigurationFromEnvironment;
  } });
  var convert_legacy_node_http_options_1 = require_convert_legacy_node_http_options();
  Object.defineProperty(exports, "convertLegacyHttpOptions", { enumerable: true, get: function() {
    return convert_legacy_node_http_options_1.convertLegacyHttpOptions;
  } });
});

// node_modules/@opentelemetry/semantic-conventions/build/src/internal/utils.js
var require_utils7 = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.createConstMap = undefined;
  function createConstMap(values) {
    let res = {};
    const len = values.length;
    for (let lp = 0;lp < len; lp++) {
      const val = values[lp];
      if (val) {
        res[String(val).toUpperCase().replace(/[-.]/g, "_")] = val;
      }
    }
    return res;
  }
  exports.createConstMap = createConstMap;
});

// node_modules/@opentelemetry/semantic-conventions/build/src/trace/SemanticAttributes.js
var require_SemanticAttributes4 = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.SEMATTRS_NET_HOST_CARRIER_ICC = exports.SEMATTRS_NET_HOST_CARRIER_MNC = exports.SEMATTRS_NET_HOST_CARRIER_MCC = exports.SEMATTRS_NET_HOST_CARRIER_NAME = exports.SEMATTRS_NET_HOST_CONNECTION_SUBTYPE = exports.SEMATTRS_NET_HOST_CONNECTION_TYPE = exports.SEMATTRS_NET_HOST_NAME = exports.SEMATTRS_NET_HOST_PORT = exports.SEMATTRS_NET_HOST_IP = exports.SEMATTRS_NET_PEER_NAME = exports.SEMATTRS_NET_PEER_PORT = exports.SEMATTRS_NET_PEER_IP = exports.SEMATTRS_NET_TRANSPORT = exports.SEMATTRS_FAAS_INVOKED_REGION = exports.SEMATTRS_FAAS_INVOKED_PROVIDER = exports.SEMATTRS_FAAS_INVOKED_NAME = exports.SEMATTRS_FAAS_COLDSTART = exports.SEMATTRS_FAAS_CRON = exports.SEMATTRS_FAAS_TIME = exports.SEMATTRS_FAAS_DOCUMENT_NAME = exports.SEMATTRS_FAAS_DOCUMENT_TIME = exports.SEMATTRS_FAAS_DOCUMENT_OPERATION = exports.SEMATTRS_FAAS_DOCUMENT_COLLECTION = exports.SEMATTRS_FAAS_EXECUTION = exports.SEMATTRS_FAAS_TRIGGER = exports.SEMATTRS_EXCEPTION_ESCAPED = exports.SEMATTRS_EXCEPTION_STACKTRACE = exports.SEMATTRS_EXCEPTION_MESSAGE = exports.SEMATTRS_EXCEPTION_TYPE = exports.SEMATTRS_DB_SQL_TABLE = exports.SEMATTRS_DB_MONGODB_COLLECTION = exports.SEMATTRS_DB_REDIS_DATABASE_INDEX = exports.SEMATTRS_DB_HBASE_NAMESPACE = exports.SEMATTRS_DB_CASSANDRA_COORDINATOR_DC = exports.SEMATTRS_DB_CASSANDRA_COORDINATOR_ID = exports.SEMATTRS_DB_CASSANDRA_SPECULATIVE_EXECUTION_COUNT = exports.SEMATTRS_DB_CASSANDRA_IDEMPOTENCE = exports.SEMATTRS_DB_CASSANDRA_TABLE = exports.SEMATTRS_DB_CASSANDRA_CONSISTENCY_LEVEL = exports.SEMATTRS_DB_CASSANDRA_PAGE_SIZE = exports.SEMATTRS_DB_CASSANDRA_KEYSPACE = exports.SEMATTRS_DB_MSSQL_INSTANCE_NAME = exports.SEMATTRS_DB_OPERATION = exports.SEMATTRS_DB_STATEMENT = exports.SEMATTRS_DB_NAME = exports.SEMATTRS_DB_JDBC_DRIVER_CLASSNAME = exports.SEMATTRS_DB_USER = exports.SEMATTRS_DB_CONNECTION_STRING = exports.SEMATTRS_DB_SYSTEM = exports.SEMATTRS_AWS_LAMBDA_INVOKED_ARN = undefined;
  exports.SEMATTRS_MESSAGING_DESTINATION_KIND = exports.SEMATTRS_MESSAGING_DESTINATION = exports.SEMATTRS_MESSAGING_SYSTEM = exports.SEMATTRS_AWS_DYNAMODB_GLOBAL_SECONDARY_INDEX_UPDATES = exports.SEMATTRS_AWS_DYNAMODB_ATTRIBUTE_DEFINITIONS = exports.SEMATTRS_AWS_DYNAMODB_SCANNED_COUNT = exports.SEMATTRS_AWS_DYNAMODB_COUNT = exports.SEMATTRS_AWS_DYNAMODB_TOTAL_SEGMENTS = exports.SEMATTRS_AWS_DYNAMODB_SEGMENT = exports.SEMATTRS_AWS_DYNAMODB_SCAN_FORWARD = exports.SEMATTRS_AWS_DYNAMODB_TABLE_COUNT = exports.SEMATTRS_AWS_DYNAMODB_EXCLUSIVE_START_TABLE = exports.SEMATTRS_AWS_DYNAMODB_LOCAL_SECONDARY_INDEXES = exports.SEMATTRS_AWS_DYNAMODB_GLOBAL_SECONDARY_INDEXES = exports.SEMATTRS_AWS_DYNAMODB_SELECT = exports.SEMATTRS_AWS_DYNAMODB_INDEX_NAME = exports.SEMATTRS_AWS_DYNAMODB_ATTRIBUTES_TO_GET = exports.SEMATTRS_AWS_DYNAMODB_LIMIT = exports.SEMATTRS_AWS_DYNAMODB_PROJECTION = exports.SEMATTRS_AWS_DYNAMODB_CONSISTENT_READ = exports.SEMATTRS_AWS_DYNAMODB_PROVISIONED_WRITE_CAPACITY = exports.SEMATTRS_AWS_DYNAMODB_PROVISIONED_READ_CAPACITY = exports.SEMATTRS_AWS_DYNAMODB_ITEM_COLLECTION_METRICS = exports.SEMATTRS_AWS_DYNAMODB_CONSUMED_CAPACITY = exports.SEMATTRS_AWS_DYNAMODB_TABLE_NAMES = exports.SEMATTRS_HTTP_CLIENT_IP = exports.SEMATTRS_HTTP_ROUTE = exports.SEMATTRS_HTTP_SERVER_NAME = exports.SEMATTRS_HTTP_RESPONSE_CONTENT_LENGTH_UNCOMPRESSED = exports.SEMATTRS_HTTP_RESPONSE_CONTENT_LENGTH = exports.SEMATTRS_HTTP_REQUEST_CONTENT_LENGTH_UNCOMPRESSED = exports.SEMATTRS_HTTP_REQUEST_CONTENT_LENGTH = exports.SEMATTRS_HTTP_USER_AGENT = exports.SEMATTRS_HTTP_FLAVOR = exports.SEMATTRS_HTTP_STATUS_CODE = exports.SEMATTRS_HTTP_SCHEME = exports.SEMATTRS_HTTP_HOST = exports.SEMATTRS_HTTP_TARGET = exports.SEMATTRS_HTTP_URL = exports.SEMATTRS_HTTP_METHOD = exports.SEMATTRS_CODE_LINENO = exports.SEMATTRS_CODE_FILEPATH = exports.SEMATTRS_CODE_NAMESPACE = exports.SEMATTRS_CODE_FUNCTION = exports.SEMATTRS_THREAD_NAME = exports.SEMATTRS_THREAD_ID = exports.SEMATTRS_ENDUSER_SCOPE = exports.SEMATTRS_ENDUSER_ROLE = exports.SEMATTRS_ENDUSER_ID = exports.SEMATTRS_PEER_SERVICE = undefined;
  exports.DBSYSTEMVALUES_FILEMAKER = exports.DBSYSTEMVALUES_DERBY = exports.DBSYSTEMVALUES_FIREBIRD = exports.DBSYSTEMVALUES_ADABAS = exports.DBSYSTEMVALUES_CACHE = exports.DBSYSTEMVALUES_EDB = exports.DBSYSTEMVALUES_FIRSTSQL = exports.DBSYSTEMVALUES_INGRES = exports.DBSYSTEMVALUES_HANADB = exports.DBSYSTEMVALUES_MAXDB = exports.DBSYSTEMVALUES_PROGRESS = exports.DBSYSTEMVALUES_HSQLDB = exports.DBSYSTEMVALUES_CLOUDSCAPE = exports.DBSYSTEMVALUES_HIVE = exports.DBSYSTEMVALUES_REDSHIFT = exports.DBSYSTEMVALUES_POSTGRESQL = exports.DBSYSTEMVALUES_DB2 = exports.DBSYSTEMVALUES_ORACLE = exports.DBSYSTEMVALUES_MYSQL = exports.DBSYSTEMVALUES_MSSQL = exports.DBSYSTEMVALUES_OTHER_SQL = exports.SemanticAttributes = exports.SEMATTRS_MESSAGE_UNCOMPRESSED_SIZE = exports.SEMATTRS_MESSAGE_COMPRESSED_SIZE = exports.SEMATTRS_MESSAGE_ID = exports.SEMATTRS_MESSAGE_TYPE = exports.SEMATTRS_RPC_JSONRPC_ERROR_MESSAGE = exports.SEMATTRS_RPC_JSONRPC_ERROR_CODE = exports.SEMATTRS_RPC_JSONRPC_REQUEST_ID = exports.SEMATTRS_RPC_JSONRPC_VERSION = exports.SEMATTRS_RPC_GRPC_STATUS_CODE = exports.SEMATTRS_RPC_METHOD = exports.SEMATTRS_RPC_SERVICE = exports.SEMATTRS_RPC_SYSTEM = exports.SEMATTRS_MESSAGING_KAFKA_TOMBSTONE = exports.SEMATTRS_MESSAGING_KAFKA_PARTITION = exports.SEMATTRS_MESSAGING_KAFKA_CLIENT_ID = exports.SEMATTRS_MESSAGING_KAFKA_CONSUMER_GROUP = exports.SEMATTRS_MESSAGING_KAFKA_MESSAGE_KEY = exports.SEMATTRS_MESSAGING_RABBITMQ_ROUTING_KEY = exports.SEMATTRS_MESSAGING_CONSUMER_ID = exports.SEMATTRS_MESSAGING_OPERATION = exports.SEMATTRS_MESSAGING_MESSAGE_PAYLOAD_COMPRESSED_SIZE_BYTES = exports.SEMATTRS_MESSAGING_MESSAGE_PAYLOAD_SIZE_BYTES = exports.SEMATTRS_MESSAGING_CONVERSATION_ID = exports.SEMATTRS_MESSAGING_MESSAGE_ID = exports.SEMATTRS_MESSAGING_URL = exports.SEMATTRS_MESSAGING_PROTOCOL_VERSION = exports.SEMATTRS_MESSAGING_PROTOCOL = exports.SEMATTRS_MESSAGING_TEMP_DESTINATION = undefined;
  exports.FAASINVOKEDPROVIDERVALUES_ALIBABA_CLOUD = exports.FaasDocumentOperationValues = exports.FAASDOCUMENTOPERATIONVALUES_DELETE = exports.FAASDOCUMENTOPERATIONVALUES_EDIT = exports.FAASDOCUMENTOPERATIONVALUES_INSERT = exports.FaasTriggerValues = exports.FAASTRIGGERVALUES_OTHER = exports.FAASTRIGGERVALUES_TIMER = exports.FAASTRIGGERVALUES_PUBSUB = exports.FAASTRIGGERVALUES_HTTP = exports.FAASTRIGGERVALUES_DATASOURCE = exports.DbCassandraConsistencyLevelValues = exports.DBCASSANDRACONSISTENCYLEVELVALUES_LOCAL_SERIAL = exports.DBCASSANDRACONSISTENCYLEVELVALUES_SERIAL = exports.DBCASSANDRACONSISTENCYLEVELVALUES_ANY = exports.DBCASSANDRACONSISTENCYLEVELVALUES_LOCAL_ONE = exports.DBCASSANDRACONSISTENCYLEVELVALUES_THREE = exports.DBCASSANDRACONSISTENCYLEVELVALUES_TWO = exports.DBCASSANDRACONSISTENCYLEVELVALUES_ONE = exports.DBCASSANDRACONSISTENCYLEVELVALUES_LOCAL_QUORUM = exports.DBCASSANDRACONSISTENCYLEVELVALUES_QUORUM = exports.DBCASSANDRACONSISTENCYLEVELVALUES_EACH_QUORUM = exports.DBCASSANDRACONSISTENCYLEVELVALUES_ALL = exports.DbSystemValues = exports.DBSYSTEMVALUES_COCKROACHDB = exports.DBSYSTEMVALUES_MEMCACHED = exports.DBSYSTEMVALUES_ELASTICSEARCH = exports.DBSYSTEMVALUES_GEODE = exports.DBSYSTEMVALUES_NEO4J = exports.DBSYSTEMVALUES_DYNAMODB = exports.DBSYSTEMVALUES_COSMOSDB = exports.DBSYSTEMVALUES_COUCHDB = exports.DBSYSTEMVALUES_COUCHBASE = exports.DBSYSTEMVALUES_REDIS = exports.DBSYSTEMVALUES_MONGODB = exports.DBSYSTEMVALUES_HBASE = exports.DBSYSTEMVALUES_CASSANDRA = exports.DBSYSTEMVALUES_COLDFUSION = exports.DBSYSTEMVALUES_H2 = exports.DBSYSTEMVALUES_VERTICA = exports.DBSYSTEMVALUES_TERADATA = exports.DBSYSTEMVALUES_SYBASE = exports.DBSYSTEMVALUES_SQLITE = exports.DBSYSTEMVALUES_POINTBASE = exports.DBSYSTEMVALUES_PERVASIVE = exports.DBSYSTEMVALUES_NETEZZA = exports.DBSYSTEMVALUES_MARIADB = exports.DBSYSTEMVALUES_INTERBASE = exports.DBSYSTEMVALUES_INSTANTDB = exports.DBSYSTEMVALUES_INFORMIX = undefined;
  exports.MESSAGINGOPERATIONVALUES_RECEIVE = exports.MessagingDestinationKindValues = exports.MESSAGINGDESTINATIONKINDVALUES_TOPIC = exports.MESSAGINGDESTINATIONKINDVALUES_QUEUE = exports.HttpFlavorValues = exports.HTTPFLAVORVALUES_QUIC = exports.HTTPFLAVORVALUES_SPDY = exports.HTTPFLAVORVALUES_HTTP_2_0 = exports.HTTPFLAVORVALUES_HTTP_1_1 = exports.HTTPFLAVORVALUES_HTTP_1_0 = exports.NetHostConnectionSubtypeValues = exports.NETHOSTCONNECTIONSUBTYPEVALUES_LTE_CA = exports.NETHOSTCONNECTIONSUBTYPEVALUES_NRNSA = exports.NETHOSTCONNECTIONSUBTYPEVALUES_NR = exports.NETHOSTCONNECTIONSUBTYPEVALUES_IWLAN = exports.NETHOSTCONNECTIONSUBTYPEVALUES_TD_SCDMA = exports.NETHOSTCONNECTIONSUBTYPEVALUES_GSM = exports.NETHOSTCONNECTIONSUBTYPEVALUES_HSPAP = exports.NETHOSTCONNECTIONSUBTYPEVALUES_EHRPD = exports.NETHOSTCONNECTIONSUBTYPEVALUES_LTE = exports.NETHOSTCONNECTIONSUBTYPEVALUES_EVDO_B = exports.NETHOSTCONNECTIONSUBTYPEVALUES_IDEN = exports.NETHOSTCONNECTIONSUBTYPEVALUES_HSPA = exports.NETHOSTCONNECTIONSUBTYPEVALUES_HSUPA = exports.NETHOSTCONNECTIONSUBTYPEVALUES_HSDPA = exports.NETHOSTCONNECTIONSUBTYPEVALUES_CDMA2000_1XRTT = exports.NETHOSTCONNECTIONSUBTYPEVALUES_EVDO_A = exports.NETHOSTCONNECTIONSUBTYPEVALUES_EVDO_0 = exports.NETHOSTCONNECTIONSUBTYPEVALUES_CDMA = exports.NETHOSTCONNECTIONSUBTYPEVALUES_UMTS = exports.NETHOSTCONNECTIONSUBTYPEVALUES_EDGE = exports.NETHOSTCONNECTIONSUBTYPEVALUES_GPRS = exports.NetHostConnectionTypeValues = exports.NETHOSTCONNECTIONTYPEVALUES_UNKNOWN = exports.NETHOSTCONNECTIONTYPEVALUES_UNAVAILABLE = exports.NETHOSTCONNECTIONTYPEVALUES_CELL = exports.NETHOSTCONNECTIONTYPEVALUES_WIRED = exports.NETHOSTCONNECTIONTYPEVALUES_WIFI = exports.NetTransportValues = exports.NETTRANSPORTVALUES_OTHER = exports.NETTRANSPORTVALUES_INPROC = exports.NETTRANSPORTVALUES_PIPE = exports.NETTRANSPORTVALUES_UNIX = exports.NETTRANSPORTVALUES_IP = exports.NETTRANSPORTVALUES_IP_UDP = exports.NETTRANSPORTVALUES_IP_TCP = exports.FaasInvokedProviderValues = exports.FAASINVOKEDPROVIDERVALUES_GCP = exports.FAASINVOKEDPROVIDERVALUES_AZURE = exports.FAASINVOKEDPROVIDERVALUES_AWS = undefined;
  exports.MessageTypeValues = exports.MESSAGETYPEVALUES_RECEIVED = exports.MESSAGETYPEVALUES_SENT = exports.RpcGrpcStatusCodeValues = exports.RPCGRPCSTATUSCODEVALUES_UNAUTHENTICATED = exports.RPCGRPCSTATUSCODEVALUES_DATA_LOSS = exports.RPCGRPCSTATUSCODEVALUES_UNAVAILABLE = exports.RPCGRPCSTATUSCODEVALUES_INTERNAL = exports.RPCGRPCSTATUSCODEVALUES_UNIMPLEMENTED = exports.RPCGRPCSTATUSCODEVALUES_OUT_OF_RANGE = exports.RPCGRPCSTATUSCODEVALUES_ABORTED = exports.RPCGRPCSTATUSCODEVALUES_FAILED_PRECONDITION = exports.RPCGRPCSTATUSCODEVALUES_RESOURCE_EXHAUSTED = exports.RPCGRPCSTATUSCODEVALUES_PERMISSION_DENIED = exports.RPCGRPCSTATUSCODEVALUES_ALREADY_EXISTS = exports.RPCGRPCSTATUSCODEVALUES_NOT_FOUND = exports.RPCGRPCSTATUSCODEVALUES_DEADLINE_EXCEEDED = exports.RPCGRPCSTATUSCODEVALUES_INVALID_ARGUMENT = exports.RPCGRPCSTATUSCODEVALUES_UNKNOWN = exports.RPCGRPCSTATUSCODEVALUES_CANCELLED = exports.RPCGRPCSTATUSCODEVALUES_OK = exports.MessagingOperationValues = exports.MESSAGINGOPERATIONVALUES_PROCESS = undefined;
  var utils_1 = require_utils7();
  var TMP_AWS_LAMBDA_INVOKED_ARN = "aws.lambda.invoked_arn";
  var TMP_DB_SYSTEM = "db.system";
  var TMP_DB_CONNECTION_STRING = "db.connection_string";
  var TMP_DB_USER = "db.user";
  var TMP_DB_JDBC_DRIVER_CLASSNAME = "db.jdbc.driver_classname";
  var TMP_DB_NAME = "db.name";
  var TMP_DB_STATEMENT = "db.statement";
  var TMP_DB_OPERATION = "db.operation";
  var TMP_DB_MSSQL_INSTANCE_NAME = "db.mssql.instance_name";
  var TMP_DB_CASSANDRA_KEYSPACE = "db.cassandra.keyspace";
  var TMP_DB_CASSANDRA_PAGE_SIZE = "db.cassandra.page_size";
  var TMP_DB_CASSANDRA_CONSISTENCY_LEVEL = "db.cassandra.consistency_level";
  var TMP_DB_CASSANDRA_TABLE = "db.cassandra.table";
  var TMP_DB_CASSANDRA_IDEMPOTENCE = "db.cassandra.idempotence";
  var TMP_DB_CASSANDRA_SPECULATIVE_EXECUTION_COUNT = "db.cassandra.speculative_execution_count";
  var TMP_DB_CASSANDRA_COORDINATOR_ID = "db.cassandra.coordinator.id";
  var TMP_DB_CASSANDRA_COORDINATOR_DC = "db.cassandra.coordinator.dc";
  var TMP_DB_HBASE_NAMESPACE = "db.hbase.namespace";
  var TMP_DB_REDIS_DATABASE_INDEX = "db.redis.database_index";
  var TMP_DB_MONGODB_COLLECTION = "db.mongodb.collection";
  var TMP_DB_SQL_TABLE = "db.sql.table";
  var TMP_EXCEPTION_TYPE = "exception.type";
  var TMP_EXCEPTION_MESSAGE = "exception.message";
  var TMP_EXCEPTION_STACKTRACE = "exception.stacktrace";
  var TMP_EXCEPTION_ESCAPED = "exception.escaped";
  var TMP_FAAS_TRIGGER = "faas.trigger";
  var TMP_FAAS_EXECUTION = "faas.execution";
  var TMP_FAAS_DOCUMENT_COLLECTION = "faas.document.collection";
  var TMP_FAAS_DOCUMENT_OPERATION = "faas.document.operation";
  var TMP_FAAS_DOCUMENT_TIME = "faas.document.time";
  var TMP_FAAS_DOCUMENT_NAME = "faas.document.name";
  var TMP_FAAS_TIME = "faas.time";
  var TMP_FAAS_CRON = "faas.cron";
  var TMP_FAAS_COLDSTART = "faas.coldstart";
  var TMP_FAAS_INVOKED_NAME = "faas.invoked_name";
  var TMP_FAAS_INVOKED_PROVIDER = "faas.invoked_provider";
  var TMP_FAAS_INVOKED_REGION = "faas.invoked_region";
  var TMP_NET_TRANSPORT = "net.transport";
  var TMP_NET_PEER_IP = "net.peer.ip";
  var TMP_NET_PEER_PORT = "net.peer.port";
  var TMP_NET_PEER_NAME = "net.peer.name";
  var TMP_NET_HOST_IP = "net.host.ip";
  var TMP_NET_HOST_PORT = "net.host.port";
  var TMP_NET_HOST_NAME = "net.host.name";
  var TMP_NET_HOST_CONNECTION_TYPE = "net.host.connection.type";
  var TMP_NET_HOST_CONNECTION_SUBTYPE = "net.host.connection.subtype";
  var TMP_NET_HOST_CARRIER_NAME = "net.host.carrier.name";
  var TMP_NET_HOST_CARRIER_MCC = "net.host.carrier.mcc";
  var TMP_NET_HOST_CARRIER_MNC = "net.host.carrier.mnc";
  var TMP_NET_HOST_CARRIER_ICC = "net.host.carrier.icc";
  var TMP_PEER_SERVICE = "peer.service";
  var TMP_ENDUSER_ID = "enduser.id";
  var TMP_ENDUSER_ROLE = "enduser.role";
  var TMP_ENDUSER_SCOPE = "enduser.scope";
  var TMP_THREAD_ID = "thread.id";
  var TMP_THREAD_NAME = "thread.name";
  var TMP_CODE_FUNCTION = "code.function";
  var TMP_CODE_NAMESPACE = "code.namespace";
  var TMP_CODE_FILEPATH = "code.filepath";
  var TMP_CODE_LINENO = "code.lineno";
  var TMP_HTTP_METHOD = "http.method";
  var TMP_HTTP_URL = "http.url";
  var TMP_HTTP_TARGET = "http.target";
  var TMP_HTTP_HOST = "http.host";
  var TMP_HTTP_SCHEME = "http.scheme";
  var TMP_HTTP_STATUS_CODE = "http.status_code";
  var TMP_HTTP_FLAVOR = "http.flavor";
  var TMP_HTTP_USER_AGENT = "http.user_agent";
  var TMP_HTTP_REQUEST_CONTENT_LENGTH = "http.request_content_length";
  var TMP_HTTP_REQUEST_CONTENT_LENGTH_UNCOMPRESSED = "http.request_content_length_uncompressed";
  var TMP_HTTP_RESPONSE_CONTENT_LENGTH = "http.response_content_length";
  var TMP_HTTP_RESPONSE_CONTENT_LENGTH_UNCOMPRESSED = "http.response_content_length_uncompressed";
  var TMP_HTTP_SERVER_NAME = "http.server_name";
  var TMP_HTTP_ROUTE = "http.route";
  var TMP_HTTP_CLIENT_IP = "http.client_ip";
  var TMP_AWS_DYNAMODB_TABLE_NAMES = "aws.dynamodb.table_names";
  var TMP_AWS_DYNAMODB_CONSUMED_CAPACITY = "aws.dynamodb.consumed_capacity";
  var TMP_AWS_DYNAMODB_ITEM_COLLECTION_METRICS = "aws.dynamodb.item_collection_metrics";
  var TMP_AWS_DYNAMODB_PROVISIONED_READ_CAPACITY = "aws.dynamodb.provisioned_read_capacity";
  var TMP_AWS_DYNAMODB_PROVISIONED_WRITE_CAPACITY = "aws.dynamodb.provisioned_write_capacity";
  var TMP_AWS_DYNAMODB_CONSISTENT_READ = "aws.dynamodb.consistent_read";
  var TMP_AWS_DYNAMODB_PROJECTION = "aws.dynamodb.projection";
  var TMP_AWS_DYNAMODB_LIMIT = "aws.dynamodb.limit";
  var TMP_AWS_DYNAMODB_ATTRIBUTES_TO_GET = "aws.dynamodb.attributes_to_get";
  var TMP_AWS_DYNAMODB_INDEX_NAME = "aws.dynamodb.index_name";
  var TMP_AWS_DYNAMODB_SELECT = "aws.dynamodb.select";
  var TMP_AWS_DYNAMODB_GLOBAL_SECONDARY_INDEXES = "aws.dynamodb.global_secondary_indexes";
  var TMP_AWS_DYNAMODB_LOCAL_SECONDARY_INDEXES = "aws.dynamodb.local_secondary_indexes";
  var TMP_AWS_DYNAMODB_EXCLUSIVE_START_TABLE = "aws.dynamodb.exclusive_start_table";
  var TMP_AWS_DYNAMODB_TABLE_COUNT = "aws.dynamodb.table_count";
  var TMP_AWS_DYNAMODB_SCAN_FORWARD = "aws.dynamodb.scan_forward";
  var TMP_AWS_DYNAMODB_SEGMENT = "aws.dynamodb.segment";
  var TMP_AWS_DYNAMODB_TOTAL_SEGMENTS = "aws.dynamodb.total_segments";
  var TMP_AWS_DYNAMODB_COUNT = "aws.dynamodb.count";
  var TMP_AWS_DYNAMODB_SCANNED_COUNT = "aws.dynamodb.scanned_count";
  var TMP_AWS_DYNAMODB_ATTRIBUTE_DEFINITIONS = "aws.dynamodb.attribute_definitions";
  var TMP_AWS_DYNAMODB_GLOBAL_SECONDARY_INDEX_UPDATES = "aws.dynamodb.global_secondary_index_updates";
  var TMP_MESSAGING_SYSTEM = "messaging.system";
  var TMP_MESSAGING_DESTINATION = "messaging.destination";
  var TMP_MESSAGING_DESTINATION_KIND = "messaging.destination_kind";
  var TMP_MESSAGING_TEMP_DESTINATION = "messaging.temp_destination";
  var TMP_MESSAGING_PROTOCOL = "messaging.protocol";
  var TMP_MESSAGING_PROTOCOL_VERSION = "messaging.protocol_version";
  var TMP_MESSAGING_URL = "messaging.url";
  var TMP_MESSAGING_MESSAGE_ID = "messaging.message_id";
  var TMP_MESSAGING_CONVERSATION_ID = "messaging.conversation_id";
  var TMP_MESSAGING_MESSAGE_PAYLOAD_SIZE_BYTES = "messaging.message_payload_size_bytes";
  var TMP_MESSAGING_MESSAGE_PAYLOAD_COMPRESSED_SIZE_BYTES = "messaging.message_payload_compressed_size_bytes";
  var TMP_MESSAGING_OPERATION = "messaging.operation";
  var TMP_MESSAGING_CONSUMER_ID = "messaging.consumer_id";
  var TMP_MESSAGING_RABBITMQ_ROUTING_KEY = "messaging.rabbitmq.routing_key";
  var TMP_MESSAGING_KAFKA_MESSAGE_KEY = "messaging.kafka.message_key";
  var TMP_MESSAGING_KAFKA_CONSUMER_GROUP = "messaging.kafka.consumer_group";
  var TMP_MESSAGING_KAFKA_CLIENT_ID = "messaging.kafka.client_id";
  var TMP_MESSAGING_KAFKA_PARTITION = "messaging.kafka.partition";
  var TMP_MESSAGING_KAFKA_TOMBSTONE = "messaging.kafka.tombstone";
  var TMP_RPC_SYSTEM = "rpc.system";
  var TMP_RPC_SERVICE = "rpc.service";
  var TMP_RPC_METHOD = "rpc.method";
  var TMP_RPC_GRPC_STATUS_CODE = "rpc.grpc.status_code";
  var TMP_RPC_JSONRPC_VERSION = "rpc.jsonrpc.version";
  var TMP_RPC_JSONRPC_REQUEST_ID = "rpc.jsonrpc.request_id";
  var TMP_RPC_JSONRPC_ERROR_CODE = "rpc.jsonrpc.error_code";
  var TMP_RPC_JSONRPC_ERROR_MESSAGE = "rpc.jsonrpc.error_message";
  var TMP_MESSAGE_TYPE = "message.type";
  var TMP_MESSAGE_ID = "message.id";
  var TMP_MESSAGE_COMPRESSED_SIZE = "message.compressed_size";
  var TMP_MESSAGE_UNCOMPRESSED_SIZE = "message.uncompressed_size";
  exports.SEMATTRS_AWS_LAMBDA_INVOKED_ARN = TMP_AWS_LAMBDA_INVOKED_ARN;
  exports.SEMATTRS_DB_SYSTEM = TMP_DB_SYSTEM;
  exports.SEMATTRS_DB_CONNECTION_STRING = TMP_DB_CONNECTION_STRING;
  exports.SEMATTRS_DB_USER = TMP_DB_USER;
  exports.SEMATTRS_DB_JDBC_DRIVER_CLASSNAME = TMP_DB_JDBC_DRIVER_CLASSNAME;
  exports.SEMATTRS_DB_NAME = TMP_DB_NAME;
  exports.SEMATTRS_DB_STATEMENT = TMP_DB_STATEMENT;
  exports.SEMATTRS_DB_OPERATION = TMP_DB_OPERATION;
  exports.SEMATTRS_DB_MSSQL_INSTANCE_NAME = TMP_DB_MSSQL_INSTANCE_NAME;
  exports.SEMATTRS_DB_CASSANDRA_KEYSPACE = TMP_DB_CASSANDRA_KEYSPACE;
  exports.SEMATTRS_DB_CASSANDRA_PAGE_SIZE = TMP_DB_CASSANDRA_PAGE_SIZE;
  exports.SEMATTRS_DB_CASSANDRA_CONSISTENCY_LEVEL = TMP_DB_CASSANDRA_CONSISTENCY_LEVEL;
  exports.SEMATTRS_DB_CASSANDRA_TABLE = TMP_DB_CASSANDRA_TABLE;
  exports.SEMATTRS_DB_CASSANDRA_IDEMPOTENCE = TMP_DB_CASSANDRA_IDEMPOTENCE;
  exports.SEMATTRS_DB_CASSANDRA_SPECULATIVE_EXECUTION_COUNT = TMP_DB_CASSANDRA_SPECULATIVE_EXECUTION_COUNT;
  exports.SEMATTRS_DB_CASSANDRA_COORDINATOR_ID = TMP_DB_CASSANDRA_COORDINATOR_ID;
  exports.SEMATTRS_DB_CASSANDRA_COORDINATOR_DC = TMP_DB_CASSANDRA_COORDINATOR_DC;
  exports.SEMATTRS_DB_HBASE_NAMESPACE = TMP_DB_HBASE_NAMESPACE;
  exports.SEMATTRS_DB_REDIS_DATABASE_INDEX = TMP_DB_REDIS_DATABASE_INDEX;
  exports.SEMATTRS_DB_MONGODB_COLLECTION = TMP_DB_MONGODB_COLLECTION;
  exports.SEMATTRS_DB_SQL_TABLE = TMP_DB_SQL_TABLE;
  exports.SEMATTRS_EXCEPTION_TYPE = TMP_EXCEPTION_TYPE;
  exports.SEMATTRS_EXCEPTION_MESSAGE = TMP_EXCEPTION_MESSAGE;
  exports.SEMATTRS_EXCEPTION_STACKTRACE = TMP_EXCEPTION_STACKTRACE;
  exports.SEMATTRS_EXCEPTION_ESCAPED = TMP_EXCEPTION_ESCAPED;
  exports.SEMATTRS_FAAS_TRIGGER = TMP_FAAS_TRIGGER;
  exports.SEMATTRS_FAAS_EXECUTION = TMP_FAAS_EXECUTION;
  exports.SEMATTRS_FAAS_DOCUMENT_COLLECTION = TMP_FAAS_DOCUMENT_COLLECTION;
  exports.SEMATTRS_FAAS_DOCUMENT_OPERATION = TMP_FAAS_DOCUMENT_OPERATION;
  exports.SEMATTRS_FAAS_DOCUMENT_TIME = TMP_FAAS_DOCUMENT_TIME;
  exports.SEMATTRS_FAAS_DOCUMENT_NAME = TMP_FAAS_DOCUMENT_NAME;
  exports.SEMATTRS_FAAS_TIME = TMP_FAAS_TIME;
  exports.SEMATTRS_FAAS_CRON = TMP_FAAS_CRON;
  exports.SEMATTRS_FAAS_COLDSTART = TMP_FAAS_COLDSTART;
  exports.SEMATTRS_FAAS_INVOKED_NAME = TMP_FAAS_INVOKED_NAME;
  exports.SEMATTRS_FAAS_INVOKED_PROVIDER = TMP_FAAS_INVOKED_PROVIDER;
  exports.SEMATTRS_FAAS_INVOKED_REGION = TMP_FAAS_INVOKED_REGION;
  exports.SEMATTRS_NET_TRANSPORT = TMP_NET_TRANSPORT;
  exports.SEMATTRS_NET_PEER_IP = TMP_NET_PEER_IP;
  exports.SEMATTRS_NET_PEER_PORT = TMP_NET_PEER_PORT;
  exports.SEMATTRS_NET_PEER_NAME = TMP_NET_PEER_NAME;
  exports.SEMATTRS_NET_HOST_IP = TMP_NET_HOST_IP;
  exports.SEMATTRS_NET_HOST_PORT = TMP_NET_HOST_PORT;
  exports.SEMATTRS_NET_HOST_NAME = TMP_NET_HOST_NAME;
  exports.SEMATTRS_NET_HOST_CONNECTION_TYPE = TMP_NET_HOST_CONNECTION_TYPE;
  exports.SEMATTRS_NET_HOST_CONNECTION_SUBTYPE = TMP_NET_HOST_CONNECTION_SUBTYPE;
  exports.SEMATTRS_NET_HOST_CARRIER_NAME = TMP_NET_HOST_CARRIER_NAME;
  exports.SEMATTRS_NET_HOST_CARRIER_MCC = TMP_NET_HOST_CARRIER_MCC;
  exports.SEMATTRS_NET_HOST_CARRIER_MNC = TMP_NET_HOST_CARRIER_MNC;
  exports.SEMATTRS_NET_HOST_CARRIER_ICC = TMP_NET_HOST_CARRIER_ICC;
  exports.SEMATTRS_PEER_SERVICE = TMP_PEER_SERVICE;
  exports.SEMATTRS_ENDUSER_ID = TMP_ENDUSER_ID;
  exports.SEMATTRS_ENDUSER_ROLE = TMP_ENDUSER_ROLE;
  exports.SEMATTRS_ENDUSER_SCOPE = TMP_ENDUSER_SCOPE;
  exports.SEMATTRS_THREAD_ID = TMP_THREAD_ID;
  exports.SEMATTRS_THREAD_NAME = TMP_THREAD_NAME;
  exports.SEMATTRS_CODE_FUNCTION = TMP_CODE_FUNCTION;
  exports.SEMATTRS_CODE_NAMESPACE = TMP_CODE_NAMESPACE;
  exports.SEMATTRS_CODE_FILEPATH = TMP_CODE_FILEPATH;
  exports.SEMATTRS_CODE_LINENO = TMP_CODE_LINENO;
  exports.SEMATTRS_HTTP_METHOD = TMP_HTTP_METHOD;
  exports.SEMATTRS_HTTP_URL = TMP_HTTP_URL;
  exports.SEMATTRS_HTTP_TARGET = TMP_HTTP_TARGET;
  exports.SEMATTRS_HTTP_HOST = TMP_HTTP_HOST;
  exports.SEMATTRS_HTTP_SCHEME = TMP_HTTP_SCHEME;
  exports.SEMATTRS_HTTP_STATUS_CODE = TMP_HTTP_STATUS_CODE;
  exports.SEMATTRS_HTTP_FLAVOR = TMP_HTTP_FLAVOR;
  exports.SEMATTRS_HTTP_USER_AGENT = TMP_HTTP_USER_AGENT;
  exports.SEMATTRS_HTTP_REQUEST_CONTENT_LENGTH = TMP_HTTP_REQUEST_CONTENT_LENGTH;
  exports.SEMATTRS_HTTP_REQUEST_CONTENT_LENGTH_UNCOMPRESSED = TMP_HTTP_REQUEST_CONTENT_LENGTH_UNCOMPRESSED;
  exports.SEMATTRS_HTTP_RESPONSE_CONTENT_LENGTH = TMP_HTTP_RESPONSE_CONTENT_LENGTH;
  exports.SEMATTRS_HTTP_RESPONSE_CONTENT_LENGTH_UNCOMPRESSED = TMP_HTTP_RESPONSE_CONTENT_LENGTH_UNCOMPRESSED;
  exports.SEMATTRS_HTTP_SERVER_NAME = TMP_HTTP_SERVER_NAME;
  exports.SEMATTRS_HTTP_ROUTE = TMP_HTTP_ROUTE;
  exports.SEMATTRS_HTTP_CLIENT_IP = TMP_HTTP_CLIENT_IP;
  exports.SEMATTRS_AWS_DYNAMODB_TABLE_NAMES = TMP_AWS_DYNAMODB_TABLE_NAMES;
  exports.SEMATTRS_AWS_DYNAMODB_CONSUMED_CAPACITY = TMP_AWS_DYNAMODB_CONSUMED_CAPACITY;
  exports.SEMATTRS_AWS_DYNAMODB_ITEM_COLLECTION_METRICS = TMP_AWS_DYNAMODB_ITEM_COLLECTION_METRICS;
  exports.SEMATTRS_AWS_DYNAMODB_PROVISIONED_READ_CAPACITY = TMP_AWS_DYNAMODB_PROVISIONED_READ_CAPACITY;
  exports.SEMATTRS_AWS_DYNAMODB_PROVISIONED_WRITE_CAPACITY = TMP_AWS_DYNAMODB_PROVISIONED_WRITE_CAPACITY;
  exports.SEMATTRS_AWS_DYNAMODB_CONSISTENT_READ = TMP_AWS_DYNAMODB_CONSISTENT_READ;
  exports.SEMATTRS_AWS_DYNAMODB_PROJECTION = TMP_AWS_DYNAMODB_PROJECTION;
  exports.SEMATTRS_AWS_DYNAMODB_LIMIT = TMP_AWS_DYNAMODB_LIMIT;
  exports.SEMATTRS_AWS_DYNAMODB_ATTRIBUTES_TO_GET = TMP_AWS_DYNAMODB_ATTRIBUTES_TO_GET;
  exports.SEMATTRS_AWS_DYNAMODB_INDEX_NAME = TMP_AWS_DYNAMODB_INDEX_NAME;
  exports.SEMATTRS_AWS_DYNAMODB_SELECT = TMP_AWS_DYNAMODB_SELECT;
  exports.SEMATTRS_AWS_DYNAMODB_GLOBAL_SECONDARY_INDEXES = TMP_AWS_DYNAMODB_GLOBAL_SECONDARY_INDEXES;
  exports.SEMATTRS_AWS_DYNAMODB_LOCAL_SECONDARY_INDEXES = TMP_AWS_DYNAMODB_LOCAL_SECONDARY_INDEXES;
  exports.SEMATTRS_AWS_DYNAMODB_EXCLUSIVE_START_TABLE = TMP_AWS_DYNAMODB_EXCLUSIVE_START_TABLE;
  exports.SEMATTRS_AWS_DYNAMODB_TABLE_COUNT = TMP_AWS_DYNAMODB_TABLE_COUNT;
  exports.SEMATTRS_AWS_DYNAMODB_SCAN_FORWARD = TMP_AWS_DYNAMODB_SCAN_FORWARD;
  exports.SEMATTRS_AWS_DYNAMODB_SEGMENT = TMP_AWS_DYNAMODB_SEGMENT;
  exports.SEMATTRS_AWS_DYNAMODB_TOTAL_SEGMENTS = TMP_AWS_DYNAMODB_TOTAL_SEGMENTS;
  exports.SEMATTRS_AWS_DYNAMODB_COUNT = TMP_AWS_DYNAMODB_COUNT;
  exports.SEMATTRS_AWS_DYNAMODB_SCANNED_COUNT = TMP_AWS_DYNAMODB_SCANNED_COUNT;
  exports.SEMATTRS_AWS_DYNAMODB_ATTRIBUTE_DEFINITIONS = TMP_AWS_DYNAMODB_ATTRIBUTE_DEFINITIONS;
  exports.SEMATTRS_AWS_DYNAMODB_GLOBAL_SECONDARY_INDEX_UPDATES = TMP_AWS_DYNAMODB_GLOBAL_SECONDARY_INDEX_UPDATES;
  exports.SEMATTRS_MESSAGING_SYSTEM = TMP_MESSAGING_SYSTEM;
  exports.SEMATTRS_MESSAGING_DESTINATION = TMP_MESSAGING_DESTINATION;
  exports.SEMATTRS_MESSAGING_DESTINATION_KIND = TMP_MESSAGING_DESTINATION_KIND;
  exports.SEMATTRS_MESSAGING_TEMP_DESTINATION = TMP_MESSAGING_TEMP_DESTINATION;
  exports.SEMATTRS_MESSAGING_PROTOCOL = TMP_MESSAGING_PROTOCOL;
  exports.SEMATTRS_MESSAGING_PROTOCOL_VERSION = TMP_MESSAGING_PROTOCOL_VERSION;
  exports.SEMATTRS_MESSAGING_URL = TMP_MESSAGING_URL;
  exports.SEMATTRS_MESSAGING_MESSAGE_ID = TMP_MESSAGING_MESSAGE_ID;
  exports.SEMATTRS_MESSAGING_CONVERSATION_ID = TMP_MESSAGING_CONVERSATION_ID;
  exports.SEMATTRS_MESSAGING_MESSAGE_PAYLOAD_SIZE_BYTES = TMP_MESSAGING_MESSAGE_PAYLOAD_SIZE_BYTES;
  exports.SEMATTRS_MESSAGING_MESSAGE_PAYLOAD_COMPRESSED_SIZE_BYTES = TMP_MESSAGING_MESSAGE_PAYLOAD_COMPRESSED_SIZE_BYTES;
  exports.SEMATTRS_MESSAGING_OPERATION = TMP_MESSAGING_OPERATION;
  exports.SEMATTRS_MESSAGING_CONSUMER_ID = TMP_MESSAGING_CONSUMER_ID;
  exports.SEMATTRS_MESSAGING_RABBITMQ_ROUTING_KEY = TMP_MESSAGING_RABBITMQ_ROUTING_KEY;
  exports.SEMATTRS_MESSAGING_KAFKA_MESSAGE_KEY = TMP_MESSAGING_KAFKA_MESSAGE_KEY;
  exports.SEMATTRS_MESSAGING_KAFKA_CONSUMER_GROUP = TMP_MESSAGING_KAFKA_CONSUMER_GROUP;
  exports.SEMATTRS_MESSAGING_KAFKA_CLIENT_ID = TMP_MESSAGING_KAFKA_CLIENT_ID;
  exports.SEMATTRS_MESSAGING_KAFKA_PARTITION = TMP_MESSAGING_KAFKA_PARTITION;
  exports.SEMATTRS_MESSAGING_KAFKA_TOMBSTONE = TMP_MESSAGING_KAFKA_TOMBSTONE;
  exports.SEMATTRS_RPC_SYSTEM = TMP_RPC_SYSTEM;
  exports.SEMATTRS_RPC_SERVICE = TMP_RPC_SERVICE;
  exports.SEMATTRS_RPC_METHOD = TMP_RPC_METHOD;
  exports.SEMATTRS_RPC_GRPC_STATUS_CODE = TMP_RPC_GRPC_STATUS_CODE;
  exports.SEMATTRS_RPC_JSONRPC_VERSION = TMP_RPC_JSONRPC_VERSION;
  exports.SEMATTRS_RPC_JSONRPC_REQUEST_ID = TMP_RPC_JSONRPC_REQUEST_ID;
  exports.SEMATTRS_RPC_JSONRPC_ERROR_CODE = TMP_RPC_JSONRPC_ERROR_CODE;
  exports.SEMATTRS_RPC_JSONRPC_ERROR_MESSAGE = TMP_RPC_JSONRPC_ERROR_MESSAGE;
  exports.SEMATTRS_MESSAGE_TYPE = TMP_MESSAGE_TYPE;
  exports.SEMATTRS_MESSAGE_ID = TMP_MESSAGE_ID;
  exports.SEMATTRS_MESSAGE_COMPRESSED_SIZE = TMP_MESSAGE_COMPRESSED_SIZE;
  exports.SEMATTRS_MESSAGE_UNCOMPRESSED_SIZE = TMP_MESSAGE_UNCOMPRESSED_SIZE;
  exports.SemanticAttributes = /* @__PURE__ */ (0, utils_1.createConstMap)([
    TMP_AWS_LAMBDA_INVOKED_ARN,
    TMP_DB_SYSTEM,
    TMP_DB_CONNECTION_STRING,
    TMP_DB_USER,
    TMP_DB_JDBC_DRIVER_CLASSNAME,
    TMP_DB_NAME,
    TMP_DB_STATEMENT,
    TMP_DB_OPERATION,
    TMP_DB_MSSQL_INSTANCE_NAME,
    TMP_DB_CASSANDRA_KEYSPACE,
    TMP_DB_CASSANDRA_PAGE_SIZE,
    TMP_DB_CASSANDRA_CONSISTENCY_LEVEL,
    TMP_DB_CASSANDRA_TABLE,
    TMP_DB_CASSANDRA_IDEMPOTENCE,
    TMP_DB_CASSANDRA_SPECULATIVE_EXECUTION_COUNT,
    TMP_DB_CASSANDRA_COORDINATOR_ID,
    TMP_DB_CASSANDRA_COORDINATOR_DC,
    TMP_DB_HBASE_NAMESPACE,
    TMP_DB_REDIS_DATABASE_INDEX,
    TMP_DB_MONGODB_COLLECTION,
    TMP_DB_SQL_TABLE,
    TMP_EXCEPTION_TYPE,
    TMP_EXCEPTION_MESSAGE,
    TMP_EXCEPTION_STACKTRACE,
    TMP_EXCEPTION_ESCAPED,
    TMP_FAAS_TRIGGER,
    TMP_FAAS_EXECUTION,
    TMP_FAAS_DOCUMENT_COLLECTION,
    TMP_FAAS_DOCUMENT_OPERATION,
    TMP_FAAS_DOCUMENT_TIME,
    TMP_FAAS_DOCUMENT_NAME,
    TMP_FAAS_TIME,
    TMP_FAAS_CRON,
    TMP_FAAS_COLDSTART,
    TMP_FAAS_INVOKED_NAME,
    TMP_FAAS_INVOKED_PROVIDER,
    TMP_FAAS_INVOKED_REGION,
    TMP_NET_TRANSPORT,
    TMP_NET_PEER_IP,
    TMP_NET_PEER_PORT,
    TMP_NET_PEER_NAME,
    TMP_NET_HOST_IP,
    TMP_NET_HOST_PORT,
    TMP_NET_HOST_NAME,
    TMP_NET_HOST_CONNECTION_TYPE,
    TMP_NET_HOST_CONNECTION_SUBTYPE,
    TMP_NET_HOST_CARRIER_NAME,
    TMP_NET_HOST_CARRIER_MCC,
    TMP_NET_HOST_CARRIER_MNC,
    TMP_NET_HOST_CARRIER_ICC,
    TMP_PEER_SERVICE,
    TMP_ENDUSER_ID,
    TMP_ENDUSER_ROLE,
    TMP_ENDUSER_SCOPE,
    TMP_THREAD_ID,
    TMP_THREAD_NAME,
    TMP_CODE_FUNCTION,
    TMP_CODE_NAMESPACE,
    TMP_CODE_FILEPATH,
    TMP_CODE_LINENO,
    TMP_HTTP_METHOD,
    TMP_HTTP_URL,
    TMP_HTTP_TARGET,
    TMP_HTTP_HOST,
    TMP_HTTP_SCHEME,
    TMP_HTTP_STATUS_CODE,
    TMP_HTTP_FLAVOR,
    TMP_HTTP_USER_AGENT,
    TMP_HTTP_REQUEST_CONTENT_LENGTH,
    TMP_HTTP_REQUEST_CONTENT_LENGTH_UNCOMPRESSED,
    TMP_HTTP_RESPONSE_CONTENT_LENGTH,
    TMP_HTTP_RESPONSE_CONTENT_LENGTH_UNCOMPRESSED,
    TMP_HTTP_SERVER_NAME,
    TMP_HTTP_ROUTE,
    TMP_HTTP_CLIENT_IP,
    TMP_AWS_DYNAMODB_TABLE_NAMES,
    TMP_AWS_DYNAMODB_CONSUMED_CAPACITY,
    TMP_AWS_DYNAMODB_ITEM_COLLECTION_METRICS,
    TMP_AWS_DYNAMODB_PROVISIONED_READ_CAPACITY,
    TMP_AWS_DYNAMODB_PROVISIONED_WRITE_CAPACITY,
    TMP_AWS_DYNAMODB_CONSISTENT_READ,
    TMP_AWS_DYNAMODB_PROJECTION,
    TMP_AWS_DYNAMODB_LIMIT,
    TMP_AWS_DYNAMODB_ATTRIBUTES_TO_GET,
    TMP_AWS_DYNAMODB_INDEX_NAME,
    TMP_AWS_DYNAMODB_SELECT,
    TMP_AWS_DYNAMODB_GLOBAL_SECONDARY_INDEXES,
    TMP_AWS_DYNAMODB_LOCAL_SECONDARY_INDEXES,
    TMP_AWS_DYNAMODB_EXCLUSIVE_START_TABLE,
    TMP_AWS_DYNAMODB_TABLE_COUNT,
    TMP_AWS_DYNAMODB_SCAN_FORWARD,
    TMP_AWS_DYNAMODB_SEGMENT,
    TMP_AWS_DYNAMODB_TOTAL_SEGMENTS,
    TMP_AWS_DYNAMODB_COUNT,
    TMP_AWS_DYNAMODB_SCANNED_COUNT,
    TMP_AWS_DYNAMODB_ATTRIBUTE_DEFINITIONS,
    TMP_AWS_DYNAMODB_GLOBAL_SECONDARY_INDEX_UPDATES,
    TMP_MESSAGING_SYSTEM,
    TMP_MESSAGING_DESTINATION,
    TMP_MESSAGING_DESTINATION_KIND,
    TMP_MESSAGING_TEMP_DESTINATION,
    TMP_MESSAGING_PROTOCOL,
    TMP_MESSAGING_PROTOCOL_VERSION,
    TMP_MESSAGING_URL,
    TMP_MESSAGING_MESSAGE_ID,
    TMP_MESSAGING_CONVERSATION_ID,
    TMP_MESSAGING_MESSAGE_PAYLOAD_SIZE_BYTES,
    TMP_MESSAGING_MESSAGE_PAYLOAD_COMPRESSED_SIZE_BYTES,
    TMP_MESSAGING_OPERATION,
    TMP_MESSAGING_CONSUMER_ID,
    TMP_MESSAGING_RABBITMQ_ROUTING_KEY,
    TMP_MESSAGING_KAFKA_MESSAGE_KEY,
    TMP_MESSAGING_KAFKA_CONSUMER_GROUP,
    TMP_MESSAGING_KAFKA_CLIENT_ID,
    TMP_MESSAGING_KAFKA_PARTITION,
    TMP_MESSAGING_KAFKA_TOMBSTONE,
    TMP_RPC_SYSTEM,
    TMP_RPC_SERVICE,
    TMP_RPC_METHOD,
    TMP_RPC_GRPC_STATUS_CODE,
    TMP_RPC_JSONRPC_VERSION,
    TMP_RPC_JSONRPC_REQUEST_ID,
    TMP_RPC_JSONRPC_ERROR_CODE,
    TMP_RPC_JSONRPC_ERROR_MESSAGE,
    TMP_MESSAGE_TYPE,
    TMP_MESSAGE_ID,
    TMP_MESSAGE_COMPRESSED_SIZE,
    TMP_MESSAGE_UNCOMPRESSED_SIZE
  ]);
  var TMP_DBSYSTEMVALUES_OTHER_SQL = "other_sql";
  var TMP_DBSYSTEMVALUES_MSSQL = "mssql";
  var TMP_DBSYSTEMVALUES_MYSQL = "mysql";
  var TMP_DBSYSTEMVALUES_ORACLE = "oracle";
  var TMP_DBSYSTEMVALUES_DB2 = "db2";
  var TMP_DBSYSTEMVALUES_POSTGRESQL = "postgresql";
  var TMP_DBSYSTEMVALUES_REDSHIFT = "redshift";
  var TMP_DBSYSTEMVALUES_HIVE = "hive";
  var TMP_DBSYSTEMVALUES_CLOUDSCAPE = "cloudscape";
  var TMP_DBSYSTEMVALUES_HSQLDB = "hsqldb";
  var TMP_DBSYSTEMVALUES_PROGRESS = "progress";
  var TMP_DBSYSTEMVALUES_MAXDB = "maxdb";
  var TMP_DBSYSTEMVALUES_HANADB = "hanadb";
  var TMP_DBSYSTEMVALUES_INGRES = "ingres";
  var TMP_DBSYSTEMVALUES_FIRSTSQL = "firstsql";
  var TMP_DBSYSTEMVALUES_EDB = "edb";
  var TMP_DBSYSTEMVALUES_CACHE = "cache";
  var TMP_DBSYSTEMVALUES_ADABAS = "adabas";
  var TMP_DBSYSTEMVALUES_FIREBIRD = "firebird";
  var TMP_DBSYSTEMVALUES_DERBY = "derby";
  var TMP_DBSYSTEMVALUES_FILEMAKER = "filemaker";
  var TMP_DBSYSTEMVALUES_INFORMIX = "informix";
  var TMP_DBSYSTEMVALUES_INSTANTDB = "instantdb";
  var TMP_DBSYSTEMVALUES_INTERBASE = "interbase";
  var TMP_DBSYSTEMVALUES_MARIADB = "mariadb";
  var TMP_DBSYSTEMVALUES_NETEZZA = "netezza";
  var TMP_DBSYSTEMVALUES_PERVASIVE = "pervasive";
  var TMP_DBSYSTEMVALUES_POINTBASE = "pointbase";
  var TMP_DBSYSTEMVALUES_SQLITE = "sqlite";
  var TMP_DBSYSTEMVALUES_SYBASE = "sybase";
  var TMP_DBSYSTEMVALUES_TERADATA = "teradata";
  var TMP_DBSYSTEMVALUES_VERTICA = "vertica";
  var TMP_DBSYSTEMVALUES_H2 = "h2";
  var TMP_DBSYSTEMVALUES_COLDFUSION = "coldfusion";
  var TMP_DBSYSTEMVALUES_CASSANDRA = "cassandra";
  var TMP_DBSYSTEMVALUES_HBASE = "hbase";
  var TMP_DBSYSTEMVALUES_MONGODB = "mongodb";
  var TMP_DBSYSTEMVALUES_REDIS = "redis";
  var TMP_DBSYSTEMVALUES_COUCHBASE = "couchbase";
  var TMP_DBSYSTEMVALUES_COUCHDB = "couchdb";
  var TMP_DBSYSTEMVALUES_COSMOSDB = "cosmosdb";
  var TMP_DBSYSTEMVALUES_DYNAMODB = "dynamodb";
  var TMP_DBSYSTEMVALUES_NEO4J = "neo4j";
  var TMP_DBSYSTEMVALUES_GEODE = "geode";
  var TMP_DBSYSTEMVALUES_ELASTICSEARCH = "elasticsearch";
  var TMP_DBSYSTEMVALUES_MEMCACHED = "memcached";
  var TMP_DBSYSTEMVALUES_COCKROACHDB = "cockroachdb";
  exports.DBSYSTEMVALUES_OTHER_SQL = TMP_DBSYSTEMVALUES_OTHER_SQL;
  exports.DBSYSTEMVALUES_MSSQL = TMP_DBSYSTEMVALUES_MSSQL;
  exports.DBSYSTEMVALUES_MYSQL = TMP_DBSYSTEMVALUES_MYSQL;
  exports.DBSYSTEMVALUES_ORACLE = TMP_DBSYSTEMVALUES_ORACLE;
  exports.DBSYSTEMVALUES_DB2 = TMP_DBSYSTEMVALUES_DB2;
  exports.DBSYSTEMVALUES_POSTGRESQL = TMP_DBSYSTEMVALUES_POSTGRESQL;
  exports.DBSYSTEMVALUES_REDSHIFT = TMP_DBSYSTEMVALUES_REDSHIFT;
  exports.DBSYSTEMVALUES_HIVE = TMP_DBSYSTEMVALUES_HIVE;
  exports.DBSYSTEMVALUES_CLOUDSCAPE = TMP_DBSYSTEMVALUES_CLOUDSCAPE;
  exports.DBSYSTEMVALUES_HSQLDB = TMP_DBSYSTEMVALUES_HSQLDB;
  exports.DBSYSTEMVALUES_PROGRESS = TMP_DBSYSTEMVALUES_PROGRESS;
  exports.DBSYSTEMVALUES_MAXDB = TMP_DBSYSTEMVALUES_MAXDB;
  exports.DBSYSTEMVALUES_HANADB = TMP_DBSYSTEMVALUES_HANADB;
  exports.DBSYSTEMVALUES_INGRES = TMP_DBSYSTEMVALUES_INGRES;
  exports.DBSYSTEMVALUES_FIRSTSQL = TMP_DBSYSTEMVALUES_FIRSTSQL;
  exports.DBSYSTEMVALUES_EDB = TMP_DBSYSTEMVALUES_EDB;
  exports.DBSYSTEMVALUES_CACHE = TMP_DBSYSTEMVALUES_CACHE;
  exports.DBSYSTEMVALUES_ADABAS = TMP_DBSYSTEMVALUES_ADABAS;
  exports.DBSYSTEMVALUES_FIREBIRD = TMP_DBSYSTEMVALUES_FIREBIRD;
  exports.DBSYSTEMVALUES_DERBY = TMP_DBSYSTEMVALUES_DERBY;
  exports.DBSYSTEMVALUES_FILEMAKER = TMP_DBSYSTEMVALUES_FILEMAKER;
  exports.DBSYSTEMVALUES_INFORMIX = TMP_DBSYSTEMVALUES_INFORMIX;
  exports.DBSYSTEMVALUES_INSTANTDB = TMP_DBSYSTEMVALUES_INSTANTDB;
  exports.DBSYSTEMVALUES_INTERBASE = TMP_DBSYSTEMVALUES_INTERBASE;
  exports.DBSYSTEMVALUES_MARIADB = TMP_DBSYSTEMVALUES_MARIADB;
  exports.DBSYSTEMVALUES_NETEZZA = TMP_DBSYSTEMVALUES_NETEZZA;
  exports.DBSYSTEMVALUES_PERVASIVE = TMP_DBSYSTEMVALUES_PERVASIVE;
  exports.DBSYSTEMVALUES_POINTBASE = TMP_DBSYSTEMVALUES_POINTBASE;
  exports.DBSYSTEMVALUES_SQLITE = TMP_DBSYSTEMVALUES_SQLITE;
  exports.DBSYSTEMVALUES_SYBASE = TMP_DBSYSTEMVALUES_SYBASE;
  exports.DBSYSTEMVALUES_TERADATA = TMP_DBSYSTEMVALUES_TERADATA;
  exports.DBSYSTEMVALUES_VERTICA = TMP_DBSYSTEMVALUES_VERTICA;
  exports.DBSYSTEMVALUES_H2 = TMP_DBSYSTEMVALUES_H2;
  exports.DBSYSTEMVALUES_COLDFUSION = TMP_DBSYSTEMVALUES_COLDFUSION;
  exports.DBSYSTEMVALUES_CASSANDRA = TMP_DBSYSTEMVALUES_CASSANDRA;
  exports.DBSYSTEMVALUES_HBASE = TMP_DBSYSTEMVALUES_HBASE;
  exports.DBSYSTEMVALUES_MONGODB = TMP_DBSYSTEMVALUES_MONGODB;
  exports.DBSYSTEMVALUES_REDIS = TMP_DBSYSTEMVALUES_REDIS;
  exports.DBSYSTEMVALUES_COUCHBASE = TMP_DBSYSTEMVALUES_COUCHBASE;
  exports.DBSYSTEMVALUES_COUCHDB = TMP_DBSYSTEMVALUES_COUCHDB;
  exports.DBSYSTEMVALUES_COSMOSDB = TMP_DBSYSTEMVALUES_COSMOSDB;
  exports.DBSYSTEMVALUES_DYNAMODB = TMP_DBSYSTEMVALUES_DYNAMODB;
  exports.DBSYSTEMVALUES_NEO4J = TMP_DBSYSTEMVALUES_NEO4J;
  exports.DBSYSTEMVALUES_GEODE = TMP_DBSYSTEMVALUES_GEODE;
  exports.DBSYSTEMVALUES_ELASTICSEARCH = TMP_DBSYSTEMVALUES_ELASTICSEARCH;
  exports.DBSYSTEMVALUES_MEMCACHED = TMP_DBSYSTEMVALUES_MEMCACHED;
  exports.DBSYSTEMVALUES_COCKROACHDB = TMP_DBSYSTEMVALUES_COCKROACHDB;
  exports.DbSystemValues = /* @__PURE__ */ (0, utils_1.createConstMap)([
    TMP_DBSYSTEMVALUES_OTHER_SQL,
    TMP_DBSYSTEMVALUES_MSSQL,
    TMP_DBSYSTEMVALUES_MYSQL,
    TMP_DBSYSTEMVALUES_ORACLE,
    TMP_DBSYSTEMVALUES_DB2,
    TMP_DBSYSTEMVALUES_POSTGRESQL,
    TMP_DBSYSTEMVALUES_REDSHIFT,
    TMP_DBSYSTEMVALUES_HIVE,
    TMP_DBSYSTEMVALUES_CLOUDSCAPE,
    TMP_DBSYSTEMVALUES_HSQLDB,
    TMP_DBSYSTEMVALUES_PROGRESS,
    TMP_DBSYSTEMVALUES_MAXDB,
    TMP_DBSYSTEMVALUES_HANADB,
    TMP_DBSYSTEMVALUES_INGRES,
    TMP_DBSYSTEMVALUES_FIRSTSQL,
    TMP_DBSYSTEMVALUES_EDB,
    TMP_DBSYSTEMVALUES_CACHE,
    TMP_DBSYSTEMVALUES_ADABAS,
    TMP_DBSYSTEMVALUES_FIREBIRD,
    TMP_DBSYSTEMVALUES_DERBY,
    TMP_DBSYSTEMVALUES_FILEMAKER,
    TMP_DBSYSTEMVALUES_INFORMIX,
    TMP_DBSYSTEMVALUES_INSTANTDB,
    TMP_DBSYSTEMVALUES_INTERBASE,
    TMP_DBSYSTEMVALUES_MARIADB,
    TMP_DBSYSTEMVALUES_NETEZZA,
    TMP_DBSYSTEMVALUES_PERVASIVE,
    TMP_DBSYSTEMVALUES_POINTBASE,
    TMP_DBSYSTEMVALUES_SQLITE,
    TMP_DBSYSTEMVALUES_SYBASE,
    TMP_DBSYSTEMVALUES_TERADATA,
    TMP_DBSYSTEMVALUES_VERTICA,
    TMP_DBSYSTEMVALUES_H2,
    TMP_DBSYSTEMVALUES_COLDFUSION,
    TMP_DBSYSTEMVALUES_CASSANDRA,
    TMP_DBSYSTEMVALUES_HBASE,
    TMP_DBSYSTEMVALUES_MONGODB,
    TMP_DBSYSTEMVALUES_REDIS,
    TMP_DBSYSTEMVALUES_COUCHBASE,
    TMP_DBSYSTEMVALUES_COUCHDB,
    TMP_DBSYSTEMVALUES_COSMOSDB,
    TMP_DBSYSTEMVALUES_DYNAMODB,
    TMP_DBSYSTEMVALUES_NEO4J,
    TMP_DBSYSTEMVALUES_GEODE,
    TMP_DBSYSTEMVALUES_ELASTICSEARCH,
    TMP_DBSYSTEMVALUES_MEMCACHED,
    TMP_DBSYSTEMVALUES_COCKROACHDB
  ]);
  var TMP_DBCASSANDRACONSISTENCYLEVELVALUES_ALL = "all";
  var TMP_DBCASSANDRACONSISTENCYLEVELVALUES_EACH_QUORUM = "each_quorum";
  var TMP_DBCASSANDRACONSISTENCYLEVELVALUES_QUORUM = "quorum";
  var TMP_DBCASSANDRACONSISTENCYLEVELVALUES_LOCAL_QUORUM = "local_quorum";
  var TMP_DBCASSANDRACONSISTENCYLEVELVALUES_ONE = "one";
  var TMP_DBCASSANDRACONSISTENCYLEVELVALUES_TWO = "two";
  var TMP_DBCASSANDRACONSISTENCYLEVELVALUES_THREE = "three";
  var TMP_DBCASSANDRACONSISTENCYLEVELVALUES_LOCAL_ONE = "local_one";
  var TMP_DBCASSANDRACONSISTENCYLEVELVALUES_ANY = "any";
  var TMP_DBCASSANDRACONSISTENCYLEVELVALUES_SERIAL = "serial";
  var TMP_DBCASSANDRACONSISTENCYLEVELVALUES_LOCAL_SERIAL = "local_serial";
  exports.DBCASSANDRACONSISTENCYLEVELVALUES_ALL = TMP_DBCASSANDRACONSISTENCYLEVELVALUES_ALL;
  exports.DBCASSANDRACONSISTENCYLEVELVALUES_EACH_QUORUM = TMP_DBCASSANDRACONSISTENCYLEVELVALUES_EACH_QUORUM;
  exports.DBCASSANDRACONSISTENCYLEVELVALUES_QUORUM = TMP_DBCASSANDRACONSISTENCYLEVELVALUES_QUORUM;
  exports.DBCASSANDRACONSISTENCYLEVELVALUES_LOCAL_QUORUM = TMP_DBCASSANDRACONSISTENCYLEVELVALUES_LOCAL_QUORUM;
  exports.DBCASSANDRACONSISTENCYLEVELVALUES_ONE = TMP_DBCASSANDRACONSISTENCYLEVELVALUES_ONE;
  exports.DBCASSANDRACONSISTENCYLEVELVALUES_TWO = TMP_DBCASSANDRACONSISTENCYLEVELVALUES_TWO;
  exports.DBCASSANDRACONSISTENCYLEVELVALUES_THREE = TMP_DBCASSANDRACONSISTENCYLEVELVALUES_THREE;
  exports.DBCASSANDRACONSISTENCYLEVELVALUES_LOCAL_ONE = TMP_DBCASSANDRACONSISTENCYLEVELVALUES_LOCAL_ONE;
  exports.DBCASSANDRACONSISTENCYLEVELVALUES_ANY = TMP_DBCASSANDRACONSISTENCYLEVELVALUES_ANY;
  exports.DBCASSANDRACONSISTENCYLEVELVALUES_SERIAL = TMP_DBCASSANDRACONSISTENCYLEVELVALUES_SERIAL;
  exports.DBCASSANDRACONSISTENCYLEVELVALUES_LOCAL_SERIAL = TMP_DBCASSANDRACONSISTENCYLEVELVALUES_LOCAL_SERIAL;
  exports.DbCassandraConsistencyLevelValues = /* @__PURE__ */ (0, utils_1.createConstMap)([
    TMP_DBCASSANDRACONSISTENCYLEVELVALUES_ALL,
    TMP_DBCASSANDRACONSISTENCYLEVELVALUES_EACH_QUORUM,
    TMP_DBCASSANDRACONSISTENCYLEVELVALUES_QUORUM,
    TMP_DBCASSANDRACONSISTENCYLEVELVALUES_LOCAL_QUORUM,
    TMP_DBCASSANDRACONSISTENCYLEVELVALUES_ONE,
    TMP_DBCASSANDRACONSISTENCYLEVELVALUES_TWO,
    TMP_DBCASSANDRACONSISTENCYLEVELVALUES_THREE,
    TMP_DBCASSANDRACONSISTENCYLEVELVALUES_LOCAL_ONE,
    TMP_DBCASSANDRACONSISTENCYLEVELVALUES_ANY,
    TMP_DBCASSANDRACONSISTENCYLEVELVALUES_SERIAL,
    TMP_DBCASSANDRACONSISTENCYLEVELVALUES_LOCAL_SERIAL
  ]);
  var TMP_FAASTRIGGERVALUES_DATASOURCE = "datasource";
  var TMP_FAASTRIGGERVALUES_HTTP = "http";
  var TMP_FAASTRIGGERVALUES_PUBSUB = "pubsub";
  var TMP_FAASTRIGGERVALUES_TIMER = "timer";
  var TMP_FAASTRIGGERVALUES_OTHER = "other";
  exports.FAASTRIGGERVALUES_DATASOURCE = TMP_FAASTRIGGERVALUES_DATASOURCE;
  exports.FAASTRIGGERVALUES_HTTP = TMP_FAASTRIGGERVALUES_HTTP;
  exports.FAASTRIGGERVALUES_PUBSUB = TMP_FAASTRIGGERVALUES_PUBSUB;
  exports.FAASTRIGGERVALUES_TIMER = TMP_FAASTRIGGERVALUES_TIMER;
  exports.FAASTRIGGERVALUES_OTHER = TMP_FAASTRIGGERVALUES_OTHER;
  exports.FaasTriggerValues = /* @__PURE__ */ (0, utils_1.createConstMap)([
    TMP_FAASTRIGGERVALUES_DATASOURCE,
    TMP_FAASTRIGGERVALUES_HTTP,
    TMP_FAASTRIGGERVALUES_PUBSUB,
    TMP_FAASTRIGGERVALUES_TIMER,
    TMP_FAASTRIGGERVALUES_OTHER
  ]);
  var TMP_FAASDOCUMENTOPERATIONVALUES_INSERT = "insert";
  var TMP_FAASDOCUMENTOPERATIONVALUES_EDIT = "edit";
  var TMP_FAASDOCUMENTOPERATIONVALUES_DELETE = "delete";
  exports.FAASDOCUMENTOPERATIONVALUES_INSERT = TMP_FAASDOCUMENTOPERATIONVALUES_INSERT;
  exports.FAASDOCUMENTOPERATIONVALUES_EDIT = TMP_FAASDOCUMENTOPERATIONVALUES_EDIT;
  exports.FAASDOCUMENTOPERATIONVALUES_DELETE = TMP_FAASDOCUMENTOPERATIONVALUES_DELETE;
  exports.FaasDocumentOperationValues = /* @__PURE__ */ (0, utils_1.createConstMap)([
    TMP_FAASDOCUMENTOPERATIONVALUES_INSERT,
    TMP_FAASDOCUMENTOPERATIONVALUES_EDIT,
    TMP_FAASDOCUMENTOPERATIONVALUES_DELETE
  ]);
  var TMP_FAASINVOKEDPROVIDERVALUES_ALIBABA_CLOUD = "alibaba_cloud";
  var TMP_FAASINVOKEDPROVIDERVALUES_AWS = "aws";
  var TMP_FAASINVOKEDPROVIDERVALUES_AZURE = "azure";
  var TMP_FAASINVOKEDPROVIDERVALUES_GCP = "gcp";
  exports.FAASINVOKEDPROVIDERVALUES_ALIBABA_CLOUD = TMP_FAASINVOKEDPROVIDERVALUES_ALIBABA_CLOUD;
  exports.FAASINVOKEDPROVIDERVALUES_AWS = TMP_FAASINVOKEDPROVIDERVALUES_AWS;
  exports.FAASINVOKEDPROVIDERVALUES_AZURE = TMP_FAASINVOKEDPROVIDERVALUES_AZURE;
  exports.FAASINVOKEDPROVIDERVALUES_GCP = TMP_FAASINVOKEDPROVIDERVALUES_GCP;
  exports.FaasInvokedProviderValues = /* @__PURE__ */ (0, utils_1.createConstMap)([
    TMP_FAASINVOKEDPROVIDERVALUES_ALIBABA_CLOUD,
    TMP_FAASINVOKEDPROVIDERVALUES_AWS,
    TMP_FAASINVOKEDPROVIDERVALUES_AZURE,
    TMP_FAASINVOKEDPROVIDERVALUES_GCP
  ]);
  var TMP_NETTRANSPORTVALUES_IP_TCP = "ip_tcp";
  var TMP_NETTRANSPORTVALUES_IP_UDP = "ip_udp";
  var TMP_NETTRANSPORTVALUES_IP = "ip";
  var TMP_NETTRANSPORTVALUES_UNIX = "unix";
  var TMP_NETTRANSPORTVALUES_PIPE = "pipe";
  var TMP_NETTRANSPORTVALUES_INPROC = "inproc";
  var TMP_NETTRANSPORTVALUES_OTHER = "other";
  exports.NETTRANSPORTVALUES_IP_TCP = TMP_NETTRANSPORTVALUES_IP_TCP;
  exports.NETTRANSPORTVALUES_IP_UDP = TMP_NETTRANSPORTVALUES_IP_UDP;
  exports.NETTRANSPORTVALUES_IP = TMP_NETTRANSPORTVALUES_IP;
  exports.NETTRANSPORTVALUES_UNIX = TMP_NETTRANSPORTVALUES_UNIX;
  exports.NETTRANSPORTVALUES_PIPE = TMP_NETTRANSPORTVALUES_PIPE;
  exports.NETTRANSPORTVALUES_INPROC = TMP_NETTRANSPORTVALUES_INPROC;
  exports.NETTRANSPORTVALUES_OTHER = TMP_NETTRANSPORTVALUES_OTHER;
  exports.NetTransportValues = /* @__PURE__ */ (0, utils_1.createConstMap)([
    TMP_NETTRANSPORTVALUES_IP_TCP,
    TMP_NETTRANSPORTVALUES_IP_UDP,
    TMP_NETTRANSPORTVALUES_IP,
    TMP_NETTRANSPORTVALUES_UNIX,
    TMP_NETTRANSPORTVALUES_PIPE,
    TMP_NETTRANSPORTVALUES_INPROC,
    TMP_NETTRANSPORTVALUES_OTHER
  ]);
  var TMP_NETHOSTCONNECTIONTYPEVALUES_WIFI = "wifi";
  var TMP_NETHOSTCONNECTIONTYPEVALUES_WIRED = "wired";
  var TMP_NETHOSTCONNECTIONTYPEVALUES_CELL = "cell";
  var TMP_NETHOSTCONNECTIONTYPEVALUES_UNAVAILABLE = "unavailable";
  var TMP_NETHOSTCONNECTIONTYPEVALUES_UNKNOWN = "unknown";
  exports.NETHOSTCONNECTIONTYPEVALUES_WIFI = TMP_NETHOSTCONNECTIONTYPEVALUES_WIFI;
  exports.NETHOSTCONNECTIONTYPEVALUES_WIRED = TMP_NETHOSTCONNECTIONTYPEVALUES_WIRED;
  exports.NETHOSTCONNECTIONTYPEVALUES_CELL = TMP_NETHOSTCONNECTIONTYPEVALUES_CELL;
  exports.NETHOSTCONNECTIONTYPEVALUES_UNAVAILABLE = TMP_NETHOSTCONNECTIONTYPEVALUES_UNAVAILABLE;
  exports.NETHOSTCONNECTIONTYPEVALUES_UNKNOWN = TMP_NETHOSTCONNECTIONTYPEVALUES_UNKNOWN;
  exports.NetHostConnectionTypeValues = /* @__PURE__ */ (0, utils_1.createConstMap)([
    TMP_NETHOSTCONNECTIONTYPEVALUES_WIFI,
    TMP_NETHOSTCONNECTIONTYPEVALUES_WIRED,
    TMP_NETHOSTCONNECTIONTYPEVALUES_CELL,
    TMP_NETHOSTCONNECTIONTYPEVALUES_UNAVAILABLE,
    TMP_NETHOSTCONNECTIONTYPEVALUES_UNKNOWN
  ]);
  var TMP_NETHOSTCONNECTIONSUBTYPEVALUES_GPRS = "gprs";
  var TMP_NETHOSTCONNECTIONSUBTYPEVALUES_EDGE = "edge";
  var TMP_NETHOSTCONNECTIONSUBTYPEVALUES_UMTS = "umts";
  var TMP_NETHOSTCONNECTIONSUBTYPEVALUES_CDMA = "cdma";
  var TMP_NETHOSTCONNECTIONSUBTYPEVALUES_EVDO_0 = "evdo_0";
  var TMP_NETHOSTCONNECTIONSUBTYPEVALUES_EVDO_A = "evdo_a";
  var TMP_NETHOSTCONNECTIONSUBTYPEVALUES_CDMA2000_1XRTT = "cdma2000_1xrtt";
  var TMP_NETHOSTCONNECTIONSUBTYPEVALUES_HSDPA = "hsdpa";
  var TMP_NETHOSTCONNECTIONSUBTYPEVALUES_HSUPA = "hsupa";
  var TMP_NETHOSTCONNECTIONSUBTYPEVALUES_HSPA = "hspa";
  var TMP_NETHOSTCONNECTIONSUBTYPEVALUES_IDEN = "iden";
  var TMP_NETHOSTCONNECTIONSUBTYPEVALUES_EVDO_B = "evdo_b";
  var TMP_NETHOSTCONNECTIONSUBTYPEVALUES_LTE = "lte";
  var TMP_NETHOSTCONNECTIONSUBTYPEVALUES_EHRPD = "ehrpd";
  var TMP_NETHOSTCONNECTIONSUBTYPEVALUES_HSPAP = "hspap";
  var TMP_NETHOSTCONNECTIONSUBTYPEVALUES_GSM = "gsm";
  var TMP_NETHOSTCONNECTIONSUBTYPEVALUES_TD_SCDMA = "td_scdma";
  var TMP_NETHOSTCONNECTIONSUBTYPEVALUES_IWLAN = "iwlan";
  var TMP_NETHOSTCONNECTIONSUBTYPEVALUES_NR = "nr";
  var TMP_NETHOSTCONNECTIONSUBTYPEVALUES_NRNSA = "nrnsa";
  var TMP_NETHOSTCONNECTIONSUBTYPEVALUES_LTE_CA = "lte_ca";
  exports.NETHOSTCONNECTIONSUBTYPEVALUES_GPRS = TMP_NETHOSTCONNECTIONSUBTYPEVALUES_GPRS;
  exports.NETHOSTCONNECTIONSUBTYPEVALUES_EDGE = TMP_NETHOSTCONNECTIONSUBTYPEVALUES_EDGE;
  exports.NETHOSTCONNECTIONSUBTYPEVALUES_UMTS = TMP_NETHOSTCONNECTIONSUBTYPEVALUES_UMTS;
  exports.NETHOSTCONNECTIONSUBTYPEVALUES_CDMA = TMP_NETHOSTCONNECTIONSUBTYPEVALUES_CDMA;
  exports.NETHOSTCONNECTIONSUBTYPEVALUES_EVDO_0 = TMP_NETHOSTCONNECTIONSUBTYPEVALUES_EVDO_0;
  exports.NETHOSTCONNECTIONSUBTYPEVALUES_EVDO_A = TMP_NETHOSTCONNECTIONSUBTYPEVALUES_EVDO_A;
  exports.NETHOSTCONNECTIONSUBTYPEVALUES_CDMA2000_1XRTT = TMP_NETHOSTCONNECTIONSUBTYPEVALUES_CDMA2000_1XRTT;
  exports.NETHOSTCONNECTIONSUBTYPEVALUES_HSDPA = TMP_NETHOSTCONNECTIONSUBTYPEVALUES_HSDPA;
  exports.NETHOSTCONNECTIONSUBTYPEVALUES_HSUPA = TMP_NETHOSTCONNECTIONSUBTYPEVALUES_HSUPA;
  exports.NETHOSTCONNECTIONSUBTYPEVALUES_HSPA = TMP_NETHOSTCONNECTIONSUBTYPEVALUES_HSPA;
  exports.NETHOSTCONNECTIONSUBTYPEVALUES_IDEN = TMP_NETHOSTCONNECTIONSUBTYPEVALUES_IDEN;
  exports.NETHOSTCONNECTIONSUBTYPEVALUES_EVDO_B = TMP_NETHOSTCONNECTIONSUBTYPEVALUES_EVDO_B;
  exports.NETHOSTCONNECTIONSUBTYPEVALUES_LTE = TMP_NETHOSTCONNECTIONSUBTYPEVALUES_LTE;
  exports.NETHOSTCONNECTIONSUBTYPEVALUES_EHRPD = TMP_NETHOSTCONNECTIONSUBTYPEVALUES_EHRPD;
  exports.NETHOSTCONNECTIONSUBTYPEVALUES_HSPAP = TMP_NETHOSTCONNECTIONSUBTYPEVALUES_HSPAP;
  exports.NETHOSTCONNECTIONSUBTYPEVALUES_GSM = TMP_NETHOSTCONNECTIONSUBTYPEVALUES_GSM;
  exports.NETHOSTCONNECTIONSUBTYPEVALUES_TD_SCDMA = TMP_NETHOSTCONNECTIONSUBTYPEVALUES_TD_SCDMA;
  exports.NETHOSTCONNECTIONSUBTYPEVALUES_IWLAN = TMP_NETHOSTCONNECTIONSUBTYPEVALUES_IWLAN;
  exports.NETHOSTCONNECTIONSUBTYPEVALUES_NR = TMP_NETHOSTCONNECTIONSUBTYPEVALUES_NR;
  exports.NETHOSTCONNECTIONSUBTYPEVALUES_NRNSA = TMP_NETHOSTCONNECTIONSUBTYPEVALUES_NRNSA;
  exports.NETHOSTCONNECTIONSUBTYPEVALUES_LTE_CA = TMP_NETHOSTCONNECTIONSUBTYPEVALUES_LTE_CA;
  exports.NetHostConnectionSubtypeValues = /* @__PURE__ */ (0, utils_1.createConstMap)([
    TMP_NETHOSTCONNECTIONSUBTYPEVALUES_GPRS,
    TMP_NETHOSTCONNECTIONSUBTYPEVALUES_EDGE,
    TMP_NETHOSTCONNECTIONSUBTYPEVALUES_UMTS,
    TMP_NETHOSTCONNECTIONSUBTYPEVALUES_CDMA,
    TMP_NETHOSTCONNECTIONSUBTYPEVALUES_EVDO_0,
    TMP_NETHOSTCONNECTIONSUBTYPEVALUES_EVDO_A,
    TMP_NETHOSTCONNECTIONSUBTYPEVALUES_CDMA2000_1XRTT,
    TMP_NETHOSTCONNECTIONSUBTYPEVALUES_HSDPA,
    TMP_NETHOSTCONNECTIONSUBTYPEVALUES_HSUPA,
    TMP_NETHOSTCONNECTIONSUBTYPEVALUES_HSPA,
    TMP_NETHOSTCONNECTIONSUBTYPEVALUES_IDEN,
    TMP_NETHOSTCONNECTIONSUBTYPEVALUES_EVDO_B,
    TMP_NETHOSTCONNECTIONSUBTYPEVALUES_LTE,
    TMP_NETHOSTCONNECTIONSUBTYPEVALUES_EHRPD,
    TMP_NETHOSTCONNECTIONSUBTYPEVALUES_HSPAP,
    TMP_NETHOSTCONNECTIONSUBTYPEVALUES_GSM,
    TMP_NETHOSTCONNECTIONSUBTYPEVALUES_TD_SCDMA,
    TMP_NETHOSTCONNECTIONSUBTYPEVALUES_IWLAN,
    TMP_NETHOSTCONNECTIONSUBTYPEVALUES_NR,
    TMP_NETHOSTCONNECTIONSUBTYPEVALUES_NRNSA,
    TMP_NETHOSTCONNECTIONSUBTYPEVALUES_LTE_CA
  ]);
  var TMP_HTTPFLAVORVALUES_HTTP_1_0 = "1.0";
  var TMP_HTTPFLAVORVALUES_HTTP_1_1 = "1.1";
  var TMP_HTTPFLAVORVALUES_HTTP_2_0 = "2.0";
  var TMP_HTTPFLAVORVALUES_SPDY = "SPDY";
  var TMP_HTTPFLAVORVALUES_QUIC = "QUIC";
  exports.HTTPFLAVORVALUES_HTTP_1_0 = TMP_HTTPFLAVORVALUES_HTTP_1_0;
  exports.HTTPFLAVORVALUES_HTTP_1_1 = TMP_HTTPFLAVORVALUES_HTTP_1_1;
  exports.HTTPFLAVORVALUES_HTTP_2_0 = TMP_HTTPFLAVORVALUES_HTTP_2_0;
  exports.HTTPFLAVORVALUES_SPDY = TMP_HTTPFLAVORVALUES_SPDY;
  exports.HTTPFLAVORVALUES_QUIC = TMP_HTTPFLAVORVALUES_QUIC;
  exports.HttpFlavorValues = {
    HTTP_1_0: TMP_HTTPFLAVORVALUES_HTTP_1_0,
    HTTP_1_1: TMP_HTTPFLAVORVALUES_HTTP_1_1,
    HTTP_2_0: TMP_HTTPFLAVORVALUES_HTTP_2_0,
    SPDY: TMP_HTTPFLAVORVALUES_SPDY,
    QUIC: TMP_HTTPFLAVORVALUES_QUIC
  };
  var TMP_MESSAGINGDESTINATIONKINDVALUES_QUEUE = "queue";
  var TMP_MESSAGINGDESTINATIONKINDVALUES_TOPIC = "topic";
  exports.MESSAGINGDESTINATIONKINDVALUES_QUEUE = TMP_MESSAGINGDESTINATIONKINDVALUES_QUEUE;
  exports.MESSAGINGDESTINATIONKINDVALUES_TOPIC = TMP_MESSAGINGDESTINATIONKINDVALUES_TOPIC;
  exports.MessagingDestinationKindValues = /* @__PURE__ */ (0, utils_1.createConstMap)([
    TMP_MESSAGINGDESTINATIONKINDVALUES_QUEUE,
    TMP_MESSAGINGDESTINATIONKINDVALUES_TOPIC
  ]);
  var TMP_MESSAGINGOPERATIONVALUES_RECEIVE = "receive";
  var TMP_MESSAGINGOPERATIONVALUES_PROCESS = "process";
  exports.MESSAGINGOPERATIONVALUES_RECEIVE = TMP_MESSAGINGOPERATIONVALUES_RECEIVE;
  exports.MESSAGINGOPERATIONVALUES_PROCESS = TMP_MESSAGINGOPERATIONVALUES_PROCESS;
  exports.MessagingOperationValues = /* @__PURE__ */ (0, utils_1.createConstMap)([
    TMP_MESSAGINGOPERATIONVALUES_RECEIVE,
    TMP_MESSAGINGOPERATIONVALUES_PROCESS
  ]);
  var TMP_RPCGRPCSTATUSCODEVALUES_OK = 0;
  var TMP_RPCGRPCSTATUSCODEVALUES_CANCELLED = 1;
  var TMP_RPCGRPCSTATUSCODEVALUES_UNKNOWN = 2;
  var TMP_RPCGRPCSTATUSCODEVALUES_INVALID_ARGUMENT = 3;
  var TMP_RPCGRPCSTATUSCODEVALUES_DEADLINE_EXCEEDED = 4;
  var TMP_RPCGRPCSTATUSCODEVALUES_NOT_FOUND = 5;
  var TMP_RPCGRPCSTATUSCODEVALUES_ALREADY_EXISTS = 6;
  var TMP_RPCGRPCSTATUSCODEVALUES_PERMISSION_DENIED = 7;
  var TMP_RPCGRPCSTATUSCODEVALUES_RESOURCE_EXHAUSTED = 8;
  var TMP_RPCGRPCSTATUSCODEVALUES_FAILED_PRECONDITION = 9;
  var TMP_RPCGRPCSTATUSCODEVALUES_ABORTED = 10;
  var TMP_RPCGRPCSTATUSCODEVALUES_OUT_OF_RANGE = 11;
  var TMP_RPCGRPCSTATUSCODEVALUES_UNIMPLEMENTED = 12;
  var TMP_RPCGRPCSTATUSCODEVALUES_INTERNAL = 13;
  var TMP_RPCGRPCSTATUSCODEVALUES_UNAVAILABLE = 14;
  var TMP_RPCGRPCSTATUSCODEVALUES_DATA_LOSS = 15;
  var TMP_RPCGRPCSTATUSCODEVALUES_UNAUTHENTICATED = 16;
  exports.RPCGRPCSTATUSCODEVALUES_OK = TMP_RPCGRPCSTATUSCODEVALUES_OK;
  exports.RPCGRPCSTATUSCODEVALUES_CANCELLED = TMP_RPCGRPCSTATUSCODEVALUES_CANCELLED;
  exports.RPCGRPCSTATUSCODEVALUES_UNKNOWN = TMP_RPCGRPCSTATUSCODEVALUES_UNKNOWN;
  exports.RPCGRPCSTATUSCODEVALUES_INVALID_ARGUMENT = TMP_RPCGRPCSTATUSCODEVALUES_INVALID_ARGUMENT;
  exports.RPCGRPCSTATUSCODEVALUES_DEADLINE_EXCEEDED = TMP_RPCGRPCSTATUSCODEVALUES_DEADLINE_EXCEEDED;
  exports.RPCGRPCSTATUSCODEVALUES_NOT_FOUND = TMP_RPCGRPCSTATUSCODEVALUES_NOT_FOUND;
  exports.RPCGRPCSTATUSCODEVALUES_ALREADY_EXISTS = TMP_RPCGRPCSTATUSCODEVALUES_ALREADY_EXISTS;
  exports.RPCGRPCSTATUSCODEVALUES_PERMISSION_DENIED = TMP_RPCGRPCSTATUSCODEVALUES_PERMISSION_DENIED;
  exports.RPCGRPCSTATUSCODEVALUES_RESOURCE_EXHAUSTED = TMP_RPCGRPCSTATUSCODEVALUES_RESOURCE_EXHAUSTED;
  exports.RPCGRPCSTATUSCODEVALUES_FAILED_PRECONDITION = TMP_RPCGRPCSTATUSCODEVALUES_FAILED_PRECONDITION;
  exports.RPCGRPCSTATUSCODEVALUES_ABORTED = TMP_RPCGRPCSTATUSCODEVALUES_ABORTED;
  exports.RPCGRPCSTATUSCODEVALUES_OUT_OF_RANGE = TMP_RPCGRPCSTATUSCODEVALUES_OUT_OF_RANGE;
  exports.RPCGRPCSTATUSCODEVALUES_UNIMPLEMENTED = TMP_RPCGRPCSTATUSCODEVALUES_UNIMPLEMENTED;
  exports.RPCGRPCSTATUSCODEVALUES_INTERNAL = TMP_RPCGRPCSTATUSCODEVALUES_INTERNAL;
  exports.RPCGRPCSTATUSCODEVALUES_UNAVAILABLE = TMP_RPCGRPCSTATUSCODEVALUES_UNAVAILABLE;
  exports.RPCGRPCSTATUSCODEVALUES_DATA_LOSS = TMP_RPCGRPCSTATUSCODEVALUES_DATA_LOSS;
  exports.RPCGRPCSTATUSCODEVALUES_UNAUTHENTICATED = TMP_RPCGRPCSTATUSCODEVALUES_UNAUTHENTICATED;
  exports.RpcGrpcStatusCodeValues = {
    OK: TMP_RPCGRPCSTATUSCODEVALUES_OK,
    CANCELLED: TMP_RPCGRPCSTATUSCODEVALUES_CANCELLED,
    UNKNOWN: TMP_RPCGRPCSTATUSCODEVALUES_UNKNOWN,
    INVALID_ARGUMENT: TMP_RPCGRPCSTATUSCODEVALUES_INVALID_ARGUMENT,
    DEADLINE_EXCEEDED: TMP_RPCGRPCSTATUSCODEVALUES_DEADLINE_EXCEEDED,
    NOT_FOUND: TMP_RPCGRPCSTATUSCODEVALUES_NOT_FOUND,
    ALREADY_EXISTS: TMP_RPCGRPCSTATUSCODEVALUES_ALREADY_EXISTS,
    PERMISSION_DENIED: TMP_RPCGRPCSTATUSCODEVALUES_PERMISSION_DENIED,
    RESOURCE_EXHAUSTED: TMP_RPCGRPCSTATUSCODEVALUES_RESOURCE_EXHAUSTED,
    FAILED_PRECONDITION: TMP_RPCGRPCSTATUSCODEVALUES_FAILED_PRECONDITION,
    ABORTED: TMP_RPCGRPCSTATUSCODEVALUES_ABORTED,
    OUT_OF_RANGE: TMP_RPCGRPCSTATUSCODEVALUES_OUT_OF_RANGE,
    UNIMPLEMENTED: TMP_RPCGRPCSTATUSCODEVALUES_UNIMPLEMENTED,
    INTERNAL: TMP_RPCGRPCSTATUSCODEVALUES_INTERNAL,
    UNAVAILABLE: TMP_RPCGRPCSTATUSCODEVALUES_UNAVAILABLE,
    DATA_LOSS: TMP_RPCGRPCSTATUSCODEVALUES_DATA_LOSS,
    UNAUTHENTICATED: TMP_RPCGRPCSTATUSCODEVALUES_UNAUTHENTICATED
  };
  var TMP_MESSAGETYPEVALUES_SENT = "SENT";
  var TMP_MESSAGETYPEVALUES_RECEIVED = "RECEIVED";
  exports.MESSAGETYPEVALUES_SENT = TMP_MESSAGETYPEVALUES_SENT;
  exports.MESSAGETYPEVALUES_RECEIVED = TMP_MESSAGETYPEVALUES_RECEIVED;
  exports.MessageTypeValues = /* @__PURE__ */ (0, utils_1.createConstMap)([
    TMP_MESSAGETYPEVALUES_SENT,
    TMP_MESSAGETYPEVALUES_RECEIVED
  ]);
});

// node_modules/@opentelemetry/semantic-conventions/build/src/trace/index.js
var require_trace5 = __commonJS((exports) => {
  var __createBinding = exports && exports.__createBinding || (Object.create ? function(o, m, k, k2) {
    if (k2 === undefined)
      k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() {
        return m[k];
      } };
    }
    Object.defineProperty(o, k2, desc);
  } : function(o, m, k, k2) {
    if (k2 === undefined)
      k2 = k;
    o[k2] = m[k];
  });
  var __exportStar = exports && exports.__exportStar || function(m, exports2) {
    for (var p in m)
      if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p))
        __createBinding(exports2, m, p);
  };
  Object.defineProperty(exports, "__esModule", { value: true });
  __exportStar(require_SemanticAttributes4(), exports);
});

// node_modules/@opentelemetry/semantic-conventions/build/src/resource/SemanticResourceAttributes.js
var require_SemanticResourceAttributes4 = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.SEMRESATTRS_K8S_STATEFULSET_NAME = exports.SEMRESATTRS_K8S_STATEFULSET_UID = exports.SEMRESATTRS_K8S_DEPLOYMENT_NAME = exports.SEMRESATTRS_K8S_DEPLOYMENT_UID = exports.SEMRESATTRS_K8S_REPLICASET_NAME = exports.SEMRESATTRS_K8S_REPLICASET_UID = exports.SEMRESATTRS_K8S_CONTAINER_NAME = exports.SEMRESATTRS_K8S_POD_NAME = exports.SEMRESATTRS_K8S_POD_UID = exports.SEMRESATTRS_K8S_NAMESPACE_NAME = exports.SEMRESATTRS_K8S_NODE_UID = exports.SEMRESATTRS_K8S_NODE_NAME = exports.SEMRESATTRS_K8S_CLUSTER_NAME = exports.SEMRESATTRS_HOST_IMAGE_VERSION = exports.SEMRESATTRS_HOST_IMAGE_ID = exports.SEMRESATTRS_HOST_IMAGE_NAME = exports.SEMRESATTRS_HOST_ARCH = exports.SEMRESATTRS_HOST_TYPE = exports.SEMRESATTRS_HOST_NAME = exports.SEMRESATTRS_HOST_ID = exports.SEMRESATTRS_FAAS_MAX_MEMORY = exports.SEMRESATTRS_FAAS_INSTANCE = exports.SEMRESATTRS_FAAS_VERSION = exports.SEMRESATTRS_FAAS_ID = exports.SEMRESATTRS_FAAS_NAME = exports.SEMRESATTRS_DEVICE_MODEL_NAME = exports.SEMRESATTRS_DEVICE_MODEL_IDENTIFIER = exports.SEMRESATTRS_DEVICE_ID = exports.SEMRESATTRS_DEPLOYMENT_ENVIRONMENT = exports.SEMRESATTRS_CONTAINER_IMAGE_TAG = exports.SEMRESATTRS_CONTAINER_IMAGE_NAME = exports.SEMRESATTRS_CONTAINER_RUNTIME = exports.SEMRESATTRS_CONTAINER_ID = exports.SEMRESATTRS_CONTAINER_NAME = exports.SEMRESATTRS_AWS_LOG_STREAM_ARNS = exports.SEMRESATTRS_AWS_LOG_STREAM_NAMES = exports.SEMRESATTRS_AWS_LOG_GROUP_ARNS = exports.SEMRESATTRS_AWS_LOG_GROUP_NAMES = exports.SEMRESATTRS_AWS_EKS_CLUSTER_ARN = exports.SEMRESATTRS_AWS_ECS_TASK_REVISION = exports.SEMRESATTRS_AWS_ECS_TASK_FAMILY = exports.SEMRESATTRS_AWS_ECS_TASK_ARN = exports.SEMRESATTRS_AWS_ECS_LAUNCHTYPE = exports.SEMRESATTRS_AWS_ECS_CLUSTER_ARN = exports.SEMRESATTRS_AWS_ECS_CONTAINER_ARN = exports.SEMRESATTRS_CLOUD_PLATFORM = exports.SEMRESATTRS_CLOUD_AVAILABILITY_ZONE = exports.SEMRESATTRS_CLOUD_REGION = exports.SEMRESATTRS_CLOUD_ACCOUNT_ID = exports.SEMRESATTRS_CLOUD_PROVIDER = undefined;
  exports.CLOUDPLATFORMVALUES_GCP_COMPUTE_ENGINE = exports.CLOUDPLATFORMVALUES_AZURE_APP_SERVICE = exports.CLOUDPLATFORMVALUES_AZURE_FUNCTIONS = exports.CLOUDPLATFORMVALUES_AZURE_AKS = exports.CLOUDPLATFORMVALUES_AZURE_CONTAINER_INSTANCES = exports.CLOUDPLATFORMVALUES_AZURE_VM = exports.CLOUDPLATFORMVALUES_AWS_ELASTIC_BEANSTALK = exports.CLOUDPLATFORMVALUES_AWS_LAMBDA = exports.CLOUDPLATFORMVALUES_AWS_EKS = exports.CLOUDPLATFORMVALUES_AWS_ECS = exports.CLOUDPLATFORMVALUES_AWS_EC2 = exports.CLOUDPLATFORMVALUES_ALIBABA_CLOUD_FC = exports.CLOUDPLATFORMVALUES_ALIBABA_CLOUD_ECS = exports.CloudProviderValues = exports.CLOUDPROVIDERVALUES_GCP = exports.CLOUDPROVIDERVALUES_AZURE = exports.CLOUDPROVIDERVALUES_AWS = exports.CLOUDPROVIDERVALUES_ALIBABA_CLOUD = exports.SemanticResourceAttributes = exports.SEMRESATTRS_WEBENGINE_DESCRIPTION = exports.SEMRESATTRS_WEBENGINE_VERSION = exports.SEMRESATTRS_WEBENGINE_NAME = exports.SEMRESATTRS_TELEMETRY_AUTO_VERSION = exports.SEMRESATTRS_TELEMETRY_SDK_VERSION = exports.SEMRESATTRS_TELEMETRY_SDK_LANGUAGE = exports.SEMRESATTRS_TELEMETRY_SDK_NAME = exports.SEMRESATTRS_SERVICE_VERSION = exports.SEMRESATTRS_SERVICE_INSTANCE_ID = exports.SEMRESATTRS_SERVICE_NAMESPACE = exports.SEMRESATTRS_SERVICE_NAME = exports.SEMRESATTRS_PROCESS_RUNTIME_DESCRIPTION = exports.SEMRESATTRS_PROCESS_RUNTIME_VERSION = exports.SEMRESATTRS_PROCESS_RUNTIME_NAME = exports.SEMRESATTRS_PROCESS_OWNER = exports.SEMRESATTRS_PROCESS_COMMAND_ARGS = exports.SEMRESATTRS_PROCESS_COMMAND_LINE = exports.SEMRESATTRS_PROCESS_COMMAND = exports.SEMRESATTRS_PROCESS_EXECUTABLE_PATH = exports.SEMRESATTRS_PROCESS_EXECUTABLE_NAME = exports.SEMRESATTRS_PROCESS_PID = exports.SEMRESATTRS_OS_VERSION = exports.SEMRESATTRS_OS_NAME = exports.SEMRESATTRS_OS_DESCRIPTION = exports.SEMRESATTRS_OS_TYPE = exports.SEMRESATTRS_K8S_CRONJOB_NAME = exports.SEMRESATTRS_K8S_CRONJOB_UID = exports.SEMRESATTRS_K8S_JOB_NAME = exports.SEMRESATTRS_K8S_JOB_UID = exports.SEMRESATTRS_K8S_DAEMONSET_NAME = exports.SEMRESATTRS_K8S_DAEMONSET_UID = undefined;
  exports.TelemetrySdkLanguageValues = exports.TELEMETRYSDKLANGUAGEVALUES_WEBJS = exports.TELEMETRYSDKLANGUAGEVALUES_RUBY = exports.TELEMETRYSDKLANGUAGEVALUES_PYTHON = exports.TELEMETRYSDKLANGUAGEVALUES_PHP = exports.TELEMETRYSDKLANGUAGEVALUES_NODEJS = exports.TELEMETRYSDKLANGUAGEVALUES_JAVA = exports.TELEMETRYSDKLANGUAGEVALUES_GO = exports.TELEMETRYSDKLANGUAGEVALUES_ERLANG = exports.TELEMETRYSDKLANGUAGEVALUES_DOTNET = exports.TELEMETRYSDKLANGUAGEVALUES_CPP = exports.OsTypeValues = exports.OSTYPEVALUES_Z_OS = exports.OSTYPEVALUES_SOLARIS = exports.OSTYPEVALUES_AIX = exports.OSTYPEVALUES_HPUX = exports.OSTYPEVALUES_DRAGONFLYBSD = exports.OSTYPEVALUES_OPENBSD = exports.OSTYPEVALUES_NETBSD = exports.OSTYPEVALUES_FREEBSD = exports.OSTYPEVALUES_DARWIN = exports.OSTYPEVALUES_LINUX = exports.OSTYPEVALUES_WINDOWS = exports.HostArchValues = exports.HOSTARCHVALUES_X86 = exports.HOSTARCHVALUES_PPC64 = exports.HOSTARCHVALUES_PPC32 = exports.HOSTARCHVALUES_IA64 = exports.HOSTARCHVALUES_ARM64 = exports.HOSTARCHVALUES_ARM32 = exports.HOSTARCHVALUES_AMD64 = exports.AwsEcsLaunchtypeValues = exports.AWSECSLAUNCHTYPEVALUES_FARGATE = exports.AWSECSLAUNCHTYPEVALUES_EC2 = exports.CloudPlatformValues = exports.CLOUDPLATFORMVALUES_GCP_APP_ENGINE = exports.CLOUDPLATFORMVALUES_GCP_CLOUD_FUNCTIONS = exports.CLOUDPLATFORMVALUES_GCP_KUBERNETES_ENGINE = exports.CLOUDPLATFORMVALUES_GCP_CLOUD_RUN = undefined;
  var utils_1 = require_utils7();
  var TMP_CLOUD_PROVIDER = "cloud.provider";
  var TMP_CLOUD_ACCOUNT_ID = "cloud.account.id";
  var TMP_CLOUD_REGION = "cloud.region";
  var TMP_CLOUD_AVAILABILITY_ZONE = "cloud.availability_zone";
  var TMP_CLOUD_PLATFORM = "cloud.platform";
  var TMP_AWS_ECS_CONTAINER_ARN = "aws.ecs.container.arn";
  var TMP_AWS_ECS_CLUSTER_ARN = "aws.ecs.cluster.arn";
  var TMP_AWS_ECS_LAUNCHTYPE = "aws.ecs.launchtype";
  var TMP_AWS_ECS_TASK_ARN = "aws.ecs.task.arn";
  var TMP_AWS_ECS_TASK_FAMILY = "aws.ecs.task.family";
  var TMP_AWS_ECS_TASK_REVISION = "aws.ecs.task.revision";
  var TMP_AWS_EKS_CLUSTER_ARN = "aws.eks.cluster.arn";
  var TMP_AWS_LOG_GROUP_NAMES = "aws.log.group.names";
  var TMP_AWS_LOG_GROUP_ARNS = "aws.log.group.arns";
  var TMP_AWS_LOG_STREAM_NAMES = "aws.log.stream.names";
  var TMP_AWS_LOG_STREAM_ARNS = "aws.log.stream.arns";
  var TMP_CONTAINER_NAME = "container.name";
  var TMP_CONTAINER_ID = "container.id";
  var TMP_CONTAINER_RUNTIME = "container.runtime";
  var TMP_CONTAINER_IMAGE_NAME = "container.image.name";
  var TMP_CONTAINER_IMAGE_TAG = "container.image.tag";
  var TMP_DEPLOYMENT_ENVIRONMENT = "deployment.environment";
  var TMP_DEVICE_ID = "device.id";
  var TMP_DEVICE_MODEL_IDENTIFIER = "device.model.identifier";
  var TMP_DEVICE_MODEL_NAME = "device.model.name";
  var TMP_FAAS_NAME = "faas.name";
  var TMP_FAAS_ID = "faas.id";
  var TMP_FAAS_VERSION = "faas.version";
  var TMP_FAAS_INSTANCE = "faas.instance";
  var TMP_FAAS_MAX_MEMORY = "faas.max_memory";
  var TMP_HOST_ID = "host.id";
  var TMP_HOST_NAME = "host.name";
  var TMP_HOST_TYPE = "host.type";
  var TMP_HOST_ARCH = "host.arch";
  var TMP_HOST_IMAGE_NAME = "host.image.name";
  var TMP_HOST_IMAGE_ID = "host.image.id";
  var TMP_HOST_IMAGE_VERSION = "host.image.version";
  var TMP_K8S_CLUSTER_NAME = "k8s.cluster.name";
  var TMP_K8S_NODE_NAME = "k8s.node.name";
  var TMP_K8S_NODE_UID = "k8s.node.uid";
  var TMP_K8S_NAMESPACE_NAME = "k8s.namespace.name";
  var TMP_K8S_POD_UID = "k8s.pod.uid";
  var TMP_K8S_POD_NAME = "k8s.pod.name";
  var TMP_K8S_CONTAINER_NAME = "k8s.container.name";
  var TMP_K8S_REPLICASET_UID = "k8s.replicaset.uid";
  var TMP_K8S_REPLICASET_NAME = "k8s.replicaset.name";
  var TMP_K8S_DEPLOYMENT_UID = "k8s.deployment.uid";
  var TMP_K8S_DEPLOYMENT_NAME = "k8s.deployment.name";
  var TMP_K8S_STATEFULSET_UID = "k8s.statefulset.uid";
  var TMP_K8S_STATEFULSET_NAME = "k8s.statefulset.name";
  var TMP_K8S_DAEMONSET_UID = "k8s.daemonset.uid";
  var TMP_K8S_DAEMONSET_NAME = "k8s.daemonset.name";
  var TMP_K8S_JOB_UID = "k8s.job.uid";
  var TMP_K8S_JOB_NAME = "k8s.job.name";
  var TMP_K8S_CRONJOB_UID = "k8s.cronjob.uid";
  var TMP_K8S_CRONJOB_NAME = "k8s.cronjob.name";
  var TMP_OS_TYPE = "os.type";
  var TMP_OS_DESCRIPTION = "os.description";
  var TMP_OS_NAME = "os.name";
  var TMP_OS_VERSION = "os.version";
  var TMP_PROCESS_PID = "process.pid";
  var TMP_PROCESS_EXECUTABLE_NAME = "process.executable.name";
  var TMP_PROCESS_EXECUTABLE_PATH = "process.executable.path";
  var TMP_PROCESS_COMMAND = "process.command";
  var TMP_PROCESS_COMMAND_LINE = "process.command_line";
  var TMP_PROCESS_COMMAND_ARGS = "process.command_args";
  var TMP_PROCESS_OWNER = "process.owner";
  var TMP_PROCESS_RUNTIME_NAME = "process.runtime.name";
  var TMP_PROCESS_RUNTIME_VERSION = "process.runtime.version";
  var TMP_PROCESS_RUNTIME_DESCRIPTION = "process.runtime.description";
  var TMP_SERVICE_NAME = "service.name";
  var TMP_SERVICE_NAMESPACE = "service.namespace";
  var TMP_SERVICE_INSTANCE_ID = "service.instance.id";
  var TMP_SERVICE_VERSION = "service.version";
  var TMP_TELEMETRY_SDK_NAME = "telemetry.sdk.name";
  var TMP_TELEMETRY_SDK_LANGUAGE = "telemetry.sdk.language";
  var TMP_TELEMETRY_SDK_VERSION = "telemetry.sdk.version";
  var TMP_TELEMETRY_AUTO_VERSION = "telemetry.auto.version";
  var TMP_WEBENGINE_NAME = "webengine.name";
  var TMP_WEBENGINE_VERSION = "webengine.version";
  var TMP_WEBENGINE_DESCRIPTION = "webengine.description";
  exports.SEMRESATTRS_CLOUD_PROVIDER = TMP_CLOUD_PROVIDER;
  exports.SEMRESATTRS_CLOUD_ACCOUNT_ID = TMP_CLOUD_ACCOUNT_ID;
  exports.SEMRESATTRS_CLOUD_REGION = TMP_CLOUD_REGION;
  exports.SEMRESATTRS_CLOUD_AVAILABILITY_ZONE = TMP_CLOUD_AVAILABILITY_ZONE;
  exports.SEMRESATTRS_CLOUD_PLATFORM = TMP_CLOUD_PLATFORM;
  exports.SEMRESATTRS_AWS_ECS_CONTAINER_ARN = TMP_AWS_ECS_CONTAINER_ARN;
  exports.SEMRESATTRS_AWS_ECS_CLUSTER_ARN = TMP_AWS_ECS_CLUSTER_ARN;
  exports.SEMRESATTRS_AWS_ECS_LAUNCHTYPE = TMP_AWS_ECS_LAUNCHTYPE;
  exports.SEMRESATTRS_AWS_ECS_TASK_ARN = TMP_AWS_ECS_TASK_ARN;
  exports.SEMRESATTRS_AWS_ECS_TASK_FAMILY = TMP_AWS_ECS_TASK_FAMILY;
  exports.SEMRESATTRS_AWS_ECS_TASK_REVISION = TMP_AWS_ECS_TASK_REVISION;
  exports.SEMRESATTRS_AWS_EKS_CLUSTER_ARN = TMP_AWS_EKS_CLUSTER_ARN;
  exports.SEMRESATTRS_AWS_LOG_GROUP_NAMES = TMP_AWS_LOG_GROUP_NAMES;
  exports.SEMRESATTRS_AWS_LOG_GROUP_ARNS = TMP_AWS_LOG_GROUP_ARNS;
  exports.SEMRESATTRS_AWS_LOG_STREAM_NAMES = TMP_AWS_LOG_STREAM_NAMES;
  exports.SEMRESATTRS_AWS_LOG_STREAM_ARNS = TMP_AWS_LOG_STREAM_ARNS;
  exports.SEMRESATTRS_CONTAINER_NAME = TMP_CONTAINER_NAME;
  exports.SEMRESATTRS_CONTAINER_ID = TMP_CONTAINER_ID;
  exports.SEMRESATTRS_CONTAINER_RUNTIME = TMP_CONTAINER_RUNTIME;
  exports.SEMRESATTRS_CONTAINER_IMAGE_NAME = TMP_CONTAINER_IMAGE_NAME;
  exports.SEMRESATTRS_CONTAINER_IMAGE_TAG = TMP_CONTAINER_IMAGE_TAG;
  exports.SEMRESATTRS_DEPLOYMENT_ENVIRONMENT = TMP_DEPLOYMENT_ENVIRONMENT;
  exports.SEMRESATTRS_DEVICE_ID = TMP_DEVICE_ID;
  exports.SEMRESATTRS_DEVICE_MODEL_IDENTIFIER = TMP_DEVICE_MODEL_IDENTIFIER;
  exports.SEMRESATTRS_DEVICE_MODEL_NAME = TMP_DEVICE_MODEL_NAME;
  exports.SEMRESATTRS_FAAS_NAME = TMP_FAAS_NAME;
  exports.SEMRESATTRS_FAAS_ID = TMP_FAAS_ID;
  exports.SEMRESATTRS_FAAS_VERSION = TMP_FAAS_VERSION;
  exports.SEMRESATTRS_FAAS_INSTANCE = TMP_FAAS_INSTANCE;
  exports.SEMRESATTRS_FAAS_MAX_MEMORY = TMP_FAAS_MAX_MEMORY;
  exports.SEMRESATTRS_HOST_ID = TMP_HOST_ID;
  exports.SEMRESATTRS_HOST_NAME = TMP_HOST_NAME;
  exports.SEMRESATTRS_HOST_TYPE = TMP_HOST_TYPE;
  exports.SEMRESATTRS_HOST_ARCH = TMP_HOST_ARCH;
  exports.SEMRESATTRS_HOST_IMAGE_NAME = TMP_HOST_IMAGE_NAME;
  exports.SEMRESATTRS_HOST_IMAGE_ID = TMP_HOST_IMAGE_ID;
  exports.SEMRESATTRS_HOST_IMAGE_VERSION = TMP_HOST_IMAGE_VERSION;
  exports.SEMRESATTRS_K8S_CLUSTER_NAME = TMP_K8S_CLUSTER_NAME;
  exports.SEMRESATTRS_K8S_NODE_NAME = TMP_K8S_NODE_NAME;
  exports.SEMRESATTRS_K8S_NODE_UID = TMP_K8S_NODE_UID;
  exports.SEMRESATTRS_K8S_NAMESPACE_NAME = TMP_K8S_NAMESPACE_NAME;
  exports.SEMRESATTRS_K8S_POD_UID = TMP_K8S_POD_UID;
  exports.SEMRESATTRS_K8S_POD_NAME = TMP_K8S_POD_NAME;
  exports.SEMRESATTRS_K8S_CONTAINER_NAME = TMP_K8S_CONTAINER_NAME;
  exports.SEMRESATTRS_K8S_REPLICASET_UID = TMP_K8S_REPLICASET_UID;
  exports.SEMRESATTRS_K8S_REPLICASET_NAME = TMP_K8S_REPLICASET_NAME;
  exports.SEMRESATTRS_K8S_DEPLOYMENT_UID = TMP_K8S_DEPLOYMENT_UID;
  exports.SEMRESATTRS_K8S_DEPLOYMENT_NAME = TMP_K8S_DEPLOYMENT_NAME;
  exports.SEMRESATTRS_K8S_STATEFULSET_UID = TMP_K8S_STATEFULSET_UID;
  exports.SEMRESATTRS_K8S_STATEFULSET_NAME = TMP_K8S_STATEFULSET_NAME;
  exports.SEMRESATTRS_K8S_DAEMONSET_UID = TMP_K8S_DAEMONSET_UID;
  exports.SEMRESATTRS_K8S_DAEMONSET_NAME = TMP_K8S_DAEMONSET_NAME;
  exports.SEMRESATTRS_K8S_JOB_UID = TMP_K8S_JOB_UID;
  exports.SEMRESATTRS_K8S_JOB_NAME = TMP_K8S_JOB_NAME;
  exports.SEMRESATTRS_K8S_CRONJOB_UID = TMP_K8S_CRONJOB_UID;
  exports.SEMRESATTRS_K8S_CRONJOB_NAME = TMP_K8S_CRONJOB_NAME;
  exports.SEMRESATTRS_OS_TYPE = TMP_OS_TYPE;
  exports.SEMRESATTRS_OS_DESCRIPTION = TMP_OS_DESCRIPTION;
  exports.SEMRESATTRS_OS_NAME = TMP_OS_NAME;
  exports.SEMRESATTRS_OS_VERSION = TMP_OS_VERSION;
  exports.SEMRESATTRS_PROCESS_PID = TMP_PROCESS_PID;
  exports.SEMRESATTRS_PROCESS_EXECUTABLE_NAME = TMP_PROCESS_EXECUTABLE_NAME;
  exports.SEMRESATTRS_PROCESS_EXECUTABLE_PATH = TMP_PROCESS_EXECUTABLE_PATH;
  exports.SEMRESATTRS_PROCESS_COMMAND = TMP_PROCESS_COMMAND;
  exports.SEMRESATTRS_PROCESS_COMMAND_LINE = TMP_PROCESS_COMMAND_LINE;
  exports.SEMRESATTRS_PROCESS_COMMAND_ARGS = TMP_PROCESS_COMMAND_ARGS;
  exports.SEMRESATTRS_PROCESS_OWNER = TMP_PROCESS_OWNER;
  exports.SEMRESATTRS_PROCESS_RUNTIME_NAME = TMP_PROCESS_RUNTIME_NAME;
  exports.SEMRESATTRS_PROCESS_RUNTIME_VERSION = TMP_PROCESS_RUNTIME_VERSION;
  exports.SEMRESATTRS_PROCESS_RUNTIME_DESCRIPTION = TMP_PROCESS_RUNTIME_DESCRIPTION;
  exports.SEMRESATTRS_SERVICE_NAME = TMP_SERVICE_NAME;
  exports.SEMRESATTRS_SERVICE_NAMESPACE = TMP_SERVICE_NAMESPACE;
  exports.SEMRESATTRS_SERVICE_INSTANCE_ID = TMP_SERVICE_INSTANCE_ID;
  exports.SEMRESATTRS_SERVICE_VERSION = TMP_SERVICE_VERSION;
  exports.SEMRESATTRS_TELEMETRY_SDK_NAME = TMP_TELEMETRY_SDK_NAME;
  exports.SEMRESATTRS_TELEMETRY_SDK_LANGUAGE = TMP_TELEMETRY_SDK_LANGUAGE;
  exports.SEMRESATTRS_TELEMETRY_SDK_VERSION = TMP_TELEMETRY_SDK_VERSION;
  exports.SEMRESATTRS_TELEMETRY_AUTO_VERSION = TMP_TELEMETRY_AUTO_VERSION;
  exports.SEMRESATTRS_WEBENGINE_NAME = TMP_WEBENGINE_NAME;
  exports.SEMRESATTRS_WEBENGINE_VERSION = TMP_WEBENGINE_VERSION;
  exports.SEMRESATTRS_WEBENGINE_DESCRIPTION = TMP_WEBENGINE_DESCRIPTION;
  exports.SemanticResourceAttributes = /* @__PURE__ */ (0, utils_1.createConstMap)([
    TMP_CLOUD_PROVIDER,
    TMP_CLOUD_ACCOUNT_ID,
    TMP_CLOUD_REGION,
    TMP_CLOUD_AVAILABILITY_ZONE,
    TMP_CLOUD_PLATFORM,
    TMP_AWS_ECS_CONTAINER_ARN,
    TMP_AWS_ECS_CLUSTER_ARN,
    TMP_AWS_ECS_LAUNCHTYPE,
    TMP_AWS_ECS_TASK_ARN,
    TMP_AWS_ECS_TASK_FAMILY,
    TMP_AWS_ECS_TASK_REVISION,
    TMP_AWS_EKS_CLUSTER_ARN,
    TMP_AWS_LOG_GROUP_NAMES,
    TMP_AWS_LOG_GROUP_ARNS,
    TMP_AWS_LOG_STREAM_NAMES,
    TMP_AWS_LOG_STREAM_ARNS,
    TMP_CONTAINER_NAME,
    TMP_CONTAINER_ID,
    TMP_CONTAINER_RUNTIME,
    TMP_CONTAINER_IMAGE_NAME,
    TMP_CONTAINER_IMAGE_TAG,
    TMP_DEPLOYMENT_ENVIRONMENT,
    TMP_DEVICE_ID,
    TMP_DEVICE_MODEL_IDENTIFIER,
    TMP_DEVICE_MODEL_NAME,
    TMP_FAAS_NAME,
    TMP_FAAS_ID,
    TMP_FAAS_VERSION,
    TMP_FAAS_INSTANCE,
    TMP_FAAS_MAX_MEMORY,
    TMP_HOST_ID,
    TMP_HOST_NAME,
    TMP_HOST_TYPE,
    TMP_HOST_ARCH,
    TMP_HOST_IMAGE_NAME,
    TMP_HOST_IMAGE_ID,
    TMP_HOST_IMAGE_VERSION,
    TMP_K8S_CLUSTER_NAME,
    TMP_K8S_NODE_NAME,
    TMP_K8S_NODE_UID,
    TMP_K8S_NAMESPACE_NAME,
    TMP_K8S_POD_UID,
    TMP_K8S_POD_NAME,
    TMP_K8S_CONTAINER_NAME,
    TMP_K8S_REPLICASET_UID,
    TMP_K8S_REPLICASET_NAME,
    TMP_K8S_DEPLOYMENT_UID,
    TMP_K8S_DEPLOYMENT_NAME,
    TMP_K8S_STATEFULSET_UID,
    TMP_K8S_STATEFULSET_NAME,
    TMP_K8S_DAEMONSET_UID,
    TMP_K8S_DAEMONSET_NAME,
    TMP_K8S_JOB_UID,
    TMP_K8S_JOB_NAME,
    TMP_K8S_CRONJOB_UID,
    TMP_K8S_CRONJOB_NAME,
    TMP_OS_TYPE,
    TMP_OS_DESCRIPTION,
    TMP_OS_NAME,
    TMP_OS_VERSION,
    TMP_PROCESS_PID,
    TMP_PROCESS_EXECUTABLE_NAME,
    TMP_PROCESS_EXECUTABLE_PATH,
    TMP_PROCESS_COMMAND,
    TMP_PROCESS_COMMAND_LINE,
    TMP_PROCESS_COMMAND_ARGS,
    TMP_PROCESS_OWNER,
    TMP_PROCESS_RUNTIME_NAME,
    TMP_PROCESS_RUNTIME_VERSION,
    TMP_PROCESS_RUNTIME_DESCRIPTION,
    TMP_SERVICE_NAME,
    TMP_SERVICE_NAMESPACE,
    TMP_SERVICE_INSTANCE_ID,
    TMP_SERVICE_VERSION,
    TMP_TELEMETRY_SDK_NAME,
    TMP_TELEMETRY_SDK_LANGUAGE,
    TMP_TELEMETRY_SDK_VERSION,
    TMP_TELEMETRY_AUTO_VERSION,
    TMP_WEBENGINE_NAME,
    TMP_WEBENGINE_VERSION,
    TMP_WEBENGINE_DESCRIPTION
  ]);
  var TMP_CLOUDPROVIDERVALUES_ALIBABA_CLOUD = "alibaba_cloud";
  var TMP_CLOUDPROVIDERVALUES_AWS = "aws";
  var TMP_CLOUDPROVIDERVALUES_AZURE = "azure";
  var TMP_CLOUDPROVIDERVALUES_GCP = "gcp";
  exports.CLOUDPROVIDERVALUES_ALIBABA_CLOUD = TMP_CLOUDPROVIDERVALUES_ALIBABA_CLOUD;
  exports.CLOUDPROVIDERVALUES_AWS = TMP_CLOUDPROVIDERVALUES_AWS;
  exports.CLOUDPROVIDERVALUES_AZURE = TMP_CLOUDPROVIDERVALUES_AZURE;
  exports.CLOUDPROVIDERVALUES_GCP = TMP_CLOUDPROVIDERVALUES_GCP;
  exports.CloudProviderValues = /* @__PURE__ */ (0, utils_1.createConstMap)([
    TMP_CLOUDPROVIDERVALUES_ALIBABA_CLOUD,
    TMP_CLOUDPROVIDERVALUES_AWS,
    TMP_CLOUDPROVIDERVALUES_AZURE,
    TMP_CLOUDPROVIDERVALUES_GCP
  ]);
  var TMP_CLOUDPLATFORMVALUES_ALIBABA_CLOUD_ECS = "alibaba_cloud_ecs";
  var TMP_CLOUDPLATFORMVALUES_ALIBABA_CLOUD_FC = "alibaba_cloud_fc";
  var TMP_CLOUDPLATFORMVALUES_AWS_EC2 = "aws_ec2";
  var TMP_CLOUDPLATFORMVALUES_AWS_ECS = "aws_ecs";
  var TMP_CLOUDPLATFORMVALUES_AWS_EKS = "aws_eks";
  var TMP_CLOUDPLATFORMVALUES_AWS_LAMBDA = "aws_lambda";
  var TMP_CLOUDPLATFORMVALUES_AWS_ELASTIC_BEANSTALK = "aws_elastic_beanstalk";
  var TMP_CLOUDPLATFORMVALUES_AZURE_VM = "azure_vm";
  var TMP_CLOUDPLATFORMVALUES_AZURE_CONTAINER_INSTANCES = "azure_container_instances";
  var TMP_CLOUDPLATFORMVALUES_AZURE_AKS = "azure_aks";
  var TMP_CLOUDPLATFORMVALUES_AZURE_FUNCTIONS = "azure_functions";
  var TMP_CLOUDPLATFORMVALUES_AZURE_APP_SERVICE = "azure_app_service";
  var TMP_CLOUDPLATFORMVALUES_GCP_COMPUTE_ENGINE = "gcp_compute_engine";
  var TMP_CLOUDPLATFORMVALUES_GCP_CLOUD_RUN = "gcp_cloud_run";
  var TMP_CLOUDPLATFORMVALUES_GCP_KUBERNETES_ENGINE = "gcp_kubernetes_engine";
  var TMP_CLOUDPLATFORMVALUES_GCP_CLOUD_FUNCTIONS = "gcp_cloud_functions";
  var TMP_CLOUDPLATFORMVALUES_GCP_APP_ENGINE = "gcp_app_engine";
  exports.CLOUDPLATFORMVALUES_ALIBABA_CLOUD_ECS = TMP_CLOUDPLATFORMVALUES_ALIBABA_CLOUD_ECS;
  exports.CLOUDPLATFORMVALUES_ALIBABA_CLOUD_FC = TMP_CLOUDPLATFORMVALUES_ALIBABA_CLOUD_FC;
  exports.CLOUDPLATFORMVALUES_AWS_EC2 = TMP_CLOUDPLATFORMVALUES_AWS_EC2;
  exports.CLOUDPLATFORMVALUES_AWS_ECS = TMP_CLOUDPLATFORMVALUES_AWS_ECS;
  exports.CLOUDPLATFORMVALUES_AWS_EKS = TMP_CLOUDPLATFORMVALUES_AWS_EKS;
  exports.CLOUDPLATFORMVALUES_AWS_LAMBDA = TMP_CLOUDPLATFORMVALUES_AWS_LAMBDA;
  exports.CLOUDPLATFORMVALUES_AWS_ELASTIC_BEANSTALK = TMP_CLOUDPLATFORMVALUES_AWS_ELASTIC_BEANSTALK;
  exports.CLOUDPLATFORMVALUES_AZURE_VM = TMP_CLOUDPLATFORMVALUES_AZURE_VM;
  exports.CLOUDPLATFORMVALUES_AZURE_CONTAINER_INSTANCES = TMP_CLOUDPLATFORMVALUES_AZURE_CONTAINER_INSTANCES;
  exports.CLOUDPLATFORMVALUES_AZURE_AKS = TMP_CLOUDPLATFORMVALUES_AZURE_AKS;
  exports.CLOUDPLATFORMVALUES_AZURE_FUNCTIONS = TMP_CLOUDPLATFORMVALUES_AZURE_FUNCTIONS;
  exports.CLOUDPLATFORMVALUES_AZURE_APP_SERVICE = TMP_CLOUDPLATFORMVALUES_AZURE_APP_SERVICE;
  exports.CLOUDPLATFORMVALUES_GCP_COMPUTE_ENGINE = TMP_CLOUDPLATFORMVALUES_GCP_COMPUTE_ENGINE;
  exports.CLOUDPLATFORMVALUES_GCP_CLOUD_RUN = TMP_CLOUDPLATFORMVALUES_GCP_CLOUD_RUN;
  exports.CLOUDPLATFORMVALUES_GCP_KUBERNETES_ENGINE = TMP_CLOUDPLATFORMVALUES_GCP_KUBERNETES_ENGINE;
  exports.CLOUDPLATFORMVALUES_GCP_CLOUD_FUNCTIONS = TMP_CLOUDPLATFORMVALUES_GCP_CLOUD_FUNCTIONS;
  exports.CLOUDPLATFORMVALUES_GCP_APP_ENGINE = TMP_CLOUDPLATFORMVALUES_GCP_APP_ENGINE;
  exports.CloudPlatformValues = /* @__PURE__ */ (0, utils_1.createConstMap)([
    TMP_CLOUDPLATFORMVALUES_ALIBABA_CLOUD_ECS,
    TMP_CLOUDPLATFORMVALUES_ALIBABA_CLOUD_FC,
    TMP_CLOUDPLATFORMVALUES_AWS_EC2,
    TMP_CLOUDPLATFORMVALUES_AWS_ECS,
    TMP_CLOUDPLATFORMVALUES_AWS_EKS,
    TMP_CLOUDPLATFORMVALUES_AWS_LAMBDA,
    TMP_CLOUDPLATFORMVALUES_AWS_ELASTIC_BEANSTALK,
    TMP_CLOUDPLATFORMVALUES_AZURE_VM,
    TMP_CLOUDPLATFORMVALUES_AZURE_CONTAINER_INSTANCES,
    TMP_CLOUDPLATFORMVALUES_AZURE_AKS,
    TMP_CLOUDPLATFORMVALUES_AZURE_FUNCTIONS,
    TMP_CLOUDPLATFORMVALUES_AZURE_APP_SERVICE,
    TMP_CLOUDPLATFORMVALUES_GCP_COMPUTE_ENGINE,
    TMP_CLOUDPLATFORMVALUES_GCP_CLOUD_RUN,
    TMP_CLOUDPLATFORMVALUES_GCP_KUBERNETES_ENGINE,
    TMP_CLOUDPLATFORMVALUES_GCP_CLOUD_FUNCTIONS,
    TMP_CLOUDPLATFORMVALUES_GCP_APP_ENGINE
  ]);
  var TMP_AWSECSLAUNCHTYPEVALUES_EC2 = "ec2";
  var TMP_AWSECSLAUNCHTYPEVALUES_FARGATE = "fargate";
  exports.AWSECSLAUNCHTYPEVALUES_EC2 = TMP_AWSECSLAUNCHTYPEVALUES_EC2;
  exports.AWSECSLAUNCHTYPEVALUES_FARGATE = TMP_AWSECSLAUNCHTYPEVALUES_FARGATE;
  exports.AwsEcsLaunchtypeValues = /* @__PURE__ */ (0, utils_1.createConstMap)([
    TMP_AWSECSLAUNCHTYPEVALUES_EC2,
    TMP_AWSECSLAUNCHTYPEVALUES_FARGATE
  ]);
  var TMP_HOSTARCHVALUES_AMD64 = "amd64";
  var TMP_HOSTARCHVALUES_ARM32 = "arm32";
  var TMP_HOSTARCHVALUES_ARM64 = "arm64";
  var TMP_HOSTARCHVALUES_IA64 = "ia64";
  var TMP_HOSTARCHVALUES_PPC32 = "ppc32";
  var TMP_HOSTARCHVALUES_PPC64 = "ppc64";
  var TMP_HOSTARCHVALUES_X86 = "x86";
  exports.HOSTARCHVALUES_AMD64 = TMP_HOSTARCHVALUES_AMD64;
  exports.HOSTARCHVALUES_ARM32 = TMP_HOSTARCHVALUES_ARM32;
  exports.HOSTARCHVALUES_ARM64 = TMP_HOSTARCHVALUES_ARM64;
  exports.HOSTARCHVALUES_IA64 = TMP_HOSTARCHVALUES_IA64;
  exports.HOSTARCHVALUES_PPC32 = TMP_HOSTARCHVALUES_PPC32;
  exports.HOSTARCHVALUES_PPC64 = TMP_HOSTARCHVALUES_PPC64;
  exports.HOSTARCHVALUES_X86 = TMP_HOSTARCHVALUES_X86;
  exports.HostArchValues = /* @__PURE__ */ (0, utils_1.createConstMap)([
    TMP_HOSTARCHVALUES_AMD64,
    TMP_HOSTARCHVALUES_ARM32,
    TMP_HOSTARCHVALUES_ARM64,
    TMP_HOSTARCHVALUES_IA64,
    TMP_HOSTARCHVALUES_PPC32,
    TMP_HOSTARCHVALUES_PPC64,
    TMP_HOSTARCHVALUES_X86
  ]);
  var TMP_OSTYPEVALUES_WINDOWS = "windows";
  var TMP_OSTYPEVALUES_LINUX = "linux";
  var TMP_OSTYPEVALUES_DARWIN = "darwin";
  var TMP_OSTYPEVALUES_FREEBSD = "freebsd";
  var TMP_OSTYPEVALUES_NETBSD = "netbsd";
  var TMP_OSTYPEVALUES_OPENBSD = "openbsd";
  var TMP_OSTYPEVALUES_DRAGONFLYBSD = "dragonflybsd";
  var TMP_OSTYPEVALUES_HPUX = "hpux";
  var TMP_OSTYPEVALUES_AIX = "aix";
  var TMP_OSTYPEVALUES_SOLARIS = "solaris";
  var TMP_OSTYPEVALUES_Z_OS = "z_os";
  exports.OSTYPEVALUES_WINDOWS = TMP_OSTYPEVALUES_WINDOWS;
  exports.OSTYPEVALUES_LINUX = TMP_OSTYPEVALUES_LINUX;
  exports.OSTYPEVALUES_DARWIN = TMP_OSTYPEVALUES_DARWIN;
  exports.OSTYPEVALUES_FREEBSD = TMP_OSTYPEVALUES_FREEBSD;
  exports.OSTYPEVALUES_NETBSD = TMP_OSTYPEVALUES_NETBSD;
  exports.OSTYPEVALUES_OPENBSD = TMP_OSTYPEVALUES_OPENBSD;
  exports.OSTYPEVALUES_DRAGONFLYBSD = TMP_OSTYPEVALUES_DRAGONFLYBSD;
  exports.OSTYPEVALUES_HPUX = TMP_OSTYPEVALUES_HPUX;
  exports.OSTYPEVALUES_AIX = TMP_OSTYPEVALUES_AIX;
  exports.OSTYPEVALUES_SOLARIS = TMP_OSTYPEVALUES_SOLARIS;
  exports.OSTYPEVALUES_Z_OS = TMP_OSTYPEVALUES_Z_OS;
  exports.OsTypeValues = /* @__PURE__ */ (0, utils_1.createConstMap)([
    TMP_OSTYPEVALUES_WINDOWS,
    TMP_OSTYPEVALUES_LINUX,
    TMP_OSTYPEVALUES_DARWIN,
    TMP_OSTYPEVALUES_FREEBSD,
    TMP_OSTYPEVALUES_NETBSD,
    TMP_OSTYPEVALUES_OPENBSD,
    TMP_OSTYPEVALUES_DRAGONFLYBSD,
    TMP_OSTYPEVALUES_HPUX,
    TMP_OSTYPEVALUES_AIX,
    TMP_OSTYPEVALUES_SOLARIS,
    TMP_OSTYPEVALUES_Z_OS
  ]);
  var TMP_TELEMETRYSDKLANGUAGEVALUES_CPP = "cpp";
  var TMP_TELEMETRYSDKLANGUAGEVALUES_DOTNET = "dotnet";
  var TMP_TELEMETRYSDKLANGUAGEVALUES_ERLANG = "erlang";
  var TMP_TELEMETRYSDKLANGUAGEVALUES_GO = "go";
  var TMP_TELEMETRYSDKLANGUAGEVALUES_JAVA = "java";
  var TMP_TELEMETRYSDKLANGUAGEVALUES_NODEJS = "nodejs";
  var TMP_TELEMETRYSDKLANGUAGEVALUES_PHP = "php";
  var TMP_TELEMETRYSDKLANGUAGEVALUES_PYTHON = "python";
  var TMP_TELEMETRYSDKLANGUAGEVALUES_RUBY = "ruby";
  var TMP_TELEMETRYSDKLANGUAGEVALUES_WEBJS = "webjs";
  exports.TELEMETRYSDKLANGUAGEVALUES_CPP = TMP_TELEMETRYSDKLANGUAGEVALUES_CPP;
  exports.TELEMETRYSDKLANGUAGEVALUES_DOTNET = TMP_TELEMETRYSDKLANGUAGEVALUES_DOTNET;
  exports.TELEMETRYSDKLANGUAGEVALUES_ERLANG = TMP_TELEMETRYSDKLANGUAGEVALUES_ERLANG;
  exports.TELEMETRYSDKLANGUAGEVALUES_GO = TMP_TELEMETRYSDKLANGUAGEVALUES_GO;
  exports.TELEMETRYSDKLANGUAGEVALUES_JAVA = TMP_TELEMETRYSDKLANGUAGEVALUES_JAVA;
  exports.TELEMETRYSDKLANGUAGEVALUES_NODEJS = TMP_TELEMETRYSDKLANGUAGEVALUES_NODEJS;
  exports.TELEMETRYSDKLANGUAGEVALUES_PHP = TMP_TELEMETRYSDKLANGUAGEVALUES_PHP;
  exports.TELEMETRYSDKLANGUAGEVALUES_PYTHON = TMP_TELEMETRYSDKLANGUAGEVALUES_PYTHON;
  exports.TELEMETRYSDKLANGUAGEVALUES_RUBY = TMP_TELEMETRYSDKLANGUAGEVALUES_RUBY;
  exports.TELEMETRYSDKLANGUAGEVALUES_WEBJS = TMP_TELEMETRYSDKLANGUAGEVALUES_WEBJS;
  exports.TelemetrySdkLanguageValues = /* @__PURE__ */ (0, utils_1.createConstMap)([
    TMP_TELEMETRYSDKLANGUAGEVALUES_CPP,
    TMP_TELEMETRYSDKLANGUAGEVALUES_DOTNET,
    TMP_TELEMETRYSDKLANGUAGEVALUES_ERLANG,
    TMP_TELEMETRYSDKLANGUAGEVALUES_GO,
    TMP_TELEMETRYSDKLANGUAGEVALUES_JAVA,
    TMP_TELEMETRYSDKLANGUAGEVALUES_NODEJS,
    TMP_TELEMETRYSDKLANGUAGEVALUES_PHP,
    TMP_TELEMETRYSDKLANGUAGEVALUES_PYTHON,
    TMP_TELEMETRYSDKLANGUAGEVALUES_RUBY,
    TMP_TELEMETRYSDKLANGUAGEVALUES_WEBJS
  ]);
});

// node_modules/@opentelemetry/semantic-conventions/build/src/resource/index.js
var require_resource4 = __commonJS((exports) => {
  var __createBinding = exports && exports.__createBinding || (Object.create ? function(o, m, k, k2) {
    if (k2 === undefined)
      k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() {
        return m[k];
      } };
    }
    Object.defineProperty(o, k2, desc);
  } : function(o, m, k, k2) {
    if (k2 === undefined)
      k2 = k;
    o[k2] = m[k];
  });
  var __exportStar = exports && exports.__exportStar || function(m, exports2) {
    for (var p in m)
      if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p))
        __createBinding(exports2, m, p);
  };
  Object.defineProperty(exports, "__esModule", { value: true });
  __exportStar(require_SemanticResourceAttributes4(), exports);
});

// node_modules/@opentelemetry/semantic-conventions/build/src/stable_attributes.js
var require_stable_attributes4 = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.ATTR_EXCEPTION_TYPE = exports.ATTR_EXCEPTION_STACKTRACE = exports.ATTR_EXCEPTION_MESSAGE = exports.ATTR_EXCEPTION_ESCAPED = exports.ERROR_TYPE_VALUE_OTHER = exports.ATTR_ERROR_TYPE = exports.DOTNET_GC_HEAP_GENERATION_VALUE_POH = exports.DOTNET_GC_HEAP_GENERATION_VALUE_LOH = exports.DOTNET_GC_HEAP_GENERATION_VALUE_GEN2 = exports.DOTNET_GC_HEAP_GENERATION_VALUE_GEN1 = exports.DOTNET_GC_HEAP_GENERATION_VALUE_GEN0 = exports.ATTR_DOTNET_GC_HEAP_GENERATION = exports.DB_SYSTEM_NAME_VALUE_POSTGRESQL = exports.DB_SYSTEM_NAME_VALUE_MYSQL = exports.DB_SYSTEM_NAME_VALUE_MICROSOFT_SQL_SERVER = exports.DB_SYSTEM_NAME_VALUE_MARIADB = exports.ATTR_DB_SYSTEM_NAME = exports.ATTR_DB_STORED_PROCEDURE_NAME = exports.ATTR_DB_RESPONSE_STATUS_CODE = exports.ATTR_DB_QUERY_TEXT = exports.ATTR_DB_QUERY_SUMMARY = exports.ATTR_DB_OPERATION_NAME = exports.ATTR_DB_OPERATION_BATCH_SIZE = exports.ATTR_DB_NAMESPACE = exports.ATTR_DB_COLLECTION_NAME = exports.ATTR_CODE_STACKTRACE = exports.ATTR_CODE_LINE_NUMBER = exports.ATTR_CODE_FUNCTION_NAME = exports.ATTR_CODE_FILE_PATH = exports.ATTR_CODE_COLUMN_NUMBER = exports.ATTR_CLIENT_PORT = exports.ATTR_CLIENT_ADDRESS = exports.ATTR_ASPNETCORE_USER_IS_AUTHENTICATED = exports.ASPNETCORE_ROUTING_MATCH_STATUS_VALUE_SUCCESS = exports.ASPNETCORE_ROUTING_MATCH_STATUS_VALUE_FAILURE = exports.ATTR_ASPNETCORE_ROUTING_MATCH_STATUS = exports.ATTR_ASPNETCORE_ROUTING_IS_FALLBACK = exports.ATTR_ASPNETCORE_REQUEST_IS_UNHANDLED = exports.ASPNETCORE_RATE_LIMITING_RESULT_VALUE_REQUEST_CANCELED = exports.ASPNETCORE_RATE_LIMITING_RESULT_VALUE_GLOBAL_LIMITER = exports.ASPNETCORE_RATE_LIMITING_RESULT_VALUE_ENDPOINT_LIMITER = exports.ASPNETCORE_RATE_LIMITING_RESULT_VALUE_ACQUIRED = exports.ATTR_ASPNETCORE_RATE_LIMITING_RESULT = exports.ATTR_ASPNETCORE_RATE_LIMITING_POLICY = exports.ATTR_ASPNETCORE_DIAGNOSTICS_HANDLER_TYPE = exports.ASPNETCORE_DIAGNOSTICS_EXCEPTION_RESULT_VALUE_UNHANDLED = exports.ASPNETCORE_DIAGNOSTICS_EXCEPTION_RESULT_VALUE_SKIPPED = exports.ASPNETCORE_DIAGNOSTICS_EXCEPTION_RESULT_VALUE_HANDLED = exports.ASPNETCORE_DIAGNOSTICS_EXCEPTION_RESULT_VALUE_ABORTED = exports.ATTR_ASPNETCORE_DIAGNOSTICS_EXCEPTION_RESULT = undefined;
  exports.OTEL_STATUS_CODE_VALUE_ERROR = exports.ATTR_OTEL_STATUS_CODE = exports.ATTR_OTEL_SCOPE_VERSION = exports.ATTR_OTEL_SCOPE_NAME = exports.NETWORK_TYPE_VALUE_IPV6 = exports.NETWORK_TYPE_VALUE_IPV4 = exports.ATTR_NETWORK_TYPE = exports.NETWORK_TRANSPORT_VALUE_UNIX = exports.NETWORK_TRANSPORT_VALUE_UDP = exports.NETWORK_TRANSPORT_VALUE_TCP = exports.NETWORK_TRANSPORT_VALUE_QUIC = exports.NETWORK_TRANSPORT_VALUE_PIPE = exports.ATTR_NETWORK_TRANSPORT = exports.ATTR_NETWORK_PROTOCOL_VERSION = exports.ATTR_NETWORK_PROTOCOL_NAME = exports.ATTR_NETWORK_PEER_PORT = exports.ATTR_NETWORK_PEER_ADDRESS = exports.ATTR_NETWORK_LOCAL_PORT = exports.ATTR_NETWORK_LOCAL_ADDRESS = exports.JVM_THREAD_STATE_VALUE_WAITING = exports.JVM_THREAD_STATE_VALUE_TIMED_WAITING = exports.JVM_THREAD_STATE_VALUE_TERMINATED = exports.JVM_THREAD_STATE_VALUE_RUNNABLE = exports.JVM_THREAD_STATE_VALUE_NEW = exports.JVM_THREAD_STATE_VALUE_BLOCKED = exports.ATTR_JVM_THREAD_STATE = exports.ATTR_JVM_THREAD_DAEMON = exports.JVM_MEMORY_TYPE_VALUE_NON_HEAP = exports.JVM_MEMORY_TYPE_VALUE_HEAP = exports.ATTR_JVM_MEMORY_TYPE = exports.ATTR_JVM_MEMORY_POOL_NAME = exports.ATTR_JVM_GC_NAME = exports.ATTR_JVM_GC_ACTION = exports.ATTR_HTTP_ROUTE = exports.ATTR_HTTP_RESPONSE_STATUS_CODE = exports.ATTR_HTTP_RESPONSE_HEADER = exports.ATTR_HTTP_REQUEST_RESEND_COUNT = exports.ATTR_HTTP_REQUEST_METHOD_ORIGINAL = exports.HTTP_REQUEST_METHOD_VALUE_TRACE = exports.HTTP_REQUEST_METHOD_VALUE_PUT = exports.HTTP_REQUEST_METHOD_VALUE_POST = exports.HTTP_REQUEST_METHOD_VALUE_PATCH = exports.HTTP_REQUEST_METHOD_VALUE_OPTIONS = exports.HTTP_REQUEST_METHOD_VALUE_HEAD = exports.HTTP_REQUEST_METHOD_VALUE_GET = exports.HTTP_REQUEST_METHOD_VALUE_DELETE = exports.HTTP_REQUEST_METHOD_VALUE_CONNECT = exports.HTTP_REQUEST_METHOD_VALUE_OTHER = exports.ATTR_HTTP_REQUEST_METHOD = exports.ATTR_HTTP_REQUEST_HEADER = undefined;
  exports.ATTR_USER_AGENT_ORIGINAL = exports.ATTR_URL_SCHEME = exports.ATTR_URL_QUERY = exports.ATTR_URL_PATH = exports.ATTR_URL_FULL = exports.ATTR_URL_FRAGMENT = exports.ATTR_TELEMETRY_SDK_VERSION = exports.ATTR_TELEMETRY_SDK_NAME = exports.TELEMETRY_SDK_LANGUAGE_VALUE_WEBJS = exports.TELEMETRY_SDK_LANGUAGE_VALUE_SWIFT = exports.TELEMETRY_SDK_LANGUAGE_VALUE_RUST = exports.TELEMETRY_SDK_LANGUAGE_VALUE_RUBY = exports.TELEMETRY_SDK_LANGUAGE_VALUE_PYTHON = exports.TELEMETRY_SDK_LANGUAGE_VALUE_PHP = exports.TELEMETRY_SDK_LANGUAGE_VALUE_NODEJS = exports.TELEMETRY_SDK_LANGUAGE_VALUE_JAVA = exports.TELEMETRY_SDK_LANGUAGE_VALUE_GO = exports.TELEMETRY_SDK_LANGUAGE_VALUE_ERLANG = exports.TELEMETRY_SDK_LANGUAGE_VALUE_DOTNET = exports.TELEMETRY_SDK_LANGUAGE_VALUE_CPP = exports.ATTR_TELEMETRY_SDK_LANGUAGE = exports.SIGNALR_TRANSPORT_VALUE_WEB_SOCKETS = exports.SIGNALR_TRANSPORT_VALUE_SERVER_SENT_EVENTS = exports.SIGNALR_TRANSPORT_VALUE_LONG_POLLING = exports.ATTR_SIGNALR_TRANSPORT = exports.SIGNALR_CONNECTION_STATUS_VALUE_TIMEOUT = exports.SIGNALR_CONNECTION_STATUS_VALUE_NORMAL_CLOSURE = exports.SIGNALR_CONNECTION_STATUS_VALUE_APP_SHUTDOWN = exports.ATTR_SIGNALR_CONNECTION_STATUS = exports.ATTR_SERVICE_VERSION = exports.ATTR_SERVICE_NAMESPACE = exports.ATTR_SERVICE_NAME = exports.ATTR_SERVICE_INSTANCE_ID = exports.ATTR_SERVER_PORT = exports.ATTR_SERVER_ADDRESS = exports.ATTR_OTEL_STATUS_DESCRIPTION = exports.OTEL_STATUS_CODE_VALUE_OK = undefined;
  exports.ATTR_ASPNETCORE_DIAGNOSTICS_EXCEPTION_RESULT = "aspnetcore.diagnostics.exception.result";
  exports.ASPNETCORE_DIAGNOSTICS_EXCEPTION_RESULT_VALUE_ABORTED = "aborted";
  exports.ASPNETCORE_DIAGNOSTICS_EXCEPTION_RESULT_VALUE_HANDLED = "handled";
  exports.ASPNETCORE_DIAGNOSTICS_EXCEPTION_RESULT_VALUE_SKIPPED = "skipped";
  exports.ASPNETCORE_DIAGNOSTICS_EXCEPTION_RESULT_VALUE_UNHANDLED = "unhandled";
  exports.ATTR_ASPNETCORE_DIAGNOSTICS_HANDLER_TYPE = "aspnetcore.diagnostics.handler.type";
  exports.ATTR_ASPNETCORE_RATE_LIMITING_POLICY = "aspnetcore.rate_limiting.policy";
  exports.ATTR_ASPNETCORE_RATE_LIMITING_RESULT = "aspnetcore.rate_limiting.result";
  exports.ASPNETCORE_RATE_LIMITING_RESULT_VALUE_ACQUIRED = "acquired";
  exports.ASPNETCORE_RATE_LIMITING_RESULT_VALUE_ENDPOINT_LIMITER = "endpoint_limiter";
  exports.ASPNETCORE_RATE_LIMITING_RESULT_VALUE_GLOBAL_LIMITER = "global_limiter";
  exports.ASPNETCORE_RATE_LIMITING_RESULT_VALUE_REQUEST_CANCELED = "request_canceled";
  exports.ATTR_ASPNETCORE_REQUEST_IS_UNHANDLED = "aspnetcore.request.is_unhandled";
  exports.ATTR_ASPNETCORE_ROUTING_IS_FALLBACK = "aspnetcore.routing.is_fallback";
  exports.ATTR_ASPNETCORE_ROUTING_MATCH_STATUS = "aspnetcore.routing.match_status";
  exports.ASPNETCORE_ROUTING_MATCH_STATUS_VALUE_FAILURE = "failure";
  exports.ASPNETCORE_ROUTING_MATCH_STATUS_VALUE_SUCCESS = "success";
  exports.ATTR_ASPNETCORE_USER_IS_AUTHENTICATED = "aspnetcore.user.is_authenticated";
  exports.ATTR_CLIENT_ADDRESS = "client.address";
  exports.ATTR_CLIENT_PORT = "client.port";
  exports.ATTR_CODE_COLUMN_NUMBER = "code.column.number";
  exports.ATTR_CODE_FILE_PATH = "code.file.path";
  exports.ATTR_CODE_FUNCTION_NAME = "code.function.name";
  exports.ATTR_CODE_LINE_NUMBER = "code.line.number";
  exports.ATTR_CODE_STACKTRACE = "code.stacktrace";
  exports.ATTR_DB_COLLECTION_NAME = "db.collection.name";
  exports.ATTR_DB_NAMESPACE = "db.namespace";
  exports.ATTR_DB_OPERATION_BATCH_SIZE = "db.operation.batch.size";
  exports.ATTR_DB_OPERATION_NAME = "db.operation.name";
  exports.ATTR_DB_QUERY_SUMMARY = "db.query.summary";
  exports.ATTR_DB_QUERY_TEXT = "db.query.text";
  exports.ATTR_DB_RESPONSE_STATUS_CODE = "db.response.status_code";
  exports.ATTR_DB_STORED_PROCEDURE_NAME = "db.stored_procedure.name";
  exports.ATTR_DB_SYSTEM_NAME = "db.system.name";
  exports.DB_SYSTEM_NAME_VALUE_MARIADB = "mariadb";
  exports.DB_SYSTEM_NAME_VALUE_MICROSOFT_SQL_SERVER = "microsoft.sql_server";
  exports.DB_SYSTEM_NAME_VALUE_MYSQL = "mysql";
  exports.DB_SYSTEM_NAME_VALUE_POSTGRESQL = "postgresql";
  exports.ATTR_DOTNET_GC_HEAP_GENERATION = "dotnet.gc.heap.generation";
  exports.DOTNET_GC_HEAP_GENERATION_VALUE_GEN0 = "gen0";
  exports.DOTNET_GC_HEAP_GENERATION_VALUE_GEN1 = "gen1";
  exports.DOTNET_GC_HEAP_GENERATION_VALUE_GEN2 = "gen2";
  exports.DOTNET_GC_HEAP_GENERATION_VALUE_LOH = "loh";
  exports.DOTNET_GC_HEAP_GENERATION_VALUE_POH = "poh";
  exports.ATTR_ERROR_TYPE = "error.type";
  exports.ERROR_TYPE_VALUE_OTHER = "_OTHER";
  exports.ATTR_EXCEPTION_ESCAPED = "exception.escaped";
  exports.ATTR_EXCEPTION_MESSAGE = "exception.message";
  exports.ATTR_EXCEPTION_STACKTRACE = "exception.stacktrace";
  exports.ATTR_EXCEPTION_TYPE = "exception.type";
  var ATTR_HTTP_REQUEST_HEADER = (key) => `http.request.header.${key}`;
  exports.ATTR_HTTP_REQUEST_HEADER = ATTR_HTTP_REQUEST_HEADER;
  exports.ATTR_HTTP_REQUEST_METHOD = "http.request.method";
  exports.HTTP_REQUEST_METHOD_VALUE_OTHER = "_OTHER";
  exports.HTTP_REQUEST_METHOD_VALUE_CONNECT = "CONNECT";
  exports.HTTP_REQUEST_METHOD_VALUE_DELETE = "DELETE";
  exports.HTTP_REQUEST_METHOD_VALUE_GET = "GET";
  exports.HTTP_REQUEST_METHOD_VALUE_HEAD = "HEAD";
  exports.HTTP_REQUEST_METHOD_VALUE_OPTIONS = "OPTIONS";
  exports.HTTP_REQUEST_METHOD_VALUE_PATCH = "PATCH";
  exports.HTTP_REQUEST_METHOD_VALUE_POST = "POST";
  exports.HTTP_REQUEST_METHOD_VALUE_PUT = "PUT";
  exports.HTTP_REQUEST_METHOD_VALUE_TRACE = "TRACE";
  exports.ATTR_HTTP_REQUEST_METHOD_ORIGINAL = "http.request.method_original";
  exports.ATTR_HTTP_REQUEST_RESEND_COUNT = "http.request.resend_count";
  var ATTR_HTTP_RESPONSE_HEADER = (key) => `http.response.header.${key}`;
  exports.ATTR_HTTP_RESPONSE_HEADER = ATTR_HTTP_RESPONSE_HEADER;
  exports.ATTR_HTTP_RESPONSE_STATUS_CODE = "http.response.status_code";
  exports.ATTR_HTTP_ROUTE = "http.route";
  exports.ATTR_JVM_GC_ACTION = "jvm.gc.action";
  exports.ATTR_JVM_GC_NAME = "jvm.gc.name";
  exports.ATTR_JVM_MEMORY_POOL_NAME = "jvm.memory.pool.name";
  exports.ATTR_JVM_MEMORY_TYPE = "jvm.memory.type";
  exports.JVM_MEMORY_TYPE_VALUE_HEAP = "heap";
  exports.JVM_MEMORY_TYPE_VALUE_NON_HEAP = "non_heap";
  exports.ATTR_JVM_THREAD_DAEMON = "jvm.thread.daemon";
  exports.ATTR_JVM_THREAD_STATE = "jvm.thread.state";
  exports.JVM_THREAD_STATE_VALUE_BLOCKED = "blocked";
  exports.JVM_THREAD_STATE_VALUE_NEW = "new";
  exports.JVM_THREAD_STATE_VALUE_RUNNABLE = "runnable";
  exports.JVM_THREAD_STATE_VALUE_TERMINATED = "terminated";
  exports.JVM_THREAD_STATE_VALUE_TIMED_WAITING = "timed_waiting";
  exports.JVM_THREAD_STATE_VALUE_WAITING = "waiting";
  exports.ATTR_NETWORK_LOCAL_ADDRESS = "network.local.address";
  exports.ATTR_NETWORK_LOCAL_PORT = "network.local.port";
  exports.ATTR_NETWORK_PEER_ADDRESS = "network.peer.address";
  exports.ATTR_NETWORK_PEER_PORT = "network.peer.port";
  exports.ATTR_NETWORK_PROTOCOL_NAME = "network.protocol.name";
  exports.ATTR_NETWORK_PROTOCOL_VERSION = "network.protocol.version";
  exports.ATTR_NETWORK_TRANSPORT = "network.transport";
  exports.NETWORK_TRANSPORT_VALUE_PIPE = "pipe";
  exports.NETWORK_TRANSPORT_VALUE_QUIC = "quic";
  exports.NETWORK_TRANSPORT_VALUE_TCP = "tcp";
  exports.NETWORK_TRANSPORT_VALUE_UDP = "udp";
  exports.NETWORK_TRANSPORT_VALUE_UNIX = "unix";
  exports.ATTR_NETWORK_TYPE = "network.type";
  exports.NETWORK_TYPE_VALUE_IPV4 = "ipv4";
  exports.NETWORK_TYPE_VALUE_IPV6 = "ipv6";
  exports.ATTR_OTEL_SCOPE_NAME = "otel.scope.name";
  exports.ATTR_OTEL_SCOPE_VERSION = "otel.scope.version";
  exports.ATTR_OTEL_STATUS_CODE = "otel.status_code";
  exports.OTEL_STATUS_CODE_VALUE_ERROR = "ERROR";
  exports.OTEL_STATUS_CODE_VALUE_OK = "OK";
  exports.ATTR_OTEL_STATUS_DESCRIPTION = "otel.status_description";
  exports.ATTR_SERVER_ADDRESS = "server.address";
  exports.ATTR_SERVER_PORT = "server.port";
  exports.ATTR_SERVICE_INSTANCE_ID = "service.instance.id";
  exports.ATTR_SERVICE_NAME = "service.name";
  exports.ATTR_SERVICE_NAMESPACE = "service.namespace";
  exports.ATTR_SERVICE_VERSION = "service.version";
  exports.ATTR_SIGNALR_CONNECTION_STATUS = "signalr.connection.status";
  exports.SIGNALR_CONNECTION_STATUS_VALUE_APP_SHUTDOWN = "app_shutdown";
  exports.SIGNALR_CONNECTION_STATUS_VALUE_NORMAL_CLOSURE = "normal_closure";
  exports.SIGNALR_CONNECTION_STATUS_VALUE_TIMEOUT = "timeout";
  exports.ATTR_SIGNALR_TRANSPORT = "signalr.transport";
  exports.SIGNALR_TRANSPORT_VALUE_LONG_POLLING = "long_polling";
  exports.SIGNALR_TRANSPORT_VALUE_SERVER_SENT_EVENTS = "server_sent_events";
  exports.SIGNALR_TRANSPORT_VALUE_WEB_SOCKETS = "web_sockets";
  exports.ATTR_TELEMETRY_SDK_LANGUAGE = "telemetry.sdk.language";
  exports.TELEMETRY_SDK_LANGUAGE_VALUE_CPP = "cpp";
  exports.TELEMETRY_SDK_LANGUAGE_VALUE_DOTNET = "dotnet";
  exports.TELEMETRY_SDK_LANGUAGE_VALUE_ERLANG = "erlang";
  exports.TELEMETRY_SDK_LANGUAGE_VALUE_GO = "go";
  exports.TELEMETRY_SDK_LANGUAGE_VALUE_JAVA = "java";
  exports.TELEMETRY_SDK_LANGUAGE_VALUE_NODEJS = "nodejs";
  exports.TELEMETRY_SDK_LANGUAGE_VALUE_PHP = "php";
  exports.TELEMETRY_SDK_LANGUAGE_VALUE_PYTHON = "python";
  exports.TELEMETRY_SDK_LANGUAGE_VALUE_RUBY = "ruby";
  exports.TELEMETRY_SDK_LANGUAGE_VALUE_RUST = "rust";
  exports.TELEMETRY_SDK_LANGUAGE_VALUE_SWIFT = "swift";
  exports.TELEMETRY_SDK_LANGUAGE_VALUE_WEBJS = "webjs";
  exports.ATTR_TELEMETRY_SDK_NAME = "telemetry.sdk.name";
  exports.ATTR_TELEMETRY_SDK_VERSION = "telemetry.sdk.version";
  exports.ATTR_URL_FRAGMENT = "url.fragment";
  exports.ATTR_URL_FULL = "url.full";
  exports.ATTR_URL_PATH = "url.path";
  exports.ATTR_URL_QUERY = "url.query";
  exports.ATTR_URL_SCHEME = "url.scheme";
  exports.ATTR_USER_AGENT_ORIGINAL = "user_agent.original";
});

// node_modules/@opentelemetry/semantic-conventions/build/src/stable_metrics.js
var require_stable_metrics4 = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.METRIC_SIGNALR_SERVER_ACTIVE_CONNECTIONS = exports.METRIC_KESTREL_UPGRADED_CONNECTIONS = exports.METRIC_KESTREL_TLS_HANDSHAKE_DURATION = exports.METRIC_KESTREL_REJECTED_CONNECTIONS = exports.METRIC_KESTREL_QUEUED_REQUESTS = exports.METRIC_KESTREL_QUEUED_CONNECTIONS = exports.METRIC_KESTREL_CONNECTION_DURATION = exports.METRIC_KESTREL_ACTIVE_TLS_HANDSHAKES = exports.METRIC_KESTREL_ACTIVE_CONNECTIONS = exports.METRIC_JVM_THREAD_COUNT = exports.METRIC_JVM_MEMORY_USED_AFTER_LAST_GC = exports.METRIC_JVM_MEMORY_USED = exports.METRIC_JVM_MEMORY_LIMIT = exports.METRIC_JVM_MEMORY_COMMITTED = exports.METRIC_JVM_GC_DURATION = exports.METRIC_JVM_CPU_TIME = exports.METRIC_JVM_CPU_RECENT_UTILIZATION = exports.METRIC_JVM_CPU_COUNT = exports.METRIC_JVM_CLASS_UNLOADED = exports.METRIC_JVM_CLASS_LOADED = exports.METRIC_JVM_CLASS_COUNT = exports.METRIC_HTTP_SERVER_REQUEST_DURATION = exports.METRIC_HTTP_CLIENT_REQUEST_DURATION = exports.METRIC_DOTNET_TIMER_COUNT = exports.METRIC_DOTNET_THREAD_POOL_WORK_ITEM_COUNT = exports.METRIC_DOTNET_THREAD_POOL_THREAD_COUNT = exports.METRIC_DOTNET_THREAD_POOL_QUEUE_LENGTH = exports.METRIC_DOTNET_PROCESS_MEMORY_WORKING_SET = exports.METRIC_DOTNET_PROCESS_CPU_TIME = exports.METRIC_DOTNET_PROCESS_CPU_COUNT = exports.METRIC_DOTNET_MONITOR_LOCK_CONTENTIONS = exports.METRIC_DOTNET_JIT_COMPILED_METHODS = exports.METRIC_DOTNET_JIT_COMPILED_IL_SIZE = exports.METRIC_DOTNET_JIT_COMPILATION_TIME = exports.METRIC_DOTNET_GC_PAUSE_TIME = exports.METRIC_DOTNET_GC_LAST_COLLECTION_MEMORY_COMMITTED_SIZE = exports.METRIC_DOTNET_GC_LAST_COLLECTION_HEAP_SIZE = exports.METRIC_DOTNET_GC_LAST_COLLECTION_HEAP_FRAGMENTATION_SIZE = exports.METRIC_DOTNET_GC_HEAP_TOTAL_ALLOCATED = exports.METRIC_DOTNET_GC_COLLECTIONS = exports.METRIC_DOTNET_EXCEPTIONS = exports.METRIC_DOTNET_ASSEMBLY_COUNT = exports.METRIC_DB_CLIENT_OPERATION_DURATION = exports.METRIC_ASPNETCORE_ROUTING_MATCH_ATTEMPTS = exports.METRIC_ASPNETCORE_RATE_LIMITING_REQUESTS = exports.METRIC_ASPNETCORE_RATE_LIMITING_REQUEST_LEASE_DURATION = exports.METRIC_ASPNETCORE_RATE_LIMITING_REQUEST_TIME_IN_QUEUE = exports.METRIC_ASPNETCORE_RATE_LIMITING_QUEUED_REQUESTS = exports.METRIC_ASPNETCORE_RATE_LIMITING_ACTIVE_REQUEST_LEASES = exports.METRIC_ASPNETCORE_DIAGNOSTICS_EXCEPTIONS = undefined;
  exports.METRIC_SIGNALR_SERVER_CONNECTION_DURATION = undefined;
  exports.METRIC_ASPNETCORE_DIAGNOSTICS_EXCEPTIONS = "aspnetcore.diagnostics.exceptions";
  exports.METRIC_ASPNETCORE_RATE_LIMITING_ACTIVE_REQUEST_LEASES = "aspnetcore.rate_limiting.active_request_leases";
  exports.METRIC_ASPNETCORE_RATE_LIMITING_QUEUED_REQUESTS = "aspnetcore.rate_limiting.queued_requests";
  exports.METRIC_ASPNETCORE_RATE_LIMITING_REQUEST_TIME_IN_QUEUE = "aspnetcore.rate_limiting.request.time_in_queue";
  exports.METRIC_ASPNETCORE_RATE_LIMITING_REQUEST_LEASE_DURATION = "aspnetcore.rate_limiting.request_lease.duration";
  exports.METRIC_ASPNETCORE_RATE_LIMITING_REQUESTS = "aspnetcore.rate_limiting.requests";
  exports.METRIC_ASPNETCORE_ROUTING_MATCH_ATTEMPTS = "aspnetcore.routing.match_attempts";
  exports.METRIC_DB_CLIENT_OPERATION_DURATION = "db.client.operation.duration";
  exports.METRIC_DOTNET_ASSEMBLY_COUNT = "dotnet.assembly.count";
  exports.METRIC_DOTNET_EXCEPTIONS = "dotnet.exceptions";
  exports.METRIC_DOTNET_GC_COLLECTIONS = "dotnet.gc.collections";
  exports.METRIC_DOTNET_GC_HEAP_TOTAL_ALLOCATED = "dotnet.gc.heap.total_allocated";
  exports.METRIC_DOTNET_GC_LAST_COLLECTION_HEAP_FRAGMENTATION_SIZE = "dotnet.gc.last_collection.heap.fragmentation.size";
  exports.METRIC_DOTNET_GC_LAST_COLLECTION_HEAP_SIZE = "dotnet.gc.last_collection.heap.size";
  exports.METRIC_DOTNET_GC_LAST_COLLECTION_MEMORY_COMMITTED_SIZE = "dotnet.gc.last_collection.memory.committed_size";
  exports.METRIC_DOTNET_GC_PAUSE_TIME = "dotnet.gc.pause.time";
  exports.METRIC_DOTNET_JIT_COMPILATION_TIME = "dotnet.jit.compilation.time";
  exports.METRIC_DOTNET_JIT_COMPILED_IL_SIZE = "dotnet.jit.compiled_il.size";
  exports.METRIC_DOTNET_JIT_COMPILED_METHODS = "dotnet.jit.compiled_methods";
  exports.METRIC_DOTNET_MONITOR_LOCK_CONTENTIONS = "dotnet.monitor.lock_contentions";
  exports.METRIC_DOTNET_PROCESS_CPU_COUNT = "dotnet.process.cpu.count";
  exports.METRIC_DOTNET_PROCESS_CPU_TIME = "dotnet.process.cpu.time";
  exports.METRIC_DOTNET_PROCESS_MEMORY_WORKING_SET = "dotnet.process.memory.working_set";
  exports.METRIC_DOTNET_THREAD_POOL_QUEUE_LENGTH = "dotnet.thread_pool.queue.length";
  exports.METRIC_DOTNET_THREAD_POOL_THREAD_COUNT = "dotnet.thread_pool.thread.count";
  exports.METRIC_DOTNET_THREAD_POOL_WORK_ITEM_COUNT = "dotnet.thread_pool.work_item.count";
  exports.METRIC_DOTNET_TIMER_COUNT = "dotnet.timer.count";
  exports.METRIC_HTTP_CLIENT_REQUEST_DURATION = "http.client.request.duration";
  exports.METRIC_HTTP_SERVER_REQUEST_DURATION = "http.server.request.duration";
  exports.METRIC_JVM_CLASS_COUNT = "jvm.class.count";
  exports.METRIC_JVM_CLASS_LOADED = "jvm.class.loaded";
  exports.METRIC_JVM_CLASS_UNLOADED = "jvm.class.unloaded";
  exports.METRIC_JVM_CPU_COUNT = "jvm.cpu.count";
  exports.METRIC_JVM_CPU_RECENT_UTILIZATION = "jvm.cpu.recent_utilization";
  exports.METRIC_JVM_CPU_TIME = "jvm.cpu.time";
  exports.METRIC_JVM_GC_DURATION = "jvm.gc.duration";
  exports.METRIC_JVM_MEMORY_COMMITTED = "jvm.memory.committed";
  exports.METRIC_JVM_MEMORY_LIMIT = "jvm.memory.limit";
  exports.METRIC_JVM_MEMORY_USED = "jvm.memory.used";
  exports.METRIC_JVM_MEMORY_USED_AFTER_LAST_GC = "jvm.memory.used_after_last_gc";
  exports.METRIC_JVM_THREAD_COUNT = "jvm.thread.count";
  exports.METRIC_KESTREL_ACTIVE_CONNECTIONS = "kestrel.active_connections";
  exports.METRIC_KESTREL_ACTIVE_TLS_HANDSHAKES = "kestrel.active_tls_handshakes";
  exports.METRIC_KESTREL_CONNECTION_DURATION = "kestrel.connection.duration";
  exports.METRIC_KESTREL_QUEUED_CONNECTIONS = "kestrel.queued_connections";
  exports.METRIC_KESTREL_QUEUED_REQUESTS = "kestrel.queued_requests";
  exports.METRIC_KESTREL_REJECTED_CONNECTIONS = "kestrel.rejected_connections";
  exports.METRIC_KESTREL_TLS_HANDSHAKE_DURATION = "kestrel.tls_handshake.duration";
  exports.METRIC_KESTREL_UPGRADED_CONNECTIONS = "kestrel.upgraded_connections";
  exports.METRIC_SIGNALR_SERVER_ACTIVE_CONNECTIONS = "signalr.server.active_connections";
  exports.METRIC_SIGNALR_SERVER_CONNECTION_DURATION = "signalr.server.connection.duration";
});

// node_modules/@opentelemetry/semantic-conventions/build/src/stable_events.js
var require_stable_events = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.EVENT_EXCEPTION = undefined;
  exports.EVENT_EXCEPTION = "exception";
});

// node_modules/@opentelemetry/semantic-conventions/build/src/index.js
var require_src7 = __commonJS((exports) => {
  var __createBinding = exports && exports.__createBinding || (Object.create ? function(o, m, k, k2) {
    if (k2 === undefined)
      k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() {
        return m[k];
      } };
    }
    Object.defineProperty(o, k2, desc);
  } : function(o, m, k, k2) {
    if (k2 === undefined)
      k2 = k;
    o[k2] = m[k];
  });
  var __exportStar = exports && exports.__exportStar || function(m, exports2) {
    for (var p in m)
      if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p))
        __createBinding(exports2, m, p);
  };
  Object.defineProperty(exports, "__esModule", { value: true });
  __exportStar(require_trace5(), exports);
  __exportStar(require_resource4(), exports);
  __exportStar(require_stable_attributes4(), exports);
  __exportStar(require_stable_metrics4(), exports);
  __exportStar(require_stable_events(), exports);
});

// src/local-client.ts
import * as net from "net";
import { randomUUID } from "crypto";

class LocalClient {
  opts;
  socket = null;
  backoffMs = 1000;
  stopped = false;
  registered = false;
  reconnectTimer = null;
  instanceID;
  socketPath;
  pending = new Map;
  buffer = "";
  constructor(opts) {
    this.opts = opts;
    this.instanceID = randomUUID();
    this.socketPath = LocalClient.getSocketPath();
  }
  static getSocketPath() {
    if (process.env.CUTHULU_SOCKET_PATH)
      return process.env.CUTHULU_SOCKET_PATH;
    const xdg = process.env.XDG_RUNTIME_DIR;
    if (xdg)
      return `${xdg}/cuthulu-plugin.sock`;
    const tmpdir = process.env.TMPDIR;
    if (tmpdir)
      return `${tmpdir}/cuthulu-plugin.sock`;
    return "/tmp/cuthulu-plugin.sock";
  }
  connect() {
    if (this.stopped)
      return;
    this.opts.logger("debug", `connecting to ${this.socketPath}`);
    const socket = net.createConnection(this.socketPath);
    this.socket = socket;
    socket.on("connect", () => {
      this.opts.logger("debug", "socket connected, registering");
      this.registered = false;
      this.backoffMs = 1000;
      this.sendRegister().then(() => {
        this.registered = true;
        return this.opts.onConnect?.();
      }).catch((err) => {
        this.opts.logger("error", "register failed", { error: String(err) });
        socket.destroy();
      });
    });
    socket.on("data", (chunk) => {
      this.buffer += chunk.toString();
      let newlineIdx;
      while ((newlineIdx = this.buffer.indexOf(`
`)) !== -1) {
        const line = this.buffer.slice(0, newlineIdx);
        this.buffer = this.buffer.slice(newlineIdx + 1);
        if (line.trim())
          this.handleMessage(line.trim());
      }
    });
    socket.on("close", () => {
      this.opts.logger("debug", "socket closed, scheduling reconnect");
      this.registered = false;
      this.socket = null;
      this.rejectAllPending("socket closed");
      this.scheduleReconnect();
    });
    socket.on("error", (err) => {
      this.opts.logger("warn", "socket error", { error: err.message });
    });
  }
  handleMessage(line) {
    try {
      const msg = JSON.parse(line);
      if (msg.type === "ack" && msg.requestId) {
        const p = this.pending.get(msg.requestId);
        if (p) {
          this.pending.delete(msg.requestId);
          clearTimeout(p.timer);
          if (msg.ok) {
            p.resolve();
          } else {
            p.reject(new Error(msg.error || "server rejected request"));
          }
        }
      } else if (msg.type === "command") {
        this.opts.onCommand(msg).catch((err) => {
          this.opts.logger("error", "onCommand error", { error: String(err) });
        });
      }
    } catch (err) {
      this.opts.logger("error", "failed to handle message", { error: String(err) });
    }
  }
  sendWithAck(msg) {
    return new Promise((resolve, reject) => {
      if (!this.socket || this.socket.destroyed) {
        reject(new Error("not connected"));
        return;
      }
      const requestId = msg.requestId;
      const timer = setTimeout(() => {
        this.pending.delete(requestId);
        reject(new Error("request timeout"));
      }, 5000);
      this.pending.set(requestId, { resolve, reject, timer });
      this.socket.write(JSON.stringify(msg) + `
`);
    });
  }
  async sendRegister() {
    return this.sendWithAck({
      requestId: randomUUID(),
      type: "register",
      instanceId: this.instanceID,
      pid: process.pid,
      projectDir: this.opts.projectDir,
      opencodeUrl: this.opts.opencodeUrl,
      hostname: this.opts.hostname,
      tmuxSession: this.opts.tmuxSession,
      tmuxWindow: this.opts.tmuxWindow,
      tmuxPane: this.opts.tmuxPane
    });
  }
  isConnected() {
    return this.socket !== null && !this.socket.destroyed;
  }
  sendEvent(eventType, data) {
    if (!this.registered)
      return;
    if (!this.socket || this.socket.destroyed)
      return;
    try {
      const msg = {
        requestId: randomUUID(),
        type: "event",
        instanceId: this.instanceID,
        eventType,
        data
      };
      this.socket.write(JSON.stringify(msg) + `
`);
    } catch (err) {
      this.opts.logger("error", "sendEvent error", { error: String(err) });
    }
  }
  disconnect() {
    this.stopped = true;
    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.rejectAllPending("client disconnecting");
    if (this.socket !== null) {
      try {
        this.socket.destroy();
      } catch {}
      this.socket = null;
    }
  }
  rejectAllPending(reason) {
    for (const [id, p] of this.pending) {
      clearTimeout(p.timer);
      p.reject(new Error(reason));
    }
    this.pending.clear();
  }
  scheduleReconnect() {
    if (this.stopped || this.reconnectTimer !== null)
      return;
    const delay = this.backoffMs;
    this.backoffMs = Math.min(this.backoffMs * 2, 60000);
    this.opts.logger("debug", `reconnecting in ${delay}ms`);
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }
}

// src/commands.ts
var traceParentCache = new Map;
function getTraceParent(sessionID) {
  return traceParentCache.get(sessionID);
}
function makeCommandHandler(opts) {
  return async (cmd) => {
    try {
      switch (cmd.payload) {
        case "sendMessage": {
          if (!cmd.sessionId)
            return;
          const text = cmd.sendMessage?.text ?? "";
          const newSession = cmd.sendMessage?.newSession ?? false;
          const agent = cmd.sendMessage?.agent ?? "";
          const modelId = cmd.sendMessage?.modelId ?? "";
          const providerId = cmd.sendMessage?.providerId ?? "";
          let targetSessionId = cmd.sessionId;
          if (newSession) {
            const created = await opts.client.session.create();
            if (created.error) {
              opts.logger("error", "create-session failed", { error: created.error });
              break;
            }
            targetSessionId = created.data?.id ?? cmd.sessionId;
          }
          const res = await opts.client.session.promptAsync({
            path: { id: targetSessionId },
            body: {
              parts: [{ type: "text", text }],
              agent: agent || undefined,
              model: modelId && providerId ? { modelID: modelId, providerID: providerId } : undefined
            }
          });
          if (res.error) {
            opts.logger("error", "send-message failed", { error: res.error });
          }
          break;
        }
        case "abort": {
          if (!cmd.sessionId)
            return;
          const res = await opts.client.session.abort({
            path: { id: cmd.sessionId }
          });
          if (res.error) {
            opts.logger("error", "abort failed", { error: res.error });
          }
          break;
        }
        case "permit": {
          if (!cmd.sessionId)
            return;
          const permissionId = cmd.permit?.permissionId ?? "";
          const allow = cmd.permit?.allow ?? false;
          const always = cmd.permit?.always ?? false;
          const response = always ? "always" : allow ? "once" : "reject";
          const res = await opts.client.postSessionIdPermissionsPermissionId({
            path: { id: cmd.sessionId, permissionID: permissionId },
            body: { response }
          });
          if (res.error) {
            opts.logger("error", "permission-response failed", { error: res.error });
          }
          break;
        }
        case "respondQuestion": {
          const requestId = cmd.respondQuestion?.requestId ?? "";
          const reject = cmd.respondQuestion?.reject ?? false;
          const inner = opts.client._client;
          if (reject) {
            const res = await inner.post({
              url: "/question/{requestID}/reject",
              path: { requestID: requestId }
            });
            if (res.error) {
              opts.logger("error", "question-reject failed", { error: res.error });
            }
          } else {
            const rawAnswers = cmd.respondQuestion?.answers ?? [];
            const answers = rawAnswers.map((a) => {
              try {
                return JSON.parse(a);
              } catch {
                return [a];
              }
            });
            const res = await inner.post({
              url: "/question/{requestID}/reply",
              path: { requestID: requestId },
              body: { answers },
              headers: { "Content-Type": "application/json" }
            });
            if (res.error) {
              opts.logger("error", "question-reply failed", { error: res.error });
            }
          }
          break;
        }
        case "setTraceParent": {
          const sessionId = cmd.setTraceParent?.sessionId ?? "";
          const traceparent = cmd.setTraceParent?.traceparent ?? "";
          if (sessionId && traceparent) {
            traceParentCache.set(sessionId, traceparent);
          }
          break;
        }
        default:
          opts.logger("warn", `unknown command payload: ${cmd.payload}`);
      }
    } catch (err) {
      opts.logger("error", "command handler error", { error: String(err) });
    }
  };
}

// node_modules/@opentelemetry/sdk-trace-base/build/esm/Tracer.js
var api = __toESM(require_src(), 1);
var import_core6 = __toESM(require_src3(), 1);

// node_modules/@opentelemetry/sdk-trace-base/build/esm/Span.js
var import_api = __toESM(require_src(), 1);
var import_core = __toESM(require_src3(), 1);
var import_semantic_conventions = __toESM(require_src4(), 1);

// node_modules/@opentelemetry/sdk-trace-base/build/esm/enums.js
var ExceptionEventName = "exception";

// node_modules/@opentelemetry/sdk-trace-base/build/esm/Span.js
var __assign = function() {
  __assign = Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length;i < n; i++) {
      s = arguments[i];
      for (var p in s)
        if (Object.prototype.hasOwnProperty.call(s, p))
          t[p] = s[p];
    }
    return t;
  };
  return __assign.apply(this, arguments);
};
var __values = function(o) {
  var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
  if (m)
    return m.call(o);
  if (o && typeof o.length === "number")
    return {
      next: function() {
        if (o && i >= o.length)
          o = undefined;
        return { value: o && o[i++], done: !o };
      }
    };
  throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
var __read = function(o, n) {
  var m = typeof Symbol === "function" && o[Symbol.iterator];
  if (!m)
    return o;
  var i = m.call(o), r, ar = [], e;
  try {
    while ((n === undefined || n-- > 0) && !(r = i.next()).done)
      ar.push(r.value);
  } catch (error) {
    e = { error };
  } finally {
    try {
      if (r && !r.done && (m = i["return"]))
        m.call(i);
    } finally {
      if (e)
        throw e.error;
    }
  }
  return ar;
};
var __spreadArray = function(to, from, pack) {
  if (pack || arguments.length === 2)
    for (var i = 0, l = from.length, ar;i < l; i++) {
      if (ar || !(i in from)) {
        if (!ar)
          ar = Array.prototype.slice.call(from, 0, i);
        ar[i] = from[i];
      }
    }
  return to.concat(ar || Array.prototype.slice.call(from));
};
var Span = function() {
  function Span2(parentTracer, context, spanName, spanContext, kind, parentSpanId, links, startTime, _deprecatedClock, attributes) {
    if (links === undefined) {
      links = [];
    }
    this.attributes = {};
    this.links = [];
    this.events = [];
    this._droppedAttributesCount = 0;
    this._droppedEventsCount = 0;
    this._droppedLinksCount = 0;
    this.status = {
      code: import_api.SpanStatusCode.UNSET
    };
    this.endTime = [0, 0];
    this._ended = false;
    this._duration = [-1, -1];
    this.name = spanName;
    this._spanContext = spanContext;
    this.parentSpanId = parentSpanId;
    this.kind = kind;
    this.links = links;
    var now = Date.now();
    this._performanceStartTime = import_core.otperformance.now();
    this._performanceOffset = now - (this._performanceStartTime + import_core.getTimeOrigin());
    this._startTimeProvided = startTime != null;
    this.startTime = this._getTime(startTime !== null && startTime !== undefined ? startTime : now);
    this.resource = parentTracer.resource;
    this.instrumentationLibrary = parentTracer.instrumentationLibrary;
    this._spanLimits = parentTracer.getSpanLimits();
    this._attributeValueLengthLimit = this._spanLimits.attributeValueLengthLimit || 0;
    if (attributes != null) {
      this.setAttributes(attributes);
    }
    this._spanProcessor = parentTracer.getActiveSpanProcessor();
    this._spanProcessor.onStart(this, context);
  }
  Span2.prototype.spanContext = function() {
    return this._spanContext;
  };
  Span2.prototype.setAttribute = function(key, value) {
    if (value == null || this._isSpanEnded())
      return this;
    if (key.length === 0) {
      import_api.diag.warn("Invalid attribute key: " + key);
      return this;
    }
    if (!import_core.isAttributeValue(value)) {
      import_api.diag.warn("Invalid attribute value set for key: " + key);
      return this;
    }
    if (Object.keys(this.attributes).length >= this._spanLimits.attributeCountLimit && !Object.prototype.hasOwnProperty.call(this.attributes, key)) {
      this._droppedAttributesCount++;
      return this;
    }
    this.attributes[key] = this._truncateToSize(value);
    return this;
  };
  Span2.prototype.setAttributes = function(attributes) {
    var e_1, _a;
    try {
      for (var _b = __values(Object.entries(attributes)), _c = _b.next();!_c.done; _c = _b.next()) {
        var _d = __read(_c.value, 2), k = _d[0], v = _d[1];
        this.setAttribute(k, v);
      }
    } catch (e_1_1) {
      e_1 = { error: e_1_1 };
    } finally {
      try {
        if (_c && !_c.done && (_a = _b.return))
          _a.call(_b);
      } finally {
        if (e_1)
          throw e_1.error;
      }
    }
    return this;
  };
  Span2.prototype.addEvent = function(name, attributesOrStartTime, timeStamp) {
    if (this._isSpanEnded())
      return this;
    if (this._spanLimits.eventCountLimit === 0) {
      import_api.diag.warn("No events allowed.");
      this._droppedEventsCount++;
      return this;
    }
    if (this.events.length >= this._spanLimits.eventCountLimit) {
      if (this._droppedEventsCount === 0) {
        import_api.diag.debug("Dropping extra events.");
      }
      this.events.shift();
      this._droppedEventsCount++;
    }
    if (import_core.isTimeInput(attributesOrStartTime)) {
      if (!import_core.isTimeInput(timeStamp)) {
        timeStamp = attributesOrStartTime;
      }
      attributesOrStartTime = undefined;
    }
    var attributes = import_core.sanitizeAttributes(attributesOrStartTime);
    this.events.push({
      name,
      attributes,
      time: this._getTime(timeStamp),
      droppedAttributesCount: 0
    });
    return this;
  };
  Span2.prototype.addLink = function(link) {
    this.links.push(link);
    return this;
  };
  Span2.prototype.addLinks = function(links) {
    var _a;
    (_a = this.links).push.apply(_a, __spreadArray([], __read(links), false));
    return this;
  };
  Span2.prototype.setStatus = function(status) {
    if (this._isSpanEnded())
      return this;
    this.status = __assign({}, status);
    if (this.status.message != null && typeof status.message !== "string") {
      import_api.diag.warn("Dropping invalid status.message of type '" + typeof status.message + "', expected 'string'");
      delete this.status.message;
    }
    return this;
  };
  Span2.prototype.updateName = function(name) {
    if (this._isSpanEnded())
      return this;
    this.name = name;
    return this;
  };
  Span2.prototype.end = function(endTime) {
    if (this._isSpanEnded()) {
      import_api.diag.error(this.name + " " + this._spanContext.traceId + "-" + this._spanContext.spanId + " - You can only call end() on a span once.");
      return;
    }
    this._ended = true;
    this.endTime = this._getTime(endTime);
    this._duration = import_core.hrTimeDuration(this.startTime, this.endTime);
    if (this._duration[0] < 0) {
      import_api.diag.warn("Inconsistent start and end time, startTime > endTime. Setting span duration to 0ms.", this.startTime, this.endTime);
      this.endTime = this.startTime.slice();
      this._duration = [0, 0];
    }
    if (this._droppedEventsCount > 0) {
      import_api.diag.warn("Dropped " + this._droppedEventsCount + " events because eventCountLimit reached");
    }
    this._spanProcessor.onEnd(this);
  };
  Span2.prototype._getTime = function(inp) {
    if (typeof inp === "number" && inp <= import_core.otperformance.now()) {
      return import_core.hrTime(inp + this._performanceOffset);
    }
    if (typeof inp === "number") {
      return import_core.millisToHrTime(inp);
    }
    if (inp instanceof Date) {
      return import_core.millisToHrTime(inp.getTime());
    }
    if (import_core.isTimeInputHrTime(inp)) {
      return inp;
    }
    if (this._startTimeProvided) {
      return import_core.millisToHrTime(Date.now());
    }
    var msDuration = import_core.otperformance.now() - this._performanceStartTime;
    return import_core.addHrTimes(this.startTime, import_core.millisToHrTime(msDuration));
  };
  Span2.prototype.isRecording = function() {
    return this._ended === false;
  };
  Span2.prototype.recordException = function(exception, time) {
    var attributes = {};
    if (typeof exception === "string") {
      attributes[import_semantic_conventions.SEMATTRS_EXCEPTION_MESSAGE] = exception;
    } else if (exception) {
      if (exception.code) {
        attributes[import_semantic_conventions.SEMATTRS_EXCEPTION_TYPE] = exception.code.toString();
      } else if (exception.name) {
        attributes[import_semantic_conventions.SEMATTRS_EXCEPTION_TYPE] = exception.name;
      }
      if (exception.message) {
        attributes[import_semantic_conventions.SEMATTRS_EXCEPTION_MESSAGE] = exception.message;
      }
      if (exception.stack) {
        attributes[import_semantic_conventions.SEMATTRS_EXCEPTION_STACKTRACE] = exception.stack;
      }
    }
    if (attributes[import_semantic_conventions.SEMATTRS_EXCEPTION_TYPE] || attributes[import_semantic_conventions.SEMATTRS_EXCEPTION_MESSAGE]) {
      this.addEvent(ExceptionEventName, attributes, time);
    } else {
      import_api.diag.warn("Failed to record an exception " + exception);
    }
  };
  Object.defineProperty(Span2.prototype, "duration", {
    get: function() {
      return this._duration;
    },
    enumerable: false,
    configurable: true
  });
  Object.defineProperty(Span2.prototype, "ended", {
    get: function() {
      return this._ended;
    },
    enumerable: false,
    configurable: true
  });
  Object.defineProperty(Span2.prototype, "droppedAttributesCount", {
    get: function() {
      return this._droppedAttributesCount;
    },
    enumerable: false,
    configurable: true
  });
  Object.defineProperty(Span2.prototype, "droppedEventsCount", {
    get: function() {
      return this._droppedEventsCount;
    },
    enumerable: false,
    configurable: true
  });
  Object.defineProperty(Span2.prototype, "droppedLinksCount", {
    get: function() {
      return this._droppedLinksCount;
    },
    enumerable: false,
    configurable: true
  });
  Span2.prototype._isSpanEnded = function() {
    if (this._ended) {
      import_api.diag.warn("Can not execute the operation on ended Span {traceId: " + this._spanContext.traceId + ", spanId: " + this._spanContext.spanId + "}");
    }
    return this._ended;
  };
  Span2.prototype._truncateToLimitUtil = function(value, limit) {
    if (value.length <= limit) {
      return value;
    }
    return value.substring(0, limit);
  };
  Span2.prototype._truncateToSize = function(value) {
    var _this = this;
    var limit = this._attributeValueLengthLimit;
    if (limit <= 0) {
      import_api.diag.warn("Attribute value limit must be positive, got " + limit);
      return value;
    }
    if (typeof value === "string") {
      return this._truncateToLimitUtil(value, limit);
    }
    if (Array.isArray(value)) {
      return value.map(function(val) {
        return typeof val === "string" ? _this._truncateToLimitUtil(val, limit) : val;
      });
    }
    return value;
  };
  return Span2;
}();

// node_modules/@opentelemetry/sdk-trace-base/build/esm/config.js
var import_api4 = __toESM(require_src(), 1);
var import_core3 = __toESM(require_src3(), 1);

// node_modules/@opentelemetry/sdk-trace-base/build/esm/Sampler.js
var SamplingDecision;
(function(SamplingDecision2) {
  SamplingDecision2[SamplingDecision2["NOT_RECORD"] = 0] = "NOT_RECORD";
  SamplingDecision2[SamplingDecision2["RECORD"] = 1] = "RECORD";
  SamplingDecision2[SamplingDecision2["RECORD_AND_SAMPLED"] = 2] = "RECORD_AND_SAMPLED";
})(SamplingDecision || (SamplingDecision = {}));

// node_modules/@opentelemetry/sdk-trace-base/build/esm/sampler/AlwaysOffSampler.js
var AlwaysOffSampler = function() {
  function AlwaysOffSampler2() {}
  AlwaysOffSampler2.prototype.shouldSample = function() {
    return {
      decision: SamplingDecision.NOT_RECORD
    };
  };
  AlwaysOffSampler2.prototype.toString = function() {
    return "AlwaysOffSampler";
  };
  return AlwaysOffSampler2;
}();

// node_modules/@opentelemetry/sdk-trace-base/build/esm/sampler/AlwaysOnSampler.js
var AlwaysOnSampler = function() {
  function AlwaysOnSampler2() {}
  AlwaysOnSampler2.prototype.shouldSample = function() {
    return {
      decision: SamplingDecision.RECORD_AND_SAMPLED
    };
  };
  AlwaysOnSampler2.prototype.toString = function() {
    return "AlwaysOnSampler";
  };
  return AlwaysOnSampler2;
}();

// node_modules/@opentelemetry/sdk-trace-base/build/esm/sampler/ParentBasedSampler.js
var import_api2 = __toESM(require_src(), 1);
var import_core2 = __toESM(require_src3(), 1);
var ParentBasedSampler = function() {
  function ParentBasedSampler2(config) {
    var _a, _b, _c, _d;
    this._root = config.root;
    if (!this._root) {
      import_core2.globalErrorHandler(new Error("ParentBasedSampler must have a root sampler configured"));
      this._root = new AlwaysOnSampler;
    }
    this._remoteParentSampled = (_a = config.remoteParentSampled) !== null && _a !== undefined ? _a : new AlwaysOnSampler;
    this._remoteParentNotSampled = (_b = config.remoteParentNotSampled) !== null && _b !== undefined ? _b : new AlwaysOffSampler;
    this._localParentSampled = (_c = config.localParentSampled) !== null && _c !== undefined ? _c : new AlwaysOnSampler;
    this._localParentNotSampled = (_d = config.localParentNotSampled) !== null && _d !== undefined ? _d : new AlwaysOffSampler;
  }
  ParentBasedSampler2.prototype.shouldSample = function(context, traceId, spanName, spanKind, attributes, links) {
    var parentContext = import_api2.trace.getSpanContext(context);
    if (!parentContext || !import_api2.isSpanContextValid(parentContext)) {
      return this._root.shouldSample(context, traceId, spanName, spanKind, attributes, links);
    }
    if (parentContext.isRemote) {
      if (parentContext.traceFlags & import_api2.TraceFlags.SAMPLED) {
        return this._remoteParentSampled.shouldSample(context, traceId, spanName, spanKind, attributes, links);
      }
      return this._remoteParentNotSampled.shouldSample(context, traceId, spanName, spanKind, attributes, links);
    }
    if (parentContext.traceFlags & import_api2.TraceFlags.SAMPLED) {
      return this._localParentSampled.shouldSample(context, traceId, spanName, spanKind, attributes, links);
    }
    return this._localParentNotSampled.shouldSample(context, traceId, spanName, spanKind, attributes, links);
  };
  ParentBasedSampler2.prototype.toString = function() {
    return "ParentBased{root=" + this._root.toString() + ", remoteParentSampled=" + this._remoteParentSampled.toString() + ", remoteParentNotSampled=" + this._remoteParentNotSampled.toString() + ", localParentSampled=" + this._localParentSampled.toString() + ", localParentNotSampled=" + this._localParentNotSampled.toString() + "}";
  };
  return ParentBasedSampler2;
}();

// node_modules/@opentelemetry/sdk-trace-base/build/esm/sampler/TraceIdRatioBasedSampler.js
var import_api3 = __toESM(require_src(), 1);
var TraceIdRatioBasedSampler = function() {
  function TraceIdRatioBasedSampler2(_ratio) {
    if (_ratio === undefined) {
      _ratio = 0;
    }
    this._ratio = _ratio;
    this._ratio = this._normalize(_ratio);
    this._upperBound = Math.floor(this._ratio * 4294967295);
  }
  TraceIdRatioBasedSampler2.prototype.shouldSample = function(context, traceId) {
    return {
      decision: import_api3.isValidTraceId(traceId) && this._accumulate(traceId) < this._upperBound ? SamplingDecision.RECORD_AND_SAMPLED : SamplingDecision.NOT_RECORD
    };
  };
  TraceIdRatioBasedSampler2.prototype.toString = function() {
    return "TraceIdRatioBased{" + this._ratio + "}";
  };
  TraceIdRatioBasedSampler2.prototype._normalize = function(ratio) {
    if (typeof ratio !== "number" || isNaN(ratio))
      return 0;
    return ratio >= 1 ? 1 : ratio <= 0 ? 0 : ratio;
  };
  TraceIdRatioBasedSampler2.prototype._accumulate = function(traceId) {
    var accumulation = 0;
    for (var i = 0;i < traceId.length / 8; i++) {
      var pos = i * 8;
      var part = parseInt(traceId.slice(pos, pos + 8), 16);
      accumulation = (accumulation ^ part) >>> 0;
    }
    return accumulation;
  };
  return TraceIdRatioBasedSampler2;
}();

// node_modules/@opentelemetry/sdk-trace-base/build/esm/config.js
var FALLBACK_OTEL_TRACES_SAMPLER = import_core3.TracesSamplerValues.AlwaysOn;
var DEFAULT_RATIO = 1;
function loadDefaultConfig() {
  var env = import_core3.getEnv();
  return {
    sampler: buildSamplerFromEnv(env),
    forceFlushTimeoutMillis: 30000,
    generalLimits: {
      attributeValueLengthLimit: env.OTEL_ATTRIBUTE_VALUE_LENGTH_LIMIT,
      attributeCountLimit: env.OTEL_ATTRIBUTE_COUNT_LIMIT
    },
    spanLimits: {
      attributeValueLengthLimit: env.OTEL_SPAN_ATTRIBUTE_VALUE_LENGTH_LIMIT,
      attributeCountLimit: env.OTEL_SPAN_ATTRIBUTE_COUNT_LIMIT,
      linkCountLimit: env.OTEL_SPAN_LINK_COUNT_LIMIT,
      eventCountLimit: env.OTEL_SPAN_EVENT_COUNT_LIMIT,
      attributePerEventCountLimit: env.OTEL_SPAN_ATTRIBUTE_PER_EVENT_COUNT_LIMIT,
      attributePerLinkCountLimit: env.OTEL_SPAN_ATTRIBUTE_PER_LINK_COUNT_LIMIT
    },
    mergeResourceWithDefaults: true
  };
}
function buildSamplerFromEnv(environment) {
  if (environment === undefined) {
    environment = import_core3.getEnv();
  }
  switch (environment.OTEL_TRACES_SAMPLER) {
    case import_core3.TracesSamplerValues.AlwaysOn:
      return new AlwaysOnSampler;
    case import_core3.TracesSamplerValues.AlwaysOff:
      return new AlwaysOffSampler;
    case import_core3.TracesSamplerValues.ParentBasedAlwaysOn:
      return new ParentBasedSampler({
        root: new AlwaysOnSampler
      });
    case import_core3.TracesSamplerValues.ParentBasedAlwaysOff:
      return new ParentBasedSampler({
        root: new AlwaysOffSampler
      });
    case import_core3.TracesSamplerValues.TraceIdRatio:
      return new TraceIdRatioBasedSampler(getSamplerProbabilityFromEnv(environment));
    case import_core3.TracesSamplerValues.ParentBasedTraceIdRatio:
      return new ParentBasedSampler({
        root: new TraceIdRatioBasedSampler(getSamplerProbabilityFromEnv(environment))
      });
    default:
      import_api4.diag.error('OTEL_TRACES_SAMPLER value "' + environment.OTEL_TRACES_SAMPLER + " invalid, defaulting to " + FALLBACK_OTEL_TRACES_SAMPLER + '".');
      return new AlwaysOnSampler;
  }
}
function getSamplerProbabilityFromEnv(environment) {
  if (environment.OTEL_TRACES_SAMPLER_ARG === undefined || environment.OTEL_TRACES_SAMPLER_ARG === "") {
    import_api4.diag.error("OTEL_TRACES_SAMPLER_ARG is blank, defaulting to " + DEFAULT_RATIO + ".");
    return DEFAULT_RATIO;
  }
  var probability = Number(environment.OTEL_TRACES_SAMPLER_ARG);
  if (isNaN(probability)) {
    import_api4.diag.error("OTEL_TRACES_SAMPLER_ARG=" + environment.OTEL_TRACES_SAMPLER_ARG + " was given, but it is invalid, defaulting to " + DEFAULT_RATIO + ".");
    return DEFAULT_RATIO;
  }
  if (probability < 0 || probability > 1) {
    import_api4.diag.error("OTEL_TRACES_SAMPLER_ARG=" + environment.OTEL_TRACES_SAMPLER_ARG + " was given, but it is out of range ([0..1]), defaulting to " + DEFAULT_RATIO + ".");
    return DEFAULT_RATIO;
  }
  return probability;
}

// node_modules/@opentelemetry/sdk-trace-base/build/esm/utility.js
var import_core4 = __toESM(require_src3(), 1);
function mergeConfig(userConfig) {
  var perInstanceDefaults = {
    sampler: buildSamplerFromEnv()
  };
  var DEFAULT_CONFIG = loadDefaultConfig();
  var target = Object.assign({}, DEFAULT_CONFIG, perInstanceDefaults, userConfig);
  target.generalLimits = Object.assign({}, DEFAULT_CONFIG.generalLimits, userConfig.generalLimits || {});
  target.spanLimits = Object.assign({}, DEFAULT_CONFIG.spanLimits, userConfig.spanLimits || {});
  return target;
}
function reconfigureLimits(userConfig) {
  var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
  var spanLimits = Object.assign({}, userConfig.spanLimits);
  var parsedEnvConfig = import_core4.getEnvWithoutDefaults();
  spanLimits.attributeCountLimit = (_f = (_e = (_d = (_b = (_a = userConfig.spanLimits) === null || _a === undefined ? undefined : _a.attributeCountLimit) !== null && _b !== undefined ? _b : (_c = userConfig.generalLimits) === null || _c === undefined ? undefined : _c.attributeCountLimit) !== null && _d !== undefined ? _d : parsedEnvConfig.OTEL_SPAN_ATTRIBUTE_COUNT_LIMIT) !== null && _e !== undefined ? _e : parsedEnvConfig.OTEL_ATTRIBUTE_COUNT_LIMIT) !== null && _f !== undefined ? _f : import_core4.DEFAULT_ATTRIBUTE_COUNT_LIMIT;
  spanLimits.attributeValueLengthLimit = (_m = (_l = (_k = (_h = (_g = userConfig.spanLimits) === null || _g === undefined ? undefined : _g.attributeValueLengthLimit) !== null && _h !== undefined ? _h : (_j = userConfig.generalLimits) === null || _j === undefined ? undefined : _j.attributeValueLengthLimit) !== null && _k !== undefined ? _k : parsedEnvConfig.OTEL_SPAN_ATTRIBUTE_VALUE_LENGTH_LIMIT) !== null && _l !== undefined ? _l : parsedEnvConfig.OTEL_ATTRIBUTE_VALUE_LENGTH_LIMIT) !== null && _m !== undefined ? _m : import_core4.DEFAULT_ATTRIBUTE_VALUE_LENGTH_LIMIT;
  return Object.assign({}, userConfig, { spanLimits });
}

// node_modules/@opentelemetry/sdk-trace-base/build/esm/export/BatchSpanProcessorBase.js
var import_api5 = __toESM(require_src(), 1);
var import_core5 = __toESM(require_src3(), 1);
var BatchSpanProcessorBase = function() {
  function BatchSpanProcessorBase2(_exporter, config) {
    this._exporter = _exporter;
    this._isExporting = false;
    this._finishedSpans = [];
    this._droppedSpansCount = 0;
    var env = import_core5.getEnv();
    this._maxExportBatchSize = typeof (config === null || config === undefined ? undefined : config.maxExportBatchSize) === "number" ? config.maxExportBatchSize : env.OTEL_BSP_MAX_EXPORT_BATCH_SIZE;
    this._maxQueueSize = typeof (config === null || config === undefined ? undefined : config.maxQueueSize) === "number" ? config.maxQueueSize : env.OTEL_BSP_MAX_QUEUE_SIZE;
    this._scheduledDelayMillis = typeof (config === null || config === undefined ? undefined : config.scheduledDelayMillis) === "number" ? config.scheduledDelayMillis : env.OTEL_BSP_SCHEDULE_DELAY;
    this._exportTimeoutMillis = typeof (config === null || config === undefined ? undefined : config.exportTimeoutMillis) === "number" ? config.exportTimeoutMillis : env.OTEL_BSP_EXPORT_TIMEOUT;
    this._shutdownOnce = new import_core5.BindOnceFuture(this._shutdown, this);
    if (this._maxExportBatchSize > this._maxQueueSize) {
      import_api5.diag.warn("BatchSpanProcessor: maxExportBatchSize must be smaller or equal to maxQueueSize, setting maxExportBatchSize to match maxQueueSize");
      this._maxExportBatchSize = this._maxQueueSize;
    }
  }
  BatchSpanProcessorBase2.prototype.forceFlush = function() {
    if (this._shutdownOnce.isCalled) {
      return this._shutdownOnce.promise;
    }
    return this._flushAll();
  };
  BatchSpanProcessorBase2.prototype.onStart = function(_span, _parentContext) {};
  BatchSpanProcessorBase2.prototype.onEnd = function(span) {
    if (this._shutdownOnce.isCalled) {
      return;
    }
    if ((span.spanContext().traceFlags & import_api5.TraceFlags.SAMPLED) === 0) {
      return;
    }
    this._addToBuffer(span);
  };
  BatchSpanProcessorBase2.prototype.shutdown = function() {
    return this._shutdownOnce.call();
  };
  BatchSpanProcessorBase2.prototype._shutdown = function() {
    var _this = this;
    return Promise.resolve().then(function() {
      return _this.onShutdown();
    }).then(function() {
      return _this._flushAll();
    }).then(function() {
      return _this._exporter.shutdown();
    });
  };
  BatchSpanProcessorBase2.prototype._addToBuffer = function(span) {
    if (this._finishedSpans.length >= this._maxQueueSize) {
      if (this._droppedSpansCount === 0) {
        import_api5.diag.debug("maxQueueSize reached, dropping spans");
      }
      this._droppedSpansCount++;
      return;
    }
    if (this._droppedSpansCount > 0) {
      import_api5.diag.warn("Dropped " + this._droppedSpansCount + " spans because maxQueueSize reached");
      this._droppedSpansCount = 0;
    }
    this._finishedSpans.push(span);
    this._maybeStartTimer();
  };
  BatchSpanProcessorBase2.prototype._flushAll = function() {
    var _this = this;
    return new Promise(function(resolve, reject) {
      var promises = [];
      var count = Math.ceil(_this._finishedSpans.length / _this._maxExportBatchSize);
      for (var i = 0, j = count;i < j; i++) {
        promises.push(_this._flushOneBatch());
      }
      Promise.all(promises).then(function() {
        resolve();
      }).catch(reject);
    });
  };
  BatchSpanProcessorBase2.prototype._flushOneBatch = function() {
    var _this = this;
    this._clearTimer();
    if (this._finishedSpans.length === 0) {
      return Promise.resolve();
    }
    return new Promise(function(resolve, reject) {
      var timer = setTimeout(function() {
        reject(new Error("Timeout"));
      }, _this._exportTimeoutMillis);
      import_api5.context.with(import_core5.suppressTracing(import_api5.context.active()), function() {
        var spans;
        if (_this._finishedSpans.length <= _this._maxExportBatchSize) {
          spans = _this._finishedSpans;
          _this._finishedSpans = [];
        } else {
          spans = _this._finishedSpans.splice(0, _this._maxExportBatchSize);
        }
        var doExport = function() {
          return _this._exporter.export(spans, function(result) {
            var _a;
            clearTimeout(timer);
            if (result.code === import_core5.ExportResultCode.SUCCESS) {
              resolve();
            } else {
              reject((_a = result.error) !== null && _a !== undefined ? _a : new Error("BatchSpanProcessor: span export failed"));
            }
          });
        };
        var pendingResources = null;
        for (var i = 0, len = spans.length;i < len; i++) {
          var span = spans[i];
          if (span.resource.asyncAttributesPending && span.resource.waitForAsyncAttributes) {
            pendingResources !== null && pendingResources !== undefined || (pendingResources = []);
            pendingResources.push(span.resource.waitForAsyncAttributes());
          }
        }
        if (pendingResources === null) {
          doExport();
        } else {
          Promise.all(pendingResources).then(doExport, function(err) {
            import_core5.globalErrorHandler(err);
            reject(err);
          });
        }
      });
    });
  };
  BatchSpanProcessorBase2.prototype._maybeStartTimer = function() {
    var _this = this;
    if (this._isExporting)
      return;
    var flush = function() {
      _this._isExporting = true;
      _this._flushOneBatch().finally(function() {
        _this._isExporting = false;
        if (_this._finishedSpans.length > 0) {
          _this._clearTimer();
          _this._maybeStartTimer();
        }
      }).catch(function(e) {
        _this._isExporting = false;
        import_core5.globalErrorHandler(e);
      });
    };
    if (this._finishedSpans.length >= this._maxExportBatchSize) {
      return flush();
    }
    if (this._timer !== undefined)
      return;
    this._timer = setTimeout(function() {
      return flush();
    }, this._scheduledDelayMillis);
    import_core5.unrefTimer(this._timer);
  };
  BatchSpanProcessorBase2.prototype._clearTimer = function() {
    if (this._timer !== undefined) {
      clearTimeout(this._timer);
      this._timer = undefined;
    }
  };
  return BatchSpanProcessorBase2;
}();

// node_modules/@opentelemetry/sdk-trace-base/build/esm/platform/node/export/BatchSpanProcessor.js
var __extends = function() {
  var extendStatics = function(d, b) {
    extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d2, b2) {
      d2.__proto__ = b2;
    } || function(d2, b2) {
      for (var p in b2)
        if (Object.prototype.hasOwnProperty.call(b2, p))
          d2[p] = b2[p];
    };
    return extendStatics(d, b);
  };
  return function(d, b) {
    if (typeof b !== "function" && b !== null)
      throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
    extendStatics(d, b);
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __);
  };
}();
var BatchSpanProcessor = function(_super) {
  __extends(BatchSpanProcessor2, _super);
  function BatchSpanProcessor2() {
    return _super !== null && _super.apply(this, arguments) || this;
  }
  BatchSpanProcessor2.prototype.onShutdown = function() {};
  return BatchSpanProcessor2;
}(BatchSpanProcessorBase);
// node_modules/@opentelemetry/sdk-trace-base/build/esm/platform/node/RandomIdGenerator.js
var SPAN_ID_BYTES = 8;
var TRACE_ID_BYTES = 16;
var RandomIdGenerator = function() {
  function RandomIdGenerator2() {
    this.generateTraceId = getIdGenerator(TRACE_ID_BYTES);
    this.generateSpanId = getIdGenerator(SPAN_ID_BYTES);
  }
  return RandomIdGenerator2;
}();
var SHARED_BUFFER = Buffer.allocUnsafe(TRACE_ID_BYTES);
function getIdGenerator(bytes) {
  return function generateId() {
    for (var i = 0;i < bytes / 4; i++) {
      SHARED_BUFFER.writeUInt32BE(Math.random() * Math.pow(2, 32) >>> 0, i * 4);
    }
    for (var i = 0;i < bytes; i++) {
      if (SHARED_BUFFER[i] > 0) {
        break;
      } else if (i === bytes - 1) {
        SHARED_BUFFER[bytes - 1] = 1;
      }
    }
    return SHARED_BUFFER.toString("hex", 0, bytes);
  };
}
// node_modules/@opentelemetry/sdk-trace-base/build/esm/Tracer.js
var Tracer = function() {
  function Tracer2(instrumentationLibrary, config, _tracerProvider) {
    this._tracerProvider = _tracerProvider;
    var localConfig = mergeConfig(config);
    this._sampler = localConfig.sampler;
    this._generalLimits = localConfig.generalLimits;
    this._spanLimits = localConfig.spanLimits;
    this._idGenerator = config.idGenerator || new RandomIdGenerator;
    this.resource = _tracerProvider.resource;
    this.instrumentationLibrary = instrumentationLibrary;
  }
  Tracer2.prototype.startSpan = function(name, options, context3) {
    var _a, _b, _c;
    if (options === undefined) {
      options = {};
    }
    if (context3 === undefined) {
      context3 = api.context.active();
    }
    if (options.root) {
      context3 = api.trace.deleteSpan(context3);
    }
    var parentSpan = api.trace.getSpan(context3);
    if (import_core6.isTracingSuppressed(context3)) {
      api.diag.debug("Instrumentation suppressed, returning Noop Span");
      var nonRecordingSpan = api.trace.wrapSpanContext(api.INVALID_SPAN_CONTEXT);
      return nonRecordingSpan;
    }
    var parentSpanContext = parentSpan === null || parentSpan === undefined ? undefined : parentSpan.spanContext();
    var spanId = this._idGenerator.generateSpanId();
    var traceId;
    var traceState;
    var parentSpanId;
    if (!parentSpanContext || !api.trace.isSpanContextValid(parentSpanContext)) {
      traceId = this._idGenerator.generateTraceId();
    } else {
      traceId = parentSpanContext.traceId;
      traceState = parentSpanContext.traceState;
      parentSpanId = parentSpanContext.spanId;
    }
    var spanKind = (_a = options.kind) !== null && _a !== undefined ? _a : api.SpanKind.INTERNAL;
    var links = ((_b = options.links) !== null && _b !== undefined ? _b : []).map(function(link) {
      return {
        context: link.context,
        attributes: import_core6.sanitizeAttributes(link.attributes)
      };
    });
    var attributes = import_core6.sanitizeAttributes(options.attributes);
    var samplingResult = this._sampler.shouldSample(context3, traceId, name, spanKind, attributes, links);
    traceState = (_c = samplingResult.traceState) !== null && _c !== undefined ? _c : traceState;
    var traceFlags = samplingResult.decision === api.SamplingDecision.RECORD_AND_SAMPLED ? api.TraceFlags.SAMPLED : api.TraceFlags.NONE;
    var spanContext = { traceId, spanId, traceFlags, traceState };
    if (samplingResult.decision === api.SamplingDecision.NOT_RECORD) {
      api.diag.debug("Recording is off, propagating context in a non-recording span");
      var nonRecordingSpan = api.trace.wrapSpanContext(spanContext);
      return nonRecordingSpan;
    }
    var initAttributes = import_core6.sanitizeAttributes(Object.assign(attributes, samplingResult.attributes));
    var span = new Span(this, context3, name, spanContext, spanKind, parentSpanId, links, options.startTime, undefined, initAttributes);
    return span;
  };
  Tracer2.prototype.startActiveSpan = function(name, arg2, arg3, arg4) {
    var opts;
    var ctx;
    var fn;
    if (arguments.length < 2) {
      return;
    } else if (arguments.length === 2) {
      fn = arg2;
    } else if (arguments.length === 3) {
      opts = arg2;
      fn = arg3;
    } else {
      opts = arg2;
      ctx = arg3;
      fn = arg4;
    }
    var parentContext = ctx !== null && ctx !== undefined ? ctx : api.context.active();
    var span = this.startSpan(name, opts, parentContext);
    var contextWithSpanSet = api.trace.setSpan(parentContext, span);
    return api.context.with(contextWithSpanSet, fn, undefined, span);
  };
  Tracer2.prototype.getGeneralLimits = function() {
    return this._generalLimits;
  };
  Tracer2.prototype.getSpanLimits = function() {
    return this._spanLimits;
  };
  Tracer2.prototype.getActiveSpanProcessor = function() {
    return this._tracerProvider.getActiveSpanProcessor();
  };
  return Tracer2;
}();

// node_modules/@opentelemetry/sdk-trace-base/build/esm/BasicTracerProvider.js
var import_api7 = __toESM(require_src(), 1);
var import_core9 = __toESM(require_src3(), 1);

// node_modules/@opentelemetry/resources/build/esm/Resource.js
var import_api6 = __toESM(require_src(), 1);
var import_semantic_conventions2 = __toESM(require_src5(), 1);
var import_core7 = __toESM(require_src3(), 1);

// node_modules/@opentelemetry/resources/build/esm/platform/node/default-service-name.js
function defaultServiceName() {
  return "unknown_service:" + process.argv0;
}
// node_modules/@opentelemetry/resources/build/esm/Resource.js
var __assign2 = function() {
  __assign2 = Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length;i < n; i++) {
      s = arguments[i];
      for (var p in s)
        if (Object.prototype.hasOwnProperty.call(s, p))
          t[p] = s[p];
    }
    return t;
  };
  return __assign2.apply(this, arguments);
};
var __awaiter = function(thisArg, _arguments, P, generator) {
  function adopt(value) {
    return value instanceof P ? value : new P(function(resolve) {
      resolve(value);
    });
  }
  return new (P || (P = Promise))(function(resolve, reject) {
    function fulfilled(value) {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    }
    function rejected(value) {
      try {
        step(generator["throw"](value));
      } catch (e) {
        reject(e);
      }
    }
    function step(result) {
      result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
    }
    step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
};
var __generator = function(thisArg, body) {
  var _ = { label: 0, sent: function() {
    if (t[0] & 1)
      throw t[1];
    return t[1];
  }, trys: [], ops: [] }, f, y, t, g;
  return g = { next: verb(0), throw: verb(1), return: verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() {
    return this;
  }), g;
  function verb(n) {
    return function(v) {
      return step([n, v]);
    };
  }
  function step(op) {
    if (f)
      throw new TypeError("Generator is already executing.");
    while (_)
      try {
        if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done)
          return t;
        if (y = 0, t)
          op = [op[0] & 2, t.value];
        switch (op[0]) {
          case 0:
          case 1:
            t = op;
            break;
          case 4:
            _.label++;
            return { value: op[1], done: false };
          case 5:
            _.label++;
            y = op[1];
            op = [0];
            continue;
          case 7:
            op = _.ops.pop();
            _.trys.pop();
            continue;
          default:
            if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) {
              _ = 0;
              continue;
            }
            if (op[0] === 3 && (!t || op[1] > t[0] && op[1] < t[3])) {
              _.label = op[1];
              break;
            }
            if (op[0] === 6 && _.label < t[1]) {
              _.label = t[1];
              t = op;
              break;
            }
            if (t && _.label < t[2]) {
              _.label = t[2];
              _.ops.push(op);
              break;
            }
            if (t[2])
              _.ops.pop();
            _.trys.pop();
            continue;
        }
        op = body.call(thisArg, _);
      } catch (e) {
        op = [6, e];
        y = 0;
      } finally {
        f = t = 0;
      }
    if (op[0] & 5)
      throw op[1];
    return { value: op[0] ? op[1] : undefined, done: true };
  }
};
var __read2 = function(o, n) {
  var m = typeof Symbol === "function" && o[Symbol.iterator];
  if (!m)
    return o;
  var i = m.call(o), r, ar = [], e;
  try {
    while ((n === undefined || n-- > 0) && !(r = i.next()).done)
      ar.push(r.value);
  } catch (error) {
    e = { error };
  } finally {
    try {
      if (r && !r.done && (m = i["return"]))
        m.call(i);
    } finally {
      if (e)
        throw e.error;
    }
  }
  return ar;
};
var Resource = function() {
  function Resource2(attributes, asyncAttributesPromise) {
    var _this = this;
    var _a;
    this._attributes = attributes;
    this.asyncAttributesPending = asyncAttributesPromise != null;
    this._syncAttributes = (_a = this._attributes) !== null && _a !== undefined ? _a : {};
    this._asyncAttributesPromise = asyncAttributesPromise === null || asyncAttributesPromise === undefined ? undefined : asyncAttributesPromise.then(function(asyncAttributes) {
      _this._attributes = Object.assign({}, _this._attributes, asyncAttributes);
      _this.asyncAttributesPending = false;
      return asyncAttributes;
    }, function(err) {
      import_api6.diag.debug("a resource's async attributes promise rejected: %s", err);
      _this.asyncAttributesPending = false;
      return {};
    });
  }
  Resource2.empty = function() {
    return Resource2.EMPTY;
  };
  Resource2.default = function() {
    var _a;
    return new Resource2((_a = {}, _a[import_semantic_conventions2.SEMRESATTRS_SERVICE_NAME] = defaultServiceName(), _a[import_semantic_conventions2.SEMRESATTRS_TELEMETRY_SDK_LANGUAGE] = import_core7.SDK_INFO[import_semantic_conventions2.SEMRESATTRS_TELEMETRY_SDK_LANGUAGE], _a[import_semantic_conventions2.SEMRESATTRS_TELEMETRY_SDK_NAME] = import_core7.SDK_INFO[import_semantic_conventions2.SEMRESATTRS_TELEMETRY_SDK_NAME], _a[import_semantic_conventions2.SEMRESATTRS_TELEMETRY_SDK_VERSION] = import_core7.SDK_INFO[import_semantic_conventions2.SEMRESATTRS_TELEMETRY_SDK_VERSION], _a));
  };
  Object.defineProperty(Resource2.prototype, "attributes", {
    get: function() {
      var _a;
      if (this.asyncAttributesPending) {
        import_api6.diag.error("Accessing resource attributes before async attributes settled");
      }
      return (_a = this._attributes) !== null && _a !== undefined ? _a : {};
    },
    enumerable: false,
    configurable: true
  });
  Resource2.prototype.waitForAsyncAttributes = function() {
    return __awaiter(this, undefined, undefined, function() {
      return __generator(this, function(_a) {
        switch (_a.label) {
          case 0:
            if (!this.asyncAttributesPending)
              return [3, 2];
            return [4, this._asyncAttributesPromise];
          case 1:
            _a.sent();
            _a.label = 2;
          case 2:
            return [2];
        }
      });
    });
  };
  Resource2.prototype.merge = function(other) {
    var _this = this;
    var _a;
    if (!other)
      return this;
    var mergedSyncAttributes = __assign2(__assign2({}, this._syncAttributes), (_a = other._syncAttributes) !== null && _a !== undefined ? _a : other.attributes);
    if (!this._asyncAttributesPromise && !other._asyncAttributesPromise) {
      return new Resource2(mergedSyncAttributes);
    }
    var mergedAttributesPromise = Promise.all([
      this._asyncAttributesPromise,
      other._asyncAttributesPromise
    ]).then(function(_a2) {
      var _b;
      var _c = __read2(_a2, 2), thisAsyncAttributes = _c[0], otherAsyncAttributes = _c[1];
      return __assign2(__assign2(__assign2(__assign2({}, _this._syncAttributes), thisAsyncAttributes), (_b = other._syncAttributes) !== null && _b !== undefined ? _b : other.attributes), otherAsyncAttributes);
    });
    return new Resource2(mergedSyncAttributes, mergedAttributesPromise);
  };
  Resource2.EMPTY = new Resource2({});
  return Resource2;
}();
// node_modules/@opentelemetry/sdk-trace-base/build/esm/MultiSpanProcessor.js
var import_core8 = __toESM(require_src3(), 1);
var __values2 = function(o) {
  var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
  if (m)
    return m.call(o);
  if (o && typeof o.length === "number")
    return {
      next: function() {
        if (o && i >= o.length)
          o = undefined;
        return { value: o && o[i++], done: !o };
      }
    };
  throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
var MultiSpanProcessor = function() {
  function MultiSpanProcessor2(_spanProcessors) {
    this._spanProcessors = _spanProcessors;
  }
  MultiSpanProcessor2.prototype.forceFlush = function() {
    var e_1, _a;
    var promises = [];
    try {
      for (var _b = __values2(this._spanProcessors), _c = _b.next();!_c.done; _c = _b.next()) {
        var spanProcessor = _c.value;
        promises.push(spanProcessor.forceFlush());
      }
    } catch (e_1_1) {
      e_1 = { error: e_1_1 };
    } finally {
      try {
        if (_c && !_c.done && (_a = _b.return))
          _a.call(_b);
      } finally {
        if (e_1)
          throw e_1.error;
      }
    }
    return new Promise(function(resolve) {
      Promise.all(promises).then(function() {
        resolve();
      }).catch(function(error) {
        import_core8.globalErrorHandler(error || new Error("MultiSpanProcessor: forceFlush failed"));
        resolve();
      });
    });
  };
  MultiSpanProcessor2.prototype.onStart = function(span, context3) {
    var e_2, _a;
    try {
      for (var _b = __values2(this._spanProcessors), _c = _b.next();!_c.done; _c = _b.next()) {
        var spanProcessor = _c.value;
        spanProcessor.onStart(span, context3);
      }
    } catch (e_2_1) {
      e_2 = { error: e_2_1 };
    } finally {
      try {
        if (_c && !_c.done && (_a = _b.return))
          _a.call(_b);
      } finally {
        if (e_2)
          throw e_2.error;
      }
    }
  };
  MultiSpanProcessor2.prototype.onEnd = function(span) {
    var e_3, _a;
    try {
      for (var _b = __values2(this._spanProcessors), _c = _b.next();!_c.done; _c = _b.next()) {
        var spanProcessor = _c.value;
        spanProcessor.onEnd(span);
      }
    } catch (e_3_1) {
      e_3 = { error: e_3_1 };
    } finally {
      try {
        if (_c && !_c.done && (_a = _b.return))
          _a.call(_b);
      } finally {
        if (e_3)
          throw e_3.error;
      }
    }
  };
  MultiSpanProcessor2.prototype.shutdown = function() {
    var e_4, _a;
    var promises = [];
    try {
      for (var _b = __values2(this._spanProcessors), _c = _b.next();!_c.done; _c = _b.next()) {
        var spanProcessor = _c.value;
        promises.push(spanProcessor.shutdown());
      }
    } catch (e_4_1) {
      e_4 = { error: e_4_1 };
    } finally {
      try {
        if (_c && !_c.done && (_a = _b.return))
          _a.call(_b);
      } finally {
        if (e_4)
          throw e_4.error;
      }
    }
    return new Promise(function(resolve, reject) {
      Promise.all(promises).then(function() {
        resolve();
      }, reject);
    });
  };
  return MultiSpanProcessor2;
}();

// node_modules/@opentelemetry/sdk-trace-base/build/esm/export/NoopSpanProcessor.js
var NoopSpanProcessor = function() {
  function NoopSpanProcessor2() {}
  NoopSpanProcessor2.prototype.onStart = function(_span, _context) {};
  NoopSpanProcessor2.prototype.onEnd = function(_span) {};
  NoopSpanProcessor2.prototype.shutdown = function() {
    return Promise.resolve();
  };
  NoopSpanProcessor2.prototype.forceFlush = function() {
    return Promise.resolve();
  };
  return NoopSpanProcessor2;
}();

// node_modules/@opentelemetry/sdk-trace-base/build/esm/BasicTracerProvider.js
var __read3 = function(o, n) {
  var m = typeof Symbol === "function" && o[Symbol.iterator];
  if (!m)
    return o;
  var i = m.call(o), r, ar = [], e;
  try {
    while ((n === undefined || n-- > 0) && !(r = i.next()).done)
      ar.push(r.value);
  } catch (error) {
    e = { error };
  } finally {
    try {
      if (r && !r.done && (m = i["return"]))
        m.call(i);
    } finally {
      if (e)
        throw e.error;
    }
  }
  return ar;
};
var __spreadArray2 = function(to, from, pack) {
  if (pack || arguments.length === 2)
    for (var i = 0, l = from.length, ar;i < l; i++) {
      if (ar || !(i in from)) {
        if (!ar)
          ar = Array.prototype.slice.call(from, 0, i);
        ar[i] = from[i];
      }
    }
  return to.concat(ar || Array.prototype.slice.call(from));
};
var ForceFlushState;
(function(ForceFlushState2) {
  ForceFlushState2[ForceFlushState2["resolved"] = 0] = "resolved";
  ForceFlushState2[ForceFlushState2["timeout"] = 1] = "timeout";
  ForceFlushState2[ForceFlushState2["error"] = 2] = "error";
  ForceFlushState2[ForceFlushState2["unresolved"] = 3] = "unresolved";
})(ForceFlushState || (ForceFlushState = {}));
var BasicTracerProvider = function() {
  function BasicTracerProvider2(config) {
    if (config === undefined) {
      config = {};
    }
    var _a, _b;
    this._registeredSpanProcessors = [];
    this._tracers = new Map;
    var mergedConfig = import_core9.merge({}, loadDefaultConfig(), reconfigureLimits(config));
    this.resource = (_a = mergedConfig.resource) !== null && _a !== undefined ? _a : Resource.empty();
    if (mergedConfig.mergeResourceWithDefaults) {
      this.resource = Resource.default().merge(this.resource);
    }
    this._config = Object.assign({}, mergedConfig, {
      resource: this.resource
    });
    if ((_b = config.spanProcessors) === null || _b === undefined ? undefined : _b.length) {
      this._registeredSpanProcessors = __spreadArray2([], __read3(config.spanProcessors), false);
      this.activeSpanProcessor = new MultiSpanProcessor(this._registeredSpanProcessors);
    } else {
      var defaultExporter = this._buildExporterFromEnv();
      if (defaultExporter !== undefined) {
        var batchProcessor = new BatchSpanProcessor(defaultExporter);
        this.activeSpanProcessor = batchProcessor;
      } else {
        this.activeSpanProcessor = new NoopSpanProcessor;
      }
    }
  }
  BasicTracerProvider2.prototype.getTracer = function(name, version, options) {
    var key = name + "@" + (version || "") + ":" + ((options === null || options === undefined ? undefined : options.schemaUrl) || "");
    if (!this._tracers.has(key)) {
      this._tracers.set(key, new Tracer({ name, version, schemaUrl: options === null || options === undefined ? undefined : options.schemaUrl }, this._config, this));
    }
    return this._tracers.get(key);
  };
  BasicTracerProvider2.prototype.addSpanProcessor = function(spanProcessor) {
    if (this._registeredSpanProcessors.length === 0) {
      this.activeSpanProcessor.shutdown().catch(function(err) {
        return import_api7.diag.error("Error while trying to shutdown current span processor", err);
      });
    }
    this._registeredSpanProcessors.push(spanProcessor);
    this.activeSpanProcessor = new MultiSpanProcessor(this._registeredSpanProcessors);
  };
  BasicTracerProvider2.prototype.getActiveSpanProcessor = function() {
    return this.activeSpanProcessor;
  };
  BasicTracerProvider2.prototype.register = function(config) {
    if (config === undefined) {
      config = {};
    }
    import_api7.trace.setGlobalTracerProvider(this);
    if (config.propagator === undefined) {
      config.propagator = this._buildPropagatorFromEnv();
    }
    if (config.contextManager) {
      import_api7.context.setGlobalContextManager(config.contextManager);
    }
    if (config.propagator) {
      import_api7.propagation.setGlobalPropagator(config.propagator);
    }
  };
  BasicTracerProvider2.prototype.forceFlush = function() {
    var timeout = this._config.forceFlushTimeoutMillis;
    var promises = this._registeredSpanProcessors.map(function(spanProcessor) {
      return new Promise(function(resolve) {
        var state;
        var timeoutInterval = setTimeout(function() {
          resolve(new Error("Span processor did not completed within timeout period of " + timeout + " ms"));
          state = ForceFlushState.timeout;
        }, timeout);
        spanProcessor.forceFlush().then(function() {
          clearTimeout(timeoutInterval);
          if (state !== ForceFlushState.timeout) {
            state = ForceFlushState.resolved;
            resolve(state);
          }
        }).catch(function(error) {
          clearTimeout(timeoutInterval);
          state = ForceFlushState.error;
          resolve(error);
        });
      });
    });
    return new Promise(function(resolve, reject) {
      Promise.all(promises).then(function(results) {
        var errors = results.filter(function(result) {
          return result !== ForceFlushState.resolved;
        });
        if (errors.length > 0) {
          reject(errors);
        } else {
          resolve();
        }
      }).catch(function(error) {
        return reject([error]);
      });
    });
  };
  BasicTracerProvider2.prototype.shutdown = function() {
    return this.activeSpanProcessor.shutdown();
  };
  BasicTracerProvider2.prototype._getPropagator = function(name) {
    var _a;
    return (_a = this.constructor._registeredPropagators.get(name)) === null || _a === undefined ? undefined : _a();
  };
  BasicTracerProvider2.prototype._getSpanExporter = function(name) {
    var _a;
    return (_a = this.constructor._registeredExporters.get(name)) === null || _a === undefined ? undefined : _a();
  };
  BasicTracerProvider2.prototype._buildPropagatorFromEnv = function() {
    var _this = this;
    var uniquePropagatorNames = Array.from(new Set(import_core9.getEnv().OTEL_PROPAGATORS));
    var propagators = uniquePropagatorNames.map(function(name) {
      var propagator = _this._getPropagator(name);
      if (!propagator) {
        import_api7.diag.warn('Propagator "' + name + '" requested through environment variable is unavailable.');
      }
      return propagator;
    });
    var validPropagators = propagators.reduce(function(list, item) {
      if (item) {
        list.push(item);
      }
      return list;
    }, []);
    if (validPropagators.length === 0) {
      return;
    } else if (uniquePropagatorNames.length === 1) {
      return validPropagators[0];
    } else {
      return new import_core9.CompositePropagator({
        propagators: validPropagators
      });
    }
  };
  BasicTracerProvider2.prototype._buildExporterFromEnv = function() {
    var exporterName = import_core9.getEnv().OTEL_TRACES_EXPORTER;
    if (exporterName === "none" || exporterName === "")
      return;
    var exporter = this._getSpanExporter(exporterName);
    if (!exporter) {
      import_api7.diag.error('Exporter "' + exporterName + '" requested through environment variable is unavailable.');
    }
    return exporter;
  };
  BasicTracerProvider2._registeredPropagators = new Map([
    ["tracecontext", function() {
      return new import_core9.W3CTraceContextPropagator;
    }],
    ["baggage", function() {
      return new import_core9.W3CBaggagePropagator;
    }]
  ]);
  BasicTracerProvider2._registeredExporters = new Map;
  return BasicTracerProvider2;
}();
// node_modules/@opentelemetry/exporter-trace-otlp-http/build/esm/platform/node/OTLPTraceExporter.js
var import_otlp_exporter_base = __toESM(require_src6(), 1);

// node_modules/@opentelemetry/exporter-trace-otlp-http/build/esm/version.js
var VERSION = "0.57.2";

// node_modules/@opentelemetry/otlp-transformer/build/esm/common/utils.js
var import_core10 = __toESM(require_src3(), 1);
function hrTimeToNanos(hrTime2) {
  var NANOSECONDS = BigInt(1e9);
  return BigInt(hrTime2[0]) * NANOSECONDS + BigInt(hrTime2[1]);
}
function toLongBits(value) {
  var low = Number(BigInt.asUintN(32, value));
  var high = Number(BigInt.asUintN(32, value >> BigInt(32)));
  return { low, high };
}
function encodeAsLongBits(hrTime2) {
  var nanos = hrTimeToNanos(hrTime2);
  return toLongBits(nanos);
}
function encodeAsString(hrTime2) {
  var nanos = hrTimeToNanos(hrTime2);
  return nanos.toString();
}
var encodeTimestamp = typeof BigInt !== "undefined" ? encodeAsString : import_core10.hrTimeToNanoseconds;
function identity(value) {
  return value;
}
function optionalHexToBinary(str) {
  if (str === undefined)
    return;
  return import_core10.hexToBinary(str);
}
var DEFAULT_ENCODER = {
  encodeHrTime: encodeAsLongBits,
  encodeSpanContext: import_core10.hexToBinary,
  encodeOptionalSpanContext: optionalHexToBinary
};
function getOtlpEncoder(options) {
  var _a, _b;
  if (options === undefined) {
    return DEFAULT_ENCODER;
  }
  var useLongBits = (_a = options.useLongBits) !== null && _a !== undefined ? _a : true;
  var useHex = (_b = options.useHex) !== null && _b !== undefined ? _b : false;
  return {
    encodeHrTime: useLongBits ? encodeAsLongBits : encodeTimestamp,
    encodeSpanContext: useHex ? identity : import_core10.hexToBinary,
    encodeOptionalSpanContext: useHex ? identity : optionalHexToBinary
  };
}

// node_modules/@opentelemetry/otlp-transformer/build/esm/common/internal.js
var __read4 = function(o, n) {
  var m = typeof Symbol === "function" && o[Symbol.iterator];
  if (!m)
    return o;
  var i = m.call(o), r, ar = [], e;
  try {
    while ((n === undefined || n-- > 0) && !(r = i.next()).done)
      ar.push(r.value);
  } catch (error) {
    e = { error };
  } finally {
    try {
      if (r && !r.done && (m = i["return"]))
        m.call(i);
    } finally {
      if (e)
        throw e.error;
    }
  }
  return ar;
};
function createResource(resource) {
  return {
    attributes: toAttributes(resource.attributes),
    droppedAttributesCount: 0
  };
}
function createInstrumentationScope(scope) {
  return {
    name: scope.name,
    version: scope.version
  };
}
function toAttributes(attributes) {
  return Object.keys(attributes).map(function(key) {
    return toKeyValue(key, attributes[key]);
  });
}
function toKeyValue(key, value) {
  return {
    key,
    value: toAnyValue(value)
  };
}
function toAnyValue(value) {
  var t = typeof value;
  if (t === "string")
    return { stringValue: value };
  if (t === "number") {
    if (!Number.isInteger(value))
      return { doubleValue: value };
    return { intValue: value };
  }
  if (t === "boolean")
    return { boolValue: value };
  if (value instanceof Uint8Array)
    return { bytesValue: value };
  if (Array.isArray(value))
    return { arrayValue: { values: value.map(toAnyValue) } };
  if (t === "object" && value != null)
    return {
      kvlistValue: {
        values: Object.entries(value).map(function(_a) {
          var _b = __read4(_a, 2), k = _b[0], v = _b[1];
          return toKeyValue(k, v);
        })
      }
    };
  return {};
}

// node_modules/@opentelemetry/otlp-transformer/build/esm/trace/internal.js
var __values3 = function(o) {
  var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
  if (m)
    return m.call(o);
  if (o && typeof o.length === "number")
    return {
      next: function() {
        if (o && i >= o.length)
          o = undefined;
        return { value: o && o[i++], done: !o };
      }
    };
  throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
var __read5 = function(o, n) {
  var m = typeof Symbol === "function" && o[Symbol.iterator];
  if (!m)
    return o;
  var i = m.call(o), r, ar = [], e;
  try {
    while ((n === undefined || n-- > 0) && !(r = i.next()).done)
      ar.push(r.value);
  } catch (error) {
    e = { error };
  } finally {
    try {
      if (r && !r.done && (m = i["return"]))
        m.call(i);
    } finally {
      if (e)
        throw e.error;
    }
  }
  return ar;
};
function sdkSpanToOtlpSpan(span, encoder) {
  var _a;
  var ctx = span.spanContext();
  var status = span.status;
  return {
    traceId: encoder.encodeSpanContext(ctx.traceId),
    spanId: encoder.encodeSpanContext(ctx.spanId),
    parentSpanId: encoder.encodeOptionalSpanContext(span.parentSpanId),
    traceState: (_a = ctx.traceState) === null || _a === undefined ? undefined : _a.serialize(),
    name: span.name,
    kind: span.kind == null ? 0 : span.kind + 1,
    startTimeUnixNano: encoder.encodeHrTime(span.startTime),
    endTimeUnixNano: encoder.encodeHrTime(span.endTime),
    attributes: toAttributes(span.attributes),
    droppedAttributesCount: span.droppedAttributesCount,
    events: span.events.map(function(event) {
      return toOtlpSpanEvent(event, encoder);
    }),
    droppedEventsCount: span.droppedEventsCount,
    status: {
      code: status.code,
      message: status.message
    },
    links: span.links.map(function(link) {
      return toOtlpLink(link, encoder);
    }),
    droppedLinksCount: span.droppedLinksCount
  };
}
function toOtlpLink(link, encoder) {
  var _a;
  return {
    attributes: link.attributes ? toAttributes(link.attributes) : [],
    spanId: encoder.encodeSpanContext(link.context.spanId),
    traceId: encoder.encodeSpanContext(link.context.traceId),
    traceState: (_a = link.context.traceState) === null || _a === undefined ? undefined : _a.serialize(),
    droppedAttributesCount: link.droppedAttributesCount || 0
  };
}
function toOtlpSpanEvent(timedEvent, encoder) {
  return {
    attributes: timedEvent.attributes ? toAttributes(timedEvent.attributes) : [],
    name: timedEvent.name,
    timeUnixNano: encoder.encodeHrTime(timedEvent.time),
    droppedAttributesCount: timedEvent.droppedAttributesCount || 0
  };
}
function createExportTraceServiceRequest(spans, options) {
  var encoder = getOtlpEncoder(options);
  return {
    resourceSpans: spanRecordsToResourceSpans(spans, encoder)
  };
}
function createResourceMap(readableSpans) {
  var e_1, _a;
  var resourceMap = new Map;
  try {
    for (var readableSpans_1 = __values3(readableSpans), readableSpans_1_1 = readableSpans_1.next();!readableSpans_1_1.done; readableSpans_1_1 = readableSpans_1.next()) {
      var record = readableSpans_1_1.value;
      var ilmMap = resourceMap.get(record.resource);
      if (!ilmMap) {
        ilmMap = new Map;
        resourceMap.set(record.resource, ilmMap);
      }
      var instrumentationLibraryKey = record.instrumentationLibrary.name + "@" + (record.instrumentationLibrary.version || "") + ":" + (record.instrumentationLibrary.schemaUrl || "");
      var records = ilmMap.get(instrumentationLibraryKey);
      if (!records) {
        records = [];
        ilmMap.set(instrumentationLibraryKey, records);
      }
      records.push(record);
    }
  } catch (e_1_1) {
    e_1 = { error: e_1_1 };
  } finally {
    try {
      if (readableSpans_1_1 && !readableSpans_1_1.done && (_a = readableSpans_1.return))
        _a.call(readableSpans_1);
    } finally {
      if (e_1)
        throw e_1.error;
    }
  }
  return resourceMap;
}
function spanRecordsToResourceSpans(readableSpans, encoder) {
  var resourceMap = createResourceMap(readableSpans);
  var out = [];
  var entryIterator = resourceMap.entries();
  var entry = entryIterator.next();
  while (!entry.done) {
    var _a = __read5(entry.value, 2), resource = _a[0], ilmMap = _a[1];
    var scopeResourceSpans = [];
    var ilmIterator = ilmMap.values();
    var ilmEntry = ilmIterator.next();
    while (!ilmEntry.done) {
      var scopeSpans = ilmEntry.value;
      if (scopeSpans.length > 0) {
        var spans = scopeSpans.map(function(readableSpan) {
          return sdkSpanToOtlpSpan(readableSpan, encoder);
        });
        scopeResourceSpans.push({
          scope: createInstrumentationScope(scopeSpans[0].instrumentationLibrary),
          spans,
          schemaUrl: scopeSpans[0].instrumentationLibrary.schemaUrl
        });
      }
      ilmEntry = ilmIterator.next();
    }
    var transformedSpans = {
      resource: createResource(resource),
      scopeSpans: scopeResourceSpans,
      schemaUrl: undefined
    };
    out.push(transformedSpans);
    entry = entryIterator.next();
  }
  return out;
}

// node_modules/@opentelemetry/otlp-transformer/build/esm/trace/json/trace.js
var JsonTraceSerializer = {
  serializeRequest: function(arg) {
    var request = createExportTraceServiceRequest(arg, {
      useHex: true,
      useLongBits: false
    });
    var encoder = new TextEncoder;
    return encoder.encode(JSON.stringify(request));
  },
  deserializeResponse: function(arg) {
    var decoder = new TextDecoder;
    return JSON.parse(decoder.decode(arg));
  }
};
// node_modules/@opentelemetry/exporter-trace-otlp-http/build/esm/platform/node/OTLPTraceExporter.js
var import_node_http = __toESM(require_index_node_http(), 1);
var __extends2 = function() {
  var extendStatics = function(d, b) {
    extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d2, b2) {
      d2.__proto__ = b2;
    } || function(d2, b2) {
      for (var p in b2)
        if (Object.prototype.hasOwnProperty.call(b2, p))
          d2[p] = b2[p];
    };
    return extendStatics(d, b);
  };
  return function(d, b) {
    if (typeof b !== "function" && b !== null)
      throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
    extendStatics(d, b);
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __);
  };
}();
var OTLPTraceExporter = function(_super) {
  __extends2(OTLPTraceExporter2, _super);
  function OTLPTraceExporter2(config) {
    if (config === undefined) {
      config = {};
    }
    return _super.call(this, import_node_http.createOtlpHttpExportDelegate(import_node_http.convertLegacyHttpOptions(config, "TRACES", "v1/traces", {
      "User-Agent": "OTel-OTLP-Exporter-JavaScript/" + VERSION,
      "Content-Type": "application/json"
    }), JsonTraceSerializer)) || this;
  }
  return OTLPTraceExporter2;
}(import_otlp_exporter_base.OTLPExporterBase);

// src/tracing.ts
var import_semantic_conventions3 = __toESM(require_src7(), 1);
var import_api8 = __toESM(require_src(), 1);
var tracer;
var shutdown;
try {
  const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT ?? "https://telemetry.holdenitdown.net:4318";
  const resource = new Resource({
    [import_semantic_conventions3.ATTR_SERVICE_NAME]: process.env.OTEL_SERVICE_NAME ?? "cuthulu-plugin"
  });
  const exporter = new OTLPTraceExporter({ url: `${endpoint}/v1/traces` });
  const provider = new BasicTracerProvider({
    resource,
    spanProcessors: [new BatchSpanProcessor(exporter)]
  });
  provider.register();
  tracer = provider.getTracer("cuthulu");
  shutdown = () => provider.shutdown();
} catch (err) {
  console.error("[cuthulu] tracing init failed:", err);
  tracer = import_api8.trace.getTracer("cuthulu");
  shutdown = () => Promise.resolve();
}

// src/session-spans.ts
var import_api9 = __toESM(require_src(), 1);
var sessionSpans = new Map;
var messageSpans = new Map;
var toolSpans = new Map;
function startSessionSpan(sessionID, title, traceparent) {
  const existing = sessionSpans.get(sessionID);
  if (existing)
    existing.span.end();
  let span;
  if (traceparent) {
    const carrier = { traceparent };
    const remoteCtx = import_api9.propagation.extract(import_api9.context.active(), carrier);
    span = tracer.startSpan("session", {}, remoteCtx);
  } else {
    span = tracer.startSpan("session");
  }
  span.setAttributes({ "session.id": sessionID, "session.title": title });
  const ctx = import_api9.trace.setSpan(import_api9.context.active(), span);
  sessionSpans.set(sessionID, { span, ctx });
}
function endSessionSpan(sessionID, errorMessage) {
  const entry = sessionSpans.get(sessionID);
  if (!entry)
    return;
  if (errorMessage) {
    entry.span.setStatus({ code: import_api9.SpanStatusCode.ERROR, message: errorMessage });
  }
  endAllMessageSpans(sessionID);
  entry.span.end();
  sessionSpans.delete(sessionID);
}
function getSessionContext(sessionID) {
  return sessionSpans.get(sessionID)?.ctx;
}
function startMessageSpan(sessionID, messageID) {
  const sessionCtx = getSessionContext(sessionID);
  if (!sessionCtx)
    return;
  const span = tracer.startSpan("message", {}, sessionCtx);
  span.setAttributes({ "session.id": sessionID, "message.id": messageID });
  messageSpans.set(messageID, { span, sessionID });
}
function endAllMessageSpans(sessionID) {
  for (const [messageID, entry] of messageSpans) {
    if (entry.sessionID === sessionID) {
      entry.span.end();
      messageSpans.delete(messageID);
    }
  }
}
function startToolSpan(sessionID, toolName, callID) {
  const sessionCtx = getSessionContext(sessionID);
  if (!sessionCtx)
    return;
  const span = tracer.startSpan(`tool.${toolName}`, {}, sessionCtx);
  span.setAttributes({ "session.id": sessionID, "tool.name": toolName, "tool.call_id": callID });
  toolSpans.set(callID, span);
  return span;
}
function endToolSpan(callID, errorMessage) {
  const span = toolSpans.get(callID);
  if (!span)
    return;
  if (errorMessage) {
    span.setStatus({ code: import_api9.SpanStatusCode.ERROR, message: errorMessage });
  }
  span.end();
  toolSpans.delete(callID);
}
function getToolSpanTraceparent(callID) {
  const span = toolSpans.get(callID);
  if (!span)
    return;
  const sc = span.spanContext();
  if (!import_api9.isSpanContextValid(sc))
    return;
  return `00-${sc.traceId}-${sc.spanId}-01`;
}

// src/index.ts
var CuthuluPlugin = async ({ project, directory, serverUrl, client }) => {
  const logger = (level, message, extra) => {
    client.app.log({ body: { service: "cuthulu", level, message, extra } }).catch(() => {});
  };
  try {
    const opencodeUrl = serverUrl.toString().replace(/\/$/, "");
    let tmuxSession = "";
    let tmuxWindow = "";
    let tmuxPane = (process.env.TMUX_PANE ?? "").replace(/^%/, "");
    if (process.env.TMUX) {
      try {
        const proc = Bun.spawnSync(["tmux", "display-message", "-t", `%${tmuxPane}`, "-p", "#S\t#W"]);
        const parts = proc.stdout.toString().trim().split("\t");
        tmuxSession = parts[0] ?? "";
        tmuxWindow = parts[1] ?? "";
      } catch {}
    }
    const hostname = (await import("os")).hostname().split(".")[0];
    const serverClient = new LocalClient({
      opencodeUrl,
      projectDir: directory || project.worktree,
      hostname,
      tmuxSession,
      tmuxWindow,
      tmuxPane,
      logger,
      onCommand: makeCommandHandler({ client, tmuxPane, logger }),
      onConnect: async () => {
        const resp = await client.session.list();
        for (const sess of resp.data ?? []) {
          serverClient.sendEvent("session.updated", { info: sess });
        }
        const agentsResp = await client.app.agents();
        serverClient.sendEvent("app.agents", { agents: agentsResp.data ?? [] });
        const providersResp = await client.provider.list();
        serverClient.sendEvent("app.providers", providersResp.data ?? {});
      }
    });
    serverClient.connect();
    return {
      event: async ({ event }) => {
        const data = event.properties ?? event;
        serverClient.sendEvent(event.type, data);
        switch (event.type) {
          case "session.created": {
            const info = event.properties?.info;
            if (info?.id)
              startSessionSpan(info.id, info.title ?? "", getTraceParent(info.id));
            break;
          }
          case "session.idle": {
            const sessionID = event.properties?.sessionID;
            if (sessionID)
              endSessionSpan(sessionID);
            break;
          }
          case "session.deleted": {
            const sessionID = event.properties?.info?.id;
            if (sessionID)
              endSessionSpan(sessionID);
            break;
          }
          case "session.error": {
            const sessionID = event.properties?.sessionID;
            const err = event.properties?.error;
            const errorMessage = err?.message ? err.message : err ? String(err) : undefined;
            if (sessionID)
              endSessionSpan(sessionID, errorMessage);
            break;
          }
        }
      },
      "chat.message": async (input, _output) => {
        if (input.messageID) {
          startMessageSpan(input.sessionID, input.messageID);
        }
      },
      "tool.execute.before": async (input, _output) => {
        startToolSpan(input.sessionID, input.tool, input.callID);
        const tp = getToolSpanTraceparent(input.callID) ?? getTraceParent(input.sessionID);
        if (tp) {
          process.env.TRACEPARENT = tp;
          process.env.OTEL_PROPAGATORS = "tracecontext";
        }
      },
      "tool.execute.after": async (input, _output) => {
        const errorOutput = _output?.error;
        endToolSpan(input.callID, errorOutput ? String(errorOutput) : undefined);
        delete process.env.TRACEPARENT;
        delete process.env.OTEL_PROPAGATORS;
      }
    };
  } catch (err) {
    logger("error", "plugin init error", { error: String(err) });
  }
  return {};
};
var src_default = CuthuluPlugin;
export {
  src_default as default,
  CuthuluPlugin
};
