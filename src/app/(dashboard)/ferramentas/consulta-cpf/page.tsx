"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { InfoButton } from "@/components/ui/info-button"
import { getInfoContent } from "@/lib/info-content"
import {
  ArrowLeft,
  Search,
  User,
  RefreshCw,
  Check,
  AlertCircle,
  ExternalLink,
  PlusCircle,
  UserPlus,
} from "lucide-react"
import { toast } from "sonner"

function formatCpf(v: string) {
  const d = v.replace(/\D/g, "")
  if (d.length !== 11) return v
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`
}

type FieldMap = {
  field: string
  label: string
  apiKey: string
  localKey: string
  format?: (v: any) => string
}

const PESSOA_FIELDS: FieldMap[] = [
  { field: "nome", label: "Nome", apiKey: "nome", localKey: "nome" },
  { field: "cpf", label: "CPF", apiKey: "cpf", localKey: "cpf", format: (v) => formatCpf(v || "") },
  { field: "endereco", label: "Logradouro", apiKey: "endereco.logradouro", localKey: "endereco" },
  { field: "numero", label: "Número", apiKey: "endereco.numero", localKey: "numero" },
  { field: "complemento", label: "Complemento", apiKey: "endereco.complemento", localKey: "complemento" },
  { field: "bairro", label: "Bairro", apiKey: "endereco.bairro", localKey: "bairro" },
  { field: "cidade", label: "Cidade", apiKey: "endereco.cidade", localKey: "cidade" },
  { field: "uf", label: "UF", apiKey: "endereco.uf", localKey: "uf" },
  { field: "cep", label: "CEP", apiKey: "endereco.cep", localKey: "cep", format: (v) => formatCpf(v || "") },
]

function getApiValue(apiData: any, field: FieldMap) {
  if (!apiData) return ""
  if (field.format) return field.format(apiData)
  if (field.apiKey.includes(".")) {
    const keys = field.apiKey.split(".")
    let value: any = apiData
    for (const key of keys) {
      if (value === null || value === undefined) return ""
      value = value[key]
    }
    return value || ""
  }
  return apiData?.[field.apiKey] || ""
}

function getLocalValue(local: any, field: FieldMap) {
  return local?.[field.localKey] || ""
}

function valDiffers(api: string, local: string) {
  return api && local && api.toLowerCase() !== local.toLowerCase()
}

export default function ConsultaCpfPage() {
  const pathname = usePathname()
  const info = getInfoContent(pathname)
  const [cpf, setCpf] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [syncing, setSyncing] = useState<string | null>(null)
  const [creating, setCreating] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const digits = cpf.replace(/\D/g, "")
    if (digits.length !== 11) {
      toast.error("CPF deve ter 11 dígitos")
      return
    }
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch(`/api/crm/consulta-cpf?cpf=${digits}`)
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
        nome: api.nome || pessoa.nome,
        cpf: api.cpf || pessoa.cpf,
        endereco: api.endereco?.logradouro || pessoa.endereco,
        numero: api.endereco?.numero || pessoa.numero,
        complemento: api.endereco?.complemento || pessoa.complemento,
        bairro: api.endereco?.bairro || pessoa.bairro,
        cidade: api.endereco?.cidade || pessoa.cidade,
        uf: api.endereco?.uf || pessoa.uf,
        cep: api.endereco?.cep || pessoa.cep,
      }
      const res = await fetch(`/api/crm/pessoas/${pessoa.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error("Erro ao sincronizar")
      toast.success("Pessoa CRM atualizada com dados do CPF")
      const refresh = await fetch(`/api/crm/consulta-cpf?cpf=${api.cpf}`)
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
        nome: api.nome || "",
        cpf: api.cpf || "",
        endereco: api.endereco?.logradouro || "",
        numero: api.endereco?.numero || "",
        complemento: api.endereco?.complemento || "",
        bairro: api.endereco?.bairro || "",
        cidade: api.endereco?.cidade || "",
        uf: api.endereco?.uf || "",
        cep: api.endereco?.cep || "",
      }
      const res = await fetch("/api/crm/pessoas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error("Erro ao criar pessoa")
      const nova = await res.json()
      toast.success(`Pessoa CRM "${body.nome || "Nova"}" criada com sucesso`)
      const refresh = await fetch(`/api/crm/consulta-cpf?cpf=${api.cpf}`)
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
          <User className="text-blue-600" size={22} />
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50">
            Consulta CPF{info && <InfoButton content={info} />}
          </h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-3">
        <input
          type="text"
          value={cpf}
          onChange={(e) => setCpf(e.target.value)}
          placeholder="Digite o CPF (com ou sem pontuação)"
          className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
          maxLength={14}
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
              CPF não encontrado
            </p>
            <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
              O CPF {formatCpf(cpf)} não foi localizado na base de dados.
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
                {apiData.nome}
              </p>
              <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-0.5">
                CPF {formatCpf(apiData.cpf)} &mdash; {apiData.situacao_cadastral || "Regular"}
              </p>
            </div>
          </div>

          <div className="grid gap-6">
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50 mb-1">
                Dados do CPF
              </h2>
              <p className="text-xs text-slate-400 mb-4">Fonte: API de Consulta CPF configurada</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                <div>
                  <p className="text-xs text-slate-500 mb-0.5">CPF</p>
                  <p className="text-slate-900 dark:text-slate-200 font-mono">
                    {formatCpf(apiData.cpf)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-0.5">Situação</p>
                  <p className="text-slate-900 dark:text-slate-200">{apiData.situacao_cadastral || "Regular"}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-0.5">Data Nasc.</p>
                  <p className="text-slate-900 dark:text-slate-200">{apiData.data_nascimento || "—"}</p>
                </div>
                <div className="col-span-2 sm:col-span-3">
                  <p className="text-xs text-slate-500 mb-0.5">Nome</p>
                  <p className="text-slate-900 dark:text-slate-200 font-medium">
                    {apiData.nome}
                  </p>
                </div>
                <div className="col-span-2 sm:col-span-3">
                  <p className="text-xs text-slate-500 mb-0.5">Nome da Mãe</p>
                  <p className="text-slate-900 dark:text-slate-200">
                    {apiData.nome_mae || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-0.5">Sexo</p>
                  <p className="text-slate-900 dark:text-slate-200">{apiData.sexo || "—"}</p>
                </div>
                {apiData.endereco && (
                  <>
                    <div>
                      <p className="text-xs text-slate-500 mb-0.5">Logradouro</p>
                      <p className="text-slate-900 dark:text-slate-200">{apiData.endereco.logradouro || "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-0.5">Número</p>
                      <p className="text-slate-900 dark:text-slate-200">{apiData.endereco.numero || "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-0.5">Complemento</p>
                      <p className="text-slate-900 dark:text-slate-200">{apiData.endereco.complemento || "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-0.5">Bairro</p>
                      <p className="text-slate-900 dark:text-slate-200">{apiData.endereco.bairro || "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-0.5">Cidade</p>
                      <p className="text-slate-900 dark:text-slate-200">{apiData.endereco.cidade || "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-0.5">UF</p>
                      <p className="text-slate-900 dark:text-slate-200">{apiData.endereco.uf || "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-0.5">CEP</p>
                      <p className="text-slate-900 dark:text-slate-200 font-mono">
                        {formatCpf(apiData.endereco.cep || "")}
                      </p>
                    </div>
                  </>
                )}
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
                          : "Sincronizar dados com o CPF"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!result.crmPessoas?.length && (
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center">
                <User size={32} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                <p className="font-medium text-slate-900 dark:text-slate-200">
                  Nenhum registro local encontrado
                </p>
                <p className="text-sm text-slate-500 mt-1">
                  Este CPF não está cadastrado. Deseja cadastrar?
                </p>
                <div className="flex items-center justify-center gap-3 mt-4">
                  <button
                    onClick={criarPessoa}
                    disabled={creating !== null}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {creating === "pessoa" ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    ) : (
                      <UserPlus size={15} />
                    )}
                    {creating === "pessoa" ? "Criando..." : "Cadastrar como Pessoa CRM"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}