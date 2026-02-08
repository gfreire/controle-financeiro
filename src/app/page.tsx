'use client'

import Link from 'next/link'

export default function DashboardPage() {
  return (
    <main className="container">
      <h1 className="title">Dashboard</h1>

      <div className="list">
        <Link href="/accounts" className="card">
          <div className="card-main">
            <strong>Contas</strong>
            <span className="muted">
              Gerenciar contas e cartões
            </span>
          </div>
        </Link>

        <Link href="/transactions" className="card">
          <div className="card-main">
            <strong>Movimentações</strong>
            <span className="muted">
                Gerenciar movimentações e despesas  
            </span>
          </div>
        </Link>

        <Link href="/categories" className="card">
          <div className="card-main">
            <strong>Categories</strong>
            <span className="muted">
                Gerenciar categorias e subcategorias de ENTRADA e SAÍDA
            </span>
          </div>
        </Link>

      </div>
    </main>
  )
}