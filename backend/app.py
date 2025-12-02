"""
FriendCircle - Backend API v1.2
"""

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta
import os
import uuid
import secrets

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

app.config['SECRET_KEY'] = 'dev-secret-key'
app.config['JWT_SECRET_KEY'] = 'jwt-secret-key'
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(days=30)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///friendcircle.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['UPLOAD_FOLDER'] = 'uploads'

os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
os.makedirs(os.path.join(app.config['UPLOAD_FOLDER'], 'avatars'), exist_ok=True)
os.makedirs(os.path.join(app.config['UPLOAD_FOLDER'], 'posts'), exist_ok=True)

db = SQLAlchemy(app)
jwt = JWTManager(app)

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# ══════════════════════════════════════════════════════════════════════════════
# MODELOS
# ══════════════════════════════════════════════════════════════════════════════

likes = db.Table('likes',
    db.Column('user_id', db.Integer, db.ForeignKey('users.id'), primary_key=True),
    db.Column('post_id', db.Integer, db.ForeignKey('posts.id'), primary_key=True)
)

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    nome = db.Column(db.String(100), nullable=False)
    bio = db.Column(db.String(500), default='')
    avatar = db.Column(db.String(256), default='')
    emoji = db.Column(db.String(10), default='😊')
    cor_tema = db.Column(db.String(7), default='#7c3aed')
    is_admin = db.Column(db.Boolean, default=False)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_seen = db.Column(db.DateTime, default=datetime.utcnow)
    
    posts = db.relationship('Post', backref='author', lazy='dynamic', cascade='all, delete-orphan')
    comments = db.relationship('Comment', backref='author', lazy='dynamic', cascade='all, delete-orphan')
    liked_posts = db.relationship('Post', secondary=likes, backref=db.backref('liked_by', lazy='dynamic'))
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    
    def to_dict(self, include_email=False):
        data = {
            'id': self.id,
            'nome': self.nome,
            'bio': self.bio,
            'avatar': self.avatar,
            'emoji': self.emoji,
            'cor_tema': self.cor_tema,
            'is_admin': self.is_admin,
            'created_at': self.created_at.isoformat(),
            'last_seen': self.last_seen.isoformat() if self.last_seen else None,
            'total_posts': self.posts.count(),
            'total_likes': sum(post.liked_by.count() for post in self.posts)
        }
        if include_email:
            data['email'] = self.email
        return data


class Post(db.Model):
    __tablename__ = 'posts'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    texto = db.Column(db.Text, nullable=False)
    imagem = db.Column(db.String(256), default='')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    comments = db.relationship('Comment', backref='post', lazy='dynamic', cascade='all, delete-orphan')
    
    def to_dict(self, current_user_id=None):
        return {
            'id': self.id,
            'autor': self.author.to_dict(),
            'texto': self.texto,
            'imagem': self.imagem,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'likes_count': self.liked_by.count(),
            'comments_count': self.comments.count(),
            'liked_by_me': current_user_id in [u.id for u in self.liked_by] if current_user_id else False,
            'tempo': self._tempo_relativo()
        }
    
    def _tempo_relativo(self):
        agora = datetime.utcnow()
        diff = agora - self.created_at
        if diff.days > 30:
            return self.created_at.strftime('%d/%m/%Y')
        elif diff.days > 0:
            return f'{diff.days}d'
        elif diff.seconds > 3600:
            return f'{diff.seconds // 3600}h'
        elif diff.seconds > 60:
            return f'{diff.seconds // 60}min'
        else:
            return 'agora'


class Comment(db.Model):
    __tablename__ = 'comments'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    post_id = db.Column(db.Integer, db.ForeignKey('posts.id'), nullable=False)
    texto = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'autor': self.author.to_dict(),
            'texto': self.texto,
            'created_at': self.created_at.isoformat()
        }


class Invite(db.Model):
    __tablename__ = 'invites'
    
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), nullable=False)
    token = db.Column(db.String(64), unique=True, nullable=False)
    invited_by_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    used = db.Column(db.Boolean, default=False)
    used_by_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    expires_at = db.Column(db.DateTime, nullable=False)
    
    invited_by = db.relationship('User', foreign_keys=[invited_by_id], backref='sent_invites')
    used_by = db.relationship('User', foreign_keys=[used_by_id])
    
    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'token': self.token,
            'invited_by': self.invited_by.to_dict(),
            'used': self.used,
            'created_at': self.created_at.isoformat(),
            'expires_at': self.expires_at.isoformat()
        }


class Notification(db.Model):
    __tablename__ = 'notifications'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    tipo = db.Column(db.String(50), nullable=False)
    mensagem = db.Column(db.String(256), nullable=False)
    link = db.Column(db.String(256), default='')
    lida = db.Column(db.Boolean, default=False)
    actor_id = db.Column(db.Integer, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    user = db.relationship('User', backref='notifications')
    
    def to_dict(self):
        actor = None
        if self.actor_id:
            actor_user = User.query.get(self.actor_id)
            if actor_user:
                actor = actor_user.to_dict()
        
        return {
            'id': self.id,
            'tipo': self.tipo,
            'mensagem': self.mensagem,
            'link': self.link,
            'lida': self.lida,
            'actor': actor,
            'created_at': self.created_at.isoformat()
        }


# ══════════════════════════════════════════════════════════════════════════════
# FUNÇÕES AUXILIARES
# ══════════════════════════════════════════════════════════════════════════════

def criar_notificacao(user_id, tipo, mensagem, actor_id=None, link=''):
    notif = Notification(
        user_id=user_id,
        tipo=tipo,
        mensagem=mensagem,
        actor_id=actor_id,
        link=link
    )
    db.session.add(notif)

def gerar_token_convite():
    return secrets.token_urlsafe(32)


# ══════════════════════════════════════════════════════════════════════════════
# ROTAS DE AUTENTICAÇÃO
# ══════════════════════════════════════════════════════════════════════════════

@app.route('/api/auth/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'Dados não recebidos'}), 400
        
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')
        nome = data.get('nome', '').strip()
        token_convite = data.get('token_convite', '')
        
        if not email or not password or not nome:
            return jsonify({'error': 'Todos os campos são obrigatórios'}), 400
        
        if len(password) < 6:
            return jsonify({'error': 'Senha deve ter pelo menos 6 caracteres'}), 400
        
        if User.query.filter_by(email=email).first():
            return jsonify({'error': 'Email já cadastrado'}), 400
        
        is_first_user = User.query.count() == 0
        
        invite = None
        if not is_first_user:
            if not token_convite:
                return jsonify({'error': 'É necessário um convite para se cadastrar'}), 400
            
            invite = Invite.query.filter_by(token=token_convite, used=False).first()
            
            if not invite:
                return jsonify({'error': 'Convite inválido ou já utilizado'}), 400
            
            if datetime.utcnow() > invite.expires_at:
                return jsonify({'error': 'Convite expirado'}), 400
            
            if invite.email.lower() != email:
                return jsonify({'error': 'Este convite foi enviado para outro email'}), 400
        
        user = User(email=email, nome=nome, is_admin=is_first_user)
        user.set_password(password)
        
        db.session.add(user)
        db.session.flush()
        
        if invite:
            invite.used = True
            invite.used_by_id = user.id
            criar_notificacao(invite.invited_by_id, 'invite_accepted', f'{nome} aceitou seu convite!', actor_id=user.id)
        
        db.session.commit()
        
        access_token = create_access_token(identity=str(user.id))
        
        return jsonify({
            'message': 'Cadastro realizado com sucesso!',
            'token': access_token,
            'user': user.to_dict(include_email=True)
        }), 201
        
    except Exception as e:
        db.session.rollback()
        print(f"Erro no registro: {str(e)}")
        return jsonify({'error': f'Erro interno: {str(e)}'}), 500


@app.route('/api/auth/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'Dados não recebidos'}), 400
        
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')
        
        if not email or not password:
            return jsonify({'error': 'Email e senha são obrigatórios'}), 400
        
        user = User.query.filter_by(email=email).first()
        
        if not user or not user.check_password(password):
            return jsonify({'error': 'Email ou senha incorretos'}), 401
        
        user.last_seen = datetime.utcnow()
        db.session.commit()
        
        access_token = create_access_token(identity=str(user.id))
        
        return jsonify({
            'message': 'Login realizado com sucesso!',
            'token': access_token,
            'user': user.to_dict(include_email=True)
        })
        
    except Exception as e:
        return jsonify({'error': f'Erro interno: {str(e)}'}), 500


@app.route('/api/auth/me', methods=['GET'])
@jwt_required()
def get_me():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'Usuário não encontrado'}), 404
    
    user.last_seen = datetime.utcnow()
    db.session.commit()
    
    return jsonify(user.to_dict(include_email=True))


@app.route('/api/auth/check-invite/<token>', methods=['GET'])
def check_invite(token):
    invite = Invite.query.filter_by(token=token, used=False).first()
    
    if not invite:
        return jsonify({'valid': False, 'error': 'Convite não encontrado'}), 404
    
    if datetime.utcnow() > invite.expires_at:
        return jsonify({'valid': False, 'error': 'Convite expirado'}), 400
    
    return jsonify({
        'valid': True,
        'email': invite.email,
        'invited_by': invite.invited_by.nome
    })


# ══════════════════════════════════════════════════════════════════════════════
# ROTAS DE PERFIL
# ══════════════════════════════════════════════════════════════════════════════

@app.route('/api/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'Usuário não encontrado'}), 404
    
    data = request.get_json()
    
    if 'nome' in data:
        user.nome = data['nome'].strip()
    if 'bio' in data:
        user.bio = data['bio'].strip()[:500]
    if 'emoji' in data:
        user.emoji = data['emoji'][:10]
    if 'cor_tema' in data:
        user.cor_tema = data['cor_tema']
    
    db.session.commit()
    
    return jsonify({
        'message': 'Perfil atualizado!',
        'user': user.to_dict(include_email=True)
    })


@app.route('/api/profile/avatar', methods=['POST'])
@jwt_required()
def upload_avatar():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if 'avatar' not in request.files:
        return jsonify({'error': 'Nenhum arquivo enviado'}), 400
    
    file = request.files['avatar']
    
    if file.filename == '' or not allowed_file(file.filename):
        return jsonify({'error': 'Arquivo inválido'}), 400
    
    ext = file.filename.rsplit('.', 1)[1].lower()
    filename = f"{user_id}_{uuid.uuid4().hex}.{ext}"
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], 'avatars', filename)
    
    file.save(filepath)
    user.avatar = filename
    db.session.commit()
    
    return jsonify({'message': 'Avatar atualizado!', 'avatar': filename})


@app.route('/api/users', methods=['GET'])
@jwt_required()
def list_users():
    users = User.query.filter_by(is_active=True).order_by(User.last_seen.desc()).all()
    return jsonify([user.to_dict() for user in users])


@app.route('/api/users/<int:user_id>', methods=['GET'])
@jwt_required()
def get_user(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'Usuário não encontrado'}), 404
    return jsonify(user.to_dict())


# ══════════════════════════════════════════════════════════════════════════════
# ROTAS DE POSTS
# ══════════════════════════════════════════════════════════════════════════════

@app.route('/api/posts', methods=['GET'])
@jwt_required()
def list_posts():
    user_id = get_jwt_identity()
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    
    posts = Post.query.order_by(Post.created_at.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )
    
    return jsonify({
        'posts': [post.to_dict(current_user_id=user_id) for post in posts.items],
        'total': posts.total,
        'pages': posts.pages,
        'current_page': page
    })


@app.route('/api/posts', methods=['POST'])
@jwt_required()
def create_post():
    user_id = get_jwt_identity()
    
    texto = ''
    imagem = ''
    
    if request.content_type and 'multipart/form-data' in request.content_type:
        texto = request.form.get('texto', '').strip()
        if 'imagem' in request.files:
            file = request.files['imagem']
            if file.filename != '' and allowed_file(file.filename):
                ext = file.filename.rsplit('.', 1)[1].lower()
                filename = f"{user_id}_{uuid.uuid4().hex}.{ext}"
                filepath = os.path.join(app.config['UPLOAD_FOLDER'], 'posts', filename)
                file.save(filepath)
                imagem = filename
    else:
        data = request.get_json()
        texto = data.get('texto', '').strip() if data else ''
    
    if not texto and not imagem:
        return jsonify({'error': 'Post deve ter texto ou imagem'}), 400
    
    post = Post(user_id=user_id, texto=texto, imagem=imagem)
    db.session.add(post)
    db.session.commit()
    
    return jsonify({
        'message': 'Post criado!',
        'post': post.to_dict(current_user_id=user_id)
    }), 201


@app.route('/api/posts/<int:post_id>', methods=['GET'])
@jwt_required()
def get_post(post_id):
    user_id = get_jwt_identity()
    post = Post.query.get(post_id)
    
    if not post:
        return jsonify({'error': 'Post não encontrado'}), 404
    
    return jsonify(post.to_dict(current_user_id=user_id))


@app.route('/api/posts/<int:post_id>', methods=['DELETE'])
@jwt_required()
def delete_post(post_id):
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    post = Post.query.get(post_id)
    
    if not post:
        return jsonify({'error': 'Post não encontrado'}), 404
    
    if post.user_id != user_id and not user.is_admin:
        return jsonify({'error': 'Sem permissão'}), 403
    
    db.session.delete(post)
    db.session.commit()
    
    return jsonify({'message': 'Post deletado!'})


@app.route('/api/posts/<int:post_id>/like', methods=['POST'])
@jwt_required()
def like_post(post_id):
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    post = Post.query.get(post_id)
    
    if not post:
        return jsonify({'error': 'Post não encontrado'}), 404
    
    if user in post.liked_by:
        post.liked_by.remove(user)
        liked = False
    else:
        post.liked_by.append(user)
        liked = True
        if post.user_id != user_id:
            criar_notificacao(post.user_id, 'like', f'{user.nome} curtiu seu post', actor_id=user_id)
    
    db.session.commit()
    
    return jsonify({'liked': liked, 'likes_count': post.liked_by.count()})


@app.route('/api/posts/user/<int:user_id>', methods=['GET'])
@jwt_required()
def list_user_posts(user_id):
    current_user_id = get_jwt_identity()
    page = request.args.get('page', 1, type=int)
    
    posts = Post.query.filter_by(user_id=user_id).order_by(
        Post.created_at.desc()
    ).paginate(page=page, per_page=20, error_out=False)
    
    return jsonify({
        'posts': [post.to_dict(current_user_id=current_user_id) for post in posts.items],
        'total': posts.total
    })


# ══════════════════════════════════════════════════════════════════════════════
# ROTAS DE COMENTÁRIOS
# ══════════════════════════════════════════════════════════════════════════════

@app.route('/api/posts/<int:post_id>/comments', methods=['GET'])
@jwt_required()
def list_comments(post_id):
    post = Post.query.get(post_id)
    if not post:
        return jsonify({'error': 'Post não encontrado'}), 404
    
    comments = Comment.query.filter_by(post_id=post_id).order_by(Comment.created_at.asc()).all()
    return jsonify([c.to_dict() for c in comments])


@app.route('/api/posts/<int:post_id>/comments', methods=['POST'])
@jwt_required()
def create_comment(post_id):
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    post = Post.query.get(post_id)
    
    if not post:
        return jsonify({'error': 'Post não encontrado'}), 404
    
    data = request.get_json()
    texto = data.get('texto', '').strip() if data else ''
    
    if not texto:
        return jsonify({'error': 'Comentário vazio'}), 400
    
    comment = Comment(user_id=user_id, post_id=post_id, texto=texto)
    db.session.add(comment)
    
    if post.user_id != user_id:
        criar_notificacao(post.user_id, 'comment', f'{user.nome} comentou no seu post', actor_id=user_id)
    
    db.session.commit()
    
    return jsonify({'message': 'Comentário adicionado!', 'comment': comment.to_dict()}), 201


# ══════════════════════════════════════════════════════════════════════════════
# ROTAS DE CONVITES
# ══════════════════════════════════════════════════════════════════════════════

@app.route('/api/invites', methods=['GET'])
@jwt_required()
def list_invites():
    user_id = get_jwt_identity()
    invites = Invite.query.filter_by(invited_by_id=user_id).order_by(Invite.created_at.desc()).all()
    return jsonify([i.to_dict() for i in invites])


@app.route('/api/invites', methods=['POST'])
@jwt_required()
def create_invite():
    user_id = get_jwt_identity()
    data = request.get_json()
    email = data.get('email', '').strip().lower() if data else ''
    
    if not email:
        return jsonify({'error': 'Email é obrigatório'}), 400
    
    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'Email já cadastrado'}), 400
    
    invite = Invite(
        email=email,
        token=gerar_token_convite(),
        invited_by_id=user_id,
        expires_at=datetime.utcnow() + timedelta(days=7)
    )
    
    db.session.add(invite)
    db.session.commit()
    
    return jsonify({
        'message': 'Convite criado!',
        'invite': invite.to_dict(),
        'invite_url': f'https://friendcircle-p1t4.onrender.com/register?token={invite.token}'
    }), 201


# ══════════════════════════════════════════════════════════════════════════════
# ROTAS DE NOTIFICAÇÕES
# ══════════════════════════════════════════════════════════════════════════════

@app.route('/api/notifications', methods=['GET'])
@jwt_required()
def list_notifications():
    user_id = get_jwt_identity()
    
    notifications = Notification.query.filter_by(user_id=user_id).order_by(
        Notification.created_at.desc()
    ).limit(50).all()
    
    unread_count = Notification.query.filter_by(user_id=user_id, lida=False).count()
    
    return jsonify({
        'notifications': [n.to_dict() for n in notifications],
        'unread_count': unread_count
    })


@app.route('/api/notifications/read', methods=['POST'])
@jwt_required()
def mark_notifications_read():
    user_id = get_jwt_identity()
    Notification.query.filter_by(user_id=user_id, lida=False).update({'lida': True})
    db.session.commit()
    return jsonify({'message': 'Notificações lidas!'})


# ══════════════════════════════════════════════════════════════════════════════
# OUTRAS ROTAS
# ══════════════════════════════════════════════════════════════════════════════

@app.route('/uploads/<path:filename>')
def serve_upload(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)


@app.route('/api/stats', methods=['GET'])
@jwt_required()
def get_stats():
    return jsonify({
        'total_users': User.query.filter_by(is_active=True).count(),
        'total_posts': Post.query.count(),
        'total_comments': Comment.query.count(),
        'online_users': User.query.filter(User.last_seen > datetime.utcnow() - timedelta(minutes=5)).count(),
        'new_members_week': User.query.filter(User.created_at > datetime.utcnow() - timedelta(days=7)).count()
    })


@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'ok', 'version': '1.2'})


# ══════════════════════════════════════════════════════════════════════════════
# INICIALIZAÇÃO
# ══════════════════════════════════════════════════════════════════════════════

with app.app_context():
    db.create_all()
    print("✅ Banco de dados inicializado!")

if __name__ == '__main__':
    print("""
╔═══════════════════════════════════════════════════════════════╗
║          FRIENDCIRCLE - BACKEND API v1.2                      ║
║          http://localhost:5001                                ║
╚═══════════════════════════════════════════════════════════════╝
    """)
    app.run(debug=True, host='0.0.0.0', port=5001)
