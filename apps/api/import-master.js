require('dotenv').config();
const fs = require('fs');
const readline = require('readline');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const BATCH_SIZE = 10000;

// node import-master.js <arquivo_id> <tenant_id> <tipo> <caminho_absoluto>
async function main() {
  const args = process.argv.slice(2);
  const arquivoId = args[0];
  const tenantId = args[1];
  const tipo = args[2];
  const filePath = args[3];

  if (!arquivoId || !tenantId || !tipo || !filePath) {
    console.error("Uso: node import-master.js <arquivo_id> <tenant_id> <tipo> <caminho_absoluto>");
    process.exit(1);
  }

  // Load config based on `tipo`
  const getParseFn = (tipoStr) => {
    switch (tipoStr) {
      case 'eleitorado_perfil':
        return {
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
              tenantId, ano, uf, municipio, regiao, corRaca,
              estadoCivil, faixaEtaria, genero, grauInstrucao, quantidadeEleitores
            };
          }
        };
      case 'candidatos':
        return {
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
              tenantId, ano, uf, turno, cargo, numeroUrna,
              nomeCompleto, partidoSigla, genero, ocupacao, situacaoEleicao,
              eleito: situacaoEleicao === 'Eleito', codMunicipioTse
            };
          }
        };
      case 'locais':
      case 'locais_votacao':
        return {
          table: 'tseLocalVotacao',
          parse: (cols) => {
            if (cols.length < 12) return null;
            const cleanCol = (str) => str ? str.replace(/^"|"$/g, '').trim() : '';
            const ano = parseInt(cleanCol(cols[0]), 10);
            const nomeLocal = cleanCol(cols[1]);
            const codMunicipioTse = cleanCol(cols[2]); 
            const uf = cleanCol(cols[5]);
            const zona = parseInt(cleanCol(cols[6]), 10);
            if (isNaN(ano) || isNaN(zona)) return null;
            return {
              tenantId, ano, uf, codMunicipioTse,
              codigoLocal: nomeLocal.substring(0, 50), nomeLocal, zona
            };
          }
        };
      case 'eleitorado':
      case 'perfil_secao':
        return {
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
              tenantId, ano: 2024, uf, codMunicipioTse, municipio, zona, secao,
              codLocalVotacao, nomeLocalVotacao, corRaca, estadoCivil, faixaEtaria, 
              genero, grauInstrucao, quantidadeEleitores
            };
          }
        };
      // Backwards compatibility for votacao_secao
      case 'resultados':
      case 'votacao_secao':
        return {
          table: 'tseResultadoSecao',
          parse: (cols) => {
            if (cols.length < 25) return null;
            const cleanCol = (str) => str ? str.replace(/^"|"$/g, '').trim() : '';
            const ano = parseInt(cleanCol(cols[2]), 10);
            const turno = parseInt(cleanCol(cols[5]), 10);
            const uf = cleanCol(cols[10]);
            const codMunicipioTse = cleanCol(cols[13]);
            const zona = parseInt(cleanCol(cols[15]), 10);
            const secao = parseInt(cleanCol(cols[16]), 10);
            const cargo = cleanCol(cols[18]);
            const numeroVotavel = cleanCol(cols[19]);
            const votos = parseInt(cleanCol(cols[21]), 10);
            if (isNaN(ano) || isNaN(turno) || isNaN(zona) || isNaN(secao) || isNaN(votos)) return null;
            return { tenantId, ano, uf, turno, cargo, codMunicipioTse, zona, secao, numeroVotavel, votos };
          }
        };
      default:
        return null;
    }
  };

  const config = getParseFn(tipo);
  if (!config) {
    console.error(`Tipo de importação desconhecido: ${tipo}`);
    await prisma.tseCsvArquivo.update({ where: { id: arquivoId }, data: { status: 'erro', errorMsg: `Tipo desconhecido: ${tipo}` }});
    process.exit(1);
  }

  if (!fs.existsSync(filePath)) {
    await prisma.tseCsvArquivo.update({ where: { id: arquivoId }, data: { status: 'erro', errorMsg: `Arquivo não encontrado: ${filePath}` }});
    process.exit(1);
  }

  console.log(`\n=== Worker Iniciado: ${tipo} ===`);
  
  // Set startedAt if null
  const arquivoMeta = await prisma.tseCsvArquivo.findUnique({ where: { id: arquivoId }});
  if (!arquivoMeta.startedAt) {
    await prisma.tseCsvArquivo.update({ where: { id: arquivoId }, data: { startedAt: new Date() }});
  }

  const fileStats = fs.statSync(filePath);
  const totalBytes = fileStats.size;

  const fileStream = fs.createReadStream(filePath, { encoding: 'latin1' });
  
  let bytesRead = 0;
  fileStream.on('data', (chunk) => {
    bytesRead += chunk.length;
  });

  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let isFirstLine = true;
  let batch = [];
  let totalProcessado = 0;
  let totalInserido = 0;
  
  for await (const line of rl) {
    // A cada iteracao, checamos se o arquivo nao foi "pausado" ou excluido
    // (Poderia ser um check periodico para nao afetar performance)
    if (totalProcessado % BATCH_SIZE === 0 && totalProcessado > 0) {
      const check = await prisma.tseCsvArquivo.findUnique({ where: { id: arquivoId }, select: { status: true } });
      if (!check || check.status === 'pausado' || check.status === 'erro') {
        console.log(`Worker interrompido. Status atual: ${check?.status}`);
        process.exit(0); // Exit safely, can resume later
      }

      // Update progress
      const pct = Math.min(100, Math.round((bytesRead / totalBytes) * 100));
      await prisma.tseCsvArquivo.update({
        where: { id: arquivoId },
        data: {
          progressPct: pct,
          linhasProcessadas: totalProcessado,
        }
      });
    }

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
      } catch (e) {
        console.error(e.message);
      }
      batch = [];
    }
  }

  // Insert remainder
  if (batch.length > 0) {
    try {
      await prisma[config.table].createMany({
        data: batch,
        skipDuplicates: true,
      });
      totalInserido += batch.length;
    } catch (e) { }
  }

  // Done!
  await prisma.tseCsvArquivo.update({
    where: { id: arquivoId },
    data: {
      status: 'concluido',
      progressPct: 100,
      linhasProcessadas: totalProcessado,
      finishedAt: new Date(),
    }
  });

  console.log(`\nConcluído ${tipo}: ${totalProcessado} processados, ${totalInserido} inseridos/ignorados.`);
}

main()
  .catch(async (e) => {
    console.error("Erro fatal:", e);
    const arquivoId = process.argv[2];
    if (arquivoId) {
       await prisma.tseCsvArquivo.update({
         where: { id: arquivoId },
         data: { status: 'erro', errorMsg: e.message }
       }).catch(() => {});
    }
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
