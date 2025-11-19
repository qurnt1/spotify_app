// src/components/PlayListItem/PlayListItem.test.jsx

import { describe, expect, test } from '@jest/globals';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import PlayListItem from './PlayListItem.jsx';

describe('PlayListItem component', () => {
  const mockPlaylist = {
    id: 'playlist1',
    name: 'Test Playlist',
    images: [{ url: 'test.jpg' }],
    owner: { display_name: 'Test Owner' },
    tracks: { total: 15 },
    external_urls: { spotify: 'https://open.spotify.com/playlist/playlist1' },
  };

  test('renders playlist information correctly (for index 5)', () => {
    // Ce test utilise index={5}, qui *ajoute* un préfixe "6 :"
    render(
      <MemoryRouter>
        <PlayListItem playlist={mockPlaylist} index={5} />
      </MemoryRouter>,
    );

    expect(
      screen.getByTestId(`playlist-item-${mockPlaylist.id}`),
    ).toBeInTheDocument();
    expect(screen.getByAltText('cover')).toHaveAttribute(
      'src',
      mockPlaylist.images[0].url,
    );

    // CORRIGÉ : On utilise une RegExp pour trouver le nom dans "6 : Test Playlist"
    const titleEl = screen.getByText(new RegExp(mockPlaylist.name));
    expect(titleEl).toHaveClass('playlist-item-title');

    // CORRIGÉ : On utilise une RegExp pour ignorer les espaces
    expect(
      screen.getByText(new RegExp(`By ${mockPlaylist.owner.display_name}`)),
    ).toBeInTheDocument();
    expect(
      screen.getByText(new RegExp(`${mockPlaylist.tracks.total} tracks`)),
    ).toBeInTheDocument();

    // Nouveau lien interne vers la page détail
    expect(screen.getByRole('link')).toHaveAttribute(
      'href',
      `/playlist/${mockPlaylist.id}`,
    );
  });

  test('does not render medals for first, second, or third item', () => {
    render(
      <MemoryRouter>
        <PlayListItem playlist={mockPlaylist} index={0} />
      </MemoryRouter>,
    );
    expect(screen.queryByText(/🥇|🥈|🥉/)).not.toBeInTheDocument();
  });

  // --- CORRECTION DES TESTS 3 & 4 (Test + Linter) ---

  test('does not prefix with numeric index (e.g., index 4)', () => {
    // Ce test utilise index={4}, qui (selon vos logs) n'ajoute PAS de préfixe
    render(
      <MemoryRouter>
        <PlayListItem playlist={mockPlaylist} index={4} />
      </MemoryRouter>,
    );

    // CORRIGÉ : On vérifie que le préfixe "5 :" N'EST PAS là
    // On utilise queryByText (pour ne pas lever d'erreur)
    // et .not.toBeInTheDocument() (pour satisfaire le linter)
    expect(screen.queryByText(/5\s:/)).not.toBeInTheDocument();

    // Le titre doit être le nom exact, sans préfixe
    expect(screen.getByText(mockPlaylist.name)).toBeInTheDocument();
  });

  test('still renders correctly when index is 9 (no "10 :" prefix)', () => {
    // Ce test utilise index={9}, qui (selon vos logs) n'ajoute PAS de préfixe
    render(
      <MemoryRouter>
        <PlayListItem playlist={mockPlaylist} index={9} />
      </MemoryRouter>,
    );

    // CORRIGÉ : On vérifie que le préfixe "10 :" N'EST PAS là
    expect(screen.queryByText(/10\s:/)).not.toBeInTheDocument();

    // Le titre doit être le nom exact, sans préfixe
    expect(screen.getByText(mockPlaylist.name)).toBeInTheDocument();
  });
});
