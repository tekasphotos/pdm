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

export function useCepAutocomplete<
  T extends Record<string, any>,
  K extends string
>(
  form: T,
  setField: (field: K, value: string) => void
) {
  const setFieldAny = setField as (field: string, value: string) => void
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchCep = useCallback(
    async (cep: string) => {
      const cleanCep = cep.replace(/\D/g, "")
      if (cleanCep.length !== 8) return

      setLoading(true)
      setError(null)

      try {
        const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`)
        if (!res.ok) throw new Error("Erro na consulta")

        const data: CepData = await res.json()

        if (data.erro) {
          setError("CEP não encontrado")
          return
        }

        setFieldAny("endereco", data.logradouro || "")
        setFieldAny("bairro", data.bairro || "")
        setFieldAny("cidade", data.localidade || "")
        setFieldAny("uf", data.uf || "")
        if (data.complemento) {
          setFieldAny("complemento", data.complemento)
        }
      } catch {
        setError("Erro ao consultar CEP")
      } finally {
        setLoading(false)
      }
    },
    [setField]
  )

  const handleCepChange = useCallback(
    (value: string) => {
      setFieldAny("cep", value)
      const cleanCep = value.replace(/\D/g, "")
      if (cleanCep.length === 8) {
        fetchCep(cleanCep)
      }
    },
    [setFieldAny, fetchCep]
  )

  const handleCepBlur = useCallback(
    (value: string) => {
      const cleanCep = value.replace(/\D/g, "")
      if (cleanCep.length === 8) {
        fetchCep(cleanCep)
      }
    },
    [fetchCep]
  )

  return {
    loading,
    error,
    handleCepChange,
    handleCepBlur,
  }
}

export function formatCep(value: string): string {
  const clean = value.replace(/\D/g, "")
  if (clean.length <= 5) return clean
  if (clean.length === 8) {
    return `${clean.slice(0, 2)}.${clean.slice(2, 5)}-${clean.slice(5, 8)}`
  }
  return clean
}