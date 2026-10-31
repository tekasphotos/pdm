# API Consulta CPF - apicpf.com

## Informações Gerais
- **Base URL**: `https://apicpf.com/api`
- **Autenticação**: Header `X-API-KEY`
- **Chave**: `ecba766f95da8ab8a2b84565f49cfd291cb6647e93062a88378a8b4585b64b14`
- **Plano**: Grátis Basic
- **Expiração**: 01/12/2026

## Limites de Uso
| Período | Limite | Restante |
|---------|--------|----------|
| Por minuto | 6 | 6 |
| Diário | 100 | 100 |

## Endpoint

### GET `/api/consulta`

Consulta dados de uma pessoa física pelo CPF.

#### Parâmetros
| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `cpf` | string | Sim | CPF apenas números (11 dígitos) |

#### Headers
```
X-API-KEY: ecba766f95da8ab8a2b84565f49cfd291cb6647e93062a88378a8b4585b64b14
Content-Type: application/json
```

#### Exemplo de Requisição
```bash
curl -X GET "https://apicpf.com/api/consulta?cpf=12345678901" \
  -H "X-API-KEY: ecba766f95da8ab8a2b84565f49cfd291cb6647e93062a88378a8b4585b64b14"
```

#### Respostas

**Sucesso (200)**
```json
{
  "code": 200,
  "data": {
    "nome": "JOÃO DA SILVA",
    "cpf": "12345678901",
    "data_nascimento": "15/03/1985",
    "nome_mae": "MARIA DA SILVA",
    "sexo": "M",
    "situacao_cadastral": "REGULAR",
    "endereco": {
      "logradouro": "RUA DAS FLORES",
      "numero": "123",
      "complemento": "APTO 45",
      "bairro": "CENTRO",
      "cidade": "SAO PAULO",
      "uf": "SP",
      "cep": "01000000"
    }
  }
}
```

**CPF Inválido (400)**
```json
{
  "code": 400,
  "message": "CPF inválido"
}
```

**Não Encontrado (404)**
```json
{
  "code": 404,
  "message": "Pessoa não encontrada com o CPF informado"
}
```

**Erro de Autenticação (401)**
```json
{
  "code": 401,
  "message": "Chave de API inválida ou expirada"
}
```

**Rate Limit (429)**
```json
{
  "code": 429,
  "message": "Limite de requisições excedido"
}
```

## Integração no Sistema

### Backend - Nova Rota
- **Arquivo**: `src/app/api/crm/consulta-cpf/route.ts`
- **Endpoint**: `GET /api/crm/consulta-cpf?cpf=`
- **Validação**: Remove caracteres não numéricos, valida 11 dígitos
- **Proxy**: Adiciona header `X-API-KEY` e encaminha para `apicpf.com`

### Frontend - Hook useCpfConsulta
- **Arquivo**: `src/hooks/useCpfConsulta.ts`
- **Função**: `consultarCpf(cpf: string)` → retorna dados tipados
- **Formatação**: CPF no padrão `000.000.000-00`
- **Auto-preenchimento**: nome, data_nascimento, nome_mae, sexo, endereço completo

### Cadastros Atualizados
1. **CRM Pessoas** (novo + edição) - Botão "Consultar CPF" ao lado do campo CPF
2. **QuickCreatePessoa** (modal) - Mesma funcionalidade
3. **Outros formulários PF** - Onde houver campo CPF

## Validação de CPF (Client-side)
```typescript
function validarCpf(cpf: string): boolean {
  const digitos = cpf.replace(/\D/g, "");
  if (digitos.length !== 11) return false;
  if (/^(\d)\1+$/.test(digitos)) return false; // todos iguais
  
  // cálculo dos dígitos verificadores
  let soma = 0;
  for (let i = 0; i < 9; i++) soma += parseInt(digitos[i]) * (10 - i);
  let resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(digitos[9])) return false;
  
  soma = 0;
  for (let i = 0; i < 10; i++) soma += parseInt(digitos[i]) * (11 - i);
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(digitos[10])) return false;
  
  return true;
}
```

## Exemplo de Uso no Frontend
```tsx
const { consultar, loading, error } = useCpfConsulta();

async function handleConsultarCpf() {
  const cpfLimpo = form.cpf.replace(/\D/g, "");
  if (!validarCpf(cpfLimpo)) {
    toast.error("CPF inválido");
    return;
  }
  
  const dados = await consultar(cpfLimpo);
  if (dados) {
    setForm(prev => ({
      ...prev,
      nome: dados.nome,
      dataNascimento: dados.data_nascimento,
      nomeMae: dados.nome_mae,
      sexo: dados.sexo,
      endereco: dados.endereco?.logradouro,
      numero: dados.endereco?.numero,
      complemento: dados.endereco?.complemento,
      bairro: dados.endereco?.bairro,
      cidade: dados.endereco?.cidade,
      uf: dados.endereco?.uf,
      cep: dados.endereco?.cep ? formatCep(dados.endereco.cep) : "",
    }));
    toast.success("Dados preenchidos automaticamente");
  }
}
```

## Observações
- A API retorna dados da Receita Federal / bases públicas
- Nem todos os CPFs têm dados (retorna 404)
- Respeitar rate limit: 6 req/min, 100 req/dia
- Chave expira em 01/12/2026 - renovar antes