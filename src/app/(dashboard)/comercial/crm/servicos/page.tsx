"use client"

import { Wrench } from "lucide-react"
import { CatalogoCadastro } from "@/components/crm/catalogo-cadastro"

export default function ServicosPage() {
  return (
    <CatalogoCadastro
      endpoint="/api/crm/servicos"
      queryKey="crm-servicos"
      titulo="Serviços"
      singular="Serviço"
      plural="serviços"
      descricao="Catálogo genérico de serviços usados nos pedidos de venda do CRM."
      unidadePadrao="UNIDADES"
      Icone={Wrench}
    />
  )
}
