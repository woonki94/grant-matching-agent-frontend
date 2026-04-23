import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LandingPage } from './pages/LandingPage';
import { FindGrantPage } from './pages/FindGrantPage';
import { TeamBuilderLandingPage } from './pages/TeamBuilderLandingPage';
import { FindGrantsForTeamPage } from './pages/FindGrantsForTeamPage';
import { FindCollaboratorsPage } from './pages/FindCollaboratorsPage';
import { FormTeamPage } from './pages/FormTeamPage';
import { FacultyProfilePage } from './pages/FacultyProfilePage';

import LoginPage from './LoginPage';
import SignupPage from './SignupPage';
import AuthGuard from './AuthGuard';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/signup" element={<AuthGuard> <SignupPage /> </AuthGuard>} />
        <Route path="/landing" element={<AuthGuard> <LandingPage /> </AuthGuard>} />
        <Route path="/find-grant" element={<AuthGuard> <FindGrantPage /> </AuthGuard>} />
        <Route path="/team-builder" element={<AuthGuard> <TeamBuilderLandingPage /> </AuthGuard>} />
        <Route path="/team-builder/find-grants" element={<AuthGuard> <FindGrantsForTeamPage /> </AuthGuard>} />
        <Route path="/team-builder/find-collaborators" element={<AuthGuard> <FindCollaboratorsPage /> </AuthGuard>} />
        <Route path="/team-builder/form-team" element={<AuthGuard> <FormTeamPage /> </AuthGuard>} />
        <Route path="/faculty-profile" element={<AuthGuard> <FacultyProfilePage /> </AuthGuard>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
