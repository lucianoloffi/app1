import { useState } from 'react'
import BottomSheet from '../../components/BottomSheet'
import { useAppState } from '../../state/AppState'

export default function DeleteAccountSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { deleteAccount } = useAppState()
  const [word, setWord] = useState('')

  return (
    <BottomSheet open={open} onClose={onClose} title="Excluir minha conta">
      <p className="text-[14px] text-ink-60 mb-4">
        Essa ação é permanente. Seus matches, conversas e informações de perfil serão apagados e não podem ser recuperados.
      </p>
      <label className="block text-[13px] font-semibold text-ink-40 mb-1.5">
        Digite EXCLUIR para confirmar
      </label>
      <input
        value={word}
        onChange={(e) => setWord(e.target.value.toUpperCase())}
        className="w-full rounded-xl border border-line-2 px-4 py-3.5 text-[15px] font-semibold outline-none mb-4"
      />
      <button
        type="button"
        disabled={word !== 'EXCLUIR'}
        onClick={deleteAccount}
        className={`w-full py-3.5 rounded-full font-bold mb-3 ${
          word === 'EXCLUIR' ? 'bg-destructive text-white' : 'bg-line-3 text-[#A9B0A9]'
        }`}
      >
        Excluir minha conta
      </button>
      <button type="button" onClick={onClose} className="w-full text-center text-[14px] font-semibold text-ink-40 underline pb-2">
        Manter minha conta
      </button>
    </BottomSheet>
  )
}
