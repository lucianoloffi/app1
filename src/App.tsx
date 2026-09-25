import { useCallback, useEffect, useState } from "react";
import { BottomNav } from "./components/BottomNav";
import { Toast } from "./components/Toast";
import { useChats } from "./chats/useChats";
import { useDiscoverQueue } from "./discover/useDiscoverQueue";
import { useToast } from "./hooks/useToast";
import { esquecerAtividadeRegistrada, registrarAtividade } from "./lib/api/atividade";
import { aoMudarSessao, sair } from "./lib/api/auth";
import { erroDeConfiguracao } from "./lib/supabaseClient";
import { situacaoDeModeracao } from "./lib/moderacao";
import { distanciaDoMaisProximo } from "./lib/api/discovery";
import { carregarPerfilDoMatch } from "./lib/api/matches";
import { tempoRelativo } from "./chats/tempo";
import {
  atualizarTelefone,
  carregarMeuPerfil,
  carregarSituacaoDeModeracao,
  definirMostrarDistancia,
  definirVisibilidade,
  salvarFiltros,
  salvarPerfil,
} from "./lib/api/profile";
import { excluirConta, exportarMeusDados } from "./lib/api/privacy";
import { bloquear, denunciar, desbloquear, listarBloqueados } from "./lib/api/safety";
import { carregarAjustes, salvarAjustes, type AjustesDeNotificacao } from "./lib/api/settings";
import { erroNoFormulario, mensagemDeErro, type ErroNoFormulario } from "./lib/errors";
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
import { InterestsScreen } from "./screens/InterestsScreen";
import { LegalScreen, type DocumentoLegal } from "./screens/LegalScreen";
import { LocationBlockedScreen } from "./screens/LocationBlockedScreen";
import { MatchOverlay } from "./screens/MatchOverlay";
import { ModerationBlockedScreen } from "./screens/ModerationBlockedScreen";
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
import {
  TODAS_AS_INTENCOES,
  type Filters,
  type MyProfile,
  type OnboardingStep,
  type PerfilEditavel,
  type Profile,
  type Tab,
} from "./types";
import { ageFromBirthdate } from "./utils/age";

type Stage = "carregando" | "onboarding" | "main";

/**
 * O próprio perfil como os outros o veem. Só as fotos aprovadas: a reprovada
 * a dona continua vendo em Editar perfil, mas os outros não (fotos_le). Sem
 * distância, que é sempre de quem olha até aqui.
 */
function perfilComoOsOutrosVeem(perfil: MyProfile): Profile {
  return {
    id: "",
    name: perfil.name,
    age: ageFromBirthdate(perfil.birthdate) ?? 0,
    gender: perfil.gender,
    profession: perfil.profession,
    city: perfil.city,
    distanceKm: null,
    intention: perfil.intention,
    interests: perfil.interests,
    bio: perfil.bio,
    photos: perfil.photos.filter((foto) => foto.status === "aprovada").map((foto) => foto.url),
    lifestyle: perfil.lifestyle,
    values: perfil.values,
    about: perfil.about,
    relationshipStatus: perfil.relationshipStatus ?? undefined,
    height: perfil.height,
    verified: perfil.verificationStatus === "aprovada",
  };
}

const INITIAL_FILTERS: Filters = {
  intentions: TODAS_AS_INTENCOES,
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
  /** De onde o perfil aberto veio: define a barra de baixo e a volta. */
  const [detailOrigin, setDetailOrigin] = useState<"discover" | "chat">("discover");
  const [chatProfile, setChatProfile] = useState<Profile | null>(null);

  const [editingProfile, setEditingProfile] = useState(false);
  const [viewingOwnProfile, setViewingOwnProfile] = useState(false);
  const [interestsOpen, setInterestsOpen] = useState(false);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [blockedOpen, setBlockedOpen] = useState(false);
  const [permissionsOpen, setPermissionsOpen] = useState(false);
  const [phoneChangeOpen, setPhoneChangeOpen] = useState(false);
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [documentoLegal, setDocumentoLegal] = useState<DocumentoLegal | null>(null);
  /** Erro do servidor ao salvar Editar perfil que pertence a um campo. */
  const [erroDaEdicao, setErroDaEdicao] = useState<ErroNoFormulario | null>(null);

  const [blockedProfiles, setBlockedProfiles] = useState<BlockedProfile[]>([]);
  const [permissions, setPermissions] = useState<Record<PermissionKey, PermissionState>>({
    local: "ask",
    notif: "ask",
    cam: "ask",
  });

  const [passoDoCadastro, setPassoDoCadastro] = useState<OnboardingStep>(null);
  const [temLocalizacao, setTemLocalizacao] = useState(true);
  const [permissaoLocal, setPermissaoLocal] = useState<EstadoDaPermissao>("perguntar");
  const [localGateAberto, setLocalGateAberto] = useState(false);
  /** km até a pessoa mais próxima fora do raio; null = ninguém, ou ainda não perguntamos. */
  /** undefined = ainda não se sabe; a tela da fila vazia espera por ela. */
  const [distanciaDoMaisProximoKm, setDistanciaDoMaisProximoKm] = useState<
    number | null | undefined
  >(undefined);

  const { message: toastMessage, showToast } = useToast();

  /**
   * Relê o que a moderação decidiu. Sem isto, quem já estava com o app aberto
   * quando foi suspenso não via nada mudar: o banco recusava curtir e escrever,
   * mas a tela continuava a mesma até alguém recarregar a página.
   */
  const conferirModeracao = useCallback(async () => {
    try {
      const situacao = await carregarSituacaoDeModeracao();
      if (!situacao) return;
      setMyProfile((prev) =>
        prev &&
        (prev.moderationStatus !== situacao.status ||
          (prev.suspendedUntil ?? null) !== situacao.suspensaoTerminaEm)
          ? {
              ...prev,
              moderationStatus: situacao.status,
              suspendedUntil: situacao.suspensaoTerminaEm,
            }
          : prev,
      );
    } catch {
      /* sem rede, por exemplo: a próxima volta ao app tenta de novo */
    }
  }, []);

  /**
   * Toda falha da fila ou das conversas pode ser a moderação tendo bloqueado a
   * conta agora: o banco recusa antes de a tela saber. A consulta é de uma
   * linha só, e quando não é isso não muda nada.
   */
  const aoFalhar = useCallback(
    (mensagem: string) => {
      showToast(mensagem);
      void conferirModeracao();
    },
    [showToast, conferirModeracao],
  );

  /** Suspensão ou banimento em vigor; null = conta livre. */
  const sancao = situacaoDeModeracao(myProfile);
  // Com a conta bloqueada não vale carregar fila nem conversas: a tela por cima
  // é o aviso, e o banco recusaria curtir e escrever de qualquer jeito.
  const appLiberado = stage === "main" && !sancao;

  const chats = useChats({ ativo: appLiberado, onError: aoFalhar });
  const discover = useDiscoverQueue({
    ativo: appLiberado,
    versaoDosFiltros,
    onMatch: () => void chats.recarregar(),
    onLikeWithoutMatch: (profile) =>
      showToast(`Você curtiu ${profile.name.split(" ")[0]}. Avisamos se ela curtir de volta.`),
    onError: aoFalhar,
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
    if (!appLiberado) return;
    // Quem escolheu usar a cidade não tem o GPS devolvido por baixo: a escolha
    // sumiria no próximo abrir, sem a pessoa entender por quê. Para voltar ao
    // GPS existe o interruptor em Ajustes › Permissões.
    if (myProfile?.approximateLocation) return;
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
  }, [appLiberado]);

  useEffect(() => {
    if (!appLiberado) return;
    void carregarAjustes().then(setAjustes);
  }, [appLiberado]);

  // Fila vazia tanto pode ser "acabaram os perfis" quanto a conta ter sido
  // bloqueada agora: para quem está sob sanção o servidor devolve fila vazia,
  // sem erro nenhum. Sem esta checagem, ela veria "não há mais perfis" e
  // nenhuma explicação, até tentar curtir alguém ou sair e voltar ao app.
  useEffect(() => {
    // Fila recarregando (filtro novo): a distância antiga não vale mais, e
    // usá-la mostraria por um instante a tela da fila vazia errada.
    // oxlint-disable-next-line react/set-state-in-effect
    if (discover.carregando) setDistanciaDoMaisProximoKm(undefined);
    if (!appLiberado || discover.carregando || discover.hasAnyMatch) return;
    void conferirModeracao();
    // Fila vazia tem duas causas bem diferentes, e a tela precisa saber qual:
    // filtro apertado, ou não há ninguém do Lovi perto. Sem isto ela sempre
    // culpava o filtro, e quem estava longe mexia nele à toa.
    void distanciaDoMaisProximo()
      .then(setDistanciaDoMaisProximoKm)
      .catch(() => setDistanciaDoMaisProximoKm(null));
  }, [appLiberado, discover.carregando, discover.hasAnyMatch, conferirModeracao]);

  // Conta como uso ao entrar no app e ao voltar para ele (trocar de aba ou de
  // aplicativo e voltar). Quem deixa o app aberto de um dia para o outro
  // também conta no dia seguinte, na próxima vez que olhar a tela. Quem está
  // suspenso ou banido não conta: só vê o aviso, não usa o app.
  useEffect(() => {
    if (!appLiberado) return;
    void registrarAtividade();
    const aoVoltar = () => {
      if (document.visibilityState !== "visible") return;
      void registrarAtividade();
      // Suspensão e banimento acontecem com o app já aberto: é aqui que a
      // pessoa descobre, sem precisar tentar curtir alguém para o app reagir.
      void conferirModeracao();
    };
    document.addEventListener("visibilitychange", aoVoltar);
    return () => document.removeEventListener("visibilitychange", aoVoltar);
  }, [appLiberado, conferirModeracao]);

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

  function openProfile(
    profile: Profile,
    chatId: string | null = null,
    origin: "discover" | "chat" = "discover",
  ) {
    setDetailProfile(profile);
    setDetailChatId(chatId);
    setDetailOrigin(origin);
  }

  async function openProfileById(
    profileId: string,
    chatId: string | null = null,
    origin: "discover" | "chat" = "discover",
  ) {
    try {
      const profile = await carregarPerfilDoMatch(profileId);
      if (!profile) {
        showToast("Perfil não disponível");
        return;
      }
      openProfile(profile, chatId, origin);
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
      const { nova } = await denunciar(profileId, motivo);
      showToast(
        nova
          ? "Denúncia enviada. A pessoa foi bloqueada e não fala mais com você."
          : "Você já denunciou esta pessoa. A denúncia segue em análise.",
      );

      // Denunciar bloqueia (migration 0018). O servidor já cuidou disso, então
      // aqui é só tirar da frente o que ficou na tela: a fila, a conversa
      // aberta e o perfil, se estiver por cima. Sem isso a conversa continuava
      // aberta depois da denúncia, os dois seguiam escrevendo, e dava para
      // denunciar a mesma pessoa de novo e de novo.
      discover.removeFromQueue(profileId);

      const conversa = chats.chats.find((chat) => chat.profileId === profileId);
      if (conversa && activeChatId === conversa.id) {
        chats.fecharChat();
        setActiveChatId(null);
      }
      // Recarrega em vez de tirar da lista à mão: meus_matches já não devolve
      // par com bloqueio. E nada de removeChat aqui — ele desfaz o match, o
      // que APAGA as mensagens, justo as que viraram prova.
      void chats.recarregar();

      if (detailProfile?.id === profileId) {
        setDetailProfile(null);
        setDetailChatId(null);
      }
    } catch (problema) {
      showToast(mensagemDeErro(problema));
    }
  }

  /**
   * Troca a posição pelo centro da cidade do perfil. Oferecido quando o GPS
   * deixou a pessoa longe de todo mundo — viagem, ou cadastro fora da região.
   * Sem isso não havia volta: a tela que oferece a cidade só aparece para quem
   * ainda não tem posição, e desligar a permissão não apaga a coordenada.
   */
  async function usarCidadeComoPosicao() {
    const cidade = myProfile?.city ?? "";
    if (!cidade) return;
    try {
      await usarCidadeComoLocalizacao(cidade);
      setMyProfile((prev) => (prev ? { ...prev, approximateLocation: true } : prev));
      setDistanciaDoMaisProximoKm(null);
      setVersaoDosFiltros((valor) => valor + 1);
      showToast(`Usando ${cidade}. Seu card mostra a cidade no lugar da distância.`);
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
    esquecerAtividadeRegistrada();
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
    chats.resetChats();
    setSettingsOpen(false);
    setEditingProfile(false);
    setInterestsOpen(false);
    setFiltersOpen(false);
    setActiveChatId(null);
    setDetailProfile(null);
    setVerifyOpen(false);
    setLocalGateAberto(false);
  }

  /** Salva o que Editar perfil ou Interesses devolveu e fecha a tela. */
  async function salvarEdicaoDoPerfil(edicao: Partial<PerfilEditavel>, fechar: () => void) {
    if (!myProfile) return;
    try {
      // Mesclar, nunca trocar: o que volta da tela são os campos
      // editáveis, e o resto do perfil é do servidor — selo de
      // verificado, sanção da moderação, modo cidade, telefone.
      // Trocando o estado inteiro, o selo sumia da tela de Perfil até
      // a pessoa recarregar a página; junto iam a sanção (quem estava
      // suspenso voltava a ver o app) e o modo cidade (o GPS
      // sobrescrevia a escolha no abrir seguinte).
      //
      // A ordem também importa: os campos do servidor vêm de `prev`,
      // que é o valor mais novo que o app tem. A tela de edição
      // carrega uma cópia ao abrir, e a moderação pode ter agido no
      // meio da edição.
      const atualizado = { ...myProfile, ...edicao };
      setErroDaEdicao(null);
      await salvarPerfil(atualizado);
      setMyProfile(atualizado);
      fechar();
      showToast("Perfil atualizado");
    } catch (problema) {
      // Erro de um campo (texto longo demais, cidade fora da lista)
      // vai para baixo do campo; o aviso diz só que não salvou.
      const erro = erroNoFormulario(problema);
      if (erro.campo) {
        setErroDaEdicao(erro);
        showToast("Não deu para salvar. Confira o campo marcado.");
      } else {
        showToast(erro.texto);
      }
    }
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

    // Antes de qualquer outra tela: quem está suspenso ou banido não é levado a
    // liberar a localização nem a completar nada — o app não vai destravar.
    if (sancao) {
      return (
        <ModerationBlockedScreen
          situacao={sancao}
          onOpenGuidelines={() => setDocumentoLegal("diretrizes")}
          onRecheck={() => carregarSessao()}
          onLogout={() => void logout()}
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
      // Quem já é match nunca mostra curtir/dispensar, tenha sido aberto de onde for.
      const conversaDoPerfil =
        detailChatId ?? chats.chats.find((chat) => chat.profileId === detailProfile.id)?.id ?? null;
      const fecharDetalhe = () => {
        setDetailProfile(null);
        setDetailChatId(null);
      };
      return (
        <ProfileDetailScreen
          profile={detailProfile}
          myInterests={myInterests}
          bottomAction={
            detailOrigin === "chat" ? "backToChat" : conversaDoPerfil ? "openChat" : "swipe"
          }
          onBack={() => {
            // Da lista de conversas a volta é para a própria lista, não para o chat.
            if (detailOrigin === "chat" && detailChatId) setActiveChatId(detailChatId);
            fecharDetalhe();
          }}
          onOpenChat={() => {
            if (conversaDoPerfil) {
              chats.openChat(conversaDoPerfil);
              setActiveChatId(conversaDoPerfil);
            }
            fecharDetalhe();
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
          onOpenProfile={(profileId) => void openProfileById(profileId, activeChatId, "chat")}
          onReport={(profileId, motivo) => void denunciarPerfil(profileId, motivo)}
          onShowToast={showToast}
        />
      );
    }

    if (viewingOwnProfile && myProfile) {
      return (
        <ProfileDetailScreen
          profile={perfilComoOsOutrosVeem(myProfile)}
          myInterests={[]}
          bottomAction="own"
          onBack={() => setViewingOwnProfile(false)}
          onEdit={() => {
            setViewingOwnProfile(false);
            setEditingProfile(true);
          }}
          onLike={() => {}}
          onDislike={() => {}}
          onReport={() => {}}
        />
      );
    }

    if (editingProfile && myProfile) {
      return (
        <EditProfileScreen
          profile={myProfile}
          onCancel={() => {
            setErroDaEdicao(null);
            setEditingProfile(false);
          }}
          onOpenGuidelines={() => setDocumentoLegal("diretrizes")}
          error={erroDaEdicao}
          onClearError={() => setErroDaEdicao(null)}
          onSave={(edicao) => void salvarEdicaoDoPerfil(edicao, () => setEditingProfile(false))}
          onShowToast={showToast}
        />
      );
    }

    if (interestsOpen && myProfile) {
      return (
        <InterestsScreen
          profile={myProfile}
          onCancel={() => {
            setErroDaEdicao(null);
            setInterestsOpen(false);
          }}
          error={erroDaEdicao}
          onClearError={() => setErroDaEdicao(null)}
          onSave={(edicao) => void salvarEdicaoDoPerfil(edicao, () => setInterestsOpen(false))}
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
                showToast("Número atualizado");
              } catch (problema) {
                showToast(mensagemDeErro(problema));
              }
            })();
          }}
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
          photo={myProfile?.photos[0]?.url}
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
          profileVisible={myProfile?.visible ?? true}
          showDistance={myProfile?.showDistance ?? true}
          notifications={ajustes}
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
                filters={filters}
                distanciaDoMaisProximoKm={distanciaDoMaisProximoKm}
                city={myProfile?.city ?? ""}
                usandoCidade={myProfile?.approximateLocation ?? false}
                onUseCity={() => void usarCidadeComoPosicao()}
                photoIndex={discover.photoIndex}
                swipeDirection={discover.swipeDirection}
                onNextPhoto={discover.nextPhoto}
                onLike={discover.like}
                onDislike={discover.dislike}
                onOpenProfile={(profile) => openProfile(profile)}
                onOpenFilters={() => setFiltersOpen(true)}
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
              />
            )}
            {tab === "profile" && (
              <ProfileScreen
                myProfile={myProfile}
                filters={filters}
                verified={verificado}
                onOpenEdit={() => setEditingProfile(true)}
                onViewProfile={() => setViewingOwnProfile(true)}
                onOpenInterests={() => setInterestsOpen(true)}
                onOpenFilters={() => setFiltersOpen(true)}
                onOpenSettings={() => setSettingsOpen(true)}
                onVerifyProfile={() => setVerifyOpen(true)}
                onLogout={() => void logout()}
                onOpenGuidelines={() => setDocumentoLegal("diretrizes")}
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
          myPhoto={myProfile?.photos[0]?.url}
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
