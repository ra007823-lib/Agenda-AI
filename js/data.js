/* =========================================================
   Conecta+ — Dados fictícios centralizados
   Edite aqui para alterar vagas, empresas, perfil e contatos.
   ========================================================= */
window.DATA = {
  platform: {
    name: "Conecta+",
    tagline: "Conectando talentos a boas oportunidades",
    whatsapp: "5511999990000", // número fictício (apenas demonstrativo)
    whatsappLabel: "(11) 99999-0000",
    email: "contato@conectamais.exemplo",
    address: "Av. Exemplo, 1000 — São Paulo, SP",
    hours: "Seg a Sex, das 8h às 18h",
  },

  categories: ["Tecnologia", "Saúde", "Vendas", "Administrativo", "Design", "Educação", "Logística", "Atendimento"],
  modalities: ["Presencial", "Híbrido", "Remoto"],
  contracts: ["CLT", "PJ", "Estágio", "Temporário"],

  companies: [
    {
      id: "novatech", name: "NovaTech Soluções", initials: "NT", color: "#1F3A5F",
      sector: "Tecnologia", city: "São Paulo, SP", size: "200–500 colaboradores",
      description: "Desenvolvemos software sob medida e plataformas digitais para empresas de varejo, finanças e saúde. Cultura de aprendizado contínuo e times autônomos.",
    },
    {
      id: "vidaplena", name: "Vida Plena Clínicas", initials: "VP", color: "#2D8C68",
      sector: "Saúde", city: "Belo Horizonte, MG", size: "500–1.000 colaboradores",
      description: "Rede de clínicas multiespecialidades focada em cuidado humanizado, com atendimento presencial e telemedicina em todo o estado.",
    },
    {
      id: "horizonte", name: "Horizonte Logística", initials: "HL", color: "#B45309",
      sector: "Logística", city: "Campinas, SP", size: "1.000+ colaboradores",
      description: "Operador logístico com centros de distribuição em 6 estados. Investimos em automação e na segurança das nossas equipes.",
    },
    {
      id: "casaverde", name: "Casa Verde Varejo", initials: "CV", color: "#7C3AED",
      sector: "Varejo", city: "Curitiba, PR", size: "100–200 colaboradores",
      description: "Rede de lojas de casa e decoração sustentável. Atendimento próximo, plano de carreira e foco em experiência do cliente.",
    },
    {
      id: "atlas", name: "Atlas Educação", initials: "AE", color: "#0E7490",
      sector: "Educação", city: "Recife, PE", size: "50–100 colaboradores",
      description: "Edtech de cursos profissionalizantes online. Nossa missão é democratizar o acesso a formação de qualidade em todo o Brasil.",
    },
  ],

  jobs: [
    {
      id: "j1", title: "Desenvolvedor(a) Front-end Pleno", company: "novatech", category: "Tecnologia",
      location: "São Paulo, SP", modality: "Híbrido", contract: "CLT", salaryMin: 7000, salaryMax: 10000, daysAgo: 1, featured: true,
      summary: "Construa interfaces modernas e acessíveis para produtos usados por milhares de pessoas.",
      description: "Você fará parte de um time de produto responsável por evoluir nossa plataforma web, colaborando com design e back-end em ciclos quinzenais.",
      requirements: ["3+ anos com HTML, CSS e JavaScript", "Experiência com React ou similar", "Noções de acessibilidade (WCAG)", "Git e boas práticas de code review"],
      benefits: ["Vale-refeição R$ 1.000", "Plano de saúde e odontológico", "Auxílio home office", "Day off no aniversário"],
      hiring: "Processo com 3 etapas: triagem, desafio técnico e conversa final. Retorno em até 7 dias.",
    },
    {
      id: "j2", title: "Analista de Suporte Técnico", company: "novatech", category: "Tecnologia",
      location: "Remoto — Brasil", modality: "Remoto", contract: "CLT", salaryMin: 3200, salaryMax: 4200, daysAgo: 3, featured: false,
      summary: "Apoie clientes na resolução de incidentes e na utilização das nossas plataformas.",
      description: "Atendimento de 2º nível via chat e e-mail, registro de ocorrências e colaboração com o time de desenvolvimento para correções.",
      requirements: ["Ensino médio completo (superior em andamento é um diferencial)", "Boa comunicação escrita", "Conhecimento básico de redes e sistemas", "Organização e empatia"],
      benefits: ["Vale-alimentação", "Plano de saúde", "Auxílio internet", "Cursos e certificações"],
      hiring: "Escala 6x1 com horário comercial. Contratação imediata.",
    },
    {
      id: "j3", title: "Enfermeiro(a) Assistencial", company: "vidaplena", category: "Saúde",
      location: "Belo Horizonte, MG", modality: "Presencial", contract: "CLT", salaryMin: 4800, salaryMax: 5800, daysAgo: 2, featured: true,
      summary: "Cuide de pacientes com excelência em uma rede reconhecida pelo atendimento humanizado.",
      description: "Atuação em unidade ambulatorial: triagem, procedimentos, orientação a pacientes e apoio às equipes médicas.",
      requirements: ["Graduação em Enfermagem e COREN ativo", "Experiência mínima de 1 ano", "Disponibilidade para escala 12x36", "Perfil acolhedor"],
      benefits: ["Plano de saúde extensivo à família", "Vale-transporte", "Adicional noturno", "Convênio com academias"],
      hiring: "Entrevista presencial e avaliação prática. Início em até 15 dias.",
    },
    {
      id: "j4", title: "Recepcionista de Clínica", company: "vidaplena", category: "Atendimento",
      location: "Belo Horizonte, MG", modality: "Presencial", contract: "CLT", salaryMin: 2100, salaryMax: 2500, daysAgo: 5, featured: false,
      summary: "Seja o primeiro sorriso que nossos pacientes encontram ao chegar.",
      description: "Recepção, agendamento de consultas, confirmação de presença e apoio administrativo ao time da unidade.",
      requirements: ["Ensino médio completo", "Experiência com atendimento ao público", "Pacote Office básico", "Boa dicção e postura"],
      benefits: ["Vale-refeição", "Vale-transporte", "Plano odontológico", "Uniforme"],
      hiring: "Contratação CLT com 45 dias de experiência.",
    },
    {
      id: "j5", title: "Analista de Logística Júnior", company: "horizonte", category: "Logística",
      location: "Campinas, SP", modality: "Presencial", contract: "CLT", salaryMin: 3500, salaryMax: 4500, daysAgo: 4, featured: true,
      summary: "Acompanhe rotas, estoques e indicadores em um centro de distribuição de alta performance.",
      description: "Planejamento de expedição, controle de indicadores (OTIF, lead time) e interface com transportadoras e clientes internos.",
      requirements: ["Superior cursando ou completo em Logística/Administração", "Excel intermediário", "Raciocínio analítico", "Vivência em WMS é um diferencial"],
      benefits: ["Fretado", "Vale-alimentação R$ 900", "Plano de saúde", "PLR semestral"],
      hiring: "Duas etapas: dinâmica em grupo e entrevista com gestor.",
    },
    {
      id: "j6", title: "Operador(a) de Empilhadeira", company: "horizonte", category: "Logística",
      location: "Campinas, SP", modality: "Presencial", contract: "CLT", salaryMin: 2600, salaryMax: 3100, daysAgo: 7, featured: false,
      summary: "Movimentação segura de cargas no centro de distribuição.",
      description: "Operação de empilhadeira, organização de paletes e conferência de mercadorias seguindo normas de segurança.",
      requirements: ["Curso de operador de empilhadeira (NR-11)", "Experiência de 1 ano", "Atenção a normas de segurança", "Turno rotativo"],
      benefits: ["Fretado", "Cesta básica", "Plano de saúde", "Adicional de periculosidade"],
      hiring: "Exame admissional e prova prática.",
    },
    {
      id: "j7", title: "Consultor(a) de Vendas — Decoração", company: "casaverde", category: "Vendas",
      location: "Curitiba, PR", modality: "Presencial", contract: "CLT", salaryMin: 2400, salaryMax: 4800, daysAgo: 2, featured: true,
      summary: "Ajude clientes a transformar ambientes com produtos sustentáveis. Salário fixo + comissão.",
      description: "Atendimento consultivo em loja, montagem de propostas e acompanhamento pós-venda para fidelização de clientes.",
      requirements: ["Experiência em vendas varejistas", "Gosto por decoração e design", "Comunicação e proatividade", "Disponibilidade aos fins de semana (escala)"],
      benefits: ["Comissão sem teto", "Vale-refeição", "Desconto em produtos", "Plano de carreira"],
      hiring: "Entrevista na loja e período de ambientação paga.",
    },
    {
      id: "j8", title: "Designer de Produto (UX/UI)", company: "novatech", category: "Design",
      location: "Remoto — Brasil", modality: "Remoto", contract: "PJ", salaryMin: 8000, salaryMax: 12000, daysAgo: 6, featured: false,
      summary: "Desenhe fluxos e interfaces que simplificam a vida de pessoas e empresas.",
      description: "Pesquisa com usuários, prototipação, design system e acompanhamento da implementação junto ao time de engenharia.",
      requirements: ["Portfólio com projetos de produto digital", "Domínio de Figma", "Conhecimento em pesquisa e testes de usabilidade", "Visão de design system"],
      benefits: ["Contrato PJ flexível", "Horário flexível", "Verba para cursos", "Equipamentos fornecidos"],
      hiring: "Análise de portfólio, case prático e conversa com o time.",
    },
    {
      id: "j9", title: "Professor(a) Tutor(a) de Marketing Digital", company: "atlas", category: "Educação",
      location: "Recife, PE", modality: "Híbrido", contract: "CLT", salaryMin: 3800, salaryMax: 5200, daysAgo: 8, featured: false,
      summary: "Apoie alunos em cursos online com mentorias e correção de projetos.",
      description: "Mentorias ao vivo, correção de atividades, criação de materiais complementares e acompanhamento do desempenho das turmas.",
      requirements: ["Experiência prática em marketing digital", "Didática e boa oratória", "Disponibilidade nas noites de terça e quinta", "Graduação em áreas afins"],
      benefits: ["Vale-alimentação", "Plano de saúde", "Cursos gratuitos", "Dia de folga mensal"],
      hiring: "Aula teste de 15 minutos e entrevista com a coordenação.",
    },
    {
      id: "j10", title: "Assistente Administrativo", company: "casaverde", category: "Administrativo",
      location: "Curitiba, PR", modality: "Híbrido", contract: "CLT", salaryMin: 2500, salaryMax: 3000, daysAgo: 9, featured: false,
      summary: "Apoie as rotinas administrativas e financeiras da matriz.",
      description: "Emissão de notas, conciliação de pedidos, atendimento a fornecedores e organização de documentos.",
      requirements: ["Ensino médio completo", "Excel básico/intermediário", "Organização e atenção a detalhes", "Experiência anterior desejável"],
      benefits: ["Vale-refeição", "Vale-transporte", "Plano de saúde", "Home office 2x por semana"],
      hiring: "Entrevista com RH e gestor. Início imediato.",
    },
    {
      id: "j11", title: "Estagiário(a) de Marketing", company: "atlas", category: "Design",
      location: "Remoto — Brasil", modality: "Remoto", contract: "Estágio", salaryMin: 1400, salaryMax: 1800, daysAgo: 1, featured: false,
      summary: "Aprenda na prática criando conteúdos e campanhas para uma edtech em crescimento.",
      description: "Apoio na criação de posts, e-mails e relatórios de desempenho. Mentoria semanal com a líder da área.",
      requirements: ["Cursando Comunicação, Marketing ou Design", "Criatividade e boa escrita", "Noções de redes sociais", "Disponibilidade de 6h/dia"],
      benefits: ["Bolsa-auxílio", "Recesso remunerado", "Mentoria", "Possibilidade de efetivação"],
      hiring: "Triagem de perfil e conversa com a líder. Contrato de 6 meses.",
    },
    {
      id: "j12", title: "Atendente de Central — Telemedicina", company: "vidaplena", category: "Atendimento",
      location: "Remoto — Brasil", modality: "Remoto", contract: "Temporário", salaryMin: 1900, salaryMax: 2300, daysAgo: 10, featured: false,
      summary: "Atenda pacientes por telefone e chat e oriente o agendamento de teleconsultas.",
      description: "Contrato temporário de 3 meses com possibilidade de efetivação. Treinamento remoto e supervisão próxima.",
      requirements: ["Ensino médio completo", "Computador e internet estável", "Comunicação clara e empática", "Disponibilidade em turno de 6h"],
      benefits: ["Vale-alimentação", "Auxílio internet", "Treinamento remunerado", "Possibilidade de efetivação"],
      hiring: "Entrevista por vídeo e treinamento de 1 semana.",
    },
  ],

  // Contas de demonstração das empresas (login simulado, somente no navegador)
  accounts: [
    { company: "novatech", email: "rh@novatech.exemplo", password: "demo123" },
    { company: "vidaplena", email: "rh@vidaplena.exemplo", password: "demo123" },
    { company: "horizonte", email: "rh@horizonte.exemplo", password: "demo123" },
    { company: "casaverde", email: "rh@casaverde.exemplo", password: "demo123" },
    { company: "atlas", email: "rh@atlas.exemplo", password: "demo123" },
  ],

  // Candidatos fictícios que já passaram pela triagem do WhatsApp
  sampleLeads: [
    { id: "s1", name: "Carlos Henrique Lima", cpf: "***.456.789-**", area: "Tecnologia", jobId: "j1", companyIds: ["novatech"], at: "2026-11-12T14:20:00" },
    { id: "s2", name: "Juliana Ferreira Costa", cpf: "***.321.654-**", area: "Saúde", jobId: "j3", companyIds: ["vidaplena"], at: "2026-11-13T09:05:00" },
    { id: "s3", name: "Rafael Almeida Prado", cpf: "***.159.753-**", area: "Logística", jobId: "j5", companyIds: ["horizonte"], at: "2026-11-13T16:40:00" },
    { id: "s4", name: "Beatriz Nogueira Silva", cpf: "***.852.741-**", area: "Vendas", jobId: "j7", companyIds: ["casaverde"], at: "2026-11-14T08:15:00" },
  ],

  profile: {
    name: "Mariana Souza", initials: "MS", role: "Desenvolvedora Front-end",
    location: "São Paulo, SP", email: "mariana.souza@exemplo.com", availability: "Disponível para novas oportunidades",
    about: "Profissional apaixonada por criar interfaces acessíveis e bem pensadas. Busco um time colaborativo onde possa crescer em produto e design de interfaces.",
    interests: ["Tecnologia", "Design", "Educação"],
    skills: ["HTML & CSS", "JavaScript", "React", "Acessibilidade", "Figma", "Git", "Comunicação", "Trabalho em equipe"],
    experience: [
      { role: "Desenvolvedora Front-end Júnior", org: "Studio Pixel", period: "2023 — atual", text: "Desenvolvimento de sites e sistemas web responsivos para clientes de diversos segmentos." },
      { role: "Estagiária de Desenvolvimento", org: "Agência Alfa", period: "2022 — 2023", text: "Manutenção de landing pages e apoio na criação de componentes reutilizáveis." },
    ],
    education: [
      { course: "Análise e Desenvolvimento de Sistemas", org: "Universidade Exemplo", period: "2021 — 2024" },
      { course: "Curso de UX Design", org: "Atlas Educação", period: "2023" },
    ],
  },
};
