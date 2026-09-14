import { useAppState } from '../state/AppState'
import StatusBar from '../components/StatusBar'
import { ChevronLeftIcon } from '../components/Icon'
import { Chip } from '../components/Chip'
import DualRangeSlider from '../components/DualRangeSlider'
import RangeSlider from '../components/RangeSlider'
import type { IntentFilter, SeekingGender } from '../types'

const GENDER_OPTS: { value: SeekingGender; label: string }[] = [
  { value: 'homens', label: 'Homens' },
  { value: 'mulheres', label: 'Mulheres' },
  { value: 'todos', label: 'Todos' },
]

const INTENT_OPTS: { value: IntentFilter; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'serio', label: 'Relacionamento sério' },
  { value: 'conhecer', label: 'Conhecer pessoas' },
  { value: 'amizade', label: 'Amizade' },
]

export default function FiltersScreen() {
  const { filtersDraft, updateFiltersDraft, filtersChanged, revertFilters, applyFilters, closeScreen } = useAppState()

  return (
    <div className="absolute inset-0 z-[80] bg-white flex flex-col">
      <StatusBar />
      <div className="h-14 shrink-0 flex items-center gap-3 px-4 border-b border-line-3">
        <button type="button" onClick={closeScreen} className="w-[38px] h-[38px] rounded-full border border-line-2 flex items-center justify-center">
          <ChevronLeftIcon size={18} />
        </button>
        <h1 className="text-[20px] font-extrabold">Filtros de busca</h1>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar bg-bg px-5 py-[18px]">
        <p className="text-[13px] text-ink-60 mb-3">As mudanças valem para a próxima fila de perfis.</p>
        <div className="bg-white rounded-2xl px-5 py-6 flex flex-col gap-7">
          <div>
            <div className="text-[15px] font-bold mb-2.5">Gênero que me interessa</div>
            <div className="flex flex-wrap gap-2">
              {GENDER_OPTS.map((opt) => (
                <Chip key={opt.value} selected={filtersDraft.seeking === opt.value} onClick={() => updateFiltersDraft({ seeking: opt.value })}>
                  {opt.label}
                </Chip>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[15px] font-bold">Faixa de idade</span>
              <span className="text-[13px] font-semibold text-ink-60">
                {filtersDraft.ageMin}–{filtersDraft.ageMax} anos
              </span>
            </div>
            <DualRangeSlider
              min={18}
              max={70}
              valueMin={filtersDraft.ageMin}
              valueMax={filtersDraft.ageMax}
              onChange={(ageMin, ageMax) => updateFiltersDraft({ ageMin, ageMax })}
            />
          </div>

          <div className="pt-1.5">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[15px] font-bold">Distância</span>
              <span className="text-[13px] font-semibold text-ink-60">até {filtersDraft.dist} km</span>
            </div>
            <RangeSlider min={1} max={100} value={filtersDraft.dist} onChange={(dist) => updateFiltersDraft({ dist })} />
          </div>

          <div>
            <div className="text-[15px] font-bold mb-2.5">Intenção</div>
            <div className="flex flex-wrap gap-2">
              {INTENT_OPTS.map((opt) => (
                <Chip key={opt.value} selected={filtersDraft.intent === opt.value} onClick={() => updateFiltersDraft({ intent: opt.value })}>
                  {opt.label}
                </Chip>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="shrink-0 flex items-center gap-3 px-5 py-4 border-t border-line-3 bg-white">
        <button
          type="button"
          disabled={!filtersChanged}
          onClick={revertFilters}
          className={`px-5 py-3.5 rounded-full border border-line-2 font-bold text-[15px] ${
            filtersChanged ? 'text-ink-60' : 'text-[#B6BDB6]'
          }`}
        >
          Reverter
        </button>
        <button type="button" onClick={applyFilters} className="flex-1 py-3.5 rounded-full bg-accent text-white font-bold text-[15px] shadow-primary">
          Ver perfis
        </button>
      </div>
    </div>
  )
}
