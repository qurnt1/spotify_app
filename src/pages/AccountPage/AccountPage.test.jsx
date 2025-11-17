import { describe, expect, test, beforeEach, afterEach, jest } from '@jest/globals';
import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import AccountPage from './AccountPage.jsx';
import * as spotifyApi from '../../api/spotify-me.js';
import * as tokenUtils from '../../utils/handleTokenError.js';
import { KEY_ACCESS_TOKEN } from '../../constants/storageKeys.js';

// Mock profile data
const profileData = {
  display_name: 'Test User',
  email: 'account@example.com',
  images: [{ url: 'https://via.placeholder.com/150' }],
  country: 'US',
  product: 'premium',
  external_urls: {
    spotify: 'https://open.spotify.com/user/account',
  },
};

// Mock token value
const tokenValue = 'test-token';

// Tests for AccountPage
describe('AccountPage', () => {
  // Setup mocks before each test
  beforeEach(() => {
    // Mock localStorage token access
    jest
      .spyOn(window.localStorage.__proto__, 'getItem')
      .mockImplementation((key) => (key === KEY_ACCESS_TOKEN ? tokenValue : null));

    // Default mock: successful profile fetch
    jest
      .spyOn(spotifyApi, 'fetchAccountProfile')
      .mockResolvedValue({ data: profileData, error: null });
  });

  // Restore mocks after each test
  afterEach(() => {
    jest.restoreAllMocks();
  });

  // Helper to render AccountPage
  const renderAccountPage = () => {
    return render(
      <MemoryRouter initialEntries={['/account']}>
        <Routes>
          <Route path="/account" element={<AccountPage />} />
          {/* Dummy login route for redirection when token is expired */}
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>,
    );
  };

  // Helper to wait for loading to finish
  const waitForLoadingToFinish = async () => {
    // <output> a par défaut le rôle "status"
    expect(screen.getByRole('status')).toHaveTextContent(/loading account info/i);
    await waitFor(() => {
      expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument();
    });
  };

  test('renders account profile information', async () => {
    renderAccountPage();

    expect(document.title).toBe('Account | Spotify App');

    await waitForLoadingToFinish();

    // should call fetchAccountProfile with the token
    expect(spotifyApi.fetchAccountProfile).toHaveBeenCalledTimes(1);
    expect(spotifyApi.fetchAccountProfile).toHaveBeenCalledWith(tokenValue);

    // heading level 1
    const heading = await screen.findByRole('heading', {
      level: 1,
      name: 'Spotify Account Info',
    });
    expect(heading).toBeInTheDocument();

    // avatar
    const img = await screen.findByAltText('avatar');
    expect(img).toHaveAttribute('src', profileData.images[0].url);
    expect(img).toHaveAttribute('alt', 'avatar');

    // heading level 2: display name
    const heading2 = await screen.findByRole('heading', {
      level: 2,
      name: profileData.display_name,
    });
    expect(heading2).toBeInTheDocument();

    // profile details
    expect(await screen.findByText(profileData.email)).toBeInTheDocument();
    expect(await screen.findByText(profileData.country)).toBeInTheDocument();
    expect(await screen.findByText(profileData.product)).toBeInTheDocument();

    // link to Spotify profile
    const profileLink = await screen.findByRole('link', {
      name: 'Open Spotify Profile',
    });
    expect(profileLink).toHaveAttribute('href', profileData.external_urls.spotify);
  });

  test('displays error message on fetch failure (resolved error)', async () => {
    // Mock fetchAccountProfile to return an error
    jest
      .spyOn(spotifyApi, 'fetchAccountProfile')
      .mockResolvedValue({ data: null, error: 'Failed to fetch profile' });

    renderAccountPage();
    await waitForLoadingToFinish();

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Failed to fetch profile');
  });

  test('displays error message when fetchAccountProfile rejects', async () => {
    // Mock fetchAccountProfile to throw an error
    jest
      .spyOn(spotifyApi, 'fetchAccountProfile')
      .mockRejectedValue(new Error('Network error'));

    renderAccountPage();
    await waitForLoadingToFinish();

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Network error');
  });

  test('redirects to login on token expiration', async () => {
    // On mock handleTokenError pour forcer la redirection dans le test
    jest
      .spyOn(tokenUtils, 'handleTokenError')
      .mockImplementation((err, navigate) => {
        if (navigate && typeof navigate === 'function') {
          navigate('/login');
        }
        return true; // indique que l’erreur a été gérée (token expiré)
      });

    // Mock fetchAccountProfile to return token expired error
    jest
      .spyOn(spotifyApi, 'fetchAccountProfile')
      .mockResolvedValue({ data: null, error: 'The access token expired' });

    renderAccountPage();
    await waitForLoadingToFinish();

    const login = await screen.findByText('Login Page');
    expect(login).toBeInTheDocument();
  });

  test('verify styling and accessibility attributes using role', async () => {
    renderAccountPage();

    const loadingIndicator = screen.getByRole('status');
    expect(loadingIndicator).toHaveAttribute('aria-live', 'polite');

    await waitForLoadingToFinish();

    const container = screen.getByRole('region', {
      name: /spotify account info/i,
    });
    expect(container).toHaveClass('account-page', 'page-container');

    const title = screen.getByRole('heading', {
      level: 1,
      name: /spotify account info/i,
    });
    expect(title).toHaveClass('page-title');

    const detailsSection = screen.getByRole('region', {
      name: /account details/i,
    });
    expect(detailsSection).toHaveClass('account-details');

    const profileLink = screen.getByRole('link', { name: 'Open Spotify Profile' });
    expect(profileLink).toHaveClass('account-link');
  });
});
