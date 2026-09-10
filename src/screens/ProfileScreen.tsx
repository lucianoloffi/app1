import { Plus } from "lucide-react"
import { useAppState } from "../state/AppState"
import type { Gender } from "../types"

export function ProfileScreen({ onDone }: { onDone: () => void }) {
  const { userProfile, updateUserProfile } = useAppState()

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
        <div className="mb-5 flex gap-2">
          <img
            src={userProfile.photo}
            alt="Minha foto"
            className="h-24 w-24 rounded-lg object-cover"
          />
          <button
            type="button"
            className="flex h-24 w-24 items-center justify-center rounded-lg bg-green-100 active:bg-green-200"
            aria-label="Adicionar foto"
          >
            <Plus size={24} className="text-green-600" />
          </button>
          <button
            type="button"
            className="flex h-24 w-24 items-center justify-center rounded-lg bg-green-100 active:bg-green-200"
            aria-label="Adicionar foto"
          >
            <Plus size={24} className="text-green-600" />
          </button>
        </div>

        <Field label="Sobre mim">
          <textarea
            value={userProfile.bio}
            onChange={(e) => updateUserProfile({ bio: e.target.value })}
            rows={3}
            className="w-full resize-none rounded-lg bg-neutral-100 px-3 py-2 text-sm outline-none"
            placeholder="Conte um pouco sobre você"
          />
        </Field>

        <Field label="Nome">
          <input
            value={userProfile.name}
            onChange={(e) => updateUserProfile({ name: e.target.value })}
            className="w-full rounded-lg bg-neutral-100 px-3 py-2 text-sm outline-none"
            placeholder="Seu nome"
          />
        </Field>

        <Field label="Localidade">
          <input
            value={userProfile.city}
            onChange={(e) => updateUserProfile({ city: e.target.value })}
            className="w-full rounded-lg bg-neutral-100 px-3 py-2 text-sm outline-none"
            placeholder="Cidade/Estado"
          />
        </Field>

        <Field label="Data de nascimento">
          <input
            type="date"
            value={userProfile.birthdate}
            onChange={(e) => updateUserProfile({ birthdate: e.target.value })}
            className="w-full rounded-lg bg-neutral-100 px-3 py-2 text-sm outline-none"
          />
        </Field>

        <Field label="Gênero">
          <select
            value={userProfile.gender}
            onChange={(e) => updateUserProfile({ gender: e.target.value as Gender })}
            className="w-full rounded-lg bg-neutral-100 px-3 py-2 text-sm outline-none"
          >
            <option value="Homem">Homem</option>
            <option value="Mulher">Mulher</option>
            <option value="Outros">Outros</option>
          </select>
        </Field>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <p className="mb-1 text-xs text-neutral-400">{label}</p>
      {children}
    </div>
  )
}
