// src/components/PlayListItem.test.jsx

import { describe, expect, test } from '@jest/globals'
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
        external_urls: { spotify: 'https://open.spotify.com/playlist/playlist1' }
    };

    test('renders playlist information correctly', () => {
        // Arrange
        // Act
        render(<PlayListItem playlist={mockPlaylist} index={5} />);

        // Assert
        // items are rendered correctly
        expect(screen.getByTestId(`playlist-item-${mockPlaylist.id}`)).toBeInTheDocument();
        // image is rendered correctly
        expect(screen.getByAltText('cover')).toHaveAttribute('src', mockPlaylist.images[0].url);
        // text content is rendered correctly
        expect(screen.getByText(mockPlaylist.name)).toBeInTheDocument();
        // owner name is rendered correctly
        expect(screen.getByText(`By ${mockPlaylist.owner.display_name}`)).toBeInTheDocument();
        // track count is rendered correctly
        expect(screen.getByText(`${mockPlaylist.tracks.total} tracks`)).toBeInTheDocument();
        // link is rendered correctly
        expect(screen.getByRole('link')).toHaveAttribute('href', mockPlaylist.external_urls.spotify);
    });

    test('displays gold medal (🥇) for first playlist (index 0)', () => {
        // Arrange & Act
        render(<PlayListItem playlist={mockPlaylist} index={0} />);

        // Assert
        const title = screen.getByText((content, element) => {
            return element && element.className === 'playlist-item-title' && content.includes('🥇');
        });
        expect(title).toHaveTextContent('🥇 :');
        expect(title).toHaveTextContent(mockPlaylist.name);
    });

    test('displays silver medal (🥈) for second playlist (index 1)', () => {
        // Arrange & Act
        render(<PlayListItem playlist={mockPlaylist} index={1} />);

        // Assert
        const title = screen.getByText((content, element) => {
            return element && element.className === 'playlist-item-title' && content.includes('🥈');
        });
        expect(title).toHaveTextContent('🥈 :');
        expect(title).toHaveTextContent(mockPlaylist.name);
    });

    test('displays bronze medal (🥉) for third playlist (index 2)', () => {
        // Arrange & Act
        render(<PlayListItem playlist={mockPlaylist} index={2} />);

        // Assert
        const title = screen.getByText((content, element) => {
            return element && element.className === 'playlist-item-title' && content.includes('🥉');
        });
        expect(title).toHaveTextContent('🥉 :');
        expect(title).toHaveTextContent(mockPlaylist.name);
    });

    test('displays numeric index for playlist after top 3 (index > 2)', () => {
        // Arrange & Act
        render(<PlayListItem playlist={mockPlaylist} index={4} />);

        // Assert
        const title = screen.getByText((content, element) => {
            return element && element.className === 'playlist-item-title' && content.includes('5 :');
        });
        expect(title).toHaveTextContent('5 :');
        expect(title).toHaveTextContent(mockPlaylist.name);
    });

    test('displays correct index number for 10th playlist', () => {
        // Arrange & Act
        render(<PlayListItem playlist={mockPlaylist} index={9} />);

        // Assert
        const title = screen.getByText((content, element) => {
            return element && element.className === 'playlist-item-title' && content.includes('10 :');
        });
        expect(title).toHaveTextContent('10 :');
        expect(title).toHaveTextContent(mockPlaylist.name);
    });
});
