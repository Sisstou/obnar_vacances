import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const require = createRequire(import.meta.url);
const ts = require('typescript');
const testDir = dirname(fileURLToPath(import.meta.url));
const gatePath = resolve(testDir, '../src/components/AdminGate.tsx');

function loadGate() {
  const source = readFileSync(gatePath, 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
    },
    fileName: gatePath,
  });
  const module = { exports: {} };
  const react = {
    useEffect: () => undefined,
    useState: () => [null, () => undefined],
  };
  const reactNative = {
    ActivityIndicator: 'ActivityIndicator',
    AppState: { addEventListener: (_event, callback) => {
      appStateListener = callback;
      return { remove: () => { appStateRemoved = true; } };
    } },
    Pressable: 'Pressable',
    StyleSheet: { create: (styles) => styles },
    Text: 'Text',
    View: 'View',
  };
  const jsxRuntime = {
    jsx: (type, props) => ({ type, props: props ?? {} }),
    jsxs: (type, props) => ({ type, props: props ?? {} }),
    Fragment: 'Fragment',
  };
  const localRequire = (specifier) => {
    if (specifier === 'react') return react;
    if (specifier === 'react-native') return reactNative;
    if (specifier === 'react/jsx-runtime') return jsxRuntime;
    if (specifier === '../services/admin-authorization.service') {
      return { verifyAdminAuthorization: async () => ({ status: 'unauthenticated' }) };
    }
    if (specifier === '../lib/supabase') {
      return {
        supabase: { auth: { onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }) } },
        supabaseConfigured: true,
      };
    }
    throw new Error(`Unexpected gate dependency: ${specifier}`);
  };

  vm.runInNewContext(compiled.outputText, {
    exports: module.exports,
    module,
    require: localRequire,
  }, { filename: gatePath });

  return module.exports;
}

test('renders protected children only for an authorized state', () => {
  const { getAdminGateContent } = loadGate();
  const protectedContent = { type: 'ProtectedAdminWorkspace' };
  const fallback = { type: 'AccessStatus' };

  assert.equal(
    getAdminGateContent(
      { status: 'authorized', userId: 'admin-1', checkedAt: 1 },
      protectedContent,
      fallback,
    ),
    protectedContent,
  );
});

test('fails closed for every non-authorized state', () => {
  const { getAdminGateContent } = loadGate();
  const protectedContent = { type: 'ProtectedAdminWorkspace' };
  const fallback = { type: 'AccessStatus' };
  const states = [
    { status: 'checking' },
    { status: 'unauthenticated' },
    { status: 'forbidden' },
    { status: 'session_expired' },
    { status: 'unavailable', retryable: true },
    { status: 'unavailable', retryable: false },
  ];

  for (const state of states) {
    assert.equal(
      getAdminGateContent(state, protectedContent, fallback),
      fallback,
      state.status,
    );
  }
});

test('returns null rather than protected content when no fallback is supplied', () => {
  const { getAdminGateContent } = loadGate();
  assert.equal(
    getAdminGateContent({ status: 'forbidden' }, { type: 'ProtectedAdminWorkspace' }),
    null,
  );
});

test('gate source revalidates on auth changes, foreground, and interval', () => {
  const source = readFileSync(gatePath, 'utf8');
  assert.match(source, /onAuthStateChange/);
  assert.match(source, /AppState\.addEventListener/);
  assert.match(source, /setInterval/);
  assert.match(source, /verifyAdminAuthorization/);
});


function loadGateWithLifecycle(verifyAdminAuthorization) {
  const source = readFileSync(gatePath, 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
    },
    fileName: gatePath,
  });
  const module = { exports: {} };
  const stateUpdates = [];
  const timers = new Map();
  let nextTimerId = 1;
  let effect;
  let authListener;
  let appStateListener;
  let authUnsubscribed = false;
  let appStateRemoved = false;
  const intervals = new Map();

  const react = {
    useEffect: (callback) => { effect = callback; },
    useState: (initial) => [
      initial,
      (next) => stateUpdates.push(typeof next === 'function' ? next(initial) : next),
    ],
  };
  const reactNative = {
    ActivityIndicator: 'ActivityIndicator',
    AppState: { addEventListener: () => ({ remove: () => undefined }) },
    Pressable: 'Pressable',
    StyleSheet: { create: (styles) => styles },
    Text: 'Text',
    View: 'View',
  };
  const jsxRuntime = {
    jsx: (type, props) => ({ type, props: props ?? {} }),
    jsxs: (type, props) => ({ type, props: props ?? {} }),
    Fragment: 'Fragment',
  };
  const localRequire = (specifier) => {
    if (specifier === 'react') return react;
    if (specifier === 'react-native') return reactNative;
    if (specifier === 'react/jsx-runtime') return jsxRuntime;
    if (specifier === '../services/admin-authorization.service') {
      return { verifyAdminAuthorization };
    }
    if (specifier === '../lib/supabase') {
      return {
        supabase: {
          auth: {
            onAuthStateChange: (callback) => {
              authListener = callback;
              return { data: { subscription: { unsubscribe() { authUnsubscribed = true; } } } };
            },
          },
        },
        supabaseConfigured: true,
      };
    }
    throw new Error(`Unexpected gate dependency: ${specifier}`);
  };

  vm.runInNewContext(compiled.outputText, {
    exports: module.exports,
    module,
    require: localRequire,
    setTimeout: (callback) => {
      const id = nextTimerId++;
      timers.set(id, callback);
      return id;
    },
    clearTimeout: (id) => timers.delete(id),
    setInterval: (callback) => {
      const id = nextTimerId++;
      intervals.set(id, callback);
      return id;
    },
    clearInterval: (id) => intervals.delete(id),
  }, { filename: gatePath });

  return {
    stateUpdates,
    mount() {
      module.exports.default({ children: { type: 'ProtectedAdminWorkspace' } });
      return effect();
    },
    emitAuthChange(session) {
      authListener(session ? 'SIGNED_IN' : 'SIGNED_OUT', session);
    },
    emitAppState(nextState) {
      appStateListener(nextState);
    },
    unmount(cleanup) {
      cleanup();
    },
    get cleanupStatus() {
      return { authUnsubscribed, appStateRemoved, intervalCount: intervals.size };
    },
    runInterval() {
      const entry = intervals.entries().next().value;
      assert.ok(entry, 'expected a scheduled revalidation interval');
      entry[1]();
    },
    runScheduledTimer() {
      const entry = timers.entries().next().value;
      assert.ok(entry, 'expected a scheduled Auth verification');
      const [id, callback] = entry;
      timers.delete(id);
      callback();
    },
  };
}

test('invalidates an in-flight admin result immediately when the account changes', async () => {
  let resolveFirstCheck;
  let calls = 0;
  const firstCheck = new Promise((resolve) => { resolveFirstCheck = resolve; });
  const gate = loadGateWithLifecycle(() => {
    calls += 1;
    return calls === 1
      ? firstCheck
      : Promise.resolve({ status: 'forbidden' });
  });

  gate.mount();
  assert.equal(calls, 1, 'initial authorization check starts');

  gate.emitAuthChange({ user: { id: 'regular-user' } });
  assert.equal(
    gate.stateUpdates.at(-1).status,
    'checking',
    'protected content is hidden immediately on account change',
  );

  resolveFirstCheck({ status: 'authorized', userId: 'previous-admin', checkedAt: 1 });
  await new Promise((resolve) => setImmediate(resolve));

  assert.equal(
    gate.stateUpdates.some((state) => state.status === 'authorized'),
    false,
    'the previous account result must not restore admin access',
  );

  gate.runScheduledTimer();
  await new Promise((resolve) => setImmediate(resolve));

  assert.equal(calls, 2, 'new account is checked after the Auth callback returns');
  assert.equal(gate.stateUpdates.at(-1).status, 'forbidden');
});


test('logout immediately denies access and invalidates an in-flight admin result', async () => {
  let resolveCheck;
  const pending = new Promise((resolve) => { resolveCheck = resolve; });
  const gate = loadGateWithLifecycle(() => pending);
  gate.mount();

  gate.emitAuthChange(null);
  assert.equal(gate.stateUpdates.at(-1).status, 'unauthenticated');

  resolveCheck({ status: 'authorized', userId: 'previous-admin', checkedAt: 2 });
  await new Promise((resolve) => setImmediate(resolve));

  assert.equal(
    gate.stateUpdates.some((state) => state.status === 'authorized'),
    false,
    'a pending result must not restore access after sign-out',
  );
});

test('only the latest of consecutive Auth events schedules a verification', async () => {
  let calls = 0;
  const gate = loadGateWithLifecycle(() => {
    calls += 1;
    return Promise.resolve({ status: 'forbidden' });
  });
  gate.mount();

  gate.emitAuthChange({ user: { id: 'user-a' } });
  gate.emitAuthChange({ user: { id: 'user-b' } });
  gate.runScheduledTimer();
  await new Promise((resolve) => setImmediate(resolve));

  assert.equal(calls, 2, 'initial check plus one check for the latest Auth event');
  assert.equal(gate.stateUpdates.at(-1).status, 'forbidden');
});

test('unmount cleans up subscriptions and ignores pending authorization results', async () => {
  let resolveCheck;
  const pending = new Promise((resolve) => { resolveCheck = resolve; });
  const gate = loadGateWithLifecycle(() => pending);
  const cleanup = gate.mount();

  gate.emitAuthChange({ user: { id: 'new-user' } });
  gate.unmount(cleanup);

  assert.deepEqual(gate.cleanupStatus, {
    authUnsubscribed: true,
    appStateRemoved: true,
    intervalCount: 0,
  });

  const updateCountAfterUnmount = gate.stateUpdates.length;
  resolveCheck({ status: 'authorized', userId: 'stale-admin', checkedAt: 3 });
  await new Promise((resolve) => setImmediate(resolve));

  assert.equal(
    gate.stateUpdates.length,
    updateCountAfterUnmount,
    'no state update is allowed after unmount',
  );
});

test('foreground and periodic revalidation can observe a revoked admin', async () => {
  let calls = 0;
  const gate = loadGateWithLifecycle(() => {
    calls += 1;
    return Promise.resolve(
      calls === 1
        ? { status: 'authorized', userId: 'admin-1', checkedAt: 1 }
        : { status: 'forbidden' },
    );
  });
  gate.mount();
  await new Promise((resolve) => setImmediate(resolve));

  gate.emitAppState('background');
  assert.equal(calls, 1, 'background transition does not trigger a check');

  gate.emitAppState('active');
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(gate.stateUpdates.at(-1).status, 'forbidden');

  gate.runInterval();
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(calls, 3, 'periodic revalidation invokes the authorization check');
  assert.equal(gate.stateUpdates.at(-1).status, 'forbidden');
});
