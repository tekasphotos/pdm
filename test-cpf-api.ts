// test-cpf-api.ts
async function testApis() {
  const cpf = "31535200898";
  
  const apis = [
    `https://api.cpfcnpj.com.br/consulta/cpf/${cpf}`,
    `https://brasilapi.com.br/api/cpf/v1/${cpf}`,
  ];

  for (const url of apis) {
    try {
      console.log(`\n=== Testando: ${url} ===`);
      const res = await fetch(url);
      console.log(`Status: ${res.status} ${res.statusText}`);
      
      if (res.ok) {
        const data = await res.json();
        console.log("Resposta:", JSON.stringify(data, null, 2));
      } else {
        const text = await res.text();
        console.log("Erro:", text);
      }
    } catch (e) {
      console.log("Erro de rede:", e);
    }
  }
}

testApis();