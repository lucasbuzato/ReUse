/** Traduções pt-BR específicas do ReUse! (o restante da interface usa o pt-BR nativo do AdminJS). */
export const adminTranslations = {
  labels: {
    Item: "Itens",
    Category: "Categorias",
    Interest: "Interesses",
    User: "Usuários",
    Plataforma: "Plataforma",
    Pessoas: "Pessoas",
    dashboard: "Painel",
  },
  messages: {
    forbiddenError: "Você não tem permissão para executar esta ação. O perfil de visualização é somente leitura.",
    error404Resource: "O recurso solicitado não foi encontrado.",
    error404Action: "Esta ação não existe ou não está disponível para o seu perfil de acesso.",
    error404Record: "O registro solicitado não existe ou não está disponível para o seu perfil de acesso.",
  },
  actions: {
    markDonated: "Marcar como doado",
    pauseItem: "Pausar anúncio",
    reactivateItem: "Reativar anúncio",
  },
  properties: {
    id: "ID",
    createdAt: "Criado em",
  },
  components: {
    Login: {
      welcomeHeader: "Painel ReUse!",
      welcomeMessage:
        "Área administrativa low-code da plataforma de troca e doação de itens. Acesso restrito à equipe e à banca avaliadora.",
    },
  },
  resources: {
    Item: {
      properties: {
        title: "Título",
        description: "Descrição",
        condition: "Estado de conservação",
        imageUrl: "Imagem",
        status: "Status",
        category: "Categoria",
        owner: "Doador(a)",
        createdAt: "Publicado em",
      },
    },
    Category: {
      properties: { name: "Nome" },
    },
    Interest: {
      properties: {
        item: "Item",
        user: "Interessado(a)",
        message: "Mensagem",
        createdAt: "Enviado em",
      },
    },
    User: {
      properties: {
        name: "Nome",
        email: "E-mail",
        city: "Cidade",
        role: "Perfil de acesso",
        utmSource: "Origem (utm_source)",
        utmMedium: "Mídia (utm_medium)",
        utmCampaign: "Campanha (utm_campaign)",
        newPassword: "Nova senha",
        createdAt: "Cadastrado em",
      },
    },
  },
};
