import { Toggle } from "../components/Toggle"
import { useAppState } from "../state/AppState"
import type { Gender } from "../types"

export function SettingsScreen({ onDone }: { onDone: () => void }) {
  const { settings, updateSettings } = useAppState()

  const handleMin = (value: number) => {
    updateSettings({ minAge: Math.min(value, settings.maxAge - 1) })
  }
  const handleMax = (value: number) => {
    updateSettings({ maxAge: Math.max(value, settings.minAge + 1) })
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-end px-4 pb-3 pt-3">
        <button
          type="button"
          onClick={onDone}
          className="text-sm font-semibold text-red-500"
        >
          Concluído
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-6">
        <div className="mb-5">
          <p className="mb-1 text-xs text-neutral-400">Me interesso em</p>
          <select
            value={settings.interestedIn}
            onChange={(e) => updateSettings({ interestedIn: e.target.value as Gender })}
            className="w-full rounded-lg bg-neutral-100 px-3 py-2 text-sm outline-none"
          >
            <option value="Homem">Homem</option>
            <option value="Mulher">Mulher</option>
            <option value="Outros">Outros</option>
          </select>
        </div>

        <div className="mb-6">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs text-neutral-400">Idade</p>
            <p className="text-sm text-neutral-600">
              Entre <span className="font-semibold">{settings.minAge}</span> a{" "}
              <span className="font-semibold">
                {settings.maxAge >= 60 ? "60+" : settings.maxAge}
              </span>
            </p>
          </div>
          <div className="relative h-6">
            <div className="absolute top-1/2 h-1 w-full -translate-y-1/2 rounded-full bg-neutral-200" />
            <div
              className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-green-500"
              style={{
                left: `${((settings.minAge - 18) / (60 - 18)) * 100}%`,
                right: `${100 - ((settings.maxAge - 18) / (60 - 18)) * 100}%`,
              }}
            />
            <input
              type="range"
              min={18}
              max={60}
              value={settings.minAge}
              onChange={(e) => handleMin(Number(e.target.value))}
              className="range-thumb pointer-events-none absolute top-1/2 h-6 w-full -translate-y-1/2 appearance-none bg-transparent"
            />
            <input
              type="range"
              min={18}
              max={60}
              value={settings.maxAge}
              onChange={(e) => handleMax(Number(e.target.value))}
              className="range-thumb pointer-events-none absolute top-1/2 h-6 w-full -translate-y-1/2 appearance-none bg-transparent"
            />
          </div>
        </div>

        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-neutral-700">Receber notificações</p>
          <Toggle
            checked={settings.notifications}
            onChange={(v) => updateSettings({ notifications: v })}
            label="Receber notificações"
          />
        </div>

        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-neutral-700">Ocultar meu perfil</p>
          <Toggle
            checked={settings.hideProfile}
            onChange={(v) => updateSettings({ hideProfile: v })}
            label="Ocultar meu perfil"
          />
        </div>
      </div>
    </div>
  )
}
