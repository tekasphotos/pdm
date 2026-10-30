// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { screen, fireEvent } from "@testing-library/react"
import WhatsAppCatalogosPage from "./page"
import { renderPage, createFetchMock, routeJson } from "@/test/harness"

describe("WhatsAppCatalogosPage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  function setup(linhas: unknown[] = [], catalogos: unknown[] = []) {
    const fetchMock = createFetchMock(
      routeJson({
        "/api/admin/whatsapp-linhas": linhas,
        "/api/admin/whatsapp-catalogos": catalogos,
      })
    )
    vi.stubGlobal("fetch", fetchMock.fn)
    renderPage(<WhatsAppCatalogosPage />)
    return fetchMock
  }

  it("usa 'produtos' no lugar de 'tecido'", async () => {
    setup()

    expect(await screen.findByRole("heading", { name: "Catalogos WhatsApp" })).toBeInTheDocument()
    expect(screen.getByText("Gerenciar Linhas de Produtos")).toBeInTheDocument()
    expect(screen.queryByText(/tecido/i)).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: /Novo Catalogo/ }))
    expect(await screen.findByText("Linha de Produto *")).toBeInTheDocument()

    fireEvent.click(screen.getByText("Gerenciar Linhas de Produtos"))
    expect(
      await screen.findByText("Cadastre linhas de produtos acima para poder adicionar catalogos.")
    ).toBeInTheDocument()
  })
})
