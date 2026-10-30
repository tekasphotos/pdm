import { useEffect, useState } from "react"

export default function UsuariosPage() {
  const [users, setUsers] = useState<Array<{
    id: number
    email: string
    name: string
    role: string
    ativo: boolean
  }>>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/test-usuarios")
      .then((res) => res.json())
      .then((data) => {
        if (data.ok) {
          setUsers(data.usuarios)
        }
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p>Carregando usuários...</p>

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Usuários do Sistema</h1>
      {users.length === 0 ? (
        <p>Nenhum usuário encontrado.</p>
      ) : (
        <ul className="space-y-2">
          {users.map((u) => (
            <li key={u.id} className="p-3 rounded bg-gray-50">
              <div className="font-medium">{u.name}</div>
              <div className="text-sm text-gray-600">{u.email}</div>
              <div className="text-xs">{u.role} | {u.ativo ? "Ativo" : "Inativo"}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}