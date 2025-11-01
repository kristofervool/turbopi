import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Search from './pages/Search';
import Library from './pages/Library';
import Downloads from './pages/Downloads';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Search />} />
          <Route path="/library" element={<Library />} />
          <Route path="/downloads" element={<Downloads />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
