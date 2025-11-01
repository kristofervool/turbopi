import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Search from './pages/Search';
import Library from './pages/Library';
import Downloads from './pages/Downloads';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app">
        <nav className="navbar">
          <h1 className="logo">🎬 TurboPi</h1>
          <div className="nav-links">
            <Link to="/">Search</Link>
            <Link to="/library">Library</Link>
            <Link to="/downloads">Downloads</Link>
          </div>
        </nav>

        <main className="main-content">
          <Routes>
            <Route path="/" element={<Search />} />
            <Route path="/library" element={<Library />} />
            <Route path="/downloads" element={<Downloads />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
