import { describe, expect, it } from 'vitest'
import { calcularTotalPaginas } from './paginacao'

describe('calcularTotalPaginas', () => {
  it('arredonda para cima quando o total não é múltiplo do tamanho da página', () => {
    expect(calcularTotalPaginas(25, 10)).toBe(3)
  })

  it('retorna 1 quando o total cabe numa única página', () => {
    expect(calcularTotalPaginas(5, 10)).toBe(1)
  })

  it('retorna 0 quando não há itens', () => {
    expect(calcularTotalPaginas(0, 10)).toBe(0)
  })

  it('retorna 0 quando tamanhoPagina é inválido', () => {
    expect(calcularTotalPaginas(10, 0)).toBe(0)
  })
})
