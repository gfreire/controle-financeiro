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

        <div className="card">
          <div className="card-main">
            <strong>Gastos</strong>
            <span className="muted">
              Em breve
            </span>
          </div>
        </div>
      </div>
    </main>
  )
}