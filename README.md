<div align="center">
  <img src="https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/map.svg" alt="Rotavis Logo" width="120" height="120" />

  # 🗺️ Rotavis
  
  **O Seu Guia Inteligente para Foz do Iguaçu**

  <p>
    <img alt="React" src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" />
    <img alt="Vite" src="https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E" />
    <img alt="CSS3" src="https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white" />
  </p>

  <p>
    Um sistema inovador focado na experiência do turista e na gestão inteligente de destinos, unindo a geração automática de roteiros hiper-personalizados com um painel avançado de observatório turístico.
  </p>
</div>

<br />

## ✨ Funcionalidades

### 🌴 Para o Turista (Front-End)
- **Gerador de Roteiros Inteligente:** Leva em conta interesses, orçamento, transporte, origem e grupo.
- **Disponibilidade Real:** Verifica dias e horários de funcionamento dos atrativos em Foz do Iguaçu antes de recomendar.
- **Exportação em PDF:** Permite que o turista baixe o roteiro final para o celular com facilidade.
- **UI/UX Premium:** Design imersivo usando conceitos de *Glassmorphism*, transições fluidas e paleta de cores inspirada na natureza local.
- **Avaliação de Experiência (NPS):** Captura simplificada de feedback ao final do planejamento.

### 📊 Para a Gestão do Destino (Painel Admin)
- **Observatório do Turismo em Tempo Real:** Dashboard consolidando dados anonimizados de intenção de viagem.
- **Indicadores Estratégicos:**
  - Sazonalidade e Ticket Médio Estimado.
  - Receita Total e Estadia Média (ALOS).
  - Distribuição demográfica (Origem e Perfil do Grupo).
- **Inventário de Inteligência:** Identificação de Atrativos "Quentes" (muito buscados) vs "Negligenciados" (oportunidades de marketing).
- **Padrões de Deslocamento:** Entenda quais atrativos são frequentemente combinados pelos turistas.
- **Suporte Multi-Tema:** Claro (Light Mode) e Escuro (Dark Mode) focados em conforto visual e leitura de dados.

---

## 🚀 Como Executar o Projeto

O projeto foi construído usando **React + Vite** configurado no formato *Multi-Page Application (MPA)*, rodando o aplicativo principal e o admin simultaneamente.

### Pré-requisitos
- [Node.js](https://nodejs.org/en/) (Versão 18+ recomendada)
- `npm`, `yarn` ou `pnpm`

### Instalação

1. Clone o repositório:
```bash
git clone https://github.com/felaipes/rotavis.git
```

2. Acesse a pasta do projeto e instale as dependências:
```bash
cd rotavis
npm install
```

3. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

4. Acesse no seu navegador:
- **App do Turista:** [`http://localhost:5173/`](http://localhost:5173/)
- **Painel Administrativo:** [`http://localhost:5173/admin/`](http://localhost:5173/admin/)

> **💡 Dica para o Admin:** Ao acessar o painel pela primeira vez, clique em **"Carregar Demo"** para popular os gráficos com dados simulados ricos (indicadores, sazonalidade, rotas).

---

## 🏗️ Arquitetura do Projeto

O sistema é dividido em duas partes principais (MPA no Vite):

```text
rotavis/
├── src/                      # Código do App Principal (Gerador de Roteiros)
│   ├── components/           # Componentes UI (PlaceCard, Modais)
│   ├── pages/                # RouteGenerator (fluxo de perguntas)
│   ├── services/             # Lógica de negócio (Analytics, Recommendations, Availability)
│   └── data.js               # Banco de dados de atrativos locais
│
└── src/admin/                # Código do Painel Administrativo
    ├── components/           # Gráficos e componentes do Dashboard
    ├── pages/                # DashboardPage, IndicatorsPage, AttractivesPage
    └── admin-theme.css       # Design System focado em Data Visualization
```

---

## 🛠️ Tecnologias Utilizadas

- **Core:** [React](https://reactjs.org/) & [Vite](https://vitejs.dev/)
- **Estilização:** CSS3 Vanilla Avançado (Variáveis, Animações, Glassmorphism)
- **Gráficos:** [Recharts](https://recharts.org/)
- **Ícones:** [Lucide React](https://lucide.dev/)
- **Animações:** [Framer Motion](https://www.framer.com/motion/)
- **PDF Generation:** [jsPDF](https://parall.ax/products/jspdf) & [html2canvas](https://html2canvas.hertzen.com/)

---

<div align="center">
  <p>Feito com ❤️ para melhorar o turismo no Brasil.</p>
</div>
