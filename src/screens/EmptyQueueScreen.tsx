import { Header } from "../components/Header"

export function EmptyQueueScreen() {
  return (
    <div className="flex h-full flex-col">
      <Header />
      <div
        className="flex flex-1 flex-col items-center justify-center gap-6 px-8 text-center"
        style={{ background: "linear-gradient(180deg, #bfe6cf 0%, #7fb99a 100%)" }}
      >
        <div className="h-14 w-14 animate-spin rounded-full border-4 border-white/40 border-t-white" />
        <p className="text-base font-medium text-white">
          Estamos buscando mais perfis! Volte aqui mais tarde ;)
        </p>
      </div>
    </div>
  )
}
