import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import AdminLayout from './components/AdminLayout'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Cadastro from './pages/Cadastro'
import EsqueciSenha from './pages/EsqueciSenha'
import RedefinirSenha from './pages/RedefinirSenha'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminEmpresas from './pages/admin/AdminEmpresas'
import AdminEmpresaDetalhe from './pages/admin/AdminEmpresaDetalhe'
import AdminPlanos from './pages/admin/AdminPlanos'
import AdminConfiguracoes from './pages/admin/AdminConfiguracoes'
import AdminTutoriais from './pages/admin/AdminTutoriais'
import VisaoGeral from './pages/VisaoGeral'
import FinanceiroVisao from './pages/FinanceiroVisao'
import FinanceiroEntradas from './pages/FinanceiroEntradas'
import FinanceiroGastos from './pages/FinanceiroGastos'
import FinanceiroCustos from './pages/FinanceiroCustos'
import FinanceiroPoupanca from './pages/FinanceiroPoupanca'
import ClientesVisao from './pages/ClientesVisao'
import ClientesCadastro from './pages/ClientesCadastro'
import ClientesHistoricoVendas from './pages/ClientesHistoricoVendas'
import VendasLista from './pages/VendasLista'
import ProdutosVisao from './pages/ProdutosVisao'
import ProdutosLista from './pages/ProdutosLista'
import EstoqueVisao from './pages/EstoqueVisao'
import EstoqueMovimentacoes from './pages/EstoqueMovimentacoes'
import CalculadoraPrecificacao from './pages/CalculadoraPrecificacao'
import CalculadoraProLabore from './pages/CalculadoraProLabore'
import Tarefas from './pages/Tarefas'
import AssinaturaPlanos from './pages/AssinaturaPlanos'
import AssinaturaHistorico from './pages/AssinaturaHistorico'
import AssinaturaSucesso from './pages/AssinaturaSucesso'
import AssinaturaErro from './pages/AssinaturaErro'
import AssinaturaPendente from './pages/AssinaturaPendente'
import Perfil from './pages/Perfil'
import Tutoriais from './pages/Tutoriais'
import NotasFiscais from './pages/NotasFiscais'
import DASMensal from './pages/DASMensal'
import UsuariosEmpresa from './pages/UsuariosEmpresa'

function ProtectedRoute({ children, adminOnly = false, empresaOnly = false }) {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
        <div className="text-slate-400">Carregando...</div>
      </div>
    )
  }
  if (!user) return <Navigate to="/login" replace />
  const role = user.role || 'empresa'
  if (adminOnly && role !== 'super_admin') return <Navigate to="/dashboard" replace />
  if (empresaOnly && role !== 'empresa' && role !== 'colaborador') return <Navigate to="/admin" replace />
  return children
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
      <div className="text-slate-400">Carregando...</div>
    </div>
  )
  if (user) {
    const role = user.role || 'empresa'
    if (role === 'super_admin') return <Navigate to="/admin" replace />
    return <Navigate to="/dashboard" replace />
  }
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/cadastro" element={<PublicRoute><Cadastro /></PublicRoute>} />
      <Route path="/esqueci-senha" element={<PublicRoute><EsqueciSenha /></PublicRoute>} />
      <Route path="/redefinir-senha" element={<PublicRoute><RedefinirSenha /></PublicRoute>} />
      <Route
        path="/admin"
        element={
          <ProtectedRoute adminOnly>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="empresas" element={<AdminEmpresas />} />
        <Route path="empresas/:id" element={<AdminEmpresaDetalhe />} />
        <Route path="planos" element={<AdminPlanos />} />
        <Route path="tutoriais" element={<AdminTutoriais />} />
        <Route path="configuracoes" element={<AdminConfiguracoes />} />
      </Route>
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute empresaOnly>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<VisaoGeral />} />
        <Route path="financeiro" element={<FinanceiroVisao />} />
        <Route path="financeiro/entradas" element={<FinanceiroEntradas />} />
        <Route path="financeiro/gastos" element={<FinanceiroGastos />} />
        <Route path="financeiro/custos" element={<FinanceiroCustos />} />
        <Route path="financeiro/poupanca" element={<FinanceiroPoupanca />} />
        <Route path="clientes" element={<ClientesVisao />} />
        <Route path="clientes/cadastro" element={<ClientesCadastro />} />
        <Route path="clientes/historico-vendas" element={<ClientesHistoricoVendas />} />
        <Route path="vendas" element={<VendasLista />} />
        <Route path="produtos" element={<ProdutosVisao />} />
        <Route path="produtos/lista" element={<ProdutosLista />} />
        <Route path="notas-fiscais" element={<NotasFiscais />} />
        <Route path="estoque" element={<EstoqueVisao />} />
        <Route path="estoque/movimentacoes" element={<EstoqueMovimentacoes />} />
        <Route path="calculadora/precificacao" element={<CalculadoraPrecificacao />} />
        <Route path="calculadora/pro-labore" element={<CalculadoraProLabore />} />
        <Route path="das-mensal" element={<DASMensal />} />
        <Route path="tarefas" element={<Tarefas />} />
        <Route path="tutoriais" element={<Tutoriais />} />
        <Route path="assinatura/planos" element={<AssinaturaPlanos />} />
        <Route path="assinatura/sucesso" element={<AssinaturaSucesso />} />
        <Route path="assinatura/erro" element={<AssinaturaErro />} />
        <Route path="assinatura/pendente" element={<AssinaturaPendente />} />
        <Route path="assinatura/historico" element={<AssinaturaHistorico />} />
        <Route path="perfil" element={<Perfil />} />
        <Route path="usuarios" element={<UsuariosEmpresa />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
