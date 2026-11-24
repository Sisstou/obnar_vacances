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
const adapterPath = resolve(testDir, '../src/components/AdminPanelRenderAdapter.tsx');

function createElement(type, props, key = null) {
  return { type, props: props ?? {}, key };
}

function loadAdapter() {
  const source = readFileSync(adapterPath, 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
    },
    fileName: adapterPath,
  });

  const panelNames = [
    'AdminUsersPanel',
    'AdminOwnerVerificationPanel',
    'AdminListingReviewPanel',
    'AdminLocationsPanel',
    'AdminLocalDirectoryPanel',
    'AdminLocalDirectoryRequestsPanel',
    'AdminComplaintsPanel',
    'AdminReviewsPanel',
    'AdminNotificationsPanel',
    'AdminFinancialOverviewPanel',
    'AdminActivityLogPanel',
    'AdminUserActivityLogPanel',
    'AdminBackupHistoryPanel',
    'AdminReleaseHistoryPanel',
    'AdminDataRequestsPanel',
    'AdminPrivacyRequestsPanel',
    'AdminPrivacyRetentionPanel',
    'AdminConsentHistoryPanel',
    'AdminLegalChangesPanel',
    'AdminPublicInfoPanel',
    'AdminPlatformSettingsPanel',
    'AdminSecurityOverviewPanel',
    'AdminSystemHealthPanel',
    'AdminErrorLogPanel',
    'AdminUserSessionsPanel',
  ];
  const panels = Object.fromEntries(
    panelNames.map((name) => [`./${name}`, Object.assign(() => null, { panelName: name })]),
  );
  const components = {
    ActivityIndicator: 'ActivityIndicator',
    StyleSheet: { create: (styles) => styles },
    Text: 'Text',
    View: 'View',
  };
  const react = { createElement };
  const jsxRuntime = {
    jsx: (type, props, key) => createElement(type, props, key),
    jsxs: (type, props, key) => createElement(type, props, key),
    Fragment: 'Fragment',
  };

  const module = { exports: {} };
  const localRequire = (specifier) => {
    if (specifier === 'react') return react;
    if (specifier === 'react-native') return components;
    if (specifier === 'react/jsx-runtime') return jsxRuntime;
    if (Object.hasOwn(panels, specifier)) return panels[specifier];
    throw new Error(`Unexpected adapter dependency: ${specifier}`);
  };

  vm.runInNewContext(compiled.outputText, {
    exports: module.exports,
    module,
    require: localRequire,
    Object,
  }, { filename: adapterPath });

  return module.exports;
}

function findElement(node, type) {
  if (!node || typeof node !== 'object') return undefined;
  if (node.type === type) return node;
  const children = node.props?.children;
  for (const child of Array.isArray(children) ? children : [children]) {
    const match = findElement(child, type);
    if (match) return match;
  }
  return undefined;
}

test('renders the component registered for the selected panel and applies current language', () => {
  const { renderAdminPanel } = loadAdapter();
  const state = { status: 'success', props: { marker: 'users-only' } };

  const arabic = renderAdminPanel('users', state, 'ar');
  const french = renderAdminPanel('users', state, 'fr');

  assert.equal(arabic.type.panelName, 'AdminUsersPanel');
  assert.equal(arabic.props.marker, 'users-only');
  assert.equal(arabic.props.language, 'ar');
  assert.equal(french.props.language, 'fr');
});

test('renders an idle state when a panel has no state or is explicitly idle', () => {
  const { renderAdminPanel } = loadAdapter();

  for (const state of [undefined, { status: 'idle' }]) {
    const element = renderAdminPanel('users', state, 'ar');
    const text = findElement(element, 'Text');
    assert.equal(text.props.children, 'لا تتوفر بيانات لهذه اللوحة حالياً.');
  }
});

test('renders a loading indicator and localized loading message', () => {
  const { renderAdminPanel } = loadAdapter();
  const element = renderAdminPanel('users', { status: 'loading' }, 'fr');

  assert.ok(findElement(element, 'ActivityIndicator'));
  assert.equal(
    findElement(element, 'Text').props.children,
    'Chargement des données du panneau…',
  );
});

test('renders the safe user-facing error message without exposing unrelated state', () => {
  const { renderAdminPanel } = loadAdapter();
  const element = renderAdminPanel(
    'users',
    { status: 'error', message: 'تعذر تحميل المستخدمين' },
    'ar',
  );

  assert.equal(findElement(element, 'Text').props.children, 'تعذر تحميل المستخدمين');
});

test('bookings always render the not-implemented placeholder in Arabic and French', () => {
  const { createAdminPanelRenderer } = loadAdapter();
  const renderer = createAdminPanelRenderer({
    users: { status: 'success', props: { marker: 'must-not-leak' } },
  });

  const arabic = renderer('bookings', 'ar');
  const french = renderer('bookings', 'fr');

  assert.equal(
    findElement(arabic, 'Text').props.children,
    'لوحة الحجوزات غير منفذة بعد. لن يتم عرض حجوزات الاختبار أو اعتبارها بيانات إنتاجية.',
  );
  assert.equal(
    findElement(french, 'Text').props.children,
    'Le panneau des réservations n’est pas encore implémenté. Les réservations de test ne seront pas affichées comme des données de production.',
  );
  assert.equal(JSON.stringify(arabic).includes('must-not-leak'), false);
  assert.equal(JSON.stringify(french).includes('must-not-leak'), false);
});

test('a missing panel entry stays idle and does not reuse another panel props', () => {
  const { createAdminPanelRenderer } = loadAdapter();
  const renderer = createAdminPanelRenderer({
    users: { status: 'success', props: { marker: 'users-only' } },
  });

  const complaints = renderer('complaints', 'fr');
  assert.equal(
    findElement(complaints, 'Text').props.children,
    'Aucune donnée disponible pour ce panneau.',
  );
  assert.equal(JSON.stringify(complaints).includes('users-only'), false);
});
