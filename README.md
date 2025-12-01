# 🌟 FriendCircle

Rede social privada por convite - apenas amigos!

## ✨ Funcionalidades

- 🔐 **Login e Cadastro** - Sistema de autenticação seguro
- 💌 **Sistema de Convites** - Só entra quem for convidado
- 📱 **Feed de Posts** - Compartilhe momentos com seus amigos
- 📷 **Upload de Fotos** - Nas postagens e perfil
- ❤️ **Curtidas e Comentários** - Interaja com os posts
- 🔔 **Notificações** - Fique por dentro de tudo
- 👤 **Perfis Personalizados** - Emoji, bio e cor

## 🚀 Instalação Rápida

### Pré-requisitos

- Python 3.8+
- Node.js 18+
- npm ou yarn

### Passo 1: Backend

```bash
cd backend
pip install -r requirements.txt
python app.py
```

O backend estará rodando em: **http://localhost:5000**

### Passo 2: Frontend (outro terminal)

```bash
cd web
npm install
npm start
```

O site abrirá em: **http://localhost:3000**

## 📝 Primeiro Acesso

1. Acesse http://localhost:3000
2. Clique em "Criar conta"
3. O primeiro usuário será **administrador**
4. Depois, convide seus amigos pelo sistema de convites!

## 🗂️ Estrutura do Projeto

```
friendcircle/
├── backend/
│   ├── app.py              # API Flask
│   ├── requirements.txt    # Dependências Python
│   ├── friendcircle.db     # Banco de dados (criado automaticamente)
│   └── uploads/            # Fotos enviadas
│
├── web/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── App.js          # Aplicação React
│   │   └── index.js
│   └── package.json
│
└── README.md
```

## 🔧 API Endpoints

### Autenticação
- `POST /api/auth/register` - Criar conta
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Dados do usuário logado

### Perfil
- `PUT /api/profile` - Atualizar perfil
- `POST /api/profile/avatar` - Upload de foto

### Posts
- `GET /api/posts` - Listar posts
- `POST /api/posts` - Criar post
- `POST /api/posts/:id/like` - Curtir/descurtir
- `GET /api/posts/:id/comments` - Listar comentários
- `POST /api/posts/:id/comments` - Comentar

### Convites
- `GET /api/invites` - Listar convites
- `POST /api/invites` - Criar convite

### Notificações
- `GET /api/notifications` - Listar notificações
- `POST /api/notifications/read` - Marcar como lidas

## 🎨 Tecnologias

**Backend:**
- Flask (Python)
- SQLAlchemy (ORM)
- JWT (Autenticação)
- SQLite (Banco de dados)

**Frontend:**
- React
- React Router
- Axios
- CSS-in-JS

## 📱 Para o Futuro

- [ ] App mobile (React Native)
- [ ] Upload de vídeos
- [ ] Chat em tempo real
- [ ] Stories
- [ ] Modo escuro/claro

---

Feito com ❤️ para conectar amigos!
