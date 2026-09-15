import { useEffect, useRef, useState } from "react";
import { icebreakersFor } from "../chats/icebreakers";
import { ReportSheet } from "../components/ReportSheet";
import { CURRENT_USER_INTERESTS, findProfileById } from "../data/mockProfiles";
import type { Chat } from "../types";
import styles from "./ChatScreen.module.css";

const REPLY_POOL = [
  "Oi! Tudo bem?",
  "Haha, gostei da resposta.",
  "Também curto isso!",
  "Bora marcar um café então?",
  "Que bom falar com alguém assim.",
  "Concordo demais. Você faz o quê no fim de semana?",
];

const REPLY_DELAY_MS = 1400;

interface ChatScreenProps {
  chat: Chat;
  offline: boolean;
  onBack: () => void;
  onSend: (chatId: string, text: string, failed?: boolean) => void;
  onReceive: (chatId: string, text: string) => void;
  onRetryMessage: (chatId: string, index: number) => void;
  onUndoMatch: (chatId: string) => void;
  onLockChat: (chatId: string) => void;
  onUnlockChat: (chatId: string) => void;
  onOpenProfile: (profileId: string) => void;
  onShowToast: (message: string) => void;
}

export function ChatScreen({
  chat,
  offline,
  onBack,
  onSend,
  onReceive,
  onRetryMessage,
  onUndoMatch,
  onLockChat,
  onUnlockChat,
  onOpenProfile,
  onShowToast,
}: ChatScreenProps) {
  const [draft, setDraft] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight });
  }, [chat.messages, isTyping]);

  const relatedProfile = findProfileById(chat.profileId);

  function handleSend(text: string) {
    const trimmed = text.trim();
    if (!trimmed || chat.locked) return;
    if (offline) {
      onSend(chat.id, trimmed, true);
      setDraft("");
      onShowToast("Sem conexão. A mensagem não foi enviada.");
      return;
    }
    onSend(chat.id, trimmed);
    setDraft("");
    setIsTyping(true);
    window.setTimeout(() => {
      const reply = REPLY_POOL[Math.floor(Math.random() * REPLY_POOL.length)];
      onReceive(chat.id, reply);
      setIsTyping(false);
    }, REPLY_DELAY_MS);
  }

  return (
    <div className={styles.screen}>
      <div className={styles.header}>
        <button type="button" className={styles.backButton} onClick={onBack} aria-label="Voltar">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M15 4l-8 8 8 8"
              stroke="#16211A"
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <button
          type="button"
          className={styles.avatarButton}
          onClick={() => onOpenProfile(chat.profileId)}
          aria-label={`Ver perfil de ${chat.name}`}
        >
          <img className={styles.avatar} src={chat.photo} alt={chat.name} />
        </button>
        <div className={styles.headerInfo}>
          <div className={styles.headerName}>{chat.name}</div>
        </div>
        <div className={styles.menuWrap}>
          <button
            type="button"
            className={styles.menuButton}
            aria-label="Mais opções"
            onClick={() => setMenuOpen((prev) => !prev)}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="12" cy="5" r="2" fill="#8A928B" />
              <circle cx="12" cy="12" r="2" fill="#8A928B" />
              <circle cx="12" cy="19" r="2" fill="#8A928B" />
            </svg>
          </button>
          {menuOpen && (
            <>
              <button
                type="button"
                className={styles.menuBackdrop}
                aria-label="Fechar menu"
                onClick={() => setMenuOpen(false)}
              />
              <div className={styles.menuCard}>
                <button
                  type="button"
                  className={styles.menuItem}
                  disabled={chat.locked}
                  onClick={() => {
                    setMenuOpen(false);
                    onLockChat(chat.id);
                    onShowToast("Conversa finalizada e arquivada");
                    onBack();
                  }}
                >
                  <svg width="19" height="19" viewBox="0 0 24 24" aria-hidden="true">
                    <rect x="5" y="10.5" width="14" height="9.5" rx="3" fill="#5C6660" />
                    <path
                      d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5"
                      stroke="#5C6660"
                      strokeWidth={2}
                      fill="none"
                      strokeLinecap="round"
                    />
                  </svg>
                  Finalizar a conversa
                </button>
                <button
                  type="button"
                  className={styles.menuItem}
                  onClick={() => {
                    setMenuOpen(false);
                    setReportOpen(true);
                  }}
                >
                  <svg width="19" height="19" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      d="M5 3v18M5 4h11l-2 4 2 4H5"
                      fill="none"
                      stroke="#5C6660"
                      strokeWidth={2}
                      strokeLinejoin="round"
                      strokeLinecap="round"
                    />
                  </svg>
                  Denunciar perfil
                </button>
                <button
                  type="button"
                  className={`${styles.menuItem} ${styles.menuItemDestructive}`}
                  onClick={() => {
                    setMenuOpen(false);
                    onUndoMatch(chat.id);
                  }}
                >
                  <svg width="19" height="19" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      d="M12 20.4c-6-4.1-8.8-7.4-8.8-10.6A4.5 4.5 0 0 1 12 7.5a4.5 4.5 0 0 1 8.8 2.3c0 3.2-2.8 6.5-8.8 10.6z"
                      fill="none"
                      stroke="#C8353C"
                      strokeWidth={2}
                      strokeLinejoin="round"
                    />
                    <path d="M4.5 4.5l15 15" stroke="#C8353C" strokeWidth={2} strokeLinecap="round" />
                  </svg>
                  Desfazer match
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <div className={styles.body} ref={bodyRef}>
        <p className={styles.stamp}>
          {chat.isNew ? "Vocês deram match agora" : "Vocês deram match ontem"}
        </p>

        {chat.messages.map((message, index) => (
          <div
            key={index}
            className={message.mine ? `${styles.bubbleRow} ${styles.bubbleRowMine}` : styles.bubbleRow}
          >
            <div className={styles.bubbleStack}>
              <div
                className={message.mine ? `${styles.bubble} ${styles.bubbleMine}` : styles.bubble}
              >
                {message.text}
              </div>
              {message.failed && (
                <div className={styles.failedRow}>
                  <span className={styles.failedLabel}>Não enviada</span>
                  <button
                    type="button"
                    className={styles.retryLink}
                    onClick={() => {
                      if (offline) {
                        onShowToast("Ainda sem conexão");
                        return;
                      }
                      onRetryMessage(chat.id, index);
                      onShowToast("Mensagem enviada");
                    }}
                  >
                    Tentar de novo
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className={styles.bubbleRow}>
            <div className={styles.typingBubble}>
              <span className={styles.typingDot} style={{ animationDelay: "0ms" }} />
              <span className={styles.typingDot} style={{ animationDelay: "150ms" }} />
              <span className={styles.typingDot} style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        )}
      </div>

      {chat.locked ? (
        <div className={styles.lockedBar}>
          <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
            <rect x="5" y="10.5" width="14" height="9.5" rx="3" fill="#8A928B" />
            <path
              d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5"
              stroke="#8A928B"
              strokeWidth={2}
              fill="none"
              strokeLinecap="round"
            />
          </svg>
          <div className={styles.lockedMain}>
            <span className={styles.lockedText}>Conversa finalizada</span>
            <span className={styles.lockedSub}>Ela fica arquivada e ninguém pode escrever.</span>
          </div>
          <button
            type="button"
            className={styles.reopenLink}
            onClick={() => {
              onUnlockChat(chat.id);
              onShowToast("Conversa reaberta");
            }}
          >
            Reabrir
          </button>
        </div>
      ) : (
        <div className={styles.footer}>
          <div className={styles.icebreakers}>
            {icebreakersFor(relatedProfile?.interests ?? [], CURRENT_USER_INTERESTS).map(
              (suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  className={styles.icebreakerChip}
                  onClick={() => setDraft(suggestion)}
                >
                  {suggestion}
                </button>
              ),
            )}
          </div>

          <div className={styles.inputRow}>
            <input
              className={styles.input}
              type="text"
              placeholder="Escreva sua mensagem aqui"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSend(draft);
              }}
            />
            <button
              type="button"
              className={styles.sendButton}
              onClick={() => handleSend(draft)}
              aria-label="Enviar mensagem"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M5 4.6l14.2 6.5a1 1 0 0 1 0 1.8L5 19.4a1 1 0 0 1-1.4-1.1l1.6-6.3-1.6-6.3A1 1 0 0 1 5 4.6z"
                  fill="#fff"
                />
              </svg>
            </button>
          </div>
        </div>
      )}

      {reportOpen && (
        <ReportSheet
          name={chat.name}
          onCancel={() => setReportOpen(false)}
          onSelectReason={() => {
            setReportOpen(false);
            onShowToast("Denúncia enviada. Obrigado por avisar.");
          }}
        />
      )}
    </div>
  );
}
