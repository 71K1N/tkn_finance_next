"use client"
import Link from 'next/link'
import { Home, List, Grid, CreditCard, DollarSign } from 'react-feather'
import { usePathname } from 'next/navigation'

export default function Navbar() {
    const pathname = usePathname()

    return (
        <nav className="navbar navbar-expand-lg navbar-dark bg-dark mb-4">
            <div className="container-fluid">
                <Link href="/" className="navbar-brand">
                    TKN Finance
                </Link>
                
                <button 
                    className="navbar-toggler" 
                    type="button" 
                    data-bs-toggle="collapse" 
                    data-bs-target="#navbarNav" 
                    aria-controls="navbarNav" 
                    aria-expanded="false" 
                    aria-label="Toggle navigation"
                >
                    <span className="navbar-toggler-icon"></span>
                </button>

                <div className="collapse navbar-collapse" id="navbarNav">
                    <ul className="navbar-nav">
                        <li className="nav-item">
                            <Link 
                                href="/" 
                                className={`nav-link ${pathname === '/' ? 'active' : ''}`}
                            >
                                <Home size={18} className="me-1" />
                                Home
                            </Link>
                        </li>
                        <li className="nav-item">
                            <Link 
                                href="/category" 
                                className={`nav-link ${pathname === '/category' ? 'active' : ''}`}
                            >
                                <List size={18} className="me-1" />
                                Categorias
                            </Link>
                        </li>
                        <li className="nav-item">
                            <Link 
                                href="/subcategory" 
                                className={`nav-link ${pathname === '/subcategory' ? 'active' : ''}`}
                            >
                                <Grid size={18} className="me-1" />
                                Subcategorias
                            </Link>
                        </li>
                        <li className="nav-item">
                            <Link 
                                href="/account" 
                                className={`nav-link ${pathname === '/account' ? 'active' : ''}`}
                            >
                                <CreditCard size={18} className="me-1" />
                                Contas
                            </Link>
                        </li>
                        <li className="nav-item">
                            <Link 
                                href="/transaction" 
                                className={`nav-link ${pathname === '/transaction' ? 'active' : ''}`}
                            >
                                <DollarSign size={18} className="me-1" />
                                Transações
                            </Link>
                        </li>
                    </ul>
                </div>
            </div>
        </nav>
    )
}