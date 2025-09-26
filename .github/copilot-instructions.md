# Copilot Instructions for AI Agents

## Visão Geral do Projeto
- Este monorepo Angular contém dois projetos principais:
  - `projects/sistema-empresa`: Biblioteca de componentes e lógica de domínio.
  - `projects/sistema-empresa-app`: Aplicação principal que consome a biblioteca.
- Estrutura modular: cada funcionalidade (ex: `admin`, `home`, `login`) está em seu próprio diretório sob `src/app/`.

## Fluxos de Desenvolvimento
- **Servidor de desenvolvimento:**
  - Execute `ng serve` a partir da raiz do projeto para rodar a aplicação em `http://localhost:4200/`.
- **Build:**
  - Use `ng build` para compilar o projeto. Os artefatos vão para `dist/`.
- **Testes unitários:**
  - Execute `ng test` para rodar testes com Karma.
- **Geração de código:**
  - Use `ng generate component|service|module ...` para scaffolding.

## Convenções Específicas
- **Componentização:**
  - Cada funcionalidade tem seu próprio módulo e componentes, seguindo a estrutura de pastas em `src/app/`.
- **Public API:**
  - Exporte componentes/serviços reutilizáveis via `src/public-api.ts`.
- **Configurações:**
  - Configurações de ambiente em `src/environments/`.
  - Configurações de build/teste em arquivos `tsconfig.*.json`, `karma.conf.js`, `ng-package.json`.
- **Scripts customizados:**
  - O script `prebuild-packages.js` pode ser usado para preparar pacotes antes do build (verifique sua lógica se for relevante ao fluxo).

## Integrações e Dependências
- **Angular CLI** é a principal ferramenta de build/teste.
- Dependências e scripts adicionais estão em `package.json` na raiz e nos subprojetos.

## Exemplos de Padrões
- Para criar um novo componente em `home`, use:
  ```bash
  ng generate component home/nome-do-componente
  ```
- Para adicionar um serviço compartilhado:
  ```bash
  ng generate service shared/nome-do-servico
  ```

## Arquivos-Chave
- `projects/sistema-empresa/src/app/` — Componentes e módulos principais
- `projects/sistema-empresa/src/public-api.ts` — Pontos de exportação da biblioteca
- `projects/sistema-empresa-app/src/app/` — App principal
- `angular.json`, `tsconfig.json` — Configurações globais

## Observações
- Siga a estrutura modular e exporte sempre pelo `public-api.ts` para reutilização.
- Scripts customizados podem ser necessários antes do build em cenários avançados.
- Consulte o README de cada subprojeto para detalhes específicos.
