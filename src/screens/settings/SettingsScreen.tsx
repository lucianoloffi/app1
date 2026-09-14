import { useState } from 'react'
import { useAppState } from '../../state/AppState'
import StatusBar from '../../components/StatusBar'
import Toggle from '../../components/Toggle'
import { ChevronLeftIcon, ChevronRightIcon } from '../../components/Icon'
import DeleteAccountSheet from './DeleteAccountSheet'

function GroupLabel({ children }: { children: string }) {
  return <div className="text-[12px] font-bold uppercase tracking-[.08em] text-ink-40 px-1 mb-2 mt-5 first:mt-0">{children}</div>
}

function ToggleRow({ label, checked, onChange, last }: { label: string; checked: boolean; onChange: (v: boolean) => void; last?: boolean }) {
  return (
    <div className={`flex items-center justify-between px-4 py-3.5 ${!last ? 'border-b border-line-3' : ''}`}>
      <span className="text-[15px] font-medium">{label}</span>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  )
}

function NavRow({ label, value, onClick, destructive, last }: { label: string; value?: string; onClick?: () => void; destructive?: boolean; last?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center justify-between px-4 py-3.5 text-left ${!last ? 'border-b border-line-3' : ''}`}
    >
      <span className={`text-[15px] font-medium ${destructive ? 'text-destructive' : ''}`}>{label}</span>
      <span className="flex items-center gap-1.5">
        {value && <span className="text-[13px] text-ink-40">{value}</span>}
        {!destructive && <ChevronRightIcon size={16} color="#8A928B" />}
      </span>
    </button>
  )
}

export default function SettingsScreen() {
  const { settings, updateSettings, closeScreen, openScreen, blockedProfiles, o } = useAppState()
  const [deleteOpen, setDeleteOpen] = useState(false)

  return (
    <div className="absolute inset-0 z-[80] bg-white flex flex-col">
      <StatusBar />
      <div className="h-14 shrink-0 flex items-center gap-3 px-4 border-b border-line-3">
        <button type="button" onClick={closeScreen} className="w-[38px] h-[38px] rounded-full border border-line-2 flex items-center justify-center">
          <ChevronLeftIcon size={18} />
        </button>
        <h1 className="text-[20px] font-extrabold">Configurações e privacidade</h1>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar bg-bg px-5 py-4">
        <GroupLabel>Privacidade</GroupLabel>
        <div className="bg-white rounded-2xl overflow-hidden">
          <ToggleRow label="Perfil visível" checked={settings.profileVisible} onChange={(v) => updateSettings({ profileVisible: v })} />
          <ToggleRow label="Mostrar distância" checked={settings.showDistance} onChange={(v) => updateSettings({ showDistance: v })} last />
        </div>

        <GroupLabel>Notificações</GroupLabel>
        <div className="bg-white rounded-2xl overflow-hidden">
          <ToggleRow label="Novos matches" checked={settings.notifMatches} onChange={(v) => updateSettings({ notifMatches: v })} />
          <ToggleRow label="Mensagens" checked={settings.notifMessages} onChange={(v) => updateSettings({ notifMessages: v })} />
          <ToggleRow label="Novidades do Lovi" checked={settings.notifNews} onChange={(v) => updateSettings({ notifNews: v })} last />
        </div>

        <GroupLabel>Conta</GroupLabel>
        <div className="bg-white rounded-2xl overflow-hidden">
          <NavRow label="Perfis bloqueados" value={String(blockedProfiles.length)} onClick={() => openScreen('blocked')} />
          <NavRow label="Permissões do app" value="2 permitidas" onClick={() => openScreen('perms')} />
          <NavRow label="Trocar número" value={o.phone || '+55 (47) 99988-7766'} onClick={() => openScreen('phoneChange')} />
          <NavRow label="Termos e política de privacidade" />
          <NavRow label="Excluir minha conta" destructive onClick={() => setDeleteOpen(true)} last />
        </div>

        <p className="text-center text-[12px] text-ink-40 mt-6 mb-2">Lovi · versão de protótipo</p>
      </div>

      <DeleteAccountSheet open={deleteOpen} onClose={() => setDeleteOpen(false)} />
    </div>
  )
}
