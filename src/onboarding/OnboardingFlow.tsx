import { useRef, useState } from "react";
import type {
  FilterGender,
  Gender,
  Intention,
  Lifestyle,
  OnboardingState,
  OnboardingStep,
  RelationshipStatus,
} from "../types";
import { cadastrar } from "../lib/api/auth";
import { enviarFoto, removerFoto, type FotoDoPerfil } from "../lib/api/photos";
import { concluirCadastro } from "../lib/api/profile";
import { registrarConsentimentos } from "../lib/api/privacy";
import { erroNoFormulario, mensagemDeErro, type CampoDeErro, type ErroNoFormulario } from "../lib/errors";
import { MAX_INTERESTS, MAX_ONBOARDING_PHOTOS } from "./constants";
import { LoginFlow } from "./LoginFlow";
import { AccountScreen, type DocumentoLegal } from "./screens/AccountScreen";
import { ChooseInterestsScreen } from "./screens/ChooseInterestsScreen";
import { EmailConfirmationScreen } from "./screens/EmailConfirmationScreen";
import { GenderInterestCityScreen } from "./screens/GenderInterestCityScreen";
import { IntentionScreen } from "./screens/IntentionScreen";
import { LifestyleScreen } from "./screens/LifestyleScreen";
import { NameBirthdateScreen } from "./screens/NameBirthdateScreen";
import { PhotosScreen } from "./screens/PhotosScreen";
import { ProfessionHeightStatusScreen } from "./screens/ProfessionHeightStatusScreen";
import { SuccessScreen } from "./screens/SuccessScreen";
import { WelcomeScreen } from "./screens/WelcomeScreen";

const INITIAL_STATE: OnboardingState = {
  step: "welcome",
  email: "",
  password: "",
  phone: "",
  acceptedTerms: false,
  acceptedSensitiveData: false,
  name: "",
  birthdate: "",
  bio: "",
  gender: null,
  interestedIn: null,
  city: "Joinville, SC",
  photos: [null, null, null, null],
  intention: null,
  interests: [],
  lifestyle: { bebida: null, atividade: null, filhos: null },
  profession: "",
  height: 1.7,
  relationshipStatus: null,
};

interface OnboardingFlowProps {
  /** Chamado quando a conta já existe e o perfil está pronto para uso. */
  onComplete: () => void;
  onShowToast: (message: string) => void;
  onOpenLegal: (documento: DocumentoLegal) => void;
  /**
   * Passo em que o cadastro recomeça. Usado quando a pessoa já tem conta mas
   * não terminou o cadastro — depois de confirmar o e-mail, por exemplo:
   * a conta já existe, então o passo de criá-la sai do caminho.
   */
  passoInicial?: OnboardingStep;
}

export function OnboardingFlow({
  onComplete,
  onShowToast,
  onOpenLegal,
  passoInicial,
}: OnboardingFlowProps) {
  const [state, setState] = useState<OnboardingState>(
    passoInicial ? { ...INITIAL_STATE, step: passoInicial } : INITIAL_STATE,
  );
  const [mode, setMode] = useState<"signup" | "login">("signup");
  const [fotos, setFotos] = useState<(FotoDoPerfil | null)[]>(
    Array.from({ length: MAX_ONBOARDING_PHOTOS }, () => null),
  );
  const [ocupado, setOcupado] = useState(false);
  const [erroDaConta, setErroDaConta] = useState<ErroNoFormulario | null>(null);
  /** Erro do servidor ao concluir o cadastro que pertence a um campo de texto do perfil. */
  const [erroDoPerfil, setErroDoPerfil] = useState<ErroNoFormulario | null>(null);
  const [aguardandoEmail, setAguardandoEmail] = useState<string | null>(null);
  /**
   * Conta já criada nesta tela, com login feito. Guarda a senha para só pular
   * o cadastro se nada mudou: com outra senha digitada, a conta não seria a dela.
   */
  const contaCriada = useRef<{ email: string; senha: string } | null>(null);

  function goTo(step: OnboardingStep) {
    setState((prev) => ({ ...prev, step }));
  }

  /** Some com o erro do campo assim que a pessoa mexe nele. */
  function limpaErroDoCampo(campo: CampoDeErro) {
    setErroDaConta((prev) => (prev?.campo === campo ? null : prev));
    setErroDoPerfil((prev) => (prev?.campo === campo ? null : prev));
  }

  async function criarConta() {
    if (ocupado) return;
    setOcupado(true);
    setErroDaConta(null);
    try {
      // A conta pode já existir: o cadastro deu certo e o que falhou foi o passo
      // seguinte. Chamar cadastrar de novo respondia "e-mail já cadastrado" e
      // prendia a pessoa nesta tela; com a sessão aberta, basta continuar.
      const jaCriada =
        contaCriada.current?.email === state.email.trim() &&
        contaCriada.current.senha === state.password;
      const { precisaConfirmarEmail } = jaCriada
        ? { precisaConfirmarEmail: false }
        : await cadastrar({
            email: state.email,
            senha: state.password,
            telefone: state.phone,
          });

      if (precisaConfirmarEmail) {
        // Sem sessão ainda: os consentimentos ficam para quando ela existir,
        // no fim do cadastro. O app segue sozinho assim que o link for aberto.
        setAguardandoEmail(state.email.trim());
        return;
      }

      contaCriada.current = { email: state.email.trim(), senha: state.password };
      await registrarConsentimentos(["termos", "diretrizes", "privacidade", "dados_sensiveis"]);
      goTo("name-birthdate");
    } catch (problema) {
      setErroDaConta(erroNoFormulario(problema));
    } finally {
      setOcupado(false);
    }
  }

  async function enviarFotoDoPasso(indice: number, imagem: Blob) {
    if (ocupado) return;
    setOcupado(true);
    try {
      const foto = await enviarFoto(imagem);
      setFotos((prev) => prev.map((item, i) => (i === indice ? foto : item)));
      setState((prev) => ({
        ...prev,
        photos: prev.photos.map((item, i) => (i === indice ? foto.url : item)),
      }));
    } catch (problema) {
      onShowToast(mensagemDeErro(problema));
    } finally {
      setOcupado(false);
    }
  }

  async function removerFotoDoPasso(indice: number) {
    const foto = fotos[indice];
    if (!foto || ocupado) return;
    setOcupado(true);
    try {
      await removerFoto(foto.id, foto.path);
      setFotos((prev) => prev.map((item, i) => (i === indice ? null : item)));
      setState((prev) => ({
        ...prev,
        photos: prev.photos.map((item, i) => (i === indice ? null : item)),
      }));
    } catch (problema) {
      onShowToast(mensagemDeErro(problema));
    } finally {
      setOcupado(false);
    }
  }

  async function finalizarCadastro() {
    if (ocupado) return;
    setOcupado(true);
    try {
      await registrarConsentimentos(["termos", "diretrizes", "privacidade", "dados_sensiveis"]);
      await concluirCadastro(state);
      goTo("success");
    } catch (problema) {
      // Nome e bio ficam três telas para trás: um erro deles só aparece aqui,
      // no fim. Em vez de um aviso solto, a pessoa volta ao campo e vê o erro
      // embaixo dele. Profissão é desta tela mesma.
      const erro = erroNoFormulario(problema);
      if (erro.campo === "nome" || erro.campo === "bio") {
        setErroDoPerfil(erro);
        goTo("name-birthdate");
      } else if (erro.campo === "profissao") {
        setErroDoPerfil(erro);
      } else {
        onShowToast(erro.texto);
      }
    } finally {
      setOcupado(false);
    }
  }

  if (aguardandoEmail) {
    return (
      <EmailConfirmationScreen
        email={aguardandoEmail}
        onBack={() => {
          setAguardandoEmail(null);
          goTo("account");
        }}
      />
    );
  }

  if (mode === "login") {
    return (
      <LoginFlow
        onGoSignup={() => setMode("signup")}
        onLoginSuccess={onComplete}
        onShowToast={onShowToast}
      />
    );
  }

  switch (state.step) {
    case "welcome":
      return (
        <WelcomeScreen
          onCreateAccount={() => goTo("account")}
          onHaveAccount={() => setMode("login")}
        />
      );

    case "account":
      return (
        <AccountScreen
          email={state.email}
          password={state.password}
          phone={state.phone}
          acceptedTerms={state.acceptedTerms}
          acceptedSensitiveData={state.acceptedSensitiveData}
          loading={ocupado}
          error={erroDaConta}
          onChangeEmail={(email) => {
            limpaErroDoCampo("email");
            setState((prev) => ({ ...prev, email }));
          }}
          onChangePassword={(password) => {
            limpaErroDoCampo("senha");
            setState((prev) => ({ ...prev, password }));
          }}
          onChangePhone={(phone) => {
            limpaErroDoCampo("telefone");
            setState((prev) => ({ ...prev, phone }));
          }}
          onToggleTerms={() => setState((prev) => ({ ...prev, acceptedTerms: !prev.acceptedTerms }))}
          onToggleSensitiveData={() =>
            setState((prev) => ({ ...prev, acceptedSensitiveData: !prev.acceptedSensitiveData }))
          }
          onOpenLegal={onOpenLegal}
          onBack={() => goTo("welcome")}
          onNext={() => void criarConta()}
        />
      );

    case "name-birthdate":
      return (
        <NameBirthdateScreen
          name={state.name}
          birthdate={state.birthdate}
          bio={state.bio}
          error={erroDoPerfil}
          onChangeName={(name) => {
            limpaErroDoCampo("nome");
            setState((prev) => ({ ...prev, name }));
          }}
          onChangeBirthdate={(birthdate) => setState((prev) => ({ ...prev, birthdate }))}
          onChangeBio={(bio) => {
            limpaErroDoCampo("bio");
            setState((prev) => ({ ...prev, bio }));
          }}
          onBack={passoInicial ? undefined : () => goTo("account")}
          onNext={() => goTo("gender-interest-city")}
        />
      );

    case "gender-interest-city":
      return (
        <GenderInterestCityScreen
          gender={state.gender}
          interestedIn={state.interestedIn}
          city={state.city}
          onChangeGender={(gender: Gender) => setState((prev) => ({ ...prev, gender }))}
          onChangeInterestedIn={(interestedIn: FilterGender) =>
            setState((prev) => ({ ...prev, interestedIn }))
          }
          onChangeCity={(city) => setState((prev) => ({ ...prev, city }))}
          onBack={() => goTo("name-birthdate")}
          onNext={() => goTo("photos")}
        />
      );

    case "photos":
      return (
        <PhotosScreen
          photos={state.photos}
          busy={ocupado}
          onPickPhoto={enviarFotoDoPasso}
          onRemovePhoto={(index) => void removerFotoDoPasso(index)}
          onShowToast={onShowToast}
          onBack={() => goTo("gender-interest-city")}
          onNext={() => goTo("intention")}
        />
      );

    case "intention":
      return (
        <IntentionScreen
          intention={state.intention}
          onChangeIntention={(intention: Intention) => setState((prev) => ({ ...prev, intention }))}
          onBack={() => goTo("photos")}
          onNext={() => goTo("interests")}
        />
      );

    case "interests":
      return (
        <ChooseInterestsScreen
          interests={state.interests}
          onToggleInterest={(interest) =>
            setState((prev) => ({
              ...prev,
              interests: prev.interests.includes(interest)
                ? prev.interests.filter((item) => item !== interest)
                : prev.interests.length >= MAX_INTERESTS
                  ? prev.interests
                  : [...prev.interests, interest],
            }))
          }
          onOverMax={() => onShowToast(`Máximo de ${MAX_INTERESTS} interesses`)}
          onBack={() => goTo("intention")}
          onNext={() => goTo("lifestyle")}
        />
      );

    case "lifestyle":
      return (
        <LifestyleScreen
          lifestyle={state.lifestyle}
          onChange={(lifestyle: Lifestyle) => setState((prev) => ({ ...prev, lifestyle }))}
          onBack={() => goTo("interests")}
          onNext={() => goTo("profession-height-status")}
        />
      );

    case "profession-height-status":
      return (
        <ProfessionHeightStatusScreen
          profession={state.profession}
          height={state.height}
          relationshipStatus={state.relationshipStatus}
          error={erroDoPerfil}
          onChangeProfession={(profession) => {
            limpaErroDoCampo("profissao");
            setState((prev) => ({ ...prev, profession }));
          }}
          onChangeHeight={(height) => setState((prev) => ({ ...prev, height }))}
          onChangeStatus={(relationshipStatus: RelationshipStatus | null) =>
            setState((prev) => ({ ...prev, relationshipStatus }))
          }
          onBack={() => goTo("lifestyle")}
          onFinish={() => void finalizarCadastro()}
        />
      );

    case "success":
      return <SuccessScreen name={state.name} onDone={onComplete} />;

    default:
      return null;
  }
}
