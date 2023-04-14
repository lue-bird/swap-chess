// elm-watch hot {"version":"1.1.2","targetName":"My target name","webSocketPort":44697}
"use strict";
(() => {
  // node_modules/tiny-decoders/index.mjs
  function boolean(value) {
    if (typeof value !== "boolean") {
      throw new DecoderError({ tag: "boolean", got: value });
    }
    return value;
  }
  function number(value) {
    if (typeof value !== "number") {
      throw new DecoderError({ tag: "number", got: value });
    }
    return value;
  }
  function string(value) {
    if (typeof value !== "string") {
      throw new DecoderError({ tag: "string", got: value });
    }
    return value;
  }
  function stringUnion(mapping) {
    return function stringUnionDecoder(value) {
      const str = string(value);
      if (!Object.prototype.hasOwnProperty.call(mapping, str)) {
        throw new DecoderError({
          tag: "unknown stringUnion variant",
          knownVariants: Object.keys(mapping),
          got: str
        });
      }
      return str;
    };
  }
  function unknownArray(value) {
    if (!Array.isArray(value)) {
      throw new DecoderError({ tag: "array", got: value });
    }
    return value;
  }
  function unknownRecord(value) {
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      throw new DecoderError({ tag: "object", got: value });
    }
    return value;
  }
  function array(decoder) {
    return function arrayDecoder(value) {
      const arr = unknownArray(value);
      const result = [];
      for (let index = 0; index < arr.length; index++) {
        try {
          result.push(decoder(arr[index]));
        } catch (error) {
          throw DecoderError.at(error, index);
        }
      }
      return result;
    };
  }
  function record(decoder) {
    return function recordDecoder(value) {
      const object = unknownRecord(value);
      const keys = Object.keys(object);
      const result = {};
      for (const key of keys) {
        if (key === "__proto__") {
          continue;
        }
        try {
          result[key] = decoder(object[key]);
        } catch (error) {
          throw DecoderError.at(error, key);
        }
      }
      return result;
    };
  }
  function fields(callback, { exact = "allow extra", allow = "object" } = {}) {
    return function fieldsDecoder(value) {
      const object = allow === "array" ? unknownArray(value) : unknownRecord(value);
      const knownFields = /* @__PURE__ */ Object.create(null);
      function field(key, decoder) {
        try {
          const result2 = decoder(object[key]);
          knownFields[key] = null;
          return result2;
        } catch (error) {
          throw DecoderError.at(error, key);
        }
      }
      const result = callback(field, object);
      if (exact !== "allow extra") {
        const unknownFields = Object.keys(object).filter((key) => !Object.prototype.hasOwnProperty.call(knownFields, key));
        if (unknownFields.length > 0) {
          throw new DecoderError({
            tag: "exact fields",
            knownFields: Object.keys(knownFields),
            got: unknownFields
          });
        }
      }
      return result;
    };
  }
  function fieldsAuto(mapping, { exact = "allow extra" } = {}) {
    return function fieldsAutoDecoder(value) {
      const object = unknownRecord(value);
      const keys = Object.keys(mapping);
      const result = {};
      for (const key of keys) {
        if (key === "__proto__") {
          continue;
        }
        const decoder = mapping[key];
        try {
          result[key] = decoder(object[key]);
        } catch (error) {
          throw DecoderError.at(error, key);
        }
      }
      if (exact !== "allow extra") {
        const unknownFields = Object.keys(object).filter((key) => !Object.prototype.hasOwnProperty.call(mapping, key));
        if (unknownFields.length > 0) {
          throw new DecoderError({
            tag: "exact fields",
            knownFields: keys,
            got: unknownFields
          });
        }
      }
      return result;
    };
  }
  function fieldsUnion(key, mapping) {
    return fields(function fieldsUnionFields(field, object) {
      const tag = field(key, string);
      if (Object.prototype.hasOwnProperty.call(mapping, tag)) {
        const decoder = mapping[tag];
        return decoder(object);
      }
      throw new DecoderError({
        tag: "unknown fieldsUnion tag",
        knownTags: Object.keys(mapping),
        got: tag,
        key
      });
    });
  }
  function multi(mapping) {
    return function multiDecoder(value) {
      if (value === void 0) {
        if (mapping.undefined !== void 0) {
          return mapping.undefined(value);
        }
      } else if (value === null) {
        if (mapping.null !== void 0) {
          return mapping.null(value);
        }
      } else if (typeof value === "boolean") {
        if (mapping.boolean !== void 0) {
          return mapping.boolean(value);
        }
      } else if (typeof value === "number") {
        if (mapping.number !== void 0) {
          return mapping.number(value);
        }
      } else if (typeof value === "string") {
        if (mapping.string !== void 0) {
          return mapping.string(value);
        }
      } else if (Array.isArray(value)) {
        if (mapping.array !== void 0) {
          return mapping.array(value);
        }
      } else {
        if (mapping.object !== void 0) {
          return mapping.object(value);
        }
      }
      throw new DecoderError({
        tag: "unknown multi type",
        knownTypes: Object.keys(mapping),
        got: value
      });
    };
  }
  function optional(decoder, defaultValue) {
    return function optionalDecoder(value) {
      if (value === void 0) {
        return defaultValue;
      }
      try {
        return decoder(value);
      } catch (error) {
        const newError = DecoderError.at(error);
        if (newError.path.length === 0) {
          newError.optional = true;
        }
        throw newError;
      }
    };
  }
  function chain(decoder, next) {
    return function chainDecoder(value) {
      return next(decoder(value));
    };
  }
  function formatDecoderErrorVariant(variant, options) {
    const formatGot = (value) => {
      const formatted = repr(value, options);
      return (options === null || options === void 0 ? void 0 : options.sensitive) === true ? `${formatted}
(Actual values are hidden in sensitive mode.)` : formatted;
    };
    const stringList = (strings) => strings.length === 0 ? "(none)" : strings.map((s) => JSON.stringify(s)).join(", ");
    const got = (message, value) => value === DecoderError.MISSING_VALUE ? message : `${message}
Got: ${formatGot(value)}`;
    switch (variant.tag) {
      case "boolean":
      case "number":
      case "string":
        return got(`Expected a ${variant.tag}`, variant.got);
      case "array":
      case "object":
        return got(`Expected an ${variant.tag}`, variant.got);
      case "unknown multi type":
        return `Expected one of these types: ${variant.knownTypes.length === 0 ? "never" : variant.knownTypes.join(", ")}
Got: ${formatGot(variant.got)}`;
      case "unknown fieldsUnion tag":
        return `Expected one of these tags: ${stringList(variant.knownTags)}
Got: ${formatGot(variant.got)}`;
      case "unknown stringUnion variant":
        return `Expected one of these variants: ${stringList(variant.knownVariants)}
Got: ${formatGot(variant.got)}`;
      case "exact fields":
        return `Expected only these fields: ${stringList(variant.knownFields)}
Found extra fields: ${formatGot(variant.got).replace(/^\[|\]$/g, "")}`;
      case "tuple size":
        return `Expected ${variant.expected} items
Got: ${variant.got}`;
      case "custom":
        return got(variant.message, variant.got);
    }
  }
  var DecoderError = class extends TypeError {
    constructor({ key, ...params }) {
      const variant = "tag" in params ? params : { tag: "custom", message: params.message, got: params.value };
      super(`${formatDecoderErrorVariant(
        variant,
        { sensitive: true }
      )}

For better error messages, see https://github.com/lydell/tiny-decoders#error-messages`);
      this.path = key === void 0 ? [] : [key];
      this.variant = variant;
      this.nullable = false;
      this.optional = false;
    }
    static at(error, key) {
      if (error instanceof DecoderError) {
        if (key !== void 0) {
          error.path.unshift(key);
        }
        return error;
      }
      return new DecoderError({
        tag: "custom",
        message: error instanceof Error ? error.message : String(error),
        got: DecoderError.MISSING_VALUE,
        key
      });
    }
    format(options) {
      const path = this.path.map((part) => `[${JSON.stringify(part)}]`).join("");
      const nullableString = this.nullable ? " (nullable)" : "";
      const optionalString = this.optional ? " (optional)" : "";
      const variant = formatDecoderErrorVariant(this.variant, options);
      return `At root${path}${nullableString}${optionalString}:
${variant}`;
    }
  };
  DecoderError.MISSING_VALUE = Symbol("DecoderError.MISSING_VALUE");
  function repr(value, { recurse = true, maxArrayChildren = 5, maxObjectChildren = 3, maxLength = 100, recurseMaxLength = 20, sensitive = false } = {}) {
    const type = typeof value;
    const toStringType = Object.prototype.toString.call(value).replace(/^\[object\s+(.+)\]$/, "$1");
    try {
      if (value == null || type === "number" || type === "boolean" || type === "symbol" || toStringType === "RegExp") {
        return sensitive ? toStringType.toLowerCase() : truncate(String(value), maxLength);
      }
      if (type === "string") {
        return sensitive ? type : truncate(JSON.stringify(value), maxLength);
      }
      if (typeof value === "function") {
        return `function ${truncate(JSON.stringify(value.name), maxLength)}`;
      }
      if (Array.isArray(value)) {
        const arr = value;
        if (!recurse && arr.length > 0) {
          return `${toStringType}(${arr.length})`;
        }
        const lastIndex = arr.length - 1;
        const items = [];
        const end = Math.min(maxArrayChildren - 1, lastIndex);
        for (let index = 0; index <= end; index++) {
          const item = index in arr ? repr(arr[index], {
            recurse: false,
            maxLength: recurseMaxLength,
            sensitive
          }) : "<empty>";
          items.push(item);
        }
        if (end < lastIndex) {
          items.push(`(${lastIndex - end} more)`);
        }
        return `[${items.join(", ")}]`;
      }
      if (toStringType === "Object") {
        const object = value;
        const keys = Object.keys(object);
        const { name } = object.constructor;
        if (!recurse && keys.length > 0) {
          return `${name}(${keys.length})`;
        }
        const numHidden = Math.max(0, keys.length - maxObjectChildren);
        const items = keys.slice(0, maxObjectChildren).map((key2) => `${truncate(JSON.stringify(key2), recurseMaxLength)}: ${repr(object[key2], {
          recurse: false,
          maxLength: recurseMaxLength,
          sensitive
        })}`).concat(numHidden > 0 ? `(${numHidden} more)` : []);
        const prefix = name === "Object" ? "" : `${name} `;
        return `${prefix}{${items.join(", ")}}`;
      }
      return toStringType;
    } catch (_error) {
      return toStringType;
    }
  }
  function truncate(str, maxLength) {
    const half = Math.floor(maxLength / 2);
    return str.length <= maxLength ? str : `${str.slice(0, half)}\u2026${str.slice(-half)}`;
  }

  // src/Helpers.ts
  function join(array2, separator) {
    return array2.join(separator);
  }
  function pad(number2) {
    return number2.toString().padStart(2, "0");
  }
  function formatDate(date) {
    return join(
      [pad(date.getFullYear()), pad(date.getMonth() + 1), pad(date.getDate())],
      "-"
    );
  }
  function formatTime(date) {
    return join(
      [pad(date.getHours()), pad(date.getMinutes()), pad(date.getSeconds())],
      ":"
    );
  }

  // src/TeaProgram.ts
  async function runTeaProgram(options) {
    return new Promise((resolve, reject) => {
      const [initialModel, initialCmds] = options.init;
      let model = initialModel;
      const msgQueue = [];
      let killed = false;
      const dispatch = (dispatchedMsg) => {
        if (killed) {
          return;
        }
        const alreadyRunning = msgQueue.length > 0;
        msgQueue.push(dispatchedMsg);
        if (alreadyRunning) {
          return;
        }
        for (const msg of msgQueue) {
          const [newModel, cmds] = options.update(msg, model);
          model = newModel;
          runCmds(cmds);
        }
        msgQueue.length = 0;
      };
      const runCmds = (cmds) => {
        for (const cmd of cmds) {
          options.runCmd(
            cmd,
            mutable,
            dispatch,
            (result) => {
              cmds.length = 0;
              killed = true;
              resolve(result);
            },
            (error) => {
              cmds.length = 0;
              killed = true;
              reject(error);
            }
          );
          if (killed) {
            break;
          }
        }
      };
      const mutable = options.initMutable(
        dispatch,
        (result) => {
          killed = true;
          resolve(result);
        },
        (error) => {
          killed = true;
          reject(error);
        }
      );
      runCmds(initialCmds);
    });
  }

  // src/Types.ts
  var AbsolutePath = fieldsAuto({
    tag: () => "AbsolutePath",
    absolutePath: string
  });
  var CompilationMode = stringUnion({
    debug: null,
    standard: null,
    optimize: null
  });
  var BrowserUiPosition = stringUnion({
    TopLeft: null,
    TopRight: null,
    BottomLeft: null,
    BottomRight: null
  });

  // client/WebSocketMessages.ts
  var FocusedTabAcknowledged = fieldsAuto({
    tag: () => "FocusedTabAcknowledged"
  });
  var OpenEditorError = fieldsUnion("tag", {
    EnvNotSet: fieldsAuto({
      tag: () => "EnvNotSet"
    }),
    CommandFailed: fieldsAuto({
      tag: () => "CommandFailed",
      message: string
    })
  });
  var OpenEditorFailed = fieldsAuto({
    tag: () => "OpenEditorFailed",
    error: OpenEditorError
  });
  var ErrorLocation = fieldsUnion("tag", {
    FileOnly: fieldsAuto({
      tag: () => "FileOnly",
      file: AbsolutePath
    }),
    FileWithLineAndColumn: fieldsAuto({
      tag: () => "FileWithLineAndColumn",
      file: AbsolutePath,
      line: number,
      column: number
    }),
    Target: fieldsAuto({
      tag: () => "Target",
      targetName: string
    })
  });
  var CompileError = fieldsAuto({
    title: string,
    location: optional(ErrorLocation),
    htmlContent: string
  });
  var StatusChanged = fieldsAuto({
    tag: () => "StatusChanged",
    status: fieldsUnion("tag", {
      AlreadyUpToDate: fieldsAuto({
        tag: () => "AlreadyUpToDate",
        compilationMode: CompilationMode,
        browserUiPosition: BrowserUiPosition
      }),
      Busy: fieldsAuto({
        tag: () => "Busy",
        compilationMode: CompilationMode,
        browserUiPosition: BrowserUiPosition
      }),
      CompileError: fieldsAuto({
        tag: () => "CompileError",
        compilationMode: CompilationMode,
        browserUiPosition: BrowserUiPosition,
        openErrorOverlay: boolean,
        errors: array(CompileError),
        foregroundColor: string,
        backgroundColor: string
      }),
      ElmJsonError: fieldsAuto({
        tag: () => "ElmJsonError",
        error: string
      }),
      ClientError: fieldsAuto({
        tag: () => "ClientError",
        message: string
      })
    })
  });
  var SuccessfullyCompiled = fieldsAuto({
    tag: () => "SuccessfullyCompiled",
    code: string,
    elmCompiledTimestamp: number,
    compilationMode: CompilationMode,
    browserUiPosition: BrowserUiPosition
  });
  var SuccessfullyCompiledButRecordFieldsChanged = fieldsAuto({
    tag: () => "SuccessfullyCompiledButRecordFieldsChanged"
  });
  var WebSocketToClientMessage = fieldsUnion("tag", {
    FocusedTabAcknowledged,
    OpenEditorFailed,
    StatusChanged,
    SuccessfullyCompiled,
    SuccessfullyCompiledButRecordFieldsChanged
  });
  var WebSocketToServerMessage = fieldsUnion("tag", {
    ChangedCompilationMode: fieldsAuto({
      tag: () => "ChangedCompilationMode",
      compilationMode: CompilationMode
    }),
    ChangedBrowserUiPosition: fieldsAuto({
      tag: () => "ChangedBrowserUiPosition",
      browserUiPosition: BrowserUiPosition
    }),
    ChangedOpenErrorOverlay: fieldsAuto({
      tag: () => "ChangedOpenErrorOverlay",
      openErrorOverlay: boolean
    }),
    FocusedTab: fieldsAuto({
      tag: () => "FocusedTab"
    }),
    PressedOpenEditor: fieldsAuto({
      tag: () => "PressedOpenEditor",
      file: AbsolutePath,
      line: number,
      column: number
    })
  });
  function decodeWebSocketToClientMessage(message) {
    if (message.startsWith("//")) {
      const newlineIndexRaw = message.indexOf("\n");
      const newlineIndex = newlineIndexRaw === -1 ? message.length : newlineIndexRaw;
      const jsonString = message.slice(2, newlineIndex);
      const parsed = SuccessfullyCompiled(JSON.parse(jsonString));
      return { ...parsed, code: message };
    } else {
      return WebSocketToClientMessage(JSON.parse(message));
    }
  }

  // client/client.ts
  var window = globalThis;
  var IS_WEB_WORKER = window.window === void 0;
  var { __ELM_WATCH } = window;
  if (typeof __ELM_WATCH !== "object" || __ELM_WATCH === null) {
    __ELM_WATCH = {};
    Object.defineProperty(window, "__ELM_WATCH", { value: __ELM_WATCH });
  }
  __ELM_WATCH.MOCKED_TIMINGS ?? (__ELM_WATCH.MOCKED_TIMINGS = false);
  __ELM_WATCH.WEBSOCKET_TIMEOUT ?? (__ELM_WATCH.WEBSOCKET_TIMEOUT = 1e3);
  __ELM_WATCH.ON_INIT ?? (__ELM_WATCH.ON_INIT = () => {
  });
  __ELM_WATCH.ON_RENDER ?? (__ELM_WATCH.ON_RENDER = () => {
  });
  __ELM_WATCH.ON_REACHED_IDLE_STATE ?? (__ELM_WATCH.ON_REACHED_IDLE_STATE = () => {
  });
  __ELM_WATCH.RELOAD_STATUSES ?? (__ELM_WATCH.RELOAD_STATUSES = {});
  var RELOAD_MESSAGE_KEY = "__elmWatchReloadMessage";
  var RELOAD_TARGET_NAME_KEY_PREFIX = "__elmWatchReloadTarget__";
  __ELM_WATCH.RELOAD_PAGE ?? (__ELM_WATCH.RELOAD_PAGE = (message) => {
    if (message !== void 0) {
      try {
        window.sessionStorage.setItem(RELOAD_MESSAGE_KEY, message);
      } catch {
      }
    }
    if (IS_WEB_WORKER) {
      if (message !== void 0) {
        console.info(message);
      }
      console.error(
        message === void 0 ? "elm-watch: You need to reload the page! I seem to be running in a Web Worker, so I can\u2019t do it for you." : `elm-watch: You need to reload the page! I seem to be running in a Web Worker, so I couldn\u2019t actually reload the page (see above).`
      );
    } else {
      window.location.reload();
    }
  });
  __ELM_WATCH.KILL_MATCHING ?? (__ELM_WATCH.KILL_MATCHING = () => Promise.resolve());
  __ELM_WATCH.DISCONNECT ?? (__ELM_WATCH.DISCONNECT = () => {
  });
  __ELM_WATCH.LOG_DEBUG ?? (__ELM_WATCH.LOG_DEBUG = console.debug);
  var VERSION = "1.1.2";
  var TARGET_NAME = "My target name";
  var INITIAL_ELM_COMPILED_TIMESTAMP = Number(
    "1681464661339"
  );
  var ORIGINAL_COMPILATION_MODE = "optimize";
  var ORIGINAL_BROWSER_UI_POSITION = "BottomLeft";
  var WEBSOCKET_PORT = "44697";
  var CONTAINER_ID = "elm-watch";
  var DEBUG = String("false") === "true";
  var BROWSER_UI_MOVED_EVENT = "BROWSER_UI_MOVED_EVENT";
  var CLOSE_ALL_ERROR_OVERLAYS_EVENT = "CLOSE_ALL_ERROR_OVERLAYS_EVENT";
  var JUST_CHANGED_BROWSER_UI_POSITION_TIMEOUT = 2e3;
  var SEND_KEY_DO_NOT_USE_ALL_THE_TIME = Symbol(
    "This value is supposed to only be obtained via `Status`."
  );
  function logDebug(...args) {
    if (DEBUG) {
      __ELM_WATCH.LOG_DEBUG(...args);
    }
  }
  function parseBrowseUiPositionWithFallback(value) {
    try {
      return BrowserUiPosition(value);
    } catch {
      return ORIGINAL_BROWSER_UI_POSITION;
    }
  }
  function run() {
    let elmCompiledTimestampBeforeReload = void 0;
    try {
      const message = window.sessionStorage.getItem(RELOAD_MESSAGE_KEY);
      if (message !== null) {
        console.info(message);
        window.sessionStorage.removeItem(RELOAD_MESSAGE_KEY);
      }
      const key = RELOAD_TARGET_NAME_KEY_PREFIX + TARGET_NAME;
      const previous = window.sessionStorage.getItem(key);
      if (previous !== null) {
        const number2 = Number(previous);
        if (Number.isFinite(number2)) {
          elmCompiledTimestampBeforeReload = number2;
        }
        window.sessionStorage.removeItem(key);
      }
    } catch {
    }
    const elements = IS_WEB_WORKER ? void 0 : getOrCreateTargetRoot();
    const browserUiPosition = elements === void 0 ? ORIGINAL_BROWSER_UI_POSITION : parseBrowseUiPositionWithFallback(elements.container.dataset.position);
    const getNow = () => new Date();
    runTeaProgram({
      initMutable: initMutable(getNow, elements),
      init: init(getNow(), browserUiPosition, elmCompiledTimestampBeforeReload),
      update: (msg, model) => {
        const [updatedModel, cmds] = update(msg, model);
        const modelChanged = updatedModel !== model;
        const reloadTrouble = model.status.tag !== updatedModel.status.tag && updatedModel.status.tag === "WaitingForReload" && updatedModel.elmCompiledTimestamp === updatedModel.elmCompiledTimestampBeforeReload;
        const newModel = modelChanged ? {
          ...updatedModel,
          previousStatusTag: model.status.tag,
          uiExpanded: reloadTrouble ? true : updatedModel.uiExpanded
        } : model;
        const oldErrorOverlay = getErrorOverlay(model.status);
        const newErrorOverlay = getErrorOverlay(newModel.status);
        const allCmds = modelChanged ? [
          ...cmds,
          {
            tag: "UpdateGlobalStatus",
            reloadStatus: statusToReloadStatus(newModel),
            elmCompiledTimestamp: newModel.elmCompiledTimestamp
          },
          newModel.status.tag === newModel.previousStatusTag && oldErrorOverlay?.openErrorOverlay === newErrorOverlay?.openErrorOverlay ? { tag: "NoCmd" } : {
            tag: "UpdateErrorOverlay",
            errors: newErrorOverlay === void 0 || !newErrorOverlay.openErrorOverlay ? /* @__PURE__ */ new Map() : newErrorOverlay.errors,
            sendKey: statusToSpecialCaseSendKey(newModel.status)
          },
          {
            tag: "Render",
            model: newModel,
            manageFocus: msg.tag === "UiMsg"
          },
          model.browserUiPosition === newModel.browserUiPosition ? { tag: "NoCmd" } : {
            tag: "SetBrowserUiPosition",
            browserUiPosition: newModel.browserUiPosition
          },
          reloadTrouble ? { tag: "TriggerReachedIdleState", reason: "ReloadTrouble" } : { tag: "NoCmd" }
        ] : cmds;
        logDebug(`${msg.tag} (${TARGET_NAME})`, msg, newModel, allCmds);
        return [newModel, allCmds];
      },
      runCmd: runCmd(getNow, elements)
    }).catch((error) => {
      console.error("elm-watch: Unexpectedly exited with error:", error);
    });
  }
  function getErrorOverlay(status) {
    return "errorOverlay" in status ? status.errorOverlay : void 0;
  }
  function statusToReloadStatus(model) {
    switch (model.status.tag) {
      case "Busy":
      case "Connecting":
        return { tag: "MightWantToReload" };
      case "CompileError":
      case "ElmJsonError":
      case "EvalError":
      case "Idle":
      case "SleepingBeforeReconnect":
      case "UnexpectedError":
        return { tag: "NoReloadWanted" };
      case "WaitingForReload":
        return model.elmCompiledTimestamp === model.elmCompiledTimestampBeforeReload ? { tag: "NoReloadWanted" } : { tag: "ReloadRequested", reasons: model.status.reasons };
    }
  }
  function statusToStatusType(statusTag) {
    switch (statusTag) {
      case "Idle":
        return "Success";
      case "Busy":
      case "Connecting":
      case "SleepingBeforeReconnect":
      case "WaitingForReload":
        return "Waiting";
      case "CompileError":
      case "ElmJsonError":
      case "EvalError":
      case "UnexpectedError":
        return "Error";
    }
  }
  function statusToSpecialCaseSendKey(status) {
    switch (status.tag) {
      case "CompileError":
      case "Idle":
        return status.sendKey;
      case "Busy":
        return SEND_KEY_DO_NOT_USE_ALL_THE_TIME;
      case "Connecting":
      case "SleepingBeforeReconnect":
      case "WaitingForReload":
      case "ElmJsonError":
      case "EvalError":
      case "UnexpectedError":
        return void 0;
    }
  }
  function getOrCreateContainer() {
    const existing = document.getElementById(CONTAINER_ID);
    if (existing !== null) {
      return existing;
    }
    const container = h(HTMLDivElement, { id: CONTAINER_ID });
    container.style.all = "unset";
    container.style.position = "fixed";
    container.style.zIndex = "2147483647";
    const shadowRoot = container.attachShadow({ mode: "open" });
    shadowRoot.append(h(HTMLStyleElement, {}, CSS));
    document.documentElement.append(container);
    return container;
  }
  function getOrCreateTargetRoot() {
    const container = getOrCreateContainer();
    const { shadowRoot } = container;
    if (shadowRoot === null) {
      throw new Error(
        `elm-watch: Cannot set up hot reload, because an element with ID ${CONTAINER_ID} exists, but \`.shadowRoot\` is null!`
      );
    }
    let overlay = shadowRoot.querySelector(`.${CLASS.overlay}`);
    if (overlay === null) {
      overlay = h(HTMLDivElement, {
        className: CLASS.overlay,
        attrs: { "data-test-id": "Overlay" }
      });
      shadowRoot.append(overlay);
    }
    let overlayCloseButton = shadowRoot.querySelector(
      `.${CLASS.overlayCloseButton}`
    );
    if (overlayCloseButton === null) {
      const closeAllErrorOverlays = () => {
        shadowRoot.dispatchEvent(new CustomEvent(CLOSE_ALL_ERROR_OVERLAYS_EVENT));
      };
      overlayCloseButton = h(HTMLButtonElement, {
        className: CLASS.overlayCloseButton,
        attrs: {
          "aria-label": "Close error overlay",
          "data-test-id": "OverlayCloseButton"
        },
        onclick: closeAllErrorOverlays
      });
      shadowRoot.append(overlayCloseButton);
      const overlayNonNull = overlay;
      window.addEventListener(
        "keydown",
        (event) => {
          if (overlayNonNull.hasChildNodes() && event.key === "Escape") {
            event.preventDefault();
            event.stopImmediatePropagation();
            closeAllErrorOverlays();
          }
        },
        true
      );
    }
    let root = shadowRoot.querySelector(`.${CLASS.root}`);
    if (root === null) {
      root = h(HTMLDivElement, { className: CLASS.root });
      shadowRoot.append(root);
    }
    const targetRoot = createTargetRoot(TARGET_NAME);
    root.append(targetRoot);
    const elements = {
      container,
      shadowRoot,
      overlay,
      overlayCloseButton,
      root,
      targetRoot
    };
    setBrowserUiPosition(ORIGINAL_BROWSER_UI_POSITION, elements);
    return elements;
  }
  function createTargetRoot(targetName) {
    return h(HTMLDivElement, {
      className: CLASS.targetRoot,
      attrs: { "data-target": targetName }
    });
  }
  function browserUiPositionToCss(browserUiPosition) {
    switch (browserUiPosition) {
      case "TopLeft":
        return { top: "-1px", bottom: "auto", left: "-1px", right: "auto" };
      case "TopRight":
        return { top: "-1px", bottom: "auto", left: "auto", right: "-1px" };
      case "BottomLeft":
        return { top: "auto", bottom: "-1px", left: "-1px", right: "auto" };
      case "BottomRight":
        return { top: "auto", bottom: "-1px", left: "auto", right: "-1px" };
    }
  }
  function browserUiPositionToCssForChooser(browserUiPosition) {
    switch (browserUiPosition) {
      case "TopLeft":
        return { top: "auto", bottom: "0", left: "auto", right: "0" };
      case "TopRight":
        return { top: "auto", bottom: "0", left: "0", right: "auto" };
      case "BottomLeft":
        return { top: "0", bottom: "auto", left: "auto", right: "0" };
      case "BottomRight":
        return { top: "0", bottom: "auto", left: "0", right: "auto" };
    }
  }
  function setBrowserUiPosition(browserUiPosition, elements) {
    const isFirstTargetRoot = elements.targetRoot.previousElementSibling === null;
    if (!isFirstTargetRoot) {
      return;
    }
    elements.container.dataset.position = browserUiPosition;
    for (const [key, value] of Object.entries(
      browserUiPositionToCss(browserUiPosition)
    )) {
      elements.container.style.setProperty(key, value);
    }
    const isInBottomHalf = browserUiPosition === "BottomLeft" || browserUiPosition === "BottomRight";
    elements.root.classList.toggle(CLASS.rootBottomHalf, isInBottomHalf);
    elements.shadowRoot.dispatchEvent(
      new CustomEvent(BROWSER_UI_MOVED_EVENT, { detail: browserUiPosition })
    );
  }
  var initMutable = (getNow, elements) => (dispatch, resolvePromise) => {
    let removeListeners = [];
    const mutable = {
      removeListeners: () => {
        for (const removeListener of removeListeners) {
          removeListener();
        }
      },
      webSocket: initWebSocket(
        getNow,
        INITIAL_ELM_COMPILED_TIMESTAMP,
        dispatch
      ),
      webSocketTimeoutId: void 0
    };
    mutable.webSocket.addEventListener(
      "open",
      () => {
        removeListeners = [
          addEventListener(window, "focus", (event) => {
            if (event instanceof CustomEvent && event.detail !== TARGET_NAME) {
              return;
            }
            dispatch({ tag: "FocusedTab" });
          }),
          addEventListener(window, "visibilitychange", () => {
            if (document.visibilityState === "visible") {
              dispatch({
                tag: "PageVisibilityChangedToVisible",
                date: getNow()
              });
            }
          }),
          ...elements === void 0 ? [] : [
            addEventListener(
              elements.shadowRoot,
              BROWSER_UI_MOVED_EVENT,
              (event) => {
                dispatch({
                  tag: "BrowserUiMoved",
                  browserUiPosition: fields(
                    (field) => field("detail", parseBrowseUiPositionWithFallback)
                  )(event)
                });
              }
            ),
            addEventListener(
              elements.shadowRoot,
              CLOSE_ALL_ERROR_OVERLAYS_EVENT,
              () => {
                dispatch({
                  tag: "UiMsg",
                  date: getNow(),
                  msg: {
                    tag: "ChangedOpenErrorOverlay",
                    openErrorOverlay: false
                  }
                });
              }
            )
          ]
        ];
      },
      { once: true }
    );
    __ELM_WATCH.RELOAD_STATUSES[TARGET_NAME] = {
      tag: "MightWantToReload"
    };
    const originalOnInit = __ELM_WATCH.ON_INIT;
    __ELM_WATCH.ON_INIT = () => {
      dispatch({ tag: "AppInit" });
      originalOnInit();
    };
    const originalKillMatching = __ELM_WATCH.KILL_MATCHING;
    __ELM_WATCH.KILL_MATCHING = (targetName) => new Promise((resolve, reject) => {
      if (targetName.test(TARGET_NAME) && mutable.webSocket.readyState !== WebSocket.CLOSED) {
        mutable.webSocket.addEventListener("close", () => {
          originalKillMatching(targetName).then(resolve).catch(reject);
        });
        mutable.removeListeners();
        mutable.webSocket.close();
        if (mutable.webSocketTimeoutId !== void 0) {
          clearTimeout(mutable.webSocketTimeoutId);
          mutable.webSocketTimeoutId = void 0;
        }
        elements?.targetRoot.remove();
        resolvePromise(void 0);
      } else {
        originalKillMatching(targetName).then(resolve).catch(reject);
      }
    });
    const originalDisconnect = __ELM_WATCH.DISCONNECT;
    __ELM_WATCH.DISCONNECT = (targetName) => {
      if (targetName.test(TARGET_NAME) && mutable.webSocket.readyState !== WebSocket.CLOSED) {
        mutable.webSocket.close();
      } else {
        originalDisconnect(targetName);
      }
    };
    return mutable;
  };
  function addEventListener(target, eventName, listener) {
    target.addEventListener(eventName, listener);
    return () => {
      target.removeEventListener(eventName, listener);
    };
  }
  function initWebSocket(getNow, elmCompiledTimestamp, dispatch) {
    const hostname = window.location.hostname === "" ? "localhost" : window.location.hostname;
    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const url = new URL(`${protocol}://${hostname}:${WEBSOCKET_PORT}/elm-watch`);
    url.searchParams.set("elmWatchVersion", VERSION);
    url.searchParams.set("targetName", TARGET_NAME);
    url.searchParams.set("elmCompiledTimestamp", elmCompiledTimestamp.toString());
    const webSocket = new WebSocket(url);
    webSocket.addEventListener("open", () => {
      dispatch({ tag: "WebSocketConnected", date: getNow() });
    });
    webSocket.addEventListener("close", () => {
      dispatch({
        tag: "WebSocketClosed",
        date: getNow()
      });
    });
    webSocket.addEventListener("message", (event) => {
      dispatch({
        tag: "WebSocketMessageReceived",
        date: getNow(),
        data: event.data
      });
    });
    return webSocket;
  }
  var init = (date, browserUiPosition, elmCompiledTimestampBeforeReload) => {
    const model = {
      status: { tag: "Connecting", date, attemptNumber: 1 },
      previousStatusTag: "Idle",
      compilationMode: ORIGINAL_COMPILATION_MODE,
      browserUiPosition,
      lastBrowserUiPositionChangeDate: void 0,
      elmCompiledTimestamp: INITIAL_ELM_COMPILED_TIMESTAMP,
      elmCompiledTimestampBeforeReload,
      uiExpanded: false
    };
    return [model, [{ tag: "Render", model, manageFocus: false }]];
  };
  function update(msg, model) {
    switch (msg.tag) {
      case "AppInit":
        return [{ ...model }, []];
      case "BrowserUiMoved":
        return [{ ...model, browserUiPosition: msg.browserUiPosition }, []];
      case "EvalErrored":
        return [
          {
            ...model,
            status: { tag: "EvalError", date: msg.date },
            uiExpanded: true
          },
          [
            {
              tag: "TriggerReachedIdleState",
              reason: "EvalErrored"
            }
          ]
        ];
      case "EvalNeedsReload":
        return [
          {
            ...model,
            status: {
              tag: "WaitingForReload",
              date: msg.date,
              reasons: msg.reasons
            }
          },
          []
        ];
      case "EvalSucceeded":
        return [
          {
            ...model,
            status: {
              tag: "Idle",
              date: msg.date,
              sendKey: SEND_KEY_DO_NOT_USE_ALL_THE_TIME
            }
          },
          [
            {
              tag: "TriggerReachedIdleState",
              reason: "EvalSucceeded"
            }
          ]
        ];
      case "FocusedTab":
        return [
          statusToStatusType(model.status.tag) === "Error" ? { ...model } : model,
          [
            {
              tag: "SendMessage",
              message: { tag: "FocusedTab" },
              sendKey: SEND_KEY_DO_NOT_USE_ALL_THE_TIME
            },
            {
              tag: "WebSocketTimeoutBegin"
            }
          ]
        ];
      case "PageVisibilityChangedToVisible":
        return reconnect(model, msg.date, { force: true });
      case "SleepBeforeReconnectDone":
        return reconnect(model, msg.date, { force: false });
      case "UiMsg":
        return onUiMsg(msg.date, msg.msg, model);
      case "WebSocketClosed": {
        const attemptNumber = "attemptNumber" in model.status ? model.status.attemptNumber + 1 : 1;
        return [
          {
            ...model,
            status: {
              tag: "SleepingBeforeReconnect",
              date: msg.date,
              attemptNumber
            }
          },
          [{ tag: "SleepBeforeReconnect", attemptNumber }]
        ];
      }
      case "WebSocketConnected":
        return [
          {
            ...model,
            status: { tag: "Busy", date: msg.date, errorOverlay: void 0 }
          },
          []
        ];
      case "WebSocketMessageReceived": {
        const result = parseWebSocketMessageData(msg.data);
        switch (result.tag) {
          case "Success":
            return onWebSocketToClientMessage(msg.date, result.message, model);
          case "Error":
            return [
              {
                ...model,
                status: {
                  tag: "UnexpectedError",
                  date: msg.date,
                  message: result.message
                },
                uiExpanded: true
              },
              []
            ];
        }
      }
    }
  }
  function onUiMsg(date, msg, model) {
    switch (msg.tag) {
      case "ChangedBrowserUiPosition":
        return [
          {
            ...model,
            browserUiPosition: msg.browserUiPosition,
            lastBrowserUiPositionChangeDate: date
          },
          [
            {
              tag: "SendMessage",
              message: {
                tag: "ChangedBrowserUiPosition",
                browserUiPosition: msg.browserUiPosition
              },
              sendKey: msg.sendKey
            }
          ]
        ];
      case "ChangedCompilationMode":
        return [
          {
            ...model,
            status: {
              tag: "Busy",
              date,
              errorOverlay: getErrorOverlay(model.status)
            },
            compilationMode: msg.compilationMode
          },
          [
            {
              tag: "SendMessage",
              message: {
                tag: "ChangedCompilationMode",
                compilationMode: msg.compilationMode
              },
              sendKey: msg.sendKey
            }
          ]
        ];
      case "ChangedOpenErrorOverlay":
        return "errorOverlay" in model.status && model.status.errorOverlay !== void 0 ? [
          {
            ...model,
            status: {
              ...model.status,
              errorOverlay: {
                ...model.status.errorOverlay,
                openErrorOverlay: msg.openErrorOverlay
              }
            },
            uiExpanded: false
          },
          [
            {
              tag: "SendMessage",
              message: {
                tag: "ChangedOpenErrorOverlay",
                openErrorOverlay: msg.openErrorOverlay
              },
              sendKey: model.status.tag === "Busy" ? SEND_KEY_DO_NOT_USE_ALL_THE_TIME : model.status.sendKey
            }
          ]
        ] : [model, []];
      case "PressedChevron":
        return [{ ...model, uiExpanded: !model.uiExpanded }, []];
      case "PressedOpenEditor":
        return [
          model,
          [
            {
              tag: "SendMessage",
              message: {
                tag: "PressedOpenEditor",
                file: msg.file,
                line: msg.line,
                column: msg.column
              },
              sendKey: msg.sendKey
            }
          ]
        ];
      case "PressedReconnectNow":
        return reconnect(model, date, { force: true });
    }
  }
  function onWebSocketToClientMessage(date, msg, model) {
    switch (msg.tag) {
      case "FocusedTabAcknowledged":
        return [model, [{ tag: "WebSocketTimeoutClear" }]];
      case "OpenEditorFailed":
        return [
          model.status.tag === "CompileError" ? {
            ...model,
            status: { ...model.status, openEditorError: msg.error },
            uiExpanded: true
          } : model,
          [
            {
              tag: "TriggerReachedIdleState",
              reason: "OpenEditorFailed"
            }
          ]
        ];
      case "StatusChanged":
        return statusChanged(date, msg, model);
      case "SuccessfullyCompiled": {
        const justChangedBrowserUiPosition = model.lastBrowserUiPositionChangeDate !== void 0 && date.getTime() - model.lastBrowserUiPositionChangeDate.getTime() < JUST_CHANGED_BROWSER_UI_POSITION_TIMEOUT;
        return msg.compilationMode !== ORIGINAL_COMPILATION_MODE ? [
          {
            ...model,
            status: {
              tag: "WaitingForReload",
              date,
              reasons: ORIGINAL_COMPILATION_MODE === "proxy" ? [] : [
                `compilation mode changed from ${ORIGINAL_COMPILATION_MODE} to ${msg.compilationMode}.`
              ]
            },
            compilationMode: msg.compilationMode
          },
          []
        ] : [
          {
            ...model,
            compilationMode: msg.compilationMode,
            elmCompiledTimestamp: msg.elmCompiledTimestamp,
            browserUiPosition: msg.browserUiPosition,
            lastBrowserUiPositionChangeDate: void 0
          },
          [
            { tag: "Eval", code: msg.code },
            justChangedBrowserUiPosition ? {
              tag: "SetBrowserUiPosition",
              browserUiPosition: msg.browserUiPosition
            } : { tag: "NoCmd" }
          ]
        ];
      }
      case "SuccessfullyCompiledButRecordFieldsChanged":
        return [
          {
            ...model,
            status: {
              tag: "WaitingForReload",
              date,
              reasons: [
                `record field mangling in optimize mode was different than last time.`
              ]
            }
          },
          []
        ];
    }
  }
  function statusChanged(date, { status }, model) {
    switch (status.tag) {
      case "AlreadyUpToDate":
        return [
          {
            ...model,
            status: {
              tag: "Idle",
              date,
              sendKey: SEND_KEY_DO_NOT_USE_ALL_THE_TIME
            },
            compilationMode: status.compilationMode,
            browserUiPosition: status.browserUiPosition
          },
          [
            {
              tag: "TriggerReachedIdleState",
              reason: "AlreadyUpToDate"
            }
          ]
        ];
      case "Busy":
        return [
          {
            ...model,
            status: {
              tag: "Busy",
              date,
              errorOverlay: getErrorOverlay(model.status)
            },
            compilationMode: status.compilationMode,
            browserUiPosition: status.browserUiPosition
          },
          []
        ];
      case "ClientError":
        return [
          {
            ...model,
            status: { tag: "UnexpectedError", date, message: status.message },
            uiExpanded: true
          },
          [
            {
              tag: "TriggerReachedIdleState",
              reason: "ClientError"
            }
          ]
        ];
      case "CompileError":
        return [
          {
            ...model,
            status: {
              tag: "CompileError",
              date,
              sendKey: SEND_KEY_DO_NOT_USE_ALL_THE_TIME,
              errorOverlay: {
                errors: new Map(
                  status.errors.map((error) => {
                    const overlayError = {
                      title: error.title,
                      location: error.location,
                      htmlContent: error.htmlContent,
                      foregroundColor: status.foregroundColor,
                      backgroundColor: status.backgroundColor
                    };
                    const id = JSON.stringify(overlayError);
                    return [id, overlayError];
                  })
                ),
                openErrorOverlay: status.openErrorOverlay
              },
              openEditorError: void 0
            },
            compilationMode: status.compilationMode,
            browserUiPosition: status.browserUiPosition
          },
          [
            {
              tag: "TriggerReachedIdleState",
              reason: "CompileError"
            }
          ]
        ];
      case "ElmJsonError":
        return [
          {
            ...model,
            status: { tag: "ElmJsonError", date, error: status.error }
          },
          [
            {
              tag: "TriggerReachedIdleState",
              reason: "ElmJsonError"
            }
          ]
        ];
    }
  }
  function reconnect(model, date, { force }) {
    return model.status.tag === "SleepingBeforeReconnect" && (date.getTime() - model.status.date.getTime() >= retryWaitMs(model.status.attemptNumber) || force) ? [
      {
        ...model,
        status: {
          tag: "Connecting",
          date,
          attemptNumber: model.status.attemptNumber
        }
      },
      [
        {
          tag: "Reconnect",
          elmCompiledTimestamp: model.elmCompiledTimestamp
        }
      ]
    ] : [model, []];
  }
  function retryWaitMs(attemptNumber) {
    return Math.min(1e3 + 10 * attemptNumber ** 2, 1e3 * 60);
  }
  function printRetryWaitMs(attemptNumber) {
    return `${retryWaitMs(attemptNumber) / 1e3} seconds`;
  }
  var runCmd = (getNow, elements) => (cmd, mutable, dispatch, _resolvePromise, rejectPromise) => {
    switch (cmd.tag) {
      case "Eval": {
        try {
          const f = new Function(cmd.code);
          f();
          dispatch({ tag: "EvalSucceeded", date: getNow() });
        } catch (unknownError) {
          if (unknownError instanceof Error && unknownError.message.startsWith("ELM_WATCH_RELOAD_NEEDED")) {
            dispatch({
              tag: "EvalNeedsReload",
              date: getNow(),
              reasons: unknownError.message.split("\n\n---\n\n").slice(1)
            });
          } else {
            void Promise.reject(unknownError);
            dispatch({ tag: "EvalErrored", date: getNow() });
          }
        }
        return;
      }
      case "NoCmd":
        return;
      case "Reconnect":
        mutable.webSocket = initWebSocket(
          getNow,
          cmd.elmCompiledTimestamp,
          dispatch
        );
        return;
      case "Render": {
        const { model } = cmd;
        const info = {
          version: VERSION,
          webSocketUrl: new URL(mutable.webSocket.url),
          targetName: TARGET_NAME,
          originalCompilationMode: ORIGINAL_COMPILATION_MODE,
          initializedElmAppsStatus: checkInitializedElmAppsStatus(),
          errorOverlayVisible: elements !== void 0 && !elements.overlay.hidden
        };
        if (elements === void 0) {
          if (model.status.tag !== model.previousStatusTag) {
            const isError = statusToStatusType(model.status.tag) === "Error";
            const consoleMethod = isError ? console.error : console.info;
            consoleMethod(renderWebWorker(model, info));
          }
        } else {
          const { targetRoot } = elements;
          render(getNow, targetRoot, dispatch, model, info, cmd.manageFocus);
        }
        return;
      }
      case "SendMessage": {
        const json = JSON.stringify(cmd.message);
        try {
          mutable.webSocket.send(json);
        } catch (error) {
          console.error("elm-watch: Failed to send WebSocket message:", error);
        }
        return;
      }
      case "SetBrowserUiPosition":
        if (elements !== void 0) {
          setBrowserUiPosition(cmd.browserUiPosition, elements);
        }
        return;
      case "SleepBeforeReconnect":
        setTimeout(() => {
          if (typeof document === "undefined" || document.visibilityState === "visible") {
            dispatch({ tag: "SleepBeforeReconnectDone", date: getNow() });
          }
        }, retryWaitMs(cmd.attemptNumber));
        return;
      case "TriggerReachedIdleState":
        Promise.resolve().then(() => {
          __ELM_WATCH.ON_REACHED_IDLE_STATE(cmd.reason);
        }).catch(rejectPromise);
        return;
      case "UpdateErrorOverlay":
        if (elements !== void 0) {
          updateErrorOverlay(
            TARGET_NAME,
            (msg) => {
              dispatch({ tag: "UiMsg", date: getNow(), msg });
            },
            cmd.sendKey,
            cmd.errors,
            elements.overlay,
            elements.overlayCloseButton
          );
        }
        return;
      case "UpdateGlobalStatus":
        __ELM_WATCH.RELOAD_STATUSES[TARGET_NAME] = cmd.reloadStatus;
        switch (cmd.reloadStatus.tag) {
          case "NoReloadWanted":
          case "MightWantToReload":
            break;
          case "ReloadRequested":
            try {
              window.sessionStorage.setItem(
                RELOAD_TARGET_NAME_KEY_PREFIX + TARGET_NAME,
                cmd.elmCompiledTimestamp.toString()
              );
            } catch {
            }
        }
        reloadPageIfNeeded();
        return;
      case "WebSocketTimeoutBegin":
        if (mutable.webSocketTimeoutId === void 0) {
          mutable.webSocketTimeoutId = setTimeout(() => {
            mutable.webSocketTimeoutId = void 0;
            mutable.webSocket.close();
            dispatch({
              tag: "WebSocketClosed",
              date: getNow()
            });
          }, __ELM_WATCH.WEBSOCKET_TIMEOUT);
        }
        return;
      case "WebSocketTimeoutClear":
        if (mutable.webSocketTimeoutId !== void 0) {
          clearTimeout(mutable.webSocketTimeoutId);
          mutable.webSocketTimeoutId = void 0;
        }
        return;
    }
  };
  function parseWebSocketMessageData(data) {
    try {
      return {
        tag: "Success",
        message: decodeWebSocketToClientMessage(string(data))
      };
    } catch (unknownError) {
      return {
        tag: "Error",
        message: `Failed to decode web socket message sent from the server:
${possiblyDecodeErrorToString(
          unknownError
        )}`
      };
    }
  }
  function possiblyDecodeErrorToString(unknownError) {
    return unknownError instanceof DecoderError ? unknownError.format() : unknownError instanceof Error ? unknownError.message : repr(unknownError);
  }
  function functionToNull(value) {
    return typeof value === "function" ? null : value;
  }
  var ProgramType = stringUnion({
    "Platform.worker": null,
    "Browser.sandbox": null,
    "Browser.element": null,
    "Browser.document": null,
    "Browser.application": null,
    Html: null
  });
  var ElmModule = chain(
    record(
      chain(
        functionToNull,
        multi({
          null: () => [],
          array: array(
            fields((field) => field("__elmWatchProgramType", ProgramType))
          ),
          object: (value) => ElmModule(value)
        })
      )
    ),
    (record2) => Object.values(record2).flat()
  );
  var ProgramTypes = fields((field) => field("Elm", ElmModule));
  function checkInitializedElmAppsStatus() {
    if (window.Elm !== void 0 && "__elmWatchProxy" in window.Elm) {
      return {
        tag: "DebuggerModeStatus",
        status: {
          tag: "Disabled",
          reason: noDebuggerYetReason
        }
      };
    }
    if (window.Elm === void 0) {
      return { tag: "MissingWindowElm" };
    }
    let programTypes;
    try {
      programTypes = ProgramTypes(window);
    } catch (unknownError) {
      return {
        tag: "DecodeError",
        message: possiblyDecodeErrorToString(unknownError)
      };
    }
    if (programTypes.length === 0) {
      return { tag: "NoProgramsAtAll" };
    }
    const noDebugger = programTypes.filter((programType) => {
      switch (programType) {
        case "Platform.worker":
        case "Html":
          return true;
        case "Browser.sandbox":
        case "Browser.element":
        case "Browser.document":
        case "Browser.application":
          return false;
      }
    });
    return {
      tag: "DebuggerModeStatus",
      status: noDebugger.length === programTypes.length ? {
        tag: "Disabled",
        reason: noDebuggerReason(new Set(noDebugger))
      } : { tag: "Enabled" }
    };
  }
  function reloadPageIfNeeded() {
    let shouldReload = false;
    const reasons = [];
    for (const [targetName, reloadStatus] of Object.entries(
      __ELM_WATCH.RELOAD_STATUSES
    )) {
      switch (reloadStatus.tag) {
        case "MightWantToReload":
          return;
        case "NoReloadWanted":
          break;
        case "ReloadRequested":
          shouldReload = true;
          if (reloadStatus.reasons.length > 0) {
            reasons.push([targetName, reloadStatus.reasons]);
          }
          break;
      }
    }
    if (!shouldReload) {
      return;
    }
    const first = reasons[0];
    const [separator, reasonString] = reasons.length === 1 && first !== void 0 && first[1].length === 1 ? [" ", `${first[1].join("")}
(target: ${first[0]})`] : [
      ":\n\n",
      reasons.map(
        ([targetName, subReasons]) => [
          targetName,
          ...subReasons.map((subReason) => `- ${subReason}`)
        ].join("\n")
      ).join("\n\n")
    ];
    const message = reasons.length === 0 ? void 0 : `elm-watch: I did a full page reload because${separator}${reasonString}`;
    __ELM_WATCH.RELOAD_STATUSES = {};
    __ELM_WATCH.RELOAD_PAGE(message);
  }
  function h(t, {
    attrs,
    style,
    localName,
    ...props
  }, ...children) {
    const element = document.createElement(
      localName ?? t.name.replace(/^HTML(\w+)Element$/, "$1").replace("Anchor", "a").replace("Paragraph", "p").replace(/^([DOU])List$/, "$1l").toLowerCase()
    );
    Object.assign(element, props);
    if (attrs !== void 0) {
      for (const [key, value] of Object.entries(attrs)) {
        element.setAttribute(key, value);
      }
    }
    if (style !== void 0) {
      for (const [key, value] of Object.entries(style)) {
        element.style[key] = value;
      }
    }
    for (const child of children) {
      if (child !== void 0) {
        element.append(
          typeof child === "string" ? document.createTextNode(child) : child
        );
      }
    }
    return element;
  }
  function renderWebWorker(model, info) {
    const statusData = statusIconAndText(model, info);
    return `${statusData.icon} elm-watch: ${statusData.status} ${formatTime(
      model.status.date
    )} (${info.targetName})`;
  }
  function render(getNow, targetRoot, dispatch, model, info, manageFocus) {
    targetRoot.replaceChildren(
      view(
        (msg) => {
          dispatch({ tag: "UiMsg", date: getNow(), msg });
        },
        model,
        info,
        manageFocus
      )
    );
    const firstFocusableElement = targetRoot.querySelector(`button, [tabindex]`);
    if (manageFocus && firstFocusableElement instanceof HTMLElement) {
      firstFocusableElement.focus();
    }
    __ELM_WATCH.ON_RENDER(TARGET_NAME);
  }
  var CLASS = {
    browserUiPositionButton: "browserUiPositionButton",
    browserUiPositionChooser: "browserUiPositionChooser",
    chevronButton: "chevronButton",
    compilationModeWithIcon: "compilationModeWithIcon",
    container: "container",
    debugModeIcon: "debugModeIcon",
    envNotSet: "envNotSet",
    errorLocationButton: "errorLocationButton",
    errorTitle: "errorTitle",
    expandedUiContainer: "expandedUiContainer",
    flashError: "flashError",
    flashSuccess: "flashSuccess",
    overlay: "overlay",
    overlayCloseButton: "overlayCloseButton",
    root: "root",
    rootBottomHalf: "rootBottomHalf",
    shortStatusContainer: "shortStatusContainer",
    targetName: "targetName",
    targetRoot: "targetRoot"
  };
  function getStatusClass({
    statusType,
    statusTypeChanged,
    hasReceivedHotReload,
    uiRelatedUpdate,
    errorOverlayVisible
  }) {
    switch (statusType) {
      case "Success":
        return statusTypeChanged && hasReceivedHotReload ? CLASS.flashSuccess : void 0;
      case "Error":
        return errorOverlayVisible ? statusTypeChanged && hasReceivedHotReload ? CLASS.flashError : void 0 : uiRelatedUpdate ? void 0 : CLASS.flashError;
      case "Waiting":
        return void 0;
    }
  }
  var CHEVRON_UP = "\u25B2";
  var CHEVRON_DOWN = "\u25BC";
  var CSS = `
input,
button,
select,
textarea {
  font-family: inherit;
  font-size: inherit;
  font-weight: inherit;
  letter-spacing: inherit;
  line-height: inherit;
  color: inherit;
  margin: 0;
}

fieldset {
  display: grid;
  gap: 0.25em;
  margin: 0;
  border: 1px solid var(--grey);
  padding: 0.25em 0.75em 0.5em;
}

fieldset:disabled {
  color: var(--grey);
}

p,
dd {
  margin: 0;
}

dl {
  display: grid;
  grid-template-columns: auto auto;
  gap: 0.25em 1em;
  margin: 0;
  white-space: nowrap;
}

dt {
  text-align: right;
  color: var(--grey);
}

time {
  display: inline-grid;
  overflow: hidden;
}

time::after {
  content: attr(data-format);
  visibility: hidden;
  height: 0;
}

.${CLASS.overlay} {
  position: fixed;
  z-index: -2;
  inset: 0;
  overflow-y: auto;
  padding: 2ch 0;
}

.${CLASS.overlayCloseButton} {
  position: fixed;
  z-index: -1;
  top: 0;
  right: 0;
  appearance: none;
  padding: 1em;
  border: none;
  border-radius: 0;
  background: none;
  cursor: pointer;
  font-size: 1.25em;
  filter: drop-shadow(0 0 0.125em var(--backgroundColor));
}

.${CLASS.overlayCloseButton}::before,
.${CLASS.overlayCloseButton}::after {
  content: "";
  display: block;
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0.125em;
  height: 1em;
  background-color: var(--foregroundColor);
  transform: translate(-50%, -50%) rotate(45deg);
}

.${CLASS.overlayCloseButton}::after {
  transform: translate(-50%, -50%) rotate(-45deg);
}

.${CLASS.overlay},
.${CLASS.overlay} pre {
  font-family: ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, Liberation Mono, monospace;
}

.${CLASS.overlay} details {
  --border-thickness: 0.125em;
  border-top: var(--border-thickness) solid;
  margin: 2ch 0;
}

.${CLASS.overlay} summary {
  cursor: pointer;
  pointer-events: none;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0 2ch;
  word-break: break-word;
}

.${CLASS.overlay} summary::-webkit-details-marker {
  display: none;
}

.${CLASS.overlay} summary::marker {
  content: none;
}

.${CLASS.overlay} summary > * {
  pointer-events: auto;
}

.${CLASS.errorTitle} {
  display: inline-block;
  font-weight: bold;
  --padding: 1ch;
  padding: 0 var(--padding);
  transform: translate(calc(var(--padding) * -1), calc(-50% - var(--border-thickness) / 2));
}

.${CLASS.errorTitle}::before {
  content: "${CHEVRON_DOWN}";
  display: inline-block;
  margin-right: 1ch;
  transform: translateY(-0.0625em);
}

details[open] > summary > .${CLASS.errorTitle}::before {
  content: "${CHEVRON_UP}";
}

.${CLASS.errorLocationButton} {
  appearance: none;
  padding: 0;
  border: none;
  border-radius: 0;
  background: none;
  text-align: left;
  text-decoration: underline;
  cursor: pointer;
}

.${CLASS.overlay} pre {
  margin: 0;
  padding: 2ch;
  overflow-x: auto;
}

.${CLASS.root} {
  --grey: #767676;
  display: flex;
  align-items: start;
  overflow: auto;
  max-height: 100vh;
  max-width: 100vw;
  color: black;
  font-family: system-ui;
}

.${CLASS.rootBottomHalf} {
  align-items: end;
}

.${CLASS.targetRoot} + .${CLASS.targetRoot} {
  margin-left: -1px;
}

.${CLASS.targetRoot}:only-of-type .${CLASS.debugModeIcon},
.${CLASS.targetRoot}:only-of-type .${CLASS.targetName} {
  display: none;
}

.${CLASS.container} {
  display: flex;
  flex-direction: column-reverse;
  background-color: white;
  border: 1px solid var(--grey);
}

.${CLASS.rootBottomHalf} .${CLASS.container} {
  flex-direction: column;
}

.${CLASS.envNotSet} {
  display: grid;
  gap: 0.75em;
  margin: 2em 0;
}

.${CLASS.envNotSet},
.${CLASS.root} pre {
  border-left: 0.25em solid var(--grey);
  padding-left: 0.5em;
}

.${CLASS.root} pre {
  margin: 0;
  white-space: pre-wrap;
}

.${CLASS.expandedUiContainer} {
  padding: 1em;
  padding-top: 0.75em;
  display: grid;
  gap: 0.75em;
  outline: none;
  contain: paint;
}

.${CLASS.rootBottomHalf} .${CLASS.expandedUiContainer} {
  padding-bottom: 0.75em;
}

.${CLASS.expandedUiContainer}:is(.length0, .length1) {
  grid-template-columns: min-content;
}

.${CLASS.expandedUiContainer} > dl {
  justify-self: start;
}

.${CLASS.expandedUiContainer} label {
  display: grid;
  grid-template-columns: min-content auto;
  align-items: center;
  gap: 0.25em;
}

.${CLASS.expandedUiContainer} label.Disabled {
  color: var(--grey);
}

.${CLASS.expandedUiContainer} label > small {
  grid-column: 2;
}

.${CLASS.compilationModeWithIcon} {
  display: flex;
  align-items: center;
  gap: 0.25em;
}

.${CLASS.browserUiPositionChooser} {
  position: absolute;
  display: grid;
  grid-template-columns: min-content min-content;
  pointer-events: none;
}

.${CLASS.browserUiPositionButton} {
  appearance: none;
  padding: 0;
  border: none;
  background: none;
  border-radius: none;
  pointer-events: auto;
  width: 1em;
  height: 1em;
  text-align: center;
  line-height: 1em;
}

.${CLASS.browserUiPositionButton}:hover {
  background-color: rgba(0, 0, 0, 0.25);
}

.${CLASS.targetRoot}:not(:first-child) .${CLASS.browserUiPositionChooser} {
  display: none;
}

.${CLASS.shortStatusContainer} {
  line-height: 1;
  padding: 0.25em;
  cursor: pointer;
  user-select: none;
  display: flex;
  align-items: center;
  gap: 0.25em;
}

.${CLASS.flashError}::before,
.${CLASS.flashSuccess}::before {
  content: "";
  position: absolute;
  margin-top: 0.5em;
  margin-left: 0.5em;
  --size: min(500px, 100vmin);
  width: var(--size);
  height: var(--size);
  border-radius: 50%;
  animation: flash 0.7s 0.05s ease-out both;
  pointer-events: none;
}

.${CLASS.flashError}::before {
  background-color: #eb0000;
}

.${CLASS.flashSuccess}::before {
  background-color: #00b600;
}

@keyframes flash {
  from {
    transform: translate(-50%, -50%) scale(0);
    opacity: 0.9;
  }

  to {
    transform: translate(-50%, -50%) scale(1);
    opacity: 0;
  }
}

@keyframes nudge {
  from {
    opacity: 0;
  }

  to {
    opacity: 0.8;
  }
}

@media (prefers-reduced-motion: reduce) {
  .${CLASS.flashError}::before,
  .${CLASS.flashSuccess}::before {
    transform: translate(-50%, -50%);
    width: 2em;
    height: 2em;
    animation: nudge 0.25s ease-in-out 4 alternate forwards;
  }
}

.${CLASS.chevronButton} {
  appearance: none;
  border: none;
  border-radius: 0;
  background: none;
  padding: 0;
  cursor: pointer;
}
`;
  function view(dispatch, passedModel, info, manageFocus) {
    const model = __ELM_WATCH.MOCKED_TIMINGS ? {
      ...passedModel,
      status: {
        ...passedModel.status,
        date: new Date("2022-02-05T13:10:05Z")
      }
    } : passedModel;
    const statusData = {
      ...statusIconAndText(model, info),
      ...viewStatus(dispatch, model, info)
    };
    const statusType = statusToStatusType(model.status.tag);
    const statusTypeChanged = statusType !== statusToStatusType(model.previousStatusTag);
    const statusClass = getStatusClass({
      statusType,
      statusTypeChanged,
      hasReceivedHotReload: model.elmCompiledTimestamp !== INITIAL_ELM_COMPILED_TIMESTAMP,
      uiRelatedUpdate: manageFocus,
      errorOverlayVisible: info.errorOverlayVisible
    });
    return h(
      HTMLDivElement,
      { className: CLASS.container },
      model.uiExpanded ? viewExpandedUi(
        model.status,
        statusData,
        info,
        model.browserUiPosition,
        dispatch
      ) : void 0,
      h(
        HTMLDivElement,
        {
          className: CLASS.shortStatusContainer,
          onclick: () => {
            dispatch({ tag: "PressedChevron" });
          }
        },
        h(
          HTMLButtonElement,
          {
            className: CLASS.chevronButton,
            attrs: { "aria-expanded": model.uiExpanded.toString() }
          },
          icon(
            model.uiExpanded ? CHEVRON_UP : CHEVRON_DOWN,
            model.uiExpanded ? "Collapse elm-watch" : "Expand elm-watch"
          )
        ),
        compilationModeIcon(model.compilationMode),
        icon(
          statusData.icon,
          statusData.status,
          statusClass === void 0 ? {} : {
            className: statusClass,
            onanimationend: (event) => {
              if (event.currentTarget instanceof HTMLElement) {
                event.currentTarget.classList.remove(statusClass);
              }
            }
          }
        ),
        h(
          HTMLTimeElement,
          { dateTime: model.status.date.toISOString() },
          formatTime(model.status.date)
        ),
        h(HTMLSpanElement, { className: CLASS.targetName }, TARGET_NAME)
      )
    );
  }
  function icon(emoji, alt, props) {
    return h(
      HTMLSpanElement,
      { attrs: { "aria-label": alt }, ...props },
      h(HTMLSpanElement, { attrs: { "aria-hidden": "true" } }, emoji)
    );
  }
  function viewExpandedUi(status, statusData, info, browserUiPosition, dispatch) {
    const items = [
      ["target", info.targetName],
      ["elm-watch", info.version],
      ["web socket", printWebSocketUrl(info.webSocketUrl)],
      [
        "updated",
        h(
          HTMLTimeElement,
          {
            dateTime: status.date.toISOString(),
            attrs: { "data-format": "2044-04-30 04:44:44" }
          },
          `${formatDate(status.date)} ${formatTime(status.date)}`
        )
      ],
      ["status", statusData.status],
      ...statusData.dl
    ];
    const browserUiPositionSendKey = statusToSpecialCaseSendKey(status);
    return h(
      HTMLDivElement,
      {
        className: `${CLASS.expandedUiContainer} length${statusData.content.length}`,
        attrs: {
          tabindex: "-1"
        }
      },
      h(
        HTMLDListElement,
        {},
        ...items.flatMap(([key, value]) => [
          h(HTMLElement, { localName: "dt" }, key),
          h(HTMLElement, { localName: "dd" }, value)
        ])
      ),
      ...statusData.content,
      browserUiPositionSendKey === void 0 ? void 0 : viewBrowserUiPositionChooser(
        browserUiPosition,
        dispatch,
        browserUiPositionSendKey
      )
    );
  }
  var allBrowserUiPositionsInOrder = [
    "TopLeft",
    "TopRight",
    "BottomLeft",
    "BottomRight"
  ];
  function viewBrowserUiPositionChooser(currentPosition, dispatch, sendKey) {
    const arrows = getBrowserUiPositionArrows(currentPosition);
    return h(
      HTMLDivElement,
      {
        className: CLASS.browserUiPositionChooser,
        style: browserUiPositionToCssForChooser(currentPosition)
      },
      ...allBrowserUiPositionsInOrder.map((position) => {
        const arrow = arrows[position];
        return arrow === void 0 ? h(HTMLDivElement, { style: { visibility: "hidden" } }, "\xB7") : h(
          HTMLButtonElement,
          {
            className: CLASS.browserUiPositionButton,
            attrs: { "data-position": position },
            onclick: () => {
              dispatch({
                tag: "ChangedBrowserUiPosition",
                browserUiPosition: position,
                sendKey
              });
            }
          },
          arrow
        );
      })
    );
  }
  var ARROW_UP = "\u2191";
  var ARROW_DOWN = "\u2193";
  var ARROW_LEFT = "\u2190";
  var ARROW_RIGHT = "\u2192";
  var ARROW_UP_LEFT = "\u2196";
  var ARROW_UP_RIGHT = "\u2197";
  var ARROW_DOWN_LEFT = "\u2199";
  var ARROW_DOWN_RIGHT = "\u2198";
  function getBrowserUiPositionArrows(browserUiPosition) {
    switch (browserUiPosition) {
      case "TopLeft":
        return {
          TopLeft: void 0,
          TopRight: ARROW_RIGHT,
          BottomLeft: ARROW_DOWN,
          BottomRight: ARROW_DOWN_RIGHT
        };
      case "TopRight":
        return {
          TopLeft: ARROW_LEFT,
          TopRight: void 0,
          BottomLeft: ARROW_DOWN_LEFT,
          BottomRight: ARROW_DOWN
        };
      case "BottomLeft":
        return {
          TopLeft: ARROW_UP,
          TopRight: ARROW_UP_RIGHT,
          BottomLeft: void 0,
          BottomRight: ARROW_RIGHT
        };
      case "BottomRight":
        return {
          TopLeft: ARROW_UP_LEFT,
          TopRight: ARROW_UP,
          BottomLeft: ARROW_LEFT,
          BottomRight: void 0
        };
    }
  }
  function statusIconAndText(model, info) {
    switch (model.status.tag) {
      case "Busy":
        return {
          icon: "\u23F3",
          status: "Waiting for compilation"
        };
      case "CompileError":
        return {
          icon: "\u{1F6A8}",
          status: "Compilation error"
        };
      case "Connecting":
        return {
          icon: "\u{1F50C}",
          status: "Connecting"
        };
      case "ElmJsonError":
        return {
          icon: "\u{1F6A8}",
          status: "elm.json or inputs error"
        };
      case "EvalError":
        return {
          icon: "\u26D4\uFE0F",
          status: "Eval error"
        };
      case "Idle":
        return {
          icon: idleIcon(info.initializedElmAppsStatus),
          status: "Successfully compiled"
        };
      case "SleepingBeforeReconnect":
        return {
          icon: "\u{1F50C}",
          status: "Sleeping"
        };
      case "UnexpectedError":
        return {
          icon: "\u274C",
          status: "Unexpected error"
        };
      case "WaitingForReload":
        return model.elmCompiledTimestamp === model.elmCompiledTimestampBeforeReload ? {
          icon: "\u274C",
          status: "Reload trouble"
        } : {
          icon: "\u23F3",
          status: "Waiting for reload"
        };
    }
  }
  function viewStatus(dispatch, model, info) {
    const { status, compilationMode } = model;
    switch (status.tag) {
      case "Busy":
        return {
          dl: [],
          content: [
            ...viewCompilationModeChooser({
              dispatch,
              sendKey: void 0,
              compilationMode,
              warnAboutCompilationModeMismatch: false,
              info
            }),
            ...status.errorOverlay === void 0 ? [] : [viewErrorOverlayToggleButton(dispatch, status.errorOverlay)]
          ]
        };
      case "CompileError":
        return {
          dl: [],
          content: [
            ...viewCompilationModeChooser({
              dispatch,
              sendKey: status.sendKey,
              compilationMode,
              warnAboutCompilationModeMismatch: true,
              info
            }),
            viewErrorOverlayToggleButton(dispatch, status.errorOverlay),
            ...status.openEditorError === void 0 ? [] : viewOpenEditorError(status.openEditorError)
          ]
        };
      case "Connecting":
        return {
          dl: [
            ["attempt", status.attemptNumber.toString()],
            ["sleep", printRetryWaitMs(status.attemptNumber)]
          ],
          content: [
            ...viewHttpsInfo(info.webSocketUrl),
            h(HTMLButtonElement, { disabled: true }, "Connecting web socket\u2026")
          ]
        };
      case "ElmJsonError":
        return {
          dl: [],
          content: [
            h(HTMLPreElement, { style: { minWidth: "80ch" } }, status.error)
          ]
        };
      case "EvalError":
        return {
          dl: [],
          content: [
            h(
              HTMLParagraphElement,
              {},
              "Check the console in the browser developer tools to see errors!"
            )
          ]
        };
      case "Idle":
        return {
          dl: [],
          content: viewCompilationModeChooser({
            dispatch,
            sendKey: status.sendKey,
            compilationMode,
            warnAboutCompilationModeMismatch: true,
            info
          })
        };
      case "SleepingBeforeReconnect":
        return {
          dl: [
            ["attempt", status.attemptNumber.toString()],
            ["sleep", printRetryWaitMs(status.attemptNumber)]
          ],
          content: [
            ...viewHttpsInfo(info.webSocketUrl),
            h(
              HTMLButtonElement,
              {
                onclick: () => {
                  dispatch({ tag: "PressedReconnectNow" });
                }
              },
              "Reconnect web socket now"
            )
          ]
        };
      case "UnexpectedError":
        return {
          dl: [],
          content: [
            h(
              HTMLParagraphElement,
              {},
              "I ran into an unexpected error! This is the error message:"
            ),
            h(HTMLPreElement, {}, status.message)
          ]
        };
      case "WaitingForReload":
        return {
          dl: [],
          content: model.elmCompiledTimestamp === model.elmCompiledTimestampBeforeReload ? [
            "A while ago I reloaded the page to get new compiled JavaScript.",
            "But it looks like after the last page reload I got the same JavaScript as before, instead of new stuff!",
            `The old JavaScript was compiled ${new Date(
              model.elmCompiledTimestamp
            ).toLocaleString()}, and so was the JavaScript currently running.`,
            "I currently need to reload the page again, but fear a reload loop if I try.",
            "Do you have accidental HTTP caching enabled maybe?",
            "Try hard refreshing the page and see if that helps, and consider disabling HTTP caching during development."
          ].map((text) => h(HTMLParagraphElement, {}, text)) : [h(HTMLParagraphElement, {}, "Waiting for other targets\u2026")]
        };
    }
  }
  function viewErrorOverlayToggleButton(dispatch, errorOverlay) {
    return h(
      HTMLButtonElement,
      {
        attrs: {
          "data-test-id": errorOverlay.openErrorOverlay ? "HideErrorOverlayButton" : "ShowErrorOverlayButton"
        },
        onclick: () => {
          dispatch({
            tag: "ChangedOpenErrorOverlay",
            openErrorOverlay: !errorOverlay.openErrorOverlay
          });
        }
      },
      errorOverlay.openErrorOverlay ? "Hide errors" : "Show errors"
    );
  }
  function viewOpenEditorError(error) {
    switch (error.tag) {
      case "EnvNotSet":
        return [
          h(
            HTMLDivElement,
            { className: CLASS.envNotSet },
            h(
              HTMLParagraphElement,
              {},
              "\u2139\uFE0F Clicking error locations only works if you set it up."
            ),
            h(
              HTMLParagraphElement,
              {},
              "Check this out: ",
              h(
                HTMLAnchorElement,
                {
                  href: "https://lydell.github.io/elm-watch/browser-ui/#clickable-error-locations",
                  target: "_blank",
                  rel: "noreferrer"
                },
                h(
                  HTMLElement,
                  { localName: "strong" },
                  "Clickable error locations"
                )
              )
            )
          )
        ];
      case "CommandFailed":
        return [
          h(
            HTMLParagraphElement,
            {},
            h(
              HTMLElement,
              { localName: "strong" },
              "Opening the location in your editor failed!"
            )
          ),
          h(HTMLPreElement, {}, error.message)
        ];
    }
  }
  function idleIcon(status) {
    switch (status.tag) {
      case "DecodeError":
      case "MissingWindowElm":
        return "\u274C";
      case "NoProgramsAtAll":
        return "\u2753";
      case "DebuggerModeStatus":
        return "\u2705";
    }
  }
  function compilationModeIcon(compilationMode) {
    switch (compilationMode) {
      case "proxy":
        return void 0;
      case "debug":
        return icon("\u{1F41B}", "Debug mode", { className: CLASS.debugModeIcon });
      case "standard":
        return void 0;
      case "optimize":
        return icon("\u{1F680}", "Optimize mode");
    }
  }
  function printWebSocketUrl(url) {
    const hostname = url.hostname.endsWith(".localhost") ? "localhost" : url.hostname;
    return `${url.protocol}//${hostname}:${url.port}`;
  }
  function viewHttpsInfo(webSocketUrl) {
    return webSocketUrl.protocol === "wss:" ? [
      h(
        HTMLParagraphElement,
        {},
        h(HTMLElement, { localName: "strong" }, "Having trouble connecting?")
      ),
      h(
        HTMLParagraphElement,
        {},
        " You might need to ",
        h(
          HTMLAnchorElement,
          { href: new URL(`https://${webSocketUrl.host}/accept`).href },
          "accept elm-watch\u2019s self-signed certificate"
        ),
        ". "
      ),
      h(
        HTMLParagraphElement,
        {},
        h(
          HTMLAnchorElement,
          {
            href: "https://lydell.github.io/elm-watch/https/",
            target: "_blank",
            rel: "noreferrer"
          },
          "More information"
        ),
        "."
      )
    ] : [];
  }
  var noDebuggerYetReason = "The Elm debugger isn't available at this point.";
  function noDebuggerReason(noDebuggerProgramTypes) {
    return `The Elm debugger isn't supported by ${humanList(
      Array.from(noDebuggerProgramTypes, (programType) => `\`${programType}\``),
      "and"
    )} programs.`;
  }
  function humanList(list, joinWord) {
    const { length } = list;
    return length <= 1 ? list.join("") : length === 2 ? list.join(` ${joinWord} `) : `${list.slice(0, length - 2).join(", ")}, ${list.slice(-2).join(` ${joinWord} `)}`;
  }
  function viewCompilationModeChooser({
    dispatch,
    sendKey,
    compilationMode: selectedMode,
    warnAboutCompilationModeMismatch,
    info
  }) {
    switch (info.initializedElmAppsStatus.tag) {
      case "DecodeError":
        return [
          h(
            HTMLParagraphElement,
            {},
            "window.Elm does not look like expected! This is the error message:"
          ),
          h(HTMLPreElement, {}, info.initializedElmAppsStatus.message)
        ];
      case "MissingWindowElm":
        return [
          h(
            HTMLParagraphElement,
            {},
            "elm-watch requires ",
            h(
              HTMLAnchorElement,
              {
                href: "https://lydell.github.io/elm-watch/window.Elm/",
                target: "_blank",
                rel: "noreferrer"
              },
              "window.Elm"
            ),
            " to exist, but it is undefined!"
          )
        ];
      case "NoProgramsAtAll":
        return [
          h(
            HTMLParagraphElement,
            {},
            "It looks like no Elm apps were initialized by elm-watch. Check the console in the browser developer tools to see potential errors!"
          )
        ];
      case "DebuggerModeStatus": {
        const compilationModes = [
          {
            mode: "debug",
            name: "Debug",
            status: info.initializedElmAppsStatus.status
          },
          { mode: "standard", name: "Standard", status: { tag: "Enabled" } },
          { mode: "optimize", name: "Optimize", status: { tag: "Enabled" } }
        ];
        return [
          h(
            HTMLFieldSetElement,
            { disabled: sendKey === void 0 },
            h(HTMLLegendElement, {}, "Compilation mode"),
            ...compilationModes.map(({ mode, name, status }) => {
              const nameWithIcon = h(
                HTMLSpanElement,
                { className: CLASS.compilationModeWithIcon },
                name,
                mode === selectedMode ? compilationModeIcon(mode) : void 0
              );
              return h(
                HTMLLabelElement,
                { className: status.tag },
                h(HTMLInputElement, {
                  type: "radio",
                  name: `CompilationMode-${info.targetName}`,
                  value: mode,
                  checked: mode === selectedMode,
                  disabled: sendKey === void 0 || status.tag === "Disabled",
                  onchange: sendKey === void 0 ? void 0 : () => {
                    dispatch({
                      tag: "ChangedCompilationMode",
                      compilationMode: mode,
                      sendKey
                    });
                  }
                }),
                ...status.tag === "Enabled" ? [
                  nameWithIcon,
                  warnAboutCompilationModeMismatch && mode === selectedMode && selectedMode !== info.originalCompilationMode && info.originalCompilationMode !== "proxy" ? h(
                    HTMLElement,
                    { localName: "small" },
                    `Note: The code currently running is in ${ORIGINAL_COMPILATION_MODE} mode.`
                  ) : void 0
                ] : [
                  nameWithIcon,
                  h(HTMLElement, { localName: "small" }, status.reason)
                ]
              );
            })
          )
        ];
      }
    }
  }
  var DATA_TARGET_NAMES = "data-target-names";
  function updateErrorOverlay(targetName, dispatch, sendKey, errors, overlay, overlayCloseButton) {
    const existingErrorElements = new Map(
      Array.from(overlay.children, (element) => [
        element.id,
        {
          targetNames: new Set(
            (element.getAttribute(DATA_TARGET_NAMES) ?? "").split("\n")
          ),
          element
        }
      ])
    );
    for (const [id, { targetNames, element }] of existingErrorElements) {
      if (targetNames.has(targetName) && !errors.has(id)) {
        targetNames.delete(targetName);
        if (targetNames.size === 0) {
          element.remove();
        } else {
          element.setAttribute(DATA_TARGET_NAMES, [...targetNames].join("\n"));
        }
      }
    }
    let previousElement = void 0;
    for (const [id, error] of errors) {
      const maybeExisting = existingErrorElements.get(id);
      if (maybeExisting === void 0) {
        const element = viewOverlayError(
          targetName,
          dispatch,
          sendKey,
          id,
          error
        );
        if (previousElement === void 0) {
          overlay.prepend(element);
        } else {
          previousElement.after(element);
        }
        overlay.style.backgroundColor = error.backgroundColor;
        overlayCloseButton.style.setProperty(
          "--foregroundColor",
          error.foregroundColor
        );
        overlayCloseButton.style.setProperty(
          "--backgroundColor",
          error.backgroundColor
        );
        previousElement = element;
      } else {
        if (!maybeExisting.targetNames.has(targetName)) {
          maybeExisting.element.setAttribute(
            DATA_TARGET_NAMES,
            [...maybeExisting.targetNames, targetName].join("\n")
          );
        }
        previousElement = maybeExisting.element;
      }
    }
    const hidden = !overlay.hasChildNodes();
    overlay.hidden = hidden;
    overlayCloseButton.hidden = hidden;
    overlayCloseButton.style.right = `${overlay.offsetWidth - overlay.clientWidth}px`;
  }
  function viewOverlayError(targetName, dispatch, sendKey, id, error) {
    return h(
      HTMLDetailsElement,
      {
        open: true,
        id,
        style: {
          backgroundColor: error.backgroundColor,
          color: error.foregroundColor
        },
        attrs: {
          [DATA_TARGET_NAMES]: targetName
        }
      },
      h(
        HTMLElement,
        { localName: "summary" },
        h(
          HTMLSpanElement,
          {
            className: CLASS.errorTitle,
            style: {
              backgroundColor: error.backgroundColor
            }
          },
          error.title
        ),
        error.location === void 0 ? void 0 : h(
          HTMLParagraphElement,
          {},
          viewErrorLocation(dispatch, sendKey, error.location)
        )
      ),
      h(HTMLPreElement, { innerHTML: error.htmlContent })
    );
  }
  function viewErrorLocation(dispatch, sendKey, location) {
    switch (location.tag) {
      case "FileOnly":
        return viewErrorLocationButton(
          dispatch,
          sendKey,
          {
            file: location.file,
            line: 1,
            column: 1
          },
          location.file.absolutePath
        );
      case "FileWithLineAndColumn": {
        return viewErrorLocationButton(
          dispatch,
          sendKey,
          location,
          `${location.file.absolutePath}:${location.line}:${location.column}`
        );
      }
      case "Target":
        return `Target: ${location.targetName}`;
    }
  }
  function viewErrorLocationButton(dispatch, sendKey, location, text) {
    return sendKey === void 0 ? text : h(
      HTMLButtonElement,
      {
        className: CLASS.errorLocationButton,
        onclick: () => {
          dispatch({
            tag: "PressedOpenEditor",
            file: location.file,
            line: location.line,
            column: location.column,
            sendKey
          });
        }
      },
      text
    );
  }
  if (typeof WebSocket !== "undefined") {
    run();
  }
})();
(function(Oa){"use strict";var Rr,bn={};function Jt(n){this.at=n}function ye(n,r,t,e,a,$,i,o){this.bj=n,this.fU=r,this.bl=t,this.bs=e,this.a4=a,this.cy=$,this.bU=i,this.cO=o}function Ee(n,r,t,e,a,$,i){this.bz=n,this.bM=r,this.J=t,this.bp=e,this.bq=a,this.at=$,this.a5=i}function Re(n){this.bq=n}function Ce(n,r){this.g$=n,this.c6=r}function Te(n,r){this.c1=n,this.ap=r}function Je(n,r,t,e,a,$,i){this.cV=n,this.R=r,this.b4=t,this.ck=e,this.cp=a,this.ct=$,this.a3=i}function Bt(n,r,t,e,a,$){this.R=n,this.bA=r,this.dJ=t,this.dM=e,this.aP=a,this.ei=$}function Be(n,r,t,e,a,$,i,o,c,l,_,s,p,m,S,M,Y,q,P,G,on,fn,H,N,en,cn,an,j,A,C,J,B,k,z,Ae,De,tr,e_,a_,$_,i_,u_,o_,f_,c_,b_,l_,h_,__,m_,d_,s_,g_,p_,v_,w_,M_,I_,S_,j_,A_,D_,y_,E_,R_,C_,T_,J_,B_,V_,k_,P_,U_,L_,z_,F_,H_,Z_,O_,W_,Y_,Q_,G_,q_,X_,K_,x_,N_,n0,r0,t0,e0,a0,$0,i0,u0,o0,f0){this.gM=n,this.dC=r,this.gP=t,this.gQ=e,this.gR=a,this.gS=$,this.gT=i,this.gU=o,this.gV=c,this.eK=l,this.eL=_,this.gW=s,this.dD=p,this.dE=m,this.gZ=S,this.g9=M,this.ha=Y,this.hc=q,this.he=P,this.hf=G,this.cX=on,this.hg=fn,this.cZ=H,this.ht=N,this.hu=en,this.hv=cn,this.d=an,this.c0=j,this.c2=A,this.c3=C,this.aW=J,this.b5=B,this.c4=k,this.hx=z,this.hA=Ae,this.hB=De,this.hU=tr,this.e3=e_,this.hW=a_,this.hZ=$_,this.dR=i_,this.dS=u_,this.fa=o_,this.dT=f_,this.fb=c_,this.h1=b_,this.h3=l_,this.h5=h_,this.de=__,this.h7=m_,this.h8=d_,this.h9=s_,this.ia=g_,this.ib=p_,this.id=v_,this.fp=w_,this.bK=M_,this.fR=I_,this.iJ=S_,this.iL=j_,this.bk=A_,this.iO=D_,this.fW=y_,this.fX=E_,this.iP=R_,this.iY=C_,this.c=T_,this.i$=J_,this.i0=B_,this.i1=V_,this.i2=k_,this.i7=P_,this.i8=U_,this.ja=L_,this.jj=z_,this.ex=F_,this.jn=H_,this.jo=Z_,this.jp=O_,this.jq=W_,this.jr=Y_,this.dw=Q_,this.js=G_,this.jt=q_,this.ju=X_,this.jv=K_,this.jw=x_,this.jx=N_,this.jy=n0,this.jz=r0,this.gt=t0,this.bv=e0,this.jN=a0,this.eC=$0,this.gG=i0,this.eD=u0,this.gH=o0,this.eF=f0}function tt(n,r,t,e,a){this.eN=n,this.t=r,this.fh=t,this.fU=e,this.gi=a}function Vt(n,r,t,e){this.c_=n,this.I=r,this.a2=t,this.aD=e}function et(n,r,t,e){this.eN=n,this.t=r,this.fU=t,this.gi=e}function kt(n,r,t){this.hU=n,this.h1=r,this.fM=t}function Ve(n,r,t,e,a,$){this.g$=n,this.g0=r,this.h6=t,this.jk=e,this.jO=a,this.jU=$}function ho(n,r,t){return n=n.$c(),n.J=r,n.at=t,n}function _o(n,r){return n=n.$c(),n.J=r,n}function Wa(n,r){return n=n.$c(),n.a3=r,n}function Ar(n,r){return n=n.$c(),n.I=r,n}function y(n){var r=function(t){return function(e){return n(t,e)}};return r.a2=n,r}function K(n){var r=function(t){return function(e){return function(a){return n(t,e,a)}}};return r.a3=n,r}function mo(n){var r=function(t){return function(e){return function(a){return function($){return n(t,e,a,$)}}}};return r.a4=n,r}function so(n){var r=function(t){return function(e){return function(a){return function($){return function(i){return function(o){return n(t,e,a,$,i,o)}}}}}};return r.a6=n,r}function b(n,r,t){return n.a2?n.a2(r,t):n(r)(t)}function $n(n,r,t,e){return n.a3?n.a3(r,t,e):n(r)(t)(e)}function Dr(n,r,t,e,a){return n.a4?n.a4(r,t,e,a):n(r)(t)(e)(a)}function Ya(n,r,t,e,a,$){return n.a5?n.a5(r,t,e,a,$):n(r)(t)(e)(a)($)}Jt.prototype.$c=function(){return new Jt(this.at)},ye.prototype.$c=function(){return new ye(this.bj,this.fU,this.bl,this.bs,this.a4,this.cy,this.bU,this.cO)},Ee.prototype.$c=function(){return new Ee(this.bz,this.bM,this.J,this.bp,this.bq,this.at,this.a5)},Re.prototype.$c=function(){return new Re(this.bq)},Ce.prototype.$c=function(){return new Ce(this.g$,this.c6)},Te.prototype.$c=function(){return new Te(this.c1,this.ap)},Je.prototype.$c=function(){return new Je(this.cV,this.R,this.b4,this.ck,this.cp,this.ct,this.a3)},Bt.prototype.$c=function(){return new Bt(this.R,this.bA,this.dJ,this.dM,this.aP,this.ei)},Be.prototype.$c=function(){return new Be(this.gM,this.dC,this.gP,this.gQ,this.gR,this.gS,this.gT,this.gU,this.gV,this.eK,this.eL,this.gW,this.dD,this.dE,this.gZ,this.g9,this.ha,this.hc,this.he,this.hf,this.cX,this.hg,this.cZ,this.ht,this.hu,this.hv,this.d,this.c0,this.c2,this.c3,this.aW,this.b5,this.c4,this.hx,this.hA,this.hB,this.hU,this.e3,this.hW,this.hZ,this.dR,this.dS,this.fa,this.dT,this.fb,this.h1,this.h3,this.h5,this.de,this.h7,this.h8,this.h9,this.ia,this.ib,this.id,this.fp,this.bK,this.fR,this.iJ,this.iL,this.bk,this.iO,this.fW,this.fX,this.iP,this.iY,this.c,this.i$,this.i0,this.i1,this.i2,this.i7,this.i8,this.ja,this.jj,this.ex,this.jn,this.jo,this.jp,this.jq,this.jr,this.dw,this.js,this.jt,this.ju,this.jv,this.jw,this.jx,this.jy,this.jz,this.gt,this.bv,this.jN,this.eC,this.gG,this.eD,this.gH,this.eF)},tt.prototype.$c=function(){return new tt(this.eN,this.t,this.fh,this.fU,this.gi)},Vt.prototype.$c=function(){return new Vt(this.c_,this.I,this.a2,this.aD)},et.prototype.$c=function(){return new et(this.eN,this.t,this.fU,this.gi)},kt.prototype.$c=function(){return new kt(this.hU,this.h1,this.fM)},Ve.prototype.$c=function(){return new Ve(this.g$,this.g0,this.h6,this.jk,this.jO,this.jU)};var Qa=function(n,r,t){for(var e=new Array(n),a=0;a<n;a++)e[a]=t(r+a);return e},ke=function(n,r){for(var t=new Array(n),e=0;e<n&&r.b;e++)t[e]=r.a,r=r.b;return t.length=e,{a:t,b:r}},at=function(n,r,t){for(var e=t.length,a=new Array(e),$=0;$<e;$++)a[$]=t[$];return a[n]=r,a},Pe=function(n,r){for(var t=r.length,e=new Array(t+1),a=0;a<t;a++)e[a]=r[a];return e[t]=n,e},Ue=function(n,r,t){for(var e=t.length,a=0;a<e;a++)r=b(n,t[a],r);return r},Le=function(n,r,t){for(var e=t.length-1;e>=0;e--)r=b(n,t[e],r);return r},Pt=function(n,r){for(var t=r.length,e=new Array(t),a=0;a<t;a++)e[a]=n(r[a]);return e};function yr(n){throw new Error("https://github.com/elm/core/blob/1.0.0/hints/"+n+".md")}function T(n,r){for(var t,e=[],a=ze(n,r,0,e);a&&(t=e.pop());a=ze(t.a,t.b,0,e));return a}function ze(n,r,t,e){if(n!==r){if(typeof n!="object"||n===null||r===null)return typeof n=="function"&&yr(5),!1;if(t>100)e.push({a:n,b:r});else for(var a in n.$<0&&(n=ot(n),r=ot(r)),n)if(!ze(n[a],r[a],t+1,e))return!1}return!0}var ga=y(T);function W(n,r,t){if(typeof n!="object")return n===r?0:n<r?-1:1;if(typeof n.$=="undefined")return(t=W(n.a,r.a))||(t=W(n.b,r.b))||W(n.c,r.c);for(;n.b&&r.b&&!(t=W(n.a,r.a));n=n.b,r=r.b);return t||(n.b?1:r.b?-1:0)}var Fe=function(n,r){return n=W(n,r),n<0?Mf:n?wf:vf},Ga=0;function E(n,r){if(typeof n=="string")return n+r;if(!n.b)return r;var t={$:1,a:n.a,b:r};n=n.b;for(var e=t;n.b;n=n.b)e=e.b={$:1,a:n.a,b:r};return t}var d={$:0,a:null,b:null};function go(n,r){return{$:1,a:n,b:r}}var pn=y(go);function u(n){for(var r=d,t=n.length;t--;)r={$:1,a:n[t],b:r};return r}function po(n){for(var r=[];n.b;n=n.b)r.push(n.a);return r}var vo=function(n,r,t){for(var e=[];r.b&&t.b;r=r.b,t=t.b)e.push(b(n,r.a,t.a));return u(e)},I=y(function(n,r){return n+r}),sa=Math.ceil,x=Math.floor,Xr=Math.round,qa=Math.log,wo=function(n,r){return n+r},Mo=function(n,r){return r.join(n)},Io=function(n,r,t){return t.slice(n,r)},So=function(n,r){for(var t=r.length;t--;){var e=r[t],a=r.charCodeAt(t);if(!n(e=56320<=a&&a<=57343?r[--t]+e:e))return!1}return!0},Xa=function(n,r){return r.indexOf(n)===0},Ut=function(n,r){var t=n.length;if(t<1)return d;for(var e=0,a=[];(e=r.indexOf(n,e))>-1;)a.push(e),e=e+t;return u(a)};function Ka(n){return n+""}var Gr={$:2,b:function(n){return typeof n!="number"||!(-2147483647<n&&n<2147483647&&(0|n)===n)&&(!isFinite(n)||n%1)?Zn("an INT",n):Mn(n)}},O={$:2,b:function(n){return typeof n=="number"?Mn(n):Zn("a FLOAT",n)}},Sr={$:2,b:function(n){return Mn(n)}},Rn={$:2,b:function(n){return typeof n=="string"?Mn(n):n instanceof String?Mn(n+""):Zn("a STRING",n)}},er=function(n,r){return{$:6,d:n,b:r}},He=function(n,r){return{$:10,b:r,h:n}},Ze=function(n,r){return{$:9,f:n,g:[r]}},jo=function(n,r,t){return{$:9,f:n,g:[r,t]}},Lt=Hn;function Hn(n,r){switch(n.$){case 2:return n.b(r);case 5:return r===null?Mn(n.c):Zn("null",r);case 3:return zt(r)?xa(n.b,r,u):Zn("a LIST",r);case 4:return zt(r)?xa(n.b,r,Ao):Zn("an ARRAY",r);case 6:var t=n.d;return typeof r=="object"&&r!==null&&t in r?($=Hn(n.b,r[t]),Un($)?$:dn(y$(t,$.a))):Zn("an OBJECT with a field named `"+t+"`",r);case 7:return t=n.e,zt(r)?t>=r.length?Zn("a LONGER array. Need index "+t+" but only see "+r.length+" entries",r):($=Hn(n.b,r[t]),Un($)?$:dn(E$(t,$.a))):Zn("an ARRAY",r);case 8:if(typeof r!="object"||r===null||zt(r))return Zn("an OBJECT",r);var e,a=d;for(e in r)if(r.hasOwnProperty(e)){var $=Hn(n.b,r[e]);if(!Un($))return dn(y$(e,$.a));a={$:1,a:{a:e,b:$.a},b:a}}return Mn(On(a));case 9:for(var i=n.f,o=n.g,c=0;c<o.length;c++){if($=Hn(o[c],r),!Un($))return $;i=i($.a)}return Mn(i);case 10:return $=Hn(n.b,r),Un($)?Hn(n.h($.a),r):$;case 11:for(var l=d,_=n.g;_.b;_=_.b){if($=Hn(_.a,r),Un($))return $;l={$:1,a:$.a,b:l}}return dn(Af(On(l)));case 1:return dn(D$(n.a,r));case 0:return Mn(n.a)}}function xa(n,r,t){for(var e=r.length,a=new Array(e),$=0;$<e;$++){var i=Hn(n,r[$]);if(!Un(i))return dn(E$($,i.a));a[$]=i.a}return Mn(t(a))}function zt(n){return Array.isArray(n)||typeof FileList!="undefined"&&n instanceof FileList}function Ao(n){return F$(n.length,function(r){return n[r]})}function Zn(n,r){return dn(D$("Expecting "+n,r))}function Er(n,r){if(n===r)return!0;if(n.$!==r.$)return!1;switch(n.$){case 0:case 1:return n.a===r.a;case 2:return n.b===r.b;case 5:return n.c===r.c;case 3:case 4:case 8:return Er(n.b,r.b);case 6:return n.d===r.d&&Er(n.b,r.b);case 7:return n.e===r.e&&Er(n.b,r.b);case 9:return n.f===r.f&&Na(n.g,r.g);case 10:return n.h===r.h&&Er(n.b,r.b);case 11:return Na(n.g,r.g)}}function Na(n,r){var t=n.length;if(t!==r.length)return!1;for(var e=0;e<t;e++)if(!Er(n[e],r[e]))return!1;return!0}var Do=function(n,r){return JSON.stringify(r,null,n)+""};function Ft(n){return n}var yo=function(n,r,t){return t[n]=r,t};function Eo(n){return y(function(r,t){return t.push(n(r)),t})}var Mr=null;function Ro(n){return{$:0,a:n}}function Ht(n){return{$:2,b:n,c:Function.prototype}}var ar=function(n,r){return{$:3,b:n,d:r}},Co=0;function n$(n){return n={$:0,e:Co++,f:n,g:null,h:[]},Rr(n),n}function To(n){return Ht(function(r){r({$:0,a:n$(n)})})}function Jo(n,r){n.h.push(r),Rr(n)}var Oe=!1,r$=[];function Rr(n){if(r$.push(n),!Oe){for(Oe=!0;n=r$.shift();)Bo(n);Oe=!1}}function Bo(n){for(;n.f;){var r=n.f.$;if(r===0||r===1){for(;n.g&&n.g.$!==r;)n.g=n.g.i;if(!n.g)return;n.f=n.g.b(n.f.a),n.g=n.g.i}else{if(r===2)return n.f.c=n.f.b(function(t){n.f=t,Rr(n)})||Function.prototype,void 0;if(r===5){if(n.h.length===0)return;n.f=n.f.b(n.h.shift())}else n.g={$:r===3?0:1,b:n.f.b,i:n.g},n.f=n.f.d}}}function t$(n){return Ht(function(r){var t=setTimeout(function(){r({$:0,a:Ga})},n);return function(){clearTimeout(t)}})}function Vo(n,r,t,e,a,$,i,o){var c,l,_,s,p,m,S,M;return a==="__elmWatchReturnData"?{impl:i,debugMetadata:t,flagDecoder:e,programType:n}:(e=Lt(e,c=a?a.flags:void 0),Un(e)||yr(2,_Json_errorToString(e.a)),l={},_=n==="Browser.application"?mf():void 0,globalThis.__ELM_WATCH.INIT_URL=_,s=$(e.a),m=o(q,p=s.a),a=ko(l,q),Y(),Ot(l,s.b,M(p)),Object.defineProperties(a?{ports:a}:{},{__elmWatchHotReload:{value:function(P,G,on,fn){Ot(l,{$:2,m:d},{$:2,m:d}),Rr=on;var H,N=[];for(H in G){var en=G[H];H in bn||(l[H]=$$(bn[H]=en,q),en.a&&(N.push("a new port '"+H+"' was added. The idea is to give JavaScript code a chance to set it up!"),en.a(H,q)))}for(H in P.impl)if(H==="_impl"&&i._impl)for(var cn in P.impl[H])i._impl[cn]=P.impl[H][cn];else i[H]=P.impl[H];return on=Lt(P.flagDecoder,c),Un(on)?e$(t,P.debugMetadata)?($=i.h6||i._impl.h6,r&&($=$n($elm$browser$Debugger$Main$wrapInit,P.debugMetadata,s.a.popout,$)),globalThis.__ELM_WATCH.INIT_URL=_,on=$(on.a),e$(s,on)?(Y(),m(p,!0),Ot(l,{$:2,m:d},M(p)),N):N.concat("`"+fn+".init` returned something different than last time. Let's start fresh!")):N.concat("the message type in `"+fn+'` changed in debug mode ("debug metadata" changed).'):N.concat("the flags type in `"+fn+"` changed and now the passed flags aren't correct anymore. The idea is to try to run with new flags!\nThis is the error:\n"+_Json_errorToString(on.a))}},__elmWatchProgramType:{value:n}}));function Y(){S=i.jO||i._impl.jO,M=i.jk||i._impl.jk,r&&(S=$elm$browser$Debugger$Main$wrapUpdate(S),M=$elm$browser$Debugger$Main$wrapSubs(M))}function q(P,G){P=b(S,P,p),m(p=P.a,G),Ot(l,P.b,M(p))}}function e$(n,r){for(var t,e=[],a=We(n,r,0,e);a&&(t=e.pop());a=We(t.a,t.b,0,e));return a}function We(n,r,t,e){if(n!==r){var a=a$(n);if(a!==a$(r))return!1;switch(a){case"primitive":return!1;case"function":return!0}if(n.$!==r.$||(n.$==="Set_elm_builtin"?(n=j$(n),r=j$(r)):(n.$==="RBNode_elm_builtin"||n.$==="RBEmpty_elm_builtin"||n.$<0)&&(n=ot(n),r=ot(r)),Object.keys(n).length!==Object.keys(r).length))return!1;if(t>100)e.push({a:n,b:r});else for(var $ in n)if(!We(n[$],r[$],t+1,e))return!1}return!0}function a$(n){return n=typeof n,n==="function"?"function":n!=="object"||n===null?"primitive":"objectOrArray"}bn={};function ko(n,r){var t,e;for(e in bn){var a=bn[e];a.a&&((t=t||{})[e]=a.a(e,r)),n[e]=$$(a,r)}return t}function $$(n,r){var t={g:r,h:void 0},e=n.c,a=n.d,$=n.e,i=n.f;return t.h=n$(ar(function o(c){return ar(o,{$:5,b:function(l){var _=l.a;return l.$===0?$n(a,t,_,c):$&&i?Dr(e,t,_.i,_.j,c):$n(e,t,$?_.i:_.j,c)}})},n.b))}var i$=function(n,r){return Ht(function(t){n.g(r),t({$:0,a:Ga})})},zr=y(i$);function Zt(n){return function(r){return{$:1,k:n,l:r}}}function u$(n){return{$:2,m:n}}var o$=[],Ye=!1;function Ot(n,r,t){if(o$.push({p:n,q:r,r:t}),!Ye){Ye=!0;for(var e;e=o$.shift();)Po(e.p,e.q,e.r);Ye=!1}}function Po(n,r,t){var e,a={};for(e in Wt(!0,r,a,null),Wt(!1,t,a,null),n)Jo(n[e],{$:"fx",a:a[e]||{i:d,j:d}})}function Wt(n,r,t,e){switch(r.$){case 1:var a=r.k,$=Uo(n,a,e,r.l);return t[a]=Lo(n,$,t[a]),void 0;case 2:for(var i=r.m;i.b;i=i.b)Wt(n,i.a,t,e);return;case 3:return Wt(n,r.o,t,{s:r.n,t:e}),void 0}}function Uo(n,r,t,e){function a($){for(var i=t;i;i=i.t)$=i.s($);return $}return b(n?bn[r].e:bn[r].f,a,e)}function Lo(n,r,t){return t=t||{i:d,j:d},n?t.i={$:1,a:r,b:t.i}:t.j={$:1,a:r,b:t.j},t}function f$(n){bn[n]&&yr(3)}var zo=y(function(n,r){return r});function Fo(n){var r=[],t=bn[n].u,e=t$(0);return bn[n].b=e,bn[n].c=K(function(a,$,i){for(;$.b;$=$.b)for(var o=r,c=t($.a),l=0;l<o.length;l++)o[l](c);return e}),{subscribe:function(a){r.push(a)},unsubscribe:function(a){(a=(r=r.slice()).indexOf(a))>=0&&r.splice(a,1)}}}var Yt,hn=y(function(n,r){return function(t){return n(r(t))}});function Ho(n,r){var t=d,e=bn[n].u,a={$:0,a:null};return bn[n].b=a,bn[n].c=K(function($,i,o){return t=i,a}),{send:function($){for(var $=Lt(e,$),i=(Un($)||yr(4),$.a),o=t;o.b;o=o.b)r(o.a(i))}}}function c$(n,r,t){var e,a=[];for(e in t)if(e==="init")if("init"in r){if(!("__elmWatchApps"in r))throw new Error("elm-watch: I'm trying to create `"+n+".init`, but it already exists and wasn't created by elm-watch. Maybe a duplicate script is getting loaded accidentally?");for(var $=t.init("__elmWatchReturnData"),i=0;i<r.__elmWatchApps.length;i++){var o=r.__elmWatchApps[i];if(o.__elmWatchProgramType!==$.programType)a.push("`"+n+".main` changed from `"+o.__elmWatchProgramType+"` to `"+$.programType+"`.");else try{var c=o.__elmWatchHotReload($,bn,Rr,n),a=a.concat(c)}catch(l){a.push("hot reload for `"+n+"` failed, probably because of incompatible model changes.\nThis is the error:\n"+l+"\n"+(l?l.stack:""))}}}else r.__elmWatchApps=[],r.init=function(){var l=t.init.apply(t,arguments);return r.__elmWatchApps.push(l),globalThis.__ELM_WATCH.ON_INIT(),l};else c=c$(n+"."+e,r[e]||(r[e]={}),t[e]),a=a.concat(c);return a}var $r=typeof document!="undefined"?document:{};function Zo(n){return{$:0,a:n}}var hr=function(n,r){return y(function(t,e){for(var a=[],$=0;e.b;e=e.b){var i=e.a;$+=i.b||0,a.push(i)}return $+=a.length,{$:1,c:r,d:d$(t),e:a,f:n,b:$}})},_r=void 0,Oo=y(hr)(_r),b$=function(n,r){return y(function(t,e){for(var a=[],$=0;e.b;e=e.b){var i=e.a;$+=i.b.b||0,a.push(i)}return $+=a.length,{$:2,c:r,d:d$(t),e:a,f:n,b:$}})},l$=void 0;y(b$)(l$);var _n=y(function(n,r){return{$:4,j:n,k:r,b:1+(r.b||0)}}),Qe=function(n,r){return{$:"a3",n:n,o:r}},Wo=/^script$/i,Yo=/^(on|formAction$)/i,h$=/^\s*(j\s*a\s*v\s*a\s*s\s*c\s*r\s*i\s*p\s*t\s*:|d\s*a\s*t\s*a\s*:\s*t\s*e\s*x\s*t\s*\/\s*h\s*t\s*m\s*l\s*(,|;))/i;function _$(n){return Wo.test(n)?"p":n}function Qo(n){return Yo.test(n)?"data-"+n:n}function Go(n){return n=="innerHTML"||n=="formAction"?"data-"+n:n}function qo(n){return h$.test(n)?"":n}function Xo(n){return typeof n=="string"&&h$.test(n)?"":n}var m$;function d$(n){for(var r={};n.b;n=n.b){var t,$=n.a,e=$.$,a=$.n,$=$.o;e==="a2"?a==="className"?s$(r,a,$):r[a]=$:(t=r[e]||(r[e]={}),e==="a3"&&a==="class"?s$(t,a,$):t[a]=$)}return r}function s$(n,r,t){var e=n[r];n[r]=e?e+" "+t:t}function mr(n,r){var t=n.$;if(t===5)return mr(n.k||(n.k=n.m()),r);if(t===0)return $r.createTextNode(n.a);if(t===4){for(var e=n.k,a=n.j;e.$===4;)typeof a!="object"?a=[a,e.j]:a.push(e.j),e=e.k;var $={j:a,p:r};(i=mr(e,$)).elm_event_node_ref=$}else if(t===3)Ge(i=n.h(n.g),r,n.d);else{var i=n.f?$r.createElementNS(n.f,n.c):$r.createElement(n.c);Yt&&n.c=="a"&&i.addEventListener("click",Yt(i)),Ge(i,r,n.d);for(var o=n.e,c=0;c<o.length;c++)i.appendChild(mr(t===1?o[c]:o[c].b,r))}return i}function Ge(n,r,t){for(var e in t){var a=t[e];e==="a1"?Ko(n,a):e==="a0"?nf(n,r,a):e==="a3"?xo(n,a):e==="a4"?No(n,a):(e!=="value"&&e!=="checked"||n[e]!==a)&&(n[e]=a)}}function Ko(n,r){var t,e=n.style;for(t in r)e[t]=r[t]}function xo(n,r){for(var t in r){var e=r[t];typeof e!="undefined"?n.setAttribute(t,e):n.removeAttribute(t)}}function No(n,r){for(var t in r){var a=r[t],e=a.f,a=a.o;typeof a!="undefined"?n.setAttributeNS(e,t,a):n.removeAttributeNS(e,t)}}function nf(n,r,t){var e,a=n.elmFs||(n.elmFs={});for(e in t){var $=t[e],i=a[e];if($){if(i){if(i.q.$===$.$){i.q=$;continue}n.removeEventListener(e,i)}i=rf(r,$),n.addEventListener(e,i,m$&&{passive:H$($)<2}),a[e]=i}else n.removeEventListener(e,i),a[e]=void 0}}try{window.addEventListener("t",null,Object.defineProperty({},"passive",{get:function(){m$=!0}}))}catch(n){}function rf(n,r){function t(e){var a=t.q,$=Hn(a.a,e);if(Un($)){for(var i,a=H$(a),$=$.a,o=a?a<3?$.a:$.a$:$,c=a==1?$.b:a==3&&$.et,l=(c&&e.stopPropagation(),(a==2?$.b:a==3&&$.el)&&e.preventDefault(),n);i=l.j;){if(typeof i=="function")o=i(o);else for(var _=i.length;_--;)o=i[_](o);l=l.p}l(o,c)}}return t.q=r,t}function tf(n,r){return n.$==r.$&&Er(n.a,r.a)}function ef(n,r){var t=[];return kn(n,r,t,0),t}function vn(n,r,t,e){return r={$:r,r:t,s:e,t:void 0,u:void 0},n.push(r),r}function kn(n,r,t,e){if(n!==r){var a=n.$,$=r.$;if(a!==$){if(a!==1||$!==2)return vn(t,0,e,r),void 0;r=hf(r),$=1}switch($){case 5:for(var i,o=n.l,c=r.l,l=o.length,_=l===c.length;_&&l--;)_=o[l]===c[l];return _?r.k=n.k:(r.k=r.m(),kn(n.k,r.k,i=[],0),i.length>0&&vn(t,1,e,i)),void 0;case 4:for(var s=n.j,p=r.j,m=!1,S=n.k;S.$===4;)m=!0,typeof s!="object"?s=[s,S.j]:s.push(S.j),S=S.k;for(var M=r.k;M.$===4;)m=!0,typeof p!="object"?p=[p,M.j]:p.push(M.j),M=M.k;return m&&s.length!==p.length?vn(t,0,e,r):((m?af(s,p):s===p)||vn(t,2,e,p),kn(S,M,t,e+1)),void 0;case 0:return n.a!==r.a&&vn(t,3,e,r.a),void 0;case 1:return g$(n,r,t,e,$f),void 0;case 2:return g$(n,r,t,e,uf),void 0;case 3:return n.h!==r.h?vn(t,0,e,r):((i=qe(n.d,r.d))&&vn(t,4,e,i),(i=r.i(n.g,r.g))&&vn(t,5,e,i)),void 0}}}function af(n,r){for(var t=0;t<n.length;t++)if(n[t]!==r[t])return!1;return!0}function g$(n,r,t,e,a){var $;n.c!==r.c||n.f!==r.f?vn(t,0,e,r):(($=qe(n.d,r.d))&&vn(t,4,e,$),a(n,r,t,e))}function qe(n,r,t){var e,a,$,i,o;for(a in n)a==="a1"||a==="a0"||a==="a3"||a==="a4"?($=qe(n[a],r[a]||{},a))&&((e=e||{})[a]=$):a in r?($=n[a])===(i=r[a])&&a!=="value"&&a!=="checked"||t==="a0"&&tf($,i)||((e=e||{})[a]=i):(e=e||{})[a]=t?t==="a1"?"":t==="a0"||t==="a3"?void 0:{f:n[a].f,o:void 0}:typeof n[a]=="string"?"":null;for(o in r)o in n||((e=e||{})[o]=r[o]);return e}function $f(i,o,t,e){var a=i.e,$=o.e,i=a.length,o=$.length;i>o?vn(t,6,e,{v:o,i:i-o}):i<o&&vn(t,7,e,{v:i,e:$});for(var c=i<o?i:o,l=0;l<c;l++){var _=a[l];kn(_,$[l],t,++e),e+=_.b||0}}function uf(n,r,t,e){for(var a=[],$={},i=[],o=n.e,c=r.e,l=o.length,_=c.length,s=0,p=0,m=e;s<l&&p<_;){var S=o[s],M=c[p],Y=S.a,q=M.a,P=S.b,G=M.b,on=void 0,fn=void 0;if(Y===q)kn(P,G,a,++m),m+=P.b||0,s++,p++;else{var H,N,en,cn,an=o[s+1],j=c[p+1];if(an&&(N=an.b,fn=q===(H=an.a)),j&&(cn=j.b,on=Y===(en=j.a)),on&&fn)kn(P,cn,a,++m),$t($,a,Y,G,p,i),m+=P.b||0,it($,a,Y,N,++m),m+=N.b||0,s+=2,p+=2;else if(on)m++,$t($,a,q,G,p,i),kn(P,cn,a,m),m+=P.b||0,s+=1,p+=2;else if(fn)it($,a,Y,P,++m),m+=P.b||0,kn(N,G,a,++m),m+=N.b||0,s+=2,p+=1;else{if(!an||H!==en)break;it($,a,Y,P,++m),$t($,a,q,G,p,i),m+=P.b||0,kn(N,cn,a,++m),m+=N.b||0,s+=2,p+=2}}}for(;s<l;)P=(S=o[s]).b,it($,a,S.a,P,++m),m+=P.b||0,s++;for(;p<_;){var A=A||[];$t($,a,(M=c[p]).a,M.b,void 0,A),p++}(a.length>0||i.length>0||A)&&vn(t,8,e,{w:a,x:i,y:A})}var p$="_elmW6BL";function $t(n,r,t,e,a,$){var i,o=n[t];o?o.c===1?($.push({r:a,A:o}),o.c=2,kn(o.z,e,i=[],o.r),o.r=a,o.s.s={w:i,A:o}):$t(n,r,t+p$,e,a,$):($.push({r:a,A:o={c:0,z:e,r:a,s:void 0}}),n[t]=o)}function it(n,r,t,e,a){var $,i=n[t];i?i.c===0?(i.c=2,kn(e,i.z,$=[],a),vn(r,9,a,{w:$,A:i})):it(n,r,t+p$,e,a):($=vn(r,9,a,void 0),n[t]={c:1,z:e,r:a,s:$})}function v$(n,r,t,e){ut(n,r,t,0,0,r.b,e)}function ut(n,r,t,e,a,$,i){for(var o=t[e],c=o.r;c===a;){var l,_=o.$;if(_===1?v$(n,r.k,o.s,i):_===8?(o.t=n,o.u=i,(l=o.s.w).length>0&&ut(n,r,l,0,a,$,i)):_===9?(o.t=n,o.u=i,(_=o.s)&&(_.A.s=n,(l=_.w).length>0)&&ut(n,r,l,0,a,$,i)):(o.t=n,o.u=i),!(o=t[++e])||(c=o.r)>$)return e}var s=r.$;if(s===4){for(var p=r.k;p.$===4;)p=p.k;return ut(n,p,t,e,a+1,$,n.elm_event_node_ref)}for(var m=r.e,S=n.childNodes,M=0;M<m.length;M++){var Y=s===1?m[M]:m[M].b,q=++a+(Y.b||0);if(a<=c&&c<=q&&(!(o=t[e=ut(S[M],Y,t,e,a,q,i)])||(c=o.r)>$))return e;a=q}return e}function of(n,r,t,e){return t.length===0?n:(v$(n,r,t,e),Qt(n,t))}function Qt(n,r){for(var t=0;t<r.length;t++){var a=r[t],e=a.t,a=ff(e,a);e===n&&(n=a)}return n}function ff(n,r){switch(r.$){case 0:return cf(n,r.s,r.u);case 4:return Ge(n,r.u,r.s),n;case 3:return n.replaceData(0,n.length,r.s),n;case 1:return Qt(n,r.s);case 2:return n.elm_event_node_ref?n.elm_event_node_ref.j=r.s:n.elm_event_node_ref={j:r.s,p:r.u},n;case 6:for(var t=r.s,e=0;e<t.i;e++)n.removeChild(n.childNodes[t.v]);return n;case 7:for(var a=(t=r.s).e,e=t.v,$=n.childNodes[e];e<a.length;e++)n.insertBefore(mr(a[e],r.u),$);return n;case 9:var i;return(t=r.s)?(typeof(i=t.A).r!="undefined"&&n.parentNode.removeChild(n),i.s=Qt(n,t.w)):n.parentNode.removeChild(n),n;case 8:return bf(n,r);case 5:return r.s(n);default:yr(10)}}function cf(n,a,t){var e=n.parentNode,a=mr(a,t);return a.elm_event_node_ref||(a.elm_event_node_ref=n.elm_event_node_ref),e&&a!==n&&e.replaceChild(a,n),a}function bf(n,r){for(var t=r.s,e=lf(t.y,r),a=(n=Qt(n,t.w),t.x),$=0;$<a.length;$++){var i=a[$],o=i.A,o=o.c===2?o.s:mr(o.z,r.u);n.insertBefore(o,n.childNodes[i.r])}return e&&n.appendChild(e),n}function lf(n,r){if(n){for(var t=$r.createDocumentFragment(),e=0;e<n.length;e++){var a=n[e].A;t.appendChild(a.c===2?a.s:mr(a.z,r.u))}return t}}function w$(n){if(n.nodeType===3)return{$:0,a:n.textContent};if(n.nodeType!==1)return{$:0,a:""};for(var a=d,r=n.attributes,t=r.length;t--;)var e=r[t],a={$:1,a:Qe(e.name,e.value),b:a};for(var $=n.tagName.toLowerCase(),i=d,o=n.childNodes,t=o.length;t--;)i={$:1,a:w$(o[t]),b:i};return $n(Oo,$,a,i)}function hf(n){for(var r=n.e,t=r.length,e=new Array(t),a=0;a<t;a++)e[a]=r[a].b;return{$:1,c:n.c,d:n.d,e:e,f:n.f,b:n.b}}var qr=mo(function(n,r,t,e){return Vo(n._impl?"Browser.application":"Browser.document",!1,t,r,e,n.h6,n,function(a,$){var i=n.er&&n.er(a),o=$r.title,c=$r.body,l=w$(c);return _f($,function(s){Yt=i;var s=n.jU(s),p=hr(_r,"body")(d)(s.hb),m=ef(l,p);c=of(c,l,m,a),l=p,Yt=0,o!==s.jC&&($r.title=o=s.jC)})})}),M$=typeof requestAnimationFrame!="undefined"?requestAnimationFrame:function(n){return setTimeout(n,1e3/60)};function _f(n,r){r(n);var t=0;function e(){t=t===1?0:(M$(e),r(n),1)}return function(a,$){n=a,$?(r(n),t===2&&(t=1)):(t===0&&M$(e),t=2)}}function mf(){return Zf($r.location.href).a||yr(1)}var w={$:1,a:null},wn=function(n){return n},I$=0,df={bj:w,bl:1,a4:I$},sf=function(n,r){return{$:1,a:{gf:df,bs:n,cy:r}}},Gt=pn,S$=function(n,r,a){var e=a.c,a=a.d,$=y(function(i,o){return Le(i.$?n:$,o,i.a)});return Le($,Le(n,r,a),e)},gf=K(S$),Xe=function(n){return S$(Gt,d,n)},Ke=function(n,r,t){for(;;){if(t.$===-2)return r;var e=t.d,a=n,$=n(t.b,t.c,Ke(n,r,t.e));n=a,r=$,t=e}},ot=function(n){return Ke(function(r,t,e){return{$:1,a:{a:r,b:t},b:e}},d,n)},pf=function(n){return Ke(function(r,t,e){return{$:1,a:r,b:e}},d,n)},j$=function(n){return pf(n)},vf=1,wf=2,Mf=0,If=I,mn=function(n,r,t){for(;;){if(!t.b)return r;var e=t.b,a=n,$=b(n,t.a,r);n=a,r=$,t=e}},Tn=function(n,r,t){for(;;){if(!t.b)return r;var e=t.b,a=n,$=n(t.a,r);n=a,r=$,t=e}},On=function(n){return mn(Gt,d,n)},A$=function(n,r,t,e){var a,$,i,o;return e.b?(a=e.a,(e=e.b).b?($=e.a,(e=e.b).b?(i=e.a,(e=e.b).b?(o=e.b,b(n,a,b(n,$,b(n,i,b(n,e.a,t>500?mn(n,r,On(o)):A$(n,r,t+1,o)))))):b(n,a,b(n,$,b(n,i,r)))):b(n,a,b(n,$,r))):b(n,a,r)):r},dr=function(n,r,t){return A$(n,r,0,t)},D=function(n,r){for(var t={$:1,a:void 0,b:d},e=t;r.b;r=r.b){var a={$:1,a:n(r.a),b:d};e.b=a,e=a}return t.b},Sf={$:0,a:d},jf=function(n){var r,t=n.cV;return t.$===1?Sf:(r=t.a,{$:0,a:D(function(e){return sf(r,e)},n.cp)})},ir=function(n,r,t){return r(n(t))},ft=K(ir),qt=function(n){return{$:1,a:n}},xe=function(n){return new Jt(n.at)},dn=function(n){return{$:1,a:n}},D$=function(n,r){return{$:3,a:n,b:r}},y$=function(n,r){return{$:0,a:n,b:r}},E$=function(n,r){return{$:1,a:n,b:r}},Mn=function(n){return{$:0,a:n}},Af=function(n){return{$:2,a:n}},v=function(n){return{$:0,a:n}},g=Ka,V=function(n,r){return Mo(n,po(r))},Df=function(n,r){return u(r.split(n))},R$=function(n){return V("\n    ",Df("\n",n))},C$=function(n){return Tn(function(r,t){return t+1},0,n)},yf=function(n,r,t){for(;;){if(!(W(n,r)<1))return t;var e={$:1,a:r,b:t};n=n,r=r-1,t=e}},pn=function(n,r){return yf(n,r,d)},T$=function(n,r){for(var t={$:1,a:void 0,b:d},e=t,a=0;r.b;a++,r=r.b){var $={$:1,a:b(n,a,r.a),b:d};e.b=$,e=$}return t.b},Ef=function(n,r){for(var t={$:1,a:void 0,b:d},e=t,a=0;r.b;a++,r=r.b){var $={$:1,a:n(a,r.a),b:d};e.b=$,e=$}return t.b},Ne=function(n){var r=n.charCodeAt(0);return 55296<=r&&r<=56319?1024*(r-55296)+n.charCodeAt(1)-56320+65536:r},J$=function(n){return n=Ne(n),97<=n&&n<=122},B$=function(n){return n=Ne(n),n<=90&&65<=n},Rf=function(n){return J$(n)||B$(n)},Cf=function(n){return n=Ne(n),n<=57&&48<=n},Tf=function(n){return J$(n)||B$(n)||Cf(n)},Jf=function(n){var r=n.charCodeAt(0);return isNaN(r)?w:v(55296<=r&&r<=56319?{a:n[0]+n[1],b:n.slice(2)}:{a:n[0],b:n.slice(1)})},Bf=y(function(n,r){return"\n\n("+g(n+1)+(") "+R$(V$(r)))}),V$=function(n){return Vf(n,d)},Vf=function(n,r){for(;;)switch(n.$){case 0:var a=n.a,t=n.b,o=(o=i=void 0,(o=Jf(a)).$!==1&&(i=(o=o.a).b,Rf(o.a))&&So(Tf,i));n=t,r={$:1,a:o?"."+a:"['"+a+"']",b:r};continue;case 1:var t=n.b,i="["+g(n.a)+"]";n=t,r={$:1,a:i,b:r};continue;case 2:if(o=n.a,o.b){if(o.b.b)return e=(r.b?"The Json.Decode.oneOf at json"+V("",On(r)):"Json.Decode.oneOf")+" failed in the following "+g(C$(o))+" ways:",V("\n\n",{$:1,a:e,b:T$(Bf,o)});n=t=o.a,r=r;continue}return"Ran into a Json.Decode.oneOf with no possibilities"+(r.b?" at json"+V("",On(r)):"!");default:var e,a=n.a,$=n.b;return(e=r.b?"Problem with the value at json"+V("",On(r))+":\n\n    ":"Problem with the given value:\n\n")+(R$(Do(4,$))+"\n\n")+a}var i,o},An=32,Cr=[],k$=sa,P$=function(n,r){return qa(r)/qa(n)},Xt=function(n){return n},Pn=k$(P$(2,An)),na={$:0,a:0,b:Pn,c:Cr,d:Cr},U$=ga,kf=x,Tr=function(n){return n.length},ra=function(n,r){return W(n,r)>0?n:r},L$=y(ra),Pf=function(n,r){for(;;){var e=ke(An,n),t=e.b,e={$:1,a:{$:0,a:e.a},b:r};if(!t.b)return On(e);n=t,r=e}},ta=function(n){return n.a},Uf=function(n,r){for(;;){var t=k$(r/An);if(t===1)return ke(An,n).a;n=Pf(n,d),r=t}},z$=function(n,r){var t,e;return r.A?(e=kf(P$(An,(t=r.A*An)-1)),n=n?On(r.E):r.E,n=Uf(n,r.A),{$:0,a:Tr(r.D)+t,b:ra(5,e*Pn),c:n,d:r.D}):{$:0,a:Tr(r.D),b:Pn,c:Cr,d:r.D}},Lf=function(n,r,t,e,a){for(;;){if(r<0)return z$(!1,{E:e,A:t/An|0,D:a});var $={$:1,a:Qa(An,r,n)};n=n,r=r-An,t=t,e={$:1,a:$,b:e},a=a}},F$=function(n,r){var t,e;return n<=0?na:(e=Qa(t=n%An,n-t,r),Lf(r,n-t-An,n,d,e))},Un=function(n){return!n.$},sr=function(n){return{$:0,a:n}},H$=function(n){switch(n.$){case 0:return 0;case 1:return 1;case 2:return 2;default:return 3}},zf=function(n,r,t,e,a,$){return{bG:$,fc:r,bO:e,f_:t,f1:n,bP:a}},Ff=function(n){return n.length},Jr=function(n,r){return n<1?r:Io(n,Ff(r),r)},Kt=function(n,r){return n<1?"":r.slice(0,n)},Hf=function(n){for(var r=0,t=n.charCodeAt(0),e=t==43||t==45?1:0,a=e;a<n.length;++a){var $=n.charCodeAt(a);if($<48||57<$)return w;r=10*r+$-48}return a==e?w:v(t==45?-r:r)},Z$=function(n,r,t,e,a){var $,i;return a===""||a.indexOf("@")>-1?w:($=Ut(":",a)).b?$.b.b||(i=Hf(Jr(($=$.a)+1,a))).$===1?w:(i=i,v(zf(n,Kt($,a),i,r,t,e))):v({bG:e,fc:a,bO:r,f_:w,f1:n,bP:t})},O$=function(n,r,t,e){var a;return e===""?w:(a=Ut("/",e)).b?Z$(n,Jr(a=a.a,e),r,t,Kt(a,e)):Z$(n,"/",r,t,e)},W$=function(n,r,t){var e;return t===""?w:(e=Ut("?",t)).b?O$(n,v(Jr((e=e.a)+1,t)),r,Kt(e,t)):O$(n,w,r,t)},Y$=function(n,r){var t;return r===""?w:(t=Ut("#",r)).b?W$(n,v(Jr((t=t.a)+1,r)),Kt(t,r)):W$(n,w,r)},Zf=function(n){return Xa("http://",n)?Y$(0,Jr(7,n)):Xa("https://",n)?Y$(1,Jr(8,n)):w},Of=function(n){for(;;)n=n},ur=Ro,I=ur(0),ea=function(n,r){return ar(function(t){return ur(n(t))},r)},Wf=K(function(n,r,t){return ar(function(e){return ar(function(a){return ur(b(n,e,a))},t)},r)}),Yf=zr,Qf=y(function(n,r){return To(ar(Yf(n),r))}),Gf=(bn.Task={b:I,c:K(function(n,r,t){return ea(function(e){return 0},(n=D(Qf(n),r),dr(Wf(Gt),ur(d),n)))}),d:K(function(n,r,t){return ur(0)}),e:y(function(n,r){return ea(n,r)}),f:void 0},Zt("Task")),Q$=function(n,r){return Gf(ea(n,r))},qf=qr,Xf=function(n){return n.a5},xt=u$,Kf=function(n){return n},G$=function(n){return 1e3*Kf(n)},q$=wn,aa=function(n){return n},ct=Xr,X$=function(n,r){return q$(aa(n)+ct(G$(r)))},$a=function(n){return X$(n.cy,n.fU)},Gn=Ft,xf=function(n){return Gn(n)},Br=Ft,ia=G$,ua=Br,Nf=Mr,Jn=function(n){return Tn(function(r,t){return yo(r.a,r.b,t)},{},n)},K$=function(n){return n.$?Nf:Jn(u([{a:"loopStart",b:ir(ia,ua,(n=n.a).fr)},{a:"loopEnd",b:ir(ia,ua,n.fq)}]))},x$=aa,N$=Gn,gr=function(n,r){return mn(Eo(n),[],r)},oa=function(n){return{$:1,a:n.a,b:n.b}},ni=function(n){return gr(function(r){var t=r.b;return Jn(u([{a:"time",b:ir(x$,N$,r.a)},{a:"volume",b:Br(t)}]))},oa(n))},Wn=Ft,ri=function(n,r){var t=r.b;return{$:0,a:n(r.a),b:D(n,t)}},nc=y(ri),fa=function(n,r){var t=r.b;return{a:n(r.a),b:t}},rc=y(fa),ti=function(n){return D(nc(rc(function(r){return X$(r,n.fU)})),n.cO)},tc=function(n,r){return Jn(u([{a:"action",b:Wn("startSound")},{a:"nodeGroupId",b:Gn(n)},{a:"bufferId",b:xf(r.bs.b1)},{a:"startTime",b:ir(x$,N$,$a(r))},{a:"startAt",b:ir(ia,ua,r.a4)},{a:"volume",b:Br(r.bU)},{a:"volumeTimelines",b:gr(ni,ti(r))},{a:"loop",b:K$(r.bj)},{a:"playbackRate",b:Br(r.bl)}]))},ec=function(n,r){for(var t={$:1,a:void 0,b:d},e=t;n.b;n=n.b){var a={$:1,a:n.a,b:d};e.b=a,e=a}return e.b=r,t.b},Nt=function(n){if(!n.b)return d;for(var r={$:1,a:void 0,b:d},t=r;n.b.b;n=n.b)for(var e=n.a;e.b;e=e.b){var a={$:1,a:e.a,b:d};t.b=a,t=a}return t.b=n.a,r.b},ac=function(n,r){return r+n},bt=function(n){switch(n.$){case 0:return Nt(D(bt,n.a));case 1:var r=n.a.gf;return u([new ye(r.bj,I$,r.bl,n.a.bs,r.a4,n.a.cy,1,d)]);default:var t=n.a,e=t.c6;switch(e.$){case 0:var a=e.a;return D(function(o){return(c=o.$c()).bU=a.ga*o.bU,c;var c},bt(t.g$));case 1:var $=e.a.gC;return D(function(o){return(c=o.$c()).cO={$:1,a:$,b:o.cO},c;var c},bt(t.g$));default:var i=e.a;return D(function(o){return(c=o.$c()).fU=ac(i,o.fU),c;var c},bt(t.g$))}}},Z=function(n,r,t,e,a){return{$:-1,a:n,b:r,c:t,d:e,e:a}},qn={$:-2},Vr=function(n,r,t,e,a){var $,i,o,c;return a.$!==-1||a.a?e.$!==-1||e.a||e.d.$!==-1||e.d.a?Z(n,r,t,e,a):(($=e.d).a,c=e.e,Z(0,e.b,e.c,Z(1,$.b,$.c,$.d,$.e),Z(1,r,t,c,a))):($=a.b,i=a.c,o=a.d,a=a.e,e.$!==-1||e.a?Z(n,$,i,Z(0,r,t,e,o),a):Z(0,r,t,Z(1,e.b,e.c,e.d,c=e.e),Z(1,$,i,o,a)))},ca=function(n,r,t){if(t.$===-2)return Z(0,n,r,qn,qn);var e=t.a,a=t.b,$=t.c,i=t.d,o=t.e;switch(Fe(n,a)){case 0:return Vr(e,a,$,ca(n,r,i),o);case 1:return Z(e,a,r,i,o);default:return Vr(e,a,$,i,ca(n,r,o))}},kr=function(n,r,t){return n=ca(n,r,t),n.$!==-1||n.a?n:Z(1,n.b,n.c,n.d,n.e)},$c=K(kr),ic=y(function(n,r){return Jn(u([{a:"nodeGroupId",b:Gn(n)},{a:"action",b:Wn("setLoopConfig")},{a:"loop",b:K$(r)}]))}),uc=y(function(n,r){return Jn(u([{a:"nodeGroupId",b:Gn(n)},{a:"action",b:Wn("setPlaybackRate")},{a:"playbackRate",b:Br(r)}]))}),oc=y(function(n,r){return Jn(u([{a:"nodeGroupId",b:Gn(n)},{a:"action",b:Wn("setVolume")},{a:"volume",b:Br(r)}]))}),fc=y(function(n,r){return Jn(u([{a:"nodeGroupId",b:Gn(n)},{a:"action",b:Wn("setVolumeAt")},{a:"volumeAt",b:gr(ni,r)}]))}),cc=function(n){return Jn(u([{a:"action",b:Wn("stopSound")},{a:"nodeGroupId",b:Gn(n)}]))},ba=function(n,r){for(var t,e={$:1,a:void 0,b:d},a=e;r.b;r=r.b)n(r.a)&&(t={$:1,a:r.a,b:d},a.b=t,a=t);return e.b},bc=K(function(n,r,t){return n=n(r),n.$?t:{$:1,a:n.a,b:t}}),In=function(n,r){return dr(bc(n),d,r)},la=function(n,r){for(;;){if(!r.b)return w;var t=r.a,e=r.b;if(n(t))return v(t);n=n,r=e}},ei=y(function(n,r){return{a:n,b:r}}),lc=function(n){for(;;){if(n.$!==-1||n.d.$!==-1)return n;n=n.d}},ai=function(n){var r,t,e,a,$,i,o,c;return n.$===-1&&n.d.$===-1&&n.e.$===-1?n.e.d.$!==-1||n.e.d.a?((r=n.d).a,(c=n.e).a,e=c.b,a=c.c,$=c.d,c=c.e,n.a,Z(1,n.b,n.c,Z(0,r.b,r.c,r.d,r.e),Z(0,e,a,$,c))):((r=n.d).a,(t=n.e).a,e=t.b,a=t.c,($=t.d).a,i=$.d,o=$.e,c=t.e,Z(0,$.b,$.c,Z(1,n.b,n.c,Z(0,r.b,r.c,r.d,r.e),i),Z(1,e,a,o,c))):n},$i=function(n){var r,t,e,a,$,i,o,c,l,_;return n.$===-1&&n.d.$===-1&&n.e.$===-1?n.d.d.$!==-1||n.d.d.a?(($=n.d).a,(_=n.e).a,o=_.b,c=_.c,l=_.d,_=_.e,n.a,Z(1,r=n.b,t=n.c,Z(0,$.b,$.c,$.d,$=$.e),Z(0,o,c,l,_))):(r=n.b,t=n.c,(e=n.d).a,(a=e.d).a,$=e.e,(i=n.e).a,o=i.b,c=i.c,l=i.d,_=i.e,Z(0,e.b,e.c,Z(1,a.b,a.c,a.d,a.e),Z(1,r,t,$,Z(0,o,c,l,_)))):n},hc=function(n,r,t,e,a,$,i){if($.$!==-1||$.a){for(;!(i.$!==-1||i.a!==1);){if(i.d.$!==-1||i.d.a===1)return $i(r);break}return r}return Z(t,$.b,$.c,$.d,Z(0,e,a,$.e,i))},ne=function(n){var r,t,e,a,$,i;return n.$===-1&&n.d.$===-1?(r=n.a,t=n.b,e=n.c,i=(a=n.d).d,$=n.e,a.a===1&&(i.$!==-1||i.a)?(i=ai(n)).$===-1?(n=i.e,Vr(i.a,i.b,i.c,ne(i.d),n)):qn:Z(r,t,e,ne(a),$)):qn},lt=function(n,r){var t,e,a,$,i,o,c;return r.$===-2?qn:(t=r.a,a=r.c,$=r.d,i=r.e,W(n,e=r.b)<0?$.$===-1&&$.a===1&&((o=$.d).$!==-1||o.a)?(o=ai(r)).$===-1?(c=o.e,Vr(o.a,o.b,o.c,lt(n,o.d),c)):qn:Z(t,e,a,lt(n,$),i):_c(n,hc(0,r,t,e,a,$,i)))},_c=function(n,r){var t,e,a,$,i;return r.$===-1?(t=r.a,e=r.c,a=r.d,$=r.e,T(n,r=r.b)?(i=lc($)).$===-1?Vr(t,i.b,i.c,a,ne($)):qn:Vr(t,r,e,a,lt(n,$))):qn},ha=function(n,r){return n=lt(n,r),n.$!==-1||n.a?n:Z(1,n.b,n.c,n.d,n.e)},mc=function(n,r){for(;;){if(n<=0||!r.b)return r;n=n-1,r=r.b}},dc=function(n,r){for(var t={$:1,a:void 0,b:d},e=t,a=0;a<n&&r.b;r=r.b,a++){var $={$:1,a:r.a,b:d};e.b=$,e=$}return t.b},ii=function(n,r){var t;return n<0||(t=(t=mc(n,r)).b?v(t.b):w,n=dc(n,r),t.$===1)?r:ec(n,t.a)},sc=y(function(i,c){var t,e,a=i.a,$=i.b,i=c.a,o=c.b,c=c.c,l=ba(function(s){return s=s.b,T(s.bs,$.bs)&&T($a(s),$a($))&&T(s.a4,$.a4)},T$(ei,i)),_=la(function(s){return T(s.b,$)},l);return _.$?l.b?(e=(l=l.a).a,t=l.b,l=In(wn,u([b(l=y(function(s,p){return T(s($),s(t))?w:v(b(p,a,s(t)))}),function(s){return s.bU},oc),b(l,function(s){return s.bj},ic),b(l,function(s){return s.bl},uc),b(l,ti,fc)])),{a:ii(e,i),b:kr(a,t,o),c:E(l,c)}):{a:i,b:ha(a,o),c:{$:1,a:cc(a),b:c}}:{a:ii(e=_.a.a,i),b:o,c:c}}),ui=function(n,r,t){return t=mn(sc,{a:bt(t),b:r,c:d},ot(r)),r=Tn(function(e,a){var $=a.a,i=a.c;return{a:$+1,b:kr($,e,a.b),c:{$:1,a:tc($,e),b:i}}},{a:n,b:t.b,c:t.c},t.a),{a:r.b,b:r.a,c:r.c}},Pr=qn,gc=function(n,r){return Jn(u([{a:"audioUrl",b:Wn(r.b_)},{a:"requestId",b:Gn(n)}]))},oi=function(n){return n.$?Nt(D(oi,n.a)):u([n.a])},fi=function(n,r,t){for(;;){if(t.$===-2)return r;var e=t.e,a=n,$=$n(n,t.b,t.c,fi(n,r,t.d));n=a,r=$,t=e}},pc=function(n,r){return fi($c,r,n)},ci=function(a,$){var t,e=a,a=oi($),$=Ef(function(i,o){return{a:e.bp+i,b:o}},a);return{a:((t=e.$c()).J=pc(e.J,Tn(function(i,o){return kr(i.a,i.b,o)},Pr,$)),t.bp=e.bp+C$(a),t),b:gr(wn,D(function(i){return gc(i.a,i.b)},$))}},vc=K(function(n,$,i){var o=i.a,e=i.b,i=i.c,$=ui(0,Pr,b($,new Jt(Pr),o)),a=$.c,$=new Ee($.a,$.b,Pr,0,w,Pr,o),o=ci($,i),$=o.a,i=o.b,o=Jn(u([{a:"audio",b:gr(wn,a)},{a:"audioCmds",b:i}]));return{a:$,b:xt(u([{$:3,n:qt,o:e},n(o)]))}}),wc=_n,bi=u$,Mc=function(n){return{$:0,a:n}},li=function(n){return{$:3,a:n}},ht=Gr,Ic=Ze(wn,ht),hi=Rn,Sc=He(function(n){switch(n){case"NetworkError":return sr(1);case"MediaDecodeAudioDataUnknownContentType":case"DOMException: The buffer passed to decodeAudioData contains an unknown content type.":return sr(0);default:return sr(2)}},hi),jc=O,_i=function(n){return n},Ac=He(function(n){switch(n){case 0:return jo(y(function(r,t){return{$:1,a:{cb:t,dp:r}}}),er("requestId",ht),er("error",Sc));case 1:return{$:9,f:K(function(r,t,e){return{$:0,a:{b1:t,b9:_i(e),dp:r}}}),g:[er("requestId",ht),er("bufferId",Ic),er("durationInSeconds",jc)]};case 2:return Ze(function(r){return{$:2,a:new Re(r)}},er("samplesPerSecond",ht));default:return sr(li({cb:"Type "+g(n)+" not handled."}))}},er("type",ht)),Dc=function(n){return n=Lt(Ac,n),Mc(n.$?li({cb:V$(n.a)}):n.a)},yc=y(function(n,r){return bi(u([{$:3,n:qt,o:b(n.jk,xe(r),r.a5)},n.g0.hV(Dc)]))}),_a=K(function(n,r,t){return b(n,t,r)}),ma=function(n,r){for(;;){if(r.$===-2)return w;var t=r.c,e=r.d,a=r.e;switch(Fe(n,r.b)){case 0:n=n,r=e;continue;case 1:return v(t);default:n=n,r=a;continue}}},mi=function(n){return n.a},re=xt(d),Ec=function(n){return n},da=function(n,l,i,e){var o=xe(e),i=b(i,o,e.a5),a=i.a,$=i.b,i=i.c,l=ui(e.bM,e.bz,b(l,o,a)),o=l.a,c=l.b,l=l.c;return(e=e.$c()).a5=a,e.bM=c,e.bz=o,a=ci(e,i),c=a.a,o=a.b,e=Jn(u([{a:"audio",b:gr(wn,l)},{a:"audioCmds",b:o}])),{a:c,b:xt(u([{$:3,n:qt,o:$},n(e)]))}},Rc=K(function(n,r,t){var e=t;if(r.$===1)return da(n.g0.jD,n.g$,b(_a,n.jO,r.a),e);var a=r.a;switch(a.$){case 0:var c=a.a.dp,$=a.a.b1,_=a.a.b9,i=ma(c,e.J);return i.$?{a:e,b:re}:(o=i.a,i=kr(Ec($),{b9:_},e.at),_=Mn({b1:$}),$=la(b(ft,ta,U$(_)),oa(o.a6)),da(n.g0.jD,n.g$,b(_a,n.jO,$.$?mi(o.a6).b:$.a.b),ho(e,ha(c,e.J),i)));case 1:var o,c=a.a.dp,l=a.a.cb,_=ma(c,e.J);return _.$?{a:e,b:re}:(o=_.a,$=dn(l),i=la(b(ft,ta,U$($)),oa(o.a6)),da(n.g0.jD,n.g$,b(_a,n.jO,i.$?mi(o.a6).b:i.a.b),_o(e,ha(c,e.J))));case 2:return _=a.a.bq,{a:(($=e.$c()).bq=v(_),$),b:re};default:return l=a.a.cb,{a:e,b:re}}}),Cc=function(n,r){return{$:2,a:new Ce(r,{$:2,a:n})}},sa=function(n){return(r=n.$c()).g$=y(function(t,e){return Cc(_i(.001*50),b(n.g$,t,e))}),r;var r},ga=function(n){return qf({h6:b(ft,n.h6,b(vc,n.g0.jD,n.g$)),jk:yc(n),jO:Rc(n),jU:function(e){var e=b(n.jU,xe(e),Xf(e)),t=e.jC,e=e.hb;return{hb:D(wc(qt),e),jC:t}}})},Tc={$:2},Jc=function(n){return{$:0,a:n}},Bc=u([0]),di=function(n){return n},Ur=function(n){return di(n).z},si=function(n){return n},L=function(n){return si(n).j},Vc=function(n){return function(r){return W(L(r),L(n))<1?r:n}},or=function(n){return di(n).b},kc=function(n,r,t){for(;;){var a=ke(An,n),e=a.a,a=a.b;if(W(Tr(e),An)<0)return z$(!0,{E:r,A:t,D:e});n=a,r={$:1,a:{$:1,a:e},b:r},t=t+1}},pa=function(n){return n.b?kc(n,d,0):na},gi=function(n,r,t){return pa(vo(n,Xe(r),Xe(t)))},pi=ei,Pc=(K(gi)(pi),function(n){return function(r){return{b:gi(pi,or(r),or(n)),z:b(Vc,Ur(r),Ur(n))}}}),vi=function(n){return function(r){return b(Pc,n,r)}},x={hI:wn,gx:wn},nn={j:0,k:{r:x,s:x}},wi={b:na,z:nn},Ln=function(n){return si(n).k},te=function(n){return n.gx},ee=function(n){return n.hI},_t=function(n){return function(r){return{hI:function(t){return b(ee,r,b(ee,n,t))},gx:function(t){return b(te,n,b(te,r,t))}}}},Mi=function(n){return n},mt=function(n){return Mi(n).r},dt=function(n){return Mi(n).s},Uc=function(n){return function(r){return{r:b(_t,mt(n),mt(r)),s:b(_t,dt(n),dt(r))}}},Xn=function(n){return function(r){return{j:L(r)+L(n),k:b(Uc,Ln(n),Ln(r))}}},zr={hI:function(n){return n.$===1?n.a:Of(n.a)},gx:function(n){return{$:1,a:n}}},Dn={j:1,k:{r:zr,s:zr}},pr=4294967295>>>32-Pn,Ii=function(n){return[n]},st=function(n,r,t,e){var a,$,i=pr&r>>>n;return W(i,Tr(e))>-1?n===5?Pe({$:1,a:t},e):($={$:0,a:st(n-Pn,r,t,Cr)},Pe($,e)):($=(a=e[i]).$?{$:0,a:st(n-Pn,r,t,Ii(a))}:{$:0,a:st(n-Pn,r,t,a.a)},at(i,$,e))},Lc=function(n,i){var t=i.a,e=i.b,a=i.c,i=Tr(i.d),$=Tr(n),i=t+($-i);return T($,An)?W(i>>>Pn,1<<e)>0?{$:0,a:i,b:$=e+Pn,c:st($,t,n,Ii({$:0,a:a})),d:Cr}:{$:0,a:i,b:e,c:st(e,t,n,a),d:Cr}:{$:0,a:i,b:e,c:a,d:n}},zc=function(n,r){return Lc(Pe(n,r.d),r)},Fc=function(n){return function(r){return{b:zc(n,or(r)),z:b(Xn,Dn,Ur(r))}}},sn=function(n){return function(r){return b(Fc,n,r)}},Hc=function(n,r){return b(sn,r,b(sn,n,wi))},Zc=function(n,r,t){return b(sn,t,Hc(n,r))},Oc=function(n,r,t,e){return b(sn,e,Zc(n,r,t))},Wc=function(n,r,t,e,a){return b(sn,a,Oc(n,r,t,e))},Yc=function(n,r,t,e,a,$){return b(sn,$,Wc(n,r,t,e,a))},Qc=function(n,r,t,e,a,$,i){return b(sn,i,Yc(n,r,t,e,a,$))},I=function(n,r,t,e,a,$,i,o){return b(sn,o,Qc(n,r,t,e,a,$,i))},Gc=function(n,r){var t=r.d,e=function(a){return a.$?{$:1,a:Pt(n,a.a)}:{$:0,a:Pt(e,a.a)}};return{$:0,a:r.a,b:r.b,c:Pt(e,r.c),d:Pt(n,t)}},qc=function(n){return function(r){return{b:Gc(n,or(r)),z:Ur(r)}}},ln=function(n){return function(r){return b(qc,n,r)}},qr=b(Xn,Dn,Dn),Xr=b(Xn,Dn,qr),Mr=b(Xn,Dn,Xr),_n=b(Xn,Dn,Mr),Gr=b(Xn,Dn,_n),rn=b(Xn,Dn,Gr),Rn=b(Xn,Dn,rn),Xc=function(n,r){return F$(n,function(t){return r})},O=function(n,r){return{b:Xc(L(r),n),z:r}},x=O,va=function(n){var r=n.a;return{r:mt(n.b),s:dt(r)}},Kn=function(n){return function(r){return{j:L(r),k:va({a:Ln(n),b:Ln(r)})}}},Lr=function(n){return dt(Ln(n))},Si=function(n){return{r:0,s:n}},Kc=function(n){return function(r){return{j:L(r)+L(n),k:Si(b(_t,Lr(n),Lr(r)))}}},xc={$:0,a:0},ae=function(n){return mt(Ln(n))},Nc=function(n){return function(r){return W(L(r),L(n))<1?Mn({r:ae(n),s:Lr(r)}):dn({r:ae(r),s:b(_t,Lr(Dn),Lr(n))})}},nb=function(n){return function(r){var t,e=b(Nc,n,r);return e.$?(t=e.a,dn({j:L(r),k:t})):(t=e.a,Mn({j:L(r),k:t}))}},rb=function(n){return function(r){return{hI:function(t){return b(ee,r,b(te,n,t))},gx:function(t){return b(ee,n,b(te,r,t))}}}},tb=function(n){return function(r){return{r:mt(r),s:b(rb,n,dt(r))}}},eb=function(n){return function(r){return{j:L(r),k:b(tb,ae(n),Ln(r))}}},ji=function(n){return n.$===1?{$:1,a:(n=n.a).a,b:n.b}:d},ab=function(n){return{$:1,a:n}},$b=function(n,r){return ab({a:n,b:r})},ib=function(n){return function(r){return $b(n,ji(r))}},Ai=function(t){var r=t.dX,t=b(nb,r,t.hS);return t.$===1?xc:b(ib,t=t.a,wa()({hS:b(eb,Dn,b(Kc,Dn,t)),dX:r}))};function wa(){return Ai}var ub=wa();wa=function(){return ub};var Di,yi=function(n){return{b:pa(ji(Ai({hS:nn,dX:b(Kn,nn,n)}))),z:b(Xn,Dn,n)}},ob=b(ln,function(n){var r=n.a,t=n.b;return b(ln,function(e){return new Te(e.a,{d:e.b,c:t})},b(vi,yi(rn),r))},b(vi,yi(rn),b(sn,b(ln,function(n){return v({t:0,P:n})},I(3,1,2,4,5,2,1,3)),b(sn,x(v({t:0,P:0}),Rn),b(sn,x(w,Rn),b(sn,x(w,Rn),b(sn,x(w,Rn),b(sn,x(w,Rn),b(sn,x(v({t:1,P:0}),Rn),b(sn,b(ln,function(n){return v({t:1,P:n})},I(3,1,2,4,5,2,1,3)),wi)))))))))),Ei=function(n){return n.c7},Ri=function(n){return n.du},$e=function(n){return function(r){return{c7:E(Ei(r),n),du:Ri(r)}}},ie=function(n,r){return{$:0,a:n,b:r}},vr=function(n){var r=n.b;return ie(1664525*n.a+r>>>0,r)},Ci=function(n){var r=vr(ie(0,1013904223));return vr(ie(r.a+n>>>0,r.b))},fr=function(n){return{c7:d,du:n}},zr=function(n){return b($e,u([Tc]),b($e,D(Jc,Bc),fr(new Je(dn(2),ob,d,w,d,Ci(1234432),w))))},fb={$:2},cb=function(n){return{$:3,a:n}},bb=function(n){return{$:4,a:n}},Ma=function(n){return{cU:d,c$:n}},Fr=function(n){return V("",n)},Ti=(Di=q$,Ht(function(n){n({$:0,a:Di(Date.now())})})),O=ar(function(n){return ur(Ci(aa(n)))},Ti),Ia=function(n,r){return n(r)},Ji=function(n,r,t){var e,a;return r.b?(e=r.b,r=Ia(r.a,t),a=r.b,ar(function($){return Ji(n,e,a)},i$(n,r.a))):ur(t)},x=K(Ji),Rn=K(function(n,r,t){return ur(t)}),Sa=function(n,r){var t=r;return function(a){var a=t(a),$=a.b;return{a:n(a.a),b:$}}},lb=(bn.Random={b:O,c:x,d:Rn,e:y(function(n,r){return Sa(n,r)}),f:void 0},Zt("Random")),hb=function(n,r){return lb(Sa(n,r))},Bi=function(n){return-n},ue=function(n){return n=n.a,n=277803737*(n^n>>>(n>>>28)+4),(n>>>22^n)>>>0},_b=function(n,r){return function(t){var e=W(n,r)<0?{a:n,b:r}:{a:r,b:n},a=e.a,$=e.b-a+1;if(!($-1&$))return{a:(($-1&ue(t))>>>0)+a,b:vr(t)};for(var i=(-$>>>0)%$>>>0,o=t;;){var c=ue(o),l=vr(o);if(!(W(c,i)<0))return{a:c%$+a,b:l};o=l}}},mb=function(n,r,t,e){var a=r,$=t,i=e;return function(_){var _=a(_),c=_.a,_=$(_.b),l=_.a,_=i(_.b),s=_.b;return{a:$n(n,c,l,_.a),b:s}}},db=function(n){var r=K(function(e,a,$){return vr(ie(e,(1|a^$)>>>0))}),t=_b(0,4294967295);return Ia(mb(r,t,t,t),n)},sb={$:0,a:dn(3),b:E(u([dn(0),dn(1),dn(2)]),D(function(n){return Mn({b1:n})},pn(0,1e3)))},gb=function(n,r){return{$:0,a:{b_:r,a6:ri(function(t){return{a:t,b:n(t)}},sb)}}},pb=t$,Vi=function(n){switch(n.$){case 0:var r=n.a;return{cU:u([gb(function(t){return{$:0,a:{P:r,f7:t}}},Fr(u(["public/","move",".mp3"])))]),c$:d};case 1:return Ma(u([Q$(function(t){return fb},pb(80))]));case 2:return Ma(u([hb(cb,db)]));default:return Ma(u([Q$(bb,Ti)]))}};O=Sr,f$(x="martinsstewart_elm_audio_from_js"),bn[x]={f:hn,u:O,a:Ho};var ki,Pi,Ui,Li,Rn={g1:Zt(x),g2:function(n,r){return f$(n),bn[n]={e:zo,u:r,a:Fo},Zt(n)}("martinsstewart_elm_audio_to_js",wn)},zi={$:3},vb={$:1},wb=function(n,r,t){for(;;){var e=t[pr&r>>>n];if(e.$)return e.a[pr&r];n=n-Pn,r=r,t=e.a}},Mb=function(n,$){var t=$.a,e=$.b,a=$.c,$=$.d;return n<0||W(n,t)>-1?w:W(n,t>>>5<<5)>-1?v($[pr&n]):v(wb(e,n,a))},Fi=function(n){return n.a},Hi=function(n){var r=n.a,t=n.b;return W(t,-1)<1?function(e){return w}:function(e){var a=Fi(e);return Mb(r?a-1-t:t,e)}},Zi=function(n,r,t,e){var a,$=pr&r>>>n,i=e[$];return i.$?(a=at(pr&r,t,i.a),at($,{$:1,a:a},e)):(a=Zi(n-Pn,r,t,i.a),at($,{$:0,a:a},e))},Ib=function(n,r,t){var e=t.a,a=t.b,$=t.c,i=t.d;return n<0||W(n,e)>-1?t:W(n,e>>>5<<5)>-1?{$:0,a:e,b:a,c:$,d:at(pr&n,r,i)}:{$:0,a:e,b:a,c:Zi(a,n,r,$),d:i}},Sb=y(function(n,r){var t=n.a,e=n.b;return function(a){var $=Fi(a)-1,i=t?$-e:e;return i>=0&&W(i,$)<1?Ib(i,r(0),a):a}}),jb=function(n,r){var t=n.a,e=n.b;return function(a){return{b:$n(Sb,{a:t,b:L(e)},r,or(a)),z:Ur(a)}}},Ab=y(function(n,r){return jb({a:n.a,b:n.b},r)}),ja=or,Oi=function(n,r){var t=n.a,e=n.b;return function(a){var $,i=b(Hi,{a:t,b:L(e)},ja(a));return i.$?a:($=i.a,$n(Ab,{a:t,b:e},function(o){return r($)},a))}},Db=y(Oi),yb=y(function(n,r){return function(t){return $n(Db,{a:0,b:n.c},Oi({a:0,b:n.d},function(e){return(e=e.$c()).c1=r(0),e}),t)}}),Wi=function(n){return function(r){return Tn(function(t,e){return $n(yb,t.ap,function(a){return t.bo},e)},r,n)}},Yi=function(n){return Yi(n)},Eb=function(n){var r=n.a,t=n.b;return function(e){var a=b(Hi,{a:r,b:L(t)},or(e));return a.$?Yi({hz:e,hG:u(["`ArraySized` was shorter than promised by its type.\n","\uD83D\uDC99 Please report under https://github.com/lue-bird/elm-typesafe-array/issues"])}):a.a}},oe=function(n){var r=n.a,t=n.b;return function(e){return b(Eb,{a:r,b:t},e)}},gn=function(n){return function(r){return b(oe,{a:0,b:n.d},b(oe,{a:0,b:n.c},r)).c1}},zn=function(n,r){if(!r.b)return d;for(var t={$:1,a:void 0,b:d},e=t;r.b.b;r=r.b)for(var a=n(r.a);a.b;a=a.b){var $={$:1,a:a.a,b:d};e.b=$,e=$}return e.b=n(r.a),t.b},Rb=function(n,r){return function(t){switch(t.$){case 0:return u([{ap:t.a,bo:w}]);case 1:var e=t.a;return u([{ap:e.aY,bo:w},{ap:e.Q,bo:b(gn,e.aY,r)}]);default:return e=b(gn,n.aY,r),e.$===1?d:u([{ap:n.Q,bo:v({t:e.a.t,P:4})}])}}},Qi=function(n,r){return E(u([{ap:n.aY,bo:w},{ap:n.Q,bo:b(gn,n.aY,r)}]),zn(Rb(n,r),n.am))},Aa=function(n){return function(r){return b(Wi,Qi(n,r),r)}},Sn=0,gt=function(n){return n<0?-n:n},Gi=function(n,r,t){for(;;){if(t.$===1)return r;var e=t.e,a=n,$=$n(n,t.b,t.c,Gi(n,r,t.d));n=a,r=$,t=e}},Cb=function(n,r,t){return Gi(n,r,t.b)},qi=function(n){return function(r){return t=function($,i,o){return E(o,n({a:$,b:i}))},e=d,a=r,Cb(K(function($,i,o){return t(i.a,i.b,o)}),e,a);var t,e,a}},Tb=function(n){return{$:1,a:n}},Jb=function(n){return{$:0,a:n}},fe=function(n){var r=n.a,t=n.b;return function(e){return W(e,L(r))<0?dn(Jb(e)):W(e,L(t))>0?dn(Tb({j:e,k:Si(b(_t,Lr(Dn),ae(t)))})):Mn({j:e,k:va({a:Ln(r),b:Ln(t)})})}},Xi=u([{d:2,c:1},{d:2,c:-1},{d:-2,c:1},{d:-2,c:-1},{d:1,c:2},{d:1,c:-2},{d:-1,c:2},{d:-1,c:-2}]),Ki=u([D(function(n){return{d:0,c:n}},pn(1,7)),D(function(n){return{d:0,c:-n}},pn(1,7)),D(function(n){return{d:n,c:0}},pn(1,7)),D(function(n){return{d:-n,c:0}},pn(1,7))]),xi=u([{d:1,c:0},{d:-1,c:0},{d:0,c:1},{d:1,c:1},{d:-1,c:1},{d:-1,c:-1},{d:1,c:-1},{d:0,c:-1}]),Ni=u([D(function(n){return{d:n,c:n}},pn(1,7)),D(function(n){return{d:n,c:-n}},pn(1,7)),D(function(n){return{d:-n,c:n}},pn(1,7)),D(function(n){return{d:-n,c:-n}},pn(1,7))]),ce=function(n,r,t){for(;;){if(!t.b)return r;var e=t.b,a=n(t.a,r);if(a.$)return a.a;n=n,r=a.a,t=e}},Bb=function(n,r){var t,e=n.ap,a=n.t,$=function(o){var c=b(fe,{a:nn,b:rn},L(e.c)+o.c);return c.$||(c=c.a,(o=b(fe,{a:nn,b:rn},L(e.d)+o.d)).$)?w:v({d:o.a,c:c})},i=function(o){return function(c){return ce(function(s,_){var s=$(s);return s.$===1?{$:1,a:_}:(s=b(gn,s.a,r)).$===1?{$:0,a:_}:T((s=s.a).t,a)&&o(s.P)?{$:0,a:{$:1,a:s,b:_}}:{$:1,a:_}},d,c)}};return E(zn(function(o){return b(i,function(c){switch(c){case 3:case 4:return!0;default:return!1}},o)},Ki),E(In(function(c){var c=$(c);return c.$!==1&&(c=b(gn,c.a,r)).$!==1&&T(c=c.a,{t:a,P:1})?v(c):w},Xi),E(In(function(c){var c=$(c);return c.$!==1&&(c=b(gn,c.a,r)).$!==1&&T(c=c.a,{t:a,P:5})?v(c):w},xi),E(zn(function(o){return b(i,function(c){switch(c){case 2:case 4:return!0;default:return!1}},o)},Ni),(t=a===1?-1:1,In(function(c){var c=$({d:c,c:t});return c.$!==1&&(c=b(gn,c.a,r)).$!==1&&T(c=c.a,{t:a,P:0})?v(c):w},u([1,-1])))))))},xn=function(n){return n?0:1},Da=function(n,r){return!T(Bb({t:xn(n.cg),ap:n.cT},r),d)},nu=K(function(n,r,a){var e=a.c,a=a.d,$=y(function(i,o){return Ue(i.$?n:$,o,i.a)});return Ue(n,Ue($,r,e),a)}),Vb=K(function(n,r,t){var e=r?gf:nu;return function(a){return $n(e,t,n,a)}}),ru=K(function(n,r,t){return function(e){return Dr(Vb,n,r,t,ja(e))}}),kb=function(n,r){return Dr(ru,w,0,y(function(t,e){return e.$?Dr(ru,w,0,y(function(a,$){return $.$?T(a.c1,v({t:n,P:5}))?v(a.ap):w:v($.a)}),t):v(e.a)}),r)},tu=function(n){return function(r){var t=kb(n,r);return t.$!==1&&Da({cT:t.a,cg:n},r)}},eu=function(n){return function(r){return n.jQ.b?w:v(b(tu,n.cg,r)?1:0)}},au=function(n,r){var t=n.jQ;return T(n.bA,Sn)?(n=b(eu,{cg:Sn,jQ:t},r)).$?w:n.a?v(-1e4):v(0):(n=b(eu,{cg:xn(Sn),jQ:t},r)).$?w:n.a?v(1e4):v(0)},$u=function(n,r){return W(n,r)<0?n:r},iu=y($u),Q=function(n,r,t,e,a){return{$:0,a:n,b:r,c:t,d:e,e:a}},cr={$:1},Hr=function(n,r,t,e,a){var $,i,o,c;return a.$||a.a?e.$||e.a||e.d.$||e.d.a?Q(n,r,t,e,a):(($=e.d).a,c=e.e,Q(0,e.b,e.c,Q(1,$.b,$.c,$.d,$.e),Q(1,r,t,c,a))):($=a.b,i=a.c,o=a.d,a=a.e,e.$||e.a?Q(n,$,i,Q(0,r,t,e,o),a):Q(0,r,t,Q(1,e.b,e.c,e.d,c=e.e),Q(1,$,i,o,a)))},ya=function(n,r,t){if(t.$===1)return{a:Q(0,n,r,cr,cr),b:!0};var e=t.a,a=t.b,$=t.c,i=t.d,o=t.e;switch(Fe(n,a)){case 0:var c=ya(n,r,i),l=c.b;return{a:Hr(e,a,$,c.a,o),b:l};case 1:return{a:Q(e,a,r,i,o),b:!1};default:return c=ya(n,r,o),l=c.b,{a:Hr(e,a,$,i,c.a),b:l}}},Pb=function(n,r,t){return n=ya(n,r,t),n.a.$||n.a.a?n:((r=n.a).a,t=n.b,{a:Q(1,r.b,r.c,r.d,r.e),b:t})},Ub=function(a,$,t){var e=t.a,a=Pb(a,$,t.b),$=a.a;return a.b?{$:0,a:e+1,b:$}:{$:0,a:e,b:$}},uu=function(n,r,t){return Ub({a:L(n.c),b:L(n.d)},{a:n,b:r},t)},Lb=function(n){for(;;){if(n.$===1)return w;if(n.d.$===1)return v({a:n.b,b:n.c});n=n.d}},ou=function(n,r,t,e,a){var $,i,o,c,l,_,s,p,m;return e.$||($=e.b,i=e.c,o=e.d,c=e.e,a.$)?{t:n,bh:r,ii:e,iV:a,bx:t}:a.d.$||a.d.a?(l=a.b,_=a.c,e=a.d,m=a.e,{t:1,bh:r,ii:Q(0,$,i,o,c),iV:Q(0,l,_,e,m),bx:t}):(l=a.b,_=a.c,(n=a.d).a,e=n.c,s=n.d,p=n.e,m=a.e,{t:0,bh:n.b,ii:Q(1,r,t,Q(0,$,i,o,c),s),iV:Q(1,l,_,p,m),bx:e})},fu=function(n){return function(r){return function(t){return function(e){return function(a){return function($){return function(i){return function(o){return function(c){return function(l){return a.$||a.a?Q(1,n,r,Q(0,t,e,a,$),Q(0,i,o,c,l)):Q(0,t,e,Q(1,a.b,a.c,a.d,a.e),Q(1,n,r,$,Q(0,i,o,c,l)))}}}}}}}}}},zb=function(n,r,t,e,a,$){if(a.$)return n;if(a.a){for(var i,o,c,l,_=a.b,s=a.c,p=a.d,m=a.e;!($.$||$.a!==1);){if($.d.$)return i=$.b,o=$.c,l=$.e,fu(t)(e)(_)(s)(p)(m)(i)(o)(cr)(l);if($.d.a===1)return i=$.b,o=$.c,(c=$.d).a,l=$.e,fu(t)(e)(_)(s)(p)(m)(i)(o)(c)(l);break}return n}return Q(r,_=a.b,s=a.c,p=a.d,Q(0,t,e,m=a.e,$))},be=function(n){var r,t,e,a,$;return n.$||n.d.$?cr:(r=n.a,t=n.b,e=n.c,$=(a=n.d).d,n=n.e,a.a===1&&($.$||$.a)?($=ou(r,t,e,a,n),Hr($.t,$.bh,$.bx,be($.ii),$.iV)):Q(r,t,e,be(a),n))},pt=function(n,r){var t,e,a,$,i,o,c,l;return r.$===1?{a:cr,b:!1}:(t=r.a,a=r.c,$=r.d,i=r.e,W(n,e=r.b)<0?$.$||$.a!==1?(l=(o=pt(n,$)).b,{a:Q(t,e,a,o.a,i),b:l}):(o=$.d).$||o.a?(o=ou(t,e,a,$,i),l=(c=pt(n,o.ii)).b,{a:Hr(o.t,o.bh,o.bx,c.a,o.iV),b:l}):(l=(c=pt(n,$)).b,{a:Q(t,e,a,c.a,i),b:l}):Fb(n,zb(r,t,e,a,$,i)))},Fb=function(n,r){var t,e,a,$,i;return r.$?{a:cr,b:!1}:(t=r.a,e=r.c,a=r.d,$=r.e,T(n,r=r.b)?(i=Lb($)).$?{a:cr,b:!0}:{a:Hr(t,(i=i.a).a,i.b,a,be($)),b:!0}:(n=(i=pt(n,$)).b,{a:Hr(t,r,e,a,i.a),b:n}))},Hb=function(t,r){var t=pt(t,r);return t.a.$||t.a.a?t:((r=t.a).a,t=t.b,{a:Q(1,r.b,r.c,r.d,r.e),b:t})},Zb=function(e,r){var t=r.a,e=Hb(e,r.b);return e.b?{$:0,a:t-1,b:e.a}:r},cu=function(n,r){return Zb({a:L(n.c),b:L(n.d)},r)},Ob=function(n){return function(r){return Tn(function(t,e){return{b3:cu(t.ap,e.b3),bd:t.bo.$===1?cu(t.ap,e.bd):uu(t.ap,0,e.bd)}},r,n)}},Wb=b(ln,ln(function(n){return 3.14*n}),I(I(.9,.85,.8,.8,.8,.8,.85,.9),I(1.2,1.1,1,.99,.99,1,1.1,1.2),I(1.1,1.1,1,.95,.96,1,1.1,1.1),I(1,1.1,1,.8,.8,1,1.1,1),I(1.1,1.1,1,.89,.89,1,1.1,1),I(1.2,1.1,1,.94,.94,1,1.1,1.2),I(1.2,1.5,.97,.95,.95,.95,1.5,1.2),I(.9,.85,.8,.8,.8,.8,.85,.9))),Yb=b(ln,ln(function(n){return 3.9*n}),I(I(.7,.75,.79,.8,.8,.79,.75,.7),I(.8,.85,.89,.9,.9,.89,.85,.8),I(.8,.85,.89,.9,.9,.89,.85,.8),I(.8,.85,.89,.9,.9,.89,.85,.8),I(.8,.85,.89,.9,.9,.89,.85,.8),I(.8,.85,.89,.9,.9,.89,.85,.8),I(.9,.9,.8,.8,.8,.8,.9,.9),I(1,1,.8,.88,.88,.8,1,1))),Qb=b(ln,ln(function(n){return 2.96*n}),I(I(.4,.8,.8,.8,.8,.8,.8,.4),I(.8,.9,1,.99,.99,1,.9,.8),I(.85,1.1,1.4,1.12,1.2,1.6,1.1,.85),I(.8,1.1,13,1.15,1.1,1,1.1,.8),I(.8,1,1,1.1,1,1,1,.8),I(.8,1,1,1,1,1,1,.8),I(.8,.8,.97,.95,.95,.95,.9,.8),I(.4,.8,.8,.8,.8,.8,.8,.4))),Gb=b(ln,ln(function(n){return 1.1*n}),I(I(9,9,9,9,9,9,9,9),I(4,4,4,4,4,4,4,4),I(2.4,2.4,2.4,2.4,2.4,2.4,2.4,2.4),I(1.2,1.4,1.4,1.4,1.4,1.4,1.4,1.2),I(.9,1.24,1.2,1.22,1.22,1.2,1.24,.9),I(1.12,1.12,.98,1.06,1,.98,1.12,1.12),I(.9,.9,.9,.9,.9,.9,.9,.9),I(0,0,0,0,0,0,0,0))),qb=b(ln,ln(function(n){return 8.6*n}),I(I(1.2,1.2,1.14,1.1,1.1,1.14,1.2,1.2),I(1.14,1.14,1.14,1.4,1.4,1.14,1.2,1.2),I(1.1,1.04,1.04,1,1,1.04,1.04,1.1),I(1.04,1.01,1.01,1.2,1.2,1.01,1.01,1.04),I(1.04,1,1,.95,.95,1,1,1.03),I(1.05,1.02,1,.99,.99,1,1,1.06),I(.91,.9,.97,.95,.95,.85,.9,.92),I(.89,.86,.82,.86,.86,.89,.94,.9))),Xb=b(ln,ln(function(n){return 4.5*n}),I(I(1.2,1.2,1.14,1.1,1.1,1.14,1.2,1.2),I(1.14,1.14,1.14,1.4,1.4,1.14,1.2,1.2),I(1.1,1.04,1.04,1,1,1.04,1.04,1.1),I(1.04,1.01,1.01,1,1,1.01,1.01,1.04),I(1.04,1,1,.95,.95,1,1,1.03),I(1.05,1.02,1,.99,.99,1,1,1.06),I(.76,1,.97,.95,.95,.95,.94,.78),I(.76,1,.97,.95,.95,.95,.94,.78))),Kb=function(n){switch(n){case 0:return Gb;case 1:return Qb;case 2:return Wb;case 3:return Xb;case 4:return qb;default:return Yb}},xb=b(nu,Gt,d),Nb=pa,nl=function(n){return{b:ir(xb,Nb,or(n)),z:Ur(n)}},le=function(n,r){return b(oe,{a:0,b:r.ap.d},b(oe,{a:0,b:r.ap.c},(n===1?nl:wn)(Kb(r.P))))},rl=function(n,r){return Tn(function(t,e){return e+((e=b(gn,t.ap,r)).$===1?0:(T((e=e.a).t,Sn)?Bi:wn)(le(e.t,{ap:t.ap,P:e.P})))+((e=t.bo).$===1?0:(T((e=e.a).t,Sn)?wn:Bi)(le(e.t,{ap:t.ap,P:e.P})))},0,n)},Sr=function(n,r,t){return n(r(t))},tl=K(Sr),el=function(n){return!n},al=function(n,r){return ba(b(tl,el,n),r)},$l={$:2},hn=function(n){return function(r){return{j:L(r),k:va({a:Ln(r),b:Ln(n)})}}},il=b(hn,rn,b(Kn,nn,_n)),ul=b(hn,rn,nn),ol={dH:b(hn,rn,b(Kn,nn,Gr)),dI:b(hn,rn,b(Kn,nn,_n)),dd:b(Kn,nn,rn)},fl={dH:b(hn,rn,b(Kn,nn,qr)),dI:b(hn,rn,b(Kn,nn,Xr)),dd:b(hn,rn,nn)},cl=b(hn,rn,b(Kn,nn,Mr)),vt=function(n){return function(r){return!T(b(gn,n,r),w)}},wr=function(n,r){return T(L(n.c),L(r.c))&&T(L(n.d),L(r.d))},bl=y(wr),Cn=function(n,r){return r.$?w:v(n(r.a))},bu=function(n){return u([n])},ll=b(hn,rn,b(Kn,nn,Mr)),hl=b(hn,rn,nn),lu=function(n){return{am:d,Q:n}},hu=function(n,r){var t=b(gn,n,r);if(t.$===1)return d;var e,a,$=t.a,i=function(m){return m=b(gn,m,r),m.$!==1&&T(m.a.t,xn($.t))},o=function(m){var S=b(fe,{a:nn,b:rn},L(n.c)+m.c);return!S.$&&(S=S.a,!(m=b(fe,{a:nn,b:rn},L(n.d)+m.d)).$)&&(!b(vt,m={d:m.a,c:S},r)||i(m))?v(m):w},c=function(m){return ce(function(Y,M){var Y=o(Y);return Y.$===1?{$:1,a:M}:b(vt,Y=Y.a,r)?{$:1,a:{$:1,a:{am:d,Q:Y},b:M}}:{$:0,a:{$:1,a:{am:d,Q:Y},b:M}}},d,m)},l=function(m){return zn(c,Ni)},_=function(m){return zn(c,Ki)};switch($.P){case 0:var s=function(m){return L(m.c)&&L(m.c)!==7?d:u([$l])},p=$.t===1?1:-1;return E(In(function(S){var S=o({d:S,c:p});return S.$!==1&&i(S=S.a)&&T(Cn(function(M){return M.P},b(gn,n,r)),v(0))?v({am:s(S),Q:S}):w},u([1,-1])),E((a=$.t===1?ll:il,T(L(n.c),L(a))?In(function(m){var S=o({d:m,c:0});return S.$===1||!i(S=S.a)||!T(Cn(function(M){return M.P},b(gn,S,r)),v(0))||(m=o({d:m,c:p})).$===1?w:v({am:wr(m=m.a,S)?d:u([{$:0,a:S}]),Q:m})},u([1,-1])):d),D(function(m){return{am:E(s(m.Q),m.am),Q:m.Q}},ce(function(M,S){var M=o(M);return M.$===1||b(vt,M=M.a,r)?{$:1,a:S}:{$:0,a:{$:1,a:{am:d,Q:M},b:S}}},d,{$:1,a:{d:0,c:p},b:(a=$.t?1:6,T(L(n.c),a)?u([{d:0,c:2*p}]):d)}))));case 2:return l();case 1:return In(function(m){return Cn(lu,o(m))},Xi);case 3:return _();case 4:return E(l(),_());default:return E(In(function(m){return Cn(lu,o(m))},xi),!Da({cT:n,cg:$.t},r)&&wr({d:cl,c:e=$.t?ul:hl},n)?In(function(m){var S,M;return!T(b(gn,{d:m.dd,c:e},r),v({t:$.t,P:3}))||(M={d:m.dH,c:e},b(vt,S={d:m.dI,c:e},r))||b(vt,M,r)||Da({cT:S,cg:$.t},r)?w:v({am:bu({$:1,a:{aY:{d:m.dd,c:e},Q:S}}),Q:M})},u([ol,fl])):d)}},Ea=function(n,r){var t,e=b(gn,n,r);return e.$===1?hu(n,r):(t=e.a,al(function(a){return b(tu,t.t,b(Aa,{am:a.am,aY:n,Q:a.Q},r))},hu(n,r)))},_u=function(n){return function(r){return D(function(t){return{am:t.am,aY:n,Q:t.Q}},Ea(n,r))}},Zr=function(n,r){return r.$?n:r.a},mu=function(l){var r,t,e,a=l.bA,$=l.dJ,i=l.R,o=l.dM,c=l.ei,l=Qi(l.aP,i),_=o+rl(l,i);return $>=3?_:(r={b3:(o=b(Ob,l,c)).bd,bd:o.b3},t=b(Wi,l,i),c=b(qi,function(s){return b(_u,s.a,t)},o.bd),(l=au({bA:xn(a),jQ:c},t)).$?(e=T(a,Sn)?L$:iu,Zr(0,ce(function(s,p){var m=function(S){return mu(new Bt(t,xn(a),$+1,_,s,r))};return p.$===1?{$:0,a:v(m())}:gt(p=p.a)>1e3?{$:1,a:v(p)}:{$:0,a:v(b(e,p,m()))}},w,c))):l.a)},_l={$:0,a:0,b:cr},du=function(n){return function(r){return Tn(function(t,e){return t=n(t),uu(t.a,t.b,e)},_l,r)}},ml={cc:0,aP:{am:d,aY:{d:b(hn,rn,nn),c:b(hn,rn,nn)},Q:{d:b(hn,rn,nn),c:b(hn,rn,nn)}}},he=function(n){return Xe(ja(n))},_e=function(n){return function(r){return zn(function(t){return In(function(e){var a=e.c1;return a.$!==1&&T((a=a.a).t,n)?v({ap:e.ap,P:a.P}):w},he(t))},he(r))}},dl=function(n){var r,t=b(du,function(i){return{a:i.ap,b:0}},b(_e,xn(Sn),n)),e=b(du,function(i){return{a:i.ap,b:0}},b(_e,Sn,n)),a=b(qi,function(i){return b(_u,i.a,n)},e),$=(r=au({bA:Sn,jQ:a},n)).$?Tn(function(i,o){return o+le(Sn,i)},0,b(_e,Sn,n))-Tn(function(i,o){return o+le(xn(Sn),i)},0,b(_e,xn(Sn),n)):r.a;return Zr(ml,Tn(function(i,o){return v((c=mu(new Bt(n,xn(Sn),0,$,i,{b3:e,bd:t})),o.$===1||W(c,(o=o.a).cc)>0?{cc:c,aP:i}:o));var c},w,a))},sl=function(n,r){for(;;){if(!r.b)return w;var t=r.a,e=r.b;if(n(t))return v(t);n=n,r=e}},gl=function(n,r){return Cn(function(t){return t.am},sl(function(t){return wr(r.Q,t.Q)},Ea(r.aY,n)))},pl=function(n){return W(n,-9)<0?{a:"I swear I wasn't playing my best! Me wanna play again.",b:u(["How did i blunder this badly?!","That came outta nowhere for me. You got great strategic thinking.","I might as well resign and start over","Either you played great... or I'm just bad at chess","Oh man. Not my brightest hour...","I'm not a worthy opponent for your play."])}:W(n,-6)<0?{a:"This isn't how it was supposed to go...",b:u(["Well played.","Nicely done.","I completely missed this idea. Nice","You got me good in this game","Very fine moves!","Excellent",":---( no!","I'm sad.","Damn... I request another game!","I'm close to just resigning"])}:W(n,-4)<0?{a:"Hmmm, you're better than i expected.",b:u(["You're doing great.","You're on a good path. Keep at it!","Good job so far!","By this point it'll be hard to recover for me :(","This is not exactly going my way :/","I'm disappointed in myself.","Yikes. I'm bad",":(","eh...","Maybe I'll choose the second engine move instead of the third from now on","How about I try to to make actual moves from now?","That's no fair... You weren't supposed to be good","And here I thought this would go as smooth as your brain...","Great moves!"])}:W(n,-2)<0?{a:"Time to step up my game.",b:u(["You got a bit lucky i guess, I'll turn this around in no time","Don't think you're winning just yet (please)","I couldn't find great moves so far","Not bad.","Nice.","Good. Good.","Jo","I was too focused on chatting... Imma think more","Hey!","You know what you're doing at least"])}:W(n,-1)<0?{a:"A few nice moves you got there. I'm not worried, yet.",b:u(["Right...","Aha...","Hmmm","You're not making this as easy as I thought","I'm not scared. Go on","I like how you play.","I don't hate how you're playing...","Not bad. Do you have ideas on how to proceed?","Yep","I wouldn't say you're much better here","You're very far from winning this... but so am I"])}:n<.5?{a:"Ok",b:u(["Equal position... do you want to win or no?","Draw...","Boring...","ZzzzZzz","Wake me up when you make a move that does something.","Not great, not terrible","...","You're definitely holding.",":-|","Do you have something planned, yet?","You're not losing... but you aren't winning either"])}:n<2?{a:"Comfortable position for me.",b:u(["I like where this is going","Yey","This is starting to look promising","Jo","If I get in a few more moves I might already be better","Yeee","I'm good here. How are you?","I haven't blundered so far, which is good :)","Everyone preparing"])}:n<4?{a:"Imma relax because you don't seem to be able to keep up with my skills.",b:u(["Am i starting to outplay you?","I believe in you! You can draw this I think.","Common, you can't just let me win like this.","I really like my position!","What are you gonna do? I'd say I'm already better","I'm poppin off!","You're better than this!",":)",":-)","Have you tried playing better moves?","This is smooth-sailing. :3"])}:n<6?{a:"You're just trash.",b:u(["I didn't expect you to be this bad.","You're blundering and I'm happy. This is how it is supposed to be.","You're disappointing me.","I'd be angry at myself if I was playing as bad as you.","Just what are you doing...","This is not how chess is played","You might as well resign now","Did you see this coming?","Yipeeee","Lemme harvest this win from you. And the next one too if you like"])}:n<9?{a:"Git gud",b:u(["Better luck next time","Prepare to lose","You should be ashamed. Ashamed.","Time to clean up.","Where is my big prize for winning against you?","This is what you deserve for playing this badly.","I didn't even have to make any moves. It's more like you lost to yourself.","You might as well resign and start over","You're not a worthy opponent for my play."])}:{a:"Go back to checkers",b:u(["Go back to tic-tac-toe","We win deez","That wasn't even a game. What are you doing?","Train for another 300 years.","You're terrible at this.","Is what your playing supposed to be chess?","Didn't you say you can play chess?","Maybe go back to learning how the knight moves"])}},vl=function(n){return{a:1,b:n}},wl=function(n,r){return function(t){var e=vr(t),a=gt(r-n),$=ue(e);return{a:(134217728*(1*(67108863&ue(t)))+1*(134217727&$))/9007199254740992*a+n,b:vr(e)}}},Ml=K(function(n,r,t){for(;;){var e=n.a,a=n.b;if(!r.b)return a;var $=r.a,i=r.b;if(W(t,gt(e))<1)return a;n=$,r=i,t=t-gt(e)}}),Il=function(n,r){var t=function(e){return gt(e.a)},t=t(n)+(t=D(t,r),mn(If,0,t));return Sa(b(Ml,n,r),wl(0,t))},Sl=function(n,r){return Il({a:1,b:n},D(vl,r))},jl=function(n){return n=pl(n),Sl(n.a,n.b)},Al=function(n){switch(n.$){case 0:var r=n.a;return function($){return fr((($=$.$c()).cV=r.f7,$))};case 1:var t=n.a;return function($){var i,o,c=$.a3;return c.$===1?(i=b(gn,t,$.R)).$===1||T(i.a.t,Sn)?{c7:d,du:$}:fr(Wa($,v(t))):(c=gl($.R,{aY:i=c.a,Q:t})).$===1?fr(Wa($,w)):(c=c.a,b($e,u([zi,vb]),fr(((o=$.$c()).R=b(Aa,{am:c,aY:i,Q:t},$.R),o.a3=w,o.ck=v({aY:i,Q:t}),o))))};case 2:return function($){var i,o=dl($.R),l=Ia(jl(o.cc),$.ct),c=l.a,l=l.b;return b($e,u([zi]),fr(((i=$.$c()).R=b(Aa,o.aP,$.R),i.b4={$:1,a:c,b:$.b4},i.ck=v({aY:o.aP.aY,Q:o.aP.Q}),i.ct=l,i)))};case 3:var e=n.a;return function($){return fr((($=$.$c()).ct=e,$))};default:var a=n.a;return function($){return fr(((i=$.$c()).cp={$:1,a:a,b:$.cp},i));var i}}},Dl=bi(d),yl=function(n){return Dl},El=function(n){return{$:1,a:n}},su=function(n){return function(r){var t=D(n,Ei(r));return{a:Ri(r),b:xt(zn(function(e){return e.c$},t)),c:(r=zn(function(e){return e.cU},t),El(r))}}},me=function(n,r,t){return{$:4,a:n,b:r,c:t}},jn=function(n,r){return{$:4,a:n,b:r}},O=function(n){return n>31?{$:1,a:1<<n-32}:{$:0,a:1<<n}},gu=O(8),un=function(n){return g(ct(255*n))},wt=function(n){var r=n.b,t=n.c,e=n.d;return un(n.a)+("-"+un(r)+("-"+un(t)+("-"+un(e))))},Or=function(n){return jn(gu,me("bg-"+wt(n),"background-color",n))},Rl=function(n){return{$:1,a:n}},f=new Be("a","atv","ab","cx","cy","acb","accx","accy","acr","al","ar","at","ah","av","s","bh","b","w7","bd","bdt","bn","bs","cpe","cp","cpx","cpy","c","ctr","cb","ccx","ccy","cl","cr","ct","cptr","ctxt","fcs","focus-within","fs","g","hbh","hc","he","hf","hfp","hv","ic","fr","lbl","iml","imlf","imlp","implw","it","i","lnk","nb","notxt","ol","or","oq","oh","pg","p","ppe","ui","r","sb","sbx","sby","sbt","e","cap","sev","sk","t","tc","w8","w2","w9","tj","tja","tl","w3","w5","w4","tr","w6","w1","tun","ts","clr","u","wc","we","wf","wfp","wrp"),Mt=function(n){return{$:1,a:n}},Bn=function(n,r){return{$:"a2",n:n,o:Wn(r)}},Vn="className",It=(y(Bn)(Vn),function(n){return Mt(Bn(Vn,n))}),Cl=y(function(n,r){return{$:2,a:n,b:r}}),Tl=y(function(n,r){return{$:1,a:n,b:r}}),Nn=2,Wr={$:0},Jl={$:0},Bl=f.gZ+" "+f.d,Vl=f.gZ+" "+f.hZ,kl=f.gZ+" "+f.fW,Pl=f.gZ+" "+f.fX,Ul=f.gZ+" "+f.c,Ll=f.gZ+" "+f.i7,zl=function(n){switch(n){case 0:return Ul;case 1:return Bl;case 2:return Ll;case 3:return Vl;case 4:return Pl;default:return kl}},St={$:0},pu=function(n,r){switch(r.$){case 0:return n;case 1:return E(r.a,n);case 2:return E(n,r.a);default:return E(r.a,E(n,r.b))}},vu=function(n,r,t){switch(t.$){case 0:return r;case 1:return E(D(function($){return{a:n,b:$}},e=t.a),r);case 2:return E(r,D(function($){return{a:n,b:$}},a=t.a));default:var e=t.a,a=t.b;return E(D(function($){return{a:n,b:$}},e),E(r,D(function($){return{a:n,b:$}},a)))}},jt=4,wu=O(41),Mu=O(40),Iu=O(42),Su=O(43),ju=hr(_r,"div"),Ra=ju.a2,Au=Pr,Yn=function(n){switch(n.$){case 0:return g(n.a)+"px";case 1:return"auto";case 2:return g(n.a)+"fr";case 3:var r=n.b;return"min"+(g(n.a)+Yn(r));default:return r=n.b,"max"+(g(n.a)+Yn(r))}},Ca=function(n){switch(n.$){case 0:return w;case 1:var r=n.a,t=r.b,e=r.c;return v("mv-"+un(r.a)+("-"+un(t)+("-"+un(e))));default:var r=n.a,t=r.b,e=r.c,i=n.b,a=i.a,$=i.b,i=i.c,l=n.c,o=l.a,c=l.b,l=l.c,_=n.d;return v("tfrm-"+un(r.a)+("-"+un(t)+("-"+un(e)+("-"+un(a)+("-"+un($)+("-"+un(i)+("-"+un(o)+("-"+un(c)+("-"+un(l)+("-"+un(_)))))))))))}},At=function(n){switch(n.$){case 13:return e=n.a;case 12:var e=n.a;return e;case 0:return n.a;case 1:return e=n.a;case 2:return"font-size-"+g(n.a);case 3:case 4:return n.a;case 5:var t=n.a;return t;case 7:case 6:return t=n.a,t;case 8:return t=n.a,"grid-rows-"+V("-",D(Yn,t.iZ))+("-cols-"+V("-",D(Yn,t.aL))+("-space-x-"+Yn(t.jb.a)+("-space-y-"+Yn(t.jb.b))));case 9:return t=n.a,"gp grid-pos-"+g(t.c)+("-"+g(t.hw)+("-"+g(t.gF)+("-"+g(t.e9))));case 11:var r=n.a,t=n.b,e=function(){switch(r){case 0:return"fs";case 1:return"hv";default:return"act"}}();return V(" ",D(function(a){return a=At(a),a===""?"":a+"-"+e},t));default:return Zr("",Ca(n.a))}},Fl=function(n,r){return kr(n,0,r)},Hl=function(n,r){return!ma(n,r).$},Zl=function(n,r){return Hl(n,r)},Du=y(function(n,r){var t=r.a,e=r.b,a=At(n);return Zl(a,t)?r:{a:Fl(a,t),b:{$:1,a:n,b:e}}}),U=function(n,r){return{$:0,a:n,b:r}},yu=function(n,r){return{$:0,a:n,b:r}},h=function(n){return"."+n},X=Ka,Yr=function(n){var r=n.b,t=n.c,e=n.d;return"rgba("+g(ct(255*n.a))+(","+g(ct(255*r))+","+g(ct(255*t))+","+X(e))+")"},Ta=function(n){return V(" ",In(wn,u([n.fh?v("inset"):w,v(X(n.fU.a)+"px"),v(X(n.fU.b)+"px"),v(X(n.eN)+"px"),v(X(n.gi)+"px"),v(Yr(n.t))])))},Eu=function(n,r){return{a:r.a,b:n(r.b)}},Ru=function(n){return u([yu(h(f.e3)+":focus-within",In(wn,u([Cn(function(r){return U("border-color",Yr(r))},n.hd),Cn(function(r){return U("background-color",Yr(r))},n.g4),Cn(function(r){return U("box-shadow",Ta(new tt(r.eN,r.t,!1,Eu(Xt,fa(Xt,r.fU)),r.gi)))},n.i5),v(U("outline","none"))]))),yu(h(f.gZ)+":focus .focusable, "+h(f.gZ)+".focusable:focus, .ui-slide-bar:focus + "+h(f.gZ)+" .focusable-thumb",In(wn,u([Cn(function(r){return U("border-color",Yr(r))},n.hd),Cn(function(r){return U("background-color",Yr(r))},n.g4),Cn(function(r){return U("box-shadow",Ta(new tt(r.eN,r.t,!1,Eu(Xt,fa(Xt,r.fU)),r.gi)))},n.i5),v(U("outline","none"))])))])},br=function(n){return hr(_r,_$(n))},Cu=function(n,r){return{$:"a2",n:Go(n),o:Xo(r)}},nr=function(n,r){return{$:1,a:n,b:r}},Qr=function(n,r){return{$:4,a:n,b:r}},R=function(n,r){return{$:0,a:n,b:r}},Tu=u([0,1,2,3,4,5]),Ol=function(n){switch(n){case 0:return h(f.hx);case 1:return h(f.c2);case 2:return h(f.c4);case 3:return h(f.b5);case 4:return h(f.c3);default:return h(f.aW)}},de=function(n){switch(n){case 0:return h(f.gW);case 1:return h(f.gP);case 2:return h(f.eL);case 3:return h(f.eK);case 4:return h(f.gQ);default:return h(f.gR)}},x=function(n){return{$:6,a:zn(function(r){var e=n(r),t=e.a,e=e.b;return u([{$:4,a:Ol(r),b:t},{$:1,a:h(f.gZ),b:u([{$:4,a:de(r),b:e}])}])},Tu)}},I=u([{$:0,a:"display",b:"flex"},{$:0,a:"flex-direction",b:"column"},{$:0,a:"white-space",b:"pre"},{$:4,a:h(f.dR),b:u([{$:0,a:"z-index",b:"0"},{$:1,a:h(f.g9),b:u([{$:0,a:"z-index",b:"-1"}])}])},{$:4,a:h(f.i2),b:u([{$:1,a:h(f.ex),b:u([{$:4,a:h(f.dT),b:u([{$:0,a:"flex-grow",b:"0"}])},{$:4,a:h(f.eD),b:u([{$:0,a:"align-self",b:"auto !important"}])}])}])},{$:1,a:h(f.dS),b:u([{$:0,a:"height",b:"auto"}])},{$:1,a:h(f.dT),b:u([{$:0,a:"flex-grow",b:"100000"}])},{$:1,a:h(f.eD),b:u([{$:0,a:"width",b:"100%"}])},{$:1,a:h(f.gH),b:u([{$:0,a:"width",b:"100%"}])},{$:1,a:h(f.eC),b:u([{$:0,a:"align-self",b:"flex-start"}])},x(function(n){switch(n){case 0:return{a:u([{$:0,a:"justify-content",b:"flex-start"}]),b:u([{$:0,a:"margin-bottom",b:"auto !important"},{$:0,a:"margin-top",b:"0 !important"}])};case 1:return{a:u([{$:0,a:"justify-content",b:"flex-end"}]),b:u([{$:0,a:"margin-top",b:"auto !important"},{$:0,a:"margin-bottom",b:"0 !important"}])};case 2:return{a:u([{$:0,a:"align-items",b:"flex-end"}]),b:u([{$:0,a:"align-self",b:"flex-end"}])};case 3:return{a:u([{$:0,a:"align-items",b:"flex-start"}]),b:u([{$:0,a:"align-self",b:"flex-start"}])};case 4:return{a:u([{$:0,a:"align-items",b:"center"}]),b:u([{$:0,a:"align-self",b:"center"}])};default:return{a:u([{$:1,a:h(f.gZ),b:u([{$:0,a:"margin-top",b:"auto"},{$:0,a:"margin-bottom",b:"auto"}])}]),b:u([{$:0,a:"margin-top",b:"auto !important"},{$:0,a:"margin-bottom",b:"auto !important"}])}}})]),Sr=u([0,1,2,3,4,5]),Gr=u([{$:0,a:"html,body",b:u([{$:0,a:"height",b:"100%"},{$:0,a:"padding",b:"0"},{$:0,a:"margin",b:"0"}])},{$:0,a:E(h(f.gZ),E(h(f.i7),h(f.h3))),b:u([{$:0,a:"display",b:"block"},{$:4,a:h(f.dT),b:u([{$:1,a:"img",b:u([{$:0,a:"max-height",b:"100%"},{$:0,a:"object-fit",b:"cover"}])}])},{$:4,a:h(f.eD),b:u([{$:1,a:"img",b:u([{$:0,a:"max-width",b:"100%"},{$:0,a:"object-fit",b:"cover"}])}])}])},{$:0,a:h(f.gZ)+":focus",b:u([{$:0,a:"outline",b:"none"}])},{$:0,a:h(f.iY),b:u([{$:0,a:"width",b:"100%"},{$:0,a:"height",b:"auto"},{$:0,a:"min-height",b:"100%"},{$:0,a:"z-index",b:"0"},{$:4,a:E(h(f.gZ),h(f.dT)),b:u([{$:0,a:"height",b:"100%"},{$:1,a:h(f.dT),b:u([{$:0,a:"height",b:"100%"}])}])},{$:1,a:h(f.h5),b:u([{$:4,a:h(f.bK),b:u([{$:0,a:"position",b:"fixed"},{$:0,a:"z-index",b:"20"}])}])}])},{$:0,a:h(f.bK),b:u([{$:0,a:"position",b:"relative"},{$:0,a:"border",b:"none"},{$:0,a:"display",b:"flex"},{$:0,a:"flex-direction",b:"row"},{$:0,a:"flex-basis",b:"auto"},{$:4,a:h(f.i7),b:I},{$:6,a:D(function(n){switch(n){case 0:return Qr(h(f.gM),u([R("position","absolute"),R("bottom","100%"),R("left","0"),R("width","100%"),R("z-index","20"),R("margin","0 !important"),nr(h(f.dT),u([R("height","auto")])),nr(h(f.eD),u([R("width","100%")])),R("pointer-events","none"),nr("*",u([R("pointer-events","auto")]))]));case 1:return Qr(h(f.ha),u([R("position","absolute"),R("bottom","0"),R("left","0"),R("height","0"),R("width","100%"),R("z-index","20"),R("margin","0 !important"),R("pointer-events","none"),nr("*",u([R("pointer-events","auto")])),nr(h(f.dT),u([R("height","auto")]))]));case 2:return Qr(h(f.iL),u([R("position","absolute"),R("left","100%"),R("top","0"),R("height","100%"),R("margin","0 !important"),R("z-index","20"),R("pointer-events","none"),nr("*",u([R("pointer-events","auto")]))]));case 3:return Qr(h(f.iJ),u([R("position","absolute"),R("right","100%"),R("top","0"),R("height","100%"),R("margin","0 !important"),R("z-index","20"),R("pointer-events","none"),nr("*",u([R("pointer-events","auto")]))]));case 4:return Qr(h(f.h5),u([R("position","absolute"),R("width","100%"),R("height","100%"),R("left","0"),R("top","0"),R("margin","0 !important"),R("pointer-events","none"),nr("*",u([R("pointer-events","auto")]))]));default:return Qr(h(f.g9),u([R("position","absolute"),R("width","100%"),R("height","100%"),R("left","0"),R("top","0"),R("margin","0 !important"),R("z-index","0"),R("pointer-events","none"),nr("*",u([R("pointer-events","auto")]))]))}},Sr)}])},{$:0,a:h(f.gZ),b:u([{$:0,a:"position",b:"relative"},{$:0,a:"border",b:"none"},{$:0,a:"flex-shrink",b:"0"},{$:0,a:"display",b:"flex"},{$:0,a:"flex-direction",b:"row"},{$:0,a:"flex-basis",b:"auto"},{$:0,a:"resize",b:"none"},{$:0,a:"font-feature-settings",b:"inherit"},{$:0,a:"box-sizing",b:"border-box"},{$:0,a:"margin",b:"0"},{$:0,a:"padding",b:"0"},{$:0,a:"border-width",b:"0"},{$:0,a:"border-style",b:"solid"},{$:0,a:"font-size",b:"inherit"},{$:0,a:"color",b:"inherit"},{$:0,a:"font-family",b:"inherit"},{$:0,a:"line-height",b:"1"},{$:0,a:"font-weight",b:"inherit"},{$:0,a:"text-decoration",b:"none"},{$:0,a:"font-style",b:"inherit"},{$:4,a:h(f.eF),b:u([{$:0,a:"flex-wrap",b:"wrap"}])},{$:4,a:h(f.fR),b:u([{$:0,a:"-moz-user-select",b:"none"},{$:0,a:"-webkit-user-select",b:"none"},{$:0,a:"-ms-user-select",b:"none"},{$:0,a:"user-select",b:"none"}])},{$:4,a:h(f.hA),b:u([{$:0,a:"cursor",b:"pointer"}])},{$:4,a:h(f.hB),b:u([{$:0,a:"cursor",b:"text"}])},{$:4,a:h(f.iP),b:u([{$:0,a:"pointer-events",b:"none !important"}])},{$:4,a:h(f.cZ),b:u([{$:0,a:"pointer-events",b:"auto !important"}])},{$:4,a:h(f.bv),b:u([{$:0,a:"opacity",b:"0"}])},{$:4,a:h(f.bk),b:u([{$:0,a:"opacity",b:"1"}])},{$:4,a:h(E(f.h1,f.bv))+":hover",b:u([{$:0,a:"opacity",b:"0"}])},{$:4,a:h(E(f.h1,f.bk))+":hover",b:u([{$:0,a:"opacity",b:"1"}])},{$:4,a:h(E(f.hU,f.bv))+":focus",b:u([{$:0,a:"opacity",b:"0"}])},{$:4,a:h(E(f.hU,f.bk))+":focus",b:u([{$:0,a:"opacity",b:"1"}])},{$:4,a:h(E(f.dC,f.bv))+":active",b:u([{$:0,a:"opacity",b:"0"}])},{$:4,a:h(E(f.dC,f.bk))+":active",b:u([{$:0,a:"opacity",b:"1"}])},{$:4,a:h(f.gt),b:u([{$:0,a:"transition",b:V(", ",D(function(n){return n+" 160ms"},u(["transform","opacity","filter","background-color","color","font-size"])))}])},{$:4,a:h(f.i$),b:u([{$:0,a:"overflow",b:"auto"},{$:0,a:"flex-shrink",b:"1"}])},{$:4,a:h(f.i0),b:u([{$:0,a:"overflow-x",b:"auto"},{$:4,a:h(f.c),b:u([{$:0,a:"flex-shrink",b:"1"}])}])},{$:4,a:h(f.i1),b:u([{$:0,a:"overflow-y",b:"auto"},{$:4,a:h(f.d),b:u([{$:0,a:"flex-shrink",b:"1"}])},{$:4,a:h(f.i7),b:u([{$:0,a:"flex-shrink",b:"1"}])}])},{$:4,a:h(f.ht),b:u([{$:0,a:"overflow",b:"hidden"}])},{$:4,a:h(f.hu),b:u([{$:0,a:"overflow-x",b:"hidden"}])},{$:4,a:h(f.hv),b:u([{$:0,a:"overflow-y",b:"hidden"}])},{$:4,a:h(f.eC),b:u([{$:0,a:"width",b:"auto"}])},{$:4,a:h(f.cX),b:u([{$:0,a:"border-width",b:"0"}])},{$:4,a:h(f.he),b:u([{$:0,a:"border-style",b:"dashed"}])},{$:4,a:h(f.hf),b:u([{$:0,a:"border-style",b:"dotted"}])},{$:4,a:h(f.hg),b:u([{$:0,a:"border-style",b:"solid"}])},{$:4,a:h(f.ex),b:u([{$:0,a:"white-space",b:"pre"},{$:0,a:"display",b:"inline-block"}])},{$:4,a:h(f.ib),b:u([{$:0,a:"line-height",b:"1.05"},{$:0,a:"background",b:"transparent"},{$:0,a:"text-align",b:"inherit"}])},{$:4,a:h(f.i7),b:I},{$:4,a:h(f.c),b:u([{$:0,a:"display",b:"flex"},{$:0,a:"flex-direction",b:"row"},{$:1,a:h(f.gZ),b:u([{$:0,a:"flex-basis",b:"0%"},{$:4,a:h(f.gG),b:u([{$:0,a:"flex-basis",b:"auto"}])},{$:4,a:h(f.fp),b:u([{$:0,a:"flex-basis",b:"auto"}])}])},{$:1,a:h(f.dT),b:u([{$:0,a:"align-self",b:"stretch !important"}])},{$:1,a:h(f.fb),b:u([{$:0,a:"align-self",b:"stretch !important"}])},{$:1,a:h(f.eD),b:u([{$:0,a:"flex-grow",b:"100000"}])},{$:1,a:h(f.c0),b:u([{$:0,a:"flex-grow",b:"0"},{$:0,a:"flex-basis",b:"auto"},{$:0,a:"align-self",b:"stretch"}])},{$:1,a:"u:first-of-type."+f.gV,b:u([{$:0,a:"flex-grow",b:"1"}])},{$:1,a:"s:first-of-type."+f.gT,b:u([{$:0,a:"flex-grow",b:"1"},{$:1,a:h(f.gQ),b:u([{$:0,a:"margin-left",b:"auto !important"}])}])},{$:1,a:"s:last-of-type."+f.gT,b:u([{$:0,a:"flex-grow",b:"1"},{$:1,a:h(f.gQ),b:u([{$:0,a:"margin-right",b:"auto !important"}])}])},{$:1,a:"s:only-of-type."+f.gT,b:u([{$:0,a:"flex-grow",b:"1"},{$:1,a:h(f.gR),b:u([{$:0,a:"margin-top",b:"auto !important"},{$:0,a:"margin-bottom",b:"auto !important"}])}])},{$:1,a:"s:last-of-type."+f.gT+" ~ u",b:u([{$:0,a:"flex-grow",b:"0"}])},{$:1,a:"u:first-of-type."+f.gV+" ~ s."+f.gT,b:u([{$:0,a:"flex-grow",b:"0"}])},x(function(n){switch(n){case 0:return{a:u([{$:0,a:"align-items",b:"flex-start"}]),b:u([{$:0,a:"align-self",b:"flex-start"}])};case 1:return{a:u([{$:0,a:"align-items",b:"flex-end"}]),b:u([{$:0,a:"align-self",b:"flex-end"}])};case 2:return{a:u([{$:0,a:"justify-content",b:"flex-end"}]),b:d};case 3:return{a:u([{$:0,a:"justify-content",b:"flex-start"}]),b:d};case 4:return{a:u([{$:0,a:"justify-content",b:"center"}]),b:d};default:return{a:u([{$:0,a:"align-items",b:"center"}]),b:u([{$:0,a:"align-self",b:"center"}])}}}),{$:4,a:h(f.ja),b:u([{$:0,a:"justify-content",b:"space-between"}])},{$:4,a:h(f.de),b:u([{$:0,a:"align-items",b:"baseline"}])}])},{$:4,a:h(f.d),b:u([{$:0,a:"display",b:"flex"},{$:0,a:"flex-direction",b:"column"},{$:1,a:h(f.gZ),b:u([{$:0,a:"flex-basis",b:"0px"},{$:0,a:"min-height",b:"min-content"},{$:4,a:h(f.fa),b:u([{$:0,a:"flex-basis",b:"auto"}])}])},{$:1,a:h(f.dT),b:u([{$:0,a:"flex-grow",b:"100000"}])},{$:1,a:h(f.eD),b:u([{$:0,a:"width",b:"100%"}])},{$:1,a:h(f.gH),b:u([{$:0,a:"width",b:"100%"}])},{$:1,a:h(f.eC),b:u([{$:0,a:"align-self",b:"flex-start"}])},{$:1,a:"u:first-of-type."+f.gS,b:u([{$:0,a:"flex-grow",b:"1"}])},{$:1,a:"s:first-of-type."+f.gU,b:u([{$:0,a:"flex-grow",b:"1"},{$:1,a:h(f.gR),b:u([{$:0,a:"margin-top",b:"auto !important"},{$:0,a:"margin-bottom",b:"0 !important"}])}])},{$:1,a:"s:last-of-type."+f.gU,b:u([{$:0,a:"flex-grow",b:"1"},{$:1,a:h(f.gR),b:u([{$:0,a:"margin-bottom",b:"auto !important"},{$:0,a:"margin-top",b:"0 !important"}])}])},{$:1,a:"s:only-of-type."+f.gU,b:u([{$:0,a:"flex-grow",b:"1"},{$:1,a:h(f.gR),b:u([{$:0,a:"margin-top",b:"auto !important"},{$:0,a:"margin-bottom",b:"auto !important"}])}])},{$:1,a:"s:last-of-type."+f.gU+" ~ u",b:u([{$:0,a:"flex-grow",b:"0"}])},{$:1,a:"u:first-of-type."+f.gS+" ~ s."+f.gU,b:u([{$:0,a:"flex-grow",b:"0"}])},x(function(n){switch(n){case 0:return{a:u([{$:0,a:"justify-content",b:"flex-start"}]),b:u([{$:0,a:"margin-bottom",b:"auto"}])};case 1:return{a:u([{$:0,a:"justify-content",b:"flex-end"}]),b:u([{$:0,a:"margin-top",b:"auto"}])};case 2:return{a:u([{$:0,a:"align-items",b:"flex-end"}]),b:u([{$:0,a:"align-self",b:"flex-end"}])};case 3:return{a:u([{$:0,a:"align-items",b:"flex-start"}]),b:u([{$:0,a:"align-self",b:"flex-start"}])};case 4:return{a:u([{$:0,a:"align-items",b:"center"}]),b:u([{$:0,a:"align-self",b:"center"}])};default:return{a:u([{$:0,a:"justify-content",b:"center"}]),b:d}}}),{$:1,a:h(f.c0),b:u([{$:0,a:"flex-grow",b:"0"},{$:0,a:"flex-basis",b:"auto"},{$:0,a:"width",b:"100%"},{$:0,a:"align-self",b:"stretch !important"}])},{$:4,a:h(f.ja),b:u([{$:0,a:"justify-content",b:"space-between"}])}])},{$:4,a:h(f.hZ),b:u([{$:0,a:"display",b:"-ms-grid"},{$:1,a:".gp",b:u([{$:1,a:h(f.gZ),b:u([{$:0,a:"width",b:"100%"}])}])},{$:3,a:{a:"display",b:"grid"},b:u([{a:"display",b:"grid"}])},(ki=function(n){switch(n){case 0:return u([{$:0,a:"justify-content",b:"flex-start"}]);case 1:return u([{$:0,a:"justify-content",b:"flex-end"}]);case 2:return u([{$:0,a:"align-items",b:"flex-end"}]);case 3:return u([{$:0,a:"align-items",b:"flex-start"}]);case 4:return u([{$:0,a:"align-items",b:"center"}]);default:return u([{$:0,a:"justify-content",b:"center"}])}},{$:6,a:zn(function(n){return u([{$:1,a:h(f.gZ),b:u([{$:4,a:de(n),b:ki(n)}])}])},Tu)})])},{$:4,a:h(f.fW),b:u([{$:0,a:"display",b:"block"},{$:1,a:h(f.gZ+":first-child"),b:u([{$:0,a:"margin",b:"0 !important"}])},{$:1,a:h(f.gZ+(de(3)+":first-child + .")+f.gZ),b:u([{$:0,a:"margin",b:"0 !important"}])},{$:1,a:h(f.gZ+(de(2)+":first-child + .")+f.gZ),b:u([{$:0,a:"margin",b:"0 !important"}])},x(function(n){switch(n){case 0:case 1:return{a:d,b:d};case 2:return{a:d,b:u([{$:0,a:"float",b:"right"},{$:4,a:"::after",b:u([{$:0,a:"content",b:'""'},{$:0,a:"display",b:"table"},{$:0,a:"clear",b:"both"}])}])};case 3:return{a:d,b:u([{$:0,a:"float",b:"left"},{$:4,a:"::after",b:u([{$:0,a:"content",b:'""'},{$:0,a:"display",b:"table"},{$:0,a:"clear",b:"both"}])}])};default:return{a:d,b:d}}})])},{$:4,a:h(f.h7),b:u([{$:0,a:"white-space",b:"pre-wrap !important"},{$:0,a:"height",b:"100%"},{$:0,a:"width",b:"100%"},{$:0,a:"background-color",b:"transparent"}])},{$:4,a:h(f.ia),b:u([{$:4,a:h(f.i7),b:u([{$:0,a:"flex-basis",b:"auto"}])}])},{$:4,a:h(f.h9),b:u([{$:0,a:"white-space",b:"pre-wrap !important"},{$:0,a:"cursor",b:"text"},{$:1,a:h(f.h8),b:u([{$:0,a:"white-space",b:"pre-wrap !important"},{$:0,a:"color",b:"transparent"}])}])},{$:4,a:h(f.fX),b:u([{$:0,a:"display",b:"block"},{$:0,a:"white-space",b:"normal"},{$:0,a:"overflow-wrap",b:"break-word"},{$:4,a:h(f.dR),b:u([{$:0,a:"z-index",b:"0"},{$:1,a:h(f.g9),b:u([{$:0,a:"z-index",b:"-1"}])}])},{$:2,a:h(f.ex),b:u([{$:0,a:"display",b:"inline"},{$:0,a:"white-space",b:"normal"}])},{$:2,a:h(f.fX),b:u([{$:0,a:"display",b:"inline"},{$:4,a:"::after",b:u([{$:0,a:"content",b:"none"}])},{$:4,a:"::before",b:u([{$:0,a:"content",b:"none"}])}])},{$:2,a:h(f.i7),b:u([{$:0,a:"display",b:"inline"},{$:0,a:"white-space",b:"normal"},{$:4,a:h(f.gG),b:u([{$:0,a:"display",b:"inline-block"}])},{$:4,a:h(f.h5),b:u([{$:0,a:"display",b:"flex"}])},{$:4,a:h(f.g9),b:u([{$:0,a:"display",b:"flex"}])},{$:4,a:h(f.gM),b:u([{$:0,a:"display",b:"flex"}])},{$:4,a:h(f.ha),b:u([{$:0,a:"display",b:"flex"}])},{$:4,a:h(f.iL),b:u([{$:0,a:"display",b:"flex"}])},{$:4,a:h(f.iJ),b:u([{$:0,a:"display",b:"flex"}])},{$:1,a:h(f.ex),b:u([{$:0,a:"display",b:"inline"},{$:0,a:"white-space",b:"normal"}])}])},{$:1,a:h(f.c),b:u([{$:0,a:"display",b:"inline"}])},{$:1,a:h(f.d),b:u([{$:0,a:"display",b:"inline-flex"}])},{$:1,a:h(f.hZ),b:u([{$:0,a:"display",b:"inline-grid"}])},x(function(n){switch(n){case 0:case 1:return{a:d,b:d};case 2:return{a:d,b:u([{$:0,a:"float",b:"right"}])};case 3:return{a:d,b:u([{$:0,a:"float",b:"left"}])};default:return{a:d,b:d}}})])},{$:4,a:".hidden",b:u([{$:0,a:"display",b:"none"}])},{$:4,a:h(f.jy),b:u([{$:0,a:"font-weight",b:"100"}])},{$:4,a:h(f.jp),b:u([{$:0,a:"font-weight",b:"200"}])},{$:4,a:h(f.jt),b:u([{$:0,a:"font-weight",b:"300"}])},{$:4,a:h(f.jv),b:u([{$:0,a:"font-weight",b:"400"}])},{$:4,a:h(f.ju),b:u([{$:0,a:"font-weight",b:"500"}])},{$:4,a:h(f.jx),b:u([{$:0,a:"font-weight",b:"600"}])},{$:4,a:h(f.hc),b:u([{$:0,a:"font-weight",b:"700"}])},{$:4,a:h(f.jo),b:u([{$:0,a:"font-weight",b:"800"}])},{$:4,a:h(f.jq),b:u([{$:0,a:"font-weight",b:"900"}])},{$:4,a:h(f.id),b:u([{$:0,a:"font-style",b:"italic"}])},{$:4,a:h(f.jj),b:u([{$:0,a:"text-decoration",b:"line-through"}])},{$:4,a:h(f.jN),b:u([{$:0,a:"text-decoration",b:"underline"},{$:0,a:"text-decoration-skip-ink",b:"auto"},{$:0,a:"text-decoration-skip",b:"ink"}])},{$:4,a:E(h(f.jN),h(f.jj)),b:u([{$:0,a:"text-decoration",b:"line-through underline"},{$:0,a:"text-decoration-skip-ink",b:"auto"},{$:0,a:"text-decoration-skip",b:"ink"}])},{$:4,a:h(f.jz),b:u([{$:0,a:"font-style",b:"normal"}])},{$:4,a:h(f.jr),b:u([{$:0,a:"text-align",b:"justify"}])},{$:4,a:h(f.dw),b:u([{$:0,a:"text-align",b:"justify-all"}])},{$:4,a:h(f.jn),b:u([{$:0,a:"text-align",b:"center"}])},{$:4,a:h(f.jw),b:u([{$:0,a:"text-align",b:"right"}])},{$:4,a:h(f.js),b:u([{$:0,a:"text-align",b:"left"}])},{$:4,a:".modal",b:u([{$:0,a:"position",b:"fixed"},{$:0,a:"left",b:"0"},{$:0,a:"top",b:"0"},{$:0,a:"width",b:"100%"},{$:0,a:"height",b:"100%"},{$:0,a:"pointer-events",b:"none"}])}])}]),_n=function(n){return u([{$:0,a:".v-"+n,b:u([{$:0,a:"font-feature-settings",b:'"'+n+'"'}])},{$:0,a:".v-"+n+"-off",b:u([{$:0,a:"font-feature-settings",b:'"'+n+'" 0'}])}])},qr=Nt(u([D(function(n){return{$:0,a:".border-"+g(n),b:u([{$:0,a:"border-width",b:g(n)+"px"}])}},pn(0,6)),D(function(n){return{$:0,a:".font-size-"+g(n),b:u([{$:0,a:"font-size",b:g(n)+"px"}])}},pn(8,32)),D(function(n){return{$:0,a:".p-"+g(n),b:u([{$:0,a:"padding",b:g(n)+"px"}])}},pn(0,24)),u([{$:0,a:".v-smcp",b:u([{$:0,a:"font-variant",b:"small-caps"}])},{$:0,a:".v-smcp-off",b:u([{$:0,a:"font-variant",b:"normal"}])}]),_n("zero"),_n("onum"),_n("liga"),_n("dlig"),_n("ordn"),_n("tnum"),_n("afrc"),_n("frac")])),Xr="\n.explain {\n    border: 6px solid rgb(174, 121, 15) !important;\n}\n.explain > ."+f.gZ+" {\n    border: 4px dashed rgb(0, 151, 167) !important;\n}\n\n.ctr {\n    border: none !important;\n}\n.explain > .ctr > ."+f.gZ+" {\n    border: 4px dashed rgb(0, 151, 167) !important;\n}\n\n",Mr="@media screen and (-ms-high-contrast: active), (-ms-high-contrast: none) {"+h(f.gZ)+(h(f.c)+(" > "+h(f.gZ)+(" { flex-basis: auto !important; } "+h(f.gZ)+(h(f.c)+(" > "+h(f.gZ)+(h(f.c0)+" { flex-basis: auto !important; }}"))))))+'\ninput[type="search"],\ninput[type="search"]::-webkit-search-decoration,\ninput[type="search"]::-webkit-search-cancel-button,\ninput[type="search"]::-webkit-search-results-button,\ninput[type="search"]::-webkit-search-results-decoration {\n  -webkit-appearance:none;\n}\n\ninput[type=range] {\n  -webkit-appearance: none; \n  background: transparent;\n  position:absolute;\n  left:0;\n  top:0;\n  z-index:10;\n  width: 100%;\n  outline: dashed 1px;\n  height: 100%;\n  opacity: 0;\n}\n\ninput[type=range]::-moz-range-track {\n    background: transparent;\n    cursor: pointer;\n}\ninput[type=range]::-ms-track {\n    background: transparent;\n    cursor: pointer;\n}\ninput[type=range]::-webkit-slider-runnable-track {\n    background: transparent;\n    cursor: pointer;\n}\n\ninput[type=range]::-webkit-slider-thumb {\n    -webkit-appearance: none;\n    opacity: 0.5;\n    width: 80px;\n    height: 80px;\n    background-color: black;\n    border:none;\n    border-radius: 5px;\n}\ninput[type=range]::-moz-range-thumb {\n    opacity: 0.5;\n    width: 80px;\n    height: 80px;\n    background-color: black;\n    border:none;\n    border-radius: 5px;\n}\ninput[type=range]::-ms-thumb {\n    opacity: 0.5;\n    width: 80px;\n    height: 80px;\n    background-color: black;\n    border:none;\n    border-radius: 5px;\n}\ninput[type=range][orient=vertical]{\n    writing-mode: bt-lr; /* IE */\n    -webkit-appearance: slider-vertical;  /* WebKit */\n}\n'+Xr,Kr=function(n,r){return new Vt(r,d,d,n)},xr=function(n,r){var t=n;return dr(y(function(e,a){switch(e.$){case 0:var $=e.a,i=e.b;return(l=a.$c()).a2={$:1,a:{a:$,b:i},b:a.a2},l;case 3:return $=e.a,Ar(a,{$:1,a:new Vt("\n}",d,e.b,"@supports ("+$.a+":"+$.b+") {"+t.aD),b:a.I});case 5:return i=e.b,Ar(a,{$:1,a:xr(Kr(t.aD+" + "+e.a,""),i),b:a.I});case 1:var o=e.a,c=e.b;return Ar(a,{$:1,a:xr(Kr(t.aD+" > "+o,""),c),b:a.I});case 2:return o=e.a,c=e.b,Ar(a,{$:1,a:xr(Kr(t.aD+" "+o,""),c),b:a.I});case 4:return l=e.b,Ar(a,{$:1,a:xr(Kr(E(t.aD,e.a),""),l),b:a.I});default:return o=e.a,Ar(a,{$:1,a:xr(Kr(t.aD,""),o),b:a.I})}var l}),t,r)},Ju=E(Mr,(hn=E(Gr,qr),Pi=function(n){return Fr(D(function(r){return r.a+":"+r.b+";"},n))},Ui=function(n){return n.a2.b?n.aD+("{"+Pi(n.a2))+(n.c_+"}"):""},Fr(D(Li=function(n){return E(Ui(n),Fr(D(Li,n.I)))},dr(y(function(n,r){var t=n.b;return{$:1,a:xr(Kr(n.a,""),t),b:r}}),d,hn))))),Dt=Zo,Bu=function(n){switch(n.fM){case 0:return $n(br,"div",d,u([$n(br,"style",d,u([Dt(Ju)]))]));case 1:return Dt("");default:return $n(br,"elm-ui-static-rules",u([Cu("rules",Wn(Ju))]),d)}},se=function(n,r){for(;;){if(!r.b)return!1;var t=r.b;if(n(r.a))return!0;n=n,r=t}},Wl=function(n){switch(n.$){case 0:return"serif";case 1:return"sans-serif";case 2:return"monospace";case 3:return'"'+(r=n.a)+'"';case 4:var r=n.a;return'"'+r+'"';default:return'"'+(r=n.a.iy)+'"'}},Yl=function(n){switch(n.$){case 0:return n.a==="smcp";case 1:return!1;default:return n.a==="smcp"&&n.b===1}},Ql=function(n){return n.$===5&&se(Yl,n.a.gz)},yt=K(function(n,a,t){var e=a.a,a=a.b;return n?t+"\n  "+e+": "+a+" !important;":t+"\n  "+e+": "+a+";"}),tn=function(n,r,t,e){if(r.$===1)return u([t+("{"+mn(yt(!1),"",e))+"\n}"]);switch(r.a){case 1:switch(n.h1){case 0:return d;case 2:return u([t+("-hv {"+mn(yt(!0),"",e))+"\n}"]);default:return u([t+("-hv:hover {"+mn(yt(!1),"",e))+"\n}"])}case 0:var a=mn(yt(!1),"",e);return u([t+"-fs:focus {"+a+"\n}","."+f.gZ+":focus "+t+"-fs  {"+a+"\n}",t+"-fs:focus-within {"+a+"\n}",".ui-slide-bar:focus + "+h(f.gZ)+" .focusable-thumb"+t+"-fs {"+a+"\n}"]);default:return u([t+("-act:active {"+mn(yt(!1),"",e))+"\n}"])}},Gl=function(n){switch(n.$){case 0:return'"'+n.a+'"';case 1:return'"'+n.a+'" 0';default:return'"'+n.a+('" '+g(n.b))}},ql=function(n){return n.$===5?v(V(", ",D(Gl,n.a.gz))):w},Xl=function(n){switch(n.$){case 0:return w;case 1:var c=n.a,l=c.b,_=c.c;return v("translate3d("+X(c.a)+("px, "+X(l)+("px, "+X(_)))+"px)");default:var c=n.a,l=c.b,_=c.c,e=n.b,r=e.a,t=e.b,e=e.c,i=n.c,a=i.a,$=i.b,i=i.c,o=n.d,c="translate3d("+X(c.a)+("px, "+X(l)+("px, "+X(_)))+"px)",l="scale3d("+X(r)+(", "+X(t)+(", "+X(e)))+")",_="rotate3d("+X(a)+(", "+X($)+(", "+X(i)+(", "+X(o))))+"rad)";return v(c+" "+l+" "+_)}},Ja=function(n,r,t){switch(r.$){case 0:return tn(n,t,r.a,r.b);case 13:return tn(n,t,"."+(e=r.a),u([U("box-shadow",r.b)]));case 12:var e=r.a,m=ra(0,$u(1,1-r.b));return tn(n,t,"."+e,u([U("opacity",X(m))]));case 2:return m=r.a,tn(n,t,".font-size-"+g(m),u([U("font-size",g(m)+"px")]));case 1:var e=r.a,m=r.b,M=V(", ",In(ql,m)),M=u([U("font-family",V(", ",D(Wl,m))),U("font-feature-settings",M),U("font-variant",se(Ql,m)?"small-caps":"normal")]);return tn(n,t,"."+e,M);case 3:return tn(n,t,"."+($=r.a),u([U(r.b,on=r.c)]));case 4:return tn(n,t,"."+($=r.a),u([U(r.b,Yr(r.c))]));case 5:var i=r.a,m=r.b,e=r.c,M=g(e)+"px",P=g(m)+"px",l="."+f.c,s="."+f.eF+l,G="."+f.eL,a="."+f.fX,Y="."+f.fW,c="."+f.eK,p=X(e/2)+"px",m=X(m/2)+"px",S="."+f.d,$="."+i,q="."+f.gZ;return Nt(u([tn(n,t,$+l+" > "+q+" + "+q,u([U("margin-left",P)])),tn(n,t,$+s+" > "+q,u([U("margin",p+" "+m)])),tn(n,t,$+S+" > "+q+" + "+q,u([U("margin-top",M)])),tn(n,t,$+Y+" > "+q+" + "+q,u([U("margin-top",M)])),tn(n,t,$+Y+" > "+c,u([U("margin-right",P)])),tn(n,t,$+Y+" > "+G,u([U("margin-left",P)])),tn(n,t,E($,a),u([U("line-height","calc(1em + "+g(e)+"px)")])),tn(n,t,"textarea"+q+$,u([U("line-height","calc(1em + "+g(e)+"px)"),U("height","calc(100% + "+g(e)+"px)")])),tn(n,t,$+a+" > "+c,u([U("margin-right",P)])),tn(n,t,$+a+" > "+G,u([U("margin-left",P)])),tn(n,t,$+a+"::after",u([U("content","''"),U("display","block"),U("height","0"),U("width","0"),U("margin-top",g(-1*(e/2|0))+"px")])),tn(n,t,$+a+"::before",u([U("content","''"),U("display","block"),U("height","0"),U("width","0"),U("margin-bottom",g(-1*(e/2|0))+"px")]))]));case 7:var i=r.a,o=r.b,G=r.c,fn=r.d,c=r.e;return tn(n,t,$="."+i,u([U("padding",X(o)+("px "+X(G)+("px "+X(fn)+("px "+X(c))))+"px")]));case 6:return i=r.a,o=r.b,G=r.c,fn=r.d,c=r.e,tn(n,t,$="."+i,u([U("border-width",g(o)+("px "+g(G)+("px "+g(fn)+("px "+g(c))))+"px")]));case 8:var l=r.a,_=K(function(H,N,en){for(;;)switch(en.$){case 0:return g(en.a)+"px";case 1:var an={a:H,b:N};return an.a.$===1?an.b.$===1?(an.b,"max-content"):"minmax(max-content, "+g(cn=an.b.a)+"px)":an.b.$===1?"minmax("+g(an.a.a)+"px, max-content)":(cn=an.b.a,"minmax("+g(an.a.a)+("px, "+g(cn))+"px)");case 2:var cn,an=en.a,j={a:H,b:N};return j.a.$===1?j.b.$===1?g(an)+"fr":"minmax(max-content, "+g(cn=j.b.a)+"px)":j.b.$===1?"minmax("+g(j.a.a)+("px, "+g(an))+"frfr)":(cn=j.b.a,"minmax("+g(j.a.a)+("px, "+g(cn))+"px)");case 3:var A=en.a,C=en.b;H=v(A),N=N,en=C;continue;default:A=en.a,C=en.b,H=H,N=v(A),en=C;continue}}),s=function(H){return $n(_,w,w,H)},p=s(l.jb.b),m="grid-template-rows: "+V(" ",D(s,l.iZ))+";",S="-ms-grid-rows: "+V(p,D(s,l.aL))+";",M="-ms-grid-columns: "+V(p,D(s,l.aL))+";",Y="grid-row-gap:"+s(l.jb.b)+";",q="grid-column-gap:"+s(l.jb.a)+";",P="grid-template-columns: "+V(" ",D(s,l.aL))+";";return u([($=".grid-rows-"+V("-",D(Yn,l.iZ))+("-cols-"+V("-",D(Yn,l.aL))+("-space-x-"+Yn(l.jb.a)+("-space-y-"+Yn(l.jb.b)))))+"{"+M+S+"}","@supports (display:grid) {"+($+"{"+P+m+q+Y+"}")+"}"]);case 9:return a=r.a,e=V(" ",u(["-ms-grid-row: "+g(a.c)+";","-ms-grid-row-span: "+g(a.e9)+";","-ms-grid-column: "+g(a.hw)+";","-ms-grid-column-span: "+g(a.gF)+";"])),o=V(" ",u(["grid-row: "+g(a.c)+(" / "+g(a.c+a.e9))+";","grid-column: "+g(a.hw)+(" / "+g(a.hw+a.gF))+";"])),u([($=".grid-pos-"+g(a.c)+("-"+g(a.hw)+("-"+g(a.gF)+("-"+g(a.e9)))))+"{"+e+"}","@supports (display:grid) {"+($+"{"+o+"}")+"}"]);case 11:return $=r.a,zn(function(H){return Ja(n,H,v($))},r.b);default:var G=r.a,on=Xl(G),fn={a:$=Ca(G),b:on};return fn.a.$||fn.b.$?d:tn(n,t,"."+(i=fn.a.a),u([U("transform",fn.b.a)]))}},Kl=function(n,r){return Jn(D(function(t){var e=Ja(n,t,w);return{a:At(t),b:gr(Wn,e)}},r))},ge=function(n,r){return n+(" {"+V("",D(function(t){return t.a+": "+t.b+";"},r)))+"}"},Vu=function(n,r,t){var e=t.b;return u([ge("."+n+"."+r+", ."+n+" ."+r,t.a),ge("."+n+"."+r+"> ."+f.ex+", ."+n+" ."+r+" > ."+f.ex,e)])},xl=K(function(n,a,$){var e=a.a,a=a.b,$=T(n,$)?n:$+" ."+n;return V(" ",E(Vu($,f.i8,a),Vu($,f.hW,e)))}),Nl=y(function(n,r){return r=T(n,r)?n:r+" ."+n,V(" ",u([ge("."+r+"."+f.i8+", ."+r+" ."+f.i8,u([{a:"line-height",b:"1"}])),ge("."+r+"."+f.i8+"> ."+f.ex+", ."+r+" ."+f.i8+" > ."+f.ex,u([{a:"vertical-align",b:"0"},{a:"line-height",b:"1"}]))]))}),ku=function(n,r,t){return{e9:r/n,gi:n,gA:t}},Pu=function(n){return n.b?v(mn(iu,n.a,n.b)):w},Uu=function(n){var e=u([n.hm,n.g8,n.hF,n.il]),r=Zr(n.hF,Pu(e)),t=Zr(n.g8,Pu(ba(function(a){return!T(a,r)},e))),e=Zr(n.hm,(n=e).b?v(mn(L$,n.a,n.b)):w);return{hm:ku(1/(e-t),e-t,1-e),e4:ku(1/(e-r),e-r,1-e)}},Lu=function(n){return{a:u([{a:"display",b:"block"}]),b:u([{a:"display",b:"inline-block"},{a:"line-height",b:X(n.e9)},{a:"vertical-align",b:X(n.gA)+"em"},{a:"font-size",b:X(n.gi)+"em"}])}},nh=function(n){return Tn(function(r,t){return t.$!==1||r.$!==5||(r=r.a.gO).$===1?t:v({a:Lu(Uu(t=r.a).e4),b:Lu(Uu(t).hm)})},w,n)},rh=function(n){var r=function(e){return e.$===4?v("@import url('"+e.b+"');"):w},t=D(ta,n);return E(V("\n",D(function(e){return V("\n",In(r,e.b))},n)),V("\n",D(function($){var a=$.a,$=nh($.b);return V("",D($.$===1?Nl(a):b(xl,a,$.a),t))},n)))},th=function(n,t){var t=mn(y(function(a,$){return{dq:E($.dq,Ja(n,a,w)),cI:(a=(a=a).$===1?v({a:a.a,b:a.b}):w).$===1?$.cI:{$:1,a:a.a,b:$.cI}}}),{dq:d,cI:d},t),e=t.dq;return E(rh(t.cI),Fr(e))},zu=function(n,r){switch(n.fM){case 0:case 1:return $n(br,"div",d,u([$n(br,"style",d,u([Dt(th(n,r))]))]));default:return $n(br,"elm-ui-rules",u([Cu("rules",Kl(n,r))]),d)}},Fu=function(n,r,t,e){return t=zu(r,mn(Du,{a:Au,b:Ru(r.hU)},t).b),n?{$:1,a:{a:"static-stylesheet",b:Bu(r)},b:{$:1,a:{a:"dynamic-stylesheet",b:t},b:e}}:{$:1,a:{a:"dynamic-stylesheet",b:t},b:e}},Hu=function(n,r,t,e){return t=zu(r,mn(Du,{a:Au,b:Ru(r.hU)},t).b),n?{$:1,a:Bu(r),b:{$:1,a:t,b:e}}:{$:1,a:t,b:e}},Ba=O(45),Et=O(37),eh=function(n){return b$(l$,_$(n))},ah=hr(_r,"p"),yn=function(n,r){var t,e=r.a;return n.$?T((t=n.a)&r.b,t):T((r=n.a)&e,r)},Zu=hr(_r,"s").a2,Ou=hr(_r,"u").a2,Va=O(44),Rt=O(39),pe=so(function(n,r,t,e,a,$){var i=y(function(c,l){var _,s;return e.$===1?(_=e.a,$n(eh,c,l,function(){switch(a.$){case 0:return _;case 2:return Fu(!1,a.a,a.b,_);default:return Fu(!0,a.a,a.b,_)}}())):(s=e.a,b(function(){switch(c){case"div":return ju;case"p":return ah;default:return br(c)}}(),l,function(){switch(a.$){case 0:return s;case 2:return Hu(!1,a.a,a.b,s);default:return Hu(!0,a.a,a.b,s)}}()))}),o=function(){switch(r.$){case 0:return b(i,"div",t);case 1:return b(i,r.a,t);default:return $n(br,r.a,t,u([b(i,r.b,u([Bn(Vn,f.gZ+" "+f.i7)]))]))}}();switch($){case 0:return yn(Rt,n)&&!yn(Va,n)?o:yn(Mu,n)?Ou(u([Bn(Vn,V(" ",u([f.gZ,f.i7,f.c0,f.aW,f.gV])))]),u([o])):yn(Iu,n)?Zu(u([Bn(Vn,V(" ",u([f.gZ,f.i7,f.c0,f.aW,f.gT])))]),u([o])):o;case 1:return yn(Et,n)&&!yn(Ba,n)?o:yn(Su,n)?Zu(u([Bn(Vn,V(" ",u([f.gZ,f.i7,f.c0,f.gU])))]),u([o])):yn(wu,n)?Ou(u([Bn(Vn,V(" ",u([f.gZ,f.i7,f.c0,f.gS])))]),u([o])):o;default:return o}}),Wu=Dt,$h=f.gZ+" "+f.ex+" "+f.eC+" "+f.dS,Ct=function(n){return Ra(u([Bn(Vn,$h)]),u([Wu(n)]))},ih=f.gZ+" "+f.ex+" "+f.eD+" "+f.dT,Yu=function(n){return Ra(u([Bn(Vn,ih)]),u([Wu(n)]))},uh=function(n,r,t){var e,a,$,i,o=y(function(l,_){var s=l.a,p=l.b,m=_.a,S=_.b;switch(p.$){case 0:var M=p.a;return T(n,jt),{a:{$:1,a:{a:s,b:M(n)},b:m},b:S};case 1:return M=p.a,T(n,jt),{a:{$:1,a:{a:s,b:b(M.h2,St,n)},b:m},b:S.b?E(M.gm,S):M.gm};case 2:return M=p.a,{a:{$:1,a:{a:s,b:(T(n,Nn)?Yu:Ct)(M)},b:m},b:S};default:return{a:m,b:S}}}),c=y(function(l,_){var s=_.a,p=_.b;switch(l.$){case 0:var m=l.a;return T(n,jt),{a:{$:1,a:m(n),b:s},b:p};case 1:return m=l.a,T(n,jt),{a:{$:1,a:b(m.h2,St,n),b:s},b:p.b?E(m.gm,p):m.gm};case 2:return m=l.a,{a:{$:1,a:(T(n,Nn)?Yu:Ct)(m),b:s},b:p};default:return{a:s,b:p}}});return r.$===1?(e=(o=dr(o,{a:d,b:d},r.a)).a,($=(a=o.b).b?E(t.gm,a):t.gm).b?(i=$,{$:1,a:{h2:Dr(pe,t.bf,t.fS,t.a9,{$:1,a:vu("nearby-element-pls",e,t.hr)}),gm:i}}):{$:0,a:Ya(pe,t.bf,t.fS,t.a9,{$:1,a:vu("nearby-element-pls",e,t.hr)},St)}):(e=(o=dr(c,{a:d,b:d},r.a)).a,($=(a=o.b).b?E(t.gm,a):t.gm).b?(i=$,{$:1,a:{h2:Dr(pe,t.bf,t.fS,t.a9,{$:0,a:pu(e,t.hr)}),gm:i}}):{$:0,a:Ya(pe,t.bf,t.fS,t.a9,{$:0,a:pu(e,t.hr)},St)})},En=function(n,r,t){return{$:3,a:n,b:r,c:t}},F=function(n,e){var t=e.a,e=e.b;return n.$?{$:0,a:t,b:n.a|e}:{$:0,a:n.a|t,b:e}},oh=function(n,r){return Ra(u([Bn(Vn,function(){switch(n){case 0:return V(" ",u([f.bK,f.i7,f.gM]));case 1:return V(" ",u([f.bK,f.i7,f.ha]));case 2:return V(" ",u([f.bK,f.i7,f.iL]));case 3:return V(" ",u([f.bK,f.i7,f.iJ]));case 4:return V(" ",u([f.bK,f.i7,f.h5]));default:return V(" ",u([f.bK,f.i7,f.g9]))}}())]),u([function(){switch(r.$){case 3:return Dt("");case 2:return Ct(r.a);case 0:return(0,r.a)(Nn);default:return b(r.a.h2,St,Nn)}}()]))},fh=function(n,r,t){var e=oh(n,r);switch(t.$){case 0:return n===5?{$:1,a:u([e])}:{$:2,a:u([e])};case 1:var a=t.a;return n===5?{$:1,a:{$:1,a:e,b:a}}:{$:3,a:a,b:u([e])};case 2:var $=t.a;return n===5?{$:3,a:u([e]),b:$}:{$:2,a:{$:1,a:e,b:$}};default:return a=t.a,$=t.b,n===5?{$:3,a:{$:1,a:e,b:a},b:$}:{$:3,a:a,b:{$:1,a:e,b:$}}}},Ir=function(n,r){switch(r.$){case 0:return{$:1,a:n};case 1:return{$:2,a:r.a,b:n};default:return{$:2,a:r.a,b:r.b}}},ch=function(n){switch(n){case 0:return f.dD+" "+f.eK;case 2:return f.dD+" "+f.eL;default:return f.dD+" "+f.gQ}},bh=function(n){switch(n){case 0:return f.dE+" "+f.gW;case 2:return f.dE+" "+f.gP;default:return f.dE+" "+f.gR}},ve=function(n,r){return Qe(Qo(n),qo(r))},lh=function(n,r){switch(n.$){case 0:switch(r.$){case 0:return{$:1,a:{a:e=r.a,b:0,c:0}};case 1:return{$:1,a:{a:0,b:a=r.a,c:0}};case 2:return{$:1,a:{a:0,b:0,c:$=r.a}};case 3:return{$:1,a:r.a};case 4:return{$:2,a:{a:0,b:0,c:0},b:{a:1,b:1,c:1},c:r.a,d:c=r.b};default:return{$:2,a:{a:0,b:0,c:0},b:r.a,c:{a:0,b:0,c:1},d:0}}case 1:var e=(t=n.a).a,a=t.b,$=t.c;switch(r.$){case 0:return{$:1,a:{a:r.a,b:a,c:$}};case 1:return{$:1,a:{a:e,b:r.a,c:$}};case 2:return{$:1,a:{a:e,b:a,c:r.a}};case 3:return{$:1,a:r.a};case 4:return{$:2,a:t,b:{a:1,b:1,c:1},c:r.a,d:c=r.b};default:return{$:2,a:t,b:r.a,c:{a:0,b:0,c:1},d:0}}default:var t,e=(t=n.a).a,a=t.b,$=t.c,i=n.b,o=n.c,c=n.d;switch(r.$){case 0:return{$:2,a:{a:r.a,b:a,c:$},b:i,c:o,d:c};case 1:return{$:2,a:{a:e,b:r.a,c:$},b:i,c:o,d:c};case 2:return{$:2,a:{a:e,b:a,c:r.a},b:i,c:o,d:c};case 3:return{$:2,a:r.a,b:i,c:o,d:c};case 4:return{$:2,a:t,b:i,c:r.a,d:r.b};default:return{$:2,a:t,b:r.a,c:o,d:c}}}},Nr=O(7),Qu=O(36),Gu=function(n,r){return{$:0,a:n.a|r.a,b:n.b|r.b}},rr={$:0,a:0,b:0},ka=function(n){switch(n.$){case 0:var r=g(n.a),$="height-px-"+r;return{a:rr,b:f.fa+" "+$,c:u([En($,"height",r+"px")])};case 1:return{a:F(Qu,rr),b:f.dS,c:d};case 2:return $=n.a,$===1?{a:F(Et,rr),b:f.dT,c:d}:{a:F(Et,rr),b:f.fb+(" height-fill-"+g($)),c:u([En(f.gZ+("."+f.d+(" > "+h("height-fill-"+g($)))),"flex-grow",g(1e5*$))])};case 3:var r=n.a,t=n.b,e="min-height-"+g(r),a=En(e,"min-height",g(r)+"px !important"),$=ka(t),i=$.a,o=$.b,c=$.c;return{a:F(Ba,i),b:e+" "+o,c:{$:1,a:a,b:c}};default:return r=n.a,t=n.b,e="max-height-"+g(r),a=En(e,"max-height",g(r)+"px"),$=ka(t),i=$.a,o=$.b,c=$.c,{a:F(Ba,i),b:e+" "+o,c:{$:1,a:a,b:c}}}},qu=O(38),Pa=function(n){switch(n.$){case 0:var a=n.a;return{a:rr,b:f.gG+(" width-px-"+g(a)),c:u([En("width-px-"+g(a),"width",g(a)+"px")])};case 1:return{a:F(qu,rr),b:f.eC,c:d};case 2:return a=n.a,a===1?{a:F(Rt,rr),b:f.eD,c:d}:{a:F(Rt,rr),b:f.gH+(" width-fill-"+g(a)),c:u([En(f.gZ+("."+f.c+(" > "+h("width-fill-"+g(a)))),"flex-grow",g(1e5*a))])};case 3:var a=n.a,r=n.b,t="min-width-"+g(a),e=En(t,"min-width",g(a)+"px"),a=Pa(r),$=a.a,i=a.b,o=a.c;return{a:F(Va,$),b:t+" "+i,c:{$:1,a:e,b:o}};default:return a=n.a,r=n.b,t="max-width-"+g(a),e=En(t,"max-width",g(a)+"px"),a=Pa(r),$=a.a,i=a.b,o=a.c,{a:F(Va,$),b:t+" "+i,c:{$:1,a:e,b:o}}}},hh=O(27),_h=function(n,r){if(T(n,hh)){if(r.$!==3)return!1;switch(r.c){case"0px":case"1px":case"2px":case"3px":case"4px":case"5px":case"6px":return!0;default:return!1}}else switch(r.$){case 2:var t=r.a;return t>=8&&t<=32;case 7:var t=r.b,e=r.c,a=r.e;return T(t,r.d)&&T(t,e)&&T(t,a)&&t>=0&&t<=24;default:return!1}},nt=O(6),Xu=O(30),Ku=O(29),mh=function(n,r,t,e,a,$,i,o){for(;;){var c;if(!o.b)return(c=Ca(e)).$===1?{a9:{$:1,a:Bn(Vn,n),b:$},hr:i,bf:t,fS:r,gm:a}:{a9:{$:1,a:Bn(Vn,n+" "+c.a),b:$},hr:i,bf:t,fS:r,gm:{$:1,a:{$:10,a:e},b:a}};var l=o.a,_=o.b;switch(l.$){case 0:n=j=n,r=A=r,t=C=t,e=J=e,a=B=a,$=k=$,i=z=i,o=_;continue;case 3:var p=l.a,s=l.b;if(yn(p,t)){n=j=n,r=A=r,t=C=t,e=J=e,a=B=a,$=k=$,i=z=i,o=_;continue}n=j=s+" "+n,r=A=r,t=C=F(p,t),e=J=e,a=B=a,$=k=$,i=z=i,o=_;continue;case 1:n=j=n,r=A=r,t=C=t,e=J=e,a=B=a,$=k={$:1,a:l.a,b:$},i=z=i,o=_;continue;case 4:if(p=l.a,s=l.b,yn(p,t)){n=j=n,r=A=r,t=C=t,e=J=e,a=B=a,$=k=$,i=z=i,o=_;continue}if(_h(p,s)){n=j=At(s)+" "+n,r=A=r,t=C=F(p,t),e=J=e,a=B=a,$=k=$,i=z=i,o=_;continue}n=j=At(s)+" "+n,r=A=r,t=C=F(p,t),e=J=e,a=B={$:1,a:s,b:a},$=k=$,i=z=i,o=_;continue;case 10:var p=l.a,cn=l.b;n=j=n,r=A=r,t=C=F(p,t),e=J=lh(e,cn),a=B=a,$=k=$,i=z=i,o=_;continue;case 7:var m=l.a;if(yn(nt,t)){n=j=n,r=A=r,t=C=t,e=J=e,a=B=a,$=k=$,i=z=i,o=_;continue}switch(m.$){case 0:var S=m.a,j=f.gG+(" width-px-"+g(S))+" "+n,A=r,C=F(nt,t),J=e,B={$:1,a:En("width-px-"+g(S),"width",g(S)+"px"),b:a};n=j,r=A,t=C,e=J,a=B,$=k=$,i=z=i,o=_;continue;case 1:n=j=n+" "+f.eC,r=A=r,t=C=F(qu,F(nt,t)),e=J=e,a=B=a,$=k=$,i=z=i,o=_;continue;case 2:if((G=m.a)===1){n=j=n+" "+f.eD,r=A=r,t=C=F(Rt,F(nt,t)),e=J=e,a=B=a,$=k=$,i=z=i,o=_;continue}j=n+(" "+f.gH+(" width-fill-"+g(G))),A=r,C=F(Rt,F(nt,t)),J=e,B={$:1,a:En(f.gZ+("."+f.c+(" > "+h("width-fill-"+g(G)))),"flex-grow",g(1e5*G)),b:a},n=j,r=A,t=C,e=J,a=B,$=k=$,i=z=i,o=_;continue;default:var M=Pa(m),Y=M.a,q=M.b,P=M.c,j=n+" "+q,A=r,C=Gu(Y,F(nt,t)),J=e,B=E(P,a);n=j,r=A,t=C,e=J,a=B,$=k=$,i=z=i,o=_;continue}case 8:var G,on=l.a;if(yn(Nr,t)){n=j=n,r=A=r,t=C=t,e=J=e,a=B=a,$=k=$,i=z=i,o=_;continue}switch(on.$){case 0:var fn=g(S=on.a)+"px",H="height-px-"+fn,j=f.fa+" "+H+" "+n,A=r,C=F(Nr,t),J=e,B={$:1,a:En(H,"height ",fn),b:a};n=j,r=A,t=C,e=J,a=B,$=k=$,i=z=i,o=_;continue;case 1:n=j=f.dS+" "+n,r=A=r,t=C=F(Qu,F(Nr,t)),e=J=e,a=B=a,$=k=$,i=z=i,o=_;continue;case 2:if((G=on.a)===1){n=j=f.dT+" "+n,r=A=r,t=C=F(Et,F(Nr,t)),e=J=e,a=B=a,$=k=$,i=z=i,o=_;continue}j=n+(" "+f.fb+(" height-fill-"+g(G))),A=r,C=F(Et,F(Nr,t)),J=e,B={$:1,a:En(f.gZ+("."+f.d+(" > "+h("height-fill-"+g(G)))),"flex-grow",g(1e5*G)),b:a},n=j,r=A,t=C,e=J,a=B,$=k=$,i=z=i,o=_;continue;default:var H=ka(on),Y=H.a,q=H.b,P=H.c,j=n+" "+q,A=r,C=Gu(Y,F(Nr,t)),J=e,B=E(P,a);n=j,r=A,t=C,e=J,a=B,$=k=$,i=z=i,o=_;continue}case 2:var N=l.a;switch(N.$){case 0:n=j=n,r=A=Ir("main",r),t=C=t,e=J=e,a=B=a,$=k=$,i=z=i,o=_;continue;case 1:n=j=n,r=A=Ir("nav",r),t=C=t,e=J=e,a=B=a,$=k=$,i=z=i,o=_;continue;case 2:n=j=n,r=A=Ir("footer",r),t=C=t,e=J=e,a=B=a,$=k=$,i=z=i,o=_;continue;case 3:n=j=n,r=A=Ir("aside",r),t=C=t,e=J=e,a=B=a,$=k=$,i=z=i,o=_;continue;case 4:var en=N.a;if(en<=1){n=j=n,r=A=Ir("h1",r),t=C=t,e=J=e,a=B=a,$=k=$,i=z=i,o=_;continue}if(en<7){n=j=n,r=A=Ir("h"+g(en),r),t=C=t,e=J=e,a=B=a,$=k=$,i=z=i,o=_;continue}n=j=n,r=A=Ir("h6",r),t=C=t,e=J=e,a=B=a,$=k=$,i=z=i,o=_;continue;case 9:n=j=n,r=A=r,t=C=t,e=J=e,a=B=a,$=k=$,i=z=i,o=_;continue;case 8:var j=n,A=r,C=t,J=e,B=a,k={$:1,a:ve("role","button"),b:$};n=j,r=A,t=C,e=J,a=B,$=k,i=z=i,o=_;continue;case 5:j=n,A=r,C=t,J=e,B=a,k={$:1,a:ve("aria-label",N.a),b:$},n=j,r=A,t=C,e=J,a=B,$=k,i=z=i,o=_;continue;case 6:j=n,A=r,C=t,J=e,B=a,k={$:1,a:ve("aria-live","polite"),b:$},n=j,r=A,t=C,e=J,a=B,$=k,i=z=i,o=_;continue;default:j=n,A=r,C=t,J=e,B=a,k={$:1,a:ve("aria-live","assertive"),b:$},n=j,r=A,t=C,e=J,a=B,$=k,i=z=i,o=_;continue}case 9:var cn=l.a,an=l.b,j=n,A=r,C=t,J=e,B=P=function(){switch(an.$){case 3:return a;case 2:return a;case 0:return a;default:return E(a,an.a.gm)}}(),k=$,z=fh(cn,an,i);n=j,r=A,t=C,e=J,a=B,$=k,i=z,o=_;continue;case 6:var Ae=l.a;if(yn(Xu,t)){n=j=n,r=A=r,t=C=t,e=J=e,a=B=a,$=k=$,i=z=i,o=_;continue}n=j=ch(Ae)+" "+n,r=A=r,t=C=function(tr){switch(Ae){case 1:return F(Iu,tr);case 2:return F(Mu,tr);default:return tr}}(F(Xu,t)),e=J=e,a=B=a,$=k=$,i=z=i,o=_;continue;default:var De=l.a;o=(i=z=($=k=(a=B=(e=J=(t=C=yn(Ku,t)?(n=j=n,r=A=r,t):(n=j=bh(De)+" "+n,r=A=r,function(tr){switch(De){case 1:return F(Su,tr);case 2:return F(wu,tr);default:return tr}}(F(Ku,t))),e),a),$),i),_)}}},dh={$:0},rt=function(n,r,t,e){return uh(n,e,mh(zl(n),r,rr,dh,d,d,Jl,On(t)))},sh={g4:w,hd:w,i5:v(new et(0,{$:0,a:155/255,b:203/255,c:1,d:1},{a:0,b:0},3))},gh=function(n){var r;return n=dr(y(function(t,e){switch(t.$){case 0:var a=t.a;return e.h1.$===1?((o=e.$c()).h1=v(a),o):e;case 1:var $=t.a;return e.hU.$===1?function(){var c=e.$c();return c.hU=v($),c}():e;default:var i=t.a;return e.fM.$===1?function(){var c=e.$c();return c.fM=v(i),c}():e}var o}),new kt(w,w,w),n),new kt((r=n.hU).$===1?sh:r.a,(r=n.h1).$===1?1:r.a,(r=n.fM).$===1?0:r.a)},ph=function(n,r){switch(r.$){case 0:return(0,r.a)(Nn);case 1:return b(r.a.h2,n(r.a.gm),Nn);case 2:return Ct(r.a);default:return Ct("")}},vh=function(n,r,t){return n=gh(n),n=(n.fM===1?Cl:Tl)(n),ph(n,rt(Nn,Wr,r,{$:0,a:u([t])}))},xu=function(n,r){return{$:1,a:n,b:r}},Nu=function(n){return{$:2,a:n}},Sr={$:1},I=function(n){return{$:3,a:n}},no=O(14),ro=O(5),to=O(4),Ua=function(n){return n.toLowerCase()},La=function(n){return u(n.trim().split(/\s+/g))},eo=y(function(n,r){return E(r,function(){switch(n.$){case 0:return"serif";case 1:return"sans-serif";case 2:return"monospace";case 3:return V("-",La(Ua(t=n.a)));case 4:var t=n.a;return V("-",La(Ua(t)));default:return V("-",La(Ua(t=n.a.iy)))}}())}),wh=(x=u([{$:3,a:"Open Sans"},{$:3,a:"Helvetica"},{$:3,a:"Verdana"},Sr]),u([jn(gu,me("bg-"+wt({$:0,a:1,b:1,c:1,d:0}),"background-color",{$:0,a:1,b:1,c:1,d:0})),jn(no,me("fc-"+wt({$:0,a:0,b:0,c:0,d:1}),"color",{$:0,a:0,b:0,c:0,d:1})),jn(to,Nu(20)),jn(ro,xu(mn(eo,"font-",x),x))])),Mh=function(n,r,t){return vh(n.iN,{$:1,a:It(V(" ",u([f.iY,f.gZ,f.i7]))),b:E(wh,r)},t)},Tt={$:6,a:1},we={$:5,a:1},Ih=1,Qn=function(n){return{$:8,a:n}},lr={$:1},Fn=function(n){return{$:7,a:n}},za=function(n,r){return rt(Ih,Wr,{$:1,a:It(f.hx+" "+f.b5),b:{$:1,a:Qn(lr),b:{$:1,a:Fn(lr),b:n}}},{$:0,a:r})},Sh={$:8},jh=Ft,ao=function(n,r){return{$:"a2",n:n,o:jh(r)}},$o="disabled",Ah=(y(ao)($o),"Enter"),io={$:0},Dh=function(n){return n.b.a,n.$===4&&n.b.$===11&&!n.b.a&&!0},yh=function(n){return se(Dh,n)?io:It("focusable")},Eh=Mt,Rh=function(n){return{$:"a0",n:"click",o:{$:0,a:sr(n)}}},Ch=function(n){return{$:1,a:n}},Th=function(n,r){return{$:"a0",n:n,o:{$:2,a:r}}},Jh={$:3,a:O(21),b:f.hA},Bh=" ",Vh=function(n,$){var t,e,a=$.iK,$=$.ih;return rt(Nn,Wr,{$:1,a:Fn(lr),b:{$:1,a:Qn(lr),b:{$:1,a:It(f.c3+" "+f.aW+" "+f.i2+" "+f.fR),b:{$:1,a:Jh,b:{$:1,a:yh(n),b:{$:1,a:{$:2,a:Sh},b:{$:1,a:Mt(Qe("tabIndex",g(0))),b:a.$===1?{$:1,a:Mt(ao($o,!0)),b:n}:{$:1,a:Eh(Rh(t=a.a)),b:{$:1,a:(e=function(i){return T(i,Ah)||T(i,Bh)?v(t):w},a=He(function(i){return i=e(i),i.$===1?Ch("No key matched"):sr(i.a)},er("key",hi)),Mt(Th("keydown",Ze(function(i){return{a:i,b:!0}},a)))),b:n}}}}}}}}},{$:0,a:u([$])})},uo=function(n){return jn(no,me("fc-"+wt(n),"color",n))},Me=function(n,r){return rt(Nn,Wr,{$:1,a:Fn(lr),b:{$:1,a:Qn(lr),b:n}},{$:0,a:u([r])})},kh=function(n){return Fr(u([n.fh?"box-inset":"box-",un(n.fU.a)+"px",un(n.fU.b)+"px",un(n.eN)+"px",un(n.gi)+"px",wt(n.t)]))},Ph=O(19),oo=function(n){return n=new tt(n.eN,n.t,!0,n.fU,n.gi),jn(Ph,En(kh(n),"box-shadow",Ta(n)))},Fa={$:3},Ie=function(n,r,t,e,a){return{$:7,a:n,b:r,c:t,d:e,e:a}},Se=O(2),Uh=function(n,r,t,e){return"pad-"+g(n)+("-"+g(r)+("-"+g(t)+("-"+g(e))))},Lh=function($){var r,t=$.jE,e=$.iV,a=$.hh,$=$.ii;return T(t,e)&&T(t,a)&&T(t,$)?jn(Se,Ie("p-"+g(r=t),r,r,r,r)):jn(Se,Ie(Uh(t,e,a,$),t,e,a,$))},zh=function(n){switch(n){case 0:return"\u265F";case 2:return"\u265D";case 1:return"\u265E";case 3:return"\u265C";case 4:return"\u265B";default:return"\u265A"}},jr=function(n){return{$:0,a:n}},Fh=function(n){return{$:2,a:n}},fo=function(n){return Fh(n)},Ha=I,Hh=function(n,r,t){var e=L(t.ap.c)%2===L(t.ap.d)%2?{$:0,a:.4,b:.4,c:.4,d:1}:{$:0,a:.6,b:.6,c:.6,d:1},e=E(u([Fn(jr(100)),Qn(jr(100)),Tt,we]),r.fi?u([Or(e),oo(new et(0,{$:0,a:.15,b:.7,c:.2,d:.52},{a:0,b:0},100))]):!(r=Cn(bl(t.ap),n.a3)).$&&r.a?u([Or({$:0,a:.15,b:.7,c:.2,d:1})]):{$:1,a:Or(e),b:!(r=Cn(function(a){return wr(t.ap,a.aY)||wr(t.ap,a.Q)},n.ck)).$&&r.a?u([oo(new et(0,{$:0,a:.15,b:.7,c:.2,d:1},{a:0,b:0},6))]):d});return Vh(d,{ih:(n=t.c1).$===1?Me(e,Fa):(n=n.a,Me(E(u([Tt,we,Lh({hh:11,ii:5,iV:5,jE:0}),jn(to,Nu(100)),uo(n.t?{$:0,a:1,b:1,c:1,d:1}:{$:0,a:0,b:0,c:0,d:1}),(r=u([Ha("Noto Sans"),Ha("Cantarell"),Ha("Ubuntu")]),jn(ro,xu(mn(eo,"ff-",r),r)))]),e),fo((r=zh(n.P),wo(r,""))))),iK:v({$:1,a:t.ap})})},Zh=0,co=function(n,r){return rt(Zh,Wr,{$:1,a:It(f.b5+" "+f.aW),b:{$:1,a:Fn(lr),b:{$:1,a:Qn(lr),b:n}}},{$:0,a:r})},Oh=function(n){var r,t=(r=n.a3).$?d:Ea(r.a,n.R);return za(u([Tt,we,Fn(jr(800)),Qn(jr(800))]),On(he(b(ln,function(e){return co(d,he(b(ln,function(a){return Hh(n,{fi:se(function($){return wr(a.ap,$.Q)},t)},a)},e)))},n.R))))},Wh={$:5,a:0},Yh=function(n,r){return r.$===3?io:{$:9,a:n,b:r}},pn=function(n){return{$:2,a:n}},je={$:2,a:1},bo=pn,lo=function(n,r){var t;return T(n,r)?jn(Se,Ie("p-"+g(t=n),t,t,t,t)):(t=r,jn(Se,Ie("p-"+g(n=n)+("-"+g(r)),t,n,t,n)))},Qh={$:9},Gh=function(n,r,t){return{$:5,a:n,b:r,c:t}},qh=O(3),Xh=function(n,r){return"spacing-"+g(n)+("-"+g(r))},Za=function(n){return jn(qh,Gh(Xh(n,n),n,n))},Kh=function(n,r){return rt(jt,Wr,{$:1,a:{$:2,a:Qh},b:{$:1,a:Fn(je),b:{$:1,a:Za(5),b:n}}},{$:0,a:r})},xh=O(17),Nh={$:3,a:O(20),b:f.i1},n_=function(n){return za(u([Za(12),uo({$:0,a:1,b:1,c:1,d:1}),Tt,lo(50,40),Wh,Nh,Qn({$:4,a:800,b:je})]),D(function(r){return Kh(u([Or({$:0,a:.1,b:.1,c:.1,d:1}),jn(xh,En("br-"+g(t=40),"border-radius",g(t)+"px")),Fn(jr(400)),lo(27,15),(t=za(u([Fn(je),Qn(je)]),u([Me(u([Or({$:0,a:.1,b:.1,c:.1,d:1}),Fn(jr(200)),Qn(bo(1))]),Fa),Me(u([Fn(jr(200)),Qn(bo(1))]),Fa)])),Yh(5,t))]),u([fo(r)]));var t},E(n,u(["Don't forget: The computer always wins","Hello there, human."]))))},r_=function(n){return co(u([Za(80),Tt,we]),u([Oh(n),n_(n.b4)]))},t_=function(n){return{hb:bu(Mh({iN:u([Rl({g4:w,hd:v({$:0,a:0,b:1,c:.4,d:1}),i5:w})])},u([Or({$:0,a:0,b:0,c:0,d:1})]),r_(n))),jC:"schach"}},_n={Main:{init:ir(sa,ga,new Ve(function(n){return jf},{hV:Rn.g1,jD:Rn.g2},b(ft,zr,su(Vi)),function(n){return yl},y(function(n,r){return b(ft,Al(r),su(Vi))}),function(n){return t_}))(sr(0))(0)}};if((_n=c$("Elm",Oa.Elm||(Oa.Elm={}),_n)).length>0)throw new Error(["ELM_WATCH_RELOAD_NEEDED"].concat(Array.from(new Set(_n))).join("\n\n---\n\n"))})(this);
