export const UNIDADES_MEDIDA = [
  "METROS",
  "KILOS",
  "PECAS",
  "UNIDADES",
  "METROS2",
  "HORAS",
  "MESES",
] as const
export const UNIDADE_OUTRA = "OUTRA"

export const LABEL_UNIDADES: Record<string, string> = {
  METROS: "Metros (m)",
  KILOS: "Kilos (kg)",
  PECAS: "Peças (pc)",
  UNIDADES: "Unidades (un)",
  METROS2: "Metros² (m²)",
  HORAS: "Horas (h)",
  MESES: "Meses (mês)",
  OUTRA: "Outra",
}

export const STATUS_FATURAMENTO = ["EMITIDO", "PARCIAL", "RECEBIDO", "CANCELADO"] as const
export const STATUS_PEDIDO_VENDA = ["ABERTO", "PARCIAL", "FATURADO", "CANCELADO"] as const

export const STATUS_FATURAMENTO_LABELS: Record<string, string> = {
  EMITIDO: "Emitido",
  PARCIAL: "Parcial",
  RECEBIDO: "Recebido",
  CANCELADO: "Cancelado",
}

export const STATUS_FATURAMENTO_CORES: Record<string, string> = {
  EMITIDO: "text-blue-600 bg-blue-50 dark:bg-blue-950/50 dark:text-blue-400",
  PARCIAL: "text-amber-600 bg-amber-50 dark:bg-amber-950/50 dark:text-amber-400",
  RECEBIDO: "text-green-600 bg-green-50 dark:bg-green-950/50 dark:text-green-400",
  CANCELADO: "text-red-600 bg-red-50 dark:bg-red-950/50 dark:text-red-400",
}

export const STATUS_PEDIDO_VENDA_LABELS: Record<string, string> = {
  ABERTO: "Aberto",
  PARCIAL: "Parcial",
  FATURADO: "Faturado",
  CANCELADO: "Cancelado",
}

export const STATUS_PEDIDO_VENDA_CORES: Record<string, string> = {
  ABERTO: "text-blue-600 bg-blue-50 dark:bg-blue-950/50 dark:text-blue-400",
  PARCIAL: "text-amber-600 bg-amber-50 dark:bg-amber-950/50 dark:text-amber-400",
  FATURADO: "text-green-600 bg-green-50 dark:bg-green-950/50 dark:text-green-400",
  CANCELADO: "text-red-600 bg-red-50 dark:bg-red-950/50 dark:text-red-400",
}

export function statusOptions(statusList: readonly string[], labels: Record<string, string>) {
  return statusList.map((value) => ({ value, label: labels[value] || value }))
}

export type CatalogoTipo = "livre" | "produto" | "servico"

export interface CatalogoVendaItem {
  id: number
  codigo: string | null
  nome: string
  unidade: string
  unidadeOutra: string | null
  preco: string | null
}

export interface ItemVendaLinha {
  produto: string
  codigo: string
  unidade: string
  unidadeOutra: string
  quantidade: string
  valorUnitario: string
  valorTotal: string
  catalogoTipo?: CatalogoTipo
  catalogoId?: string
}

export interface ItemVendaDocumento {
  id: number
  produto: string
  codigo: string | null
  unidade: string
  unidadeOutra: string | null
  quantidade: string | null
  valorUnitario: string | null
  valorTotal: string | null
  produtoId?: number | null
  servicoId?: number | null
}

export interface DocumentoVendaLinhaNormalizada {
  produto: string
  codigo: string | null
  unidade: string
  unidadeOutra: string | null
  quantidade: string | number | null
  valorUnitario: string | number | null
  valorTotal: string | number | null
  produtoId?: number | null
  servicoId?: number | null
}

function normalizarLinha(i: any): DocumentoVendaLinhaNormalizada {
  const unidade = String(i.unidade || "METROS").trim()
  return {
    produto: String(i.produto).trim(),
    codigo: i.codigo?.trim() || null,
    unidade,
    unidadeOutra: unidade === UNIDADE_OUTRA ? i.unidadeOutra?.trim() || null : null,
    quantidade: i.quantidade != null && i.quantidade !== "" ? i.quantidade : null,
    valorUnitario: i.valorUnitario != null && i.valorUnitario !== "" ? i.valorUnitario : null,
    valorTotal: i.valorTotal != null && i.valorTotal !== "" ? i.valorTotal : null,
  }
}

export function normalizarItensVenda(itens: any): DocumentoVendaLinhaNormalizada[] {
  if (!Array.isArray(itens)) return []
  return itens.filter((i: any) => i?.produto?.trim()).map(normalizarLinha)
}

export function normalizarItensPedidoVenda(itens: any): DocumentoVendaLinhaNormalizada[] {
  if (!Array.isArray(itens)) return []
  return itens
    .filter((i: any) => i?.produto?.trim())
    .map((i: any) => {
      const produtoId = Number(i.produtoId)
      const servicoId = Number(i.servicoId)
      return {
        ...normalizarLinha(i),
        produtoId: Number.isInteger(produtoId) && produtoId > 0 ? produtoId : null,
        servicoId: Number.isInteger(servicoId) && servicoId > 0 ? servicoId : null,
      }
    })
}

export function catalogoParaLinha(
  tipo: Exclude<CatalogoTipo, "livre">,
  item: CatalogoVendaItem
): Partial<ItemVendaLinha> {
  return {
    catalogoTipo: tipo,
    catalogoId: String(item.id),
    produto: item.nome,
    codigo: item.codigo || "",
    unidade: item.unidade || "METROS",
    unidadeOutra: item.unidadeOutra || "",
    valorUnitario: item.preco != null ? String(item.preco) : "",
  }
}

export function itemLinhaParaForm(item: ItemVendaDocumento | any): ItemVendaLinha {
  const produtoId = item.produtoId != null ? String(item.produtoId) : ""
  const servicoId = item.servicoId != null ? String(item.servicoId) : ""
  return {
    produto: item.produto || "",
    codigo: item.codigo || "",
    unidade: item.unidade || "METROS",
    unidadeOutra: item.unidadeOutra || "",
    quantidade: item.quantidade != null ? String(item.quantidade) : "",
    valorUnitario: item.valorUnitario != null ? String(item.valorUnitario) : "",
    valorTotal: item.valorTotal != null ? String(item.valorTotal) : "",
    catalogoTipo: produtoId ? "produto" : servicoId ? "servico" : "livre",
    catalogoId: produtoId || servicoId,
  }
}

export function calcularValorTotal(quantidade: string, valorUnitario: string): string {
  const q = parseFloat(quantidade)
  const v = parseFloat(valorUnitario)
  if (Number.isNaN(q) || Number.isNaN(v)) return ""
  return (q * v).toFixed(2)
}

export function somarValoresTotais(itens: Array<{ valorTotal?: string | number | null }>): number {
  if (!Array.isArray(itens)) return 0
  return itens.reduce((acc, item) => {
    const v = parseFloat(String(item?.valorTotal ?? ""))
    return acc + (Number.isNaN(v) ? 0 : v)
  }, 0)
}
