"use client"

import { useState, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { InfoButton } from "@/components/ui/info-button"
import { getInfoContent } from "@/lib/info-content"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  Save,
  Search,
  Trash2,
  Users,
  UserPlus,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react"
import { toast } from "sonner"
import { SelectUf } from "@/components/crm/select-uf"
import { SelectCidade } from "@/components/crm/select-cidade"
import { SelectSegmento } from "@/components/crm/select-segmento"
import { useCepAutocomplete, formatCep } from "@/hooks/useCepAutocomplete"
import type {
  ConsultaCnpjData,
  PessoaForm,
  RepresentanteResult,
  VinculoRepresentante,
} from "../types"

export default function NovaPessoaPage() {
  const router = useRouter()
  const pathname = usePathname()
  const info = getInfoContent(pathname)
  const [tipoPessoa, setTipoPessoa] = useState<"PF" | "PJ">("PJ")
  const [consulting, setConsulting] = useState(false)
  const [consulted, setConsulted] = useState(false)
  const [apiData, setApiData] = useState<ConsultaCnpjData | null>(null)
  const [cpfConsulting, setCpfConsulting] = useState(false)
  const [cpfConsulted, setCpfConsulted] = useState(false)
  const [cpfApiData, setCpfApiData] = useState<any | null>(null)
  const [cepConsulting, setCepConsulting] = useState(false)
  const [cepConsulted, setCepConsulted] = useState(false)
  const [cepData, setCepData] = useState<any | null>(null)
  const [form, setForm] = useState<PessoaForm>({
    tipoPessoa: "PJ",
    nome: "",
    cpf: "",
    razaoSocial: "",
    nomeFantasia: "",
    cnpj: "",
    segmento: "",
    porte: "",
    site: "",
    telefone: "",
    celular: "",
    email: "",
    emailNf: "",
    endereco: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    uf: "",
    cep: "",
    observacoes: "",
  })
  const [saving, setSaving] = useState(false)
  const [estadoId, setEstadoId] = useState<number | null>(null)

  const {
    formatCep,
    cepConsulting,
    cepConsulted,
    cepError,
    cepData,
    consultarCep,
    limparConsulta: limparConsultaCep,
  } = useCepAutocomplete()
  const { data: estados = [] } = useQuery<{ id: number; uf: string }[]>({
    queryKey: ["crm-estados"],
    queryFn: async () => {
      const res = await fetch("/api/crm/estados")
      if (!res.ok) return []
      return res.json()
    },
  })

  const [vinculos, setVinculos] = useState<VinculoRepresentante[]>([])
  const [searchRep, setSearchRep] = useState("")
  const [repResults, setRepResults] = useState<RepresentanteResult[]>([])
  const [searchingRep, setSearchingRep] = useState(false)

  useEffect(() => {
    if (form.uf) {
      const found = estados.find((e) => e.uf === form.uf)
      setEstadoId(found ? found.id : null)
    } else {
      setEstadoId(null)
    }
  }, [form.uf, estados])

  async function searchRepresentantes(query: string) {
    setSearchRep(query)
    if (query.length < 2) {
      setRepResults([])
      return
    }
    setSearchingRep(true)
    try {
      const res = await fetch(`/api/representantes?q=${encodeURIComponent(query)}`)
      if (!res.ok) throw new Error()
      const data: RepresentanteResult[] = await res.json()
      const existentes = new Set(vinculos.map((v) => v.representanteId))
      setRepResults(data.filter((r) => !existentes.has(r.id)))
    } catch {
    } finally {
      setSearchingRep(false)
    }
  }

  function addRepresentante(representante: RepresentanteResult) {
    if (vinculos.find((v) => v.representanteId === representante.id)) return
    setVinculos((prev) => [
      ...prev,
      {
        id: Date.now(),
        representanteId: representante.id,
        representanteNome: representante.nome || "",
        representante: { nome: representante.nome || "" },
      },
    ])
    setRepResults([])
    setSearchRep("")
  }

  function removeRepresentante(id: number) {
    setVinculos((prev) => prev.filter((v) => v.representanteId !== id))
  }

  function setField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function handleTipoChange(tipo: "PF" | "PJ") {
    setTipoPessoa(tipo)
    setForm((prev) => ({ ...prev, tipoPessoa: tipo }))
  }

  function formatCnpj(v: string) {
    const d = v.replace(/\D/g, "")
    if (d.length !== 14) return v
    return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`
  }

  function formatCpf(v: string) {
    const d = v.replace(/\D/g, "")
    if (d.length !== 11) return v
    return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`
  }

  async function handleConsultarCnpj() {
    const digits = (form.cnpj || "").replace(/\D/g, "")
    if (digits.length !== 14) {
      toast.error("CNPJ deve ter 14 dígitos")
      return
    }
    setConsulting(true)
    setConsulted(false)
    setApiData(null)
    try {
      const res = await fetch(`/api/crm/consulta-cnpj?cnpj=${digits}`)
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Erro na consulta")
      }
      const result = await res.json()
      const api: ConsultaCnpjData | undefined = result.apiData
      if (!api) {
        setConsulted(true)
        toast.error("CNPJ não encontrado na Receita Federal")
        return
      }
      setApiData(api)
      setConsulted(true)
      setForm((prev) => ({
        ...prev,
        cnpj: formatCnpj(digits),
        razaoSocial: api.razao_social || prev.razaoSocial,
        nomeFantasia: api.nome_fantasia || prev.nomeFantasia,
        segmento:
          api.cnaes?.find((c) => c.is_principal)?.descricao ||
          api.cnae_principal_descricao ||
          prev.segmento,
        endereco: api.logradouro || prev.endereco,
        numero: api.numero || prev.numero,
        complemento: api.complemento || prev.complemento,
        bairro: api.bairro || prev.bairro,
        cidade: api.municipio || prev.cidade,
        uf: api.uf || prev.uf,
        cep: api.cep ? formatCep(api.cep) : prev.cep,
        telefone:
          prev.telefone ||
          (api.telefones?.[0] ? `${api.telefones[0].ddd}${api.telefones[0].numero}` : ""),
      }))
      toast.success("Dados preenchidos automaticamente")
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao consultar CNPJ")
    } finally {
      setConsulting(false)
    }
  }

  async function handleConsultarCpf() {
    const digits = (form.cpf || "").replace(/\D/g, "")
    if (digits.length !== 11) {
      toast.error("CPF deve ter 11 dígitos")
      return
    }
    setCpfConsulting(true)
    setCpfConsulted(false)
    setCpfApiData(null)
    try {
      const res = await fetch(`/api/crm/consulta-cpf?cpf=${digits}`)
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Erro na consulta")
      }
      const result = await res.json()
      const api = result.apiData
      if (!api) {
        setCpfConsulted(true)
        toast.error("CPF não encontrado")
        return
      }
      setCpfApiData(api)
      setCpfConsulted(true)
      setForm((prev) => ({
        ...prev,
        cpf: formatCpf(digits),
        nome: api.nome || prev.nome,
        endereco: api.endereco?.logradouro || prev.endereco,
        numero: api.endereco?.numero || prev.numero,
        complemento: api.endereco?.complemento || prev.complemento,
        bairro: api.endereco?.bairro || prev.bairro,
        cidade: api.endereco?.cidade || prev.cidade,
        uf: api.endereco?.uf || prev.uf,
        cep: api.endereco?.cep ? formatCep(api.endereco.cep) : prev.cep,
        telefone:
          prev.telefone ||
          (api.endereco?.ddd ? `${api.endereco.ddd}${api.endereco.numero}` : ""),
      }))
      toast.success("Dados preenchidos automaticamente")
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao consultar CPF")
    } finally {
      setCpfConsulting(false)
    }
  }

  async function handleConsultarCep() {
    const digits = (form.cep || "").replace(/\D/g, "")
    if (digits.length !== 8) {
      toast.error("CEP deve ter 8 dígitos")
      return
    }
    setCepConsulting(true)
    setCepConsulted(false)
    try {
      const res = await fetch(`/api/crm/consulta-cep?cep=${digits}`)
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Erro na consulta")
      }
      const result = await res.json()
      const api = result.apiData
      if (!api) {
        setCepConsulted(true)
        toast.error("CEP não encontrado")
        return
      }
      setCepData(api)
      setCepConsulted(true)
      setForm((prev) => ({
        ...prev,
        cep: formatCep(digits),
        endereco: api.logradouro || prev.endereco,
        bairro: api.bairro || prev.bairro,
        cidade: api.localidade || prev.cidade,
        uf: api.uf || prev.uf,
      }))
      toast.success("Endereço preenchido automaticamente")
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao consultar CEP")
    } finally {
      setCepConsulting(false)
    }
  }

  function getNomeObrigatorio() {
    return tipoPessoa === "PF" ? form.nome?.trim() : form.razaoSocial?.trim()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!getNomeObrigatorio()) {
      toast.error(tipoPessoa === "PF" ? "Nome é obrigatório" : "Razão Social é obrigatória")
      return
    }
    setSaving(true)
    try {
      const res = await fetch("/api/crm/pessoas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Erro ao salvar")
      }
      const data = await res.json()

      // Vincular representantes selecionados
      for (const v of vinculos) {
        await fetch(`/api/crm/pessoas/${data.id}/representantes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ representanteId: v.representanteId }),
        })
      }

      toast.success("Pessoa cadastrada com sucesso")
      router.push(`/comercial/crm/pessoas/${data.id}`)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div className="flex items-center gap-3">
        <Link
          href="/comercial/crm/pessoas"
          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <ArrowLeft size={18} className="text-slate-500" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50">
            Nova Pessoa (Negócio){info && <InfoButton content={info} />}
          </h1>
          <p className="text-sm text-slate-500">
            Cadastrar um negócio (pessoa física ou jurídica) no CRM
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-5"
      >
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Tipo
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleTipoChange("PF")}
              className={`px-4 py-2 text-sm rounded-lg font-medium border transition-colors ${
                tipoPessoa === "PF"
                  ? "border-purple-500 bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300"
                  : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
              }`}
            >
              Pessoa Física
            </button>
            <button
              type="button"
              onClick={() => handleTipoChange("PJ")}
              className={`px-4 py-2 text-sm rounded-lg font-medium border transition-colors ${
                tipoPessoa === "PJ"
                  ? "border-cyan-500 bg-cyan-50 dark:bg-cyan-950/30 text-cyan-700 dark:text-cyan-300"
                  : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
              }`}
            >
              Pessoa Jurídica
            </button>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          {tipoPessoa === "PF" ? (
            <>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Nome *
                </label>
                <input
                  type="text"
                  value={form.nome || ""}
                  onChange={(e) => setField("nome", e.target.value)}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  CPF
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={form.cpf || ""}
                    onChange={(e) => setField("cpf", e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && (e.preventDefault(), handleConsultarCpf())
                    }
                    placeholder="000.000.000-00"
                    className="flex-1 min-w-0 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleConsultarCpf}
                    disabled={cpfConsulting}
                    className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/50 dark:hover:bg-purple-950/80 border border-purple-200 dark:border-purple-800 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {cpfConsulting ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Search size={14} />
                    )}
                    <span className="hidden sm:inline">Consultar</span>
                  </button>
                </div>
              </div>

              {tipoPessoa === "PF" && cpfConsulted && !cpfApiData && (
                <div className="sm:col-span-2 rounded-lg border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/30 p-3 flex items-start gap-2">
                  <AlertCircle size={16} className="text-amber-500 mt-0.5 shrink-0" />
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    CPF não encontrado. Preencha os dados manualmente.
                  </p>
                </div>
              )}
              {tipoPessoa === "PF" && cpfApiData && (
                <div className="sm:col-span-2 rounded-lg border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/30 p-3 flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-emerald-500 mt-0.5 shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-emerald-800 dark:text-emerald-300">
                      {cpfApiData.nome}
                    </p>
                    <p className="text-emerald-600 dark:text-emerald-400 text-xs mt-0.5">
                      {cpfApiData.situacao_cadastral || "Regular"}
                    </p>
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Razão Social *
                </label>
                <input
                  type="text"
                  value={form.razaoSocial}
                  onChange={(e) => setField("razaoSocial", e.target.value)}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Nome Fantasia
                </label>
                <input
                  type="text"
                  value={form.nomeFantasia}
                  onChange={(e) => setField("nomeFantasia", e.target.value)}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  CNPJ
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={form.cnpj}
                    onChange={(e) => setField("cnpj", e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && (e.preventDefault(), handleConsultarCnpj())
                    }
                    placeholder="00.000.000/0000-00"
                    className="flex-1 min-w-0 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleConsultarCnpj}
                    disabled={consulting}
                    className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-cyan-600 bg-cyan-50 hover:bg-cyan-100 dark:bg-cyan-950/50 dark:hover:bg-cyan-950/80 border border-cyan-200 dark:border-cyan-800 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {consulting ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Search size={14} />
                    )}
                    <span className="hidden sm:inline">Consultar</span>
                  </button>
                </div>
              </div>
            </>
          )}
          {tipoPessoa === "PJ" && consulted && !apiData && (
            <div className="sm:col-span-2 rounded-lg border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/30 p-3 flex items-start gap-2">
              <AlertCircle size={16} className="text-amber-500 mt-0.5 shrink-0" />
              <p className="text-sm text-amber-700 dark:text-amber-300">
                CNPJ não encontrado na Receita Federal. Preencha os dados manualmente.
              </p>
            </div>
          )}
          {tipoPessoa === "PJ" && apiData && (
            <div className="sm:col-span-2 rounded-lg border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/30 p-3 flex items-start gap-2">
              <CheckCircle2 size={16} className="text-emerald-500 mt-0.5 shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-emerald-800 dark:text-emerald-300">
                  {apiData.razao_social}
                </p>
                <p className="text-emerald-600 dark:text-emerald-400 text-xs mt-0.5">
                  {apiData.nome_fantasia} — {apiData.situacao_cadastral}
                </p>
              </div>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Segmento
            </label>
            <SelectSegmento value={form.segmento ?? ""} onChange={(v) => setField("segmento", v)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Porte
            </label>
            <select
              value={form.porte}
              onChange={(e) => setField("porte", e.target.value)}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Selecione...</option>
              <option value="MEI">MEI</option>
              <option value="ME">ME</option>
              <option value="EPP">EPP</option>
              <option value="MEDIO">Médio Porte</option>
              <option value="GRANDE">Grande Porte</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Site
            </label>
            <input
              type="url"
              value={form.site}
              onChange={(e) => setField("site", e.target.value)}
              placeholder="https://"
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="sm:col-span-2">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-2">
              Contato
            </h3>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Telefone
            </label>
            <input
              type="text"
              value={form.telefone}
              onChange={(e) => setField("telefone", e.target.value)}
              placeholder="(00) 0000-0000"
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Celular
            </label>
            <input
              type="text"
              value={form.celular}
              onChange={(e) => setField("celular", e.target.value)}
              placeholder="(00) 00000-0000"
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              E-mail
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setField("email", e.target.value)}
              placeholder="contato@exemplo.com"
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              E-mail para NF-e
            </label>
            <input
              type="email"
              value={form.emailNf}
              onChange={(e) => setField("emailNf", e.target.value)}
              placeholder="nf@exemplo.com"
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="sm:col-span-2">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-2">
              Endereço
            </h3>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Logradouro
            </label>
            <input
              type="text"
              value={form.endereco}
              onChange={(e) => setField("endereco", e.target.value)}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Número
            </label>
            <input
              type="text"
              value={form.numero}
              onChange={(e) => setField("numero", e.target.value)}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Complemento
            </label>
            <input
              type="text"
              value={form.complemento}
              onChange={(e) => setField("complemento", e.target.value)}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Bairro
            </label>
            <input
              type="text"
              value={form.bairro}
              onChange={(e) => setField("bairro", e.target.value)}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              CEP
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={formatCep(form.cep || "")}
                onChange={(e) => setField("cep", e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && (e.preventDefault(), handleConsultarCep())
                }
                placeholder="00.000-000"
                className="flex-1 min-w-0 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
              <button
                type="button"
                onClick={handleConsultarCep}
                disabled={cepConsulting}
                className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-amber-600 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/50 dark:hover:bg-amber-950/80 border border-amber-200 dark:border-amber-800 rounded-lg transition-colors disabled:opacity-50"
              >
                {cepConsulting ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Search size={14} />
                )}
                <span className="hidden sm:inline">Consultar</span>
              </button>
            </div>
            {cepConsulted && !cepData && (
              <div className="mt-2 rounded-lg border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/30 p-3 flex items-start gap-2">
                <AlertCircle size={16} className="text-amber-500 mt-0.5 shrink-0" />
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  CEP {formatCep(form.cep)} não encontrado. Preencha os dados manualmente.
                </p>
              </div>
            )}
            {cepData && (
              <div className="mt-2 rounded-lg border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/30 p-3 flex items-start gap-2">
                <CheckCircle2 size={16} className="text-emerald-500 mt-0.5 shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-emerald-800 dark:text-emerald-300">
                    {cepData.logradouro}, {cepData.bairro} - {cepData.localidade}/{cepData.uf}
                  </p>
                  <p className="text-emerald-600 dark:text-emerald-400 text-xs mt-0.5">
                    Endereço preenchido automaticamente
                  </p>
                </div>
              </div>
            )}
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              UF
            </label>
            <SelectUf value={form.uf ?? ""} onChange={(v) => setField("uf", v)} />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Cidade
            </label>
            <SelectCidade
              value={form.cidade ?? ""}
              onChange={(v) => setField("cidade", v)}
              estadoId={estadoId}
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Observações
            </label>
            <textarea
              value={form.observacoes}
              onChange={(e) => setField("observacoes", e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-4">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2 mb-3">
            <Users size={16} />
            Representantes Vinculados
          </h3>

          {vinculos.length > 0 && (
            <div className="mb-3 space-y-2">
              {vinculos.map((v: VinculoRepresentante) => (
                <div
                  key={v.id || v.representanteId}
                  className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 rounded-lg px-3 py-2"
                >
                  <span className="text-sm text-slate-700 dark:text-slate-300">
                    {v.representanteNome}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeRepresentante(v.representanteId ?? 0)}
                    className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-slate-400 hover:text-red-600"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="relative">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  value={searchRep}
                  onChange={(e) => searchRepresentantes(e.target.value)}
                  placeholder="Buscar representante pelo nome..."
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {searchingRep && (
                  <Loader2
                    size={14}
                    className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-slate-400"
                  />
                )}
              </div>
            </div>
            {repResults.length > 0 && (
              <div className="absolute z-10 mt-1 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg max-h-48 overflow-y-auto">
                {repResults.map((r: RepresentanteResult) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => addRepresentante(r)}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-300"
                  >
                    <UserPlus size={14} className="text-slate-400" />
                    {r.nome}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <Link
            href="/comercial/crm/pessoas"
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
          >
            <Save size={16} />
            {saving ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </form>
    </div>
  )
}
