import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const cep = searchParams.get("cep")?.replace(/[^0-9]/g, "") || ""

    if (!cep || cep.length !== 8) {
      return NextResponse.json({ error: "CEP inválido" }, { status: 400 })
    }

    let apiData = null
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`, {
        signal: AbortSignal.timeout(10000),
      })
      if (res.ok) apiData = await res.json()
    } catch (err) {
      console.error("[consulta-cep] erro ao buscar API externa:", err)
    }

    if (apiData?.erro) {
      return NextResponse.json({ apiData: null })
    }

    return NextResponse.json({ apiData })
  } catch (error) {
    console.error("[GET /api/crm/consulta-cep]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}