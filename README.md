# Conecta+ — Plataforma de vagas de emprego (protótipo)

Protótipo visual e navegável de uma plataforma de recrutamento, feito só com **HTML, CSS e JavaScript**.
Não usa backend, banco de dados, APIs ou serviços externos: tudo roda no navegador, com dados fictícios.

## Como executar

1. Abra o arquivo `index.html` no navegador (duplo clique). Não precisa de servidor.
2. Navegue pelo menu. Cada página é um arquivo HTML real (`pages/*.html`), então funciona direto em `file://`.

## Estrutura do projeto

```
index.html            Página inicial (home)
pages/                Uma página por arquivo: vagas, vaga, empresas, perfil, contato, whatsapp,
                      entrar, cadastro-candidato, cadastro-empresa, painel, nova-vaga
js/layout.js          Header, rodapé, logo (SVG) e rotas entre páginas — único lugar a editar para mudar o layout
js/data.js            Dados fictícios centralizados (vagas, empresas, contas, perfil, contatos)
js/app.js             Conteúdo de cada página, componentes, chatbot e área da empresa
css/style.css         Estilos (tokens de cor, componentes, responsivo mobile-first)
assets/logo.svg       Logo completo em SVG
assets/logo-icon.svg  Ícone (favicon)
```

Cada arquivo de `pages/` é só um esqueleto com `<main id="main" data-page="nome">` + os 3 scripts; o `data-page` diz ao `app.js` qual conteúdo montar. Para **criar uma página nova**: copie um arquivo de `pages/`, troque o `data-page`/título e adicione a função de mesmo nome em `pages` no `app.js` (e o nome em `PAGES` no `layout.js`).

## Páginas

| Arquivo | Página | Acesso |
|---|---|---|
| `index.html` | Início: busca, filtros, vagas em destaque, empresas | público |
| `pages/vagas.html` | Lista de vagas com filtros, busca e ordenação (`?cat=`, `?empresa=`, `?modality=`) | público |
| `pages/vaga.html?id=ID` | Detalhes da vaga + botão "Tenho interesse" | público |
| `pages/empresas.html` | Empresas cadastradas (inclui as novas) | público |
| `pages/perfil.html` | **Meu perfil** do candidato (editável) | candidato logado |
| `pages/contato.html` | Informações, formulário e WhatsApp | qualquer usuário logado |
| `pages/whatsapp.html` | **Atendimento pelo WhatsApp** (chatbot simulado) | público |
| `pages/entrar.html` | **Login** de candidato ou empresa | visitante |
| `pages/cadastro-candidato.html` | **Cadastro de candidato** (com CPF) | visitante |
| `pages/cadastro-empresa.html` | **Cadastro de empresa** | visitante |
| `pages/painel.html` | Painel: vagas da empresa e candidatos interessados | logado |
| `pages/nova-vaga.html` | **Cadastro de vaga** (formulário completo) | logado |

`whatsapp.html` aceita contexto: `?vaga=ID` ou `?empresa=ID`. Páginas protegidas redirecionam para `entrar.html` e, depois do login, voltam para a página pedida (a rota fica no `sessionStorage`). Links internos são escritos como `#/rota` nos templates e convertidos para links reais pelo `layout.js`.

## Login (somente com o armazenamento do navegador)

Não há servidor: contas e sessão ficam no `localStorage`/`sessionStorage` do navegador.

- **Tipos de conta:** candidato e empresa, escolhidos no seletor da tela de login.
- **Cadastro:** valida os campos (CPF válido e único, e-mail único por tipo, senha com 8+ caracteres, letras e números, confirmação, termos). A senha é guardada como hash SHA-256 com sal.
- **Sessão:** "Manter conectado neste navegador" grava no `localStorage` (continua após fechar o navegador); desmarcado, grava no `sessionStorage` (acaba ao fechar a aba). "Sair" apaga a sessão.
- **Proteção simples:** bloqueio de 30 s após 5 tentativas erradas.
- **Contas de demonstração** (senha `demo123`): candidato `mariana.souza@exemplo.com`; empresas na tabela abaixo.

### Perfil do candidato

Mostra dados, áreas, habilidades, vagas salvas (o coração só funciona logado como candidato, e cada candidato tem a sua lista), triagens feitas no WhatsApp, experiência e formação. Dá para editar o perfil e adicionar/remover experiências e formações. Com o candidato logado, o chatbot já usa o nome do perfil e pergunta só o CPF.

## Chatbot do WhatsApp (verificação por CPF)

Página própria, com visual de conversa do WhatsApp. Fluxo:

1. **CPF** — máscara automática e validação dos dígitos verificadores.
2. **CPF já cadastrado** — o bot só devolve a **informação padrão**: nome, cargo, cidade e interesses da conta, mais as vagas abertas nas áreas de interesse (ou as de destaque). Se a conversa veio de uma vaga/empresa, o interesse é registrado como *lead* para a empresa.
3. **CPF não cadastrado** — o bot pede o **cadastro na plataforma** com um link para `cadastro-candidato.html` (CPF e nome já preenchidos). Ao concluir o cadastro, o usuário volta ao chat, que reconhece a conta e mostra a informação padrão.

CPFs de teste: `529.982.247-25` (cadastrado — conta demo) e `111.444.777-35` (válido, sem cadastro). Candidato já logado pula a pergunta do CPF.

O cadastro guarda apenas o **hash SHA-256** do CPF (a conta demo traz o CPF em texto nos dados de exemplo). Nada é enviado de verdade.

## Área da empresa

- **Cadastro (`#/cadastro-empresa`)**: nome fantasia, CNPJ (validado; teste: `11.222.333/0001-81`), área, cidade, porte, descrição, responsável, WhatsApp, e-mail, senha (8+ caracteres com letras e números), confirmação e aceite dos termos. A empresa criada aparece em "Empresas".
- **Login (`#/entrar`)**: valida e-mail e senha, mostra/oculta senha e bloqueia por 30 s após 5 tentativas erradas. Contas de demonstração (senha `demo123`):

  | Empresa | E-mail |
  |---|---|
  | NovaTech Soluções | rh@novatech.exemplo |
  | Vida Plena Clínicas | rh@vidaplena.exemplo |
  | Horizonte Logística | rh@horizonte.exemplo |
  | Casa Verde Varejo | rh@casaverde.exemplo |
  | Atlas Educação | rh@atlas.exemplo |

- **Painel (`#/painel`)**: indicadores, candidatos interessados e lista de vagas (as criadas pela empresa podem ser excluídas).
- **Nova vaga (`#/nova-vaga`)**: formulário em 4 etapas — *informações básicas* (título, área, nº de vagas, resumo), *contratação* (local, modalidade, tipo, jornada, escolaridade, experiência, prazo), *remuneração e benefícios* (faixa salarial, benefícios padrão + extras) e *descrição e requisitos* (atividades, requisitos, etapas do processo). A vaga publicada aparece imediatamente na lista pública.

## Dados e armazenamento

Dados base ficam em `js/data.js` (`window.DATA`): `categories`, `modalities`, `contracts`, `companies`, `jobs`, `accounts`, `sampleLeads`, `profile`, `platform`. Para trocar vagas, empresas ou o número de WhatsApp, edite apenas esse arquivo.

Modelo de uma vaga: `id, title, company, category, location, modality, contract, salaryMin, salaryMax, daysAgo, featured, summary, description, requirements[], benefits[], hiring` e, nas vagas criadas pelo painel, `custom, openings, workload, education, experience, deadline`.

O que o navegador guarda (`localStorage`, exceto a sessão):

| Chave | Conteúdo |
|---|---|
| `conecta-custom-companies` | empresas cadastradas |
| `conecta-custom-accounts` | contas das empresas (senha em hash SHA-256) |
| `conecta-candidates` | contas e perfis dos candidatos (inclui a conta demo) |
| `conecta-custom-jobs` | vagas criadas no painel |
| `conecta-leads` | triagens feitas no chatbot |
| `conecta-favs-<id>` | vagas salvas por cada candidato |
| `conecta-session` | usuário logado (`localStorage` ou `sessionStorage`) |
| `conecta-next` | rota pedida antes do login (`sessionStorage`) |

Para zerar o protótipo, limpe os dados do site no navegador.

## Identidade visual

Cores extraídas do logo: azul-marinho `#1F3A5F` e verde `#2D8C68` (tokens em `:root` no CSS). O verde do WhatsApp usa `#128A45`, com contraste adequado para texto branco. O logo é um SVG inline cujas cores mudam por variáveis (`--logo-navy`, `--logo-green`), o que permite a versão clara no rodapé.

## Acessibilidade e responsividade

Layout mobile-first (menu hambúrguer, filtros recolhíveis), link "pular para o conteúdo", foco visível, rótulos e mensagens de erro nos formulários (`aria-invalid`), região `aria-live` no chat e respeito a `prefers-reduced-motion`.

## Limitações (é um protótipo)

- **Login não é seguro de verdade.** Tudo roda no cliente: as contas de demonstração estão visíveis no código, quem abrir o DevTools vê e altera tudo, e os dados ficam só no navegador do usuário. Em produção, autenticação, vagas e leads precisam de backend e banco de dados.
- **Sem WhatsApp real.** A integração real usaria a WhatsApp Business API, com consentimento do candidato (LGPD) para tratar CPF.
- Dados salvos em um navegador não aparecem em outro.

## Próximos passos sugeridos

Backend com autenticação e recuperação de senha, edição/pausa de vagas, envio real via WhatsApp Business API, painel de candidatos com status (triado, contatado, contratado) e conformidade com a LGPD.
