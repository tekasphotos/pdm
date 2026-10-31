"use client"

import { Package } from "lucide-react"
import { CatalogoCadastro } from "@/components/crm/catalogo-cadastro"

export default function ProdutosPage() {
  return (
    <CatalogoCadastro
      endpoint="/api/crm/produtos"
      queryKey="crm-produtos"
      titulo="Produtos"
      singular="Produto"
      plural="produtos"
      descricao="Catálogo genérico de produtos usados nos pedidos de venda do CRM."
      unidadePadrao="METROS"
      Icone={Package}
    />
  )
}
