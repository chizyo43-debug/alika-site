import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import BookExperience from './book-experience';
import './book.css';

const root = document.getElementById('root');

if (!root) {
  throw new Error('AliKa uygulama kökü bulunamadı.');
}

createRoot(root).render(
  <StrictMode>
    <BookExperience />
  </StrictMode>,
);
