require('dotenv').config();
const fs = require('fs');
const readline = require('readline');
const { PrismaClient } = require('@prisma/client');
process.env.DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/kiribamba?schema=public";
const prisma = new PrismaClient();

async function run() {
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE tse_eleitorado_perfil CASCADE`);
  console.log("Tabela tse_eleitorado_perfil limpa com sucesso.");
  await prisma.$disconnect();
}
// run();

const BATCH_SIZE = 10000;
const TENANT_ID = 'bd4ef41d-b2ea-451a-9428-e9e7ad1be480';

// Configuration for each CSV type based on the files provided
const IMPORT_CONFIGS = {
  eleitorado_perfil: {
    path: "C:\\Users\\Unex\\Downloads\\eleitorado_eleicao.csv (1)-20260511T164138Z-3-001\\eleitorado_eleicao.csv (1)\\eleitorado_eleicao.csv",
    table: 'tseEleitoradoPerfil',
    parse: (cols) => {
      if (cols.length < 14) return null;
      const cleanCol = (str) => str ? str.replace(/^"|"$/g, '').trim() : '';
      
      const ano = parseInt(cleanCol(cols[0]), 10);
      const corRaca = cleanCol(cols[1]);
      const estadoCivil = cleanCol(cols[2]);
      const faixaEtaria = cleanCol(cols[3]);
      const genero = cleanCol(cols[4]);
      const grauInstrucao = cleanCol(cols[5]);
      const municipio = cleanCol(cols[8]);
      const regiao = cleanCol(cols[11]);
      const uf = cleanCol(cols[12]);
      const quantidadeEleitores = parseInt(cleanCol(cols[13]), 10);

      if (isNaN(ano) || isNaN(quantidadeEleitores)) return null;

      return {
        tenantId: TENANT_ID, ano, uf, municipio, regiao, corRaca,
        estadoCivil, faixaEtaria, genero, grauInstrucao, quantidadeEleitores
      };
    }
  },
  candidatos: {
    path: "C:\\Users\\Unex\\Downloads\\votacao_candidato.csv\\votacao_candidato.csv",
    table: 'tseCandidato',
    parse: (cols) => {
      if (cols.length < 20) return null;
      const cleanCol = (str) => str ? str.replace(/^"|"$/g, '').trim() : '';
      
      const ano = parseInt(cleanCol(cols[0]), 10);
      const genero = cleanCol(cols[4]);
      const ocupacao = cleanCol(cols[13]);
      const uf = cleanCol(cols[8]);
      const cargo = cleanCol(cols[9]);
      const codMunicipioTse = cleanCol(cols[10]);
      const nomeCompleto = cleanCol(cols[11]);
      const numeroUrna = cleanCol(cols[12]);
      const partidoSigla = cleanCol(cols[14]);
      const situacaoEleicao = cleanCol(cols[15]);
      const turno = parseInt(cleanCol(cols[16]), 10);

      if (isNaN(ano) || isNaN(turno) || !cargo || !numeroUrna) return null;

      return {
        tenantId: TENANT_ID, ano, uf, turno, cargo, numeroUrna,
        nomeCompleto, partidoSigla, genero, ocupacao, situacaoEleicao,
        eleito: situacaoEleicao === 'Eleito',
        codMunicipioTse
      };
    }
  },
  locais_votacao: {
    path: "C:\\Users\\Unex\\Downloads\\eleitorado_eleicao_capilaridade.csv\\eleitorado_eleicao_capilaridade.csv",
    table: 'tseLocalVotacao',
    parse: (cols) => {
      if (cols.length < 12) return null;
      const cleanCol = (str) => str ? str.replace(/^"|"$/g, '').trim() : '';
      
      const ano = parseInt(cleanCol(cols[0]), 10);
      const nomeLocal = cleanCol(cols[1]);
      // Note: Capilaridade CSV lacks cod_municipio_tse, we will use the municipality name as a fallback or leave it blank if not strictly needed for unique constraint, but schema requires it. Let's map Municipio to it for now or generate a placeholder.
      const codMunicipioTse = cleanCol(cols[2]); // Using name as fallback since real code is missing
      const uf = cleanCol(cols[5]);
      const zona = parseInt(cleanCol(cols[6]), 10);

      if (isNaN(ano) || isNaN(zona)) return null;

      return {
        tenantId: TENANT_ID, ano, uf, codMunicipioTse,
        codigoLocal: nomeLocal.substring(0, 50), // Fallback since actual code isn't in this CSV
        nomeLocal, zona
      };
    }
  },
  perfil_secao: {
    path: "C:\\Users\\Unex\\Downloads\\perfil_eleitor_secao_ATUAL_BA-20260511T164217Z-3-001\\perfil_eleitor_secao_ATUAL_BA\\perfil_eleitor_secao_ATUAL_BA.csv",
    table: 'tseEleitoradoSecao',
    parse: (cols) => {
      if (cols.length < 28) return null;
      const cleanCol = (str) => str ? str.replace(/^"|"$/g, '').trim() : '';
      
      const ano = parseInt(cleanCol(cols[2]), 10);
      const uf = cleanCol(cols[3]);
      const codMunicipioTse = cleanCol(cols[4]);
      const municipio = cleanCol(cols[5]);
      const zona = parseInt(cleanCol(cols[6]), 10);
      const secao = parseInt(cleanCol(cols[7]), 10);
      const codLocalVotacao = cleanCol(cols[8]);
      const nomeLocalVotacao = cleanCol(cols[9]);
      const genero = cleanCol(cols[11]);
      const estadoCivil = cleanCol(cols[13]);
      const faixaEtaria = cleanCol(cols[15]);
      const grauInstrucao = cleanCol(cols[17]);
      const corRaca = cleanCol(cols[19]);
      const quantidadeEleitores = parseInt(cleanCol(cols[27]), 10);

      if (isNaN(ano) || isNaN(zona) || isNaN(secao) || isNaN(quantidadeEleitores)) return null;

      return {
        tenantId: TENANT_ID, 
        ano: 2024, // Forcing 2024 if it's generic, but schema allows dynamic
        uf, 
        codMunicipioTse, 
        municipio,
        zona,
        secao,
        codLocalVotacao,
        nomeLocalVotacao,
        corRaca,
        estadoCivil, 
        faixaEtaria, 
        genero, 
        grauInstrucao, 
        quantidadeEleitores
      };
    }
  }
};

async function processFile(configKey) {
  const config = IMPORT_CONFIGS[configKey];
  if (!config) throw new Error("Invalid config");
  
  console.log(`\n=== Iniciando importação: ${configKey} ===`);
  console.log(`Arquivo: ${config.path}`);
  console.log(`Tabela Destino: ${config.table}`);
  
  const fileStream = fs.createReadStream(config.path, { encoding: 'latin1' });
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let isFirstLine = true;
  let batch = [];
  let totalProcessado = 0;
  let totalInserido = 0;
  
  for await (const line of rl) {
    if (isFirstLine) { isFirstLine = false; continue; }

    const cols = line.split(';');
    const record = config.parse(cols);
    
    if (record) {
      batch.push(record);
    }
    
    totalProcessado++;

    if (batch.length >= BATCH_SIZE) {
      try {
        await prisma[config.table].createMany({
          data: batch,
          skipDuplicates: true,
        });
        totalInserido += batch.length;
        process.stdout.write(`\rProcessados: ${totalProcessado} | Inseridos (skip duplicates): ${totalInserido}`);
      } catch (e) {
        // Skip silent or log minimal
      }
      batch = [];
    }
  }

  if (batch.length > 0) {
    try {
      await prisma[config.table].createMany({
        data: batch,
        skipDuplicates: true,
      });
      totalInserido += batch.length;
    } catch (e) { }
  }

  console.log(`\nConcluído ${configKey}: ${totalProcessado} processados, ${totalInserido} inseridos/ignorados.`);
}

async function main() {
  const args = process.argv.slice(2);
  const target = args[0];

  if (target && IMPORT_CONFIGS[target]) {
    await processFile(target);
  } else {
    console.log("Por favor, especifique qual arquivo importar:");
    console.log("node import-master.js [eleitorado_perfil | candidatos | locais_votacao | perfil_secao]");
  }
}

main()
  .catch((e) => {
    console.error("Erro fatal:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
