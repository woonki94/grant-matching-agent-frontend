import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LandingPage } from './pages/LandingPage';
import { FindGrantPage } from './pages/FindGrantPage';
import { TeamBuilderLandingPage } from './pages/TeamBuilderLandingPage';
import { FindGrantsForTeamPage } from './pages/FindGrantsForTeamPage';
import { FindCollaboratorsPage } from './pages/FindCollaboratorsPage';
import { FormTeamPage } from './pages/FormTeamPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/find-grant" element={<FindGrantPage />} />
        <Route path="/team-builder" element={<TeamBuilderLandingPage />} />
        <Route path="/team-builder/find-grants" element={<FindGrantsForTeamPage />} />
        <Route path="/team-builder/find-collaborators" element={<FindCollaboratorsPage />} />
        <Route path="/team-builder/form-team" element={<FormTeamPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
