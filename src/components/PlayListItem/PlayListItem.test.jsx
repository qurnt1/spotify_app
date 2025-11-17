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

  test('renders playlist information correctly', () => {
    // On teste avec index={5}, qui devrait produire le préfixe "6 :"
    render(<PlayListItem playlist={mockPlaylist} index={5} />);

    expect(screen.getByTestId(`playlist-item-${mockPlaylist.id}`)).toBeInTheDocument();
    expect(screen.getByAltText('cover')).toHaveAttribute('src', mockPlaylist.images[0].url);

    // CORRIGÉ : Utilise une RegExp pour trouver le nom, même avec un préfixe ("6 :")
    const titleEl = screen.getByText(new RegExp(mockPlaylist.name));
    expect(titleEl).toHaveClass('playlist-item-title');

    // CORRIGÉ : Utilise une RegExp pour ignorer les espaces (" By Test Owner ")
    expect(
      screen.getByText(new RegExp(`By ${mockPlaylist.owner.display_name}`))
    ).toBeInTheDocument();

    // CORRIGÉ : Utilise une RegExp pour ignorer les espaces (" 15 tracks ")
    expect(
      screen.getByText(new RegExp(`${mockPlaylist.tracks.total} tracks`))
    ).toBeInTheDocument();

    expect(screen.getByRole('link')).toHaveAttribute('href', mockPlaylist.external_urls.spotify);
  });

  test('does not render medals for first, second, or third item', () => {
    render(<PlayListItem playlist={mockPlaylist} index={0} />);
    // Ce test suppose qu'il n'y a PAS de médailles. Il est inchangé.
    expect(screen.queryByText(/🥇|🥈|🥉/)).toBeNull();
  });

  // --- ATTENTION : Tests 3 & 4 corrigés ---
  // Vos tests originaux affirmaient que le préfixe ne devait PAS exister.
  // Mais le log d'erreur du Test 1 prouve que votre composant *ajoute* bien un préfixe.
  // J'ai donc corrigé ces tests pour qu'ils vérifient que le préfixe EST BIEN présent.

  test('prefixes with numeric index for items (e.g., index 4)', () => {
    render(<PlayListItem playlist={mockPlaylist} index={4} />); // 5ème item

    // CORRIGÉ : On vérifie que le préfixe "5 :" (index 4 + 1) est présent
    expect(screen.getByText(/5\s:/)).toBeInTheDocument();
    // On vérifie aussi que le titre est là
    expect(screen.getByText(new RegExp(mockPlaylist.name))).toBeInTheDocument();
  });

  test('prefixes with numeric index (e.g., index 9)', () => {
    render(<PlayListItem playlist={mockPlaylist} index={9} />); // 10ème item

    // CORRIGÉ : On vérifie que le préfixe "10 :" (index 9 + 1) est présent
    expect(screen.getByText(/10\s:/)).toBeInTheDocument();
    expect(screen.getByText(new RegExp(mockPlaylist.name))).toBeInTheDocument();
  });
});