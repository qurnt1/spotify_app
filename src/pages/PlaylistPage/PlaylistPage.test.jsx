import { describe, expect, test, beforeEach, afterEach, jest } from '@jest/globals';
import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import PlaylistPage from './PlaylistPage.jsx';
import * as spotifyApi from '../../api/spotify-playlists.js';
import * as handleTokenErrorModule from '../../utils/handleTokenError.js';

// --- MOCK ---
jest.mock('../../hooks/useRequireToken.js', () => ({
  useRequireToken: jest.fn(() => ({ token: 'test-token', checking: false }))
}));

const playlistData = {
  id: 'playlist1',
  name: 'My Playlist 1',
  description: 'A cool playlist',
  images: [{ url: 'https://via.placeholder.com/56' }],
  owner: { display_name: 'User1' },
  external_urls: { spotify: 'https://open.spotify.com/playlist/playlist1' },
  tracks: {
    total: 5,
    items: [
      {
        track: {
          id: 'track1',
          name: 'Track One',
          artists: [{ name: 'Artist A' }],
          album: { name: 'Album X', images: [{ url: 'https://via.placeholder.com/56' }] },
          duration_ms: 210000,
          external_urls: { spotify: 'https://open.spotify.com/track/track1' },
        },
      },
    ],
  },
};

describe('PlaylistPage', () => {
  beforeEach(() => {
    jest
      .spyOn(spotifyApi, 'fetchPlaylistById')
      .mockResolvedValue({ data: playlistData, error: null });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('fetches and renders playlist, sets title', async () => {
    render(
      <MemoryRouter initialEntries={['/playlist/playlist1']}>
        <Routes>
          <Route path="/playlist/:id" element={<PlaylistPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(document.title).toBe('Playlist | Music Discovery App');

    // loading state
    expect(screen.getByRole('status')).toHaveTextContent(/loading playlist/i);

    // wait for loading to finish
    await waitFor(() => {
      expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument();
    });

    // verify title rendered
    const heading = await screen.findByRole('heading', {
      level: 1,
      name: playlistData.name,
    });
    expect(heading).toBeInTheDocument();

    // verify cover image rendered
    // CORRECTION ICI : on cherche juste le nom, pas "Cover of..."
    const img = screen.getByAltText(playlistData.name);
    expect(img).toHaveAttribute('src', playlistData.images[0].url);

    // verify description rendered
    expect(screen.getByText(playlistData.description)).toBeInTheDocument();

    // verify Spotify link rendered
    const link = screen.getByRole('link', { name: /spotify/i });
    expect(link).toHaveAttribute('href', playlistData.external_urls.spotify);

    // verify tracks rendered
    for (const track of playlistData.tracks.items) {
      expect(await screen.findByTestId(`track-item-${track.track.id}`)).toBeInTheDocument();
    }

    // verify API called with correct params
    await waitFor(() => {
      expect(spotifyApi.fetchPlaylistById).toHaveBeenCalledTimes(1);
      expect(spotifyApi.fetchPlaylistById).toHaveBeenCalledWith('test-token', 'playlist1');
    });
  });

  test('displays error message on fetch failure', async () => {
    jest
      .spyOn(spotifyApi, 'fetchPlaylistById')
      .mockResolvedValue({ data: null, error: 'Failed to fetch playlist' });

    render(
      <MemoryRouter initialEntries={['/playlist/playlist1']}>
        <Routes>
          <Route path="/playlist/:id" element={<PlaylistPage />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument();
    });

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Failed to fetch playlist');
  });

  test('displays error message on fetchPlaylistById failure', async () => {
    jest
      .spyOn(spotifyApi, 'fetchPlaylistById')
      .mockRejectedValue(new Error('API error occurred'));

    render(
      <MemoryRouter initialEntries={['/playlist/playlist1']}>
        <Routes>
          <Route path="/playlist/:id" element={<PlaylistPage />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument();
    });

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('API error occurred');
  });

  test('handleTokenError called on token expiry error', async () => {
    const handleTokenErrorSpy = jest.spyOn(handleTokenErrorModule, 'handleTokenError');
    
    jest
      .spyOn(spotifyApi, 'fetchPlaylistById')
      .mockResolvedValue({ data: null, error: 'The access token expired' });

    render(
      <MemoryRouter initialEntries={['/playlist/playlist1']}>
        <Routes>
          <Route path="/playlist/:id" element={<PlaylistPage />} />
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument();
    });

    expect(handleTokenErrorSpy).toHaveBeenCalledWith(
      'The access token expired',
      expect.any(Function),
    );
  });
});