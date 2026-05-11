# IA, RAG, Prompts e Automações

O sistema utiliza Inteligência Artificial para aumentar o poder estratégico da equipe de campanha sem expô-los a riscos de alucinação política.

## 1. Casos de Uso Aprovados
- **Análise de Sentimento e Extração de Dores:** Ler textos de demandas (ouvidoria) e classificar categorias (ex: "Problema no asfalto", "Falta de médico").
- **Sugestão de Discurso:** Gerar um *Draft* de roteiro para o candidato fazer um vídeo ou subir num palanque baseado no "Mapa de Dores" do Bairro selecionado.

## 2. Política Anti-Alucinação (CRÍTICA)
Ao passar contexto para a IA gerar discursos ou análises:
- A IA **NUNCA** deve inventar números de votos, metas, nomes de adversários ou estatísticas que não constem no prompt fornecido.
- A IA não deve prometer obras públicas. Deve focar em "entender e buscar soluções".
- **Comando de Fallback Obrigatório no System Prompt:** "Caso o contexto fornecido não contenha informações suficientes sobre o bairro X, responda EXATAMENTE 'Não possuímos dados suficientes mapeados na ouvidoria para este bairro ainda'."

## 3. Implementação RAG (Retrieval-Augmented Generation)
- **Técnica:** O backend buscará no PostgreSQL os registros de `Demanda` resolvidos/abertos do `municipioId/bairroId`, limitando os últimos 50.
- Agrupará esses textos e injetará num JSON como `CONTEXTO` para a API da OpenAI.
- **Chunking:** A princípio não utilizaremos Vector Database (Pinecone), apenas SQL Filters, pois a volumetria de texto de ouvidoria de uma única campanha pode ser acomodada na janela de contexto de 128k do GPT-4o-mini/Claude 3.5.

## 4. Limites de Token e Custos
- Usar preferencialmente modelos baratos e velozes (GPT-4o-mini) para tarefas diárias (classificar ouvidoria).
- Tarefas pesadas (Draft de Plano de Governo baseado em 10.000 chamados) devem alertar o usuário de que demorará e usar chamadas assíncronas no NestJS.
