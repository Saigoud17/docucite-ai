import { NavLink, Link } from 'react-router-dom';
import { Sparkles, ArrowRight } from 'lucide-react';

export default function Navbar() {
    return (
        <header className="topbar">
            <Link to="/" className="brand" style={{ textDecoration: 'none' }}>
                <Sparkles size={20} color="#38bdf8" />
                <span>DocuCite AI</span>
                <span className="brand-badge">RAG Citation Platform</span>
            </Link>

            <nav className="nav-links">
                <NavLink to="/" end className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                    Home
                </NavLink>
                <NavLink to="/architecture" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                    Architecture
                </NavLink>
                <NavLink to="/about" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                    About
                </NavLink>
                <Link to="/workspace" className="nav-cta">
                    Launch Workspace <ArrowRight size={14} />
                </Link>
            </nav>
        </header>
    );
}