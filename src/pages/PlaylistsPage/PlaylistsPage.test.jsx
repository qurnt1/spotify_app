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

// Mock playlists data
const playlistsData = {
  items: [
    { id: 'playlist1', name: 'My Playlist 1', images: [{ url: 'https://via.placeholder.com/56' }], owner: { display_name: 'User1' }, tracks: { total: 5 }, external_urls: { spotify: 'https://open.spotify.com/playlist/playlist1' } },
    { id: 'playlist2', name: 'My Playlist 2', images: [{ url: 'https://via.placeholder.com/56' }], owner: { display_name: 'User2' }, tracks: { total: 10 }, external_urls: { spotify: 'https://open.spotify.com/playlist/playlist2' } },
  ],
  total: 2,
};

const tokenValue = 'test-token';

describe('PlaylistsPage', () => {
  beforeEach(() => {
    // Mock token
    jest
      .spyOn(window.localStorage.__proto__, 'getItem')
      .mockImplementation(key => (key === KEY_ACCESS_TOKEN ? tokenValue : null));
    // Default mock API
    jest
      .spyOn(spotifyApi, 'fetchUserPlaylists')
      .mockResolvedValue({ data: playlistsData, error: null });
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
    // <output> a le rôle implicite "status"
    expect(screen.getByRole('status')).toHaveTextContent(/loading playlists/i);
    await waitFor(() => {
      expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument();
    });
  };

  test('rend la page et affiche un H2 "Top N playlist(s)"', async () => {
    renderPlaylistsPage();

    expect(document.title).toBe(buildTitle('Playlists'));
    await waitForLoadingToFinish();

    expect(spotifyApi.fetchUserPlaylists).toHaveBeenCalledTimes(1);
    expect(spotifyApi.fetchUserPlaylists).toHaveBeenCalledWith(tokenValue, limit);

    const heading1 = await screen.findByRole('heading', { level: 1, name: 'Your Playlists' });
    expect(heading1).toBeInTheDocument();

    const expectedCount = Math.min(playlistsData.items.length, limit);
    const h2Label = `Top ${expectedCount} playlist${expectedCount !== 1 ? 's' : ''}`;
    const countHeading = await screen.findByRole('heading', { level: 2, name: h2Label });
    expect(countHeading).toBeInTheDocument();

    for (const playlist of playlistsData.items) {
      expect(await screen.findByTestId(`playlist-item-${playlist.id}`)).toBeInTheDocument();
    }
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
    // Mock du handler pour déclencher la navigation
    jest.spyOn(tokenUtils, 'handleTokenError').mockImplementation((err, navigate) => {
      if (err && typeof navigate === 'function') navigate('/login');
      return true; // indique "géré"
    });

    // Réponse API avec shape compatible avec le composant
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

    const expectedCount = Math.min(playlistsData.items.length, limit);
    const h2Label = `Top ${expectedCount} playlist${expectedCount !== 1 ? 's' : ''}`;
    const heading2 = screen.getByRole('heading', { level: 2, name: h2Label });
    expect(heading2).toHaveClass('playlists-count');

    const list = screen.getByRole('list');
    expect(list).toHaveClass('playlists-list');
  });
});
