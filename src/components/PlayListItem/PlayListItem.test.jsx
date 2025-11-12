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
    render(<PlayListItem playlist={mockPlaylist} index={5} />);

    expect(screen.getByTestId(`playlist-item-${mockPlaylist.id}`)).toBeInTheDocument();
    expect(screen.getByAltText('cover')).toHaveAttribute('src', mockPlaylist.images[0].url);
    const titleEl = screen.getByText(mockPlaylist.name);
    expect(titleEl).toHaveClass('playlist-item-title');
    expect(screen.getByText(`By ${mockPlaylist.owner.display_name}`)).toBeInTheDocument();
    expect(screen.getByText(`${mockPlaylist.tracks.total} tracks`)).toBeInTheDocument();
    expect(screen.getByRole('link')).toHaveAttribute('href', mockPlaylist.external_urls.spotify);
  });

  test('does not render medals for first, second, or third item', () => {
    render(<PlayListItem playlist={mockPlaylist} index={0} />);
    expect(screen.queryByText(/🥇|🥈|🥉/)).toBeNull();
  });

  test('does not prefix with numeric index for items after top 3', () => {
    render(<PlayListItem playlist={mockPlaylist} index={4} />);
    expect(screen.queryByText(/5\s:/)).toBeNull();
    // Title remains the plain playlist name
    expect(screen.getByText(mockPlaylist.name)).toBeInTheDocument();
  });

  test('still renders correctly when index is 9 (no "10 : " prefix)', () => {
    render(<PlayListItem playlist={mockPlaylist} index={9} />);
    expect(screen.queryByText(/10\s:/)).toBeNull();
    expect(screen.getByText(mockPlaylist.name)).toBeInTheDocument();
  });
});
