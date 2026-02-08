import '@/styles/globals.css'
import '@/styles/components.css'

export const metadata = {
  title: 'Controle Financeiro',
  description: 'Sistema de controle financeiro pessoal',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body>
        {children}
      </body>
    </html>
  )
}