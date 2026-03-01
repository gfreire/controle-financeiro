'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createDebt, updateDebt } from '@/services/debts.service'
import { Debt, DebtSide, normalizeDebtAgent } from '@/domain/debt'

type DebtFormProps = {
  mode: 'create' | 'edit'
  initialData?: Debt
}

export default function DebtForm({ mode, initialData }: DebtFormProps) {
  const router = useRouter()
  const isEdit = mode === 'edit'

  const [agent, setAgent] = useState(initialData?.agent ?? '')
  const [side, setSide] = useState<DebtSide>(
    initialData?.side ?? 'A_PAGAR'
  )
  const [initialBalance, setInitialBalance] = useState(
    initialData?.initialBalance?.toString() ?? '0'
  )
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      setError(null)
      setLoading(true)

      const normalizedAgent = normalizeDebtAgent(agent)

      const parsedInitialBalance =
        initialBalance === '' ? 0 : Number(initialBalance)

      if (Number.isNaN(parsedInitialBalance)) {
        setError('Saldo inicial inválido')
        return
      }

      if (isEdit && initialData) {
        await updateDebt(initialData.id, {
          agent: normalizedAgent,
          side,
          initialBalance: parsedInitialBalance,
        })
      } else {
        await createDebt({
          agent: normalizedAgent,
          side,
          initialBalance: parsedInitialBalance,
        })
      }

      setSuccess(true)

      setTimeout(() => {
        router.push('/debts')
      }, 1500)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : isEdit
          ? 'Erro ao atualizar dívida'
          : 'Erro ao criar dívida'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {success && (
        <div className="success-overlay">
          <div className="success-box">
            {isEdit
              ? 'Dívida atualizada com sucesso'
              : 'Dívida criada com sucesso'}
          </div>
        </div>
      )}

      {error && <div className="error field">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="field">
          <label>Agente</label>
          <input
            className="input"
            value={agent}
            onChange={(e) => setAgent(e.target.value)}
          />
        </div>

        <div className="field">
          <label>Lado</label>
          <select
            className="select"
            value={side}
            onChange={(e) => setSide(e.target.value as DebtSide)}
          >
            <option value="A_PAGAR">A pagar</option>
            <option value="A_RECEBER">A receber</option>
          </select>
        </div>

        <div className="field">
          <label>Saldo inicial</label>
          <input
            className="input"
            type="number"
            min={0}
            value={initialBalance}
            onChange={(e) => setInitialBalance(e.target.value)}
          />
        </div>

        <button
          className="button"
          type="submit"
          disabled={loading}
        >
          {loading
            ? 'Salvando...'
            : isEdit
            ? 'Atualizar dívida'
            : 'Criar dívida'}
        </button>
      </form>
    </>
  )
}
