import { useCallback, useEffect, useState } from "react";
import { BottomNav } from "./components/BottomNav";
import { Toast } from "./components/Toast";
import { useChats } from "./chats/useChats";
import { useDiscoverQueue } from "./discover/useDiscoverQueue";
import { useToast } from "./hooks/useToast";
import { aoMudarSessao, sair } from "./lib/api/auth";
import { erroDeConfiguracao } from "./lib/supabaseClient";
import { carregarPerfilDoMatch } from "./lib/api/matches";
import { tempoRelativo } from "./chats/tempo";
import {
  atualizarTelefone,
  carregarMeuPerfil,
  definirMostrarDistancia,
  definirVisibilidade,
  salvarFiltros,
  salvarPerfil,
} from "./lib/api/profile";
import { excluirConta, exportarMeusDados } from "./lib/api/privacy";
import { bloquear, denunciar, desbloquear, listarBloqueados } from "./lib/api/safety";
import { carregarAjustes, salvarAjustes, type AjustesDeNotificacao } from "./lib/api/settings";
import { mensagemDeErro } from "./lib/errors";
import {
  atualizarLocalizacaoNaAbertura,
  estadoDaPermissao,
  pedirEAtualizarLocalizacao,
  usarCidadeComoLocalizacao,
  type EstadoDaPermissao,
} from "./lib/geo";
import { OnboardingFlow } from "./onboarding/OnboardingFlow";
import { BlockedProfilesScreen, type BlockedProfile } from "./screens/BlockedProfilesScreen";
import { ChatScreen } from "./screens/ChatScreen";
import { ConfigErrorScreen } from "./screens/ConfigErrorScreen";
import { ChatsScreen } from "./screens/ChatsScreen";
import { DiscoverScreen } from "./screens/DiscoverScreen";
import { EditProfileScreen } from "./screens/EditProfileScreen";
import { FiltersScreen } from "./screens/FiltersScreen";
import { LegalScreen, type DocumentoLegal } from "./screens/LegalScreen";
import { LocationBlockedScreen } from "./screens/LocationBlockedScreen";
import { MatchOverlay } from "./screens/MatchOverlay";
import {
  PermissionsScreen,
  type PermissionKey,
  type PermissionState,
} from "./screens/PermissionsScreen";
import { PhoneChangeScreen } from "./screens/PhoneChangeScreen";
import { ProfileDetailScreen } from "./screens/ProfileDetailScreen";
import { ProfileScreen } from "./screens/ProfileScreen";
import { SettingsScreen } from "./screens/SettingsScreen";
import { VerifyProfileScreen } from "./screens/VerifyProfileScreen";
import type { Filters, MyProfile, OnboardingStep, Profile, Tab } from "./types";

type Stage = "carregando" | "onboarding" | "main";

const INITIAL_FILTERS: Filters = {
  intention: "todas",
  distanceKm: 25,
  minAge: 25,
  maxAge: 45,
  interestedIn: "todos",
};

const AJUSTES_PADRAO: AjustesDeNotificacao = {
  notifMatch: true,
  notifMensagem: true,
  notifNovidades: true,
};

export default function App() {
  const [stage, setStage] = useState<Stage>("carregando");
  const [tab, setTab] = useState<Tab>("discover");

  const [myProfile, setMyProfile] = useState<MyProfile | null>(null);
  const [filters, setFilters] = useState<Filters>(INITIAL_FILTERS);
  const [versaoDosFiltros, setVersaoDosFiltros] = useState(0);
  const [ajustes, setAjustes] = useState<AjustesDeNotificacao>(AJUSTES_PADRAO);

  const [detailProfile, setDetailProfile] = useState<Profile | null>(null);
  const [detailChatId, setDetailChatId] = useState<string | null>(null);
  const [chatProfile, setChatProfile] = useState<Profile | null>(null);

  const [editingProfile, setEditingProfile] = useState(false);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [blockedOpen, setBlockedOpen] = useState(false);
  const [permissionsOpen, setPermissionsOpen] = useState(false);
  const [phoneChangeOpen, setPhoneChangeOpen] = useState(false);
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [documentoLegal, setDocumentoLegal] = useState<DocumentoLegal | null>(null);

  const [blockedProfiles, setBlockedProfiles] = useState<BlockedProfile[]>([]);
  const [offlineSim, setOfflineSim] = useState(false);
  const [permissions, setPermissions] = useState<Record<PermissionKey, PermissionState>>({
    local: "ask",
    notif: "ask",
    cam: "ask",
  });

  const [passoDoCadastro, setPassoDoCadastro] = useState<OnboardingStep>(null);
  const [temLocalizacao, setTemLocalizacao] = useState(true);
  const [permissaoLocal, setPermissaoLocal] = useState<EstadoDaPermissao>("perguntar");
  const [localGateAberto, setLocalGateAberto] = useState(false);

  const { message: toastMessage, showToast } = useToast();

  const chats = useChats({ ativo: stage === "main", onError: showToast });
  const discover = useDiscoverQueue({
    ativo: stage === "main",
    versaoDosFiltros,
    onMatch: () => void chats.recarregar(),
    onLikeWithoutMatch: (profile) =>
      showToast(`Você curtiu ${profile.name.split(" ")[0]}. Avisamos se ela curtir de volta.`),
    onError: showToast,
  });

  const carregarSessao = useCallback(async () => {
    try {
      const dados = await carregarMeuPerfil();
      if (!dados) {
        setMyProfile(null);
        setPassoDoCadastro(null);
        setStage("onboarding");
        return;
      }
      setMyProfile(dados.perfil);
      setFilters(dados.filtros);
      setTemLocalizacao(dados.temLocalizacao);
      // Conta criada mas cadastro inacabado (e-mail confirmado agora, ou saiu
      // no meio): retoma do passo seguinte, sem pedir a conta de novo.
      setPassoDoCadastro(dados.cadastroCompleto ? null : "name-birthdate");
      setStage(dados.cadastroCompleto ? "main" : "onboarding");
    } catch (problema) {
      showToast(mensagemDeErro(problema));
      setStage("onboarding");
    }
  }, [showToast]);

  useEffect(() => {
    void carregarSessao();
  }, [carregarSessao]);

  // A sessão também pode nascer fora daqui: ao voltar do link de confirmação
  // de e-mail, ou ao entrar/sair em outra aba.
  useEffect(() => {
    return aoMudarSessao(() => void carregarSessao());
  }, [carregarSessao]);

  // Localização na abertura: só com a permissão já concedida, nunca em background.
  useEffect(() => {
    if (stage !== "main") return;
    void (async () => {
      const resultado = await atualizarLocalizacaoNaAbertura();
      setPermissaoLocal(resultado.estado);
      setPermissions((prev) => ({
        ...prev,
        local: resultado.estado === "concedida" ? "granted" : prev.local,
      }));
      if (resultado.atualizada) {
        setTemLocalizacao(true);
        setVersaoDosFiltros((valor) => valor + 1);
        return;
      }
      if (!temLocalizacao) setLocalGateAberto(true);
    })();
    // A checagem roda uma vez por entrada no app.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  useEffect(() => {
    if (stage !== "main") return;
    void carregarAjustes().then(setAjustes);
  }, [stage]);

  async function abrirBloqueados() {
    setBlockedOpen(true);
    try {
      const lista = await listarBloqueados();
      setBlockedProfiles(
        lista.map((item) => ({
          id: item.id,
          name: item.nome,
          photo: item.foto,
          when: tempoRelativo(item.criadoEm),
        })),
      );
    } catch (problema) {
      showToast(mensagemDeErro(problema));
    }
  }

  function openProfile(profile: Profile, chatId: string | null = null) {
    setDetailProfile(profile);
    setDetailChatId(chatId);
  }

  async function openProfileById(profileId: string, chatId: string | null = null) {
    try {
      const profile = await carregarPerfilDoMatch(profileId);
      if (!profile) {
        showToast("Perfil não disponível");
        return;
      }
      openProfile(profile, chatId);
    } catch (problema) {
      showToast(mensagemDeErro(problema));
    }
  }

  async function bloquearPerfil(profile: Profile) {
    try {
      await bloquear(profile.id);
      showToast(`${profile.name} bloqueado. Não aparecerá mais para você.`);
      setVersaoDosFiltros((valor) => valor + 1);
      void chats.recarregar();
    } catch (problema) {
      showToast(mensagemDeErro(problema));
    }
  }

  async function denunciarPerfil(profileId: string, motivo: string) {
    try {
      await denunciar(profileId, motivo);
      showToast("Denúncia enviada. Obrigado por avisar.");
    } catch (problema) {
      showToast(mensagemDeErro(problema));
    }
  }

  async function aplicarFiltros(novos: Filters) {
    setFilters(novos);
    try {
      await salvarFiltros(novos);
      setVersaoDosFiltros((valor) => valor + 1);
      setMyProfile((prev) => (prev ? { ...prev, interestedIn: novos.interestedIn } : prev));
      showToast("Filtros aplicados — fila de perfis refeita");
    } catch (problema) {
      showToast(mensagemDeErro(problema));
    }
  }

  async function logout() {
    try {
      await sair();
    } catch {
      /* já estamos saindo de qualquer forma */
    }
    setStage("onboarding");
    setMyProfile(null);
    setPassoDoCadastro(null);
    setTab("discover");
    setFilters(INITIAL_FILTERS);
    setBlockedProfiles([]);
    setOfflineSim(false);
    chats.resetChats();
    setSettingsOpen(false);
    setEditingProfile(false);
    setFiltersOpen(false);
    setActiveChatId(null);
    setDetailProfile(null);
    setVerifyOpen(false);
    setLocalGateAberto(false);
  }

  async function baixarMeusDados() {
    try {
      const dados = await exportarMeusDados();
      const blob = new Blob([JSON.stringify(dados, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "meus-dados-lovi.json";
      link.click();
      URL.revokeObjectURL(url);
      showToast("Arquivo gerado com seus dados");
    } catch (problema) {
      showToast(mensagemDeErro(problema));
    }
  }

  async function excluirMinhaConta() {
    try {
      await excluirConta();
      showToast("Conta excluída. Sentiremos sua falta.");
      await logout();
    } catch (problema) {
      showToast(mensagemDeErro(problema));
    }
  }

  const activeChat = activeChatId
    ? chats.chats.find((chat) => chat.id === activeChatId)
    : undefined;
  const activeChatProfileId = activeChat?.profileId ?? null;

  // Perfil da pessoa da conversa aberta — usado pelos quebra-gelos.
  useEffect(() => {
    if (!activeChatProfileId) return;
    let cancelado = false;
    void carregarPerfilDoMatch(activeChatProfileId).then((perfil) => {
      if (!cancelado) setChatProfile(perfil);
    });
    return () => {
      cancelado = true;
    };
  }, [activeChatProfileId]);

  const totalUnread = chats.chats.reduce((sum, chat) => sum + chat.unread, 0);
  const conversationsCount = chats.chats.filter((chat) => chat.messages.length > 1).length;
  const grantedPermissions = Object.values(permissions).filter(
    (value) => value === "granted",
  ).length;
  const myInterests = myProfile?.interests ?? [];
  const verificado = myProfile?.verificationStatus === "aprovada";

  /** Tela sobreposta à navegação por abas; null = está nas abas. */
  const overlayScreen = (() => {
    if (erroDeConfiguracao) return <ConfigErrorScreen message={erroDeConfiguracao} />;

    if (stage === "carregando") return <div className="app-loading" aria-label="Carregando" />;

    if (stage === "onboarding") {
      return (
        <OnboardingFlow
          onShowToast={showToast}
          onOpenLegal={setDocumentoLegal}
          passoInicial={passoDoCadastro ?? undefined}
          onComplete={() => void carregarSessao()}
        />
      );
    }

    if (localGateAberto) {
      return (
        <LocationBlockedScreen
          mode={permissaoLocal === "negada" ? "bloqueada" : "pedir"}
          city={myProfile?.city ?? ""}
          onShowToast={showToast}
          onRetry={async () => {
            const resultado = await pedirEAtualizarLocalizacao();
            setPermissaoLocal(resultado.estado);
            if (resultado.atualizada) {
              setTemLocalizacao(true);
              setLocalGateAberto(false);
              setPermissions((prev) => ({ ...prev, local: "granted" }));
              setMyProfile((prev) => (prev ? { ...prev, approximateLocation: false } : prev));
              setVersaoDosFiltros((valor) => valor + 1);
              return true;
            }
            if (resultado.estado === "negada") {
              setPermissions((prev) => ({ ...prev, local: "denied" }));
            }
            return false;
          }}
          onUseCity={() => {
            void (async () => {
              try {
                await usarCidadeComoLocalizacao(myProfile?.city ?? "");
                setTemLocalizacao(true);
                setLocalGateAberto(false);
                setMyProfile((prev) => (prev ? { ...prev, approximateLocation: true } : prev));
                setVersaoDosFiltros((valor) => valor + 1);
                showToast("Usando sua cidade. Seu card mostra a cidade no lugar da distância.");
              } catch (problema) {
                showToast(mensagemDeErro(problema));
              }
            })();
          }}
        />
      );
    }

    if (detailProfile) {
      return (
        <ProfileDetailScreen
          profile={detailProfile}
          myInterests={myInterests}
          fromChat={detailChatId !== null}
          onBack={() => {
            if (detailChatId) setActiveChatId(detailChatId);
            setDetailProfile(null);
            setDetailChatId(null);
          }}
          onLike={() => {
            discover.like();
            setDetailProfile(null);
          }}
          onDislike={() => {
            discover.dislike();
            setDetailProfile(null);
          }}
          onReport={(profile, motivo) => void denunciarPerfil(profile.id, motivo)}
        />
      );
    }

    if (activeChat) {
      return (
        <ChatScreen
          chat={activeChat}
          relatedProfile={chatProfile}
          myInterests={myInterests}
          offline={offlineSim}
          onBack={() => {
            chats.fecharChat();
            setActiveChatId(null);
          }}
          onSend={chats.sendMessage}
          onRetryMessage={chats.retryMessage}
          onUndoMatch={(chatId) => {
            if (chatProfile) discover.restoreToQueue(chatProfile);
            chats.removeChat(chatId);
            setActiveChatId(null);
            showToast("Match desfeito. O perfil volta para a fila.");
          }}
          onLockChat={chats.lockChat}
          onUnlockChat={chats.unlockChat}
          onOpenProfile={(profileId) => void openProfileById(profileId, activeChatId)}
          onReport={(profileId, motivo) => void denunciarPerfil(profileId, motivo)}
          onShowToast={showToast}
        />
      );
    }

    if (editingProfile && myProfile) {
      return (
        <EditProfileScreen
          profile={myProfile}
          onCancel={() => setEditingProfile(false)}
          onSave={(profile) => {
            void (async () => {
              try {
                await salvarPerfil(profile);
                setMyProfile(profile);
                setEditingProfile(false);
                showToast("Perfil atualizado");
              } catch (problema) {
                showToast(mensagemDeErro(problema));
              }
            })();
          }}
          onShowToast={showToast}
        />
      );
    }

    if (filtersOpen) {
      return (
        <FiltersScreen
          filters={filters}
          onClose={() => setFiltersOpen(false)}
          onApply={(next) => {
            setFiltersOpen(false);
            setTab("discover");
            void aplicarFiltros(next);
          }}
          onShowToast={showToast}
        />
      );
    }

    if (phoneChangeOpen) {
      return (
        <PhoneChangeScreen
          currentPhone={myProfile?.phone ?? ""}
          onBack={() => setPhoneChangeOpen(false)}
          onConfirm={(phone) => {
            void (async () => {
              try {
                await atualizarTelefone(phone);
                setMyProfile((prev) => (prev ? { ...prev, phone } : prev));
                setPhoneChangeOpen(false);
              } catch (problema) {
                showToast(mensagemDeErro(problema));
              }
            })();
          }}
          onShowToast={showToast}
        />
      );
    }

    if (permissionsOpen) {
      return (
        <PermissionsScreen
          state={permissions}
          onBack={() => setPermissionsOpen(false)}
          onShowToast={showToast}
          onChange={(key, value) => {
            setPermissions((prev) => ({ ...prev, [key]: value }));
            if (key !== "local") return;
            if (value === "granted") {
              void (async () => {
                const resultado = await pedirEAtualizarLocalizacao();
                setPermissaoLocal(resultado.estado);
                if (resultado.atualizada) {
                  setTemLocalizacao(true);
                  setMyProfile((prev) => (prev ? { ...prev, approximateLocation: false } : prev));
                  setVersaoDosFiltros((valor) => valor + 1);
                } else {
                  setPermissions((prev) => ({
                    ...prev,
                    local: resultado.estado === "negada" ? "denied" : "ask",
                  }));
                  if (resultado.estado === "negada") setLocalGateAberto(true);
                }
              })();
            }
            if (value === "denied") {
              void estadoDaPermissao().then(setPermissaoLocal);
            }
          }}
        />
      );
    }

    if (blockedOpen) {
      return (
        <BlockedProfilesScreen
          blocked={blockedProfiles}
          onUnblock={(id) => {
            void (async () => {
              const pessoa = blockedProfiles.find((item) => item.id === id);
              try {
                await desbloquear(id);
                setBlockedProfiles((prev) => prev.filter((item) => item.id !== id));
                if (pessoa) showToast(`${pessoa.name} desbloqueado`);
                setVersaoDosFiltros((valor) => valor + 1);
              } catch (problema) {
                showToast(mensagemDeErro(problema));
              }
            })();
          }}
          onBack={() => setBlockedOpen(false)}
        />
      );
    }

    if (verifyOpen) {
      return (
        <VerifyProfileScreen
          photo={myProfile?.photos[0]}
          status={myProfile?.verificationStatus ?? "nao_solicitada"}
          onClose={() => setVerifyOpen(false)}
          onSent={() =>
            setMyProfile((prev) => (prev ? { ...prev, verificationStatus: "pendente" } : prev))
          }
          onShowToast={showToast}
        />
      );
    }

    if (settingsOpen) {
      return (
        <SettingsScreen
          currentPhone={myProfile?.phone ?? ""}
          blockedCount={blockedProfiles.length}
          grantedPermissions={grantedPermissions}
          offlineSim={offlineSim}
          profileVisible={myProfile?.visible ?? true}
          showDistance={myProfile?.showDistance ?? true}
          notifications={ajustes}
          onToggleOfflineSim={() => setOfflineSim((prev) => !prev)}
          onToggleProfileVisible={(valor) => {
            setMyProfile((prev) => (prev ? { ...prev, visible: valor } : prev));
            void definirVisibilidade(valor).catch((problema) =>
              showToast(mensagemDeErro(problema)),
            );
          }}
          onToggleShowDistance={(valor) => {
            setMyProfile((prev) => (prev ? { ...prev, showDistance: valor } : prev));
            void definirMostrarDistancia(valor).catch((problema) =>
              showToast(mensagemDeErro(problema)),
            );
          }}
          onToggleNotification={(chave, valor) => {
            setAjustes((prev) => ({ ...prev, [chave]: valor }));
            void salvarAjustes({ [chave]: valor }).catch((problema) =>
              showToast(mensagemDeErro(problema)),
            );
          }}
          onBack={() => setSettingsOpen(false)}
          onOpenBlocked={() => void abrirBloqueados()}
          onOpenPermissions={() => setPermissionsOpen(true)}
          onOpenPhoneChange={() => setPhoneChangeOpen(true)}
          onOpenLegal={setDocumentoLegal}
          onExportData={() => void baixarMeusDados()}
          onDeleteAccount={() => void excluirMinhaConta()}
        />
      );
    }

    return null;
  })();

  return (
    <div className="app-shell">
      <div className="app-shell__content">
        {overlayScreen ?? (
          <>
            {tab === "discover" && (
              <DiscoverScreen
                current={discover.current}
                myInterests={myInterests}
                carregando={discover.carregando}
                hasAnyMatch={discover.hasAnyMatch}
                offline={offlineSim}
                filters={filters}
                photoIndex={discover.photoIndex}
                swipeDirection={discover.swipeDirection}
                onNextPhoto={discover.nextPhoto}
                onLike={discover.like}
                onDislike={discover.dislike}
                onOpenProfile={(profile) => openProfile(profile)}
                onOpenFilters={() => setFiltersOpen(true)}
                onWidenFilters={() => {
                  void aplicarFiltros({ ...filters, distanceKm: 60, minAge: 18, maxAge: 70 });
                  showToast("Filtros ampliados: até 60 km e 18–70 anos");
                }}
                onRetryConnection={() => {
                  setOfflineSim(false);
                  showToast("Conexão restabelecida");
                }}
                onBlock={(profile) => void bloquearPerfil(profile)}
                onReport={(profile, motivo) => void denunciarPerfil(profile.id, motivo)}
                onShowToast={showToast}
              />
            )}
            {tab === "chats" && (
              <ChatsScreen
                chats={chats.chats}
                onOpenChat={(chatId) => {
                  chats.openChat(chatId);
                  setActiveChatId(chatId);
                }}
                onOpenProfile={(profileId) => void openProfileById(profileId, null)}
              />
            )}
            {tab === "profile" && (
              <ProfileScreen
                myProfile={myProfile}
                matchesCount={chats.chats.length}
                conversationsCount={conversationsCount}
                seenCount={discover.seenCount}
                filters={filters}
                verified={verificado}
                onOpenEdit={() => setEditingProfile(true)}
                onOpenFilters={() => setFiltersOpen(true)}
                onOpenSettings={() => setSettingsOpen(true)}
                onVerifyProfile={() => setVerifyOpen(true)}
                onLogout={() => void logout()}
              />
            )}
          </>
        )}
      </div>
      {!overlayScreen && <BottomNav active={tab} onChange={setTab} unreadChats={totalUnread} />}

      {/* Sobreposto a tudo: abrir um documento legal não desmonta a tela atual. */}
      {documentoLegal && (
        <div className="app-legal-layer">
          <LegalScreen documento={documentoLegal} onBack={() => setDocumentoLegal(null)} />
        </div>
      )}

      {/* Acima da barra de navegação: durante o match nada mais é clicável. */}
      {discover.matchProfile && (
        <MatchOverlay
          profile={discover.matchProfile}
          myPhoto={myProfile?.photos[0]}
          onOpenChat={() => {
            const profileId = discover.matchProfile!.id;
            discover.dismissMatch();
            void chats.recarregar().then((lista) => {
              const encontrado = lista.find((item) => item.outroId === profileId);
              if (encontrado) {
                chats.openChat(encontrado.matchId);
                setActiveChatId(encontrado.matchId);
              }
              setTab("chats");
            });
          }}
          onContinue={discover.dismissMatch}
        />
      )}

      <Toast message={toastMessage} />
    </div>
  );
}
