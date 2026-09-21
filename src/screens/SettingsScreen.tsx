import { useState } from "react";
import { ScreenHeader } from "../components/ScreenHeader";
import { ToggleRow } from "../components/ToggleRow";
import type { AjustesDeNotificacao } from "../lib/api/settings";
import { exibeTelefone } from "../onboarding/phoneFormat";
import { DeleteAccountSheet } from "./DeleteAccountSheet";
import type { DocumentoLegal } from "./LegalScreen";
import styles from "./SettingsScreen.module.css";

interface SettingsScreenProps {
  currentPhone: string;
  blockedCount: number;
  grantedPermissions: number;
  offlineSim: boolean;
  profileVisible: boolean;
  showDistance: boolean;
  notifications: AjustesDeNotificacao;
  onToggleOfflineSim: () => void;
  onToggleProfileVisible: (valor: boolean) => void;
  onToggleShowDistance: (valor: boolean) => void;
  onToggleNotification: (chave: keyof AjustesDeNotificacao, valor: boolean) => void;
  onBack: () => void;
  onOpenBlocked: () => void;
  onOpenPermissions: () => void;
  onOpenPhoneChange: () => void;
  onOpenLegal: (documento: DocumentoLegal) => void;
  onExportData: () => void;
  onDeleteAccount: () => void;
}

export function SettingsScreen({
  currentPhone,
  blockedCount,
  grantedPermissions,
  offlineSim,
  profileVisible,
  showDistance,
  notifications,
  onToggleOfflineSim,
  onToggleProfileVisible,
  onToggleShowDistance,
  onToggleNotification,
  onBack,
  onOpenBlocked,
  onOpenPermissions,
  onOpenPhoneChange,
  onOpenLegal,
  onExportData,
  onDeleteAccount,
}: SettingsScreenProps) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [revogarOpen, setRevogarOpen] = useState(false);

  return (
    <div className={styles.screen}>
      <ScreenHeader title="Configurações e privacidade" onBack={onBack} size="lg" />

      <div className={styles.body}>
        <div className={styles.group}>
          <span className={styles.groupLabel}>Privacidade</span>
          <div className={styles.card}>
            <ToggleRow
              label="Perfil visível"
              sub="Desligado, ninguém vê seu perfil na fila"
              on={profileVisible}
              onToggle={() => onToggleProfileVisible(!profileVisible)}
            />
            <ToggleRow
              label="Mostrar distância"
              sub="Exibe a quantos km você está"
              on={showDistance}
              onToggle={() => onToggleShowDistance(!showDistance)}
            />
            <ToggleRow
              label="Simular sem conexão"
              sub="Só no protótipo: liga os estados de erro de rede"
              on={offlineSim}
              onToggle={onToggleOfflineSim}
            />
          </div>
        </div>

        <div className={styles.group}>
          <span className={styles.groupLabel}>Notificações</span>
          <div className={styles.card}>
            <ToggleRow
              label="Novos matches"
              sub="Avisa quando alguém combina com você"
              on={notifications.notifMatch}
              onToggle={() => onToggleNotification("notifMatch", !notifications.notifMatch)}
            />
            <ToggleRow
              label="Mensagens"
              sub="Avisa a cada mensagem recebida"
              on={notifications.notifMensagem}
              onToggle={() => onToggleNotification("notifMensagem", !notifications.notifMensagem)}
            />
            <ToggleRow
              label="Novidades do Lovi"
              sub="Dicas e recursos novos, no máximo uma vez por mês"
              on={notifications.notifNovidades}
              onToggle={() =>
                onToggleNotification("notifNovidades", !notifications.notifNovidades)
              }
            />
          </div>
        </div>

        <div className={styles.group}>
          <span className={styles.groupLabel}>Conta</span>
          <div className={styles.card}>
            <button type="button" className={styles.accessRow} onClick={onOpenBlocked}>
              Perfis bloqueados
              <span className={styles.accessValue}>{blockedCount}</span>
            </button>
            <button type="button" className={styles.accessRow} onClick={onOpenPermissions}>
              Permissões do app
              <span className={styles.accessValue}>{grantedPermissions} de 3</span>
            </button>
            <button type="button" className={styles.accessRow} onClick={onOpenPhoneChange}>
              Trocar número
              <span className={styles.accessValue}>{exibeTelefone(currentPhone)}</span>
            </button>
            <button
              type="button"
              className={styles.accessRow}
              onClick={() => onOpenLegal("termos")}
            >
              Termos de uso
              <span className={styles.accessValue}>›</span>
            </button>
            <button
              type="button"
              className={styles.accessRow}
              onClick={() => onOpenLegal("privacidade")}
            >
              Política de privacidade
              <span className={styles.accessValue}>›</span>
            </button>
            <button
              type="button"
              className={styles.accessRow}
              onClick={() => onOpenLegal("diretrizes")}
            >
              Diretrizes de comunidade
              <span className={styles.accessValue}>›</span>
            </button>
            <button type="button" className={styles.accessRow} onClick={onExportData}>
              Baixar meus dados
              <span className={styles.accessValue}>›</span>
            </button>
            <button
              type="button"
              className={styles.accessRow}
              onClick={() => setRevogarOpen(true)}
            >
              Revogar consentimento
              <span className={styles.accessValue}>›</span>
            </button>
            <button
              type="button"
              className={`${styles.accessRow} ${styles.accessRowDestructive}`}
              onClick={() => setDeleteOpen(true)}
            >
              Excluir minha conta
              <span className={styles.accessValueDestructive}>›</span>
            </button>
          </div>
        </div>

        <p className={styles.footerNote}>Lovi · versão de testes</p>
      </div>

      {deleteOpen && (
        <DeleteAccountSheet
          onCancel={() => setDeleteOpen(false)}
          onConfirm={() => {
            setDeleteOpen(false);
            onDeleteAccount();
          }}
        />
      )}

      {/* Revogar o consentimento dos dados sensíveis encerra a conta: sem
          preferência de interesse, cidade e fotos o app não funciona. */}
      {revogarOpen && (
        <DeleteAccountSheet
          title="Revogar consentimento"
          body="Sem o consentimento para tratar sua preferência de interesse, cidade e fotos, o Lovi não tem como funcionar. Revogar encerra sua conta e apaga seus dados."
          confirmLabel="Revogar e excluir conta"
          onCancel={() => setRevogarOpen(false)}
          onConfirm={() => {
            setRevogarOpen(false);
            onDeleteAccount();
          }}
        />
      )}
    </div>
  );
}
