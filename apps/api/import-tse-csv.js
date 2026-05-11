require('dotenv').config();
const fs = require('fs');
const readline = require('readline');

// Force raw PostgreSQL URL directly against the Docker DB instance to bypass proxy timeouts
process.env.DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/kiribamba?schema=public";

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const CSV_PATH = "C:\\Users\\Unex\\Downloads\\votacao_secao_2024_BA\\votacao_secao_2024_BA.csv";
const BATCH_SIZE = 10000;

async function main() {
  console.log(`Iniciando leitura do arquivo: ${CSV_PATH}`);
  
  const fileStream = fs.createReadStream(CSV_PATH, { encoding: 'latin1' }); // TSE defaults to latin1 usually
  
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let isFirstLine = true;
  let batch = [];
  let totalProcessado = 0;
  let totalInserido = 0;
  
  for await (const line of rl) {
    if (isFirstLine) {
      isFirstLine = false;
      continue; // Skip header
    }

    const cols = line.split(';');
    if (cols.length < 25) continue; // Skip malformed lines

    const cleanCol = (str) => {
      if (!str) return '';
      return str.replace(/^"|"$/g, '').trim();
    };

    const ano = parseInt(cleanCol(cols[2]), 10);
    const turno = parseInt(cleanCol(cols[5]), 10);
    const uf = cleanCol(cols[10]);
    const codMunicipioTse = cleanCol(cols[13]);
    const zona = parseInt(cleanCol(cols[15]), 10);
    const secao = parseInt(cleanCol(cols[16]), 10);
    const cargo = cleanCol(cols[18]);
    const numeroVotavel = cleanCol(cols[19]);
    const votos = parseInt(cleanCol(cols[21]), 10);

    if (isNaN(ano) || isNaN(turno) || isNaN(zona) || isNaN(secao) || isNaN(votos)) {
        continue;
    }

    batch.push({
      ano,
      uf,
      turno,
      cargo,
      codMunicipioTse,
      zona,
      secao,
      numeroVotavel,
      votos,
      tenantId: 'bd4ef41d-b2ea-451a-9428-e9e7ad1be480' // Master tenant from DB
    });

    totalProcessado++;

    if (batch.length >= BATCH_SIZE) {
      try {
        await prisma.tseResultadoSecao.createMany({
          data: batch,
          skipDuplicates: true,
        });
        totalInserido += batch.length;
        process.stdout.write(`\rProcessados: ${totalProcessado} | Inseridos (ou ignorados por duplicidade): ${totalInserido}`);
      } catch (e) {
        console.error(`\nErro ao inserir lote:`, e.message);
      }
      batch = [];
    }
  }

  // Insert remaining
  if (batch.length > 0) {
    try {
      await prisma.tseResultadoSecao.createMany({
        data: batch,
        skipDuplicates: true,
      });
      totalInserido += batch.length;
    } catch (e) {
      console.error(`\nErro ao inserir lote final:`, e.message);
    }
  }

  console.log(`\n\n=== IMPORTAÇÃO CONCLUÍDA ===`);
  console.log(`Total de Linhas Processadas: ${totalProcessado}`);
  console.log(`Total de Lotes Enviados: ${totalInserido}`);
}

main()
  .catch((e) => {
    console.error("Erro fatal:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
