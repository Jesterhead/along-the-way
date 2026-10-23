import { Route, Routes } from 'react-router';

import { HomePage } from './pages/home/HomePage';
import { JournalPage } from './pages/journal/JournalPage';
import { AppLayout } from './ui/appLayout/AppLayout';

export function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/journals/:id" element={<JournalPage />} />
      </Route>
    </Routes>
  );
}
