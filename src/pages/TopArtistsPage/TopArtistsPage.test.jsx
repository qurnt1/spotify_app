// src/pages/TopArtistsPage/TopArtistsPage.test.jsx

import { describe, expect, test, beforeEach, afterEach, jest } from '@jest/globals';
import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import TopArtistsPage, { limit, timeRange } from './TopArtistsPage.jsx';
import * as spotifyApi from '../../api/spotify-me.js';
import * as tokenUtils from '../../utils/handleTokenError.js';
import { KEY_ACCESS_TOKEN } from '../../constants/storageKeys.js';
import { buildTitle } from '../../constants/appMeta.js';

// Mock top artists data
const artistsData = {
  items: [
    {
      id: 'artist1',
      name: 'Top Artist 1',
      images: [{ url: 'https://via.placeholder.com/56' }],
      external_urls: { spotify: 'https://open.spotify.com/artist/artist1' },
      genres: ['pop', 'rock'],
      followers: { total: 1000 },
    },
    {
      id: 'artist2',
      name: 'Top Artist 2',
      images: [{ url: 'https://via.placeholder.com/56' }],
      external_urls: { spotify: 'https://open.spotify.com/artist/artist2' },
      genres: ['jazz'],
      followers: { total: 500 },
    },
  ],
  total: 2,
};

// Mock token value
const tokenValue = 'test-token';

describe('TopArtistsPage', () => {
  beforeEach(() => {
    // Mock localStorage token access
    jest
      .spyOn(window.localStorage.__proto__, 'getItem')
      .mockImplementation((key) => (key === KEY_ACCESS_TOKEN ? tokenValue : null));

    // Default mock: successful top artists fetch
    jest
      .spyOn(spotifyApi, 'fetchUserTopArtists')
      .mockResolvedValue({ data: artistsData, error: null });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // Helper to render TopArtistsPage
  const renderTopArtistsPage = () =>
    render(
      <MemoryRouter initialEntries={['/top-artists']}>
        <Routes>
          <Route path="/top-artists" element={<TopArtistsPage />} />
          {/* Dummy login route for redirection when token is expired */}
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>,
    );

  // Helper to wait for loading to finish
  const waitForLoadingToFinish = async () => {
    // <output> a par défaut le rôle "status"
    expect(screen.getByRole('status')).toHaveTextContent(/loading top artists/i);
    await waitFor(() => {
      expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument();
    });
  };

  test('fetches and renders top artists, sets title', async () => {
    renderTopArtistsPage();

    // Check document title
    expect(document.title).toBe(buildTitle('Top Artists'));

    await waitForLoadingToFinish();

    // should call fetchUserTopArtists with the token
    expect(spotifyApi.fetchUserTopArtists).toHaveBeenCalledTimes(1);
    expect(spotifyApi.fetchUserTopArtists).toHaveBeenCalledWith(
      tokenValue,
      limit,
      timeRange,
    );

    // should render a heading of level 1 with text 'Your Top X Artists of the Month'
    const heading = await screen.findByRole('heading', {
      level: 1,
      name: `Your Top ${limit} Artists of the Month`,
    });
    expect(heading).toBeInTheDocument();

    // verify each artist item rendered
    for (const artist of artistsData.items) {
      expect(
        await screen.findByTestId(`top-artist-item-${artist.id}`),
      ).toBeInTheDocument();
    }
  });

  test('displays error message on fetchUserTopArtists error', async () => {
    // Mock fetchUserTopArtists to return an error
    jest.spyOn(spotifyApi, 'fetchUserTopArtists').mockResolvedValue({
      data: { items: [] },
      error: 'Failed to fetch top artists',
    });

    renderTopArtistsPage();
    await waitForLoadingToFinish();

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/failed to fetch top artists/i);
  });

  test('displays error message on fetchUserTopArtists failure', async () => {
    // Mock fetchUserTopArtists to throw an error
    jest
      .spyOn(spotifyApi, 'fetchUserTopArtists')
      .mockRejectedValue(new Error('Network error'));

    renderTopArtistsPage();
    await waitForLoadingToFinish();

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Network error');
  });

  test('redirects to login on token expiration', async () => {
    // On mock handleTokenError pour qu'il utilise navigate('/login')
    jest
      .spyOn(tokenUtils, 'handleTokenError')
      .mockImplementation((err, navigate) => {
        if (err && typeof navigate === 'function') {
          navigate('/login');
        }
        return true; // indique que l’erreur a été gérée (token expiré)
      });

    // Mock fetchUserTopArtists pour renvoyer une erreur de token expiré
    jest.spyOn(spotifyApi, 'fetchUserTopArtists').mockResolvedValue({
      data: { items: [] },
      error: 'The access token expired',
    });

    renderTopArtistsPage();
    await waitForLoadingToFinish();

    // on attend que la route /login soit rendue
    const login = await screen.findByText('Login Page');
    expect(login).toBeInTheDocument();
  });

  test('verify styling and accessibility attributes using role', async () => {
    renderTopArtistsPage();
    await waitForLoadingToFinish();

    const region = screen.getByRole('region', {
      name: `Your Top ${limit} Artists of the Month`,
    });
    expect(region).toHaveClass('artists-container', 'page-container');

    const heading1 = screen.getByRole('heading', {
      level: 1,
      name: `Your Top ${limit} Artists of the Month`,
    });
    expect(heading1).toHaveClass('artists-title', 'page-title');

    const list = screen.getByRole('list');
    expect(list).toHaveClass('artists-list');
  });
});
