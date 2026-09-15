import { useState } from "react";
import { ScreenHeader } from "../components/ScreenHeader";
import { ToggleRow } from "../components/ToggleRow";
import { DeleteAccountSheet } from "./DeleteAccountSheet";
import styles from "./SettingsScreen.module.css";

interface SettingsScreenProps {
  currentPhone: string;
  blockedCount: number;
  grantedPermissions: number;
  offlineSim: boolean;
  onToggleOfflineSim: () => void;
  onBack: () => void;
  onOpenBlocked: () => void;
  onOpenPermissions: () => void;
  onOpenPhoneChange: () => void;
  onDeleteAccount: () => void;
  onShowToast: (message: string) => void;
}

export function SettingsScreen({
  currentPhone,
  blockedCount,
  grantedPermissions,
  offlineSim,
  onToggleOfflineSim,
  onBack,
  onOpenBlocked,
  onOpenPermissions,
  onOpenPhoneChange,
  onDeleteAccount,
  onShowToast,
}: SettingsScreenProps) {
  const [profileVisible, setProfileVisible] = useState(true);
  const [showDistance, setShowDistance] = useState(true);
  const [notifMatch, setNotifMatch] = useState(true);
  const [notifMessage, setNotifMessage] = useState(true);
  const [notifNews, setNotifNews] = useState(true);
  const [deleteOpen, setDeleteOpen] = useState(false);

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
              onToggle={() => setProfileVisible((v) => !v)}
            />
            <ToggleRow
              label="Mostrar distância"
              sub="Exibe a quantos km você está"
              on={showDistance}
              onToggle={() => setShowDistance((v) => !v)}
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
              on={notifMatch}
              onToggle={() => setNotifMatch((v) => !v)}
            />
            <ToggleRow
              label="Mensagens"
              sub="Avisa a cada mensagem recebida"
              on={notifMessage}
              onToggle={() => setNotifMessage((v) => !v)}
            />
            <ToggleRow
              label="Novidades do Lovi"
              sub="Dicas e recursos novos, no máximo uma vez por mês"
              on={notifNews}
              onToggle={() => setNotifNews((v) => !v)}
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
              <span className={styles.accessValue}>{currentPhone}</span>
            </button>
            <button
              type="button"
              className={styles.accessRow}
              onClick={() => onShowToast("Abriria os termos no navegador")}
            >
              Termos e política de privacidade
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

        <p className={styles.footerNote}>Lovi · versão de protótipo</p>
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
    </div>
  );
}
