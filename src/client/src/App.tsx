import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Search from './pages/Search';
import Library from './pages/Library';
import Downloads from './pages/Downloads';
import Playback from './pages/Playback';

function App() {
  return (
    <Router>
      <Routes>
        {/* Playback route without layout */}
        <Route path="/playback" element={<Playback />} />

        {/* Other routes with layout */}
        <Route path="*" element={
          <Layout>
            <Routes>
              <Route path="/" element={<Search />} />
              <Route path="/library" element={<Library />} />
              <Route path="/downloads" element={<Downloads />} />
            </Routes>
          </Layout>
        } />
      </Routes>
    </Router>
  );
}

export default App;
