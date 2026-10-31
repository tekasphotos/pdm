import { describe, it, expect } from "vitest"
import {
  normalizarItensVenda,
  normalizarItensPedidoVenda,
  catalogoParaLinha,
  itemLinhaParaForm,
} from "./documento-venda"

describe("normalizarItensVenda", () => {
  it("normaliza array válido", () => {
    const res = normalizarItensVenda([
      { produto: "  Tecido  ", codigo: "  T-01  ", unidade: "METROS", quantidade: "10", valorUnitario: "5", valorTotal: "50" },
    ])
    expect(res).toEqual([
      {
        produto: "Tecido",
        codigo: "T-01",
        unidade: "METROS",
        unidadeOutra: null,
        quantidade: "10",
        valorUnitario: "5",
        valorTotal: "50",
      },
    ])
  })

  it("ignora itens sem produto", () => {
    const res = normalizarItensVenda([
      { produto: "", codigo: "X", unidade: "METROS" },
      { produto: "   ", codigo: "Y" },
    ])
    expect(res).toEqual([])
  })

  it("trata OUTRA", () => {
    const res = normalizarItensVenda([
      { produto: "X", unidade: "OUTRA", unidadeOutra: "Rolo", quantidade: "1", valorUnitario: "10", valorTotal: "10" },
    ])
    expect(res[0].unidadeOutra).toBe("Rolo")
  })
})

describe("normalizarItensPedidoVenda", () => {
  it("inclui produtoId e servicoId quando válidos", () => {
    const res = normalizarItensPedidoVenda([
      { produto: "Produto A", unidade: "METROS", quantidade: "5", valorUnitario: "10", produtoId: "1", servicoId: "" },
      { produto: "Serviço B", unidade: "HORAS", quantidade: "2", valorUnitario: "50", produtoId: "", servicoId: "2" },
    ])
    expect(res).toHaveLength(2)
    expect(res[0].produtoId).toBe(1)
    expect(res[0].servicoId).toBeNull()
    expect(res[1].servicoId).toBe(2)
    expect(res[1].produtoId).toBeNull()
  })

  it("ignora ids inválidos", () => {
    const res = normalizarItensPedidoVenda([
      { produto: "X", unidade: "METROS", produtoId: "0", servicoId: "-1" },
      { produto: "Y", unidade: "METROS", produtoId: "abc", servicoId: "" },
    ])
    expect(res[0].produtoId).toBeNull()
    expect(res[0].servicoId).toBeNull()
  })

  it("filtra itens sem produto", () => {
    const res = normalizarItensPedidoVenda([
      { produto: "Válido", unidade: "METROS", produtoId: "1" },
      { produto: "", unidade: "METROS", produtoId: "2" },
    ])
    expect(res).toHaveLength(1)
    expect(res[0].produtoId).toBe(1)
  })
})

describe("catalogoParaLinha", () => {
  it("produto preenche campos corretamente", () => {
    const linha = catalogoParaLinha("produto", {
      id: 5,
      codigo: "P-05",
      nome: "Malha",
      unidade: "METROS",
      unidadeOutra: null,
      preco: "22.5",
    })
    expect(linha).toEqual({
      catalogoTipo: "produto",
      catalogoId: "5",
      produto: "Malha",
      codigo: "P-05",
      unidade: "METROS",
      unidadeOutra: "",
      valorUnitario: "22.5",
    })
  })

  it("serviço preenche campos corretamente", () => {
    const linha = catalogoParaLinha("servico", {
      id: 7,
      codigo: "S-07",
      nome: "Frete",
      unidade: "UNIDADES",
      unidadeOutra: null,
      preco: "100",
    })
    expect(linha.catalogoTipo).toBe("servico")
    expect(linha.catalogoId).toBe("7")
    expect(linha.produto).toBe("Frete")
  })
})

describe("itemLinhaParaForm", () => {
  it("deriva catalogoTipo de produtoId", () => {
    const item = {
      id: 1,
      produto: "Produto X",
      codigo: "PX",
      unidade: "METROS",
      unidadeOutra: null,
      quantidade: "10",
      valorUnitario: "5",
      valorTotal: "50",
      produtoId: 3,
      servicoId: null,
    }
    const form = itemLinhaParaForm(item)
    expect(form.catalogoTipo).toBe("produto")
    expect(form.catalogoId).toBe("3")
  })

  it("deriva catalogoTipo de servicoId", () => {
    const item = {
      id: 1,
      produto: "Serviço Y",
      codigo: "SY",
      unidade: "HORAS",
      unidadeOutra: null,
      quantidade: "2",
      valorUnitario: "50",
      valorTotal: "100",
      produtoId: null,
      servicoId: 8,
    }
    const form = itemLinhaParaForm(item)
    expect(form.catalogoTipo).toBe("servico")
    expect(form.catalogoId).toBe("8")
  })

  it("usa livre quando nenhum id", () => {
    const item = {
      id: 1,
      produto: "Livre",
      codigo: "",
      unidade: "METROS",
      unidadeOutra: null,
      quantidade: "1",
      valorUnitario: "10",
      valorTotal: "10",
      produtoId: null,
      servicoId: null,
    }
    const form = itemLinhaParaForm(item)
    expect(form.catalogoTipo).toBe("livre")
    expect(form.catalogoId).toBe("")
  })
})