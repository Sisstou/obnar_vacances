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
