(function polyfill() {
  const relList = document.createElement("link").relList;
  if (relList && relList.supports && relList.supports("modulepreload")) return;
  for (const link of document.querySelectorAll('link[rel="modulepreload"]')) processPreload(link);
  new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type !== "childList") continue;
      for (const node of mutation.addedNodes) if (node.tagName === "LINK" && node.rel === "modulepreload") processPreload(node);
    }
  }).observe(document, {
    childList: true,
    subtree: true
  });
  function getFetchOpts(link) {
    const fetchOpts = {};
    if (link.integrity) fetchOpts.integrity = link.integrity;
    if (link.referrerPolicy) fetchOpts.referrerPolicy = link.referrerPolicy;
    if (link.crossOrigin === "use-credentials") fetchOpts.credentials = "include";
    else if (link.crossOrigin === "anonymous") fetchOpts.credentials = "omit";
    else fetchOpts.credentials = "same-origin";
    return fetchOpts;
  }
  function processPreload(link) {
    if (link.ep) return;
    link.ep = true;
    const fetchOpts = getFetchOpts(link);
    fetch(link.href, fetchOpts);
  }
})();
var SSR_NODE = 1;
var TEXT_NODE = 3;
var EMPTY_OBJ = {};
var EMPTY_ARR = [];
var SVG_NS = "http://www.w3.org/2000/svg";
var id = (a) => a;
var map = EMPTY_ARR.map;
var isArray = Array.isArray;
var enqueue = typeof requestAnimationFrame !== "undefined" ? requestAnimationFrame : setTimeout;
var createClass = (obj) => {
  var out = "";
  if (typeof obj === "string") return obj;
  if (isArray(obj)) {
    for (var k = 0, tmp; k < obj.length; k++) {
      if (tmp = createClass(obj[k])) {
        out += (out && " ") + tmp;
      }
    }
  } else {
    for (var k in obj) {
      if (obj[k]) out += (out && " ") + k;
    }
  }
  return out;
};
var shouldRestart = (a, b) => {
  for (var k in { ...a, ...b }) {
    if (typeof (isArray(a[k]) ? a[k][0] : a[k]) === "function") {
      b[k] = a[k];
    } else if (a[k] !== b[k]) return true;
  }
};
var patchSubs = (oldSubs, newSubs = EMPTY_ARR, dispatch) => {
  for (var subs = [], i = 0, oldSub, newSub; i < oldSubs.length || i < newSubs.length; i++) {
    oldSub = oldSubs[i];
    newSub = newSubs[i];
    subs.push(
      newSub && newSub !== true ? !oldSub || newSub[0] !== oldSub[0] || shouldRestart(newSub[1], oldSub[1]) ? [
        newSub[0],
        newSub[1],
        (oldSub && oldSub[2](), newSub[0](dispatch, newSub[1]))
      ] : oldSub : oldSub && oldSub[2]()
    );
  }
  return subs;
};
var getKey = (vdom) => vdom == null ? vdom : vdom.key;
var patchProperty = (node, key, oldValue, newValue, listener, isSvg) => {
  if (key === "style") {
    for (var k in { ...oldValue, ...newValue }) {
      oldValue = newValue == null || newValue[k] == null ? "" : newValue[k];
      if (k[0] === "-") {
        node[key].setProperty(k, oldValue);
      } else {
        node[key][k] = oldValue;
      }
    }
  } else if (key[0] === "o" && key[1] === "n") {
    if (!((node.events || (node.events = {}))[key = key.slice(2)] = newValue)) {
      node.removeEventListener(key, listener);
    } else if (!oldValue) {
      node.addEventListener(key, listener);
    }
  } else if (!isSvg && key !== "list" && key !== "form" && key in node) {
    node[key] = newValue == null ? "" : newValue;
  } else if (newValue == null || newValue === false) {
    node.removeAttribute(key);
  } else {
    node.setAttribute(key, newValue);
  }
};
var createNode = (vdom, listener, isSvg) => {
  var props = vdom.props;
  var node = vdom.type === TEXT_NODE ? document.createTextNode(vdom.tag) : (isSvg = isSvg || vdom.tag === "svg") ? document.createElementNS(SVG_NS, vdom.tag, props.is && props) : document.createElement(vdom.tag, props.is && props);
  for (var k in props) {
    patchProperty(node, k, null, props[k], listener, isSvg);
  }
  for (var i = 0; i < vdom.children.length; i++) {
    node.appendChild(
      createNode(
        vdom.children[i] = maybeVNode(vdom.children[i]),
        listener,
        isSvg
      )
    );
  }
  return vdom.node = node;
};
var patch = (parent, node, oldVNode, newVNode, listener, isSvg) => {
  if (oldVNode === newVNode) ;
  else if (oldVNode != null && oldVNode.type === TEXT_NODE && newVNode.type === TEXT_NODE) {
    if (oldVNode.tag !== newVNode.tag) node.nodeValue = newVNode.tag;
  } else if (oldVNode == null || oldVNode.tag !== newVNode.tag) {
    node = parent.insertBefore(
      createNode(newVNode = maybeVNode(newVNode), listener, isSvg),
      node
    );
    if (oldVNode != null) {
      parent.removeChild(oldVNode.node);
    }
  } else {
    var tmpVKid;
    var oldVKid;
    var oldKey;
    var newKey;
    var oldProps = oldVNode.props;
    var newProps = newVNode.props;
    var oldVKids = oldVNode.children;
    var newVKids = newVNode.children;
    var oldHead = 0;
    var newHead = 0;
    var oldTail = oldVKids.length - 1;
    var newTail = newVKids.length - 1;
    isSvg = isSvg || newVNode.tag === "svg";
    for (var i in { ...oldProps, ...newProps }) {
      if ((i === "value" || i === "selected" || i === "checked" ? node[i] : oldProps[i]) !== newProps[i]) {
        patchProperty(node, i, oldProps[i], newProps[i], listener, isSvg);
      }
    }
    while (newHead <= newTail && oldHead <= oldTail) {
      if ((oldKey = getKey(oldVKids[oldHead])) == null || oldKey !== getKey(newVKids[newHead])) {
        break;
      }
      patch(
        node,
        oldVKids[oldHead].node,
        oldVKids[oldHead],
        newVKids[newHead] = maybeVNode(
          newVKids[newHead++],
          oldVKids[oldHead++]
        ),
        listener,
        isSvg
      );
    }
    while (newHead <= newTail && oldHead <= oldTail) {
      if ((oldKey = getKey(oldVKids[oldTail])) == null || oldKey !== getKey(newVKids[newTail])) {
        break;
      }
      patch(
        node,
        oldVKids[oldTail].node,
        oldVKids[oldTail],
        newVKids[newTail] = maybeVNode(
          newVKids[newTail--],
          oldVKids[oldTail--]
        ),
        listener,
        isSvg
      );
    }
    if (oldHead > oldTail) {
      while (newHead <= newTail) {
        node.insertBefore(
          createNode(
            newVKids[newHead] = maybeVNode(newVKids[newHead++]),
            listener,
            isSvg
          ),
          (oldVKid = oldVKids[oldHead]) && oldVKid.node
        );
      }
    } else if (newHead > newTail) {
      while (oldHead <= oldTail) {
        node.removeChild(oldVKids[oldHead++].node);
      }
    } else {
      for (var keyed = {}, newKeyed = {}, i = oldHead; i <= oldTail; i++) {
        if ((oldKey = oldVKids[i].key) != null) {
          keyed[oldKey] = oldVKids[i];
        }
      }
      while (newHead <= newTail) {
        oldKey = getKey(oldVKid = oldVKids[oldHead]);
        newKey = getKey(
          newVKids[newHead] = maybeVNode(newVKids[newHead], oldVKid)
        );
        if (newKeyed[oldKey] || newKey != null && newKey === getKey(oldVKids[oldHead + 1])) {
          if (oldKey == null) {
            node.removeChild(oldVKid.node);
          }
          oldHead++;
          continue;
        }
        if (newKey == null || oldVNode.type === SSR_NODE) {
          if (oldKey == null) {
            patch(
              node,
              oldVKid && oldVKid.node,
              oldVKid,
              newVKids[newHead],
              listener,
              isSvg
            );
            newHead++;
          }
          oldHead++;
        } else {
          if (oldKey === newKey) {
            patch(
              node,
              oldVKid.node,
              oldVKid,
              newVKids[newHead],
              listener,
              isSvg
            );
            newKeyed[newKey] = true;
            oldHead++;
          } else {
            if ((tmpVKid = keyed[newKey]) != null) {
              patch(
                node,
                node.insertBefore(tmpVKid.node, oldVKid && oldVKid.node),
                tmpVKid,
                newVKids[newHead],
                listener,
                isSvg
              );
              newKeyed[newKey] = true;
            } else {
              patch(
                node,
                oldVKid && oldVKid.node,
                null,
                newVKids[newHead],
                listener,
                isSvg
              );
            }
          }
          newHead++;
        }
      }
      while (oldHead <= oldTail) {
        if (getKey(oldVKid = oldVKids[oldHead++]) == null) {
          node.removeChild(oldVKid.node);
        }
      }
      for (var i in keyed) {
        if (newKeyed[i] == null) {
          node.removeChild(keyed[i].node);
        }
      }
    }
  }
  return newVNode.node = node;
};
var propsChanged = (a, b) => {
  for (var k in a) if (a[k] !== b[k]) return true;
  for (var k in b) if (a[k] !== b[k]) return true;
};
var maybeVNode = (newVNode, oldVNode) => newVNode !== true && newVNode !== false && newVNode ? typeof newVNode.tag === "function" ? ((!oldVNode || oldVNode.memo == null || propsChanged(oldVNode.memo, newVNode.memo)) && ((oldVNode = newVNode.tag(newVNode.memo)).memo = newVNode.memo), oldVNode) : newVNode : text("");
var recycleNode = (node) => node.nodeType === TEXT_NODE ? text(node.nodeValue, node) : createVNode(
  node.nodeName.toLowerCase(),
  EMPTY_OBJ,
  map.call(node.childNodes, recycleNode),
  SSR_NODE,
  node
);
var createVNode = (tag, { key, ...props }, children, type, node) => ({
  tag,
  props,
  key,
  children,
  type,
  node
});
var text = (value, node) => createVNode(value, EMPTY_OBJ, EMPTY_ARR, TEXT_NODE, node);
var h$1 = (tag, { class: c, ...props }, children = EMPTY_ARR) => createVNode(
  tag,
  { ...props, ...c ? { class: createClass(c) } : EMPTY_OBJ },
  isArray(children) ? children : [children]
);
var app = ({
  node,
  view,
  subscriptions,
  dispatch = id,
  init = EMPTY_OBJ
}) => {
  var vdom = node && recycleNode(node);
  var subs = [];
  var state;
  var busy;
  var update = (newState) => {
    if (state !== newState) {
      if ((state = newState) == null) dispatch = subscriptions = render = id;
      if (subscriptions) subs = patchSubs(subs, subscriptions(state), dispatch);
      if (view && !busy) enqueue(render, busy = true);
    }
  };
  var render = () => node = patch(
    node.parentNode,
    node,
    vdom,
    vdom = view(state),
    listener,
    busy = false
  );
  var listener = function(event) {
    dispatch(this.events[event.type], event);
  };
  return (dispatch = dispatch(
    (action, props) => typeof action === "function" ? dispatch(action(state, props)) : isArray(action) ? typeof action[0] === "function" ? dispatch(action[0], action[1]) : action.slice(1).map(
      (fx) => fx && fx !== true && (fx[0] || fx)(dispatch, fx[1]),
      update(action[0])
    ) : update(action)
  ))(init), dispatch;
};
function flattenAll(input, result = []) {
  input.forEach((x) => {
    if (Array.isArray(x)) flattenAll(x, result);
    else result.push(x);
  });
  return result;
}
const h = (type, props, ...children) => typeof type === "function" ? type(props, flattenAll(children)) : h$1(
  type,
  props || {},
  flattenAll(children).map(
    (child) => typeof child === "string" || typeof child === "number" ? text(child) : child
  )
);
const getValue = function(state, keyNames, def) {
  let result = state;
  for (const key of keyNames) {
    if (result == null || typeof result !== "object") return def;
    if (Object.prototype.hasOwnProperty.call(result, key)) {
      result = result[key];
    } else {
      return def;
    }
  }
  return result;
};
const setValue = function(state, keyNames, value) {
  let result = { ...state };
  let current = result;
  for (let i = 0; i < keyNames.length; i++) {
    const key = keyNames[i];
    if (Object.prototype.hasOwnProperty.call(current, key) && current[key] != null && typeof current[key] === "object") {
      current[key] = { ...current[key] };
    } else {
      current[key] = {};
    }
    if (keyNames.length - 1 === i) {
      current[key] = value;
    }
    current = current[key];
  }
  return result;
};
const createLocalKey = (id2) => `local_key_${id2}`;
const getLocalState = function(state, id2, def) {
  const localKey = createLocalKey(id2);
  const obj = Object.prototype.hasOwnProperty.call(state, localKey) ? state[localKey] : {};
  return {
    ...def,
    ...obj
  };
};
const setLocalState = function(state, id2, value) {
  const localKey = createLocalKey(id2);
  const obj = Object.prototype.hasOwnProperty.call(state, localKey) ? state[localKey] : {};
  return {
    ...state,
    [localKey]: {
      ...obj,
      ...value
    }
  };
};
const Route = function(props, children) {
  const { state, keyNames, match } = props;
  const selectedName = getValue(state, keyNames, "");
  return selectedName === match ? children : null;
};
const REVERSE_PREFIX = "r_";
const concatAction = function(action, newState, e) {
  if (!action) return newState;
  const effect = (dispatch) => {
    requestAnimationFrame(() => {
      dispatch((state) => action(state, e));
    });
  };
  return [newState, effect];
};
const getClassList = (props) => {
  return props.class ? props.class.trim().split(" ").filter(Boolean) : [];
};
const deleteKeys = (props, ...keys) => {
  const result = { ...props };
  keys.forEach((key) => delete result[key]);
  return result;
};
const SelectButton = function(props, children) {
  const { state, keyNames, id: id2, reverse = false } = props;
  const classList = getClassList(props).filter((item) => {
    const name = item.toLowerCase();
    return name !== "select" && name !== "reverse";
  });
  const selectedNames = getValue(state, keyNames, []);
  if (selectedNames.includes(id2)) classList.push("select");
  if (selectedNames.includes(`${REVERSE_PREFIX}${id2}`)) classList.push("reverse");
  const action = (state2, e) => {
    const selectedNames2 = getValue(state2, keyNames, []);
    const newList = selectedNames2.includes(id2) ? reverse ? selectedNames2.filter((item) => item !== id2).concat(`${REVERSE_PREFIX}${id2}`) : selectedNames2.filter((item) => item !== id2) : selectedNames2.includes(`${REVERSE_PREFIX}${id2}`) ? selectedNames2.filter((item) => item !== `${REVERSE_PREFIX}${id2}`) : selectedNames2.concat(id2);
    const newState = setValue(state2, keyNames, newList);
    return concatAction(props.onclick, newState, e);
  };
  return h("button", {
    type: "button",
    ...deleteKeys(props, "state", "keyNames", "reverse"),
    class: classList.join(" "),
    onclick: action
  }, children);
};
const OptionButton = function(props, children) {
  const { state, keyNames, id: id2, reverse = false } = props;
  const classList = getClassList(props).filter((item) => {
    const name = item.toLowerCase();
    return name !== "select" && name !== "reverse";
  });
  const selectedName = getValue(state, keyNames, "");
  if (selectedName === id2) classList.push("select");
  if (selectedName === `${REVERSE_PREFIX}${id2}`) classList.push("reverse");
  const action = (state2, e) => {
    const selectedName2 = getValue(state2, keyNames, "");
    const newValue = selectedName2 === id2 && reverse ? `${REVERSE_PREFIX}${id2}` : id2;
    const newState = setValue(state2, keyNames, newValue);
    return concatAction(props.onclick, newState, e);
  };
  return h("button", {
    type: "button",
    ...deleteKeys(props, "state", "keyNames", "reverse"),
    class: classList.join(" "),
    onclick: action
  }, children);
};
const effect_initializeNodes = function(nodes) {
  const done = /* @__PURE__ */ new Set();
  return (dispatch) => {
    nodes.forEach((node) => {
      if (done.has(node.id)) return;
      done.add(node.id);
      const element = document.getElementById(node.id);
      if (element) dispatch([node.event, element]);
    });
  };
};
const effect_setTimedValue = function(keyNames, id2, timeout, value, reset = null) {
  const NO_TIMER = 0;
  return (dispatch) => {
    dispatch((state) => {
      const { timerID } = getLocalState(state, id2, { timerID: NO_TIMER });
      if (timerID !== NO_TIMER) clearTimeout(timerID);
      return setLocalState(
        setValue(state, keyNames, value),
        id2,
        {
          timerID: setTimeout(() => {
            dispatch((state2) => setLocalState(
              setValue(state2, keyNames, reset),
              id2,
              {
                timerID: NO_TIMER
              }
            ));
          }, Math.max(0, timeout))
        }
      );
    });
  };
};
const action_throwMessageTick = function(keyNames, id2, text2, interval) {
  const NO_TIMER = 0;
  return (state) => {
    const local = getLocalState(state, id2, {
      timerID: NO_TIMER,
      msg: "",
      index: 0,
      paused: false
    });
    if (local.timerID !== NO_TIMER) clearTimeout(local.timerID);
    if (local.paused) return state;
    const index = text2 === local.msg ? local.index : 0;
    return [
      setValue(state, keyNames, text2.slice(0, index + 1)),
      (dispatch) => {
        dispatch((state2) => setLocalState(state2, id2, {
          timerID: index + 1 < text2.length ? setTimeout(() => {
            dispatch(action_throwMessageTick(
              keyNames,
              id2,
              text2,
              interval
            ));
          }, Math.max(0, interval)) : 0,
          msg: text2,
          index: index + 1
        }));
      }
    ];
  };
};
const effect_throwMessage = function(keyNames, id2, text2, interval) {
  return (dispatch) => {
    dispatch((state) => setLocalState(state, id2, {
      keyNames,
      msg: "",
      interval,
      index: 0,
      paused: false
    }));
    dispatch(action_throwMessageTick(keyNames, id2, text2, interval));
  };
};
const effect_pauseThrowMessage = function(id2) {
  return (dispatch) => {
    dispatch((state) => setLocalState(state, id2, { paused: true }));
  };
};
const effect_resumeThrowMessage = function(id2) {
  return (dispatch) => {
    dispatch((state) => setLocalState(state, id2, { paused: false }));
    dispatch((state) => {
      const { keyNames, msg, interval } = getLocalState(state, id2, {
        keyNames: [],
        msg: "",
        interval: 0,
        paused: false
      });
      return action_throwMessageTick(keyNames, id2, msg, interval);
    });
  };
};
const subscription_nodesCleanup = function(nodes) {
  const key = `local_key_lifecycle`;
  return nodes.map((node) => [
    (dispatch, payload) => {
      dispatch((state) => {
        const dom = document.getElementById(payload.id);
        const keys = [key, payload.id, "initialized"];
        const initialized = getValue(state, keys, false);
        if (dom && !initialized) {
          return setValue(state, keys, true);
        }
        if (!dom && initialized) {
          const newState = setValue(state, keys, false);
          return payload.finalize(newState);
        }
        return state;
      });
      return () => {
      };
    },
    node
  ]);
};
const getScrollMargin = function(e) {
  const el = e.currentTarget;
  if (!el) return { top: 0, left: 0, right: 0, bottom: 0 };
  return {
    top: el.scrollTop,
    left: el.scrollLeft,
    right: el.scrollWidth - (el.clientWidth + el.scrollLeft),
    bottom: el.scrollHeight - (el.clientHeight + el.scrollTop)
  };
};
const action_reset = (state) => ({
  selected: [],
  group0: "",
  group1: "",
  group2: "",
  timedText: "",
  throwMsg: "",
  node: null,
  finalize: false,
  margin: { top: 0, left: 0, right: 0, bottom: 0 }
});
const action_effectButtonClick = (state) => {
  const label = /* @__PURE__ */ h("label", null, "Label");
  const text2 = Array.from({ length: 40 }).map((_, i) => i).join("");
  return [
    state,
    effect_initializeNodes([
      {
        id: "initTest",
        event: (state2, element) => {
          const input = element;
          input.value = `initTest: width = ${input.clientWidth}, height = ${input.clientHeight}`;
          return state2;
        }
      }
    ]),
    effect_setTimedValue(["timedText"], "timedText", 2e3, "timedText", ""),
    effect_setTimedValue(["node"], "label1", 2e3, label, null),
    effect_throwMessage(["throwMsg"], "msg", text2, 50)
  ];
};
const action_throwAction = (state) => {
  return { ...state };
};
const action_toggleFinalize = (state) => {
  return setValue(state, ["finalize"], !state.finalize);
};
const action_scroll = (state, e) => {
  return setValue(state, ["margin"], getScrollMargin(e));
};
addEventListener("load", () => {
  const param = {
    selected: [],
    group0: "",
    group1: "",
    group2: "",
    timedText: "",
    throwMsg: "",
    node: null,
    finalize: false,
    margin: { top: 0, left: 0, right: 0, bottom: 0 }
  };
  app({
    node: document.getElementById("app"),
    init: param,
    view: (state) => /* @__PURE__ */ h("main", null, /* @__PURE__ */ h("div", null, /* @__PURE__ */ h(OptionButton, { state, keyNames: ["group0"], id: "page1" }, "SelectButton"), /* @__PURE__ */ h(OptionButton, { state, keyNames: ["group0"], id: "page2" }, "OptionButton"), /* @__PURE__ */ h(
      OptionButton,
      {
        state,
        keyNames: ["group0"],
        id: "page3",
        onclick: action_effectButtonClick
      },
      "Effect"
    ), /* @__PURE__ */ h(OptionButton, { state, keyNames: ["group0"], id: "page4" }, "Subscriptions"), /* @__PURE__ */ h(OptionButton, { state, keyNames: ["group0"], id: "page5" }, "DOM / Event"), /* @__PURE__ */ h("button", { type: "button", onclick: action_reset }, "reset")), /* @__PURE__ */ h("div", null, /* @__PURE__ */ h(Route, { state, keyNames: ["group0"], match: "page1" }, /* @__PURE__ */ h("h2", null, "SelectButton example"), /* @__PURE__ */ h("h3", null, "select / none"), /* @__PURE__ */ h(SelectButton, { state, keyNames: ["selected"], id: "btn1" }, "select / none"), /* @__PURE__ */ h("h3", null, "select / reverse / none"), /* @__PURE__ */ h(SelectButton, { state, keyNames: ["selected"], id: "btn2", reverse: true }, "select / reverse / none")), /* @__PURE__ */ h(Route, { state, keyNames: ["group0"], match: "page2" }, /* @__PURE__ */ h("h2", null, "OptionButton example"), /* @__PURE__ */ h("h3", null, "select"), /* @__PURE__ */ h(OptionButton, { state, keyNames: ["group1"], id: "g1_btn1" }, "group1_btn1"), /* @__PURE__ */ h(OptionButton, { state, keyNames: ["group1"], id: "g1_btn2" }, "group1_btn2"), /* @__PURE__ */ h(OptionButton, { state, keyNames: ["group1"], id: "g1_btn3" }, "group1_btn3"), /* @__PURE__ */ h("h3", null, "select / reverse"), /* @__PURE__ */ h(OptionButton, { state, keyNames: ["group2"], id: "g2_btn1", reverse: true }, "group2_btn1"), /* @__PURE__ */ h(OptionButton, { state, keyNames: ["group2"], id: "g2_btn2", reverse: true }, "group2_btn2"), /* @__PURE__ */ h(OptionButton, { state, keyNames: ["group2"], id: "g2_btn3", reverse: true }, "group2_btn3")), /* @__PURE__ */ h(Route, { state, keyNames: ["group0"], match: "page3" }, /* @__PURE__ */ h("h2", null, "Effect example"), /* @__PURE__ */ h("h3", null, "effect_initializeNodes"), /* @__PURE__ */ h("input", { type: "text", id: "initTest" }), /* @__PURE__ */ h("h3", null, "effect_setTimedValue"), /* @__PURE__ */ h("input", { type: "text", id: "timedText", value: state.timedText }), state.node, /* @__PURE__ */ h("h3", null, "effect_throwMessage"), /* @__PURE__ */ h("input", { type: "text", id: "msg", value: state.throwMsg }), /* @__PURE__ */ h("div", null, /* @__PURE__ */ h(
      "button",
      {
        type: "button",
        onclick: (state2) => [state2, effect_pauseThrowMessage("msg")]
      },
      "pause"
    ), /* @__PURE__ */ h(
      "button",
      {
        type: "button",
        onclick: (state2) => [state2, effect_resumeThrowMessage("msg")]
      },
      "resume"
    ))), /* @__PURE__ */ h(Route, { state, keyNames: ["group0"], match: "page4" }, /* @__PURE__ */ h("h2", null, "Subscriptions example"), /* @__PURE__ */ h("h2", null, "subscription_nodesCleanup"), /* @__PURE__ */ h("button", { type: "button", onclick: action_throwAction }, "throw action"), /* @__PURE__ */ h("button", { type: "button", onclick: action_toggleFinalize }, "toggle object"), state.finalize ? /* @__PURE__ */ h("span", { id: "dom" }, "object") : null), /* @__PURE__ */ h(Route, { state, keyNames: ["group0"], match: "page5" }, /* @__PURE__ */ h("h2", null, "DOM / Event example"), /* @__PURE__ */ h("h3", null, "getScrollMargin"), /* @__PURE__ */ h("div", { id: "parent", onscroll: action_scroll }, /* @__PURE__ */ h("div", { id: "child" }, "スクロールしてください")), /* @__PURE__ */ h("div", null, JSON.stringify(state.margin))))),
    subscriptions: (state) => subscription_nodesCleanup([{
      id: "dom",
      finalize: (state2) => {
        alert("finalize");
        return state2;
      }
    }])
  });
});
