import { Navigate } from 'react-router-dom'

/** Redirecionado: vendas estão em /dashboard/vendas */
export default function ClientesHistoricoVendas() {
  return <Navigate to="/dashboard/vendas" replace />
}
