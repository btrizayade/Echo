# Echo — Frontend

Interface web do Echo, uma memória criativa não generativa. O frontend permite registrar, organizar, revisitar e relacionar capturas pessoais sem gerar conteúdo criativo em nome da pessoa.

## Requisitos

- Node.js `>=22.22.0` (Node.js 24 LTS é compatível com a faixa de engines das dependências deste projeto).
- npm incluído com o Node.js.
- Backend do Echo disponível para as operações de captura, temas, mídia e resgates.

## Instalação

Na pasta `frontend`:

```powershell
npm ci
```

Copie `.env.example` para `.env.local` caso o backend não esteja em `http://127.0.0.1:8000` e ajuste `VITE_API_BASE_URL`.

## Desenvolvimento

```powershell
npm run dev
```

O Vite informa no terminal o endereço local. Normalmente é `http://localhost:5173`.

## Verificações

```powershell
npm run typecheck
npm run lint
npm run build
```

- `typecheck`: verifica os tipos TypeScript.
- `lint`: executa as regras ESLint do projeto.
- `build`: executa a verificação TypeScript e gera a versão de produção em `dist/`.

## Rotas

| URL | Tela |
|---|---|
| `/` | Homepage de apresentação |
| `/app` | Visão geral do workbench |
| `/app/captures` | Capturas |
| `/app/favorites` | Favoritas |
| `/app/themes` | Temas |
| `/app/rescues` | Resgates |

A navegação da homepage, a Sidebar e os atalhos do painel lateral usam essas mesmas rotas. O endereço da seção ativa é a fonte de verdade, portanto links diretos, atualização da página e histórico voltar/avançar mantêm a seção selecionada.

## Identidade visual e mídia

- Logo: `src/assets/echo-logo.png`.
- Arte do botão da homepage: `src/assets/botao-homepage.png`.
- Vídeo de fundo da homepage: `public/videos/homepage-loop.mp4`.

O vídeo é servido como `/videos/homepage-loop.mp4`. Mantenha o nome e o caminho ou atualize a referência em `src/pages/HomePage.tsx`.

## Organização principal

```text
src/
├── assets/       # Logo e arte do botão
├── components/   # Componentes do workbench e modais
├── data/         # Dados de demonstração e rótulos
├── hooks/        # Hooks de acesso aos dados da API
├── pages/        # HomePage e WorkbenchPage
├── services/     # Cliente da API
├── styles/       # CSS da homepage e do workbench
├── types/        # Tipos de domínio
└── utils/        # Adaptadores dos dados da API
```

## API

O endereço base é configurado por `VITE_API_BASE_URL`. Sem essa variável, o frontend usa `http://127.0.0.1:8000`.
