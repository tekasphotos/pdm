"use client"

import { useCallback, useState } from "react"

export interface CepData {
  cep: string
  logradouro: string
  complemento: string
  bairro: string
  localidade: string
  uf: string
  ibge: string
  gia: string
  ddd: string
  siafi: string
  erro?: boolean
}

export function formatCep(value: string): string {
  const clean = value.replace(/\D/g, "")
  if (clean.length <= 5) return clean
  if (clean.length === 8) {
    return `${clean.slice(0, 2)}.${clean.slice(2, 5)}-${clean.slice(5, 8)}`
  }
  return clean
}

export interface UseCepReturn {
  formatCep: (value: string) => string
  cepConsulting: boolean
  cepConsulted: boolean
  cepError: string | null
  cepData: CepData | null
  consultarCep: (cep: string) => Promise<void>
  limparConsulta: () => void
  loading: boolean
  error: string | null
  handleCepChange: (value: string) => void
  handleCepBlur: (value: string) => void
}

export function useCepAutocomplete(
  form?: Record<string, unknown>,
  setField?: (field: string, value: string) => void
): UseCepReturn {
  const [cepConsulting, setCepConsulting] = useState(false)
  const [cepConsulted, setCepConsulted] = useState(false)
  const [cepError, setCepError] = useState<string | null>(null)
  const [cepData, setCepData] = useState<CepData | null>(null)

  const consultarCep = useCallback(async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, "")
    if (cleanCep.length !== 8) {
      return
    }

    setCepConsulting(true)
    setCepError(null)
    setCepData(null)
    setCepConsulted(false)

    try {
      const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`)
      if (!res.ok) throw new Error("Erro na consulta")

      const data: CepData = await res.json()

      if (data.erro) {
        setCepError("CEP não encontrado")
        setCepConsulted(true)
        return
      }

      setCepData(data)
      setCepConsulted(true)

      if (form && setField) {
        setField("cep", formatCep(cleanCep))
        setField("endereco", data.logradouro || "")
        setField("bairro", data.bairro || "")
        setField("cidade", data.localidade || "")
        setField("uf", data.uf || "")
      }
    } catch {
      setCepError("Erro ao consultar CEP")
      setCepConsulted(true)
    } finally {
      setCepConsulting(false)
    }
  }, [form, setField])

  const limparConsulta = useCallback(() => {
    setCepData(null)
    setCepConsulted(false)
    setCepError(null)
  }, [])

  const handleCepChange = useCallback((value: string) => {
    if (form && setField) {
      setField("cep", value)
    }
  }, [form, setField])

  const handleCepBlur = useCallback((value: string) => {
    const cleanCep = value.replace(/\D/g, "")
    if (cleanCep.length === 8) {
      consultarCep(cleanCep)
    }
  }, [consultarCep])

  return {
    formatCep,
    cepConsulting,
    cepConsulted,
    cepError,
    cepData,
    consultarCep,
    limparConsulta,
    loading: cepConsulting,
    error: cepError,
    handleCepChange,
    handleCepBlur,
  }
}