# Requisitos e Casos de Uso

## Objetivo

Centralizar e automatizar a organização das corridas da ONG **Pernas Solidárias**, substituindo controles manuais em planilhas dispersas por um sistema único que garante justiça na distribuição de vagas (priorizando quem participou menos) e agilidade na montagem das duplas.

---

## Requisitos Funcionais Principais

| ID | Requisito | Descrição |
|---|---|---|
| **RF01** | Autenticação de Coordenador | Login com e-mail e senha (JWT), hash seguro com `bcrypt` e bloqueio temporário após tentativas falhas consecutivas. |
| **RF02** | Gestão de Cadeirantes | Cadastro, listagem, busca (por nome ou CPF formatado/numérico), edição e ativação/inativação, incluindo tamanho de camisa, data de nascimento, sexo e indicação de cadeira própria. |
| **RF03** | Gestão de Condutores | Cadastro, listagem, busca, edição e ativação/inativação de atletas voluntários condutores. |
| **RF04** | Unicidade Cruzada de CPF | Impedir via triggers no PostgreSQL que um mesmo CPF seja cadastrado simultaneamente como cadeirante e condutor. |
| **RF05** | Gestão de Eventos | Criação, edição, visualização e exclusão de corridas com validação de data e bloqueio de alterações em eventos passados. |
| **RF06** | Formação Automática e Manual de Duplas | Formação de pares (cadeirante + condutor) por evento com priorização por menor histórico de participações, além de criação/edição/remoção manual de duplas. |
| **RF07** | Histórico de Participações | Consulta de eventos já realizados e das duplas formadas em cada corrida. |
| **RF08** | Exportação de Planilhas (Excel) | Geração e download de arquivo `.xlsx` (ExcelJS) com participantes e duplas do evento, preservando o cabeçalho `Content-Disposition`. |
| **RF09** | Dashboard e Gráficos Analíticos | Indicadores gerais e gráficos interativos (Recharts) de participação, distribuição de camisas e histórico de eventos. |

---

## Fluxos de Negócio Completos

1. **Fluxo de Autenticação e Sessão:** login → validação de credenciais e controle de tentativas → emissão de JWT → proteção de rotas autenticadas → expiração/logout automático em `401`.
2. **Fluxo de Cadastro de Participantes e Eventos:** cadastro/edição de cadeirantes e condutores (com validação de CPF e unicidade cruzada) → criação de evento futuro.
3. **Fluxo de Formação de Duplas e Exportação:** seleção do evento → execução do algoritmo de priorização ou pareamento manual → persistência sem duplicidade no evento → exportação da planilha `.xlsx` → consulta posterior no histórico e nos gráficos.

> Os diagramas de casos de uso e fluxo de navegação originais estão disponíveis em [`RFC/CASO_USO_PRINCIPAL/`](https://github.com/LuizFelipeSchroderMarcon/Pernas_Solidarias/tree/main/RFC/CASO_USO_PRINCIPAL) e [`RFC/FLUXO_NAVEGACAO/`](https://github.com/LuizFelipeSchroderMarcon/Pernas_Solidarias/tree/main/RFC/FLUXO_NAVEGACAO).
