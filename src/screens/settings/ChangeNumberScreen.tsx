import { useState } from 'react'
import { useAppState } from '../../state/AppState'
import StatusBar from '../../components/StatusBar'
import { ChevronLeftIcon } from '../../components/Icon'

export default function ChangeNumberScreen() {
  const { closeScreen, o, updateO, showToast } = useAppState()
  const [newPhone, setNewPhone] = useState('')
  const [step, setStep] = useState<'form' | 'code'>('form')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')

  const confirm = () => {
    if (code !== '1234') {
      setError('Código incorreto. Tente 1234.')
      return
    }
    updateO({ phone: newPhone })
    showToast('Número atualizado')
    closeScreen()
  }

  return (
    <div className="absolute inset-0 z-[90] bg-white flex flex-col">
      <StatusBar />
      <div className="h-14 shrink-0 flex items-center gap-3 px-4 border-b border-line-3">
        <button type="button" onClick={closeScreen} className="w-[38px] h-[38px] rounded-full border border-line-2 flex items-center justify-center">
          <ChevronLeftIcon size={18} />
        </button>
        <h1 className="text-[20px] font-extrabold">Trocar número</h1>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar bg-bg px-6 py-6 flex flex-col gap-5">
        <div className="bg-white rounded-xl px-4 py-3.5">
          <div className="text-[12px] font-semibold text-ink-40">Número atual</div>
          <div className="text-[15px] font-bold mt-0.5">{o.phone || '+55 (47) 99988-7766'}</div>
        </div>

        {step === 'form' ? (
          <>
            <div>
              <label className="block text-[13px] font-semibold text-ink-40 mb-1.5">Novo número (+55)</label>
              <input
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                placeholder="(47) 99988-7766"
                className="w-full rounded-xl border border-line-2 px-4 py-3.5 text-[15px] font-semibold outline-none"
              />
            </div>
            <button
              type="button"
              disabled={newPhone.replace(/\D/g, '').length < 10}
              onClick={() => setStep('code')}
              className={`py-3.5 rounded-full font-bold ${newPhone.replace(/\D/g, '').length >= 10 ? 'bg-accent text-white' : 'bg-line-3 text-[#A9B0A9]'}`}
            >
              Enviar código
            </button>
          </>
        ) : (
          <>
            <p className="text-[14px] text-ink-60">Enviamos um código de 4 dígitos para {newPhone}.</p>
            <input
              value={code}
              onChange={(e) => {
                setError('')
                setCode(e.target.value.replace(/\D/g, '').slice(0, 4))
              }}
              className="w-full text-center rounded-xl border border-line-2 py-4 text-[26px] font-extrabold tracking-[.4em] outline-none"
            />
            {error && <p className="text-[13px] text-destructive font-semibold">{error}</p>}
            <button
              type="button"
              disabled={code.length !== 4}
              onClick={confirm}
              className={`py-3.5 rounded-full font-bold ${code.length === 4 ? 'bg-accent text-white' : 'bg-line-3 text-[#A9B0A9]'}`}
            >
              Confirmar
            </button>
          </>
        )}
      </div>
    </div>
  )
}
