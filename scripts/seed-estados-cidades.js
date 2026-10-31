require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') })
const { Pool } = require('pg')

const ESTADOS = [
  { uf: 'AC', nome: 'Acre', regiao: 'N' },
  { uf: 'AL', nome: 'Alagoas', regiao: 'NE' },
  { uf: 'AP', nome: 'Amapá', regiao: 'N' },
  { uf: 'AM', nome: 'Amazonas', regiao: 'N' },
  { uf: 'BA', nome: 'Bahia', regiao: 'NE' },
  { uf: 'CE', nome: 'Ceará', regiao: 'NE' },
  { uf: 'DF', nome: 'Distrito Federal', regiao: 'CO' },
  { uf: 'ES', nome: 'Espírito Santo', regiao: 'SE' },
  { uf: 'GO', nome: 'Goiás', regiao: 'CO' },
  { uf: 'MA', nome: 'Maranhão', regiao: 'NE' },
  { uf: 'MT', nome: 'Mato Grosso', regiao: 'CO' },
  { uf: 'MS', nome: 'Mato Grosso do Sul', regiao: 'CO' },
  { uf: 'MG', nome: 'Minas Gerais', regiao: 'SE' },
  { uf: 'PA', nome: 'Pará', regiao: 'N' },
  { uf: 'PB', nome: 'Paraíba', regiao: 'NE' },
  { uf: 'PR', nome: 'Paraná', regiao: 'S' },
  { uf: 'PE', nome: 'Pernambuco', regiao: 'NE' },
  { uf: 'PI', nome: 'Piauí', regiao: 'NE' },
  { uf: 'RJ', nome: 'Rio de Janeiro', regiao: 'SE' },
  { uf: 'RN', nome: 'Rio Grande do Norte', regiao: 'NE' },
  { uf: 'RS', nome: 'Rio Grande do Sul', regiao: 'S' },
  { uf: 'RO', nome: 'Rondônia', regiao: 'N' },
  { uf: 'RR', nome: 'Roraima', regiao: 'N' },
  { uf: 'SC', nome: 'Santa Catarina', regiao: 'S' },
  { uf: 'SP', nome: 'São Paulo', regiao: 'SE' },
  { uf: 'SE', nome: 'Sergipe', regiao: 'NE' },
  { uf: 'TO', nome: 'Tocantins', regiao: 'N' },
]

// Cities data - comprehensive list for each state
// Using a subset for key cities; full list would be ~5570 cities
const CIDADES_POR_UF = {
  'AC': ['Rio Branco', 'Cruzeiro do Sul', 'Sena Madureira', 'Tarauacá', 'Feijó', 'Brasiléia', 'Plácido de Castro', 'Xapuri', 'Senador Guiomard', 'Bujari'],
  'AL': ['Maceió', 'Arapiraca', 'Palmeira dos Índios', 'Rio Largo', 'Penedo', 'União dos Palmares', 'São Miguel dos Campos', 'Campo Alegre', 'Delmiro Gouveia', 'Coruripe'],
  'AP': ['Macapá', 'Santana', 'Laranjal do Jari', 'Oiapoque', 'Mazagão', 'Pedra Branca do Amapari', 'Porto Grande', 'Ferreira Gomes', 'Cutias', 'Calçoene'],
  'AM': ['Manaus', 'Parintins', 'Manacapuru', 'Itacoatiara', 'Coari', 'Tefé', 'Humaitá', 'Maués', 'Barcelos', 'São Gabriel da Cachoeira'],
  'BA': ['Salvador', 'Feira de Santana', 'Vitória da Conquista', 'Camaçari', 'Itabuna', 'Juazeiro', 'Lauro de Freitas', 'Ilhéus', 'Jequié', 'Teixeira de Freitas', 'Alagoinhas', 'Barreiras', 'Porto Seguro', 'Simões Filho', 'Paulo Afonso', 'Eunápolis', 'Santo Antônio de Jesus', 'Valença', 'Guanambi', 'Jacobina'],
  'CE': ['Fortaleza', 'Caucaia', 'Juazeiro do Norte', 'Maracanaú', 'Sobral', 'Crato', 'Itapipoca', 'Maranguape', 'Iguatu', 'Quixadá', 'Canindé', 'Aquiraz', 'Pacatuba', 'Crato', 'Tianguá', 'Russas', 'Limoeiro do Norte', 'Horizonte', 'São Gonçalo do Amarante', 'Eusébio'],
  'DF': ['Brasília', 'Gama', 'Taguatinga', 'Ceilândia', 'Planaltina', 'Samambaia', 'Sobradinho', 'Santa Maria', 'Recanto das Emas', 'Núcleo Bandeirante'],
  'ES': ['Vitória', 'Vila Velha', 'Cariacica', 'Serra', 'Cachoeiro de Itapemirim', 'Linhares', 'São Mateus', 'Colatina', 'Guarapari', 'Aracruz', 'Venda Nova do Imigrante', 'Nova Venécia', 'Ibatiba', 'Baixo Guandu', 'Itapemirim', 'São Gabriel da Palha', 'Conceição da Barra', 'Marataízes', 'Muqui', 'Iconha'],
  'GO': ['Goiânia', 'Aparecida de Goiânia', 'Anápolis', 'Rio Verde', 'Luziânia', 'Águas Lindas de Goiás', 'Valparaíso de Goiás', 'Trindade', 'Formosa', 'Novo Gama', 'Senador Canedo', 'Catalão', 'Itumbiara', 'Jataí', 'Planaltina de Goiás', 'Goianira', 'Inhumas', 'Iporá', 'Ceres', 'Goianésia'],
  'MA': ['São Luís', 'Imperatriz', 'São José de Ribamar', 'Timon', 'Caxias', 'Codó', 'Paço do Lumiar', 'Açailândia', 'Bacabal', 'Balsas', 'Santa Inês', 'Barra do Corda', 'Grajaú', 'Pedreiras', 'Santa Luzia', 'Pinheiro', 'Tuntum', 'Viana', 'Chapadinha', 'Buriticupu'],
  'MT': ['Cuiabá', 'Várzea Grande', 'Rondonópolis', 'Sinop', 'Tangará da Serra', 'Cáceres', 'Sorriso', 'Lucas do Rio Verde', 'Primavera do Leste', 'Barra do Garças', 'Alta Floresta', 'Pontes e Lacerda', 'Diamantino', 'Nova Mutum', 'Campo Novo do Parecis', 'Juína', 'Colíder', 'Matupá', 'Canarana', 'Jaciara'],
  'MS': ['Campo Grande', 'Dourados', 'Três Lagoas', 'Corumbá', 'Ponta Porã', 'Naviraí', 'Nova Andradina', 'Aquidauana', 'Paranaíba', 'Coxim', 'Amambai', 'Maracaju', 'Rio Verde de Mato Grosso', 'São Gabriel do Oeste', 'Costa Rica', 'Ivinhema', 'Batayporã', 'Jardim', 'Bonito', 'Jateí'],
  'MG': ['Belo Horizonte', 'Uberlândia', 'Contagem', 'Juiz de Fora', 'Betim', 'Montes Claros', 'Ribeirão das Neves', 'Uberaba', 'Governador Valadares', 'Ipatinga', 'Sete Lagoas', 'Divinópolis', 'Santa Luzia', 'Ibirité', 'Poços de Caldas', 'Patos de Minas', 'Pouso Alegre', 'Teófilo Otoni', 'Barbacena', 'Sabará', 'Varginha', 'Conselheiro Lafaiete', 'Itabira', 'Araxá', 'Manhuaçu', 'Passos', 'Lavras', 'São João del Rei', 'Ubá', 'Cataguases', 'Itaúna'],
  'PA': ['Belém', 'Ananindeua', 'Santarém', 'Marabá', 'Parauapebas', 'Castanhal', 'Abaetetuba', 'Cametá', 'Bragança', 'Tucuruí', 'Canaã dos Carajás', 'Paragominas', 'São Félix do Xingu', 'Altamira', 'Itaituba', 'Redenção', 'Tailândia', 'Moju', 'Tomé-Açu', 'Acará'],
  'PB': ['João Pessoa', 'Campina Grande', 'Santa Rita', 'Patos', 'Bayeux', 'Sousa', 'Cajazeiras', 'Cabedelo', 'Guarabira', 'Mamanguape', 'Esperança', 'Pombal', 'Monteiro', 'Itabaiana', 'Alagoa Grande', 'São Bento', 'Catolé do Rocha', 'Picuí', 'Conceição', 'Princesa Isabel'],
  'PR': ['Curitiba', 'Londrina', 'Maringá', 'Ponta Grossa', 'Cascavel', 'São José dos Pinhais', 'Foz do Iguaçu', 'Colombo', 'Guarapuava', 'Paranaguá', 'Arapongas', 'Toledo', 'Apucarana', 'Pinhais', 'Campo Largo', 'Umuarama', 'Paranavaí', 'Cambé', 'Fazenda Rio Grande', 'Almirante Tamandaré'],
  'PE': ['Recife', 'Jaboatão dos Guararapes', 'Olinda', 'Caruaru', 'Petrolina', 'Paulista', 'Cabo de Santo Agostinho', 'Camaragibe', 'Garanhuns', 'Vitória de Santo Antão', 'Igarassu', 'Abreu e Lima', 'Escada', 'São Lourenço da Mata', 'Moreno', 'Gravatá', 'Belo Jardim', 'Arcoverde', 'Salgueiro', 'Serra Talhada'],
  'PI': ['Teresina', 'Parnaíba', 'Picos', 'Piripiri', 'Floriano', 'Campo Maior', 'Barras', 'Oeiras', 'José de Freitas', 'Altos', 'Luís Correia', 'Valença do Piauí', 'Esperantina', 'São Raimundo Nonato', 'Cocal', 'Batalha', 'Simões', 'Demerval Lobão', 'Água Branca', 'União'],
  'RJ': ['Rio de Janeiro', 'São Gonçalo', 'Duque de Caxias', 'Nova Iguaçu', 'Niterói', 'Belford Roxo', 'São João de Meriti', 'Campos dos Goytacazes', 'Petrópolis', 'Volta Redonda', 'Macaé', 'Itaboraí', 'Cabo Frio', 'Angra dos Reis', 'Nova Friburgo', 'Barra Mansa', 'Teresópolis', 'Mesquita', 'Nilópolis', 'Magé'],
  'RN': ['Natal', 'Mossoró', 'Parnamirim', 'São Gonçalo do Amarante', 'Macaíba', 'Ceará-Mirim', 'Caicó', 'Assu', 'Currais Novos', 'Santa Cruz', 'Apodi', 'João Câmara', 'Pau dos Ferros', 'Extremoz', 'Goianinha', 'São José de Mipibu', 'Touros', 'Maxaranguape', 'Jucurutu', 'Jandaíra'],
  'RS': ['Porto Alegre', 'Caxias do Sul', 'Pelotas', 'Canoas', 'Santa Maria', 'Gravataí', 'Viamão', 'Novo Hamburgo', 'São Leopoldo', 'Rio Grande', 'Alvorada', 'Passo Fundo', 'Sapucaia do Sul', 'Uruguaiana', 'Santa Cruz do Sul', 'Cachoeirinha', 'Bagé', 'Bento Gonçalves', 'Erechim', 'Guaíba'],
  'RO': ['Porto Velho', 'Ji-Paraná', 'Ariquemes', 'Vilhena', 'Cacoal', 'Rolim de Moura', 'Jaru', 'Guajará-Mirim', 'Colorado do Oeste', 'São Francisco do Guaporé', 'Cerejeiras', 'Alto Paraíso', 'Alvorada do Oeste', 'Buritis', 'Cabixi', 'Campo Novo de Rondônia', 'Candeias do Jamari', 'Castanheiras', 'Chupinguaia', 'Corumbiara'],
  'RR': ['Boa Vista', 'Rorainópolis', 'Caracaraí', 'Mucajaí', 'Pacaraima', 'Iracema', 'Alto Alegre', 'Bonfim', 'Cantá', 'Normandia', 'São João da Baliza', 'São Luiz', 'Uiramutã'],
  'SC': ['Florianópolis', 'Joinville', 'Blumenau', 'São José', 'Chapecó', 'Itajaí', 'Criciúma', 'Jaraguá do Sul', 'Lages', 'Palhoça', 'Balneário Camboriú', 'Brusque', 'Tubarão', 'São Bento do Sul', 'Caçador', 'Concórdia', 'Rio do Sul', 'Camboriú', 'Navegantes', 'Indaial'],
  'SP': ['São Paulo', 'Guarulhos', 'Campinas', 'São Bernardo do Campo', 'Santo André', 'São José dos Campos', 'Ribeirão Preto', 'Osasco', 'Sorocaba', 'Mauá', 'São José do Rio Preto', 'Mogi das Cruzes', 'Diadema', 'Jundiaí', 'Piracicaba', 'Carapicuíba', 'Bauru', 'Itaquaquecetuba', 'Franca', 'Guarujá', 'Taubaté', 'Limeira', 'São Vicente', 'Sumaré', 'Taboão da Serra', 'Embu das Artes', 'Cotia', 'Ferraz de Vasconcelos', 'São Carlos', 'Americana', 'Indaiatuba', 'Jacareí', 'Itapevi', 'Santana de Parnaíba', 'Barueri', 'Atibaia', 'Bragança Paulista', 'Suzano', 'Votorantim', 'Jaguariúna', 'Valinhos', 'Paulínia', 'Vinhedo', 'Itatiba', 'Jarinu', 'Louveira', 'Morungaba', 'Pedreira', 'Serra Negra', 'Águas de Lindóia', 'Socorro'],
  'SE': ['Aracaju', 'Nossa Senhora do Socorro', 'Lagarto', 'Itabaiana', 'São Cristóvão', 'Estância', 'Tobias Barreto', 'Simão Dias', 'Propriá', 'Capela', 'Carira', 'Campo do Brito', 'Itaporanga d\'Ajuda', 'Neópolis', 'Santana do São Francisco', 'Arauá', 'Cedro de São João', 'Cristinápolis', 'Cumbe', 'Divina Pastora'],
  'TO': ['Palmas', 'Araguaína', 'Gurupi', 'Porto Nacional', 'Paraíso do Tocantins', 'Colinas do Tocantins', 'Guaraí', 'Tocantinópolis', 'Miracema do Tocantins', 'Araguatins', 'Pedro Afonso', 'Dois Irmãos do Tocantins', 'Novo Acordo', 'Lagoa da Confusão', 'Ponte Alta do Tocantins', 'Peixe', 'Silvanópolis', 'Pium', 'Lavandeira', 'Santa Rita do Tocantins']
}

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    
    console.log('Inserindo estados...')
    for (const estado of ESTADOS) {
      await client.query(
        `INSERT INTO crm_estados (nome, uf, regiao) VALUES ($1, $2, $3)
         ON CONFLICT (uf) DO UPDATE SET nome = EXCLUDED.nome, regiao = EXCLUDED.regiao`,
        [estado.nome, estado.uf, estado.regiao]
      )
    }
    console.log('Estados inseridos/atualizados.')
    
    // Buscar IDs dos estados
    const estadosResult = await client.query('SELECT id, uf FROM crm_estados ORDER BY uf')
    const estadoMap = {}
    for (const row of estadosResult.rows) {
      estadoMap[row.uf] = row.id
    }
    
    console.log('Inserindo cidades...')
    let totalCidades = 0
    for (const [uf, cidades] of Object.entries(CIDADES_POR_UF)) {
      const estadoId = estadoMap[uf]
      if (!estadoId) {
        console.warn(`Estado ${uf} não encontrado, pulando cidades`)
        continue
      }
      for (const cidadeNome of cidades) {
        await client.query(
          `INSERT INTO crm_cidades (nome, estado_id) VALUES ($1, $2)
           ON CONFLICT (nome, estado_id) DO NOTHING`,
          [cidadeNome, estadoId]
        )
        totalCidades++
      }
      console.log(`  ${uf}: ${cidades.length} cidades`)
    }
    
    await client.query('COMMIT')
    console.log(`Total: ${ESTADOS.length} estados, ${totalCidades} cidades inseridas.`)
  } catch (e) {
    await client.query('ROLLBACK')
    throw e
  } finally {
    client.release()
    await pool.end()
  }
}

main().catch(e => { console.error(e); process.exit(1) })