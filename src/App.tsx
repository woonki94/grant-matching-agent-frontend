import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LandingPage } from './pages/LandingPage';
import { FindGrantPage } from './pages/FindGrantPage';
import { TeamBuilderPage } from './pages/TeamBuilderPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/find-grant" element={<FindGrantPage />} />
        <Route path="/team-builder" element={<TeamBuilderPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
