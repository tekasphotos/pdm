"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { InfoButton } from "@/components/ui/info-button"
import { getInfoContent } from "@/lib/info-content"
import {
  ArrowLeft,
  Search,
  MapPin,
  RefreshCw,
  Check,
  AlertCircle,
  ExternalLink,
  PlusCircle,
  UserPlus,
  User,
  Loader2,
  X,
} from "lucide-react"
import { toast } from "sonner"
import { formatCep } from "@/hooks/useCepAutocomplete"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type FieldMap = {
  field: string
  label: string
  apiKey: string
  localKey: string
  format?: (v: any) => string
}

const PESSOA_FIELDS: FieldMap[] = [
  { field: "nome", label: "Nome", apiKey: "nome", localKey: "nome" },
  { field: "endereco", label: "Logradouro", apiKey: "logradouro", localKey: "endereco" },
  { field: "numero", label: "Número", apiKey: "numero", localKey: "numero" },
  { field: "complemento", label: "Complemento", apiKey: "complemento", localKey: "complemento" },
  { field: "bairro", label: "Bairro", apiKey: "bairro", localKey: "bairro" },
  { field: "cidade", label: "Cidade", apiKey: "localidade", localKey: "cidade" },
  { field: "uf", label: "UF", apiKey: "uf", localKey: "uf" },
  { field: "cep", label: "CEP", apiKey: "cep", localKey: "cep", format: (v) => formatCep(v || "") },
]

const CLIENTE_FIELDS: FieldMap[] = [
  { field: "nome", label: "Nome", apiKey: "nome", localKey: "nome" },
  {
    field: "endereco",
    label: "Endereço",
    apiKey: "logradouro",
    localKey: "endereco",
    format: (api: any) =>
      [api.logradouro, api.numero, api.bairro, api.complemento].filter(Boolean).join(", "),
  },
  { field: "cidade", label: "Cidade", apiKey: "localidade", localKey: "cidade" },
  { field: "uf", label: "UF", apiKey: "uf", localKey: "uf" },
]

function getApiValue(apiData: any, field: FieldMap) {
  if (field.format) return field.format(apiData)
  return apiData?.[field.apiKey] || ""
}

function getLocalValue(local: any, field: FieldMap) {
  return local?.[field.localKey] || ""
}

function valDiffers(api: string, local: string) {
  return api && local && api.toLowerCase() !== local.toLowerCase()
}

export default function ConsultaCepPage() {
  const pathname = usePathname()
  const info = getInfoContent(pathname)
  const [cep, setCep] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [syncing, setSyncing] = useState<string | null>(null)
  const [creating, setCreating] = useState<string | null>(null)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [createType, setCreateType] = useState<"pessoa" | "cliente" | null>(null)
  const [createNome, setCreateNome] = useState("")
  const [createCpf, setCreateCpf] = useState("")
  const [createCnpj, setCreateCnpj] = useState("")
  const [createLoading, setCreateLoading] = useState(false)

  function openCreateModal(type: "pessoa" | "cliente") {
    setCreateType(type)
    setCreateNome("")
    setCreateCpf("")
    setCreateCnpj("")
    setCreateModalOpen(true)
  }

  async function fetchCnpjData() {
    const digits = createCnpj.replace(/\D/g, "")
    if (digits.length !== 14) {
      toast.error("CNPJ deve ter 14 dígitos")
      return
    }
    try {
      const res = await fetch(`/api/crm/consulta-cnpj?cnpj=${digits}`)
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Erro na consulta")
      }
      const data = await res.json()
      if (data.apiData?.razao_social || data.apiData?.nome_fantasia) {
        setCreateNome(data.apiData.nome_fantasia || data.apiData.razao_social)
        toast.success("Nome preenchido automaticamente via CNPJ")
      } else {
        toast.error("Nome não encontrado para este CNPJ")
      }
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  async function handleCreateConfirm() {
    if (!result?.apiData || !createType) return
    if (!createNome.trim()) {
      toast.error("Nome é obrigatório")
      return
    }
    if (createType === "cliente" && !createCnpj.trim()) {
      toast.error("CNPJ é obrigatório para Cliente")
      return
    }
    setCreateLoading(true)
    try {
      const api = result.apiData
      if (createType === "pessoa") {
        const body = {
          tipoPessoa: "PF",
          nome: createNome,
          cpf: createCpf.replace(/\D/g, "") || null,
          endereco: api.logradouro || "",
          numero: api.numero || "",
          complemento: api.complemento || "",
          bairro: api.bairro || "",
          cidade: api.localidade || "",
          uf: api.uf || "",
          cep: api.cep || "",
        }
        const res = await fetch("/api/crm/pessoas", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })
        if (!res.ok) throw new Error("Erro ao criar pessoa")
        const nova = await res.json()
        toast.success(`Pessoa CRM "${createNome}" criada com sucesso`)
        const refresh = await fetch(`/api/crm/consulta-cep?cep=${api.cep}`)
        if (refresh.ok) setResult(await refresh.json())
      } else {
        const body = {
          nome: createNome,
          cnpj: createCnpj.replace(/\D/g, ""),
          cpf: createCpf.replace(/\D/g, "") || null,
          endereco: [api.logradouro, api.numero, api.bairro, api.complemento]
            .filter(Boolean)
            .join(", "),
          cidade: api.localidade || "",
          uf: api.uf || "",
        }
        const res = await fetch("/api/clientes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })
        if (!res.ok) throw new Error("Erro ao criar cliente")
        const novo = await res.json()
        toast.success(`Cliente "${createNome}" criado com sucesso`)
        const refresh = await fetch(`/api/crm/consulta-cep?cep=${api.cep}`)
        if (refresh.ok) setResult(await refresh.json())
      }
      setCreateModalOpen(false)
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setCreateLoading(false)
    }
  }

  async function fetchCpfName() {
    const digits = createCpf.replace(/\D/g, "")
    if (digits.length !== 11) {
      toast.error("CPF deve ter 11 dígitos")
      return
    }
    try {
      const res = await fetch(`/api/crm/consulta-cpf?cpf=${digits}`)
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Erro na consulta")
      }
      const data = await res.json()
      if (data.apiData?.nome) {
        setCreateNome(data.apiData.nome)
        toast.success("Nome preenchido automaticamente via CPF")
      } else {
        toast.error("Nome não encontrado para este CPF")
      }
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const digits = cep.replace(/\D/g, "")
    if (digits.length !== 8) {
      toast.error("CEP deve ter 8 dígitos")
      return
    }
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch(`/api/crm/consulta-cep?cep=${digits}`)
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Erro na consulta")
      }
      setResult(await res.json())
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function syncPessoa(pessoa: any) {
    if (!result?.apiData) return
    setSyncing(`pessoa-${pessoa.id}`)
    try {
      const api = result.apiData
      const body: Record<string, any> = {
        endereco: api.logradouro || pessoa.endereco,
        numero: api.numero || pessoa.numero,
        complemento: api.complemento || pessoa.complemento,
        bairro: api.bairro || pessoa.bairro,
        cidade: api.localidade || pessoa.cidade,
        uf: api.uf || pessoa.uf,
        cep: api.cep || pessoa.cep,
      }
      const res = await fetch(`/api/crm/pessoas/${pessoa.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error("Erro ao sincronizar")
      toast.success("Pessoa CRM atualizada com dados do CEP")
      const refresh = await fetch(`/api/crm/consulta-cep?cep=${api.cep}`)
      if (refresh.ok) setResult(await refresh.json())
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSyncing(null)
    }
  }

  async function syncCliente(cliente: any) {
    if (!result?.apiData) return
    setSyncing(`cliente-${cliente.id}`)
    try {
      const api = result.apiData
      const body: Record<string, any> = {
        endereco:
          [api.logradouro, api.numero, api.bairro, api.complemento].filter(Boolean).join(", ") ||
          cliente.endereco,
        cidade: api.localidade || cliente.cidade,
        uf: api.uf || cliente.uf,
      }
      const res = await fetch(`/api/clientes/${cliente.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error("Erro ao sincronizar")
      toast.success("Cliente atualizado com dados do CEP")
      const refresh = await fetch(`/api/crm/consulta-cep?cep=${api.cep}`)
      if (refresh.ok) setResult(await refresh.json())
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSyncing(null)
    }
  }

  async function criarPessoa() {
    if (!result?.apiData) return
    setCreating("pessoa")
    try {
      const api = result.apiData
      const body = {
        tipoPessoa: "PF",
        nome: "",
        endereco: api.logradouro || "",
        numero: api.numero || "",
        complemento: api.complemento || "",
        bairro: api.bairro || "",
        cidade: api.localidade || "",
        uf: api.uf || "",
        cep: api.cep || "",
      }
      const res = await fetch("/api/crm/pessoas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error("Erro ao criar pessoa")
      const nova = await res.json()
      toast.success(`Pessoa CRM "${body.nome || "Nova"}" criada com sucesso`)
      const refresh = await fetch(`/api/crm/consulta-cep?cep=${api.cep}`)
      if (refresh.ok) setResult(await refresh.json())
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setCreating(null)
    }
  }

  async function criarCliente() {
    if (!result?.apiData) return
    setCreating("cliente")
    try {
      const api = result.apiData
      const body = {
        nome: "",
        endereco: [api.logradouro, api.numero, api.bairro, api.complemento]
          .filter(Boolean)
          .join(", "),
        cidade: api.localidade || "",
        uf: api.uf || "",
      }
      const res = await fetch("/api/clientes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error("Erro ao criar cliente")
      const novo = await res.json()
      toast.success(`Cliente "${body.nome || "Novo"}" criado com sucesso`)
      const refresh = await fetch(`/api/crm/consulta-cep?cep=${api.cep}`)
      if (refresh.ok) setResult(await refresh.json())
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setCreating(null)
    }
  }

  const apiData = result?.apiData

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <div className="flex items-center gap-3">
        <Link
          href="/ferramentas"
          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <ArrowLeft size={18} className="text-slate-500" />
        </Link>
        <div className="flex items-center gap-2">
          <MapPin className="text-blue-600" size={22} />
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50">
            Consulta CEP{info && <InfoButton content={info} />}
          </h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-3">
        <input
          type="text"
          value={cep}
          onChange={(e) => setCep(e.target.value)}
          placeholder="Digite o CEP (com ou sem pontuação)"
          className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
          maxLength={9}
        />
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
        >
          {loading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
          ) : (
            <Search size={16} />
          )}
          {loading ? "Consultando..." : "Consultar"}
        </button>
      </form>

      {result && !apiData && (
        <div className="rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/30 p-4 flex items-start gap-3">
          <AlertCircle size={20} className="text-amber-500 mt-0.5 shrink-0" />
          <div>
            <p className="font-medium text-amber-800 dark:text-amber-300">
              CEP não encontrado
            </p>
            <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
              O CEP {formatCep(cep)} não foi localizado na base de dados.
            </p>
          </div>
        </div>
      )}

      {apiData && (
        <>
          <div className="rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/30 p-4 flex items-start gap-3">
            <Check size={20} className="text-emerald-500 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-emerald-800 dark:text-emerald-300">
                {apiData.logradouro}, {apiData.bairro} - {apiData.localidade}/{apiData.uf}
              </p>
              <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-0.5">
                CEP {formatCep(apiData.cep)}
              </p>
            </div>
          </div>

          <div className="grid gap-6">
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50 mb-1">
                Dados do CEP (ViaCEP)
              </h2>
              <p className="text-xs text-slate-400 mb-4">Fonte: ViaCEP (viacep.com.br)</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                <div>
                  <p className="text-xs text-slate-500 mb-0.5">CEP</p>
                  <p className="text-slate-900 dark:text-slate-200 font-mono">
                    {formatCep(apiData.cep)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-0.5">Logradouro</p>
                  <p className="text-slate-900 dark:text-slate-200">{apiData.logradouro || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-0.5">Complemento</p>
                  <p className="text-slate-900 dark:text-slate-200">{apiData.complemento || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-0.5">Bairro</p>
                  <p className="text-slate-900 dark:text-slate-200">{apiData.bairro || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-0.5">Cidade</p>
                  <p className="text-slate-900 dark:text-slate-200">{apiData.localidade || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-0.5">UF</p>
                  <p className="text-slate-900 dark:text-slate-200">{apiData.uf || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-0.5">IBGE</p>
                  <p className="text-slate-900 dark:text-slate-200">{apiData.ibge || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-0.5">DDD</p>
                  <p className="text-slate-900 dark:text-slate-200">{apiData.ddd || "—"}</p>
                </div>
              </div>
            </div>

            {result.crmPessoas?.length > 0 && (
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50 mb-4">
                  CRM Pessoas ({result.crmPessoas.length} encontrada(s))
                </h2>
                {result.crmPessoas.map((pessoa: any) => (
                  <div
                    key={pessoa.id}
                    className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <Link
                        href={`/comercial/crm/pessoas/${pessoa.id}`}
                        className="text-sm font-medium text-blue-600 hover:underline inline-flex items-center gap-1"
                      >
                        {pessoa.nome || pessoa.razaoSocial} <ExternalLink size={12} />
                      </Link>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 font-medium">
                        {pessoa.status}
                      </span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-slate-100 dark:border-slate-800">
                            <th className="text-left text-[10px] font-medium text-slate-400 uppercase pb-1.5 pr-3">
                              Campo
                            </th>
                            <th className="text-left text-[10px] font-medium text-slate-400 uppercase pb-1.5 pr-3">
                              Atual
                            </th>
                            <th className="text-left text-[10px] font-medium text-slate-400 uppercase pb-1.5">
                              API
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {PESSOA_FIELDS.map((f: any) => {
                            const api = getApiValue(apiData, f)
                            const local = getLocalValue(pessoa, f)
                            const diff = valDiffers(api, local)
                            return (
                              <tr
                                key={f.field}
                                className={`border-b border-slate-50 dark:border-slate-800/50 ${diff ? "bg-amber-50/50 dark:bg-amber-950/20" : ""}`}
                              >
                                <td className="py-1.5 pr-3 text-xs text-slate-500 whitespace-nowrap">
                                  {f.label}
                                </td>
                                <td
                                  className={`py-1.5 pr-3 ${local ? "text-slate-900 dark:text-slate-200" : "text-slate-400 italic"}`}
                                >
                                  {local || "vazio"}
                                </td>
                                <td
                                  className={`py-1.5 ${diff ? "text-emerald-600 dark:text-emerald-400 font-medium" : "text-slate-600 dark:text-slate-300"}`}
                                >
                                  {api || "—"}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                    <div className="flex justify-end pt-1">
                      <button
                        onClick={() => syncPessoa(pessoa)}
                        disabled={syncing === `pessoa-${pessoa.id}`}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
                      >
                        <RefreshCw
                          size={13}
                          className={syncing === `pessoa-${pessoa.id}` ? "animate-spin" : ""}
                        />
                        {syncing === `pessoa-${pessoa.id}`
                          ? "Sincronizando..."
                          : "Sincronizar dados com o CEP"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {result.clientes?.length > 0 && (
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50 mb-4">
                  Clientes ({result.clientes.length} encontrado(s))
                </h2>
                {result.clientes.map((cliente: any) => (
                  <div
                    key={cliente.id}
                    className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-900 dark:text-slate-200">
                        {cliente.nome}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 font-medium">
                        ID {cliente.id}
                      </span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-slate-100 dark:border-slate-800">
                            <th className="text-left text-[10px] font-medium text-slate-400 uppercase pb-1.5 pr-3">
                              Campo
                            </th>
                            <th className="text-left text-[10px] font-medium text-slate-400 uppercase pb-1.5 pr-3">
                              Atual
                            </th>
                            <th className="text-left text-[10px] font-medium text-slate-400 uppercase pb-1.5">
                              API
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {CLIENTE_FIELDS.map((f: any) => {
                            const api = getApiValue(apiData, f)
                            const local = getLocalValue(cliente, f)
                            const diff = valDiffers(api, local)
                            return (
                              <tr
                                key={f.field}
                                className={`border-b border-slate-50 dark:border-slate-800/50 ${diff ? "bg-amber-50/50 dark:bg-amber-950/20" : ""}`}
                              >
                                <td className="py-1.5 pr-3 text-xs text-slate-500 whitespace-nowrap">
                                  {f.label}
                                </td>
                                <td
                                  className={`py-1.5 pr-3 ${local ? "text-slate-900 dark:text-slate-200" : "text-slate-400 italic"}`}
                                >
                                  {local || "vazio"}
                                </td>
                                <td
                                  className={`py-1.5 ${diff ? "text-emerald-600 dark:text-emerald-400 font-medium" : "text-slate-600 dark:text-slate-300"}`}
                                >
                                  {api || "—"}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                    <div className="flex justify-end pt-1">
                      <button
                        onClick={() => syncCliente(cliente)}
                        disabled={syncing === `cliente-${cliente.id}`}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
                      >
                        <RefreshCw
                          size={13}
                          className={syncing === `cliente-${cliente.id}` ? "animate-spin" : ""}
                        />
                        {syncing === `cliente-${cliente.id}`
                          ? "Sincronizando..."
                          : "Sincronizar dados com o CEP"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!result.crmPessoas?.length && !result.clientes?.length && (
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center">
                <MapPin size={32} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                <p className="font-medium text-slate-900 dark:text-slate-200">
                  Nenhum registro local encontrado
                </p>
                <p className="text-sm text-slate-500 mt-1">
                  Este CEP não está cadastrado. Deseja cadastrar?
                </p>
                <div className="flex items-center justify-center gap-3 mt-4">
                  <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
                    <DialogTrigger>
                      <button
                        onClick={() => openCreateModal("pessoa")}
                        disabled={creating !== null}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
                      >
                        {creating === "pessoa" ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                        ) : (
                          <MapPin size={15} />
                        )}
                        {creating === "pessoa" ? "Criando..." : "Cadastrar como Pessoa CRM"}
                      </button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Cadastrar Pessoa CRM</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="create-nome">Nome *</Label>
                          <Input
                            id="create-nome"
                            value={createNome}
                            onChange={(e) => setCreateNome(e.target.value)}
                            placeholder="Digite o nome da pessoa"
                            autoFocus
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="create-cpf">CPF (opcional)</Label>
                          <div className="flex gap-2">
                            <Input
                              id="create-cpf"
                              value={createCpf}
                              onChange={(e) => setCreateCpf(e.target.value)}
                              placeholder="000.000.000-00"
                              maxLength={14}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={fetchCpfName}
                              disabled={!createCpf.replace(/\D/g, "").length || createLoading}
                              className="h-10"
                            >
                              {createLoading ? (
                                <Loader2 size={14} className="animate-spin" />
                              ) : (
                                <Search size={14} />
                              )}
                              Buscar nome
                            </Button>
                          </div>
                          <p className="text-xs text-slate-500">Se preencher o CPF, buscamos o nome automaticamente</p>
                        </div>
                      </div>
                      <div className="flex justify-end gap-2 pt-4 border-t">
                        <Button variant="outline" onClick={() => setCreateModalOpen(false)}>
                          Cancelar
                        </Button>
                        <Button onClick={handleCreateConfirm} disabled={createLoading}>
                          {createLoading ? (
                            <>
                              <Loader2 size={14} className="animate-spin mr-2" />
                              Criando...
                            </>
                          ) : (
                            "Cadastrar"
                          )}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                  <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
                    <DialogTrigger>
                      <button
                        onClick={() => openCreateModal("cliente")}
                        disabled={creating !== null}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                      >
                        {creating === "cliente" ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                        ) : (
                          <UserPlus size={15} />
                        )}
                        {creating === "cliente" ? "Criando..." : "Cadastrar como Cliente"}
                      </button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Cadastrar Cliente</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="create-nome-cliente">Nome *</Label>
                          <Input
                            id="create-nome-cliente"
                            value={createNome}
                            onChange={(e) => setCreateNome(e.target.value)}
                            placeholder="Digite o nome do cliente"
                            autoFocus
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="create-cnpj-cliente">CNPJ *</Label>
                          <div className="flex gap-2">
                            <Input
                              id="create-cnpj-cliente"
                              value={createCnpj}
                              onChange={(e) => setCreateCnpj(e.target.value)}
                              placeholder="00.000.000/0001-00"
                              maxLength={18}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={fetchCnpjData}
                              disabled={!createCnpj.replace(/\D/g, "").length || createLoading}
                              className="h-10"
                            >
                              {createLoading ? (
                                <Loader2 size={14} className="animate-spin" />
                              ) : (
                                <Search size={14} />
                              )}
                              Buscar nome
                            </Button>
                          </div>
                          <p className="text-xs text-slate-500">CNPJ é obrigatório. Se preencher, buscamos o nome automaticamente</p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="create-cpf-cliente">CPF (opcional)</Label>
                          <div className="flex gap-2">
                            <Input
                              id="create-cpf-cliente"
                              value={createCpf}
                              onChange={(e) => setCreateCpf(e.target.value)}
                              placeholder="000.000.000-00"
                              maxLength={14}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={fetchCpfName}
                              disabled={!createCpf.replace(/\D/g, "").length || createLoading}
                              className="h-10"
                            >
                              {createLoading ? (
                                <Loader2 size={14} className="animate-spin" />
                              ) : (
                                <Search size={14} />
                              )}
                              Buscar nome
                            </Button>
                          </div>
                          <p className="text-xs text-slate-500">Se preencher o CPF, buscamos o nome automaticamente</p>
                        </div>
                      </div>
                      <div className="flex justify-end gap-2 pt-4 border-t">
                        <Button variant="outline" onClick={() => setCreateModalOpen(false)}>
                          Cancelar
                        </Button>
                        <Button onClick={handleCreateConfirm} disabled={createLoading}>
                          {createLoading ? (
                            <>
                              <Loader2 size={14} className="animate-spin mr-2" />
                              Criando...
                            </>
                          ) : (
                            "Cadastrar"
                          )}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}