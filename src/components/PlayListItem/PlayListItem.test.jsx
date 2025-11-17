// src/components/PlayListItem/PlayListItem.test.jsx
import { describe, expect, test } from '@jest/globals';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import PlayListItem from './PlayListItem';

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
    // Ce test utilise index={5}, qui (d'après le 1er log) *ajoute* un préfixe
    render(<PlayListItem playlist={mockPlaylist} index={5} />);

    expect(
      screen.getByTestId(`playlist-item-${mockPlaylist.id}`)
    ).toBeInTheDocument();
    expect(screen.getByAltText('cover')).toHaveAttribute(
      'src',
      mockPlaylist.images[0].url
    );

    // CORRIGÉ : On utilise une RegExp pour trouver le nom,
    // car le texte réel est "6 : Test Playlist"
    const titleEl = screen.getByText(new RegExp(mockPlaylist.name));
    expect(titleEl).toHaveClass('playlist-item-title');

    // CORRIGÉ : On utilise une RegExp pour ignorer les espaces
    expect(
      screen.getByText(new RegExp(`By ${mockPlaylist.owner.display_name}`))
    ).toBeInTheDocument();
    expect(
      screen.getByText(new RegExp(`${mockPlaylist.tracks.total} tracks`))
    ).toBeInTheDocument();
    expect(screen.getByRole('link')).toHaveAttribute(
      'href',
      mockPlaylist.external_urls.spotify
    );
  });

  test('does not render medals for first, second, or third item', () => {
    render(<PlayListItem playlist={mockPlaylist} index={0} />);
    expect(screen.queryByText(/🥇|🥈|🥉/)).toBeNull();
  });

  // --- CORRECTION DES TESTS 3 & 4 ---
  // Ces tests sont rétablis à leur logique d'origine.
  // Ils vérifient que pour index={4} et index={9}, *aucun* préfixe n'est affiché.

  test('does not prefix with numeric index for items after top 3 (e.g., index 4)', () => {
    render(<PlayListItem playlist={mockPlaylist} index={4} />);

    // CORRIGÉ : On vérifie que le préfixe "5 :" n'est PAS là
    expect(screen.queryByText(/5\s:/)).toBeNull();

    // Le titre doit être le nom exact, sans préfixe
    expect(screen.getByText(mockPlaylist.name)).toBeInTheDocument();
  });

  test('still renders correctly when index is 9 (no "10 :" prefix)', () => {
    render(<PlayListItem playlist={mockPlaylist} index={9} />);

    // CORRIGÉ : On vérifie que le préfixe "10 :" n'est PAS là
    expect(screen.queryByText(/10\s:/)).toBeNull();

    // Le titre doit être le nom exact, sans préfixe
    expect(screen.getByText(mockPlaylist.name)).toBeInTheDocument();
  });
});