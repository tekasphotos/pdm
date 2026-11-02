-- Inserir integração de consulta CPF (cpf-brasil.org)
INSERT INTO integracoes (nome, base_url, tipo_auth, auth_config, ativo, created_at, updated_at)
VALUES (
  'consulta_cpf',
  'https://api.cpf-brasil.org',
  'api_key',
  '{"key": "626d0fa350c05a13cb406364124f6843", "key_name": "X-API-Key"}'::jsonb,
  true,
  NOW(),
  NOW()
)
ON CONFLICT (nome) DO UPDATE SET
  base_url = EXCLUDED.base_url,
  tipo_auth = EXCLUDED.tipo_auth,
  auth_config = EXCLUDED.auth_config,
  ativo = EXCLUDED.ativo,
  updated_at = NOW();