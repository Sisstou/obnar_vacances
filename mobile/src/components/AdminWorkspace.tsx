import React, { useState } from 'react';
import AdminNavigationShell, {
  AdminLanguage,
  AdminPanelId,
} from './AdminNavigationShell';

type Props = {
  language: AdminLanguage;
  /**
   * Render the selected panel with sanitized data from an already-authorized
   * parent. Return null or a safe placeholder when no trusted source is ready.
   */
  renderPanel: (panelId: AdminPanelId, language: AdminLanguage) => React.ReactNode;
  initialPanelId?: AdminPanelId;
  onPanelChange?: (panelId: AdminPanelId) => void;
};

/**
 * Stateful presentation adapter between AdminNavigationShell and the
 * independently implemented administrative panels.
 *
 * The caller is responsible for authenticating and authorizing the admin
 * against a trusted backend before mounting this workspace. The renderPanel
 * callback must pass only sanitized, production-approved data and must not
 * treat staging fixtures as live records.
 *
 * This component intentionally has no Supabase client, network calls,
 * persistence, role inference, or administrative write actions.
 */
export default function AdminWorkspace({
  language,
  renderPanel,
  initialPanelId = 'users',
  onPanelChange,
}: Props) {
  const [selectedPanelId, setSelectedPanelId] = useState<AdminPanelId>(initialPanelId);

  const handleSelectPanel = (panelId: AdminPanelId) => {
    setSelectedPanelId(panelId);
    onPanelChange?.(panelId);
  };

  return (
    <AdminNavigationShell
      language={language}
      selectedPanelId={selectedPanelId}
      onSelectPanel={handleSelectPanel}
    >
      {renderPanel(selectedPanelId, language)}
    </AdminNavigationShell>
  );
}
