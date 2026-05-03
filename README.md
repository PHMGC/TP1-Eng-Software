# WastedHours

## Membros do Grupo e Papéis
*	**Membro 1**: Pedro Henrique Moreira Guimarães Cortez - Fullstack
*	**Membro 2**: Caio Henrique de Miranda Onofre - Fullstack
*	**Membro 3**: Caio César Moraes Costa - Fullstack
*	**Membro 4**: Lucas de Oliveira Ferreira - Fullstack

## Objetivo do Sistema
O WastedHours é uma plataforma web voltada para a curadoria, catalogação e avaliação de jogos eletrônicos. Embora adote o tempo de jogo como tema, o objetivo central do sistema é fornecer um ecossistema completo de avaliações guiado por múltiplas métricas de engajamento e satisfação. Usuários podem registrar seu progresso, catalogar títulos, atribuir notas, escrever análises e visualizar rankings baseados na recepção geral da comunidade. A plataforma busca resolver o problema de encontrar recomendações legítimas através de avaliações reais e multifacetadas.

## Tecnologias
*	**Linguagem**: Python
*	**Framework Backend**: Flask
* 	**Banco de Dados**: SQLite (local development)
* 	**Linguagem Frontend**: JavaScript / React
* 	**Frontend Build**: Vite
* 	**Agentes de IA**: Copilot (Gemini e GPT)

## Como executar localmente
### Backend
1. Abra um terminal em `backend`
2. Crie e ative um ambiente virtual Python
   - Windows PowerShell:
     ```powershell
     python -m venv .venv
     .\.venv\Scripts\Activate.ps1
     ```
3. Instale as dependências:
   ```powershell
   pip install -r requirements.txt
   ```
4. Execute o backend:
   ```powershell
   python app.py
   ```
5. A API estará disponível em `http://127.0.0.1:5000`

### Frontend
1. Abra um terminal em `frontend`
2. Instale dependências npm:
   ```powershell
   npm install
   ```
3. Execute o frontend:
   ```powershell
   npm run dev
   ```
4. O site será servido por padrão em `http://localhost:5173`

> Observação: o backend usa um banco de dados SQLite local (`backend/games.db`) para desenvolvimento.

## Histórias de Usuário
1.	Como jogador, quero criar uma conta para manter um histórico pessoal dos jogos que possuo.
2.	Como usuário, quero buscar jogos pelo título para verificar as avaliações e diversas métricas de engajamento da comunidade.
3.	Como jogador, quero registrar as minhas métricas (quantidade de horas jogadas, minha avaliação (nota)) em um título específico para atualizar meu perfil.
4.	Como colecionador, quero adicionar jogos a uma "Lista de Desejos" para planejar futuras aquisições.
5.	Como usuário, quero visualizar rankings globais de jogos baseados nas melhores avaliações e métricas de popularidade para descobrir novos títulos.
6.	Como crítico, quero escrever análises detalhadas sobre minha experiência com um jogo para compartilhar minha opinião.
7.	Como usuário, quero filtrar jogos por gênero para encontrar novos títulos dentro do meu interesse.
8.	Como administrador, quero cadastrar novos jogos na base de dados para manter o catálogo atualizado.