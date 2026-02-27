'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createAccount, updateAccount } from '@/services/accounts.service'
import { AccountType, Account } from '@/domain/account'
import { accountTypeLabels } from '@/utils/accountTypeUI'
import { normalizeText } from '@/utils/normalize'

type AccountFormProps = {
  mode: 'create' | 'edit'
  initialData?: Account
}

export function AccountForm({ mode, initialData }: AccountFormProps) {
  const router = useRouter()
  const isEdit = mode === 'edit'

  const [name, setName] = useState(initialData?.name ?? '')
  const [type, setType] = useState<AccountType>(
    initialData?.type ?? 'DINHEIRO'
  )
  const [initialBalance, setInitialBalance] = useState(
    initialData?.initialBalance?.toString() ?? '0'
  )
  const [creditLimit, setCreditLimit] = useState(
    initialData?.creditLimit?.toString() ?? ''
  )
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    try {
      setError(null)
      setLoading(true)

      const normalizedName = normalizeText(name)

      if (!normalizedName) {
        setError('Nome da conta é obrigatório')
        return
      }

      if (isEdit && initialData) {
        await updateAccount(initialData.id, {
          name: normalizedName,
          creditLimit:
            type === 'CARTAO_CREDITO'
              ? Number(creditLimit)
              : null,
        })
      } else {
        await createAccount({
          name: normalizedName,
          type,
          initialBalance:
            type === 'CARTAO_CREDITO'
              ? null
              : Number(initialBalance),
          creditLimit:
            type === 'CARTAO_CREDITO'
              ? Number(creditLimit)
              : null,
        })
      }

      router.push('/accounts')
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : isEdit
          ? 'Erro ao atualizar conta'
          : 'Erro ao criar conta'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {error && <div className="error field">{error}</div>}

      <div className="field">
        <label>Nome</label>
        <input
          className="input"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className="field">
        <label>Tipo</label>
        {isEdit ? (
          <div className="readonly-field">
            {accountTypeLabels[type]}
          </div>
        ) : (
          <select
            className="select"
            value={type}
            onChange={(e) =>
              setType(e.target.value as AccountType)
            }
          >
            {Object.entries(accountTypeLabels).map(
              ([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              )
            )}
          </select>
        )}
      </div>

      {!isEdit && type !== 'CARTAO_CREDITO' && (
        <div className="field">
          <label>Saldo inicial</label>
          <input
            className="input"
            type="number"
            value={initialBalance}
            onChange={(e) =>
              setInitialBalance(e.target.value)
            }
          />
        </div>
      )}

      {type === 'CARTAO_CREDITO' && (
        <div className="field">
          <label>Limite do cartão</label>
          <input
            className="input"
            type="number"
            value={creditLimit}
            onChange={(e) =>
              setCreditLimit(e.target.value)
            }
          />
        </div>
      )}

      <button
        className="button"
        onClick={handleSubmit}
        disabled={loading}
      >
        {loading
          ? 'Salvando...'
          : isEdit
          ? 'Atualizar conta'
          : 'Criar conta'}
      </button>
    </>
  )
}
