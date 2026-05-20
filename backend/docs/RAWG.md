# RAWG Video Games Database API

## Sobre a API

A **RAWG** é a maior base de dados aberta de videogames, contendo mais de **350.000 jogos** para **50 plataformas** diferentes, incluindo dispositivos móveis. A API fornece acesso a metadados ricos sobre jogos, desenvolvedoras, publicadoras, e muito mais.

**URL Base:** `https://api.rawg.io/api`  
**Documentação:** https://rawg.io/apidocs

---

## 📋 Principais Recursos Disponíveis

### 1. **Games** 🎮
Buscar e obter informações detalhadas sobre jogos.

**Endpoints:**
- `GET /games` - Lista de jogos com filtros avançados
- `GET /games/{id}` - Detalhes completos de um jogo
- `GET /games/{id}/achievements` - Conquistas do jogo
- `GET /games/{id}/movies` - Trailers/vídeos
- `GET /games/{id}/reddit` - Posts recentes do subreddit
- `GET /games/{id}/screenshots` - Screenshots do jogo
- `GET /games/{id}/suggested` - Jogos visualmente similares (apenas Business/Enterprise)
- `GET /games/{id}/twitch` - Streams no Twitch (apenas Business/Enterprise)
- `GET /games/{id}/youtube` - Vídeos no YouTube (apenas Business/Enterprise)
- `GET /games/{game_pk}/additions` - DLCs, GOTY editions e companion apps
- `GET /games/{game_pk}/development-team` - Criadores envolvidos no desenvolvimento
- `GET /games/{game_pk}/game-series` - Outros jogos da mesma série
- `GET /games/{game_pk}/parent-games` - Jogos principais (para DLCs/edições)
- `GET /games/{game_pk}/stores` - Links para lojas que vendem o jogo

**Parâmetros de Filtro:**
- `search` - Busca por nome (fuzzy search)
- `search_precise` - Desabilita fuzzy search
- `search_exact` - Marca a busca como exata
- `parent_platforms` - Filtrar por plataforma pai (ex: `1,2,3`)
- `platforms` - Filtrar por plataforma específica (ex: `4,5`)
- `stores` - Filtrar por lojas (ex: `5,6`)
- `developers` - Filtrar por desenvolvedora (ID ou slug)
- `publishers` - Filtrar por publicadora (ID ou slug)
- `genres` - Filtrar por gênero (ID ou slug)
- `tags` - Filtrar por tags (ID ou slug)
- `creators` - Filtrar por criador (ID ou slug)
- `dates` - Filtrar por data de lançamento (ex: `2010-01-01,2018-12-31`)
- `updated` - Filtrar por data de atualização (ex: `2020-12-01,2020-12-31`)
- `platforms_count` - Filtrar por quantidade de plataformas
- `metacritic` - Filtrar por rating Metacritic (ex: `80,100`)
- `exclude_collection` - Excluir jogos de uma coleção
- `exclude_additions` - Excluir DLCs/adições
- `exclude_parents` - Excluir jogos que possuem adições
- `exclude_game_series` - Excluir jogos que fazem parte de uma série
- `exclude_stores` - Excluir lojas específicas
- `ordering` - Ordenação: `name`, `released`, `added`, `created`, `updated`, `rating`, `metacritic` (use `-` para reverso)

**Exemplo de Resposta (Game):**
```json
{
  "id": 3498,
  "slug": "grand-theft-auto-v",
  "name": "Grand Theft Auto V",
  "released": "2013-09-17",
  "tba": false,
  "background_image": "https://...",
  "rating": 4.48,
  "rating_top": 5,
  "ratings_count": 6500,
  "reviews_text_count": 120,
  "added": 18000,
  "metacritic": 97,
  "playtime": 78,
  "platforms": [
    {
      "platform": {
        "id": 1,
        "name": "PC",
        "slug": "pc"
      },
      "released_at": "2015-04-14",
      "requirements": {
        "minimum": "OS: Windows XP...",
        "recommended": "OS: Windows 7..."
      }
    }
  ],
  "esrb_rating": {
    "id": 4,
    "slug": "mature",
    "name": "Mature"
  }
}
```

---

### 2. **Genres** 🎭
Categorias e gêneros de jogos.

**Endpoints:**
- `GET /genres` - Lista todos os gêneros
- `GET /genres/{id}` - Detalhes de um gênero específico

**Exemplo:** Action, RPG, Strategy, Sports, etc.

---

### 3. **Platforms** 🖥️
Plataformas e consoles de jogos.

**Endpoints:**
- `GET /platforms` - Lista todas as plataformas
- `GET /platforms/{id}` - Detalhes de uma plataforma
- `GET /platforms/lists/parents` - Plataformas pai (ex: PlayStation agrupa PS2, PS4, PS5)

**Plataformas Disponíveis:**
- PC, PlayStation (1-5), Xbox (Original, 360, One, Series X/S)
- Nintendo (NES, SNES, Switch, etc.)
- Mobile (iOS, Android)
- E muitas mais...

---

### 4. **Developers** 👨‍💻
Empresas/estúdios de desenvolvimento de jogos.

**Endpoints:**
- `GET /developers` - Lista de desenvolvedoras
- `GET /developers/{id}` - Detalhes de uma desenvolvedora

**Informações:**
- Nome e slug único
- Quantidade de jogos desenvolvidos
- Imagem de fundo

---

### 5. **Publishers** 🏢
Publicadoras de jogos.

**Endpoints:**
- `GET /publishers` - Lista de publicadoras
- `GET /publishers/{id}` - Detalhes de uma publicadora

---

### 6. **Creators** 👤
Criadores individuais (compositores, designers, artistas, etc.).

**Endpoints:**
- `GET /creators` - Lista de criadores
- `GET /creators/{id}` - Detalhes de um criador
- `GET /creator-roles` - Posições/jobs de criadores (ex: Designer, Composer, Artist)

---

### 7. **Stores** 🛒
Plataformas de distribuição digital de jogos.

**Endpoints:**
- `GET /stores` - Lista de lojas (Steam, Epic Games Store, PS Store, etc.)
- `GET /stores/{id}` - Detalhes de uma loja

---

### 8. **Tags** 🏷️
Tags que categorizam características dos jogos.

**Endpoints:**
- `GET /tags` - Lista de tags
- `GET /tags/{id}` - Detalhes de uma tag

**Exemplos de Tags:**
- Singleplayer, Multiplayer, Co-op
- Turn-based, Real-time
- Open World, Sandbox
- Etc.

---

## 🔑 Autenticação e Uso

### Obter uma API Key

1. Acesse https://rawg.io/apidocs
2. Registre-se ou faça login
3. Copie sua chave de API

### Fazer uma Requisição

**Todas as requisições devem incluir a API key como parâmetro de query:**

```bash
curl "https://api.rawg.io/api/games?key=YOUR_API_KEY"
```

**Ou em JavaScript/Fetch:**

```javascript
const API_KEY = "YOUR_API_KEY";

fetch(`https://api.rawg.io/api/games?key=${API_KEY}`)
  .then(res => res.json())
  .then(data => console.log(data));
```

---

## 📦 Estrutura de Resposta (Paginação)

A maioria dos endpoints retorna resultados **paginados**:

```json
{
  "count": 850000,
  "next": "https://api.rawg.io/api/games?page=2",
  "previous": null,
  "results": [
    { /* game object */ },
    { /* game object */ }
  ]
}
```

**Parâmetros de Paginação:**
- `page` - Número da página (padrão: 1)
- `page_size` - Quantidade de resultados por página (padrão: 20, máximo varia)

---

## 🎯 Casos de Uso Comuns

### 1. Buscar um Jogo Específico
```bash
curl "https://api.rawg.io/api/games?search=The%20Witcher%203&key=YOUR_KEY"
```

### 2. Listar Jogos de um Gênero
```bash
curl "https://api.rawg.io/api/games?genres=action&key=YOUR_KEY"
```

### 3. Jogos para uma Plataforma Específica
```bash
curl "https://api.rawg.io/api/games?platforms=18&key=YOUR_KEY"  # PC
```

### 4. Jogos Ordenados por Rating
```bash
curl "https://api.rawg.io/api/games?ordering=-rating&key=YOUR_KEY"
```

### 5. Obter Detalhes Completos de um Jogo
```bash
curl "https://api.rawg.io/api/games/3498?key=YOUR_KEY"  # GTA V
```

**Informações Retornadas:**

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | Integer | ID único do jogo |
| `slug` | String | URL-friendly name |
| `name` | String | Nome do jogo |
| `name_original` | String | Nome original (idioma original) |
| `description` | String | Descrição completa do jogo |
| `released` | Date | Data de lançamento |
| `tba` | Boolean | "To Be Announced" - ainda não lançado |
| `updated` | DateTime | Última atualização dos dados |
| `background_image` | URL | Imagem de fundo/capa principal |
| `background_image_additional` | String | Imagem adicional |
| `website` | URL | Site oficial do jogo |
| `rating` | Float (0-5) | Rating médio dos usuários RAWG |
| `rating_top` | Integer | Melhor rating possível |
| `ratings` | Object | Distribuição de ratings (quantos votaram em cada nota) |
| `ratings_count` | Integer | Total de ratings recebidos |
| `reviews_text_count` | String | Quantas resenhas textuais foram escritas |
| `suggestions_count` | Integer | Quantas vezes foi sugerido como similar |
| `reactions` | Object | Reações dos usuários (like/love/hate/etc) |
| `added` | Integer | Quantos usuários adicionaram à biblioteca |
| `added_by_status` | Object | Breakdown de status (owned/played/beaten/etc) |
| `playtime` | Integer | Tempo médio de jogo (em horas) |
| `metacritic` | Integer | Score Metacritic (0-100) |
| `metacritic_platforms` | Array | Scores Metacritic por plataforma |
| `metacritic_url` | URL | Link para a página no Metacritic |
| `esrb_rating` | Object | Classificação etária (Everyone, Teen, Mature, etc) |
| `platforms` | Array | **Detalhes de cada plataforma:** |
| └─ `platform.id` | Integer | ID da plataforma |
| └─ `platform.name` | String | Nome da plataforma (PC, PS4, etc) |
| └─ `platform.slug` | String | Slug da plataforma |
| └─ `released_at` | Date | Data de lançamento nessa plataforma |
| └─ `requirements.minimum` | String | Requisitos mínimos |
| └─ `requirements.recommended` | String | Requisitos recomendados |
| `screenshots_count` | Integer | Total de screenshots |
| `movies_count` | Integer | Total de trailers/vídeos |
| `creators_count` | Integer | Quantos criadores estão listados |
| `achievements_count` | Integer | Total de achievements/conquistas |
| `parent_achievements_count` | String | Achievements da série pai (se aplicável) |
| `parents_count` | Integer | Quantos jogos pai existem (para DLCs) |
| `additions_count` | Integer | Quantos DLCs/adições existem |
| `game_series_count` | Integer | Quantos jogos fazem parte da série |
| `reddit_url` | String | Subreddit do jogo |
| `reddit_name` | String | Nome do subreddit |
| `reddit_description` | String | Descrição do subreddit |
| `reddit_logo` | URL | Logo do subreddit |
| `reddit_count` | Integer | Posts recentes do subreddit |
| `twitch_count` | String | Streams ativos no Twitch (Business/Enterprise) |
| `youtube_count` | String | Vídeos no YouTube (Business/Enterprise) |
| `alternative_names` | Array | Outros nomes/títulos do jogo |

**Exemplo de Resposta Completa:**

```json
{
  "id": 3498,
  "slug": "grand-theft-auto-v",
  "name": "Grand Theft Auto V",
  "name_original": "Grand Theft Auto V",
  "description": "Rockstar Games went bigger, since always...",
  "metacritic": 97,
  "metacritic_platforms": [
    {
      "metascore": 98,
      "url": "https://www.metacritic.com/game/playstation-4/grand-theft-auto-v"
    }
  ],
  "released": "2013-09-17",
  "tba": false,
  "updated": "2024-05-04T12:30:45.123456Z",
  "background_image": "https://media.rawg.io/media/games/20a/20aa03ad8fbc424fd58fbc9e88caf0d.jpg",
  "background_image_additional": "https://...",
  "website": "https://www.rockstargames.com/gta-v",
  "rating": 4.48,
  "rating_top": 5,
  "ratings": {
    "1": 245,
    "2": 450,
    "3": 1200,
    "4": 2850,
    "5": 4500
  },
  "reactions": {
    "1": 500,
    "2": 1500,
    "3": 3200,
    "4": 2000
  },
  "added": 18000,
  "added_by_status": {
    "owned": 12000,
    "played": 8500,
    "beaten": 6200,
    "toplay": 3000,
    "dropped": 800
  },
  "playtime": 78,
  "screenshots_count": 45,
  "movies_count": 8,
  "creators_count": 156,
  "achievements_count": 52,
  "parent_achievements_count": "0",
  "reddit_url": "https://www.reddit.com/r/GTA/",
  "reddit_name": "r/GTA",
  "reddit_description": "The official subreddit for Grand Theft Auto...",
  "reddit_logo": "https://styles.redditmedia.com/...",
  "reddit_count": 892,
  "twitch_count": "2341",
  "youtube_count": "15829",
  "reviews_text_count": "542",
  "ratings_count": 9245,
  "suggestions_count": 3210,
  "alternative_names": [
    "GTA V",
    "GTA 5",
    "Grand Theft Auto 5"
  ],
  "metacritic_url": "https://www.metacritic.com/game/playstation-4/grand-theft-auto-v",
  "parents_count": 0,
  "additions_count": 34,
  "game_series_count": 7,
  "esrb_rating": {
    "id": 4,
    "slug": "mature",
    "name": "Mature"
  },
  "platforms": [
    {
      "platform": {
        "id": 18,
        "name": "PlayStation 4",
        "slug": "playstation4"
      },
      "released_at": "2014-11-18",
      "requirements": null
    },
    {
      "platform": {
        "id": 1,
        "name": "PC",
        "slug": "pc"
      },
      "released_at": "2015-04-14",
      "requirements": {
        "minimum": "OS: Windows XP, Vista, Windows 7, Windows 8, Windows 8.1 or Windows 10 (32 or 64 bit). Processor: Intel Core 2 Duo @ 1.8GHz or AMD equivalent. RAM: 1.5GB (XP) or 1GB (Vista, Windows 7, Windows 8, Windows 8.1, Windows 10). Video Card: 256MB NVIDIA GeForce 7900 or better; or ATI Radeon X1900 or better...",
        "recommended": "OS: Windows Vista, Windows 7, Windows 8, Windows 8.1 or Windows 10 (64 bit). Processor: Intel Core i5 @ 3.3GHz or better. RAM: 8GB. Video Card: NVIDIA GTX 660 2GB or better; or AMD Radeon HD 7870 2GB or better..."
      }
    }
  ]
}
```

### 6. Jogos de um Desenvolvedor Específico
```bash
curl "https://api.rawg.io/api/games?developers=rockstar-games&key=YOUR_KEY"
```

### 7. Filtrar por Data de Lançamento
```bash
curl "https://api.rawg.io/api/games?dates=2020-01-01,2020-12-31&key=YOUR_KEY"
```

### 8. Obter Criadores de um Jogo
```bash
curl "https://api.rawg.io/api/games/3498/development-team?key=YOUR_KEY"
```

---

## ⚖️ Termos de Uso

### Free Tier
✅ **Permitido:**
- Uso pessoal e não comercial
- Projetos hobby e startups com até 100.000 usuários ativos/mês ou 500.000 page views/mês
- Você **DEVE** atribuir RAWG como fonte em cada página que usar seus dados
- Incluir um hyperlink ativo para o RAWG

❌ **Proibido:**
- Clonar o RAWG (criar um clone/duplicado)
- Uso comercial além do permitido
- Não incluir atribuição e hyperlink

### Comercial
Para projetos maiores que o Free Tier, entre em contato:
📧 **api@rawg.io**

### Requisitos Gerais
- ✅ Deve incluir API key em cada requisição
- ✅ Atribuição obrigatória ao RAWG
- ✅ Hyperlink ativo para https://rawg.io

---

## 🔗 Dados Adicionais Disponíveis

- **Ratings:** Scores dos usuários do RAWG
- **Metacritic:** Scores de crítica profissional
- **Steam Playtime:** Tempo médio de jogo no Steam
- **Screenshots:** Imagens dos jogos
- **Trailers:** Vídeos e trailers
- **Stores:** Links de compra em múltiplas plataformas
- **Similar Games:** Jogos visualmente similares
- **Reddit/Twitch/YouTube:** Conteúdo social (Business/Enterprise)

---

## 💡 Dicas

1. **Cache:** Use caching local para evitar muitas requisições
2. **Lazy Loading:** Carregue dados sob demanda
3. **Slugs vs IDs:** Pode usar tanto slug quanto ID (ex: `3498` ou `grand-theft-auto-v`)
4. **Busca Fuzzy:** Use `search` para buscas aproximadas, `search_precise` ou `search_exact` para exatidão
5. **Rate Limiting:** Respeite rate limits da API (informados nos headers da resposta)

---

## 📚 Recursos

- **Documentação Completa:** https://rawg.io/apidocs
- **Obter API Key:** https://rawg.io/apidocs
- **Status da API:** Verificar documentação oficial
- **Exemplos:** https://rawg.io/apidocs (todos os endpoints documentados com exemplos)

---

## Próximos Passos

Para integrar a API RAWG em seu projeto:

1. Obtenha uma API key em https://rawg.io/apidocs
2. Escolha o endpoint que precisa
3. Construa a URL com seus filtros
4. Implemente tratamento de erros e paginação
5. Sempre atribua RAWG como fonte
