import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import WorkspacePage from './pages/WorkspacePage';
import ArchitecturePage from './pages/ArchitecturePage';
import AboutPage from './pages/AboutPage';
import './App.css';

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <Navbar />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/workspace" element={<WorkspacePage />} />
          <Route path="/architecture" element={<ArchitecturePage />} />
          <Route path="/about" element={<AboutPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}