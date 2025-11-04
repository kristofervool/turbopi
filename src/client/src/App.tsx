import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Search from './pages/Search';
import Library from './pages/Library';
import Downloads from './pages/Downloads';
import Playback from './pages/Playback';
import ShowsSearch from './pages/ShowsSearch';
import ShowsLibrary from './pages/ShowsLibrary';

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
              <Route path="/shows" element={<ShowsSearch />} />
              <Route path="/shows/library" element={<ShowsLibrary />} />
            </Routes>
          </Layout>
        } />
      </Routes>
    </Router>
  );
}

export default App;
