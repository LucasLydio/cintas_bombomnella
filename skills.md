# Skills / Habilidades usadas até agora

## Estrutura e organização
- Criação de estrutura de pastas/arquivos do projeto (`backend/`, `netlify/functions/`, `public/`, `components/`, `assets/`).
- Padronização de caminhos e convenções para front-end estático + Netlify Functions.

## Front-end (HTML + Bootstrap)
- Montagem da home `public/index.html` com Bootstrap 5 e Bootstrap Icons.
- Uso de *includes* por atributo `data-include` para compor layout com:
  - `public/components/layout/header.html`
  - `public/components/layout/sidebar.html`
  - `public/components/layout/footer.html`
- Ajuste do layout para utilitários Flex (`d-flex`) no lugar do grid (`col-*`, `row`).

## Component loader (includes)
- Implementação do carregador de componentes via `fetch`:
  - `public/assets/js/components/include.js`
- Suporte a includes aninhados (recursão).
- Preenchimento automático de ano no footer com `data-year`.

## Estilo e identidade visual (CSS)
- Definição de *design tokens* via CSS variables (cores, tipografia, sombras, raios):
  - `public/assets/css/global.css`
- Tipografia com Google Fonts (Montserrat) e configuração base:
  - `public/assets/css/typography.css`
- Estilos de layout e componentes:
  - `public/assets/css/layout.css`
  - `public/assets/css/components.css`
  - `public/assets/css/pages/home.css`

## Assets
- Uso de logo em `.webp` referenciado no header/footer/sidebar e como favicon:
  - `public/assets/images/logoCintas.webp`

