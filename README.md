# 🛒 Lista de Supermercado - SaaS

Uma plataforma SaaS completa para criação e gerenciamento de listas de compras de supermercado, com integração ao Mercado Pago para pagamentos via PIX e cartão de crédito.

## 📋 Funcionalidades

### ✨ Principais Recursos

- **Gerenciamento de Listas**: Crie e organize múltiplas listas de compras
- **Controle de Itens**: Adicione itens com quantidade, preço, categoria e notas
- **Cálculo Automático**: Total estimado das compras calculado automaticamente
- **Sistema de Assinatura**: Três planos (Free, Basic, Premium)
- **Pagamentos Integrados**: Pagamento via PIX ou cartão de crédito com Mercado Pago
- **Autenticação Segura**: Sistema completo de login e registro com JWT

### 📊 Planos Disponíveis

#### Free
- Até 3 listas ativas
- Até 20 itens por lista
- Suporte básico
- **Grátis**

#### Basic - R$ 19,90/mês
- Até 10 listas ativas
- Até 50 itens por lista
- Suporte básico

#### Premium - R$ 39,90/mês
- Listas ilimitadas
- Itens ilimitados
- Suporte prioritário
- Analytics avançados

## 🚀 Tecnologias Utilizadas

### Backend
- **Node.js** - Runtime JavaScript
- **Express** - Framework web
- **MongoDB** - Banco de dados NoSQL
- **Mongoose** - ODM para MongoDB
- **JWT** - Autenticação
- **Mercado Pago SDK** - Integração de pagamentos
- **bcryptjs** - Criptografia de senhas

### Frontend
- **HTML5** - Estrutura
- **CSS3** - Estilos responsivos
- **JavaScript (Vanilla)** - Interatividade
- **Mercado Pago JS SDK** - Formulário de pagamento

## 📦 Instalação

### Pré-requisitos

- Node.js (v14 ou superior)
- MongoDB (v4.4 ou superior)
- Conta no Mercado Pago (para obter as credenciais de API)

### Passo a Passo

1. **Clone o repositório**
```bash
git clone https://github.com/alcanceplanilhas-collab/testeleitorQrcode.git
cd testeleitorQrcode
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure as variáveis de ambiente**
```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas credenciais:
```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/supermarket-list-saas

# JWT Secret (gere uma chave forte e aleatória)
JWT_SECRET=sua-chave-secreta-super-segura-aqui

# Mercado Pago Configuration
MERCADO_PAGO_ACCESS_TOKEN=seu-access-token-do-mercado-pago
MERCADO_PAGO_PUBLIC_KEY=sua-chave-publica-do-mercado-pago

# Application URL
APP_URL=http://localhost:3000
```

4. **Obtenha as credenciais do Mercado Pago**

- Acesse: https://www.mercadopago.com.br/developers/panel
- Faça login ou crie uma conta
- Vá em "Suas integrações" > "Criar aplicação"
- Copie o **Access Token** e a **Public Key**
- Para testes, use as credenciais de **Teste**
- Para produção, solicite credenciais de **Produção**

5. **Inicie o MongoDB**

Se estiver usando MongoDB local:
```bash
# Linux/Mac
sudo systemctl start mongod

# Windows
net start MongoDB

# Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

6. **Inicie o servidor**
```bash
# Modo desenvolvimento (com auto-reload)
npm run dev

# Modo produção
npm start
```

O servidor estará rodando em: http://localhost:3000

## 🔧 Configuração do Mercado Pago

### Obter Credenciais de Teste

1. Acesse o [Painel de Desenvolvedor do Mercado Pago](https://www.mercadopago.com.br/developers/panel)
2. Clique em "Suas integrações"
3. Clique em "Criar aplicação"
4. Preencha os dados da aplicação
5. Na seção "Credenciais", copie:
   - **Access Token de Teste**: Para o `.env` como `MERCADO_PAGO_ACCESS_TOKEN`
   - **Public Key de Teste**: Para o `public/js/api.js` como `MERCADO_PAGO_PUBLIC_KEY`

### Testar Pagamentos

Para testar pagamentos, use os [cartões de teste do Mercado Pago](https://www.mercadopago.com.br/developers/pt/docs/checkout-api/integration-test/test-cards):

**Cartão aprovado:**
- Número: 5031 4332 1540 6351
- CVV: 123
- Validade: 11/25
- Nome: APRO

**PIX de teste:**
- Ao gerar o QR Code em ambiente de teste, o pagamento será aprovado automaticamente após alguns segundos

## 📁 Estrutura do Projeto

```
testeleitorQrcode/
├── server/
│   ├── models/
│   │   ├── User.js              # Model de usuário
│   │   ├── ShoppingList.js      # Model de lista de compras
│   │   └── Payment.js           # Model de pagamento
│   ├── routes/
│   │   ├── auth.js              # Rotas de autenticação
│   │   ├── shoppingLists.js     # Rotas de listas
│   │   └── payments.js          # Rotas de pagamentos
│   ├── middleware/
│   │   └── auth.js              # Middleware de autenticação
│   ├── services/
│   │   └── mercadoPagoService.js # Integração Mercado Pago
│   └── index.js                 # Servidor principal
├── public/
│   ├── index.html               # Interface principal
│   ├── css/
│   │   └── styles.css           # Estilos
│   └── js/
│       ├── api.js               # Cliente API
│       └── app.js               # Lógica da aplicação
├── .env.example                 # Exemplo de variáveis de ambiente
├── .gitignore
├── package.json
└── README.md
```

## 🔐 API Endpoints

### Autenticação

- `POST /api/auth/register` - Registrar novo usuário
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Obter perfil do usuário (requer autenticação)
- `PUT /api/auth/me` - Atualizar perfil (requer autenticação)

### Listas de Compras

- `GET /api/lists` - Listar todas as listas do usuário
- `GET /api/lists/:id` - Obter uma lista específica
- `POST /api/lists` - Criar nova lista
- `PUT /api/lists/:id` - Atualizar lista
- `DELETE /api/lists/:id` - Excluir lista
- `POST /api/lists/:id/items` - Adicionar item à lista
- `PUT /api/lists/:id/items/:itemId` - Atualizar item
- `DELETE /api/lists/:id/items/:itemId` - Remover item

### Pagamentos

- `GET /api/payments/plans` - Listar planos disponíveis
- `POST /api/payments/pix` - Criar pagamento PIX
- `POST /api/payments/credit-card` - Criar pagamento com cartão
- `POST /api/payments/preference` - Criar preferência de pagamento
- `GET /api/payments/:id/status` - Consultar status do pagamento
- `GET /api/payments/history` - Histórico de pagamentos
- `POST /api/payments/webhook` - Webhook do Mercado Pago

## 🎨 Interface do Usuário

A aplicação possui uma interface moderna e responsiva com:

- **Página de Login/Registro**: Acesso à plataforma
- **Dashboard**: Visualização de todas as listas
- **Detalhes da Lista**: Gerenciamento completo de itens
- **Planos e Assinatura**: Upgrade de plano com pagamento integrado
- **Perfil**: Gerenciamento de dados do usuário

## 🔒 Segurança

- Senhas criptografadas com bcrypt
- Autenticação JWT com tokens
- Validação de dados no backend
- Proteção contra injeção SQL/NoSQL
- HTTPS recomendado em produção
- Variáveis de ambiente para dados sensíveis

## 🚀 Deploy em Produção

### Requisitos

1. **Servidor**: VPS, AWS, Heroku, DigitalOcean, etc.
2. **MongoDB**: MongoDB Atlas (recomendado) ou servidor próprio
3. **Certificado SSL**: Let's Encrypt (gratuito)
4. **Credenciais de Produção**: Mercado Pago em modo produção

### Passos

1. Configure as variáveis de ambiente para produção
2. Use `NODE_ENV=production`
3. Configure um proxy reverso (Nginx recomendado)
4. Configure SSL/HTTPS
5. Configure o webhook do Mercado Pago para sua URL de produção
6. Monitore logs e erros

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/NovaFuncionalidade`)
3. Commit suas mudanças (`git commit -m 'feat: adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/NovaFuncionalidade`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo LICENSE para mais detalhes.

## 🐛 Problemas Conhecidos

- O formulário de cartão de crédito requer configuração adicional da Public Key do Mercado Pago
- Webhooks funcionam apenas com URL pública (use ngrok para testes locais)

## 📞 Suporte

Para dúvidas ou problemas:
- Abra uma issue no GitHub
- Consulte a [documentação do Mercado Pago](https://www.mercadopago.com.br/developers/pt/docs)

## 🎯 Roadmap

- [ ] Compartilhamento de listas entre usuários
- [ ] Categorias personalizadas
- [ ] Histórico de compras
- [ ] Sugestões inteligentes de produtos
- [ ] Integração com APIs de supermercados
- [ ] App mobile (React Native)
- [ ] Modo offline
- [ ] Exportação para PDF

## ⭐ Agradecimentos

Desenvolvido como projeto SaaS completo com integração de pagamentos para gerenciamento de listas de supermercado.

---

**Desenvolvido com ❤️ usando Node.js e Mercado Pago**
