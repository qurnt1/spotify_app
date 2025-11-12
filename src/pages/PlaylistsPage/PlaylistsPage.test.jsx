// src/pages/PlaylistsPage.test.jsx
import { describe, expect, test, beforeEach, afterEach, jest } from '@jest/globals';
import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import PlaylistsPage, { limit } from './PlaylistsPage.jsx';
import * as spotifyApi from '../../api/spotify-me.js';
import * as tokenUtils from '../../utils/handleTokenError.js';
import { KEY_ACCESS_TOKEN } from '../../constants/storageKeys.js';
import { buildTitle } from '../../constants/appMeta.js';

// Scenario A: total <= limit
const playlistsDataSmall = {
  items: [
    { id: 'playlist1', name: 'My Playlist 1', images: [{ url: 'https://via.placeholder.com/56' }], owner: { display_name: 'User1' }, tracks: { total: 5 }, external_urls: { spotify: 'https://open.spotify.com/playlist/playlist1' } },
    { id: 'playlist2', name: 'My Playlist 2', images: [{ url: 'https://via.placeholder.com/56' }], owner: { display_name: 'User2' }, tracks: { total: 10 }, external_urls: { spotify: 'https://open.spotify.com/playlist/playlist2' } },
  ],
  total: 2,
};

// Scenario B: total > limit (items contient 10, total=15)
const makeLargeData = () => {
  const items = Array.from({ length: 10 }, (_, i) => ({
    id: `playlist${i + 1}`,
    name: `Playlist ${i + 1}`,
    images: [{ url: 'https://via.placeholder.com/56' }],
    owner: { display_name: `Owner${i + 1}` },
    tracks: { total: (i + 1) * 3 },
    external_urls: { spotify: `https://open.spotify.com/playlist/playlist${i + 1}` },
  }));
  return { items, total: 15 };
};

const tokenValue = 'test-token';

describe('PlaylistsPage', () => {
  beforeEach(() => {
    jest
      .spyOn(window.localStorage.__proto__, 'getItem')
      .mockImplementation(key => (key === KEY_ACCESS_TOKEN ? tokenValue : null));

    jest
      .spyOn(spotifyApi, 'fetchUserPlaylists')
      .mockResolvedValue({ data: playlistsDataSmall, error: null });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const renderPlaylistsPage = () =>
    render(
      <MemoryRouter initialEntries={['/playlists']}>
        <Routes>
          <Route path="/playlists" element={<PlaylistsPage />} />
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>,
    );

  const waitForLoadingToFinish = async () => {
    expect(screen.getByRole('status')).toHaveTextContent(/loading playlists/i);
    await waitFor(() => {
      expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument();
    });
  };

  test('<= limit: affiche toutes les playlists et H2 avec le total réel', async () => {
    renderPlaylistsPage();

    expect(document.title).toBe(buildTitle('Playlists'));
    await waitForLoadingToFinish();

    expect(spotifyApi.fetchUserPlaylists).toHaveBeenCalledWith(tokenValue, limit);

    const h1 = await screen.findByRole('heading', { level: 1, name: 'Your Playlists' });
    expect(h1).toBeInTheDocument();

    const h2 = await screen.findByRole('heading', { level: 2, name: `${playlistsDataSmall.total} playlists` });
    expect(h2).toBeInTheDocument();

    for (const p of playlistsDataSmall.items) {
      expect(await screen.findByTestId(`playlist-item-${p.id}`)).toBeInTheDocument();
    }
    // la liste ne doit pas être tronquée
    expect(screen.getAllByRole('listitem')).toHaveLength(playlistsDataSmall.items.length);
  });

  test('> limit: tronque l’affichage à 10 mais H2 montre le total du compte', async () => {
    const bigData = makeLargeData();
    jest.spyOn(spotifyApi, 'fetchUserPlaylists').mockResolvedValueOnce({ data: bigData, error: null });

    renderPlaylistsPage();
    await waitForLoadingToFinish();

    const h2 = screen.getByRole('heading', { level: 2, name: `${bigData.total} playlists` });
    expect(h2).toBeInTheDocument();

    // On doit afficher seulement 10 items
    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(10);

    // Vérifie que le premier et le dernier visibles existent
    expect(screen.getByTestId('playlist-item-playlist1')).toBeInTheDocument();
    expect(screen.getByTestId('playlist-item-playlist10')).toBeInTheDocument();
  });

  test('affiche un message d’erreur quand fetchUserPlaylists renvoie error', async () => {
    jest
      .spyOn(spotifyApi, 'fetchUserPlaylists')
      .mockResolvedValue({ data: { items: [], total: 0 }, error: 'Failed to fetch playlists' });

    renderPlaylistsPage();
    await waitForLoadingToFinish();

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Failed to fetch playlists');
  });

  test('affiche un message d’erreur quand fetchUserPlaylists rejette', async () => {
    jest.spyOn(spotifyApi, 'fetchUserPlaylists').mockRejectedValue(new Error('Network error'));

    renderPlaylistsPage();
    await waitForLoadingToFinish();

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Network error');
  });

  test('redirige vers /login quand le token est expiré', async () => {
    jest.spyOn(tokenUtils, 'handleTokenError').mockImplementation((err, navigate) => {
      if (err && typeof navigate === 'function') navigate('/login');
      return true;
    });

    jest
      .spyOn(spotifyApi, 'fetchUserPlaylists')
      .mockResolvedValue({ data: { items: [] }, error: 'The access token expired' });

    renderPlaylistsPage();
    await waitForLoadingToFinish();

    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });

  test('vérifie classes et rôles', async () => {
    renderPlaylistsPage();
    await waitForLoadingToFinish();

    const region = screen.getByRole('region', { name: 'Your Playlists' });
    expect(region).toHaveClass('playlists-container', 'page-container');

    const heading1 = screen.getByRole('heading', { level: 1, name: 'Your Playlists' });
    expect(heading1).toHaveClass('playlists-title', 'page-title');

    const heading2 = screen.getByRole('heading', { level: 2, name: `${playlistsDataSmall.total} playlists` });
    expect(heading2).toHaveClass('playlists-count');

    const list = screen.getByRole('list');
    expect(list).toHaveClass('playlists-list');
  });
});
