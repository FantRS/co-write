var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// client/node_modules/@automerge/automerge/dist/mjs/wasm_bindgen_output/web/automerge_wasm.js
var automerge_wasm_exports = {};
__export(automerge_wasm_exports, {
  Automerge: () => Automerge,
  SyncState: () => SyncState,
  create: () => create,
  decodeChange: () => decodeChange,
  decodeSyncMessage: () => decodeSyncMessage,
  decodeSyncState: () => decodeSyncState,
  default: () => automerge_wasm_default,
  encodeChange: () => encodeChange,
  encodeSyncMessage: () => encodeSyncMessage,
  encodeSyncState: () => encodeSyncState,
  exportSyncState: () => exportSyncState,
  importSyncState: () => importSyncState,
  initSync: () => initSync,
  initSyncState: () => initSyncState,
  load: () => load,
  readBundle: () => readBundle
});
var wasm;
var cachedUint8ArrayMemory0 = null;
function getUint8ArrayMemory0() {
  if (cachedUint8ArrayMemory0 === null || cachedUint8ArrayMemory0.byteLength === 0) {
    cachedUint8ArrayMemory0 = new Uint8Array(wasm.memory.buffer);
  }
  return cachedUint8ArrayMemory0;
}
var cachedTextDecoder = new TextDecoder("utf-8", { ignoreBOM: true, fatal: true });
cachedTextDecoder.decode();
var MAX_SAFARI_DECODE_BYTES = 2146435072;
var numBytesDecoded = 0;
function decodeText(ptr, len) {
  numBytesDecoded += len;
  if (numBytesDecoded >= MAX_SAFARI_DECODE_BYTES) {
    cachedTextDecoder = new TextDecoder("utf-8", { ignoreBOM: true, fatal: true });
    cachedTextDecoder.decode();
    numBytesDecoded = len;
  }
  return cachedTextDecoder.decode(getUint8ArrayMemory0().subarray(ptr, ptr + len));
}
function getStringFromWasm0(ptr, len) {
  ptr = ptr >>> 0;
  return decodeText(ptr, len);
}
var WASM_VECTOR_LEN = 0;
var cachedTextEncoder = new TextEncoder();
if (!("encodeInto" in cachedTextEncoder)) {
  cachedTextEncoder.encodeInto = function(arg, view2) {
    const buf = cachedTextEncoder.encode(arg);
    view2.set(buf);
    return {
      read: arg.length,
      written: buf.length
    };
  };
}
function passStringToWasm0(arg, malloc, realloc) {
  if (realloc === void 0) {
    const buf = cachedTextEncoder.encode(arg);
    const ptr2 = malloc(buf.length, 1) >>> 0;
    getUint8ArrayMemory0().subarray(ptr2, ptr2 + buf.length).set(buf);
    WASM_VECTOR_LEN = buf.length;
    return ptr2;
  }
  let len = arg.length;
  let ptr = malloc(len, 1) >>> 0;
  const mem = getUint8ArrayMemory0();
  let offset = 0;
  for (; offset < len; offset++) {
    const code = arg.charCodeAt(offset);
    if (code > 127) break;
    mem[ptr + offset] = code;
  }
  if (offset !== len) {
    if (offset !== 0) {
      arg = arg.slice(offset);
    }
    ptr = realloc(ptr, len, len = offset + arg.length * 3, 1) >>> 0;
    const view2 = getUint8ArrayMemory0().subarray(ptr + offset, ptr + len);
    const ret = cachedTextEncoder.encodeInto(arg, view2);
    offset += ret.written;
    ptr = realloc(ptr, len, offset, 1) >>> 0;
  }
  WASM_VECTOR_LEN = offset;
  return ptr;
}
var cachedDataViewMemory0 = null;
function getDataViewMemory0() {
  if (cachedDataViewMemory0 === null || cachedDataViewMemory0.buffer.detached === true || cachedDataViewMemory0.buffer.detached === void 0 && cachedDataViewMemory0.buffer !== wasm.memory.buffer) {
    cachedDataViewMemory0 = new DataView(wasm.memory.buffer);
  }
  return cachedDataViewMemory0;
}
function addToExternrefTable0(obj) {
  const idx = wasm.__externref_table_alloc();
  wasm.__wbindgen_export_4.set(idx, obj);
  return idx;
}
function handleError(f, args) {
  try {
    return f.apply(this, args);
  } catch (e) {
    const idx = addToExternrefTable0(e);
    wasm.__wbindgen_exn_store(idx);
  }
}
function getArrayU8FromWasm0(ptr, len) {
  ptr = ptr >>> 0;
  return getUint8ArrayMemory0().subarray(ptr / 1, ptr / 1 + len);
}
function isLikeNone(x) {
  return x === void 0 || x === null;
}
function debugString(val) {
  const type = typeof val;
  if (type == "number" || type == "boolean" || val == null) {
    return `${val}`;
  }
  if (type == "string") {
    return `"${val}"`;
  }
  if (type == "symbol") {
    const description = val.description;
    if (description == null) {
      return "Symbol";
    } else {
      return `Symbol(${description})`;
    }
  }
  if (type == "function") {
    const name = val.name;
    if (typeof name == "string" && name.length > 0) {
      return `Function(${name})`;
    } else {
      return "Function";
    }
  }
  if (Array.isArray(val)) {
    const length = val.length;
    let debug = "[";
    if (length > 0) {
      debug += debugString(val[0]);
    }
    for (let i = 1; i < length; i++) {
      debug += ", " + debugString(val[i]);
    }
    debug += "]";
    return debug;
  }
  const builtInMatches = /\[object ([^\]]+)\]/.exec(toString.call(val));
  let className;
  if (builtInMatches && builtInMatches.length > 1) {
    className = builtInMatches[1];
  } else {
    return toString.call(val);
  }
  if (className == "Object") {
    try {
      return "Object(" + JSON.stringify(val) + ")";
    } catch (_) {
      return "Object";
    }
  }
  if (val instanceof Error) {
    return `${val.name}: ${val.message}
${val.stack}`;
  }
  return className;
}
function takeFromExternrefTable0(idx) {
  const value = wasm.__wbindgen_export_4.get(idx);
  wasm.__externref_table_dealloc(idx);
  return value;
}
function _assertClass(instance, klass) {
  if (!(instance instanceof klass)) {
    throw new Error(`expected instance of ${klass.name}`);
  }
}
function create(options) {
  const ret = wasm.create(options);
  if (ret[2]) {
    throw takeFromExternrefTable0(ret[1]);
  }
  return Automerge.__wrap(ret[0]);
}
function load(data, options) {
  const ret = wasm.load(data, options);
  if (ret[2]) {
    throw takeFromExternrefTable0(ret[1]);
  }
  return Automerge.__wrap(ret[0]);
}
function encodeChange(change2) {
  const ret = wasm.encodeChange(change2);
  if (ret[2]) {
    throw takeFromExternrefTable0(ret[1]);
  }
  return takeFromExternrefTable0(ret[0]);
}
function decodeChange(change2) {
  const ret = wasm.decodeChange(change2);
  if (ret[2]) {
    throw takeFromExternrefTable0(ret[1]);
  }
  return takeFromExternrefTable0(ret[0]);
}
function initSyncState() {
  const ret = wasm.initSyncState();
  return SyncState.__wrap(ret);
}
function importSyncState(state) {
  const ret = wasm.importSyncState(state);
  if (ret[2]) {
    throw takeFromExternrefTable0(ret[1]);
  }
  return SyncState.__wrap(ret[0]);
}
function exportSyncState(state) {
  _assertClass(state, SyncState);
  const ret = wasm.exportSyncState(state.__wbg_ptr);
  return ret;
}
function encodeSyncMessage(message) {
  const ret = wasm.encodeSyncMessage(message);
  if (ret[2]) {
    throw takeFromExternrefTable0(ret[1]);
  }
  return takeFromExternrefTable0(ret[0]);
}
function decodeSyncMessage(msg) {
  const ret = wasm.decodeSyncMessage(msg);
  if (ret[2]) {
    throw takeFromExternrefTable0(ret[1]);
  }
  return takeFromExternrefTable0(ret[0]);
}
function encodeSyncState(state) {
  _assertClass(state, SyncState);
  const ret = wasm.encodeSyncState(state.__wbg_ptr);
  return ret;
}
function decodeSyncState(data) {
  const ret = wasm.decodeSyncState(data);
  if (ret[2]) {
    throw takeFromExternrefTable0(ret[1]);
  }
  return SyncState.__wrap(ret[0]);
}
function readBundle(bundle) {
  const ret = wasm.readBundle(bundle);
  if (ret[2]) {
    throw takeFromExternrefTable0(ret[1]);
  }
  return takeFromExternrefTable0(ret[0]);
}
var AutomergeFinalization = typeof FinalizationRegistry === "undefined" ? { register: () => {
}, unregister: () => {
} } : new FinalizationRegistry((ptr) => wasm.__wbg_automerge_free(ptr >>> 0, 1));
var Automerge = class _Automerge {
  static __wrap(ptr) {
    ptr = ptr >>> 0;
    const obj = Object.create(_Automerge.prototype);
    obj.__wbg_ptr = ptr;
    AutomergeFinalization.register(obj, obj.__wbg_ptr, obj);
    return obj;
  }
  __destroy_into_raw() {
    const ptr = this.__wbg_ptr;
    this.__wbg_ptr = 0;
    AutomergeFinalization.unregister(this);
    return ptr;
  }
  free() {
    const ptr = this.__destroy_into_raw();
    wasm.__wbg_automerge_free(ptr, 0);
  }
  /**
   * @param {string | null} [actor]
   * @returns {Automerge}
   */
  static new(actor) {
    var ptr0 = isLikeNone(actor) ? 0 : passStringToWasm0(actor, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    var len0 = WASM_VECTOR_LEN;
    const ret = wasm.automerge_new(ptr0, len0);
    if (ret[2]) {
      throw takeFromExternrefTable0(ret[1]);
    }
    return _Automerge.__wrap(ret[0]);
  }
  /**
   * @param {string | null} [actor]
   * @returns {Automerge}
   */
  clone(actor) {
    var ptr0 = isLikeNone(actor) ? 0 : passStringToWasm0(actor, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    var len0 = WASM_VECTOR_LEN;
    const ret = wasm.automerge_clone(this.__wbg_ptr, ptr0, len0);
    if (ret[2]) {
      throw takeFromExternrefTable0(ret[1]);
    }
    return _Automerge.__wrap(ret[0]);
  }
  /**
   * @param {string | null | undefined} actor
   * @param {any} heads
   * @returns {Automerge}
   */
  fork(actor, heads) {
    var ptr0 = isLikeNone(actor) ? 0 : passStringToWasm0(actor, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    var len0 = WASM_VECTOR_LEN;
    const ret = wasm.automerge_fork(this.__wbg_ptr, ptr0, len0, heads);
    if (ret[2]) {
      throw takeFromExternrefTable0(ret[1]);
    }
    return _Automerge.__wrap(ret[0]);
  }
  /**
   * @returns {number}
   */
  pendingOps() {
    const ret = wasm.automerge_pendingOps(this.__wbg_ptr);
    return ret;
  }
  /**
   * @param {string | null} [message]
   * @param {number | null} [time]
   * @returns {Hash | null}
   */
  commit(message, time) {
    var ptr0 = isLikeNone(message) ? 0 : passStringToWasm0(message, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    var len0 = WASM_VECTOR_LEN;
    const ret = wasm.automerge_commit(this.__wbg_ptr, ptr0, len0, !isLikeNone(time), isLikeNone(time) ? 0 : time);
    return ret;
  }
  /**
   * @param {Automerge} other
   * @returns {Heads}
   */
  merge(other) {
    _assertClass(other, _Automerge);
    const ret = wasm.automerge_merge(this.__wbg_ptr, other.__wbg_ptr);
    if (ret[2]) {
      throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
  }
  /**
   * @returns {number}
   */
  rollback() {
    const ret = wasm.automerge_rollback(this.__wbg_ptr);
    return ret;
  }
  /**
   * @param {any} obj
   * @param {Array<any> | null} [heads]
   * @returns {Array<any>}
   */
  keys(obj, heads) {
    const ret = wasm.automerge_keys(this.__wbg_ptr, obj, isLikeNone(heads) ? 0 : addToExternrefTable0(heads));
    if (ret[2]) {
      throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
  }
  /**
   * @param {any} obj
   * @param {Array<any> | null} [heads]
   * @returns {string}
   */
  text(obj, heads) {
    let deferred2_0;
    let deferred2_1;
    try {
      const ret = wasm.automerge_text(this.__wbg_ptr, obj, isLikeNone(heads) ? 0 : addToExternrefTable0(heads));
      var ptr1 = ret[0];
      var len1 = ret[1];
      if (ret[3]) {
        ptr1 = 0;
        len1 = 0;
        throw takeFromExternrefTable0(ret[2]);
      }
      deferred2_0 = ptr1;
      deferred2_1 = len1;
      return getStringFromWasm0(ptr1, len1);
    } finally {
      wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
    }
  }
  /**
   * @param {any} obj
   * @param {Array<any> | null} [heads]
   * @returns {Array<any>}
   */
  spans(obj, heads) {
    const ret = wasm.automerge_spans(this.__wbg_ptr, obj, isLikeNone(heads) ? 0 : addToExternrefTable0(heads));
    if (ret[2]) {
      throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
  }
  /**
   * @param {any} obj
   * @param {number} start
   * @param {number} delete_count
   * @param {any} text
   */
  splice(obj, start, delete_count, text) {
    const ret = wasm.automerge_splice(this.__wbg_ptr, obj, start, delete_count, text);
    if (ret[1]) {
      throw takeFromExternrefTable0(ret[0]);
    }
  }
  /**
   * @param {ObjID} obj
   * @param {string} new_text
   */
  updateText(obj, new_text) {
    const ret = wasm.automerge_updateText(this.__wbg_ptr, obj, new_text);
    if (ret[1]) {
      throw takeFromExternrefTable0(ret[0]);
    }
  }
  /**
   * @param {ObjID} obj
   * @param {Span[]} args
   * @param {UpdateSpansConfig | undefined | null} config
   */
  updateSpans(obj, args, config) {
    const ret = wasm.automerge_updateSpans(this.__wbg_ptr, obj, args, config);
    if (ret[1]) {
      throw takeFromExternrefTable0(ret[0]);
    }
  }
  /**
   * @param {any} obj
   * @param {any} value
   * @param {any} datatype
   */
  push(obj, value, datatype) {
    const ret = wasm.automerge_push(this.__wbg_ptr, obj, value, datatype);
    if (ret[1]) {
      throw takeFromExternrefTable0(ret[0]);
    }
  }
  /**
   * @param {ObjID} obj
   * @param {ObjType} value
   * @returns {ObjID}
   */
  pushObject(obj, value) {
    let deferred2_0;
    let deferred2_1;
    try {
      const ret = wasm.automerge_pushObject(this.__wbg_ptr, obj, value);
      var ptr1 = ret[0];
      var len1 = ret[1];
      if (ret[3]) {
        ptr1 = 0;
        len1 = 0;
        throw takeFromExternrefTable0(ret[2]);
      }
      deferred2_0 = ptr1;
      deferred2_1 = len1;
      return getStringFromWasm0(ptr1, len1);
    } finally {
      wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
    }
  }
  /**
   * @param {any} obj
   * @param {number} index
   * @param {any} value
   * @param {any} datatype
   */
  insert(obj, index, value, datatype) {
    const ret = wasm.automerge_insert(this.__wbg_ptr, obj, index, value, datatype);
    if (ret[1]) {
      throw takeFromExternrefTable0(ret[0]);
    }
  }
  /**
   * @param {ObjID} obj
   * @param {number} index
   * @param {{[key: string]: MaterializeValue}} block
   */
  splitBlock(obj, index, block2) {
    const ret = wasm.automerge_splitBlock(this.__wbg_ptr, obj, index, block2);
    if (ret[1]) {
      throw takeFromExternrefTable0(ret[0]);
    }
  }
  /**
   * @param {ObjID} obj
   * @param {number} index
   */
  joinBlock(obj, index) {
    const ret = wasm.automerge_joinBlock(this.__wbg_ptr, obj, index);
    if (ret[1]) {
      throw takeFromExternrefTable0(ret[0]);
    }
  }
  /**
   * @param {ObjID} obj
   * @param {number} index
   * @param {{[key: string]: MaterializeValue}} block
   */
  updateBlock(obj, index, block2) {
    const ret = wasm.automerge_updateBlock(this.__wbg_ptr, obj, index, block2);
    if (ret[1]) {
      throw takeFromExternrefTable0(ret[0]);
    }
  }
  /**
   * @param {any} text
   * @param {number} index
   * @param {Array<any> | null} [heads]
   * @returns {any}
   */
  getBlock(text, index, heads) {
    const ret = wasm.automerge_getBlock(this.__wbg_ptr, text, index, isLikeNone(heads) ? 0 : addToExternrefTable0(heads));
    if (ret[2]) {
      throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
  }
  /**
   * @param {ObjID} obj
   * @param {number} index
   * @param {ObjType} value
   * @returns {ObjID}
   */
  insertObject(obj, index, value) {
    let deferred2_0;
    let deferred2_1;
    try {
      const ret = wasm.automerge_insertObject(this.__wbg_ptr, obj, index, value);
      var ptr1 = ret[0];
      var len1 = ret[1];
      if (ret[3]) {
        ptr1 = 0;
        len1 = 0;
        throw takeFromExternrefTable0(ret[2]);
      }
      deferred2_0 = ptr1;
      deferred2_1 = len1;
      return getStringFromWasm0(ptr1, len1);
    } finally {
      wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
    }
  }
  /**
   * @param {any} obj
   * @param {any} prop
   * @param {any} value
   * @param {any} datatype
   */
  put(obj, prop, value, datatype) {
    const ret = wasm.automerge_put(this.__wbg_ptr, obj, prop, value, datatype);
    if (ret[1]) {
      throw takeFromExternrefTable0(ret[0]);
    }
  }
  /**
   * @param {ObjID} obj
   * @param {Prop} prop
   * @param {ObjType} value
   * @returns {ObjID}
   */
  putObject(obj, prop, value) {
    const ret = wasm.automerge_putObject(this.__wbg_ptr, obj, prop, value);
    if (ret[2]) {
      throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
  }
  /**
   * @param {ObjID} obj
   * @param {Prop} prop
   * @param {number} value
   */
  increment(obj, prop, value) {
    const ret = wasm.automerge_increment(this.__wbg_ptr, obj, prop, value);
    if (ret[1]) {
      throw takeFromExternrefTable0(ret[0]);
    }
  }
  /**
   * @param {any} obj
   * @param {any} prop
   * @param {Array<any> | null} [heads]
   * @returns {any}
   */
  get(obj, prop, heads) {
    const ret = wasm.automerge_get(this.__wbg_ptr, obj, prop, isLikeNone(heads) ? 0 : addToExternrefTable0(heads));
    if (ret[2]) {
      throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
  }
  /**
   * @param {any} obj
   * @param {any} prop
   * @param {Array<any> | null} [heads]
   * @returns {any}
   */
  getWithType(obj, prop, heads) {
    const ret = wasm.automerge_getWithType(this.__wbg_ptr, obj, prop, isLikeNone(heads) ? 0 : addToExternrefTable0(heads));
    if (ret[2]) {
      throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
  }
  /**
   * @param {any} obj
   * @param {Array<any> | null} [heads]
   * @returns {object}
   */
  objInfo(obj, heads) {
    const ret = wasm.automerge_objInfo(this.__wbg_ptr, obj, isLikeNone(heads) ? 0 : addToExternrefTable0(heads));
    if (ret[2]) {
      throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
  }
  /**
   * @param {any} obj
   * @param {any} arg
   * @param {Array<any> | null} [heads]
   * @returns {Array<any>}
   */
  getAll(obj, arg, heads) {
    const ret = wasm.automerge_getAll(this.__wbg_ptr, obj, arg, isLikeNone(heads) ? 0 : addToExternrefTable0(heads));
    if (ret[2]) {
      throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
  }
  /**
   * @param {boolean} enable
   * @returns {boolean}
   */
  enableFreeze(enable) {
    const ret = wasm.automerge_enableFreeze(this.__wbg_ptr, enable);
    if (ret[2]) {
      throw takeFromExternrefTable0(ret[1]);
    }
    return ret[0] !== 0;
  }
  /**
   * @param {string} datatype
   * @param {Function} construct
   * @param {(arg: any) => any | undefined} deconstruct
   */
  registerDatatype(datatype, construct, deconstruct) {
    const ret = wasm.automerge_registerDatatype(this.__wbg_ptr, datatype, construct, deconstruct);
    if (ret[1]) {
      throw takeFromExternrefTable0(ret[0]);
    }
  }
  /**
   * @param {any} object
   * @param {any} meta
   * @returns {any}
   */
  applyPatches(object, meta) {
    const ret = wasm.automerge_applyPatches(this.__wbg_ptr, object, meta);
    if (ret[2]) {
      throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
  }
  /**
   * @param {any} object
   * @param {any} meta
   * @returns {any}
   */
  applyAndReturnPatches(object, meta) {
    const ret = wasm.automerge_applyAndReturnPatches(this.__wbg_ptr, object, meta);
    if (ret[2]) {
      throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
  }
  /**
   * @returns {Patch[]}
   */
  diffIncremental() {
    const ret = wasm.automerge_diffIncremental(this.__wbg_ptr);
    if (ret[2]) {
      throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
  }
  updateDiffCursor() {
    wasm.automerge_updateDiffCursor(this.__wbg_ptr);
  }
  resetDiffCursor() {
    wasm.automerge_resetDiffCursor(this.__wbg_ptr);
  }
  /**
   * @param {Heads} before
   * @param {Heads} after
   * @returns {Patch[]}
   */
  diff(before, after) {
    const ret = wasm.automerge_diff(this.__wbg_ptr, before, after);
    if (ret[2]) {
      throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
  }
  /**
   * @param {Heads} heads
   */
  isolate(heads) {
    const ret = wasm.automerge_isolate(this.__wbg_ptr, heads);
    if (ret[1]) {
      throw takeFromExternrefTable0(ret[0]);
    }
  }
  integrate() {
    wasm.automerge_integrate(this.__wbg_ptr);
  }
  /**
   * @param {any} obj
   * @param {Array<any> | null} [heads]
   * @returns {number}
   */
  length(obj, heads) {
    const ret = wasm.automerge_length(this.__wbg_ptr, obj, isLikeNone(heads) ? 0 : addToExternrefTable0(heads));
    if (ret[2]) {
      throw takeFromExternrefTable0(ret[1]);
    }
    return ret[0];
  }
  /**
   * @param {ObjID} obj
   * @param {Prop} prop
   */
  delete(obj, prop) {
    const ret = wasm.automerge_delete(this.__wbg_ptr, obj, prop);
    if (ret[1]) {
      throw takeFromExternrefTable0(ret[0]);
    }
  }
  /**
   * @returns {Uint8Array}
   */
  save() {
    const ret = wasm.automerge_save(this.__wbg_ptr);
    return ret;
  }
  /**
   * @returns {Uint8Array}
   */
  saveIncremental() {
    const ret = wasm.automerge_saveIncremental(this.__wbg_ptr);
    return ret;
  }
  /**
   * @param {Heads} heads
   * @returns {Uint8Array}
   */
  saveSince(heads) {
    const ret = wasm.automerge_saveSince(this.__wbg_ptr, heads);
    if (ret[2]) {
      throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
  }
  /**
   * @returns {Uint8Array}
   */
  saveNoCompress() {
    const ret = wasm.automerge_saveNoCompress(this.__wbg_ptr);
    return ret;
  }
  /**
   * @returns {Uint8Array}
   */
  saveAndVerify() {
    const ret = wasm.automerge_saveAndVerify(this.__wbg_ptr);
    if (ret[2]) {
      throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
  }
  /**
   * @param {Uint8Array} data
   * @returns {number}
   */
  loadIncremental(data) {
    const ret = wasm.automerge_loadIncremental(this.__wbg_ptr, data);
    if (ret[2]) {
      throw takeFromExternrefTable0(ret[1]);
    }
    return ret[0];
  }
  /**
   * @param {Change[]} changes
   */
  applyChanges(changes) {
    const ret = wasm.automerge_applyChanges(this.__wbg_ptr, changes);
    if (ret[1]) {
      throw takeFromExternrefTable0(ret[0]);
    }
  }
  /**
   * @param {Heads} have_deps
   * @returns {Change[]}
   */
  getChanges(have_deps) {
    const ret = wasm.automerge_getChanges(this.__wbg_ptr, have_deps);
    if (ret[2]) {
      throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
  }
  /**
   * @param {Heads} have_deps
   * @returns {ChangeMetadata[]}
   */
  getChangesMeta(have_deps) {
    const ret = wasm.automerge_getChangesMeta(this.__wbg_ptr, have_deps);
    if (ret[2]) {
      throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
  }
  /**
   * @param {Hash} hash
   * @returns {Change | null}
   */
  getChangeByHash(hash) {
    const ret = wasm.automerge_getChangeByHash(this.__wbg_ptr, hash);
    if (ret[2]) {
      throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
  }
  /**
   * @param {Hash} hash
   * @returns {ChangeMetadata | null}
   */
  getChangeMetaByHash(hash) {
    const ret = wasm.automerge_getChangeMetaByHash(this.__wbg_ptr, hash);
    if (ret[2]) {
      throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
  }
  /**
   * @param {Hash} hash
   * @returns {DecodedChange | null}
   */
  getDecodedChangeByHash(hash) {
    const ret = wasm.automerge_getDecodedChangeByHash(this.__wbg_ptr, hash);
    if (ret[2]) {
      throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
  }
  /**
   * @param {Automerge} other
   * @returns {Change[]}
   */
  getChangesAdded(other) {
    _assertClass(other, _Automerge);
    const ret = wasm.automerge_getChangesAdded(this.__wbg_ptr, other.__wbg_ptr);
    return ret;
  }
  /**
   * @returns {Heads}
   */
  getHeads() {
    const ret = wasm.automerge_getHeads(this.__wbg_ptr);
    return ret;
  }
  /**
   * @returns {Actor}
   */
  getActorId() {
    let deferred1_0;
    let deferred1_1;
    try {
      const ret = wasm.automerge_getActorId(this.__wbg_ptr);
      deferred1_0 = ret[0];
      deferred1_1 = ret[1];
      return getStringFromWasm0(ret[0], ret[1]);
    } finally {
      wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
    }
  }
  /**
   * @returns {Change | null}
   */
  getLastLocalChange() {
    const ret = wasm.automerge_getLastLocalChange(this.__wbg_ptr);
    return ret;
  }
  dump() {
    wasm.automerge_dump(this.__wbg_ptr);
  }
  /**
   * @param {Array<any> | null} [heads]
   * @returns {Array<any>}
   */
  getMissingDeps(heads) {
    const ret = wasm.automerge_getMissingDeps(this.__wbg_ptr, isLikeNone(heads) ? 0 : addToExternrefTable0(heads));
    if (ret[2]) {
      throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
  }
  /**
   * @param {SyncState} state
   * @param {SyncMessage} message
   */
  receiveSyncMessage(state, message) {
    _assertClass(state, SyncState);
    const ret = wasm.automerge_receiveSyncMessage(this.__wbg_ptr, state.__wbg_ptr, message);
    if (ret[1]) {
      throw takeFromExternrefTable0(ret[0]);
    }
  }
  /**
   * @param {SyncState} state
   * @returns {SyncMessage | null}
   */
  generateSyncMessage(state) {
    _assertClass(state, SyncState);
    const ret = wasm.automerge_generateSyncMessage(this.__wbg_ptr, state.__wbg_ptr);
    return ret;
  }
  /**
   * @param {any} meta
   * @returns {MaterializeValue}
   */
  toJS(meta) {
    const ret = wasm.automerge_toJS(this.__wbg_ptr, meta);
    if (ret[2]) {
      throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
  }
  /**
   * @param {any} obj
   * @param {Array<any> | null | undefined} heads
   * @param {any} meta
   * @returns {any}
   */
  materialize(obj, heads, meta) {
    const ret = wasm.automerge_materialize(this.__wbg_ptr, obj, isLikeNone(heads) ? 0 : addToExternrefTable0(heads), meta);
    if (ret[2]) {
      throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
  }
  /**
   * @param {any} obj
   * @param {any} position
   * @param {Array<any> | null | undefined} heads
   * @param {any} move_cursor
   * @returns {string}
   */
  getCursor(obj, position, heads, move_cursor) {
    let deferred2_0;
    let deferred2_1;
    try {
      const ret = wasm.automerge_getCursor(this.__wbg_ptr, obj, position, isLikeNone(heads) ? 0 : addToExternrefTable0(heads), move_cursor);
      var ptr1 = ret[0];
      var len1 = ret[1];
      if (ret[3]) {
        ptr1 = 0;
        len1 = 0;
        throw takeFromExternrefTable0(ret[2]);
      }
      deferred2_0 = ptr1;
      deferred2_1 = len1;
      return getStringFromWasm0(ptr1, len1);
    } finally {
      wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
    }
  }
  /**
   * @param {any} obj
   * @param {any} cursor
   * @param {Array<any> | null} [heads]
   * @returns {number}
   */
  getCursorPosition(obj, cursor, heads) {
    const ret = wasm.automerge_getCursorPosition(this.__wbg_ptr, obj, cursor, isLikeNone(heads) ? 0 : addToExternrefTable0(heads));
    if (ret[2]) {
      throw takeFromExternrefTable0(ret[1]);
    }
    return ret[0];
  }
  /**
   * @param {string | null} [message]
   * @param {number | null} [time]
   * @returns {Hash}
   */
  emptyChange(message, time) {
    var ptr0 = isLikeNone(message) ? 0 : passStringToWasm0(message, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    var len0 = WASM_VECTOR_LEN;
    const ret = wasm.automerge_emptyChange(this.__wbg_ptr, ptr0, len0, !isLikeNone(time), isLikeNone(time) ? 0 : time);
    return ret;
  }
  /**
   * @param {any} obj
   * @param {any} range
   * @param {any} name
   * @param {any} value
   * @param {any} datatype
   */
  mark(obj, range, name, value, datatype) {
    const ret = wasm.automerge_mark(this.__wbg_ptr, obj, range, name, value, datatype);
    if (ret[1]) {
      throw takeFromExternrefTable0(ret[0]);
    }
  }
  /**
   * @param {ObjID} obj
   * @param {MarkRange} range
   * @param {string} name
   */
  unmark(obj, range, name) {
    const ret = wasm.automerge_unmark(this.__wbg_ptr, obj, range, name);
    if (ret[1]) {
      throw takeFromExternrefTable0(ret[0]);
    }
  }
  /**
   * @param {any} obj
   * @param {Array<any> | null} [heads]
   * @returns {any}
   */
  marks(obj, heads) {
    const ret = wasm.automerge_marks(this.__wbg_ptr, obj, isLikeNone(heads) ? 0 : addToExternrefTable0(heads));
    if (ret[2]) {
      throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
  }
  /**
   * @param {any} obj
   * @param {number} index
   * @param {Array<any> | null} [heads]
   * @returns {object}
   */
  marksAt(obj, index, heads) {
    const ret = wasm.automerge_marksAt(this.__wbg_ptr, obj, index, isLikeNone(heads) ? 0 : addToExternrefTable0(heads));
    if (ret[2]) {
      throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
  }
  /**
   * @param {SyncState} state
   * @returns {boolean}
   */
  hasOurChanges(state) {
    _assertClass(state, SyncState);
    const ret = wasm.automerge_hasOurChanges(this.__wbg_ptr, state.__wbg_ptr);
    return ret !== 0;
  }
  /**
   * @returns {Hash[]}
   */
  topoHistoryTraversal() {
    const ret = wasm.automerge_topoHistoryTraversal(this.__wbg_ptr);
    return ret;
  }
  /**
   * @returns {Stats}
   */
  stats() {
    const ret = wasm.automerge_stats(this.__wbg_ptr);
    return ret;
  }
  /**
   * @param {any} hashes
   * @returns {Uint8Array}
   */
  saveBundle(hashes) {
    const ret = wasm.automerge_saveBundle(this.__wbg_ptr, hashes);
    if (ret[2]) {
      throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
  }
};
if (Symbol.dispose) Automerge.prototype[Symbol.dispose] = Automerge.prototype.free;
var SyncStateFinalization = typeof FinalizationRegistry === "undefined" ? { register: () => {
}, unregister: () => {
} } : new FinalizationRegistry((ptr) => wasm.__wbg_syncstate_free(ptr >>> 0, 1));
var SyncState = class _SyncState {
  static __wrap(ptr) {
    ptr = ptr >>> 0;
    const obj = Object.create(_SyncState.prototype);
    obj.__wbg_ptr = ptr;
    SyncStateFinalization.register(obj, obj.__wbg_ptr, obj);
    return obj;
  }
  __destroy_into_raw() {
    const ptr = this.__wbg_ptr;
    this.__wbg_ptr = 0;
    SyncStateFinalization.unregister(this);
    return ptr;
  }
  free() {
    const ptr = this.__destroy_into_raw();
    wasm.__wbg_syncstate_free(ptr, 0);
  }
  /**
   * @returns {Heads}
   */
  get sharedHeads() {
    const ret = wasm.syncstate_sharedHeads(this.__wbg_ptr);
    return ret;
  }
  /**
   * @returns {Heads}
   */
  get lastSentHeads() {
    const ret = wasm.syncstate_lastSentHeads(this.__wbg_ptr);
    return ret;
  }
  /**
   * @param {Heads} heads
   */
  set lastSentHeads(heads) {
    const ret = wasm.syncstate_set_lastSentHeads(this.__wbg_ptr, heads);
    if (ret[1]) {
      throw takeFromExternrefTable0(ret[0]);
    }
  }
  /**
   * @param {Heads} hashes
   */
  set sentHashes(hashes) {
    const ret = wasm.syncstate_set_sentHashes(this.__wbg_ptr, hashes);
    if (ret[1]) {
      throw takeFromExternrefTable0(ret[0]);
    }
  }
  /**
   * @returns {SyncState}
   */
  clone() {
    const ret = wasm.syncstate_clone(this.__wbg_ptr);
    return _SyncState.__wrap(ret);
  }
};
if (Symbol.dispose) SyncState.prototype[Symbol.dispose] = SyncState.prototype.free;
var EXPECTED_RESPONSE_TYPES = /* @__PURE__ */ new Set(["basic", "cors", "default"]);
async function __wbg_load(module, imports) {
  if (typeof Response === "function" && module instanceof Response) {
    if (typeof WebAssembly.instantiateStreaming === "function") {
      try {
        return await WebAssembly.instantiateStreaming(module, imports);
      } catch (e) {
        const validResponse = module.ok && EXPECTED_RESPONSE_TYPES.has(module.type);
        if (validResponse && module.headers.get("Content-Type") !== "application/wasm") {
          console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve Wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n", e);
        } else {
          throw e;
        }
      }
    }
    const bytes = await module.arrayBuffer();
    return await WebAssembly.instantiate(bytes, imports);
  } else {
    const instance = await WebAssembly.instantiate(module, imports);
    if (instance instanceof WebAssembly.Instance) {
      return { instance, module };
    } else {
      return instance;
    }
  }
}
function __wbg_get_imports() {
  const imports = {};
  imports.wbg = {};
  imports.wbg.__wbg_BigInt_6adbfd8eb0f7ec07 = function(arg0) {
    const ret = BigInt(arg0);
    return ret;
  };
  imports.wbg.__wbg_Error_e17e777aac105295 = function(arg0, arg1) {
    const ret = Error(getStringFromWasm0(arg0, arg1));
    return ret;
  };
  imports.wbg.__wbg_String_8f0eb39a4a4c2f66 = function(arg0, arg1) {
    const ret = String(arg1);
    const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len1 = WASM_VECTOR_LEN;
    getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
    getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
  };
  imports.wbg.__wbg_apply_55d63d092a912d6f = function() {
    return handleError(function(arg0, arg1, arg2) {
      const ret = Reflect.apply(arg0, arg1, arg2);
      return ret;
    }, arguments);
  };
  imports.wbg.__wbg_assign_66f7942767cba7e3 = function(arg0, arg1) {
    const ret = Object.assign(arg0, arg1);
    return ret;
  };
  imports.wbg.__wbg_call_13410aac570ffff7 = function() {
    return handleError(function(arg0, arg1) {
      const ret = arg0.call(arg1);
      return ret;
    }, arguments);
  };
  imports.wbg.__wbg_call_a5400b25a865cfd8 = function() {
    return handleError(function(arg0, arg1, arg2) {
      const ret = arg0.call(arg1, arg2);
      return ret;
    }, arguments);
  };
  imports.wbg.__wbg_concat_4a5e81410543b8f3 = function(arg0, arg1) {
    const ret = arg0.concat(arg1);
    return ret;
  };
  imports.wbg.__wbg_defineProperty_1afba89a75bc184f = function(arg0, arg1, arg2) {
    const ret = Object.defineProperty(arg0, arg1, arg2);
    return ret;
  };
  imports.wbg.__wbg_deleteProperty_5fe99f4fd0f66ebe = function() {
    return handleError(function(arg0, arg1) {
      const ret = Reflect.deleteProperty(arg0, arg1);
      return ret;
    }, arguments);
  };
  imports.wbg.__wbg_done_75ed0ee6dd243d9d = function(arg0) {
    const ret = arg0.done;
    return ret;
  };
  imports.wbg.__wbg_entries_2be2f15bd5554996 = function(arg0) {
    const ret = Object.entries(arg0);
    return ret;
  };
  imports.wbg.__wbg_error_7534b8e9a36f1ab4 = function(arg0, arg1) {
    let deferred0_0;
    let deferred0_1;
    try {
      deferred0_0 = arg0;
      deferred0_1 = arg1;
      console.error(getStringFromWasm0(arg0, arg1));
    } finally {
      wasm.__wbindgen_free(deferred0_0, deferred0_1, 1);
    }
  };
  imports.wbg.__wbg_for_fbb1cf47b8d6b3f6 = function(arg0, arg1) {
    const ret = Symbol.for(getStringFromWasm0(arg0, arg1));
    return ret;
  };
  imports.wbg.__wbg_freeze_881cf93497533f9e = function(arg0) {
    const ret = Object.freeze(arg0);
    return ret;
  };
  imports.wbg.__wbg_from_88bc52ce20ba6318 = function(arg0) {
    const ret = Array.from(arg0);
    return ret;
  };
  imports.wbg.__wbg_getRandomValues_1c61fac11405ffdc = function() {
    return handleError(function(arg0, arg1) {
      globalThis.crypto.getRandomValues(getArrayU8FromWasm0(arg0, arg1));
    }, arguments);
  };
  imports.wbg.__wbg_getTime_6bb3f64e0f18f817 = function(arg0) {
    const ret = arg0.getTime();
    return ret;
  };
  imports.wbg.__wbg_get_0da715ceaecea5c8 = function(arg0, arg1) {
    const ret = arg0[arg1 >>> 0];
    return ret;
  };
  imports.wbg.__wbg_get_458e874b43b18b25 = function() {
    return handleError(function(arg0, arg1) {
      const ret = Reflect.get(arg0, arg1);
      return ret;
    }, arguments);
  };
  imports.wbg.__wbg_instanceof_ArrayBuffer_67f3012529f6a2dd = function(arg0) {
    let result;
    try {
      result = arg0 instanceof ArrayBuffer;
    } catch (_) {
      result = false;
    }
    const ret = result;
    return ret;
  };
  imports.wbg.__wbg_instanceof_Date_c0cdff0c3b978b0e = function(arg0) {
    let result;
    try {
      result = arg0 instanceof Date;
    } catch (_) {
      result = false;
    }
    const ret = result;
    return ret;
  };
  imports.wbg.__wbg_instanceof_Object_fbf5fef4952ff29b = function(arg0) {
    let result;
    try {
      result = arg0 instanceof Object;
    } catch (_) {
      result = false;
    }
    const ret = result;
    return ret;
  };
  imports.wbg.__wbg_instanceof_Uint8Array_9a8378d955933db7 = function(arg0) {
    let result;
    try {
      result = arg0 instanceof Uint8Array;
    } catch (_) {
      result = false;
    }
    const ret = result;
    return ret;
  };
  imports.wbg.__wbg_isArray_030cce220591fb41 = function(arg0) {
    const ret = Array.isArray(arg0);
    return ret;
  };
  imports.wbg.__wbg_isArray_52653600d4b65388 = function(arg0) {
    const ret = Array.isArray(arg0);
    return ret;
  };
  imports.wbg.__wbg_iterator_f370b34483c71a1c = function() {
    const ret = Symbol.iterator;
    return ret;
  };
  imports.wbg.__wbg_keys_ef52390b2ae0e714 = function(arg0) {
    const ret = Object.keys(arg0);
    return ret;
  };
  imports.wbg.__wbg_length_186546c51cd61acd = function(arg0) {
    const ret = arg0.length;
    return ret;
  };
  imports.wbg.__wbg_length_6bb7e81f9d7713e4 = function(arg0) {
    const ret = arg0.length;
    return ret;
  };
  imports.wbg.__wbg_length_9d771c54845e987f = function(arg0) {
    const ret = arg0.length;
    return ret;
  };
  imports.wbg.__wbg_log_6c7b5f4f00b8ce3f = function(arg0) {
    console.log(arg0);
  };
  imports.wbg.__wbg_log_7917fde260a8fd39 = function(arg0, arg1) {
    console.log(arg0, arg1);
  };
  imports.wbg.__wbg_new_19c25a3f2fa63a02 = function() {
    const ret = new Object();
    return ret;
  };
  imports.wbg.__wbg_new_1f3a344cf3123716 = function() {
    const ret = new Array();
    return ret;
  };
  imports.wbg.__wbg_new_5a2ae4557f92b50e = function(arg0) {
    const ret = new Date(arg0);
    return ret;
  };
  imports.wbg.__wbg_new_638ebfaedbf32a5e = function(arg0) {
    const ret = new Uint8Array(arg0);
    return ret;
  };
  imports.wbg.__wbg_new_8a6f238a6ece86ea = function() {
    const ret = new Error();
    return ret;
  };
  imports.wbg.__wbg_new_da9dc54c5db29dfa = function(arg0, arg1) {
    const ret = new Error(getStringFromWasm0(arg0, arg1));
    return ret;
  };
  imports.wbg.__wbg_new_ef4f9056d946f38b = function(arg0, arg1) {
    const ret = new RangeError(getStringFromWasm0(arg0, arg1));
    return ret;
  };
  imports.wbg.__wbg_newfromslice_074c56947bd43469 = function(arg0, arg1) {
    const ret = new Uint8Array(getArrayU8FromWasm0(arg0, arg1));
    return ret;
  };
  imports.wbg.__wbg_next_5b3530e612fde77d = function(arg0) {
    const ret = arg0.next;
    return ret;
  };
  imports.wbg.__wbg_next_692e82279131b03c = function() {
    return handleError(function(arg0) {
      const ret = arg0.next();
      return ret;
    }, arguments);
  };
  imports.wbg.__wbg_ownKeys_36e096e00ffe2676 = function() {
    return handleError(function(arg0) {
      const ret = Reflect.ownKeys(arg0);
      return ret;
    }, arguments);
  };
  imports.wbg.__wbg_prototypesetcall_3d4a26c1ed734349 = function(arg0, arg1, arg2) {
    Uint8Array.prototype.set.call(getArrayU8FromWasm0(arg0, arg1), arg2);
  };
  imports.wbg.__wbg_push_330b2eb93e4e1212 = function(arg0, arg1) {
    const ret = arg0.push(arg1);
    return ret;
  };
  imports.wbg.__wbg_set_3f1d0b984ed272ed = function(arg0, arg1, arg2) {
    arg0[arg1] = arg2;
  };
  imports.wbg.__wbg_set_453345bcda80b89a = function() {
    return handleError(function(arg0, arg1, arg2) {
      const ret = Reflect.set(arg0, arg1, arg2);
      return ret;
    }, arguments);
  };
  imports.wbg.__wbg_set_90f6c0f7bd8c0415 = function(arg0, arg1, arg2) {
    arg0[arg1 >>> 0] = arg2;
  };
  imports.wbg.__wbg_slice_974daea329f5c01d = function(arg0, arg1, arg2) {
    const ret = arg0.slice(arg1 >>> 0, arg2 >>> 0);
    return ret;
  };
  imports.wbg.__wbg_stack_0ed75d68575b0f3c = function(arg0, arg1) {
    const ret = arg1.stack;
    const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len1 = WASM_VECTOR_LEN;
    getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
    getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
  };
  imports.wbg.__wbg_stringify_4a34a65f0d4e236f = function(arg0, arg1) {
    const ret = JSON.stringify(arg1);
    var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    var len1 = WASM_VECTOR_LEN;
    getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
    getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
  };
  imports.wbg.__wbg_toString_1f1286a7a97689fe = function(arg0, arg1, arg2) {
    const ret = arg1.toString(arg2);
    const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len1 = WASM_VECTOR_LEN;
    getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
    getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
  };
  imports.wbg.__wbg_toString_7268338f40012a03 = function() {
    return handleError(function(arg0, arg1) {
      const ret = arg0.toString(arg1);
      return ret;
    }, arguments);
  };
  imports.wbg.__wbg_toString_ea9a6b07f936eb86 = function(arg0) {
    const ret = arg0.toString();
    return ret;
  };
  imports.wbg.__wbg_unshift_18d353edeebf9a72 = function(arg0, arg1) {
    const ret = arg0.unshift(arg1);
    return ret;
  };
  imports.wbg.__wbg_value_dd9372230531eade = function(arg0) {
    const ret = arg0.value;
    return ret;
  };
  imports.wbg.__wbg_values_a574c29011369bea = function(arg0) {
    const ret = Object.values(arg0);
    return ret;
  };
  imports.wbg.__wbg_wbindgenbooleanget_3fe6f642c7d97746 = function(arg0) {
    const v = arg0;
    const ret = typeof v === "boolean" ? v : void 0;
    return isLikeNone(ret) ? 16777215 : ret ? 1 : 0;
  };
  imports.wbg.__wbg_wbindgendebugstring_99ef257a3ddda34d = function(arg0, arg1) {
    const ret = debugString(arg1);
    const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len1 = WASM_VECTOR_LEN;
    getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
    getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
  };
  imports.wbg.__wbg_wbindgengt_5d4c5d18810de162 = function(arg0, arg1) {
    const ret = arg0 > arg1;
    return ret;
  };
  imports.wbg.__wbg_wbindgenisbigint_ecb90cc08a5a9154 = function(arg0) {
    const ret = typeof arg0 === "bigint";
    return ret;
  };
  imports.wbg.__wbg_wbindgenisfunction_8cee7dce3725ae74 = function(arg0) {
    const ret = typeof arg0 === "function";
    return ret;
  };
  imports.wbg.__wbg_wbindgenisnull_f3037694abe4d97a = function(arg0) {
    const ret = arg0 === null;
    return ret;
  };
  imports.wbg.__wbg_wbindgenisobject_307a53c6bd97fbf8 = function(arg0) {
    const val = arg0;
    const ret = typeof val === "object" && val !== null;
    return ret;
  };
  imports.wbg.__wbg_wbindgenisstring_d4fa939789f003b0 = function(arg0) {
    const ret = typeof arg0 === "string";
    return ret;
  };
  imports.wbg.__wbg_wbindgenisundefined_c4b71d073b92f3c5 = function(arg0) {
    const ret = arg0 === void 0;
    return ret;
  };
  imports.wbg.__wbg_wbindgenjsvallooseeq_9bec8c9be826bed1 = function(arg0, arg1) {
    const ret = arg0 == arg1;
    return ret;
  };
  imports.wbg.__wbg_wbindgenlt_544155a2b3097bd5 = function(arg0, arg1) {
    const ret = arg0 < arg1;
    return ret;
  };
  imports.wbg.__wbg_wbindgenneg_3577d8a6fd6fd98b = function(arg0) {
    const ret = -arg0;
    return ret;
  };
  imports.wbg.__wbg_wbindgennumberget_f74b4c7525ac05cb = function(arg0, arg1) {
    const obj = arg1;
    const ret = typeof obj === "number" ? obj : void 0;
    getDataViewMemory0().setFloat64(arg0 + 8 * 1, isLikeNone(ret) ? 0 : ret, true);
    getDataViewMemory0().setInt32(arg0 + 4 * 0, !isLikeNone(ret), true);
  };
  imports.wbg.__wbg_wbindgenstringget_0f16a6ddddef376f = function(arg0, arg1) {
    const obj = arg1;
    const ret = typeof obj === "string" ? obj : void 0;
    var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    var len1 = WASM_VECTOR_LEN;
    getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
    getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
  };
  imports.wbg.__wbg_wbindgenthrow_451ec1a8469d7eb6 = function(arg0, arg1) {
    throw new Error(getStringFromWasm0(arg0, arg1));
  };
  imports.wbg.__wbindgen_cast_2241b6af4c4b2941 = function(arg0, arg1) {
    const ret = getStringFromWasm0(arg0, arg1);
    return ret;
  };
  imports.wbg.__wbindgen_cast_4625c577ab2ec9ee = function(arg0) {
    const ret = BigInt.asUintN(64, arg0);
    return ret;
  };
  imports.wbg.__wbindgen_cast_9ae0607507abb057 = function(arg0) {
    const ret = arg0;
    return ret;
  };
  imports.wbg.__wbindgen_cast_d6cd19b81560fd6e = function(arg0) {
    const ret = arg0;
    return ret;
  };
  imports.wbg.__wbindgen_init_externref_table = function() {
    const table = wasm.__wbindgen_export_4;
    const offset = table.grow(4);
    table.set(0, void 0);
    table.set(offset + 0, void 0);
    table.set(offset + 1, null);
    table.set(offset + 2, true);
    table.set(offset + 3, false);
    ;
  };
  return imports;
}
function __wbg_init_memory(imports, memory) {
}
function __wbg_finalize_init(instance, module) {
  wasm = instance.exports;
  __wbg_init.__wbindgen_wasm_module = module;
  cachedDataViewMemory0 = null;
  cachedUint8ArrayMemory0 = null;
  wasm.__wbindgen_start();
  return wasm;
}
function initSync(module) {
  if (wasm !== void 0) return wasm;
  if (typeof module !== "undefined") {
    if (Object.getPrototypeOf(module) === Object.prototype) {
      ({ module } = module);
    } else {
      console.warn("using deprecated parameters for `initSync()`; pass a single object instead");
    }
  }
  const imports = __wbg_get_imports();
  __wbg_init_memory(imports);
  if (!(module instanceof WebAssembly.Module)) {
    module = new WebAssembly.Module(module);
  }
  const instance = new WebAssembly.Instance(module, imports);
  return __wbg_finalize_init(instance, module);
}
async function __wbg_init(module_or_path) {
  if (wasm !== void 0) return wasm;
  if (typeof module_or_path !== "undefined") {
    if (Object.getPrototypeOf(module_or_path) === Object.prototype) {
      ({ module_or_path } = module_or_path);
    } else {
      console.warn("using deprecated parameters for the initialization function; pass a single object instead");
    }
  }
  if (typeof module_or_path === "undefined") {
    module_or_path = new /* @vite-ignore */
    URL("automerge_wasm_bg.wasm", import.meta.url);
  }
  const imports = __wbg_get_imports();
  if (typeof module_or_path === "string" || typeof Request === "function" && module_or_path instanceof Request || typeof URL === "function" && module_or_path instanceof URL) {
    module_or_path = fetch(module_or_path);
  }
  __wbg_init_memory(imports);
  const { instance, module } = await __wbg_load(await module_or_path, imports);
  return __wbg_finalize_init(instance, module);
}
var automerge_wasm_default = __wbg_init;

// client/node_modules/@automerge/automerge/dist/mjs/low_level.js
var _initialized = false;
var _initializeListeners = [];
function UseApi(api) {
  for (const k in api) {
    ;
    ApiHandler[k] = api[k];
  }
  _initialized = true;
  for (const listener of _initializeListeners) {
    listener();
  }
}
var ApiHandler = {
  create(options) {
    throw new RangeError("Automerge.use() not called");
  },
  load(data, options) {
    throw new RangeError("Automerge.use() not called (load)");
  },
  encodeChange(change2) {
    throw new RangeError("Automerge.use() not called (encodeChange)");
  },
  decodeChange(change2) {
    throw new RangeError("Automerge.use() not called (decodeChange)");
  },
  initSyncState() {
    throw new RangeError("Automerge.use() not called (initSyncState)");
  },
  encodeSyncMessage(message) {
    throw new RangeError("Automerge.use() not called (encodeSyncMessage)");
  },
  decodeSyncMessage(msg) {
    throw new RangeError("Automerge.use() not called (decodeSyncMessage)");
  },
  encodeSyncState(state) {
    throw new RangeError("Automerge.use() not called (encodeSyncState)");
  },
  decodeSyncState(data) {
    throw new RangeError("Automerge.use() not called (decodeSyncState)");
  },
  exportSyncState(state) {
    throw new RangeError("Automerge.use() not called (exportSyncState)");
  },
  importSyncState(state) {
    throw new RangeError("Automerge.use() not called (importSyncState)");
  },
  readBundle(data) {
    throw new RangeError("Automerge.use() not called (readBundle)");
  }
};
function initializeWasm(wasmBlob) {
  return automerge_wasm_default({ module_or_path: wasmBlob }).then((_) => {
    UseApi(automerge_wasm_exports);
  });
}
function initializeBase64Wasm(wasmBase64) {
  return initializeWasm(Uint8Array.from(atob(wasmBase64), (c) => c.charCodeAt(0)));
}
function wasmInitialized() {
  if (_initialized)
    return Promise.resolve();
  return new Promise((resolve) => {
    _initializeListeners.push(resolve);
  });
}
function isWasmInitialized() {
  return _initialized;
}

// client/node_modules/@automerge/automerge/dist/mjs/wasm_bindgen_output/bundler/automerge_wasm.js
var automerge_wasm_exports2 = {};
__export(automerge_wasm_exports2, {
  Automerge: () => Automerge2,
  SyncState: () => SyncState2,
  __wbg_BigInt_6adbfd8eb0f7ec07: () => __wbg_BigInt_6adbfd8eb0f7ec07,
  __wbg_Error_e17e777aac105295: () => __wbg_Error_e17e777aac105295,
  __wbg_String_8f0eb39a4a4c2f66: () => __wbg_String_8f0eb39a4a4c2f66,
  __wbg_apply_55d63d092a912d6f: () => __wbg_apply_55d63d092a912d6f,
  __wbg_assign_66f7942767cba7e3: () => __wbg_assign_66f7942767cba7e3,
  __wbg_call_13410aac570ffff7: () => __wbg_call_13410aac570ffff7,
  __wbg_call_a5400b25a865cfd8: () => __wbg_call_a5400b25a865cfd8,
  __wbg_concat_4a5e81410543b8f3: () => __wbg_concat_4a5e81410543b8f3,
  __wbg_defineProperty_1afba89a75bc184f: () => __wbg_defineProperty_1afba89a75bc184f,
  __wbg_deleteProperty_5fe99f4fd0f66ebe: () => __wbg_deleteProperty_5fe99f4fd0f66ebe,
  __wbg_done_75ed0ee6dd243d9d: () => __wbg_done_75ed0ee6dd243d9d,
  __wbg_entries_2be2f15bd5554996: () => __wbg_entries_2be2f15bd5554996,
  __wbg_error_7534b8e9a36f1ab4: () => __wbg_error_7534b8e9a36f1ab4,
  __wbg_for_fbb1cf47b8d6b3f6: () => __wbg_for_fbb1cf47b8d6b3f6,
  __wbg_freeze_881cf93497533f9e: () => __wbg_freeze_881cf93497533f9e,
  __wbg_from_88bc52ce20ba6318: () => __wbg_from_88bc52ce20ba6318,
  __wbg_getRandomValues_1c61fac11405ffdc: () => __wbg_getRandomValues_1c61fac11405ffdc,
  __wbg_getTime_6bb3f64e0f18f817: () => __wbg_getTime_6bb3f64e0f18f817,
  __wbg_get_0da715ceaecea5c8: () => __wbg_get_0da715ceaecea5c8,
  __wbg_get_458e874b43b18b25: () => __wbg_get_458e874b43b18b25,
  __wbg_instanceof_ArrayBuffer_67f3012529f6a2dd: () => __wbg_instanceof_ArrayBuffer_67f3012529f6a2dd,
  __wbg_instanceof_Date_c0cdff0c3b978b0e: () => __wbg_instanceof_Date_c0cdff0c3b978b0e,
  __wbg_instanceof_Object_fbf5fef4952ff29b: () => __wbg_instanceof_Object_fbf5fef4952ff29b,
  __wbg_instanceof_Uint8Array_9a8378d955933db7: () => __wbg_instanceof_Uint8Array_9a8378d955933db7,
  __wbg_isArray_030cce220591fb41: () => __wbg_isArray_030cce220591fb41,
  __wbg_isArray_52653600d4b65388: () => __wbg_isArray_52653600d4b65388,
  __wbg_iterator_f370b34483c71a1c: () => __wbg_iterator_f370b34483c71a1c,
  __wbg_keys_ef52390b2ae0e714: () => __wbg_keys_ef52390b2ae0e714,
  __wbg_length_186546c51cd61acd: () => __wbg_length_186546c51cd61acd,
  __wbg_length_6bb7e81f9d7713e4: () => __wbg_length_6bb7e81f9d7713e4,
  __wbg_length_9d771c54845e987f: () => __wbg_length_9d771c54845e987f,
  __wbg_log_6c7b5f4f00b8ce3f: () => __wbg_log_6c7b5f4f00b8ce3f,
  __wbg_log_7917fde260a8fd39: () => __wbg_log_7917fde260a8fd39,
  __wbg_new_19c25a3f2fa63a02: () => __wbg_new_19c25a3f2fa63a02,
  __wbg_new_1f3a344cf3123716: () => __wbg_new_1f3a344cf3123716,
  __wbg_new_5a2ae4557f92b50e: () => __wbg_new_5a2ae4557f92b50e,
  __wbg_new_638ebfaedbf32a5e: () => __wbg_new_638ebfaedbf32a5e,
  __wbg_new_8a6f238a6ece86ea: () => __wbg_new_8a6f238a6ece86ea,
  __wbg_new_da9dc54c5db29dfa: () => __wbg_new_da9dc54c5db29dfa,
  __wbg_new_ef4f9056d946f38b: () => __wbg_new_ef4f9056d946f38b,
  __wbg_newfromslice_074c56947bd43469: () => __wbg_newfromslice_074c56947bd43469,
  __wbg_next_5b3530e612fde77d: () => __wbg_next_5b3530e612fde77d,
  __wbg_next_692e82279131b03c: () => __wbg_next_692e82279131b03c,
  __wbg_ownKeys_36e096e00ffe2676: () => __wbg_ownKeys_36e096e00ffe2676,
  __wbg_prototypesetcall_3d4a26c1ed734349: () => __wbg_prototypesetcall_3d4a26c1ed734349,
  __wbg_push_330b2eb93e4e1212: () => __wbg_push_330b2eb93e4e1212,
  __wbg_set_3f1d0b984ed272ed: () => __wbg_set_3f1d0b984ed272ed,
  __wbg_set_453345bcda80b89a: () => __wbg_set_453345bcda80b89a,
  __wbg_set_90f6c0f7bd8c0415: () => __wbg_set_90f6c0f7bd8c0415,
  __wbg_set_wasm: () => __wbg_set_wasm,
  __wbg_slice_974daea329f5c01d: () => __wbg_slice_974daea329f5c01d,
  __wbg_stack_0ed75d68575b0f3c: () => __wbg_stack_0ed75d68575b0f3c,
  __wbg_stringify_4a34a65f0d4e236f: () => __wbg_stringify_4a34a65f0d4e236f,
  __wbg_toString_1f1286a7a97689fe: () => __wbg_toString_1f1286a7a97689fe,
  __wbg_toString_7268338f40012a03: () => __wbg_toString_7268338f40012a03,
  __wbg_toString_ea9a6b07f936eb86: () => __wbg_toString_ea9a6b07f936eb86,
  __wbg_unshift_18d353edeebf9a72: () => __wbg_unshift_18d353edeebf9a72,
  __wbg_value_dd9372230531eade: () => __wbg_value_dd9372230531eade,
  __wbg_values_a574c29011369bea: () => __wbg_values_a574c29011369bea,
  __wbg_wbindgenbooleanget_3fe6f642c7d97746: () => __wbg_wbindgenbooleanget_3fe6f642c7d97746,
  __wbg_wbindgendebugstring_99ef257a3ddda34d: () => __wbg_wbindgendebugstring_99ef257a3ddda34d,
  __wbg_wbindgengt_5d4c5d18810de162: () => __wbg_wbindgengt_5d4c5d18810de162,
  __wbg_wbindgenisbigint_ecb90cc08a5a9154: () => __wbg_wbindgenisbigint_ecb90cc08a5a9154,
  __wbg_wbindgenisfunction_8cee7dce3725ae74: () => __wbg_wbindgenisfunction_8cee7dce3725ae74,
  __wbg_wbindgenisnull_f3037694abe4d97a: () => __wbg_wbindgenisnull_f3037694abe4d97a,
  __wbg_wbindgenisobject_307a53c6bd97fbf8: () => __wbg_wbindgenisobject_307a53c6bd97fbf8,
  __wbg_wbindgenisstring_d4fa939789f003b0: () => __wbg_wbindgenisstring_d4fa939789f003b0,
  __wbg_wbindgenisundefined_c4b71d073b92f3c5: () => __wbg_wbindgenisundefined_c4b71d073b92f3c5,
  __wbg_wbindgenjsvallooseeq_9bec8c9be826bed1: () => __wbg_wbindgenjsvallooseeq_9bec8c9be826bed1,
  __wbg_wbindgenlt_544155a2b3097bd5: () => __wbg_wbindgenlt_544155a2b3097bd5,
  __wbg_wbindgenneg_3577d8a6fd6fd98b: () => __wbg_wbindgenneg_3577d8a6fd6fd98b,
  __wbg_wbindgennumberget_f74b4c7525ac05cb: () => __wbg_wbindgennumberget_f74b4c7525ac05cb,
  __wbg_wbindgenstringget_0f16a6ddddef376f: () => __wbg_wbindgenstringget_0f16a6ddddef376f,
  __wbg_wbindgenthrow_451ec1a8469d7eb6: () => __wbg_wbindgenthrow_451ec1a8469d7eb6,
  __wbindgen_cast_2241b6af4c4b2941: () => __wbindgen_cast_2241b6af4c4b2941,
  __wbindgen_cast_4625c577ab2ec9ee: () => __wbindgen_cast_4625c577ab2ec9ee,
  __wbindgen_cast_9ae0607507abb057: () => __wbindgen_cast_9ae0607507abb057,
  __wbindgen_cast_d6cd19b81560fd6e: () => __wbindgen_cast_d6cd19b81560fd6e,
  __wbindgen_init_externref_table: () => __wbindgen_init_externref_table,
  create: () => create2,
  decodeChange: () => decodeChange2,
  decodeSyncMessage: () => decodeSyncMessage2,
  decodeSyncState: () => decodeSyncState2,
  encodeChange: () => encodeChange2,
  encodeSyncMessage: () => encodeSyncMessage2,
  encodeSyncState: () => encodeSyncState2,
  exportSyncState: () => exportSyncState2,
  importSyncState: () => importSyncState2,
  initSyncState: () => initSyncState2,
  load: () => load2,
  readBundle: () => readBundle2
});
import * as wasm3 from "/home/fant/VsCode/sync-redactor/client/node_modules/@automerge/automerge/dist/mjs/wasm_bindgen_output/bundler/automerge_wasm_bg.wasm";

// client/node_modules/@automerge/automerge/dist/mjs/wasm_bindgen_output/bundler/automerge_wasm_bg.js
var wasm2;
function __wbg_set_wasm(val) {
  wasm2 = val;
}
var cachedUint8ArrayMemory02 = null;
function getUint8ArrayMemory02() {
  if (cachedUint8ArrayMemory02 === null || cachedUint8ArrayMemory02.byteLength === 0) {
    cachedUint8ArrayMemory02 = new Uint8Array(wasm2.memory.buffer);
  }
  return cachedUint8ArrayMemory02;
}
var cachedTextDecoder2 = new TextDecoder("utf-8", { ignoreBOM: true, fatal: true });
cachedTextDecoder2.decode();
var MAX_SAFARI_DECODE_BYTES2 = 2146435072;
var numBytesDecoded2 = 0;
function decodeText2(ptr, len) {
  numBytesDecoded2 += len;
  if (numBytesDecoded2 >= MAX_SAFARI_DECODE_BYTES2) {
    cachedTextDecoder2 = new TextDecoder("utf-8", { ignoreBOM: true, fatal: true });
    cachedTextDecoder2.decode();
    numBytesDecoded2 = len;
  }
  return cachedTextDecoder2.decode(getUint8ArrayMemory02().subarray(ptr, ptr + len));
}
function getStringFromWasm02(ptr, len) {
  ptr = ptr >>> 0;
  return decodeText2(ptr, len);
}
var WASM_VECTOR_LEN2 = 0;
var cachedTextEncoder2 = new TextEncoder();
if (!("encodeInto" in cachedTextEncoder2)) {
  cachedTextEncoder2.encodeInto = function(arg, view2) {
    const buf = cachedTextEncoder2.encode(arg);
    view2.set(buf);
    return {
      read: arg.length,
      written: buf.length
    };
  };
}
function passStringToWasm02(arg, malloc, realloc) {
  if (realloc === void 0) {
    const buf = cachedTextEncoder2.encode(arg);
    const ptr2 = malloc(buf.length, 1) >>> 0;
    getUint8ArrayMemory02().subarray(ptr2, ptr2 + buf.length).set(buf);
    WASM_VECTOR_LEN2 = buf.length;
    return ptr2;
  }
  let len = arg.length;
  let ptr = malloc(len, 1) >>> 0;
  const mem = getUint8ArrayMemory02();
  let offset = 0;
  for (; offset < len; offset++) {
    const code = arg.charCodeAt(offset);
    if (code > 127) break;
    mem[ptr + offset] = code;
  }
  if (offset !== len) {
    if (offset !== 0) {
      arg = arg.slice(offset);
    }
    ptr = realloc(ptr, len, len = offset + arg.length * 3, 1) >>> 0;
    const view2 = getUint8ArrayMemory02().subarray(ptr + offset, ptr + len);
    const ret = cachedTextEncoder2.encodeInto(arg, view2);
    offset += ret.written;
    ptr = realloc(ptr, len, offset, 1) >>> 0;
  }
  WASM_VECTOR_LEN2 = offset;
  return ptr;
}
var cachedDataViewMemory02 = null;
function getDataViewMemory02() {
  if (cachedDataViewMemory02 === null || cachedDataViewMemory02.buffer.detached === true || cachedDataViewMemory02.buffer.detached === void 0 && cachedDataViewMemory02.buffer !== wasm2.memory.buffer) {
    cachedDataViewMemory02 = new DataView(wasm2.memory.buffer);
  }
  return cachedDataViewMemory02;
}
function addToExternrefTable02(obj) {
  const idx = wasm2.__externref_table_alloc();
  wasm2.__wbindgen_export_4.set(idx, obj);
  return idx;
}
function handleError2(f, args) {
  try {
    return f.apply(this, args);
  } catch (e) {
    const idx = addToExternrefTable02(e);
    wasm2.__wbindgen_exn_store(idx);
  }
}
function getArrayU8FromWasm02(ptr, len) {
  ptr = ptr >>> 0;
  return getUint8ArrayMemory02().subarray(ptr / 1, ptr / 1 + len);
}
function isLikeNone2(x) {
  return x === void 0 || x === null;
}
function debugString2(val) {
  const type = typeof val;
  if (type == "number" || type == "boolean" || val == null) {
    return `${val}`;
  }
  if (type == "string") {
    return `"${val}"`;
  }
  if (type == "symbol") {
    const description = val.description;
    if (description == null) {
      return "Symbol";
    } else {
      return `Symbol(${description})`;
    }
  }
  if (type == "function") {
    const name = val.name;
    if (typeof name == "string" && name.length > 0) {
      return `Function(${name})`;
    } else {
      return "Function";
    }
  }
  if (Array.isArray(val)) {
    const length = val.length;
    let debug = "[";
    if (length > 0) {
      debug += debugString2(val[0]);
    }
    for (let i = 1; i < length; i++) {
      debug += ", " + debugString2(val[i]);
    }
    debug += "]";
    return debug;
  }
  const builtInMatches = /\[object ([^\]]+)\]/.exec(toString.call(val));
  let className;
  if (builtInMatches && builtInMatches.length > 1) {
    className = builtInMatches[1];
  } else {
    return toString.call(val);
  }
  if (className == "Object") {
    try {
      return "Object(" + JSON.stringify(val) + ")";
    } catch (_) {
      return "Object";
    }
  }
  if (val instanceof Error) {
    return `${val.name}: ${val.message}
${val.stack}`;
  }
  return className;
}
function takeFromExternrefTable02(idx) {
  const value = wasm2.__wbindgen_export_4.get(idx);
  wasm2.__externref_table_dealloc(idx);
  return value;
}
function _assertClass2(instance, klass) {
  if (!(instance instanceof klass)) {
    throw new Error(`expected instance of ${klass.name}`);
  }
}
function create2(options) {
  const ret = wasm2.create(options);
  if (ret[2]) {
    throw takeFromExternrefTable02(ret[1]);
  }
  return Automerge2.__wrap(ret[0]);
}
function load2(data, options) {
  const ret = wasm2.load(data, options);
  if (ret[2]) {
    throw takeFromExternrefTable02(ret[1]);
  }
  return Automerge2.__wrap(ret[0]);
}
function encodeChange2(change2) {
  const ret = wasm2.encodeChange(change2);
  if (ret[2]) {
    throw takeFromExternrefTable02(ret[1]);
  }
  return takeFromExternrefTable02(ret[0]);
}
function decodeChange2(change2) {
  const ret = wasm2.decodeChange(change2);
  if (ret[2]) {
    throw takeFromExternrefTable02(ret[1]);
  }
  return takeFromExternrefTable02(ret[0]);
}
function initSyncState2() {
  const ret = wasm2.initSyncState();
  return SyncState2.__wrap(ret);
}
function importSyncState2(state) {
  const ret = wasm2.importSyncState(state);
  if (ret[2]) {
    throw takeFromExternrefTable02(ret[1]);
  }
  return SyncState2.__wrap(ret[0]);
}
function exportSyncState2(state) {
  _assertClass2(state, SyncState2);
  const ret = wasm2.exportSyncState(state.__wbg_ptr);
  return ret;
}
function encodeSyncMessage2(message) {
  const ret = wasm2.encodeSyncMessage(message);
  if (ret[2]) {
    throw takeFromExternrefTable02(ret[1]);
  }
  return takeFromExternrefTable02(ret[0]);
}
function decodeSyncMessage2(msg) {
  const ret = wasm2.decodeSyncMessage(msg);
  if (ret[2]) {
    throw takeFromExternrefTable02(ret[1]);
  }
  return takeFromExternrefTable02(ret[0]);
}
function encodeSyncState2(state) {
  _assertClass2(state, SyncState2);
  const ret = wasm2.encodeSyncState(state.__wbg_ptr);
  return ret;
}
function decodeSyncState2(data) {
  const ret = wasm2.decodeSyncState(data);
  if (ret[2]) {
    throw takeFromExternrefTable02(ret[1]);
  }
  return SyncState2.__wrap(ret[0]);
}
function readBundle2(bundle) {
  const ret = wasm2.readBundle(bundle);
  if (ret[2]) {
    throw takeFromExternrefTable02(ret[1]);
  }
  return takeFromExternrefTable02(ret[0]);
}
var AutomergeFinalization2 = typeof FinalizationRegistry === "undefined" ? { register: () => {
}, unregister: () => {
} } : new FinalizationRegistry((ptr) => wasm2.__wbg_automerge_free(ptr >>> 0, 1));
var Automerge2 = class _Automerge {
  static __wrap(ptr) {
    ptr = ptr >>> 0;
    const obj = Object.create(_Automerge.prototype);
    obj.__wbg_ptr = ptr;
    AutomergeFinalization2.register(obj, obj.__wbg_ptr, obj);
    return obj;
  }
  __destroy_into_raw() {
    const ptr = this.__wbg_ptr;
    this.__wbg_ptr = 0;
    AutomergeFinalization2.unregister(this);
    return ptr;
  }
  free() {
    const ptr = this.__destroy_into_raw();
    wasm2.__wbg_automerge_free(ptr, 0);
  }
  /**
   * @param {string | null} [actor]
   * @returns {Automerge}
   */
  static new(actor) {
    var ptr0 = isLikeNone2(actor) ? 0 : passStringToWasm02(actor, wasm2.__wbindgen_malloc, wasm2.__wbindgen_realloc);
    var len0 = WASM_VECTOR_LEN2;
    const ret = wasm2.automerge_new(ptr0, len0);
    if (ret[2]) {
      throw takeFromExternrefTable02(ret[1]);
    }
    return _Automerge.__wrap(ret[0]);
  }
  /**
   * @param {string | null} [actor]
   * @returns {Automerge}
   */
  clone(actor) {
    var ptr0 = isLikeNone2(actor) ? 0 : passStringToWasm02(actor, wasm2.__wbindgen_malloc, wasm2.__wbindgen_realloc);
    var len0 = WASM_VECTOR_LEN2;
    const ret = wasm2.automerge_clone(this.__wbg_ptr, ptr0, len0);
    if (ret[2]) {
      throw takeFromExternrefTable02(ret[1]);
    }
    return _Automerge.__wrap(ret[0]);
  }
  /**
   * @param {string | null | undefined} actor
   * @param {any} heads
   * @returns {Automerge}
   */
  fork(actor, heads) {
    var ptr0 = isLikeNone2(actor) ? 0 : passStringToWasm02(actor, wasm2.__wbindgen_malloc, wasm2.__wbindgen_realloc);
    var len0 = WASM_VECTOR_LEN2;
    const ret = wasm2.automerge_fork(this.__wbg_ptr, ptr0, len0, heads);
    if (ret[2]) {
      throw takeFromExternrefTable02(ret[1]);
    }
    return _Automerge.__wrap(ret[0]);
  }
  /**
   * @returns {number}
   */
  pendingOps() {
    const ret = wasm2.automerge_pendingOps(this.__wbg_ptr);
    return ret;
  }
  /**
   * @param {string | null} [message]
   * @param {number | null} [time]
   * @returns {Hash | null}
   */
  commit(message, time) {
    var ptr0 = isLikeNone2(message) ? 0 : passStringToWasm02(message, wasm2.__wbindgen_malloc, wasm2.__wbindgen_realloc);
    var len0 = WASM_VECTOR_LEN2;
    const ret = wasm2.automerge_commit(this.__wbg_ptr, ptr0, len0, !isLikeNone2(time), isLikeNone2(time) ? 0 : time);
    return ret;
  }
  /**
   * @param {Automerge} other
   * @returns {Heads}
   */
  merge(other) {
    _assertClass2(other, _Automerge);
    const ret = wasm2.automerge_merge(this.__wbg_ptr, other.__wbg_ptr);
    if (ret[2]) {
      throw takeFromExternrefTable02(ret[1]);
    }
    return takeFromExternrefTable02(ret[0]);
  }
  /**
   * @returns {number}
   */
  rollback() {
    const ret = wasm2.automerge_rollback(this.__wbg_ptr);
    return ret;
  }
  /**
   * @param {any} obj
   * @param {Array<any> | null} [heads]
   * @returns {Array<any>}
   */
  keys(obj, heads) {
    const ret = wasm2.automerge_keys(this.__wbg_ptr, obj, isLikeNone2(heads) ? 0 : addToExternrefTable02(heads));
    if (ret[2]) {
      throw takeFromExternrefTable02(ret[1]);
    }
    return takeFromExternrefTable02(ret[0]);
  }
  /**
   * @param {any} obj
   * @param {Array<any> | null} [heads]
   * @returns {string}
   */
  text(obj, heads) {
    let deferred2_0;
    let deferred2_1;
    try {
      const ret = wasm2.automerge_text(this.__wbg_ptr, obj, isLikeNone2(heads) ? 0 : addToExternrefTable02(heads));
      var ptr1 = ret[0];
      var len1 = ret[1];
      if (ret[3]) {
        ptr1 = 0;
        len1 = 0;
        throw takeFromExternrefTable02(ret[2]);
      }
      deferred2_0 = ptr1;
      deferred2_1 = len1;
      return getStringFromWasm02(ptr1, len1);
    } finally {
      wasm2.__wbindgen_free(deferred2_0, deferred2_1, 1);
    }
  }
  /**
   * @param {any} obj
   * @param {Array<any> | null} [heads]
   * @returns {Array<any>}
   */
  spans(obj, heads) {
    const ret = wasm2.automerge_spans(this.__wbg_ptr, obj, isLikeNone2(heads) ? 0 : addToExternrefTable02(heads));
    if (ret[2]) {
      throw takeFromExternrefTable02(ret[1]);
    }
    return takeFromExternrefTable02(ret[0]);
  }
  /**
   * @param {any} obj
   * @param {number} start
   * @param {number} delete_count
   * @param {any} text
   */
  splice(obj, start, delete_count, text) {
    const ret = wasm2.automerge_splice(this.__wbg_ptr, obj, start, delete_count, text);
    if (ret[1]) {
      throw takeFromExternrefTable02(ret[0]);
    }
  }
  /**
   * @param {ObjID} obj
   * @param {string} new_text
   */
  updateText(obj, new_text) {
    const ret = wasm2.automerge_updateText(this.__wbg_ptr, obj, new_text);
    if (ret[1]) {
      throw takeFromExternrefTable02(ret[0]);
    }
  }
  /**
   * @param {ObjID} obj
   * @param {Span[]} args
   * @param {UpdateSpansConfig | undefined | null} config
   */
  updateSpans(obj, args, config) {
    const ret = wasm2.automerge_updateSpans(this.__wbg_ptr, obj, args, config);
    if (ret[1]) {
      throw takeFromExternrefTable02(ret[0]);
    }
  }
  /**
   * @param {any} obj
   * @param {any} value
   * @param {any} datatype
   */
  push(obj, value, datatype) {
    const ret = wasm2.automerge_push(this.__wbg_ptr, obj, value, datatype);
    if (ret[1]) {
      throw takeFromExternrefTable02(ret[0]);
    }
  }
  /**
   * @param {ObjID} obj
   * @param {ObjType} value
   * @returns {ObjID}
   */
  pushObject(obj, value) {
    let deferred2_0;
    let deferred2_1;
    try {
      const ret = wasm2.automerge_pushObject(this.__wbg_ptr, obj, value);
      var ptr1 = ret[0];
      var len1 = ret[1];
      if (ret[3]) {
        ptr1 = 0;
        len1 = 0;
        throw takeFromExternrefTable02(ret[2]);
      }
      deferred2_0 = ptr1;
      deferred2_1 = len1;
      return getStringFromWasm02(ptr1, len1);
    } finally {
      wasm2.__wbindgen_free(deferred2_0, deferred2_1, 1);
    }
  }
  /**
   * @param {any} obj
   * @param {number} index
   * @param {any} value
   * @param {any} datatype
   */
  insert(obj, index, value, datatype) {
    const ret = wasm2.automerge_insert(this.__wbg_ptr, obj, index, value, datatype);
    if (ret[1]) {
      throw takeFromExternrefTable02(ret[0]);
    }
  }
  /**
   * @param {ObjID} obj
   * @param {number} index
   * @param {{[key: string]: MaterializeValue}} block
   */
  splitBlock(obj, index, block2) {
    const ret = wasm2.automerge_splitBlock(this.__wbg_ptr, obj, index, block2);
    if (ret[1]) {
      throw takeFromExternrefTable02(ret[0]);
    }
  }
  /**
   * @param {ObjID} obj
   * @param {number} index
   */
  joinBlock(obj, index) {
    const ret = wasm2.automerge_joinBlock(this.__wbg_ptr, obj, index);
    if (ret[1]) {
      throw takeFromExternrefTable02(ret[0]);
    }
  }
  /**
   * @param {ObjID} obj
   * @param {number} index
   * @param {{[key: string]: MaterializeValue}} block
   */
  updateBlock(obj, index, block2) {
    const ret = wasm2.automerge_updateBlock(this.__wbg_ptr, obj, index, block2);
    if (ret[1]) {
      throw takeFromExternrefTable02(ret[0]);
    }
  }
  /**
   * @param {any} text
   * @param {number} index
   * @param {Array<any> | null} [heads]
   * @returns {any}
   */
  getBlock(text, index, heads) {
    const ret = wasm2.automerge_getBlock(this.__wbg_ptr, text, index, isLikeNone2(heads) ? 0 : addToExternrefTable02(heads));
    if (ret[2]) {
      throw takeFromExternrefTable02(ret[1]);
    }
    return takeFromExternrefTable02(ret[0]);
  }
  /**
   * @param {ObjID} obj
   * @param {number} index
   * @param {ObjType} value
   * @returns {ObjID}
   */
  insertObject(obj, index, value) {
    let deferred2_0;
    let deferred2_1;
    try {
      const ret = wasm2.automerge_insertObject(this.__wbg_ptr, obj, index, value);
      var ptr1 = ret[0];
      var len1 = ret[1];
      if (ret[3]) {
        ptr1 = 0;
        len1 = 0;
        throw takeFromExternrefTable02(ret[2]);
      }
      deferred2_0 = ptr1;
      deferred2_1 = len1;
      return getStringFromWasm02(ptr1, len1);
    } finally {
      wasm2.__wbindgen_free(deferred2_0, deferred2_1, 1);
    }
  }
  /**
   * @param {any} obj
   * @param {any} prop
   * @param {any} value
   * @param {any} datatype
   */
  put(obj, prop, value, datatype) {
    const ret = wasm2.automerge_put(this.__wbg_ptr, obj, prop, value, datatype);
    if (ret[1]) {
      throw takeFromExternrefTable02(ret[0]);
    }
  }
  /**
   * @param {ObjID} obj
   * @param {Prop} prop
   * @param {ObjType} value
   * @returns {ObjID}
   */
  putObject(obj, prop, value) {
    const ret = wasm2.automerge_putObject(this.__wbg_ptr, obj, prop, value);
    if (ret[2]) {
      throw takeFromExternrefTable02(ret[1]);
    }
    return takeFromExternrefTable02(ret[0]);
  }
  /**
   * @param {ObjID} obj
   * @param {Prop} prop
   * @param {number} value
   */
  increment(obj, prop, value) {
    const ret = wasm2.automerge_increment(this.__wbg_ptr, obj, prop, value);
    if (ret[1]) {
      throw takeFromExternrefTable02(ret[0]);
    }
  }
  /**
   * @param {any} obj
   * @param {any} prop
   * @param {Array<any> | null} [heads]
   * @returns {any}
   */
  get(obj, prop, heads) {
    const ret = wasm2.automerge_get(this.__wbg_ptr, obj, prop, isLikeNone2(heads) ? 0 : addToExternrefTable02(heads));
    if (ret[2]) {
      throw takeFromExternrefTable02(ret[1]);
    }
    return takeFromExternrefTable02(ret[0]);
  }
  /**
   * @param {any} obj
   * @param {any} prop
   * @param {Array<any> | null} [heads]
   * @returns {any}
   */
  getWithType(obj, prop, heads) {
    const ret = wasm2.automerge_getWithType(this.__wbg_ptr, obj, prop, isLikeNone2(heads) ? 0 : addToExternrefTable02(heads));
    if (ret[2]) {
      throw takeFromExternrefTable02(ret[1]);
    }
    return takeFromExternrefTable02(ret[0]);
  }
  /**
   * @param {any} obj
   * @param {Array<any> | null} [heads]
   * @returns {object}
   */
  objInfo(obj, heads) {
    const ret = wasm2.automerge_objInfo(this.__wbg_ptr, obj, isLikeNone2(heads) ? 0 : addToExternrefTable02(heads));
    if (ret[2]) {
      throw takeFromExternrefTable02(ret[1]);
    }
    return takeFromExternrefTable02(ret[0]);
  }
  /**
   * @param {any} obj
   * @param {any} arg
   * @param {Array<any> | null} [heads]
   * @returns {Array<any>}
   */
  getAll(obj, arg, heads) {
    const ret = wasm2.automerge_getAll(this.__wbg_ptr, obj, arg, isLikeNone2(heads) ? 0 : addToExternrefTable02(heads));
    if (ret[2]) {
      throw takeFromExternrefTable02(ret[1]);
    }
    return takeFromExternrefTable02(ret[0]);
  }
  /**
   * @param {boolean} enable
   * @returns {boolean}
   */
  enableFreeze(enable) {
    const ret = wasm2.automerge_enableFreeze(this.__wbg_ptr, enable);
    if (ret[2]) {
      throw takeFromExternrefTable02(ret[1]);
    }
    return ret[0] !== 0;
  }
  /**
   * @param {string} datatype
   * @param {Function} construct
   * @param {(arg: any) => any | undefined} deconstruct
   */
  registerDatatype(datatype, construct, deconstruct) {
    const ret = wasm2.automerge_registerDatatype(this.__wbg_ptr, datatype, construct, deconstruct);
    if (ret[1]) {
      throw takeFromExternrefTable02(ret[0]);
    }
  }
  /**
   * @param {any} object
   * @param {any} meta
   * @returns {any}
   */
  applyPatches(object, meta) {
    const ret = wasm2.automerge_applyPatches(this.__wbg_ptr, object, meta);
    if (ret[2]) {
      throw takeFromExternrefTable02(ret[1]);
    }
    return takeFromExternrefTable02(ret[0]);
  }
  /**
   * @param {any} object
   * @param {any} meta
   * @returns {any}
   */
  applyAndReturnPatches(object, meta) {
    const ret = wasm2.automerge_applyAndReturnPatches(this.__wbg_ptr, object, meta);
    if (ret[2]) {
      throw takeFromExternrefTable02(ret[1]);
    }
    return takeFromExternrefTable02(ret[0]);
  }
  /**
   * @returns {Patch[]}
   */
  diffIncremental() {
    const ret = wasm2.automerge_diffIncremental(this.__wbg_ptr);
    if (ret[2]) {
      throw takeFromExternrefTable02(ret[1]);
    }
    return takeFromExternrefTable02(ret[0]);
  }
  updateDiffCursor() {
    wasm2.automerge_updateDiffCursor(this.__wbg_ptr);
  }
  resetDiffCursor() {
    wasm2.automerge_resetDiffCursor(this.__wbg_ptr);
  }
  /**
   * @param {Heads} before
   * @param {Heads} after
   * @returns {Patch[]}
   */
  diff(before, after) {
    const ret = wasm2.automerge_diff(this.__wbg_ptr, before, after);
    if (ret[2]) {
      throw takeFromExternrefTable02(ret[1]);
    }
    return takeFromExternrefTable02(ret[0]);
  }
  /**
   * @param {Heads} heads
   */
  isolate(heads) {
    const ret = wasm2.automerge_isolate(this.__wbg_ptr, heads);
    if (ret[1]) {
      throw takeFromExternrefTable02(ret[0]);
    }
  }
  integrate() {
    wasm2.automerge_integrate(this.__wbg_ptr);
  }
  /**
   * @param {any} obj
   * @param {Array<any> | null} [heads]
   * @returns {number}
   */
  length(obj, heads) {
    const ret = wasm2.automerge_length(this.__wbg_ptr, obj, isLikeNone2(heads) ? 0 : addToExternrefTable02(heads));
    if (ret[2]) {
      throw takeFromExternrefTable02(ret[1]);
    }
    return ret[0];
  }
  /**
   * @param {ObjID} obj
   * @param {Prop} prop
   */
  delete(obj, prop) {
    const ret = wasm2.automerge_delete(this.__wbg_ptr, obj, prop);
    if (ret[1]) {
      throw takeFromExternrefTable02(ret[0]);
    }
  }
  /**
   * @returns {Uint8Array}
   */
  save() {
    const ret = wasm2.automerge_save(this.__wbg_ptr);
    return ret;
  }
  /**
   * @returns {Uint8Array}
   */
  saveIncremental() {
    const ret = wasm2.automerge_saveIncremental(this.__wbg_ptr);
    return ret;
  }
  /**
   * @param {Heads} heads
   * @returns {Uint8Array}
   */
  saveSince(heads) {
    const ret = wasm2.automerge_saveSince(this.__wbg_ptr, heads);
    if (ret[2]) {
      throw takeFromExternrefTable02(ret[1]);
    }
    return takeFromExternrefTable02(ret[0]);
  }
  /**
   * @returns {Uint8Array}
   */
  saveNoCompress() {
    const ret = wasm2.automerge_saveNoCompress(this.__wbg_ptr);
    return ret;
  }
  /**
   * @returns {Uint8Array}
   */
  saveAndVerify() {
    const ret = wasm2.automerge_saveAndVerify(this.__wbg_ptr);
    if (ret[2]) {
      throw takeFromExternrefTable02(ret[1]);
    }
    return takeFromExternrefTable02(ret[0]);
  }
  /**
   * @param {Uint8Array} data
   * @returns {number}
   */
  loadIncremental(data) {
    const ret = wasm2.automerge_loadIncremental(this.__wbg_ptr, data);
    if (ret[2]) {
      throw takeFromExternrefTable02(ret[1]);
    }
    return ret[0];
  }
  /**
   * @param {Change[]} changes
   */
  applyChanges(changes) {
    const ret = wasm2.automerge_applyChanges(this.__wbg_ptr, changes);
    if (ret[1]) {
      throw takeFromExternrefTable02(ret[0]);
    }
  }
  /**
   * @param {Heads} have_deps
   * @returns {Change[]}
   */
  getChanges(have_deps) {
    const ret = wasm2.automerge_getChanges(this.__wbg_ptr, have_deps);
    if (ret[2]) {
      throw takeFromExternrefTable02(ret[1]);
    }
    return takeFromExternrefTable02(ret[0]);
  }
  /**
   * @param {Heads} have_deps
   * @returns {ChangeMetadata[]}
   */
  getChangesMeta(have_deps) {
    const ret = wasm2.automerge_getChangesMeta(this.__wbg_ptr, have_deps);
    if (ret[2]) {
      throw takeFromExternrefTable02(ret[1]);
    }
    return takeFromExternrefTable02(ret[0]);
  }
  /**
   * @param {Hash} hash
   * @returns {Change | null}
   */
  getChangeByHash(hash) {
    const ret = wasm2.automerge_getChangeByHash(this.__wbg_ptr, hash);
    if (ret[2]) {
      throw takeFromExternrefTable02(ret[1]);
    }
    return takeFromExternrefTable02(ret[0]);
  }
  /**
   * @param {Hash} hash
   * @returns {ChangeMetadata | null}
   */
  getChangeMetaByHash(hash) {
    const ret = wasm2.automerge_getChangeMetaByHash(this.__wbg_ptr, hash);
    if (ret[2]) {
      throw takeFromExternrefTable02(ret[1]);
    }
    return takeFromExternrefTable02(ret[0]);
  }
  /**
   * @param {Hash} hash
   * @returns {DecodedChange | null}
   */
  getDecodedChangeByHash(hash) {
    const ret = wasm2.automerge_getDecodedChangeByHash(this.__wbg_ptr, hash);
    if (ret[2]) {
      throw takeFromExternrefTable02(ret[1]);
    }
    return takeFromExternrefTable02(ret[0]);
  }
  /**
   * @param {Automerge} other
   * @returns {Change[]}
   */
  getChangesAdded(other) {
    _assertClass2(other, _Automerge);
    const ret = wasm2.automerge_getChangesAdded(this.__wbg_ptr, other.__wbg_ptr);
    return ret;
  }
  /**
   * @returns {Heads}
   */
  getHeads() {
    const ret = wasm2.automerge_getHeads(this.__wbg_ptr);
    return ret;
  }
  /**
   * @returns {Actor}
   */
  getActorId() {
    let deferred1_0;
    let deferred1_1;
    try {
      const ret = wasm2.automerge_getActorId(this.__wbg_ptr);
      deferred1_0 = ret[0];
      deferred1_1 = ret[1];
      return getStringFromWasm02(ret[0], ret[1]);
    } finally {
      wasm2.__wbindgen_free(deferred1_0, deferred1_1, 1);
    }
  }
  /**
   * @returns {Change | null}
   */
  getLastLocalChange() {
    const ret = wasm2.automerge_getLastLocalChange(this.__wbg_ptr);
    return ret;
  }
  dump() {
    wasm2.automerge_dump(this.__wbg_ptr);
  }
  /**
   * @param {Array<any> | null} [heads]
   * @returns {Array<any>}
   */
  getMissingDeps(heads) {
    const ret = wasm2.automerge_getMissingDeps(this.__wbg_ptr, isLikeNone2(heads) ? 0 : addToExternrefTable02(heads));
    if (ret[2]) {
      throw takeFromExternrefTable02(ret[1]);
    }
    return takeFromExternrefTable02(ret[0]);
  }
  /**
   * @param {SyncState} state
   * @param {SyncMessage} message
   */
  receiveSyncMessage(state, message) {
    _assertClass2(state, SyncState2);
    const ret = wasm2.automerge_receiveSyncMessage(this.__wbg_ptr, state.__wbg_ptr, message);
    if (ret[1]) {
      throw takeFromExternrefTable02(ret[0]);
    }
  }
  /**
   * @param {SyncState} state
   * @returns {SyncMessage | null}
   */
  generateSyncMessage(state) {
    _assertClass2(state, SyncState2);
    const ret = wasm2.automerge_generateSyncMessage(this.__wbg_ptr, state.__wbg_ptr);
    return ret;
  }
  /**
   * @param {any} meta
   * @returns {MaterializeValue}
   */
  toJS(meta) {
    const ret = wasm2.automerge_toJS(this.__wbg_ptr, meta);
    if (ret[2]) {
      throw takeFromExternrefTable02(ret[1]);
    }
    return takeFromExternrefTable02(ret[0]);
  }
  /**
   * @param {any} obj
   * @param {Array<any> | null | undefined} heads
   * @param {any} meta
   * @returns {any}
   */
  materialize(obj, heads, meta) {
    const ret = wasm2.automerge_materialize(this.__wbg_ptr, obj, isLikeNone2(heads) ? 0 : addToExternrefTable02(heads), meta);
    if (ret[2]) {
      throw takeFromExternrefTable02(ret[1]);
    }
    return takeFromExternrefTable02(ret[0]);
  }
  /**
   * @param {any} obj
   * @param {any} position
   * @param {Array<any> | null | undefined} heads
   * @param {any} move_cursor
   * @returns {string}
   */
  getCursor(obj, position, heads, move_cursor) {
    let deferred2_0;
    let deferred2_1;
    try {
      const ret = wasm2.automerge_getCursor(this.__wbg_ptr, obj, position, isLikeNone2(heads) ? 0 : addToExternrefTable02(heads), move_cursor);
      var ptr1 = ret[0];
      var len1 = ret[1];
      if (ret[3]) {
        ptr1 = 0;
        len1 = 0;
        throw takeFromExternrefTable02(ret[2]);
      }
      deferred2_0 = ptr1;
      deferred2_1 = len1;
      return getStringFromWasm02(ptr1, len1);
    } finally {
      wasm2.__wbindgen_free(deferred2_0, deferred2_1, 1);
    }
  }
  /**
   * @param {any} obj
   * @param {any} cursor
   * @param {Array<any> | null} [heads]
   * @returns {number}
   */
  getCursorPosition(obj, cursor, heads) {
    const ret = wasm2.automerge_getCursorPosition(this.__wbg_ptr, obj, cursor, isLikeNone2(heads) ? 0 : addToExternrefTable02(heads));
    if (ret[2]) {
      throw takeFromExternrefTable02(ret[1]);
    }
    return ret[0];
  }
  /**
   * @param {string | null} [message]
   * @param {number | null} [time]
   * @returns {Hash}
   */
  emptyChange(message, time) {
    var ptr0 = isLikeNone2(message) ? 0 : passStringToWasm02(message, wasm2.__wbindgen_malloc, wasm2.__wbindgen_realloc);
    var len0 = WASM_VECTOR_LEN2;
    const ret = wasm2.automerge_emptyChange(this.__wbg_ptr, ptr0, len0, !isLikeNone2(time), isLikeNone2(time) ? 0 : time);
    return ret;
  }
  /**
   * @param {any} obj
   * @param {any} range
   * @param {any} name
   * @param {any} value
   * @param {any} datatype
   */
  mark(obj, range, name, value, datatype) {
    const ret = wasm2.automerge_mark(this.__wbg_ptr, obj, range, name, value, datatype);
    if (ret[1]) {
      throw takeFromExternrefTable02(ret[0]);
    }
  }
  /**
   * @param {ObjID} obj
   * @param {MarkRange} range
   * @param {string} name
   */
  unmark(obj, range, name) {
    const ret = wasm2.automerge_unmark(this.__wbg_ptr, obj, range, name);
    if (ret[1]) {
      throw takeFromExternrefTable02(ret[0]);
    }
  }
  /**
   * @param {any} obj
   * @param {Array<any> | null} [heads]
   * @returns {any}
   */
  marks(obj, heads) {
    const ret = wasm2.automerge_marks(this.__wbg_ptr, obj, isLikeNone2(heads) ? 0 : addToExternrefTable02(heads));
    if (ret[2]) {
      throw takeFromExternrefTable02(ret[1]);
    }
    return takeFromExternrefTable02(ret[0]);
  }
  /**
   * @param {any} obj
   * @param {number} index
   * @param {Array<any> | null} [heads]
   * @returns {object}
   */
  marksAt(obj, index, heads) {
    const ret = wasm2.automerge_marksAt(this.__wbg_ptr, obj, index, isLikeNone2(heads) ? 0 : addToExternrefTable02(heads));
    if (ret[2]) {
      throw takeFromExternrefTable02(ret[1]);
    }
    return takeFromExternrefTable02(ret[0]);
  }
  /**
   * @param {SyncState} state
   * @returns {boolean}
   */
  hasOurChanges(state) {
    _assertClass2(state, SyncState2);
    const ret = wasm2.automerge_hasOurChanges(this.__wbg_ptr, state.__wbg_ptr);
    return ret !== 0;
  }
  /**
   * @returns {Hash[]}
   */
  topoHistoryTraversal() {
    const ret = wasm2.automerge_topoHistoryTraversal(this.__wbg_ptr);
    return ret;
  }
  /**
   * @returns {Stats}
   */
  stats() {
    const ret = wasm2.automerge_stats(this.__wbg_ptr);
    return ret;
  }
  /**
   * @param {any} hashes
   * @returns {Uint8Array}
   */
  saveBundle(hashes) {
    const ret = wasm2.automerge_saveBundle(this.__wbg_ptr, hashes);
    if (ret[2]) {
      throw takeFromExternrefTable02(ret[1]);
    }
    return takeFromExternrefTable02(ret[0]);
  }
};
if (Symbol.dispose) Automerge2.prototype[Symbol.dispose] = Automerge2.prototype.free;
var SyncStateFinalization2 = typeof FinalizationRegistry === "undefined" ? { register: () => {
}, unregister: () => {
} } : new FinalizationRegistry((ptr) => wasm2.__wbg_syncstate_free(ptr >>> 0, 1));
var SyncState2 = class _SyncState {
  static __wrap(ptr) {
    ptr = ptr >>> 0;
    const obj = Object.create(_SyncState.prototype);
    obj.__wbg_ptr = ptr;
    SyncStateFinalization2.register(obj, obj.__wbg_ptr, obj);
    return obj;
  }
  __destroy_into_raw() {
    const ptr = this.__wbg_ptr;
    this.__wbg_ptr = 0;
    SyncStateFinalization2.unregister(this);
    return ptr;
  }
  free() {
    const ptr = this.__destroy_into_raw();
    wasm2.__wbg_syncstate_free(ptr, 0);
  }
  /**
   * @returns {Heads}
   */
  get sharedHeads() {
    const ret = wasm2.syncstate_sharedHeads(this.__wbg_ptr);
    return ret;
  }
  /**
   * @returns {Heads}
   */
  get lastSentHeads() {
    const ret = wasm2.syncstate_lastSentHeads(this.__wbg_ptr);
    return ret;
  }
  /**
   * @param {Heads} heads
   */
  set lastSentHeads(heads) {
    const ret = wasm2.syncstate_set_lastSentHeads(this.__wbg_ptr, heads);
    if (ret[1]) {
      throw takeFromExternrefTable02(ret[0]);
    }
  }
  /**
   * @param {Heads} hashes
   */
  set sentHashes(hashes) {
    const ret = wasm2.syncstate_set_sentHashes(this.__wbg_ptr, hashes);
    if (ret[1]) {
      throw takeFromExternrefTable02(ret[0]);
    }
  }
  /**
   * @returns {SyncState}
   */
  clone() {
    const ret = wasm2.syncstate_clone(this.__wbg_ptr);
    return _SyncState.__wrap(ret);
  }
};
if (Symbol.dispose) SyncState2.prototype[Symbol.dispose] = SyncState2.prototype.free;
function __wbg_BigInt_6adbfd8eb0f7ec07(arg0) {
  const ret = BigInt(arg0);
  return ret;
}
function __wbg_Error_e17e777aac105295(arg0, arg1) {
  const ret = Error(getStringFromWasm02(arg0, arg1));
  return ret;
}
function __wbg_String_8f0eb39a4a4c2f66(arg0, arg1) {
  const ret = String(arg1);
  const ptr1 = passStringToWasm02(ret, wasm2.__wbindgen_malloc, wasm2.__wbindgen_realloc);
  const len1 = WASM_VECTOR_LEN2;
  getDataViewMemory02().setInt32(arg0 + 4 * 1, len1, true);
  getDataViewMemory02().setInt32(arg0 + 4 * 0, ptr1, true);
}
function __wbg_apply_55d63d092a912d6f() {
  return handleError2(function(arg0, arg1, arg2) {
    const ret = Reflect.apply(arg0, arg1, arg2);
    return ret;
  }, arguments);
}
function __wbg_assign_66f7942767cba7e3(arg0, arg1) {
  const ret = Object.assign(arg0, arg1);
  return ret;
}
function __wbg_call_13410aac570ffff7() {
  return handleError2(function(arg0, arg1) {
    const ret = arg0.call(arg1);
    return ret;
  }, arguments);
}
function __wbg_call_a5400b25a865cfd8() {
  return handleError2(function(arg0, arg1, arg2) {
    const ret = arg0.call(arg1, arg2);
    return ret;
  }, arguments);
}
function __wbg_concat_4a5e81410543b8f3(arg0, arg1) {
  const ret = arg0.concat(arg1);
  return ret;
}
function __wbg_defineProperty_1afba89a75bc184f(arg0, arg1, arg2) {
  const ret = Object.defineProperty(arg0, arg1, arg2);
  return ret;
}
function __wbg_deleteProperty_5fe99f4fd0f66ebe() {
  return handleError2(function(arg0, arg1) {
    const ret = Reflect.deleteProperty(arg0, arg1);
    return ret;
  }, arguments);
}
function __wbg_done_75ed0ee6dd243d9d(arg0) {
  const ret = arg0.done;
  return ret;
}
function __wbg_entries_2be2f15bd5554996(arg0) {
  const ret = Object.entries(arg0);
  return ret;
}
function __wbg_error_7534b8e9a36f1ab4(arg0, arg1) {
  let deferred0_0;
  let deferred0_1;
  try {
    deferred0_0 = arg0;
    deferred0_1 = arg1;
    console.error(getStringFromWasm02(arg0, arg1));
  } finally {
    wasm2.__wbindgen_free(deferred0_0, deferred0_1, 1);
  }
}
function __wbg_for_fbb1cf47b8d6b3f6(arg0, arg1) {
  const ret = Symbol.for(getStringFromWasm02(arg0, arg1));
  return ret;
}
function __wbg_freeze_881cf93497533f9e(arg0) {
  const ret = Object.freeze(arg0);
  return ret;
}
function __wbg_from_88bc52ce20ba6318(arg0) {
  const ret = Array.from(arg0);
  return ret;
}
function __wbg_getRandomValues_1c61fac11405ffdc() {
  return handleError2(function(arg0, arg1) {
    globalThis.crypto.getRandomValues(getArrayU8FromWasm02(arg0, arg1));
  }, arguments);
}
function __wbg_getTime_6bb3f64e0f18f817(arg0) {
  const ret = arg0.getTime();
  return ret;
}
function __wbg_get_0da715ceaecea5c8(arg0, arg1) {
  const ret = arg0[arg1 >>> 0];
  return ret;
}
function __wbg_get_458e874b43b18b25() {
  return handleError2(function(arg0, arg1) {
    const ret = Reflect.get(arg0, arg1);
    return ret;
  }, arguments);
}
function __wbg_instanceof_ArrayBuffer_67f3012529f6a2dd(arg0) {
  let result;
  try {
    result = arg0 instanceof ArrayBuffer;
  } catch (_) {
    result = false;
  }
  const ret = result;
  return ret;
}
function __wbg_instanceof_Date_c0cdff0c3b978b0e(arg0) {
  let result;
  try {
    result = arg0 instanceof Date;
  } catch (_) {
    result = false;
  }
  const ret = result;
  return ret;
}
function __wbg_instanceof_Object_fbf5fef4952ff29b(arg0) {
  let result;
  try {
    result = arg0 instanceof Object;
  } catch (_) {
    result = false;
  }
  const ret = result;
  return ret;
}
function __wbg_instanceof_Uint8Array_9a8378d955933db7(arg0) {
  let result;
  try {
    result = arg0 instanceof Uint8Array;
  } catch (_) {
    result = false;
  }
  const ret = result;
  return ret;
}
function __wbg_isArray_030cce220591fb41(arg0) {
  const ret = Array.isArray(arg0);
  return ret;
}
function __wbg_isArray_52653600d4b65388(arg0) {
  const ret = Array.isArray(arg0);
  return ret;
}
function __wbg_iterator_f370b34483c71a1c() {
  const ret = Symbol.iterator;
  return ret;
}
function __wbg_keys_ef52390b2ae0e714(arg0) {
  const ret = Object.keys(arg0);
  return ret;
}
function __wbg_length_186546c51cd61acd(arg0) {
  const ret = arg0.length;
  return ret;
}
function __wbg_length_6bb7e81f9d7713e4(arg0) {
  const ret = arg0.length;
  return ret;
}
function __wbg_length_9d771c54845e987f(arg0) {
  const ret = arg0.length;
  return ret;
}
function __wbg_log_6c7b5f4f00b8ce3f(arg0) {
  console.log(arg0);
}
function __wbg_log_7917fde260a8fd39(arg0, arg1) {
  console.log(arg0, arg1);
}
function __wbg_new_19c25a3f2fa63a02() {
  const ret = new Object();
  return ret;
}
function __wbg_new_1f3a344cf3123716() {
  const ret = new Array();
  return ret;
}
function __wbg_new_5a2ae4557f92b50e(arg0) {
  const ret = new Date(arg0);
  return ret;
}
function __wbg_new_638ebfaedbf32a5e(arg0) {
  const ret = new Uint8Array(arg0);
  return ret;
}
function __wbg_new_8a6f238a6ece86ea() {
  const ret = new Error();
  return ret;
}
function __wbg_new_da9dc54c5db29dfa(arg0, arg1) {
  const ret = new Error(getStringFromWasm02(arg0, arg1));
  return ret;
}
function __wbg_new_ef4f9056d946f38b(arg0, arg1) {
  const ret = new RangeError(getStringFromWasm02(arg0, arg1));
  return ret;
}
function __wbg_newfromslice_074c56947bd43469(arg0, arg1) {
  const ret = new Uint8Array(getArrayU8FromWasm02(arg0, arg1));
  return ret;
}
function __wbg_next_5b3530e612fde77d(arg0) {
  const ret = arg0.next;
  return ret;
}
function __wbg_next_692e82279131b03c() {
  return handleError2(function(arg0) {
    const ret = arg0.next();
    return ret;
  }, arguments);
}
function __wbg_ownKeys_36e096e00ffe2676() {
  return handleError2(function(arg0) {
    const ret = Reflect.ownKeys(arg0);
    return ret;
  }, arguments);
}
function __wbg_prototypesetcall_3d4a26c1ed734349(arg0, arg1, arg2) {
  Uint8Array.prototype.set.call(getArrayU8FromWasm02(arg0, arg1), arg2);
}
function __wbg_push_330b2eb93e4e1212(arg0, arg1) {
  const ret = arg0.push(arg1);
  return ret;
}
function __wbg_set_3f1d0b984ed272ed(arg0, arg1, arg2) {
  arg0[arg1] = arg2;
}
function __wbg_set_453345bcda80b89a() {
  return handleError2(function(arg0, arg1, arg2) {
    const ret = Reflect.set(arg0, arg1, arg2);
    return ret;
  }, arguments);
}
function __wbg_set_90f6c0f7bd8c0415(arg0, arg1, arg2) {
  arg0[arg1 >>> 0] = arg2;
}
function __wbg_slice_974daea329f5c01d(arg0, arg1, arg2) {
  const ret = arg0.slice(arg1 >>> 0, arg2 >>> 0);
  return ret;
}
function __wbg_stack_0ed75d68575b0f3c(arg0, arg1) {
  const ret = arg1.stack;
  const ptr1 = passStringToWasm02(ret, wasm2.__wbindgen_malloc, wasm2.__wbindgen_realloc);
  const len1 = WASM_VECTOR_LEN2;
  getDataViewMemory02().setInt32(arg0 + 4 * 1, len1, true);
  getDataViewMemory02().setInt32(arg0 + 4 * 0, ptr1, true);
}
function __wbg_stringify_4a34a65f0d4e236f(arg0, arg1) {
  const ret = JSON.stringify(arg1);
  var ptr1 = isLikeNone2(ret) ? 0 : passStringToWasm02(ret, wasm2.__wbindgen_malloc, wasm2.__wbindgen_realloc);
  var len1 = WASM_VECTOR_LEN2;
  getDataViewMemory02().setInt32(arg0 + 4 * 1, len1, true);
  getDataViewMemory02().setInt32(arg0 + 4 * 0, ptr1, true);
}
function __wbg_toString_1f1286a7a97689fe(arg0, arg1, arg2) {
  const ret = arg1.toString(arg2);
  const ptr1 = passStringToWasm02(ret, wasm2.__wbindgen_malloc, wasm2.__wbindgen_realloc);
  const len1 = WASM_VECTOR_LEN2;
  getDataViewMemory02().setInt32(arg0 + 4 * 1, len1, true);
  getDataViewMemory02().setInt32(arg0 + 4 * 0, ptr1, true);
}
function __wbg_toString_7268338f40012a03() {
  return handleError2(function(arg0, arg1) {
    const ret = arg0.toString(arg1);
    return ret;
  }, arguments);
}
function __wbg_toString_ea9a6b07f936eb86(arg0) {
  const ret = arg0.toString();
  return ret;
}
function __wbg_unshift_18d353edeebf9a72(arg0, arg1) {
  const ret = arg0.unshift(arg1);
  return ret;
}
function __wbg_value_dd9372230531eade(arg0) {
  const ret = arg0.value;
  return ret;
}
function __wbg_values_a574c29011369bea(arg0) {
  const ret = Object.values(arg0);
  return ret;
}
function __wbg_wbindgenbooleanget_3fe6f642c7d97746(arg0) {
  const v = arg0;
  const ret = typeof v === "boolean" ? v : void 0;
  return isLikeNone2(ret) ? 16777215 : ret ? 1 : 0;
}
function __wbg_wbindgendebugstring_99ef257a3ddda34d(arg0, arg1) {
  const ret = debugString2(arg1);
  const ptr1 = passStringToWasm02(ret, wasm2.__wbindgen_malloc, wasm2.__wbindgen_realloc);
  const len1 = WASM_VECTOR_LEN2;
  getDataViewMemory02().setInt32(arg0 + 4 * 1, len1, true);
  getDataViewMemory02().setInt32(arg0 + 4 * 0, ptr1, true);
}
function __wbg_wbindgengt_5d4c5d18810de162(arg0, arg1) {
  const ret = arg0 > arg1;
  return ret;
}
function __wbg_wbindgenisbigint_ecb90cc08a5a9154(arg0) {
  const ret = typeof arg0 === "bigint";
  return ret;
}
function __wbg_wbindgenisfunction_8cee7dce3725ae74(arg0) {
  const ret = typeof arg0 === "function";
  return ret;
}
function __wbg_wbindgenisnull_f3037694abe4d97a(arg0) {
  const ret = arg0 === null;
  return ret;
}
function __wbg_wbindgenisobject_307a53c6bd97fbf8(arg0) {
  const val = arg0;
  const ret = typeof val === "object" && val !== null;
  return ret;
}
function __wbg_wbindgenisstring_d4fa939789f003b0(arg0) {
  const ret = typeof arg0 === "string";
  return ret;
}
function __wbg_wbindgenisundefined_c4b71d073b92f3c5(arg0) {
  const ret = arg0 === void 0;
  return ret;
}
function __wbg_wbindgenjsvallooseeq_9bec8c9be826bed1(arg0, arg1) {
  const ret = arg0 == arg1;
  return ret;
}
function __wbg_wbindgenlt_544155a2b3097bd5(arg0, arg1) {
  const ret = arg0 < arg1;
  return ret;
}
function __wbg_wbindgenneg_3577d8a6fd6fd98b(arg0) {
  const ret = -arg0;
  return ret;
}
function __wbg_wbindgennumberget_f74b4c7525ac05cb(arg0, arg1) {
  const obj = arg1;
  const ret = typeof obj === "number" ? obj : void 0;
  getDataViewMemory02().setFloat64(arg0 + 8 * 1, isLikeNone2(ret) ? 0 : ret, true);
  getDataViewMemory02().setInt32(arg0 + 4 * 0, !isLikeNone2(ret), true);
}
function __wbg_wbindgenstringget_0f16a6ddddef376f(arg0, arg1) {
  const obj = arg1;
  const ret = typeof obj === "string" ? obj : void 0;
  var ptr1 = isLikeNone2(ret) ? 0 : passStringToWasm02(ret, wasm2.__wbindgen_malloc, wasm2.__wbindgen_realloc);
  var len1 = WASM_VECTOR_LEN2;
  getDataViewMemory02().setInt32(arg0 + 4 * 1, len1, true);
  getDataViewMemory02().setInt32(arg0 + 4 * 0, ptr1, true);
}
function __wbg_wbindgenthrow_451ec1a8469d7eb6(arg0, arg1) {
  throw new Error(getStringFromWasm02(arg0, arg1));
}
function __wbindgen_cast_2241b6af4c4b2941(arg0, arg1) {
  const ret = getStringFromWasm02(arg0, arg1);
  return ret;
}
function __wbindgen_cast_4625c577ab2ec9ee(arg0) {
  const ret = BigInt.asUintN(64, arg0);
  return ret;
}
function __wbindgen_cast_9ae0607507abb057(arg0) {
  const ret = arg0;
  return ret;
}
function __wbindgen_cast_d6cd19b81560fd6e(arg0) {
  const ret = arg0;
  return ret;
}
function __wbindgen_init_externref_table() {
  const table = wasm2.__wbindgen_export_4;
  const offset = table.grow(4);
  table.set(0, void 0);
  table.set(offset + 0, void 0);
  table.set(offset + 1, null);
  table.set(offset + 2, true);
  table.set(offset + 3, false);
  ;
}

// client/node_modules/@automerge/automerge/dist/mjs/wasm_bindgen_output/bundler/automerge_wasm.js
__wbg_set_wasm(wasm3);
wasm3.__wbindgen_start();

// client/node_modules/@automerge/automerge/dist/mjs/implementation.js
var implementation_exports = {};
__export(implementation_exports, {
  Counter: () => Counter,
  Float64: () => Float64,
  ImmutableString: () => ImmutableString,
  Int: () => Int,
  RawString: () => RawString,
  Uint: () => Uint,
  applyChanges: () => applyChanges,
  applyPatch: () => applyPatch,
  applyPatches: () => applyPatches,
  block: () => block,
  change: () => change,
  changeAt: () => changeAt,
  clone: () => clone,
  decodeChange: () => decodeChange3,
  decodeSyncMessage: () => decodeSyncMessage3,
  decodeSyncState: () => decodeSyncState3,
  deleteAt: () => deleteAt,
  diff: () => diff,
  dump: () => dump,
  emptyChange: () => emptyChange,
  encodeChange: () => encodeChange3,
  encodeSyncMessage: () => encodeSyncMessage3,
  encodeSyncState: () => encodeSyncState3,
  equals: () => equals,
  free: () => free,
  from: () => from,
  generateSyncMessage: () => generateSyncMessage,
  getActorId: () => getActorId,
  getAllChanges: () => getAllChanges,
  getBackend: () => getBackend,
  getChanges: () => getChanges,
  getChangesMetaSince: () => getChangesMetaSince,
  getChangesSince: () => getChangesSince,
  getConflicts: () => getConflicts,
  getCursor: () => getCursor,
  getCursorPosition: () => getCursorPosition,
  getHeads: () => getHeads,
  getHistory: () => getHistory,
  getLastLocalChange: () => getLastLocalChange,
  getMissingDeps: () => getMissingDeps,
  getObjectId: () => getObjectId,
  hasHeads: () => hasHeads,
  hasOurChanges: () => hasOurChanges,
  init: () => init,
  initSyncState: () => initSyncState3,
  initializeBase64Wasm: () => initializeBase64Wasm,
  initializeWasm: () => initializeWasm,
  insertAt: () => insertAt,
  inspectChange: () => inspectChange,
  isAutomerge: () => isAutomerge,
  isCounter: () => isCounter,
  isImmutableString: () => isImmutableString,
  isRawString: () => isRawString,
  isWasmInitialized: () => isWasmInitialized,
  joinBlock: () => joinBlock,
  load: () => load3,
  loadIncremental: () => loadIncremental,
  mark: () => mark,
  marks: () => marks,
  marksAt: () => marksAt,
  merge: () => merge,
  readBundle: () => readBundle3,
  receiveSyncMessage: () => receiveSyncMessage,
  save: () => save,
  saveBundle: () => saveBundle,
  saveIncremental: () => saveIncremental,
  saveSince: () => saveSince,
  spans: () => spans,
  splice: () => splice,
  splitBlock: () => splitBlock,
  stats: () => stats,
  toJS: () => toJS,
  topoHistoryTraversal: () => topoHistoryTraversal,
  unmark: () => unmark,
  updateBlock: () => updateBlock,
  updateSpans: () => updateSpans,
  updateText: () => updateText,
  use: () => use,
  view: () => view,
  wasmInitialized: () => wasmInitialized
});

// client/node_modules/@automerge/automerge/dist/mjs/constants.js
var STATE = Symbol.for("_am_meta");
var TRACE = Symbol.for("_am_trace");
var OBJECT_ID = Symbol.for("_am_objectId");
var IS_PROXY = Symbol.for("_am_isProxy");
var CLEAR_CACHE = Symbol.for("_am_clearCache");
var UINT = Symbol.for("_am_uint");
var INT = Symbol.for("_am_int");
var F64 = Symbol.for("_am_f64");
var COUNTER = Symbol.for("_am_counter");
var TEXT = Symbol.for("_am_text");
var IMMUTABLE_STRING = Symbol.for("_am_immutableString");

// client/node_modules/@automerge/automerge/dist/mjs/counter.js
var Counter = class {
  constructor(value) {
    this.value = value || 0;
    Reflect.defineProperty(this, COUNTER, { value: true });
  }
  /**
   * A peculiar JavaScript language feature from its early days: if the object
   * `x` has a `valueOf()` method that returns a number, you can use numerical
   * operators on the object `x` directly, such as `x + 1` or `x < 4`.
   * This method is also called when coercing a value to a string by
   * concatenating it with another string, as in `x + ''`.
   * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/valueOf
   */
  valueOf() {
    return this.value;
  }
  /**
   * Returns the counter value as a decimal string. If `x` is a counter object,
   * this method is called e.g. when you do `['value: ', x].join('')` or when
   * you use string interpolation: `value: ${x}`.
   */
  toString() {
    return this.valueOf().toString();
  }
  /**
   * Returns the counter value, so that a JSON serialization of an Automerge
   * document represents the counter simply as an integer.
   */
  toJSON() {
    return this.value;
  }
  /**
   * Increases the value of the counter by `delta`. If `delta` is not given,
   * increases the value of the counter by 1.
   *
   * Will throw an error if used outside of a change callback.
   */
  increment(_delta) {
    throw new Error("Counters should not be incremented outside of a change callback");
  }
  /**
   * Decreases the value of the counter by `delta`. If `delta` is not given,
   * decreases the value of the counter by 1.
   *
   * Will throw an error if used outside of a change callback.
   */
  decrement(_delta) {
    throw new Error("Counters should not be decremented outside of a change callback");
  }
};
var WriteableCounter = class extends Counter {
  constructor(value, context, path, objectId, key) {
    super(value);
    this.context = context;
    this.path = path;
    this.objectId = objectId;
    this.key = key;
  }
  /**
   * Increases the value of the counter by `delta`. If `delta` is not given,
   * increases the value of the counter by 1.
   */
  increment(delta) {
    delta = typeof delta === "number" ? delta : 1;
    this.context.increment(this.objectId, this.key, delta);
    this.value += delta;
    return this.value;
  }
  /**
   * Decreases the value of the counter by `delta`. If `delta` is not given,
   * decreases the value of the counter by 1.
   */
  decrement(delta) {
    return this.increment(typeof delta === "number" ? -delta : -1);
  }
};
function getWriteableCounter(value, context, path, objectId, key) {
  return new WriteableCounter(value, context, path, objectId, key);
}

// client/node_modules/@automerge/automerge/dist/mjs/immutable_string.js
var _a;
var ImmutableString = class {
  constructor(val) {
    this[_a] = true;
    this.val = val;
  }
  /**
   * Returns the content of the ImmutableString object as a simple string
   */
  toString() {
    return this.val;
  }
  toJSON() {
    return this.val;
  }
};
_a = IMMUTABLE_STRING;

// client/node_modules/@automerge/automerge/dist/mjs/proxies.js
var MAX_I64 = BigInt("9223372036854775807");
function parseListIndex(key) {
  if (typeof key === "string" && /^[0-9]+$/.test(key))
    key = parseInt(key, 10);
  if (typeof key !== "number") {
    return key;
  }
  if (key < 0 || isNaN(key) || key === Infinity || key === -Infinity) {
    throw new RangeError("A list index must be positive, but you passed " + key);
  }
  return key;
}
function valueAt(target, prop) {
  const { context, objectId, path } = target;
  const value = context.getWithType(objectId, prop);
  if (value === null) {
    return;
  }
  const datatype = value[0];
  const val = value[1];
  switch (datatype) {
    case void 0:
      return;
    case "map":
      return mapProxy(context, val, [...path, prop]);
    case "list":
      return listProxy(context, val, [...path, prop]);
    case "text":
      return context.text(val);
    case "str":
      return new ImmutableString(val);
    case "uint":
      return val;
    case "int":
      return val;
    case "f64":
      return val;
    case "boolean":
      return val;
    case "null":
      return null;
    case "bytes":
      return val;
    case "timestamp":
      return val;
    case "counter": {
      const counter = getWriteableCounter(val, context, path, objectId, prop);
      return counter;
    }
    default:
      throw RangeError(`datatype ${datatype} unimplemented`);
  }
}
function import_value(value, path, context) {
  const type = typeof value;
  switch (type) {
    case "object":
      if (value == null) {
        return [null, "null"];
      } else if (value[UINT]) {
        return [value.value, "uint"];
      } else if (value[INT]) {
        return [value.value, "int"];
      } else if (value[F64]) {
        return [value.value, "f64"];
      } else if (value[COUNTER]) {
        return [value.value, "counter"];
      } else if (value instanceof Date) {
        return [value.getTime(), "timestamp"];
      } else if (isImmutableString(value)) {
        return [value.toString(), "str"];
      } else if (value instanceof Uint8Array) {
        return [value, "bytes"];
      } else if (value instanceof Array) {
        return [value, "list"];
      } else if (Object.prototype.toString.call(value) === "[object Object]") {
        return [value, "map"];
      } else if (isSameDocument(value, context)) {
        throw new RangeError("Cannot create a reference to an existing document object");
      } else {
        throw new RangeError(`Cannot assign unknown object: ${value}`);
      }
    case "boolean":
      return [value, "boolean"];
    case "bigint":
      if (value > MAX_I64) {
        return [value, "uint"];
      } else {
        return [value, "int"];
      }
    case "number":
      if (Number.isInteger(value)) {
        return [value, "int"];
      } else {
        return [value, "f64"];
      }
    case "string":
      return [value, "text"];
    case "undefined":
      throw new RangeError([
        `Cannot assign undefined value at ${printPath(path)}, `,
        "because `undefined` is not a valid JSON data type. ",
        "You might consider setting the property's value to `null`, ",
        "or using `delete` to remove it altogether."
      ].join(""));
    default:
      throw new RangeError([
        `Cannot assign ${type} value at ${printPath(path)}. `,
        `All JSON primitive datatypes (object, array, string, number, boolean, null) `,
        `are supported in an Automerge document; ${type} values are not. `
      ].join(""));
  }
}
function isSameDocument(val, context) {
  var _b, _c;
  if (val instanceof Date) {
    return false;
  }
  if (val && ((_c = (_b = val[STATE]) === null || _b === void 0 ? void 0 : _b.handle) === null || _c === void 0 ? void 0 : _c.__wbg_ptr) === context.__wbg_ptr) {
    return true;
  }
  return false;
}
var MapHandler = {
  get(target, key) {
    const { context, objectId, cache } = target;
    if (key === Symbol.toStringTag) {
      return target[Symbol.toStringTag];
    }
    if (key === OBJECT_ID)
      return objectId;
    if (key === IS_PROXY)
      return true;
    if (key === TRACE)
      return target.trace;
    if (key === STATE)
      return { handle: context };
    if (!cache[key]) {
      cache[key] = valueAt(target, key);
    }
    return cache[key];
  },
  set(target, key, val) {
    const { context, objectId, path } = target;
    target.cache = {};
    if (isSameDocument(val, context)) {
      throw new RangeError("Cannot create a reference to an existing document object");
    }
    if (key === TRACE) {
      target.trace = val;
      return true;
    }
    if (key === CLEAR_CACHE) {
      return true;
    }
    const [value, datatype] = import_value(val, [...path, key], context);
    switch (datatype) {
      case "list": {
        const list = context.putObject(objectId, key, []);
        const proxyList = listProxy(context, list, [...path, key]);
        for (let i = 0; i < value.length; i++) {
          proxyList[i] = value[i];
        }
        break;
      }
      case "text": {
        context.putObject(objectId, key, value);
        break;
      }
      case "map": {
        const map = context.putObject(objectId, key, {});
        const proxyMap = mapProxy(context, map, [...path, key]);
        for (const key2 in value) {
          proxyMap[key2] = value[key2];
        }
        break;
      }
      default:
        context.put(objectId, key, value, datatype);
    }
    return true;
  },
  deleteProperty(target, key) {
    const { context, objectId } = target;
    target.cache = {};
    context.delete(objectId, key);
    return true;
  },
  has(target, key) {
    const value = this.get(target, key);
    return value !== void 0;
  },
  getOwnPropertyDescriptor(target, key) {
    const value = this.get(target, key);
    if (typeof value !== "undefined") {
      return {
        configurable: true,
        enumerable: true,
        value
      };
    }
  },
  ownKeys(target) {
    const { context, objectId } = target;
    const keys = context.keys(objectId);
    return [...new Set(keys)];
  }
};
var ListHandler = {
  get(target, index) {
    const { context, objectId } = target;
    index = parseListIndex(index);
    if (index === Symbol.hasInstance) {
      return (instance) => {
        return Array.isArray(instance);
      };
    }
    if (index === Symbol.toStringTag) {
      return target[Symbol.toStringTag];
    }
    if (index === OBJECT_ID)
      return objectId;
    if (index === IS_PROXY)
      return true;
    if (index === TRACE)
      return target.trace;
    if (index === STATE)
      return { handle: context };
    if (index === "length")
      return context.length(objectId);
    if (typeof index === "number") {
      return valueAt(target, index);
    } else {
      return listMethods(target)[index];
    }
  },
  set(target, index, val) {
    const { context, objectId, path } = target;
    index = parseListIndex(index);
    if (isSameDocument(val, context)) {
      throw new RangeError("Cannot create a reference to an existing document object");
    }
    if (index === CLEAR_CACHE) {
      return true;
    }
    if (index === TRACE) {
      target.trace = val;
      return true;
    }
    if (typeof index == "string") {
      throw new RangeError("list index must be a number");
    }
    const [value, datatype] = import_value(val, [...path, index], context);
    switch (datatype) {
      case "list": {
        let list;
        if (index >= context.length(objectId)) {
          list = context.insertObject(objectId, index, []);
        } else {
          list = context.putObject(objectId, index, []);
        }
        const proxyList = listProxy(context, list, [...path, index]);
        proxyList.splice(0, 0, ...value);
        break;
      }
      case "text": {
        if (index >= context.length(objectId)) {
          context.insertObject(objectId, index, value);
        } else {
          context.putObject(objectId, index, value);
        }
        break;
      }
      case "map": {
        let map;
        if (index >= context.length(objectId)) {
          map = context.insertObject(objectId, index, {});
        } else {
          map = context.putObject(objectId, index, {});
        }
        const proxyMap = mapProxy(context, map, [...path, index]);
        for (const key in value) {
          proxyMap[key] = value[key];
        }
        break;
      }
      default:
        if (index >= context.length(objectId)) {
          context.insert(objectId, index, value, datatype);
        } else {
          context.put(objectId, index, value, datatype);
        }
    }
    return true;
  },
  deleteProperty(target, index) {
    const { context, objectId } = target;
    index = parseListIndex(index);
    const elem = context.get(objectId, index);
    if (elem != null && elem[0] == "counter") {
      throw new TypeError("Unsupported operation: deleting a counter from a list");
    }
    context.delete(objectId, index);
    return true;
  },
  has(target, index) {
    const { context, objectId } = target;
    index = parseListIndex(index);
    if (typeof index === "number") {
      return index < context.length(objectId);
    }
    return index === "length";
  },
  getOwnPropertyDescriptor(target, index) {
    const { context, objectId } = target;
    if (index === "length")
      return { writable: true, value: context.length(objectId) };
    if (index === OBJECT_ID)
      return { configurable: false, enumerable: false, value: objectId };
    index = parseListIndex(index);
    const value = valueAt(target, index);
    return { configurable: true, enumerable: true, value };
  },
  getPrototypeOf(target) {
    return Object.getPrototypeOf(target);
  },
  ownKeys() {
    const keys = [];
    keys.push("length");
    return keys;
  }
};
function mapProxy(context, objectId, path) {
  const target = {
    context,
    objectId,
    path: path || [],
    cache: {}
  };
  const proxied = {};
  Object.assign(proxied, target);
  const result = new Proxy(proxied, MapHandler);
  return result;
}
function listProxy(context, objectId, path) {
  const target = {
    context,
    objectId,
    path: path || [],
    cache: {}
  };
  const proxied = [];
  Object.assign(proxied, target);
  return new Proxy(proxied, ListHandler);
}
function rootProxy(context) {
  return mapProxy(context, "_root", []);
}
function listMethods(target) {
  const { context, objectId, path } = target;
  const methods = {
    at(index) {
      return valueAt(target, index);
    },
    deleteAt(index, numDelete) {
      if (typeof numDelete === "number") {
        context.splice(objectId, index, numDelete);
      } else {
        context.delete(objectId, index);
      }
      return this;
    },
    fill(val, start, end) {
      const [value, datatype] = import_value(val, [...path, start], context);
      const length = context.length(objectId);
      start = parseListIndex(start || 0);
      end = parseListIndex(end || length);
      for (let i = start; i < Math.min(end, length); i++) {
        if (datatype === "list" || datatype === "map") {
          context.putObject(objectId, i, value);
        } else if (datatype === "text") {
          context.putObject(objectId, i, value);
        } else {
          context.put(objectId, i, value, datatype);
        }
      }
      return this;
    },
    indexOf(searchElement, start = 0) {
      const length = context.length(objectId);
      for (let i = start; i < length; i++) {
        const valueWithType = context.getWithType(objectId, i);
        if (!valueWithType) {
          continue;
        }
        const [valType, value] = valueWithType;
        const isObject2 = ["map", "list", "text"].includes(valType);
        if (!isObject2) {
          if (value === searchElement) {
            return i;
          } else {
            continue;
          }
        }
        if (valType === "text" && typeof searchElement === "string") {
          if (searchElement === valueAt(target, i)) {
            return i;
          }
        }
        if (searchElement[OBJECT_ID] === value) {
          return i;
        }
      }
      return -1;
    },
    insertAt(index, ...values) {
      this.splice(index, 0, ...values);
      return this;
    },
    pop() {
      const length = context.length(objectId);
      if (length == 0) {
        return void 0;
      }
      const last = valueAt(target, length - 1);
      context.delete(objectId, length - 1);
      return last;
    },
    push(...values) {
      const len = context.length(objectId);
      this.splice(len, 0, ...values);
      return context.length(objectId);
    },
    shift() {
      if (context.length(objectId) == 0)
        return;
      const first = valueAt(target, 0);
      context.delete(objectId, 0);
      return first;
    },
    splice(index, del, ...vals) {
      index = parseListIndex(index);
      if (typeof del !== "number") {
        del = context.length(objectId) - index;
      }
      del = parseListIndex(del);
      for (const val of vals) {
        if (isSameDocument(val, context)) {
          throw new RangeError("Cannot create a reference to an existing document object");
        }
      }
      const result = [];
      for (let i = 0; i < del; i++) {
        const value = valueAt(target, index);
        if (value !== void 0) {
          result.push(value);
        }
        context.delete(objectId, index);
      }
      const values = vals.map((val, index2) => {
        try {
          return import_value(val, [...path], context);
        } catch (e) {
          if (e instanceof RangeError) {
            throw new RangeError(`${e.message} (at index ${index2} in the input)`);
          } else {
            throw e;
          }
        }
      });
      for (const [value, datatype] of values) {
        switch (datatype) {
          case "list": {
            const list = context.insertObject(objectId, index, []);
            const proxyList = listProxy(context, list, [...path, index]);
            proxyList.splice(0, 0, ...value);
            break;
          }
          case "text": {
            context.insertObject(objectId, index, value);
            break;
          }
          case "map": {
            const map = context.insertObject(objectId, index, {});
            const proxyMap = mapProxy(context, map, [...path, index]);
            for (const key in value) {
              proxyMap[key] = value[key];
            }
            break;
          }
          default:
            context.insert(objectId, index, value, datatype);
        }
        index += 1;
      }
      return result;
    },
    unshift(...values) {
      this.splice(0, 0, ...values);
      return context.length(objectId);
    },
    entries() {
      let i = 0;
      const iterator = {
        next: () => {
          const value = valueAt(target, i);
          if (value === void 0) {
            return { value: void 0, done: true };
          } else {
            return { value: [i++, value], done: false };
          }
        },
        [Symbol.iterator]() {
          return this;
        }
      };
      return iterator;
    },
    keys() {
      let i = 0;
      const len = context.length(objectId);
      const iterator = {
        next: () => {
          if (i < len) {
            return { value: i++, done: false };
          }
          return { value: void 0, done: true };
        },
        [Symbol.iterator]() {
          return this;
        }
      };
      return iterator;
    },
    values() {
      let i = 0;
      const iterator = {
        next: () => {
          const value = valueAt(target, i++);
          if (value === void 0) {
            return { value: void 0, done: true };
          } else {
            return { value, done: false };
          }
        },
        [Symbol.iterator]() {
          return this;
        }
      };
      return iterator;
    },
    toArray() {
      const list = [];
      let value;
      do {
        value = valueAt(target, list.length);
        if (value !== void 0) {
          list.push(value);
        }
      } while (value !== void 0);
      return list;
    },
    map(f) {
      return this.toArray().map(f);
    },
    toString() {
      return this.toArray().toString();
    },
    toLocaleString() {
      return this.toArray().toLocaleString();
    },
    forEach(f) {
      return this.toArray().forEach(f);
    },
    // todo: real concat function is different
    concat(other) {
      return this.toArray().concat(other);
    },
    every(f) {
      return this.toArray().every(f);
    },
    filter(f) {
      return this.toArray().filter(f);
    },
    find(f) {
      let index = 0;
      for (const v of this) {
        if (f(v, index)) {
          return v;
        }
        index += 1;
      }
    },
    findIndex(f) {
      let index = 0;
      for (const v of this) {
        if (f(v, index)) {
          return index;
        }
        index += 1;
      }
      return -1;
    },
    includes(elem) {
      return this.find((e) => e === elem) !== void 0;
    },
    join(sep) {
      return this.toArray().join(sep);
    },
    reduce(f, initialValue) {
      return this.toArray().reduce(f, initialValue);
    },
    reduceRight(f, initialValue) {
      return this.toArray().reduceRight(f, initialValue);
    },
    lastIndexOf(search, fromIndex = Infinity) {
      return this.toArray().lastIndexOf(search, fromIndex);
    },
    slice(index, num) {
      return this.toArray().slice(index, num);
    },
    some(f) {
      let index = 0;
      for (const v of this) {
        if (f(v, index)) {
          return true;
        }
        index += 1;
      }
      return false;
    },
    [Symbol.iterator]: function* () {
      let i = 0;
      let value = valueAt(target, i);
      while (value !== void 0) {
        yield value;
        i += 1;
        value = valueAt(target, i);
      }
    }
  };
  return methods;
}
function printPath(path) {
  const jsonPointerComponents = path.map((component) => {
    if (typeof component === "number") {
      return component.toString();
    } else if (typeof component === "string") {
      return component.replace(/~/g, "~0").replace(/\//g, "~1");
    }
  });
  if (path.length === 0) {
    return "";
  } else {
    return "/" + jsonPointerComponents.join("/");
  }
}
function isImmutableString(obj) {
  return typeof obj === "object" && obj !== null && Object.prototype.hasOwnProperty.call(obj, IMMUTABLE_STRING);
}
function isCounter(obj) {
  return typeof obj === "object" && obj !== null && Object.prototype.hasOwnProperty.call(obj, COUNTER);
}

// client/node_modules/@automerge/automerge/dist/mjs/numbers.js
var Int = class {
  constructor(value) {
    if (!(Number.isInteger(value) && value <= Number.MAX_SAFE_INTEGER && value >= Number.MIN_SAFE_INTEGER)) {
      throw new RangeError(`Value ${value} cannot be a uint`);
    }
    this.value = value;
    Reflect.defineProperty(this, INT, { value: true });
    Object.freeze(this);
  }
};
var Uint = class {
  constructor(value) {
    if (!(Number.isInteger(value) && value <= Number.MAX_SAFE_INTEGER && value >= 0)) {
      throw new RangeError(`Value ${value} cannot be a uint`);
    }
    this.value = value;
    Reflect.defineProperty(this, UINT, { value: true });
    Object.freeze(this);
  }
};
var Float64 = class {
  constructor(value) {
    if (typeof value !== "number") {
      throw new RangeError(`Value ${value} cannot be a float64`);
    }
    this.value = value || 0;
    Reflect.defineProperty(this, F64, { value: true });
    Object.freeze(this);
  }
};

// client/node_modules/@automerge/automerge/dist/mjs/internal_state.js
function _state(doc, checkroot = true) {
  if (typeof doc !== "object") {
    throw new RangeError("must be the document root");
  }
  const state = Reflect.get(doc, STATE);
  if (state === void 0 || state == null || checkroot && _obj(doc) !== "_root") {
    throw new RangeError("must be the document root");
  }
  return state;
}
function _clear_cache(doc) {
  Reflect.set(doc, CLEAR_CACHE, true);
}
function _trace(doc) {
  return Reflect.get(doc, TRACE);
}
function _obj(doc) {
  if (!(typeof doc === "object") || doc === null) {
    return null;
  }
  return Reflect.get(doc, OBJECT_ID);
}
function _is_proxy(doc) {
  return !!Reflect.get(doc, IS_PROXY);
}

// client/node_modules/@automerge/automerge/dist/mjs/apply_patches.js
function applyPatch(doc, patch) {
  let path = resolvePath(doc, patch.path);
  if (patch.action === "put") {
    applyPutPatch(doc, path, patch);
  } else if (patch.action === "insert") {
    applyInsertPatch(doc, path, patch);
  } else if (patch.action === "del") {
    applyDelPatch(doc, path, patch);
  } else if (patch.action === "splice") {
    applySplicePatch(doc, path, patch);
  } else if (patch.action === "inc") {
    applyIncPatch(doc, path, patch);
  } else if (patch.action === "mark") {
    applyMarkPatch(doc, path, patch);
  } else if (patch.action === "unmark") {
    applyUnmarkPatch(doc, path, patch);
  } else if (patch.action === "conflict") {
  } else {
    throw new RangeError(`unsupported patch: ${patch}`);
  }
}
function applyPutPatch(doc, path, patch) {
  let { obj: parent, prop } = pathElemAt(path, -1);
  parent[prop] = patch.value;
}
function applyInsertPatch(doc, path, patch) {
  let { obj: parent, prop } = pathElemAt(path, -1);
  if (!Array.isArray(parent)) {
    throw new RangeError(`target is not an array for patch`);
  }
  if (!(typeof prop === "number")) {
    throw new RangeError(`index is not a number for patch`);
  }
  parent.splice(prop, 0, ...patch.values);
}
function applyDelPatch(doc, path, patch) {
  let { obj: parent, prop, parentPath } = pathElemAt(path, -1);
  if (!(typeof prop === "number")) {
    throw new RangeError(`index is not a number for patch`);
  }
  if (Array.isArray(parent)) {
    parent.splice(prop, patch.length || 1);
  } else if (typeof parent === "string") {
    if (isAutomerge(doc)) {
      splice(doc, parentPath, prop, patch.length || 1);
    } else {
      let { obj: grandParent, prop: grandParentProp } = pathElemAt(path, -2);
      if (typeof prop !== "number") {
        throw new RangeError(`index is not a number for patch`);
      }
      let target = grandParent[grandParentProp];
      if (target == null || typeof target !== "string") {
        throw new RangeError(`target is not a string for patch`);
      }
      let newString = target.slice(0, prop) + target.slice(prop + (patch.length || 1));
      grandParent[grandParentProp] = newString;
    }
  } else {
    throw new RangeError(`target is not an array or string for patch`);
  }
}
function applySplicePatch(doc, path, patch) {
  if (isAutomerge(doc)) {
    let { obj: parent, prop, parentPath } = pathElemAt(path, -1);
    if (!(typeof prop === "number")) {
      throw new RangeError(`index is not a number for patch`);
    }
    splice(doc, parentPath, prop, 0, patch.value);
  } else {
    let { obj: parent, prop } = pathElemAt(path, -1);
    let { obj: grandParent, prop: grandParentProp } = pathElemAt(path, -2);
    if (typeof prop !== "number") {
      throw new RangeError(`index is not a number for patch`);
    }
    let target = grandParent[grandParentProp];
    if (target == null || typeof target !== "string") {
      throw new RangeError(`target is not a string for patch`);
    }
    let newString = target.slice(0, prop) + patch.value + target.slice(prop);
    grandParent[grandParentProp] = newString;
  }
}
function applyIncPatch(doc, path, patch) {
  let { obj: parent, prop } = pathElemAt(path, -1);
  const counter = parent[prop];
  if (isAutomerge(doc)) {
    if (!isCounter(counter)) {
      throw new RangeError(`target is not a counter for patch`);
    }
    counter.increment(patch.value);
  } else {
    if (!(typeof counter === "number")) {
      throw new RangeError(`target is not a number for patch`);
    }
    parent[prop] = counter + patch.value;
  }
}
function applyMarkPatch(doc, path, patch) {
  let { obj: parent, prop } = pathElemAt(path, -1);
  if (!isAutomerge(doc)) {
    return;
  }
  for (const markSpec of patch.marks) {
    mark(
      doc,
      patch.path,
      // TODO: add mark expansion to patches. This will require emitting
      // the expand values in patches.
      { start: markSpec.start, end: markSpec.end, expand: "none" },
      markSpec.name,
      markSpec.value
    );
  }
}
function applyUnmarkPatch(doc, path, patch) {
  if (!isAutomerge(doc)) {
    return;
  }
  unmark(doc, patch.path, { start: patch.start, end: patch.end, expand: "none" }, patch.name);
}
function applyPatches(doc, patches) {
  for (const patch of patches) {
    applyPatch(doc, patch);
  }
}
function resolvePath(doc, path) {
  const result = [];
  let current = doc;
  let currentPath = [];
  for (const [index, prop] of path.entries()) {
    result.push({ obj: current, prop, parentPath: currentPath.slice() });
    currentPath.push(prop);
    if (index !== path.length - 1) {
      if (current == null || typeof current != "object") {
        throw new Error(`Invalid path: ${path}`);
      }
      current = current[prop];
    } else {
      break;
    }
  }
  return result;
}
function pathElemAt(resolved, index) {
  let result = resolved.at(index);
  if (result == void 0) {
    throw new Error("invalid path");
  }
  return result;
}

// client/node_modules/@automerge/automerge/dist/mjs/conflicts.js
function conflictAt(context, objectId, prop, withinChangeCallback) {
  const values = context.getAll(objectId, prop);
  if (values.length <= 1) {
    return;
  }
  const result = {};
  for (const fullVal of values) {
    switch (fullVal[0]) {
      case "map":
        if (withinChangeCallback) {
          result[fullVal[1]] = mapProxy(context, fullVal[1], [prop]);
        } else {
          result[fullVal[1]] = reifyFullValue(context, [fullVal[0], fullVal[1]]);
        }
        break;
      case "list":
        if (withinChangeCallback) {
          result[fullVal[1]] = listProxy(context, fullVal[1], [prop]);
        } else {
          result[fullVal[1]] = reifyFullValue(context, [fullVal[0], fullVal[1]]);
        }
        break;
      case "text":
        result[fullVal[1]] = context.text(fullVal[1]);
        break;
      case "str":
      case "uint":
      case "int":
      case "f64":
      case "boolean":
      case "bytes":
      case "null":
        result[fullVal[2]] = fullVal[1];
        break;
      case "counter":
        result[fullVal[2]] = new Counter(fullVal[1]);
        break;
      case "timestamp":
        result[fullVal[2]] = new Date(fullVal[1]);
        break;
      default:
        throw RangeError(`datatype ${fullVal[0]} unimplemented`);
    }
  }
  return result;
}
function reifyFullValue(context, fullValue) {
  switch (fullValue[0]) {
    case "map":
      const mapResult = {};
      for (const key of context.keys(fullValue[1])) {
        let subVal = context.getWithType(fullValue[1], key);
        if (!subVal) {
          throw new Error("unexpected null map value");
        }
        mapResult[key] = reifyFullValue(context, subVal);
      }
      return Object.freeze(mapResult);
    case "list":
      const listResult = [];
      const length = context.length(fullValue[1]);
      for (let i = 0; i < length; i++) {
        let subVal = context.getWithType(fullValue[1], i);
        if (!subVal) {
          throw new Error("unexpected null list element");
        }
        listResult.push(reifyFullValue(context, subVal));
      }
      return Object.freeze(listResult);
    case "text":
      return context.text(fullValue[1]);
    case "str":
    case "uint":
    case "int":
    case "f64":
    case "boolean":
    case "bytes":
    case "null":
      return fullValue[1];
    case "counter":
      return new Counter(fullValue[1]);
    case "timestamp":
      return new Date(fullValue[1]);
    default:
      throw RangeError(`datatype ${fullValue[0]} unimplemented`);
  }
}

// client/node_modules/@automerge/automerge/dist/mjs/implementation.js
var __rest = function(s, e) {
  var t = {};
  for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
    t[p] = s[p];
  if (s != null && typeof Object.getOwnPropertySymbols === "function")
    for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
      if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
        t[p[i]] = s[p[i]];
    }
  return t;
};
var _SyncStateSymbol = Symbol("_syncstate");
function insertAt(list, index, ...values) {
  if (!_is_proxy(list)) {
    throw new RangeError("object cannot be modified outside of a change block");
  }
  ;
  list.insertAt(index, ...values);
}
function deleteAt(list, index, numDelete) {
  if (!_is_proxy(list)) {
    throw new RangeError("object cannot be modified outside of a change block");
  }
  ;
  list.deleteAt(index, numDelete);
}
function use(api) {
  UseApi(api);
}
function getBackend(doc) {
  return _state(doc).handle;
}
function importOpts(_actor) {
  if (typeof _actor === "object") {
    return _actor;
  } else {
    return { actor: _actor };
  }
}
function getChangesSince(state, heads) {
  const n = _state(state);
  return n.handle.getChanges(heads);
}
function getChangesMetaSince(state, heads) {
  const n = _state(state);
  return n.handle.getChangesMeta(heads);
}
function cursorToIndex(state, value, index) {
  if (typeof index == "string") {
    if (/^-?[0-9]+@[0-9a-zA-Z]+$|^[se]$/.test(index)) {
      return state.handle.getCursorPosition(value, index);
    } else {
      throw new RangeError("index must be a number or cursor");
    }
  } else {
    return index;
  }
}
function init(_opts) {
  const opts = importOpts(_opts);
  const freeze = !!opts.freeze;
  const patchCallback = opts.patchCallback;
  const actor = opts.actor;
  const handle = ApiHandler.create({ actor });
  handle.enableFreeze(!!opts.freeze);
  registerDatatypes(handle);
  const doc = handle.materialize("/", void 0, {
    handle,
    heads: void 0,
    freeze,
    patchCallback
  });
  return doc;
}
function view(doc, heads) {
  const state = _state(doc);
  const handle = state.handle;
  return state.handle.materialize("/", heads, Object.assign(Object.assign({}, state), {
    handle,
    heads
  }));
}
function clone(doc, _opts) {
  const state = _state(doc);
  const heads = state.heads;
  const opts = importOpts(_opts);
  const handle = state.handle.fork(opts.actor, heads);
  handle.updateDiffCursor();
  const { heads: _oldHeads } = state, stateSansHeads = __rest(state, ["heads"]);
  stateSansHeads.patchCallback = opts.patchCallback;
  return handle.applyPatches(doc, Object.assign(Object.assign({}, stateSansHeads), { handle }));
}
function free(doc) {
  return _state(doc).handle.free();
}
function from(initialState, _opts) {
  return _change(init(_opts), "from", {}, (d) => Object.assign(d, initialState)).newDoc;
}
function change(doc, options, callback) {
  if (typeof options === "function") {
    return _change(doc, "change", {}, options).newDoc;
  } else if (typeof callback === "function") {
    if (typeof options === "string") {
      options = { message: options };
    }
    return _change(doc, "change", options, callback).newDoc;
  } else {
    throw RangeError("Invalid args for change");
  }
}
function changeAt(doc, scope, options, callback) {
  if (typeof options === "function") {
    return _change(doc, "changeAt", {}, options, scope);
  } else if (typeof callback === "function") {
    if (typeof options === "string") {
      options = { message: options };
    }
    return _change(doc, "changeAt", options, callback, scope);
  } else {
    throw RangeError("Invalid args for changeAt");
  }
}
function progressDocument(doc, source, heads, callback) {
  if (heads == null) {
    return doc;
  }
  const state = _state(doc);
  const nextState = Object.assign(Object.assign({}, state), { heads: void 0 });
  const { value: nextDoc, patches } = state.handle.applyAndReturnPatches(doc, nextState);
  if (patches.length > 0) {
    if (callback != null) {
      callback(patches, { before: doc, after: nextDoc, source });
    }
    const newState = _state(nextDoc);
    newState.mostRecentPatch = {
      before: _state(doc).heads,
      after: newState.handle.getHeads(),
      patches
    };
  }
  state.heads = heads;
  return nextDoc;
}
function _change(doc, source, options, callback, scope) {
  if (typeof callback !== "function") {
    throw new RangeError("invalid change function");
  }
  const state = _state(doc);
  if (doc === void 0 || state === void 0) {
    throw new RangeError("must be the document root");
  }
  if (state.heads) {
    throw new RangeError("Attempting to change an outdated document.  Use Automerge.clone() if you wish to make a writable copy.");
  }
  if (_is_proxy(doc)) {
    throw new RangeError("Calls to Automerge.change cannot be nested");
  }
  let heads = state.handle.getHeads();
  if (scope && headsEqual(scope, heads)) {
    scope = void 0;
  }
  if (scope) {
    state.handle.isolate(scope);
    heads = scope;
  }
  if (!("time" in options)) {
    options.time = Math.floor(Date.now() / 1e3);
  }
  try {
    state.heads = heads;
    const root = rootProxy(state.handle);
    callback(root);
    if (state.handle.pendingOps() === 0) {
      state.heads = void 0;
      if (scope) {
        state.handle.integrate();
      }
      return {
        newDoc: doc,
        newHeads: null
      };
    } else {
      const newHead = state.handle.commit(options.message, options.time);
      state.handle.integrate();
      return {
        newDoc: progressDocument(doc, source, heads, options.patchCallback || state.patchCallback),
        newHeads: newHead != null ? [newHead] : null
      };
    }
  } catch (e) {
    state.heads = void 0;
    state.handle.rollback();
    throw e;
  }
}
function emptyChange(doc, options) {
  if (options === void 0) {
    options = {};
  }
  if (typeof options === "string") {
    options = { message: options };
  }
  if (!("time" in options)) {
    options.time = Math.floor(Date.now() / 1e3);
  }
  const state = _state(doc);
  if (state.heads) {
    throw new RangeError("Attempting to change an outdated document.  Use Automerge.clone() if you wish to make a writable copy.");
  }
  if (_is_proxy(doc)) {
    throw new RangeError("Calls to Automerge.change cannot be nested");
  }
  const heads = state.handle.getHeads();
  state.handle.emptyChange(options.message, options.time);
  return progressDocument(doc, "emptyChange", heads);
}
function load3(data, _opts) {
  const opts = importOpts(_opts);
  if (opts.patchCallback) {
    return loadIncremental(init(opts), data);
  }
  const actor = opts.actor;
  const patchCallback = opts.patchCallback;
  const unchecked = opts.unchecked || false;
  const allowMissingDeps = opts.allowMissingChanges || false;
  const convertImmutableStringsToText = opts.convertImmutableStringsToText || false;
  const handle = ApiHandler.load(data, {
    actor,
    unchecked,
    allowMissingDeps,
    convertImmutableStringsToText
  });
  handle.enableFreeze(!!opts.freeze);
  registerDatatypes(handle);
  const doc = handle.materialize("/", void 0, {
    handle,
    heads: void 0,
    patchCallback
  });
  return doc;
}
function loadIncremental(doc, data, opts) {
  if (!opts) {
    opts = {};
  }
  const state = _state(doc);
  if (state.heads) {
    throw new RangeError("Attempting to change an out of date document - set at: " + _trace(doc));
  }
  if (_is_proxy(doc)) {
    throw new RangeError("Calls to Automerge.change cannot be nested");
  }
  const heads = state.handle.getHeads();
  state.handle.loadIncremental(data);
  return progressDocument(doc, "loadIncremental", heads, opts.patchCallback || state.patchCallback);
}
function saveIncremental(doc) {
  const state = _state(doc);
  if (state.heads) {
    throw new RangeError("Attempting to change an out of date document - set at: " + _trace(doc));
  }
  if (_is_proxy(doc)) {
    throw new RangeError("Calls to Automerge.change cannot be nested");
  }
  return state.handle.saveIncremental();
}
function save(doc) {
  return _state(doc).handle.save();
}
function merge(local, remote) {
  const localState = _state(local);
  if (localState.heads) {
    throw new RangeError("Attempting to change an out of date document - set at: " + _trace(local));
  }
  const heads = localState.handle.getHeads();
  const remoteState = _state(remote);
  const changes = localState.handle.getChangesAdded(remoteState.handle);
  localState.handle.applyChanges(changes);
  return progressDocument(local, "merge", heads, localState.patchCallback);
}
function getActorId(doc) {
  const state = _state(doc);
  return state.handle.getActorId();
}
function getConflicts(doc, prop) {
  const state = _state(doc, false);
  const objectId = _obj(doc);
  if (objectId != null) {
    const withinChangeCallback = _is_proxy(doc);
    return conflictAt(state.handle, objectId, prop, withinChangeCallback);
  } else {
    return void 0;
  }
}
function getLastLocalChange(doc) {
  const state = _state(doc);
  return state.handle.getLastLocalChange() || void 0;
}
function getObjectId(doc, prop) {
  if (prop) {
    const state = _state(doc, false);
    const objectId = _obj(doc);
    if (!state || !objectId) {
      return null;
    }
    return state.handle.get(objectId, prop);
  } else {
    return _obj(doc);
  }
}
function getChanges(oldState, newState) {
  const n = _state(newState);
  return n.handle.getChanges(getHeads(oldState));
}
function getAllChanges(doc) {
  const state = _state(doc);
  return state.handle.getChanges([]);
}
function applyChanges(doc, changes, opts) {
  const state = _state(doc);
  if (!opts) {
    opts = {};
  }
  if (state.heads) {
    throw new RangeError("Attempting to change an outdated document.  Use Automerge.clone() if you wish to make a writable copy.");
  }
  if (_is_proxy(doc)) {
    throw new RangeError("Calls to Automerge.change cannot be nested");
  }
  const heads = state.handle.getHeads();
  state.handle.applyChanges(changes);
  state.heads = heads;
  return [
    progressDocument(doc, "applyChanges", heads, opts.patchCallback || state.patchCallback)
  ];
}
function getHistory(doc) {
  const history = getAllChanges(doc);
  return history.map((change2, index) => ({
    get change() {
      return decodeChange3(change2);
    },
    get snapshot() {
      const [state] = applyChanges(init(), history.slice(0, index + 1));
      return state;
    }
  }));
}
function diff(doc, before, after) {
  checkHeads(before, "before");
  checkHeads(after, "after");
  const state = _state(doc);
  if (state.mostRecentPatch && equals(state.mostRecentPatch.before, before) && equals(state.mostRecentPatch.after, after)) {
    return state.mostRecentPatch.patches;
  }
  return state.handle.diff(before, after);
}
function headsEqual(heads1, heads2) {
  if (heads1.length !== heads2.length) {
    return false;
  }
  for (let i = 0; i < heads1.length; i++) {
    if (heads1[i] !== heads2[i]) {
      return false;
    }
  }
  return true;
}
function checkHeads(heads, fieldname) {
  if (!Array.isArray(heads)) {
    throw new Error(`${fieldname} must be an array`);
  }
}
function equals(val1, val2) {
  if (!isObject(val1) || !isObject(val2))
    return val1 === val2;
  const keys1 = Object.keys(val1).sort(), keys2 = Object.keys(val2).sort();
  if (keys1.length !== keys2.length)
    return false;
  for (let i = 0; i < keys1.length; i++) {
    if (keys1[i] !== keys2[i])
      return false;
    if (!equals(val1[keys1[i]], val2[keys2[i]]))
      return false;
  }
  return true;
}
function encodeSyncState3(state) {
  const sync = ApiHandler.importSyncState(state);
  const result = ApiHandler.encodeSyncState(sync);
  sync.free();
  return result;
}
function decodeSyncState3(state) {
  const sync = ApiHandler.decodeSyncState(state);
  const result = ApiHandler.exportSyncState(sync);
  sync.free();
  return result;
}
function generateSyncMessage(doc, inState) {
  const state = _state(doc);
  const syncState = ApiHandler.importSyncState(inState);
  const message = state.handle.generateSyncMessage(syncState);
  const outState = ApiHandler.exportSyncState(syncState);
  return [outState, message];
}
function receiveSyncMessage(doc, inState, message, opts) {
  const syncState = ApiHandler.importSyncState(inState);
  if (!opts) {
    opts = {};
  }
  const state = _state(doc);
  if (state.heads) {
    throw new RangeError("Attempting to change an outdated document.  Use Automerge.clone() if you wish to make a writable copy.");
  }
  if (_is_proxy(doc)) {
    throw new RangeError("Calls to Automerge.change cannot be nested");
  }
  const heads = state.handle.getHeads();
  state.handle.receiveSyncMessage(syncState, message);
  const outSyncState = ApiHandler.exportSyncState(syncState);
  return [
    progressDocument(doc, "receiveSyncMessage", heads, opts.patchCallback || state.patchCallback),
    outSyncState,
    null
  ];
}
function hasOurChanges(doc, remoteState) {
  const state = _state(doc);
  const syncState = ApiHandler.importSyncState(remoteState);
  return state.handle.hasOurChanges(syncState);
}
function initSyncState3() {
  return ApiHandler.exportSyncState(ApiHandler.initSyncState());
}
function encodeChange3(change2) {
  return ApiHandler.encodeChange(change2);
}
function decodeChange3(data) {
  return ApiHandler.decodeChange(data);
}
function encodeSyncMessage3(message) {
  return ApiHandler.encodeSyncMessage(message);
}
function decodeSyncMessage3(message) {
  return ApiHandler.decodeSyncMessage(message);
}
function getMissingDeps(doc, heads) {
  const state = _state(doc);
  return state.handle.getMissingDeps(heads);
}
function getHeads(doc) {
  const state = _state(doc);
  return state.heads || state.handle.getHeads();
}
function dump(doc) {
  const state = _state(doc);
  state.handle.dump();
}
function toJS(doc) {
  const state = _state(doc);
  const enabled = state.handle.enableFreeze(false);
  const result = state.handle.materialize("/", state.heads);
  state.handle.enableFreeze(enabled);
  return result;
}
function isAutomerge(doc) {
  if (typeof doc == "object" && doc !== null) {
    return getObjectId(doc) === "_root" && !!Reflect.get(doc, STATE);
  } else {
    return false;
  }
}
function isObject(obj) {
  return typeof obj === "object" && obj !== null;
}
function saveSince(doc, heads) {
  const state = _state(doc);
  const result = state.handle.saveSince(heads);
  return result;
}
function hasHeads(doc, heads) {
  const state = _state(doc);
  for (const hash of heads) {
    if (!state.handle.getChangeByHash(hash)) {
      return false;
    }
  }
  return true;
}
function registerDatatypes(handle) {
  handle.registerDatatype("counter", (n) => new Counter(n), (n) => {
    if (n instanceof Counter) {
      return n.value;
    }
  });
  handle.registerDatatype("str", (n) => {
    return new ImmutableString(n);
  }, (s) => {
    if (isImmutableString(s)) {
      return s.val;
    }
  });
}
function topoHistoryTraversal(doc) {
  const state = _state(doc);
  return state.handle.topoHistoryTraversal();
}
function inspectChange(doc, changeHash) {
  const state = _state(doc);
  return state.handle.getDecodedChangeByHash(changeHash);
}
function stats(doc) {
  const state = _state(doc);
  return state.handle.stats();
}
function splice(doc, path, index, del, newText) {
  const objPath = absoluteObjPath(doc, path, "splice");
  if (!_is_proxy(doc)) {
    throw new RangeError("object cannot be modified outside of a change block");
  }
  const state = _state(doc, false);
  _clear_cache(doc);
  index = cursorToIndex(state, objPath, index);
  try {
    return state.handle.splice(objPath, index, del, newText);
  } catch (e) {
    throw new RangeError(`Cannot splice: ${e}`);
  }
}
function updateText(doc, path, newText) {
  const objPath = absoluteObjPath(doc, path, "updateText");
  if (!_is_proxy(doc)) {
    throw new RangeError("object cannot be modified outside of a change block");
  }
  const state = _state(doc, false);
  _clear_cache(doc);
  try {
    return state.handle.updateText(objPath, newText);
  } catch (e) {
    throw new RangeError(`Cannot updateText: ${e}`);
  }
}
function spans(doc, path) {
  const state = _state(doc, false);
  const objPath = absoluteObjPath(doc, path, "spans");
  try {
    return state.handle.spans(objPath, state.heads);
  } catch (e) {
    throw new RangeError(`Cannot splice: ${e}`);
  }
}
function block(doc, path, index) {
  const objPath = absoluteObjPath(doc, path, "splitBlock");
  const state = _state(doc, false);
  index = cursorToIndex(state, objPath, index);
  try {
    return state.handle.getBlock(objPath, index);
  } catch (e) {
    throw new RangeError(`Cannot get block: ${e}`);
  }
}
function splitBlock(doc, path, index, block2) {
  if (!_is_proxy(doc)) {
    throw new RangeError("object cannot be modified outside of a change block");
  }
  const objPath = absoluteObjPath(doc, path, "splitBlock");
  const state = _state(doc, false);
  _clear_cache(doc);
  index = cursorToIndex(state, objPath, index);
  try {
    state.handle.splitBlock(objPath, index, block2);
  } catch (e) {
    throw new RangeError(`Cannot splice: ${e}`);
  }
}
function joinBlock(doc, path, index) {
  if (!_is_proxy(doc)) {
    throw new RangeError("object cannot be modified outside of a change block");
  }
  const objPath = absoluteObjPath(doc, path, "joinBlock");
  const state = _state(doc, false);
  _clear_cache(doc);
  index = cursorToIndex(state, objPath, index);
  try {
    state.handle.joinBlock(objPath, index);
  } catch (e) {
    throw new RangeError(`Cannot joinBlock: ${e}`);
  }
}
function updateBlock(doc, path, index, block2) {
  if (!_is_proxy(doc)) {
    throw new RangeError("object cannot be modified outside of a change block");
  }
  const objPath = absoluteObjPath(doc, path, "updateBlock");
  const state = _state(doc, false);
  _clear_cache(doc);
  index = cursorToIndex(state, objPath, index);
  try {
    state.handle.updateBlock(objPath, index, block2);
  } catch (e) {
    throw new RangeError(`Cannot updateBlock: ${e}`);
  }
}
function updateSpans(doc, path, newSpans, config) {
  if (!_is_proxy(doc)) {
    throw new RangeError("object cannot be modified outside of a change block");
  }
  const objPath = absoluteObjPath(doc, path, "updateSpans");
  const state = _state(doc, false);
  _clear_cache(doc);
  try {
    state.handle.updateSpans(objPath, newSpans, config);
  } catch (e) {
    throw new RangeError(`Cannot updateSpans: ${e}`);
  }
}
function getCursor(doc, path, position, move) {
  const objPath = absoluteObjPath(doc, path, "getCursor");
  const state = _state(doc, false);
  try {
    return state.handle.getCursor(objPath, position, state.heads, move);
  } catch (e) {
    throw new RangeError(`Cannot getCursor: ${e}`);
  }
}
function getCursorPosition(doc, path, cursor) {
  const objPath = absoluteObjPath(doc, path, "getCursorPosition");
  const state = _state(doc, false);
  try {
    return state.handle.getCursorPosition(objPath, cursor, state.heads);
  } catch (e) {
    throw new RangeError(`Cannot getCursorPosition: ${e}`);
  }
}
function mark(doc, path, range, name, value) {
  const objPath = absoluteObjPath(doc, path, "mark");
  if (!_is_proxy(doc)) {
    throw new RangeError("object cannot be modified outside of a change block");
  }
  const state = _state(doc, false);
  try {
    return state.handle.mark(objPath, range, name, value);
  } catch (e) {
    throw new RangeError(`Cannot mark: ${e}`);
  }
}
function unmark(doc, path, range, name) {
  const objPath = absoluteObjPath(doc, path, "unmark");
  if (!_is_proxy(doc)) {
    throw new RangeError("object cannot be modified outside of a change block");
  }
  const state = _state(doc, false);
  try {
    return state.handle.unmark(objPath, range, name);
  } catch (e) {
    throw new RangeError(`Cannot unmark: ${e}`);
  }
}
function marks(doc, path) {
  const objPath = absoluteObjPath(doc, path, "marks");
  const state = _state(doc, false);
  try {
    return state.handle.marks(objPath);
  } catch (e) {
    throw new RangeError(`Cannot call marks(): ${e}`);
  }
}
function marksAt(doc, path, index) {
  const objPath = absoluteObjPath(doc, path, "marksAt");
  const state = _state(doc, false);
  try {
    return state.handle.marksAt(objPath, index);
  } catch (e) {
    throw new RangeError(`Cannot call marksAt(): ${e}`);
  }
}
function absoluteObjPath(doc, path, functionName) {
  path = path.slice();
  const objectId = _obj(doc);
  if (!objectId) {
    throw new RangeError(`invalid object for ${functionName}`);
  }
  path.unshift(objectId);
  return path.join("/");
}
var isRawString = isImmutableString;
var RawString = ImmutableString;
function saveBundle(doc, hashes) {
  const state = _state(doc, false);
  return state.handle.saveBundle(hashes);
}
function readBundle3(bundle) {
  return ApiHandler.readBundle(bundle);
}

// client/node_modules/@automerge/automerge/dist/mjs/entrypoints/fullfat_bundler.js
UseApi(automerge_wasm_exports2);
export {
  Counter,
  Float64,
  ImmutableString,
  Int,
  RawString,
  Uint,
  applyChanges,
  applyPatch,
  applyPatches,
  block,
  change,
  changeAt,
  clone,
  decodeChange3 as decodeChange,
  decodeSyncMessage3 as decodeSyncMessage,
  decodeSyncState3 as decodeSyncState,
  deleteAt,
  diff,
  dump,
  emptyChange,
  encodeChange3 as encodeChange,
  encodeSyncMessage3 as encodeSyncMessage,
  encodeSyncState3 as encodeSyncState,
  equals,
  free,
  from,
  generateSyncMessage,
  getActorId,
  getAllChanges,
  getBackend,
  getChanges,
  getChangesMetaSince,
  getChangesSince,
  getConflicts,
  getCursor,
  getCursorPosition,
  getHeads,
  getHistory,
  getLastLocalChange,
  getMissingDeps,
  getObjectId,
  hasHeads,
  hasOurChanges,
  init,
  initSyncState3 as initSyncState,
  initializeBase64Wasm,
  initializeWasm,
  insertAt,
  inspectChange,
  isAutomerge,
  isCounter,
  isImmutableString,
  isRawString,
  isWasmInitialized,
  joinBlock,
  load3 as load,
  loadIncremental,
  mark,
  marks,
  marksAt,
  merge,
  implementation_exports as next,
  readBundle3 as readBundle,
  receiveSyncMessage,
  save,
  saveBundle,
  saveIncremental,
  saveSince,
  spans,
  splice,
  splitBlock,
  stats,
  toJS,
  topoHistoryTraversal,
  unmark,
  updateBlock,
  updateSpans,
  updateText,
  use,
  view,
  wasmInitialized
};
//# sourceMappingURL=@automerge_automerge.js.map
