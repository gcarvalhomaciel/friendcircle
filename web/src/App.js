import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import axios from 'axios';

// ══════════════════════════════════════════════════════════════════════════════
// CONFIGURAÇÃO DA API
// ══════════════════════════════════════════════════════════════════════════════

const API_URL = 'https://friendcircle-api.onrender.com/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para adicionar token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ══════════════════════════════════════════════════════════════════════════════
// CONTEXTO DE AUTENTICAÇÃO
// ══════════════════════════════════════════════════════════════════════════════

const AuthContext = createContext(null);

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api.get('/auth/me')
        .then(res => setUser(res.data))
        .catch(() => {
          localStorage.removeItem('token');
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', res.data.token);
    setUser(res.data.user);
    return res.data;
  };

  const register = async (data) => {
    const res = await api.post('/auth/register', data);
    localStorage.setItem('token', res.data.token);
    setUser(res.data.user);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const updateUser = (newData) => {
    setUser(prev => ({ ...prev, ...newData }));
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

function useAuth() {
  return useContext(AuthContext);
}

// ══════════════════════════════════════════════════════════════════════════════
// ESTILOS GLOBAIS
// ══════════════════════════════════════════════════════════════════════════════

const styles = {
  // Cores
  colors: {
    bg: '#0a0a0f',
    bgCard: 'rgba(26, 26, 46, 0.6)',
    bgInput: 'rgba(255,255,255,0.05)',
    border: 'rgba(255,255,255,0.1)',
    text: '#ffffff',
    textSecondary: '#888',
    primary: '#7c3aed',
    primaryHover: '#8b5cf6',
    success: '#10b981',
    error: '#ef4444',
    warning: '#f59e0b'
  },
  
  // Container principal
  container: {
    minHeight: '100vh',
    background: '#0a0a0f'
  },
  
  // Glassmorphism card
  card: {
    background: 'rgba(26, 26, 46, 0.6)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 20,
    padding: 24
  },
  
  // Botão primário
  button: {
    background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
    border: 'none',
    borderRadius: 12,
    padding: '14px 28px',
    color: 'white',
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s',
    width: '100%'
  },
  
  // Input
  input: {
    width: '100%',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: '14px 18px',
    color: 'white',
    fontSize: 15,
    outline: 'none',
    transition: 'border-color 0.2s'
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// COMPONENTES COMPARTILHADOS
// ══════════════════════════════════════════════════════════════════════════════

function LoadingScreen() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0a0a0f'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          fontSize: 48,
          marginBottom: 16,
          animation: 'pulse 2s infinite'
        }}>✦</div>
        <p style={{ color: '#888' }}>Carregando...</p>
      </div>
    </div>
  );
}

function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const [notifications, setNotifications] = useState({ unread_count: 0 });

  useEffect(() => {
    api.get('/notifications').then(res => setNotifications(res.data)).catch(() => {});
  }, []);

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      background: 'rgba(10, 10, 15, 0.8)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(255,255,255,0.1)'
    }}>
      <div style={{
        maxWidth: 1400,
        margin: '0 auto',
        padding: '12px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <span style={{
            fontSize: 28,
            background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>✦</span>
          <span style={{
            fontSize: 22,
            fontWeight: 700,
            color: 'white'
          }}>FriendCircle</span>
        </Link>

        {/* Nav */}
        <nav style={{ display: 'flex', gap: 8 }}>
          <NavItem to="/" icon="🏠" label="Feed" />
          <NavItem to="/invites" icon="💌" label="Convites" />
          <NavItem to="/notifications" icon="🔔" label="Alertas" badge={notifications.unread_count} />
        </nav>

        {/* Profile */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '8px 16px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 50,
              color: 'white',
              cursor: 'pointer'
            }}
          >
            <span style={{ fontSize: 24 }}>{user?.emoji || '😊'}</span>
            <span style={{ fontWeight: 500 }}>{user?.nome?.split(' ')[0]}</span>
            <span style={{ fontSize: 12, opacity: 0.5 }}>▾</span>
          </button>

          {showMenu && (
            <div style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: 8,
              background: 'rgba(26, 26, 46, 0.95)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 16,
              padding: 8,
              minWidth: 180
            }}>
              <MenuButton onClick={() => { navigate('/profile'); setShowMenu(false); }}>
                👤 Meu Perfil
              </MenuButton>
              <MenuButton onClick={() => { navigate('/settings'); setShowMenu(false); }}>
                ⚙️ Configurações
              </MenuButton>
              <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)', margin: '8px 0' }} />
              <MenuButton onClick={() => { logout(); navigate('/login'); }} danger>
                🚪 Sair
              </MenuButton>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function NavItem({ to, icon, label, badge }) {
  return (
    <Link to={to} style={{
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '10px 16px',
      background: 'transparent',
      borderRadius: 12,
      color: '#888',
      fontSize: 14,
      fontWeight: 500,
      textDecoration: 'none',
      transition: 'all 0.2s'
    }}>
      <span>{icon}</span>
      <span>{label}</span>
      {badge > 0 && (
        <span style={{
          background: '#ef4444',
          color: 'white',
          fontSize: 11,
          fontWeight: 600,
          padding: '2px 6px',
          borderRadius: 10
        }}>{badge}</span>
      )}
    </Link>
  );
}

function MenuButton({ children, onClick, danger }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        width: '100%',
        padding: '12px 16px',
        background: 'transparent',
        border: 'none',
        borderRadius: 10,
        color: danger ? '#ef4444' : 'white',
        fontSize: 14,
        cursor: 'pointer',
        textAlign: 'left'
      }}
    >
      {children}
    </button>
  );
}

function Avatar({ user, size = 48 }) {
  const sizeStyle = { width: size, height: size, fontSize: size * 0.5 };
  
  if (user?.avatar) {
    return (
      <img
        src={`http://localhost:5000/uploads/avatars/${user.avatar}`}
        alt={user.nome}
        style={{
          ...sizeStyle,
          borderRadius: size * 0.3,
          objectFit: 'cover'
        }}
      />
    );
  }
  
  return (
    <div style={{
      ...sizeStyle,
      borderRadius: size * 0.3,
      background: `linear-gradient(135deg, ${user?.cor_tema || '#7c3aed'}, ${user?.cor_tema || '#7c3aed'}88)`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      {user?.emoji || '😊'}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PÁGINA DE LOGIN
// ══════════════════════════════════════════════════════════════════════════════

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0a0a0f',
      padding: 20
    }}>
      {/* Background orbs */}
      <div style={{
        position: 'fixed',
        top: -100,
        left: -100,
        width: 400,
        height: 400,
        background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
        borderRadius: '50%',
        filter: 'blur(100px)',
        opacity: 0.2
      }} />
      <div style={{
        position: 'fixed',
        bottom: -100,
        right: -100,
        width: 300,
        height: 300,
        background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
        borderRadius: '50%',
        filter: 'blur(100px)',
        opacity: 0.2
      }} />

      <div style={{
        ...styles.card,
        width: '100%',
        maxWidth: 420,
        position: 'relative',
        zIndex: 1
      }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            fontSize: 48,
            marginBottom: 16,
            background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>✦</div>
          <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>FriendCircle</h1>
          <p style={{ color: '#888' }}>Entre no seu círculo de amigos</p>
        </div>

        <form onSubmit={handleSubmit}>
          {error && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 12,
              padding: 12,
              marginBottom: 16,
              color: '#ef4444',
              fontSize: 14
            }}>
              {error}
            </div>
          )}

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 8, color: '#888', fontSize: 14 }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
              placeholder="seu@email.com"
              required
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', marginBottom: 8, color: '#888', fontSize: 14 }}>
              Senha
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.button,
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 24, color: '#888', fontSize: 14 }}>
          Recebeu um convite?{' '}
          <Link to="/register" style={{ color: '#a78bfa', textDecoration: 'none' }}>
            Criar conta
          </Link>
        </p>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PÁGINA DE CADASTRO
// ══════════════════════════════════════════════════════════════════════════════

function RegisterPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [inviteInfo, setInviteInfo] = useState(null);
  const [checkingInvite, setCheckingInvite] = useState(!!token);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (token) {
      api.get(`/auth/check-invite/${token}`)
        .then(res => {
          setInviteInfo(res.data);
          setEmail(res.data.email);
        })
        .catch(err => {
          setError(err.response?.data?.error || 'Convite inválido');
        })
        .finally(() => setCheckingInvite(false));
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('As senhas não conferem');
      return;
    }

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    setLoading(true);

    try {
      await register({
        nome,
        email,
        password,
        token_convite: token || ''
      });
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao criar conta');
    } finally {
      setLoading(false);
    }
  };

  if (checkingInvite) {
    return <LoadingScreen />;
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0a0a0f',
      padding: 20
    }}>
      {/* Background orbs */}
      <div style={{
        position: 'fixed',
        top: -100,
        left: -100,
        width: 400,
        height: 400,
        background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
        borderRadius: '50%',
        filter: 'blur(100px)',
        opacity: 0.2
      }} />

      <div style={{
        ...styles.card,
        width: '100%',
        maxWidth: 420,
        position: 'relative',
        zIndex: 1
      }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            fontSize: 48,
            marginBottom: 16,
            background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>✦</div>
          <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Criar Conta</h1>
          {inviteInfo ? (
            <p style={{ color: '#10b981' }}>
              🎉 Convite de <strong>{inviteInfo.invited_by}</strong>
            </p>
          ) : (
            <p style={{ color: '#888' }}>Seja o primeiro do seu círculo!</p>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          {error && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 12,
              padding: 12,
              marginBottom: 16,
              color: '#ef4444',
              fontSize: 14
            }}>
              {error}
            </div>
          )}

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 8, color: '#888', fontSize: 14 }}>
              Nome
            </label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              style={styles.input}
              placeholder="Seu nome completo"
              required
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 8, color: '#888', fontSize: 14 }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
              placeholder="seu@email.com"
              required
              disabled={!!inviteInfo}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 8, color: '#888', fontSize: 14 }}>
              Senha
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              placeholder="Mínimo 6 caracteres"
              required
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', marginBottom: 8, color: '#888', fontSize: 14 }}>
              Confirmar Senha
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={styles.input}
              placeholder="Repita a senha"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.button,
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'Criando conta...' : 'Criar conta'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 24, color: '#888', fontSize: 14 }}>
          Já tem uma conta?{' '}
          <Link to="/login" style={{ color: '#a78bfa', textDecoration: 'none' }}>
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PÁGINA DO FEED
// ══════════════════════════════════════════════════════════════════════════════

function FeedPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState('');
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [postsRes, usersRes, statsRes] = await Promise.all([
        api.get('/posts'),
        api.get('/users'),
        api.get('/stats')
      ]);
      setPosts(postsRes.data.posts);
      setUsers(usersRes.data);
      setStats(statsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newPost.trim()) return;

    setPosting(true);
    try {
      const res = await api.post('/posts', { texto: newPost });
      setPosts([res.data.post, ...posts]);
      setNewPost('');
    } catch (err) {
      alert(err.response?.data?.error || 'Erro ao criar post');
    } finally {
      setPosting(false);
    }
  };

  const handleLike = async (postId) => {
    try {
      const res = await api.post(`/posts/${postId}/like`);
      setPosts(posts.map(p => 
        p.id === postId 
          ? { ...p, liked_by_me: res.data.liked, likes_count: res.data.likes_count }
          : p
      ));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <LoadingScreen />;

  return (
    <div style={styles.container}>
      <Header />
      
      <main style={{
        maxWidth: 1400,
        margin: '0 auto',
        padding: 24,
        display: 'grid',
        gridTemplateColumns: '280px 1fr 300px',
        gap: 24
      }}>
        {/* Sidebar Esquerda */}
        <aside>
          <div style={{ ...styles.card, marginBottom: 20 }}>
            <h3 style={{ fontSize: 14, color: '#888', marginBottom: 16 }}>
              👥 Membros do Círculo
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {users.slice(0, 6).map(u => (
                <Link 
                  key={u.id} 
                  to={`/user/${u.id}`}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 12,
                    textDecoration: 'none',
                    color: 'white'
                  }}
                >
                  <Avatar user={u} size={40} />
                  <span style={{ fontSize: 14 }}>{u.nome}</span>
                </Link>
              ))}
            </div>
            
            <Link 
              to="/invites" 
              style={{
                display: 'block',
                marginTop: 16,
                padding: '12px 16px',
                background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
                borderRadius: 12,
                color: 'white',
                textDecoration: 'none',
                textAlign: 'center',
                fontSize: 14,
                fontWeight: 600
              }}
            >
              ✨ Convidar Amigo
            </Link>
          </div>

          <div style={styles.card}>
            <h3 style={{ fontSize: 14, color: '#888', marginBottom: 16 }}>
              📊 Estatísticas
            </h3>
            <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
              <div>
                <div style={{
                  fontSize: 24,
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>{stats.total_users || 0}</div>
                <div style={{ fontSize: 12, color: '#888' }}>Membros</div>
              </div>
              <div>
                <div style={{
                  fontSize: 24,
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>{stats.total_posts || 0}</div>
                <div style={{ fontSize: 12, color: '#888' }}>Posts</div>
              </div>
            </div>
          </div>
        </aside>

        {/* Feed Central */}
        <div>
          {/* Criar Post */}
          <div style={{ ...styles.card, marginBottom: 20 }}>
            <form onSubmit={handleCreatePost}>
              <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                <Avatar user={user} size={48} />
                <textarea
                  value={newPost}
                  onChange={(e) => setNewPost(e.target.value)}
                  placeholder="O que está acontecendo no seu mundo? ✨"
                  style={{
                    ...styles.input,
                    flex: 1,
                    minHeight: 80,
                    resize: 'none'
                  }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#888',
                    cursor: 'pointer',
                    padding: '8px 12px',
                    borderRadius: 8,
                    fontSize: 14
                  }}>📷 Foto</button>
                  <button type="button" style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#888',
                    cursor: 'pointer',
                    padding: '8px 12px',
                    borderRadius: 8,
                    fontSize: 14
                  }}>😊 Emoji</button>
                </div>
                <button
                  type="submit"
                  disabled={posting || !newPost.trim()}
                  style={{
                    background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
                    border: 'none',
                    borderRadius: 12,
                    padding: '10px 24px',
                    color: 'white',
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                    opacity: posting || !newPost.trim() ? 0.5 : 1
                  }}
                >
                  {posting ? 'Publicando...' : 'Publicar ✦'}
                </button>
              </div>
            </form>
          </div>

          {/* Posts */}
          {posts.map(post => (
            <PostCard 
              key={post.id} 
              post={post} 
              onLike={() => handleLike(post.id)}
            />
          ))}

          {posts.length === 0 && (
            <div style={{ ...styles.card, textAlign: 'center', padding: 60 }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🌟</div>
              <h3 style={{ marginBottom: 8 }}>Nenhum post ainda</h3>
              <p style={{ color: '#888' }}>Seja o primeiro a compartilhar algo!</p>
            </div>
          )}
        </div>

        {/* Sidebar Direita */}
        <aside>
          <div style={{ ...styles.card, marginBottom: 20 }}>
            <h3 style={{ fontSize: 14, color: '#888', marginBottom: 16 }}>
              🎉 Novidades
            </h3>
            <p style={{ fontSize: 14, color: '#a0a0a0' }}>
              {stats.new_members_week || 0} novos membros esta semana!
            </p>
          </div>
        </aside>
      </main>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// COMPONENTE DE POST
// ══════════════════════════════════════════════════════════════════════════════

function PostCard({ post, onLike }) {
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);

  const loadComments = async () => {
    if (comments.length > 0) {
      setShowComments(!showComments);
      return;
    }
    
    setLoadingComments(true);
    try {
      const res = await api.get(`/posts/${post.id}/comments`);
      setComments(res.data);
      setShowComments(true);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const res = await api.post(`/posts/${post.id}/comments`, { texto: newComment });
      setComments([...comments, res.data.comment]);
      setNewComment('');
    } catch (err) {
      alert(err.response?.data?.error || 'Erro ao comentar');
    }
  };

  return (
    <article style={{ ...styles.card, marginBottom: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <Link to={`/user/${post.autor.id}`}>
          <Avatar user={post.autor} size={48} />
        </Link>
        <div style={{ flex: 1 }}>
          <Link 
            to={`/user/${post.autor.id}`}
            style={{ fontWeight: 600, color: 'white', textDecoration: 'none' }}
          >
            {post.autor.nome}
          </Link>
          <div style={{ fontSize: 12, color: '#666' }}>{post.tempo}</div>
        </div>
      </div>

      {/* Texto */}
      <p style={{ fontSize: 15, lineHeight: 1.6, marginBottom: 16, color: '#e0e0e0' }}>
        {post.texto}
      </p>

      {/* Imagem */}
      {post.imagem && (
        <div style={{ borderRadius: 16, overflow: 'hidden', marginBottom: 16 }}>
          <img 
            src={`http://localhost:5000/uploads/posts/${post.imagem}`}
            alt=""
            style={{ width: '100%', maxHeight: 400, objectFit: 'cover' }}
          />
        </div>
      )}

      {/* Ações */}
      <div style={{
        display: 'flex',
        gap: 8,
        paddingTop: 12,
        borderTop: '1px solid rgba(255,255,255,0.1)'
      }}>
        <button
          onClick={onLike}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 16px',
            background: post.liked_by_me ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255,255,255,0.05)',
            border: 'none',
            borderRadius: 12,
            color: post.liked_by_me ? '#ef4444' : '#888',
            fontSize: 14,
            cursor: 'pointer'
          }}
        >
          <span>{post.liked_by_me ? '❤️' : '🤍'}</span>
          <span>{post.likes_count}</span>
        </button>

        <button
          onClick={loadComments}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 16px',
            background: 'rgba(255,255,255,0.05)',
            border: 'none',
            borderRadius: 12,
            color: '#888',
            fontSize: 14,
            cursor: 'pointer'
          }}
        >
          <span>💬</span>
          <span>{post.comments_count}</span>
        </button>
      </div>

      {/* Comentários */}
      {showComments && (
        <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          {comments.map(comment => (
            <div key={comment.id} style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
              <Avatar user={comment.autor} size={32} />
              <div style={{
                flex: 1,
                background: 'rgba(255,255,255,0.05)',
                borderRadius: 12,
                padding: 12
              }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                  {comment.autor.nome}
                  <span style={{ fontWeight: 400, color: '#666', marginLeft: 8 }}>
                    {comment.tempo}
                  </span>
                </div>
                <div style={{ fontSize: 14, color: '#ccc' }}>{comment.texto}</div>
              </div>
            </div>
          ))}

          <form onSubmit={handleComment} style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Escreva um comentário..."
              style={{ ...styles.input, flex: 1 }}
            />
            <button
              type="submit"
              style={{
                background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
                border: 'none',
                borderRadius: 12,
                padding: '0 20px',
                color: 'white',
                cursor: 'pointer'
              }}
            >
              Enviar
            </button>
          </form>
        </div>
      )}
    </article>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PÁGINA DE CONVITES
// ══════════════════════════════════════════════════════════════════════════════

function InvitesPage() {
  const [invites, setInvites] = useState([]);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadInvites();
  }, []);

  const loadInvites = async () => {
    try {
      const res = await api.get('/invites');
      setInvites(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    setSending(true);
    try {
      const res = await api.post('/invites', { email });
      setInvites([res.data.invite, ...invites]);
      setEmail('');
      alert(`Convite criado!\n\nLink: ${res.data.invite_url}\n\nCompartilhe este link com seu amigo.`);
    } catch (err) {
      alert(err.response?.data?.error || 'Erro ao enviar convite');
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={styles.container}>
      <Header />
      
      <main style={{ maxWidth: 600, margin: '0 auto', padding: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>💌 Convites</h1>
        <p style={{ color: '#888', marginBottom: 24 }}>
          Convide seus amigos para entrar no círculo
        </p>

        {/* Formulário */}
        <div style={{ ...styles.card, marginBottom: 24 }}>
          <form onSubmit={handleInvite}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 8, color: '#888', fontSize: 14 }}>
                Email do amigo
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={styles.input}
                placeholder="amigo@email.com"
                required
              />
            </div>
            <button
              type="submit"
              disabled={sending}
              style={{ ...styles.button, opacity: sending ? 0.7 : 1 }}
            >
              {sending ? 'Enviando...' : '✨ Criar Convite'}
            </button>
          </form>
        </div>

        {/* Lista de convites */}
        <h2 style={{ fontSize: 18, marginBottom: 16 }}>Convites enviados</h2>
        
        {loading ? (
          <p style={{ color: '#888' }}>Carregando...</p>
        ) : invites.length === 0 ? (
          <div style={{ ...styles.card, textAlign: 'center', padding: 40 }}>
            <p style={{ color: '#888' }}>Você ainda não enviou nenhum convite</p>
          </div>
        ) : (
          invites.map(invite => (
            <div key={invite.id} style={{ ...styles.card, marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{invite.email}</div>
                  <div style={{ fontSize: 12, color: '#888' }}>
                    Enviado em {new Date(invite.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div style={{
                  padding: '4px 12px',
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 600,
                  background: invite.used ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                  color: invite.used ? '#10b981' : '#f59e0b'
                }}>
                  {invite.used ? '✅ Aceito' : '⏳ Pendente'}
                </div>
              </div>
            </div>
          ))
        )}
      </main>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PÁGINA DE NOTIFICAÇÕES
// ══════════════════════════════════════════════════════════════════════════════

function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data.notifications);
      // Marcar como lidas
      api.post('/notifications/read', {});
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <Header />
      
      <main style={{ maxWidth: 600, margin: '0 auto', padding: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 24 }}>🔔 Notificações</h1>

        {loading ? (
          <p style={{ color: '#888' }}>Carregando...</p>
        ) : notifications.length === 0 ? (
          <div style={{ ...styles.card, textAlign: 'center', padding: 60 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔕</div>
            <p style={{ color: '#888' }}>Nenhuma notificação ainda</p>
          </div>
        ) : (
          notifications.map(notif => (
            <div 
              key={notif.id} 
              style={{ 
                ...styles.card, 
                marginBottom: 12,
                opacity: notif.lida ? 0.7 : 1,
                borderLeft: notif.lida ? 'none' : '3px solid #7c3aed'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {notif.actor && <Avatar user={notif.actor} size={40} />}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14 }}>{notif.mensagem}</div>
                  <div style={{ fontSize: 12, color: '#888' }}>{notif.tempo}</div>
                </div>
              </div>
            </div>
          ))
        )}
      </main>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PÁGINA DE PERFIL
// ══════════════════════════════════════════════════════════════════════════════

function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [nome, setNome] = useState(user?.nome || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [emoji, setEmoji] = useState(user?.emoji || '😊');
  const [saving, setSaving] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const res = await api.put('/profile', { nome, bio, emoji });
      updateUser(res.data.user);
      alert('Perfil atualizado!');
    } catch (err) {
      alert(err.response?.data?.error || 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={styles.container}>
      <Header />
      
      <main style={{ maxWidth: 600, margin: '0 auto', padding: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 24 }}>👤 Meu Perfil</h1>

        <div style={styles.card}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <Avatar user={user} size={100} />
            <div style={{ marginTop: 16, fontSize: 12, color: '#888' }}>
              Membro desde {new Date(user?.created_at).toLocaleDateString()}
            </div>
          </div>

          <form onSubmit={handleSave}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 8, color: '#888', fontSize: 14 }}>
                Emoji do perfil
              </label>
              <input
                type="text"
                value={emoji}
                onChange={(e) => setEmoji(e.target.value)}
                style={{ ...styles.input, fontSize: 24, textAlign: 'center' }}
                maxLength={2}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 8, color: '#888', fontSize: 14 }}>
                Nome
              </label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                style={styles.input}
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', marginBottom: 8, color: '#888', fontSize: 14 }}>
                Bio
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                style={{ ...styles.input, minHeight: 100, resize: 'none' }}
                placeholder="Conte um pouco sobre você..."
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              style={{ ...styles.button, opacity: saving ? 0.7 : 1 }}
            >
              {saving ? 'Salvando...' : 'Salvar alterações'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PÁGINA DE USUÁRIO
// ══════════════════════════════════════════════════════════════════════════════

function UserPage() {
  const { id } = useParams();
  const [userData, setUserData] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, [id]);

  const loadUser = async () => {
    try {
      const [userRes, postsRes] = await Promise.all([
        api.get(`/users/${id}`),
        api.get(`/posts/user/${id}`)
      ]);
      setUserData(userRes.data);
      setPosts(postsRes.data.posts);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingScreen />;
  if (!userData) return <div>Usuário não encontrado</div>;

  return (
    <div style={styles.container}>
      <Header />
      
      <main style={{ maxWidth: 800, margin: '0 auto', padding: 24 }}>
        {/* Header do perfil */}
        <div style={{ ...styles.card, marginBottom: 24, textAlign: 'center' }}>
          <Avatar user={userData} size={100} />
          <h1 style={{ fontSize: 24, fontWeight: 700, marginTop: 16 }}>{userData.nome}</h1>
          {userData.bio && (
            <p style={{ color: '#888', marginTop: 8 }}>{userData.bio}</p>
          )}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 32, marginTop: 24 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 700 }}>{userData.total_posts}</div>
              <div style={{ fontSize: 12, color: '#888' }}>Posts</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 700 }}>{userData.total_likes}</div>
              <div style={{ fontSize: 12, color: '#888' }}>Curtidas recebidas</div>
            </div>
          </div>
        </div>

        {/* Posts do usuário */}
        <h2 style={{ fontSize: 18, marginBottom: 16 }}>Posts de {userData.nome.split(' ')[0]}</h2>
        
        {posts.length === 0 ? (
          <div style={{ ...styles.card, textAlign: 'center', padding: 40 }}>
            <p style={{ color: '#888' }}>Nenhum post ainda</p>
          </div>
        ) : (
          posts.map(post => (
            <PostCard key={post.id} post={post} onLike={() => {}} />
          ))
        )}
      </main>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// COMPONENTE DE ROTA PROTEGIDA
// ══════════════════════════════════════════════════════════════════════════════

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" />;
  
  return children;
}

// ══════════════════════════════════════════════════════════════════════════════
// APP PRINCIPAL
// ══════════════════════════════════════════════════════════════════════════════

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/" element={<ProtectedRoute><FeedPage /></ProtectedRoute>} />
          <Route path="/invites" element={<ProtectedRoute><InvitesPage /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/user/:id" element={<ProtectedRoute><UserPage /></ProtectedRoute>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
