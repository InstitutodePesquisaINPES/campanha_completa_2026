require('dotenv').config();
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { Readable } = require('stream');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const BATCH_SIZE = Math.max(100, Number.parseInt(process.env.TSE_IMPORT_BATCH_SIZE || '2000', 10));

function stripBom(value) {
  return String(value || '').replace(/^\uFEFF/, '');
}

function normalizeKey(value) {
  return stripBom(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

function clean(value) {
  if (value === undefined || value === null) return null;
  const text = String(value).replace(/^"|"$/g, '').trim();
  if (!text || text === '#NULO#' || text === '#NE#') return null;
  return text;
}

function toInt(value, fallback = null) {
  const text = clean(value);
  if (text === null) return fallback;
  const parsed = Number.parseInt(text.replace(/\D/g, '') || text, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toFloat(value) {
  const text = clean(value);
  if (text === null) return null;
  const parsed = Number.parseFloat(text.replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : null;
}

function splitCsvLine(line) {
  const cols = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ';' && !inQuotes) {
      cols.push(current);
      current = '';
      continue;
    }

    current += char;
  }

  cols.push(current);
  return cols;
}

function makeRow(headers, cols) {
  const row = {};
  headers.forEach((header, index) => {
    row[header] = clean(cols[index]);
  });
  return row;
}

function normalizeFilterValue(value) {
  return clean(value)?.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim() || null;
}

function makeFilterSet(values) {
  if (!Array.isArray(values) || values.length === 0) return null;
  const normalized = values.map(normalizeFilterValue).filter(Boolean);
  return normalized.length > 0 ? new Set(normalized) : null;
}

function matchesMunicipioFilter(record, filterSet) {
  if (!filterSet) return true;
  const codigo = normalizeFilterValue(record.codMunicipioTse);
  const municipio = normalizeFilterValue(record.municipio);
  return Boolean((codigo && filterSet.has(codigo)) || (municipio && filterSet.has(municipio)));
}

function matchesUfFilter(record, defaultUf) {
  if (!defaultUf || defaultUf === 'BR') return true;
  return normalizeFilterValue(record.uf) === normalizeFilterValue(defaultUf);
}

function pick(row, ...keys) {
  const wanted = keys.map(normalizeKey);
  for (const [key, value] of Object.entries(row)) {
    if (wanted.includes(normalizeKey(key))) return value;
  }
  return null;
}

function makeConfig(tipo, tenantId, defaultAno, defaultUf) {
  switch (tipo) {
    case 'eleitorado_perfil':
      return {
        table: 'tseEleitoradoPerfil',
        parse: (row) => {
          const quantidadeEleitores =
            toInt(
              pick(row, 'Quantidade de eleitores', 'QT_ELEITORES_PERFIL', 'QT_ELEITORES'),
              0,
            ) ?? 0;
          return {
            tenantId,
            ano: toInt(pick(row, 'Ano de eleição', 'Ano de eleicao', 'ANO_ELEICAO'), defaultAno),
            uf: clean(pick(row, 'UF', 'SG_UF')) || defaultUf,
            municipio: clean(pick(row, 'Município', 'Municipio', 'NM_MUNICIPIO')),
            regiao: clean(pick(row, 'Região', 'Regiao', 'DS_REGIAO')),
            corRaca: clean(pick(row, 'Cor / Raça', 'Cor/Raça', 'Cor / Raca', 'DS_COR_RACA')),
            estadoCivil: clean(pick(row, 'Estado civil', 'DS_ESTADO_CIVIL')),
            faixaEtaria: clean(pick(row, 'Faixa etária', 'Faixa etaria', 'DS_FAIXA_ETARIA')),
            genero: clean(pick(row, 'Gênero', 'Genero', 'DS_GENERO')),
            grauInstrucao: clean(
              pick(row, 'Grau de instrução', 'Grau de instrucao', 'DS_GRAU_ESCOLARIDADE'),
            ),
            quantidadeEleitores,
          };
        },
      };

    case 'eleitorado':
    case 'perfil_secao':
      return {
        table: 'tseEleitoradoSecao',
        parse: (row) => {
          const codMunicipioTse = clean(
            pick(row, 'CD_MUNICIPIO', 'CD_MUNIC_TSE', 'Código município', 'Codigo municipio'),
          );
          const zona = toInt(pick(row, 'NR_ZONA', 'Zona'), 0);
          const secao = toInt(pick(row, 'NR_SECAO', 'Seção', 'Secao'), 0);
          if (!codMunicipioTse || !zona || !secao) return null;

          return {
            tenantId,
            ano: toInt(pick(row, 'Ano de eleição', 'Ano de eleicao', 'ANO_ELEICAO'), defaultAno),
            uf: clean(pick(row, 'UF', 'SG_UF')) || defaultUf,
            codMunicipioTse,
            municipio: clean(pick(row, 'NM_MUNICIPIO', 'Município', 'Municipio')),
            zona,
            secao,
            codLocalVotacao: clean(pick(row, 'CD_LOCAL_VOTACAO', 'NR_LOCAL_VOTACAO')),
            nomeLocalVotacao: clean(pick(row, 'NM_LOCAL_VOTACAO', 'DS_LOCAL_VOTACAO')),
            corRaca: clean(pick(row, 'DS_COR_RACA', 'Cor / Raça', 'Cor/Raça')),
            estadoCivil: clean(pick(row, 'DS_ESTADO_CIVIL', 'Estado civil')),
            faixaEtaria: clean(pick(row, 'DS_FAIXA_ETARIA', 'Faixa etária', 'Faixa etaria')),
            genero: clean(pick(row, 'DS_GENERO', 'Gênero', 'Genero')),
            grauInstrucao: clean(pick(row, 'DS_GRAU_ESCOLARIDADE', 'Grau de instrução')),
            quantidadeEleitores:
              toInt(pick(row, 'QT_ELEITORES_PERFIL', 'QT_ELEITORES', 'Quantidade de eleitores'), 0) ??
              0,
          };
        },
      };

    case 'candidatos':
      return {
        table: 'tseCandidato',
        parse: (row) => {
          const cargo = clean(pick(row, 'DS_CARGO', 'Cargo', 'CD_CARGO'));
          const numeroUrna = clean(pick(row, 'NR_CANDIDATO', 'Número candidato', 'Numero candidato'));
          if (!cargo || !numeroUrna) return null;

          const situacaoEleicao = clean(pick(row, 'DS_SIT_TOT_TURNO', 'Situação eleição', 'Situacao eleicao'));
          return {
            tenantId,
            ano: toInt(pick(row, 'ANO_ELEICAO', 'Ano de eleição', 'Ano de eleicao'), defaultAno),
            uf: clean(pick(row, 'SG_UF', 'UF')) || defaultUf,
            turno: toInt(pick(row, 'NR_TURNO', 'Turno'), 1) ?? 1,
            cargo,
            numeroUrna,
            nomeUrna: clean(pick(row, 'NM_URNA_CANDIDATO', 'Nome urna')),
            nomeCompleto: clean(pick(row, 'NM_CANDIDATO', 'Nome candidato')),
            cpf: clean(pick(row, 'NR_CPF_CANDIDATO', 'CPF')),
            partidoSigla: clean(pick(row, 'SG_PARTIDO', 'Partido')),
            partidoNumero: clean(pick(row, 'NR_PARTIDO')),
            coligacao: clean(pick(row, 'NM_COLIGACAO')),
            genero: clean(pick(row, 'DS_GENERO', 'Gênero', 'Genero')),
            ocupacao: clean(pick(row, 'DS_OCUPACAO', 'Ocupação', 'Ocupacao')),
            situacaoCandidatura: clean(pick(row, 'DS_SITUACAO_CANDIDATURA')),
            situacaoEleicao,
            eleito: /ELEITO/i.test(situacaoEleicao || ''),
            codMunicipioTse: clean(pick(row, 'SG_UE', 'CD_MUNICIPIO', 'Código município')),
          };
        },
      };

    case 'locais':
    case 'locais_votacao':
      return {
        table: 'tseLocalVotacao',
        parse: (row) => {
          const codMunicipioTse = clean(pick(row, 'CD_MUNICIPIO', 'CD_MUNIC_TSE', 'SG_UE'));
          const codigoLocal = clean(pick(row, 'NR_LOCAL_VOTACAO', 'CD_LOCAL_VOTACAO'));
          const zona = toInt(pick(row, 'NR_ZONA', 'Zona'), 0);
          if (!codMunicipioTse || !codigoLocal) return null;

          return {
            tenantId,
            ano: toInt(pick(row, 'ANO_ELEICAO', 'Ano de eleição', 'Ano de eleicao'), defaultAno),
            uf: clean(pick(row, 'SG_UF', 'UF')) || defaultUf,
            codMunicipioTse,
            codigoLocal,
            nomeLocal: clean(pick(row, 'NM_LOCAL_VOTACAO', 'DS_LOCAL_VOTACAO')),
            endereco: clean(pick(row, 'DS_ENDERECO', 'Endereco')),
            bairro: clean(pick(row, 'NM_BAIRRO', 'Bairro')),
            cep: clean(pick(row, 'NR_CEP', 'CEP')),
            zona: zona ?? 0,
            latitude: toFloat(pick(row, 'NR_LATITUDE', 'Latitude')),
            longitude: toFloat(pick(row, 'NR_LONGITUDE', 'Longitude')),
          };
        },
      };

    case 'resultados':
    case 'votacao_secao':
      return {
        table: 'tseResultadoSecao',
        parse: (row) => {
          const codMunicipioTse = clean(pick(row, 'CD_MUNICIPIO', 'CD_MUNIC_TSE', 'SG_UE'));
          const cargo = clean(pick(row, 'DS_CARGO', 'Cargo'));
          const numeroVotavel = clean(pick(row, 'NR_VOTAVEL', 'Número votável', 'Numero votavel'));
          const zona = toInt(pick(row, 'NR_ZONA', 'Zona'), 0);
          const secao = toInt(pick(row, 'NR_SECAO', 'Seção', 'Secao'), 0);
          if (!codMunicipioTse || !cargo || !numeroVotavel || !zona || !secao) return null;

          return {
            tenantId,
            ano: toInt(pick(row, 'ANO_ELEICAO', 'Ano de eleição', 'Ano de eleicao'), defaultAno),
            uf: clean(pick(row, 'SG_UF', 'UF')) || defaultUf,
            turno: toInt(pick(row, 'NR_TURNO', 'Turno'), 1) ?? 1,
            cargo,
            codMunicipioTse,
            zona,
            secao,
            numeroVotavel,
            partidoSigla: clean(pick(row, 'SG_PARTIDO', 'Partido')),
            votos: toInt(pick(row, 'QT_VOTOS', 'Votos'), 0) ?? 0,
          };
        },
      };

    default:
      return null;
  }
}

function resolveUploadPath(storedPath) {
  const uploadsRoot = path.resolve(process.cwd(), 'uploads');
  const fullPath = path.isAbsolute(storedPath)
    ? path.resolve(storedPath)
    : path.resolve(process.cwd(), String(storedPath || '').replace(/\\/g, '/').replace(/^\.?\//, ''));

  if (fullPath !== uploadsRoot && !fullPath.startsWith(`${uploadsRoot}${path.sep}`)) {
    throw new Error(`Caminho fora de /uploads: ${storedPath}`);
  }

  return fullPath;
}

function readManifest(filePath) {
  if (!filePath.endsWith('.manifest.json')) {
    return null;
  }

  const manifest = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  if (!Array.isArray(manifest.parts) || manifest.parts.length === 0) {
    throw new Error('Manifesto de importação sem partes válidas');
  }

  const parts = manifest.parts.map((part) => {
    const storedPath = typeof part === 'string' ? part : part.path;
    const fullPath = resolveUploadPath(storedPath);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`Parte do upload não encontrada: ${storedPath}`);
    }
    return {
      path: fullPath,
      size: typeof part === 'object' && Number.isFinite(part.size) ? part.size : fs.statSync(fullPath).size,
    };
  });

  return {
    parts,
    totalBytes: Number(manifest.size) || parts.reduce((sum, part) => sum + part.size, 0),
    municipiosFiltro: manifest.municipios_filtro || manifest.municipiosFiltro || null,
  };
}

function openImportInput(filePath) {
  const manifest = readManifest(filePath);

  if (!manifest) {
    const fileStream = fs.createReadStream(filePath, { encoding: 'latin1' });
    return {
      stream: fileStream,
      totalBytes: fs.statSync(filePath).size,
      getBytesRead: () => fileStream.bytesRead,
      municipiosFiltro: null,
    };
  }

  let bytesRead = 0;
  async function* readParts() {
    for (const part of manifest.parts) {
      for await (const chunk of fs.createReadStream(part.path, { encoding: 'latin1' })) {
        bytesRead += Buffer.byteLength(chunk, 'latin1');
        yield chunk;
      }
    }
  }

  return {
    stream: Readable.from(readParts(), { objectMode: false }),
    totalBytes: manifest.totalBytes,
    getBytesRead: () => bytesRead,
    municipiosFiltro: manifest.municipiosFiltro,
  };
}

async function insertBatch(table, data) {
  if (data.length === 0) return 0;

  try {
    const result = await prisma[table].createMany({ data, skipDuplicates: true });
    return result?.count ?? data.length;
  } catch (error) {
    if (data.length <= 1) throw error;
    const middle = Math.ceil(data.length / 2);
    const first = await insertBatch(table, data.slice(0, middle));
    const second = await insertBatch(table, data.slice(middle));
    return first + second;
  }
}

async function safeFail(arquivoId, message) {
  if (!arquivoId) return;
  await prisma.tseCsvArquivo
    .update({
      where: { id: arquivoId },
      data: { status: 'erro', errorMsg: message, finishedAt: new Date() },
    })
    .catch(() => {});
}

async function main() {
  const [arquivoId, tenantId, tipo, filePath, anoArg, ufArg] = process.argv.slice(2);
  const defaultAno = toInt(anoArg, 2024) ?? 2024;
  const defaultUf = clean(ufArg) || 'BR';

  if (!arquivoId || !tenantId || !tipo || !filePath) {
    console.error('Uso: node import-master.js <arquivo_id> <tenant_id> <tipo> <caminho_absoluto> <ano> <uf>');
    process.exit(1);
  }

  const config = makeConfig(tipo, tenantId, defaultAno, defaultUf);
  if (!config) {
    await safeFail(arquivoId, `Tipo de importação desconhecido: ${tipo}`);
    process.exit(1);
  }

  if (!fs.existsSync(filePath)) {
    await safeFail(arquivoId, `Arquivo não encontrado: ${filePath}`);
    process.exit(1);
  }

  const arquivoMeta = await prisma.tseCsvArquivo.findUnique({ where: { id: arquivoId } });
  if (!arquivoMeta) {
    console.error(`Registro TseCsvArquivo não encontrado: ${arquivoId}`);
    process.exit(1);
  }

  await prisma.tseCsvArquivo.update({
    where: { id: arquivoId },
    data: {
      status: 'processando',
      startedAt: arquivoMeta.startedAt || new Date(),
      errorMsg: null,
    },
  });

  const input = openImportInput(filePath);
  const municipioFilter = makeFilterSet(input.municipiosFiltro);
  const totalBytes = input.totalBytes || 1;
  const rl = readline.createInterface({ input: input.stream, crlfDelay: Infinity });
  let headers = null;
  let batch = [];
  let totalProcessado = 0;
  let totalInserido = 0;
  let totalIgnorado = 0;
  let totalFiltrado = 0;

  for await (const line of rl) {
    if (!headers) {
      headers = splitCsvLine(line).map(stripBom);
      continue;
    }

    if (totalProcessado > 0 && totalProcessado % BATCH_SIZE === 0) {
      const check = await prisma.tseCsvArquivo.findUnique({
        where: { id: arquivoId },
        select: { status: true },
      });
      if (!check || ['pausado', 'erro'].includes(check.status)) {
        process.exit(0);
      }

      await prisma.tseCsvArquivo.update({
        where: { id: arquivoId },
        data: {
          progressPct: Math.min(99, Math.round((input.getBytesRead() / totalBytes) * 100)),
          linhasProcessadas: totalProcessado,
        },
      });
    }

    const row = makeRow(headers, splitCsvLine(line));
    const record = config.parse(row);
    totalProcessado++;

    if (!record) {
      totalIgnorado++;
      continue;
    }

    if (!matchesUfFilter(record, defaultUf) || !matchesMunicipioFilter(record, municipioFilter)) {
      totalFiltrado++;
      continue;
    }

    batch.push(record);
    if (batch.length >= BATCH_SIZE) {
      totalInserido += await insertBatch(config.table, batch);
      batch = [];
    }
  }

  if (batch.length > 0) {
    totalInserido += await insertBatch(config.table, batch);
  }

  await prisma.tseCsvArquivo.update({
    where: { id: arquivoId },
    data: {
      status: 'concluido',
      progressPct: 100,
      linhasProcessadas: totalProcessado,
      finishedAt: new Date(),
      errorMsg:
        totalInserido === 0
          ? `Nenhum registro importado. Linhas ignoradas: ${totalIgnorado}. Linhas filtradas: ${totalFiltrado}`
          : null,
    },
  });

  console.log(
    `Concluído ${tipo}: ${totalProcessado} lidos, ${totalInserido} inseridos, ${totalIgnorado} ignorados, ${totalFiltrado} filtrados.`,
  );
}

main()
  .catch(async (e) => {
    console.error('Erro fatal:', e);
    await safeFail(process.argv[2], e.message || String(e));
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
