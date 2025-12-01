#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════
# INSTALADOR - FriendCircle
# ═══════════════════════════════════════════════════════════════════════

echo ""
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║   🌟 FriendCircle - Instalação                               ║"
echo "║   Rede Social Privada por Convite                            ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# Verificar Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 não encontrado. Instale primeiro."
    exit 1
fi
echo "✓ Python3 encontrado"

# Verificar Node
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado. Instale primeiro."
    exit 1
fi
echo "✓ Node.js encontrado"

# Verificar npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm não encontrado. Instale primeiro."
    exit 1
fi
echo "✓ npm encontrado"

echo ""
echo "📦 Instalando dependências do Backend..."
cd backend
pip3 install -r requirements.txt --break-system-packages 2>/dev/null || pip3 install -r requirements.txt
cd ..
echo "✓ Backend pronto"

echo ""
echo "📦 Instalando dependências do Frontend..."
cd web
npm install
cd ..
echo "✓ Frontend pronto"

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "✅ INSTALAÇÃO CONCLUÍDA!"
echo ""
echo "Para iniciar:"
echo ""
echo "  1️⃣  Terminal 1 (Backend):"
echo "      cd backend && python3 app.py"
echo ""
echo "  2️⃣  Terminal 2 (Frontend):"
echo "      cd web && npm start"
echo ""
echo "  3️⃣  Acesse: http://localhost:3000"
echo ""
echo "═══════════════════════════════════════════════════════════════"
