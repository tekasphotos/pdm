"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { usePathname } from "next/navigation"
import { toast } from "sonner"
import type { LucideIcon } from "lucide-react"
import { Loader2, Pencil, PlusCircle, Search, Trash2 } from "lucide-react"
import { InfoButton } from "@/components/ui/info-button"
import { matchesSearch } from "@/components/ui/list-filters"
import { getInfoContent } from "@/lib/info-content"
import {
  LABEL_UNIDADES,
  UNIDADES_MEDIDA,
  UNIDADE_OUTRA,
  type CatalogoVendaItem,
} from "@/lib/crm/documento-venda"

export type CatalogoRegistro = CatalogoVendaItem & {
  descricao: string | null
  ativo: boolean
  createdAt?: string | Date | null
  updatedAt?: string | Date | null
}

interface CatalogoCadastroProps {
  endpoint: string
  queryKey: string
  titulo: string
  singular: string
  plural: string
  descricao: string
  unidadePadrao: string
  Icone: LucideIcon
}

type FormState = {
  nome: string
  codigo: string
  descricao: string
  unidade: string
  unidadeOutra: string
  preco: string
  ativo: boolean
}

function estadoInicial(unidadePadrao: string): FormState {
  return {
    nome: "",
    codigo: "",
    descricao: "",
    unidade: unidadePadrao,
    unidadeOutra: "",
    preco: "",
    ativo: true,
  }
}

export function CatalogoCadastro({
  endpoint,
  queryKey,
  titulo,
  singular,
  plural,
  descricao,
  unidadePadrao,
  Icone,
}: CatalogoCadastroProps) {
  const queryClient = useQueryClient()
  const pathname = usePathname()
  const info = getInfoContent(pathname)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [busca, setBusca] = useState("")
  const [form, setForm] = useState<FormState>(estadoInicial(unidadePadrao))

  const { data: registros, isLoading } = useQuery<CatalogoRegistro[]>({
    queryKey: [queryKey],
    queryFn: async () => {
      const res = await fetch(endpoint)
      if (!res.ok) throw new Error(`Falha ao carregar ${plural}`)
      return res.json()
    },
    retry: 1,
  })

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        nome: form.nome,
        codigo: form.codigo,
        descricao: form.descricao,
        unidade: form.unidade,
        unidadeOutra: form.unidadeOutra,
        preco: form.preco,
        ativo: form.ativo,
      }
      const res = await fetch(editingId ? `${endpoint}/${editingId}` : endpoint, {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || `Falha ao salvar ${singular}`)
      }
      return res.json()
    },
    onSuccess: () => {
      toast.success(editingId ? `${singular} atualizado` : `${singular} criado`)
      queryClient.invalidateQueries({ queryKey: [queryKey] })
      resetForm()
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`${endpoint}/${id}`, { method: "DELETE" })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || `Falha ao excluir ${singular}`)
      }
    },
    onSuccess: () => {
      toast.success(`${singular} excluído`)
      queryClient.invalidateQueries({ queryKey: [queryKey] })
    },
    onError: (error: Error) => toast.error(error.message),
  })

  function resetForm() {
    setShowForm(false)
    setEditingId(null)
    setForm(estadoInicial(unidadePadrao))
  }

  function startEdit(registro: CatalogoRegistro) {
    setEditingId(registro.id)
    setForm({
      nome: registro.nome,
      codigo: registro.codigo || "",
      descricao: registro.descricao || "",
      unidade: registro.unidade || unidadePadrao,
      unidadeOutra: registro.unidadeOutra || "",
      preco: registro.preco != null ? String(registro.preco) : "",
      ativo: registro.ativo,
    })
    setShowForm(true)
  }

  function setField(campo: keyof FormState, valor: string | boolean) {
    setForm((prev) => ({ ...prev, [campo]: valor }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nome.trim()) {
      toast.error("Informe o nome")
      return
    }
    saveMutation.mutate()
  }

  const filtrados = registros?.filter((r) => !busca || matchesSearch(r, busca))

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
            {titulo}
            {info && <InfoButton content={info} />}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {isLoading ? "Carregando..." : `${filtrados?.length || 0} ${plural}`}
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{descricao}</p>
        </div>
        <button
          onClick={() => {
            resetForm()
            setShowForm(true)
          }}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors shadow-sm"
        >
          <PlusCircle size={16} />
          Novo {singular}
        </button>
      </div>

      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder={`Buscar ${singular.toLowerCase()}...`}
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
        />
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4"
        >
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {editingId ? `Editar ${singular}` : `Novo ${singular}`}
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                Nome *
              </label>
              <input
                type="text"
                required
                value={form.nome}
                onChange={(e) => setField("nome", e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                placeholder={singular === "Produto" ? "Ex: Malha penteada" : "Ex: Frete"}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                Código
              </label>
              <input
                type="text"
                value={form.codigo}
                onChange={(e) => setField("codigo", e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                placeholder="Opcional"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                Preço (R$)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.preco}
                onChange={(e) => setField("preco", e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                placeholder="0,00"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                Unidade
              </label>
              <select
                value={form.unidade}
                onChange={(e) => setField("unidade", e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              >
                {[...UNIDADES_MEDIDA, UNIDADE_OUTRA].map((u) => (
                  <option key={u} value={u}>
                    {LABEL_UNIDADES[u]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                Unidade (outra)
              </label>
              <input
                type="text"
                value={form.unidadeOutra}
                onChange={(e) => setField("unidadeOutra", e.target.value)}
                disabled={form.unidade !== UNIDADE_OUTRA}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 disabled:opacity-50"
                placeholder="Ex: Rolo, Caixa..."
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                Descrição
              </label>
              <textarea
                rows={2}
                value={form.descricao}
                onChange={(e) => setField("descricao", e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                placeholder="Detalhes opcionais"
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={form.ativo}
                onChange={(e) => setField("ativo", e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600"
              />
              Ativo
            </label>
          </div>
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saveMutation.isPending}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition-colors"
            >
              {saveMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              {editingId ? "Salvar" : "Criar"}
            </button>
          </div>
        </form>
      )}

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : !filtrados?.length ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Icone className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-3" />
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              {busca ? `Nenhum ${singular.toLowerCase()} encontrado` : `Nenhum ${singular.toLowerCase()} cadastrado`}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filtrados.map((registro) => (
              <div
                key={registro.id}
                className="flex items-center justify-between gap-3 px-4 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 shrink-0 rounded-lg bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center">
                    <Icone className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-200 break-words">
                      {registro.nome}
                      {registro.codigo && (
                        <span className="ml-2 text-xs font-normal text-slate-400">
                          {registro.codigo}
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {registro.unidade === UNIDADE_OUTRA
                        ? registro.unidadeOutra || "Outra"
                        : LABEL_UNIDADES[registro.unidade] || registro.unidade}
                      {registro.preco != null &&
                        ` · ${Number(registro.preco).toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}`}
                      {` · ${registro.ativo ? "Ativo" : "Inativo"}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => startEdit(registro)}
                    aria-label={`Editar ${registro.nome}`}
                    className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Excluir ${singular.toLowerCase()}?`)) {
                        deleteMutation.mutate(registro.id)
                      }
                    }}
                    aria-label={`Excluir ${registro.nome}`}
                    className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/50 text-slate-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
