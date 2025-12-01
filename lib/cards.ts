// Estrutura de dados das cartas do jogo estilo Perfil
// Cada carta contém uma entidade (resposta) e 10 dicas progressivas

export interface Card {
  id: number;
  nome: string;
  dicas: string[];
}

export const gameCards: Card[] = [
  {
    id: 1,
    nome: "Experiência do Usuário (UX)",
    dicas: [
      "Estou ligado à forma como uma pessoa se sente ao usar um produto ou serviço.",
      "Não sou apenas \"interface bonita\"; vou além da aparência.",
      "Envolvo emoções, percepções e opiniões do usuário.",
      "Um dos meus objetivos é reduzir frustração e aumentar satisfação.",
      "Levo em conta se o sistema é útil e se realmente resolve um problema real.",
      "A minha qualidade é influenciada por fatores como usabilidade, acessibilidade e confiança.",
      "Posso ser positivo (agradável) ou negativo (confuso, frustrante).",
      "Sou muito estudado por autores como Don Norman e Jesse James Garrett.",
      "Estou presente tanto em aplicativos digitais quanto em ambientes físicos inteligentes.",
      "Meu nome em inglês é \"User Experience\"."
    ]
  },
  {
    id: 2,
    nome: "Interface do Usuário (UI)",
    dicas: [
      "Sou a \"parte visível\" de um sistema para o usuário.",
      "Posso aparecer como botões, ícones, menus e telas.",
      "Também posso ser comandos de voz, gestos e até interfaces multimodais.",
      "Sirvo como ponto de contato entre o ser humano e a tecnologia.",
      "Minha qualidade pode facilitar ou dificultar a interação.",
      "Preciso ser clara, consistente e previsível.",
      "Niels Jakob Nielsen propõe heurísticas importantes para me avaliar.",
      "Sou muito usada como exemplo em apps, sites, painéis de carros e smart TVs.",
      "Estou sempre ligada, mas não sou a mesma coisa que a experiência completa do usuário.",
      "Meu nome em inglês é \"User Interface\"."
    ]
  },
  {
    id: 3,
    nome: "Ambiente inteligente",
    dicas: [
      "Sou um espaço físico que contém tecnologia capaz de perceber e reagir ao contexto.",
      "Posso estar presente em casas, escritórios, cidades ou veículos.",
      "Dependo de sensores, conectividade e automação.",
      "Monitoro coisas como luz, temperatura, movimento e localização.",
      "Costumo estar associado à Internet das Coisas (IoT).",
      "Adapto-me ao perfil e às preferências dos usuários.",
      "Posso ligar luzes automaticamente ou ajustar a temperatura sem intervenção humana direta.",
      "Tenho grande potencial, mas posso ser confuso se a UX e a UI forem mal planejadas.",
      "Estou ligado a conceitos como \"smart home\" e \"smart city\".",
      "Meu nome chama atenção por sugerir que quase \"penso\" sozinho."
    ]
  },
  {
    id: 4,
    nome: "Casa inteligente (Smart home)",
    dicas: [
      "Sou uma aplicação específica de ambientes inteligentes.",
      "Vivo dentro de residências.",
      "Controle de luz, temperatura e segurança costumam fazer parte de mim.",
      "Posso ser comandada por voz, aplicativos ou até por gestos.",
      "Assistentes como Alexa, Google Assistant e outros costumam morar comigo.",
      "Minha automação pode incluir ligar/desligar luzes, trancar portas e acionar eletrodomésticos.",
      "Minha usabilidade é crucial: se for difícil de configurar, o morador se irrita.",
      "Se eu for bem projetada, faço a vida das pessoas mais confortável e eficiente.",
      "Dependo de dispositivos conectados, sensores e rede Wi‑Fi.",
      "Em inglês, sou conhecida como \"smart home\"."
    ]
  },
  {
    id: 5,
    nome: "Carro inteligente",
    dicas: [
      "Sou um tipo de ambiente inteligente em movimento.",
      "Costumo ter painéis digitais, sensores e sistemas de assistência ao motorista.",
      "Uso interfaces multimodais: telas, botões físicos, voz e às vezes gestos.",
      "Preciso tomar muito cuidado com distrações, pois a segurança é prioridade.",
      "Minha interface costuma simplificar a exibição de informações enquanto estou em movimento.",
      "Posso incluir piloto automático, controle de faixa e alertas de colisão.",
      "Integro-me facilmente ao smartphone do usuário.",
      "Uma boa UX em mim ajuda a reduzir acidentes e estresse ao dirigir.",
      "Sou parte da visão de mobilidade nas chamadas \"cidades inteligentes\".",
      "Sou chamado de \"carro inteligente\" ou \"veículo conectado\"."
    ]
  },
  {
    id: 6,
    nome: "Dispositivo vestível (Wearable)",
    dicas: [
      "Sou um dispositivo pensado para ser usado no corpo.",
      "Posso ser um relógio, pulseira, óculos ou até roupa inteligente.",
      "Monitoro sinais vitais, passos, sono e outras atividades físicas.",
      "Normalmente tenho tela pequena e interações rápidas.",
      "Minha UX precisa ser extremamente simples: poucos toques, notificações curtas.",
      "Dependo de integração com o smartphone para muitas funções.",
      "Tenho papel importante em saúde digital e bem-estar.",
      "Também posso trabalhar integrado a ambientes inteligentes, como casas e cidades.",
      "Minha forma em inglês é bastante conhecida no mundo da tecnologia.",
      "Sou chamado de \"wearable device\"."
    ]
  },
  {
    id: 7,
    nome: "Cidade inteligente (Smart city)",
    dicas: [
      "Sou uma aplicação em larga escala de tecnologias conectadas.",
      "Envolvo transporte público, energia, segurança, serviços públicos e informação.",
      "Utilizo sensores e dados em tempo real para melhorar o funcionamento da cidade.",
      "Sistemas de estacionamento inteligente e mobilidade urbana fazem parte de mim.",
      "Minha eficácia depende de aplicativos e painéis com boa UX e UI.",
      "Posso usar Realidade Aumentada para navegação ou informação contextual.",
      "Busco tornar a vida dos cidadãos mais eficiente, segura e sustentável.",
      "Posso ser prejudicada se meus sistemas forem confusos ou pouco confiáveis.",
      "Sou um passo além da simples automação de edifícios.",
      "Em inglês, sou conhecida como \"smart city\"."
    ]
  },
  {
    id: 8,
    nome: "Acessibilidade digital",
    dicas: [
      "Sou um princípio importante dentro de UX.",
      "Tenho foco em permitir que todas as pessoas usem produtos e serviços, inclusive pessoas com deficiência.",
      "Levo em conta aspectos visuais, auditivos, motores e cognitivos.",
      "Incluo práticas como bom contraste de cores, textos legíveis e alternativas em áudio.",
      "Diretrizes internacionais, como as da W3C (WCAG), orientam o meu uso.",
      "Em ambientes inteligentes, posso envolver comandos de voz, feedback tátil e legendas.",
      "Estou relacionada à inclusão e aos direitos das pessoas.",
      "Uma interface pode ser usável para alguns, mas ruim em mim se excluir outros grupos.",
      "Torno sistemas mais justos, éticos e abrangentes.",
      "Sou essencial em projetos centrados no usuário, principalmente em ambientes públicos."
    ]
  },
  {
    id: 9,
    nome: "Realidade Aumentada (AR)",
    dicas: [
      "Sou uma tecnologia que mistura mundo real com elementos virtuais.",
      "Preciso de câmera, tela e processamento para funcionar.",
      "Não \"apago\" o mundo físico: apenas adiciono informações sobre ele.",
      "Posso ser usada em celulares, tablets ou óculos específicos.",
      "Estou presente em jogos famosos, como Pokémon GO.",
      "Ajudo na navegação, colocando setas virtuais sobre ruas reais (como no Google Maps Live View).",
      "Sou usada em manutenção industrial, sobrepondo instruções em máquinas de verdade.",
      "Apareço em educação, permitindo visualizar modelos 3D na sala de aula.",
      "Em ambientes inteligentes, posso mostrar dados de dispositivos IoT \"em cima\" dos objetos reais.",
      "Em inglês, sou chamada de \"Augmented Reality\" e minha sigla é AR."
    ]
  },
  {
    id: 10,
    nome: "Usabilidade",
    dicas: [
      "Sou um atributo de qualidade muito importante em UX.",
      "Estou ligado à facilidade de uso de um sistema.",
      "Envolvo quão fácil é aprender, lembrar e operar uma interface.",
      "Também incluo a frequência e a gravidade de erros cometidos pelos usuários.",
      "Jakob Nielsen escreveu bastante sobre mim.",
      "Suas heurísticas de usabilidade ajudam a avaliar e melhorar minha qualidade.",
      "Se eu for boa, o usuário realiza tarefas com menos esforço e mais rapidez.",
      "Em ambientes inteligentes, reduzo a complexidade de interações com muitos dispositivos.",
      "Uma interface bonita, mas ruim em mim, gera frustração.",
      "Sou um dos pilares da Experiência do Usuário."
    ]
  }
];
