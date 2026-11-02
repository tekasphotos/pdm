-- Inserir integração de consulta CPF
INSERT INTO integracoes (nome, base_url, tipo_auth, auth_config, ativo, created_at, updated_at)
VALUES (
  'consulta_cpf',
  'https://apicpf.com/api',
  'api_key',
  '{"key": "ecba766f95da8ab8a2b84565f49cfd291cb6647e93062a88378a8b4585b64b14", "key_name": "X-API-KEY"}'::jsonb,
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