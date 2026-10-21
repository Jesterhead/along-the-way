import { Route, Routes } from 'react-router';

import { HomePage } from './pages/home/HomePage';
import { JournalPage } from './pages/journal/JournalPage';

export function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/journals/:id" element={<JournalPage />} />
    </Routes>
  );
}
