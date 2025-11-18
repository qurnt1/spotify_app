// src/components/TrackItem.test.jsx

import { describe, expect, test } from '@jest/globals'
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import TrackItem from './TrackItem';

describe('TrackItem component', () => {

    test('renders track information correctly without index prefix', () => {
        const track = {
            id: 't1',
            name: 'Test Track',
            artists: [{ name: 'Test Artist' }],
            album: { name: 'Test Album', images: [{ url: 'test.jpg' }] },
            popularity: 50,
            external_urls: { spotify: 'https://open.spotify.com/test' }
        };
        render(<TrackItem track={track} />);
        expect(screen.getByText('Test Track')).toBeInTheDocument();
        expect(screen.getByText('Test Artist')).toBeInTheDocument();
        expect(screen.getByText('Test Album')).toBeInTheDocument();
        expect(screen.getByText('Popularity: 50')).toBeInTheDocument();
        expect(screen.getByRole('link')).toHaveAttribute('href', 'https://open.spotify.com/test');
    });

    test('renders correct prefixes when index prop is provided', () => {
        const baseTrack = (i) => ({
            id: `t${i}`,
            name: `Track ${i + 1}`,
            artists: [{ name: 'Artist' }],
            album: { name: 'Album', images: [{ url: 'test.jpg' }] },
            popularity: 10,
            external_urls: { spotify: 'https://open.spotify.com/test' }
        });

        // gold
        render(<TrackItem track={baseTrack(0)} index={0} />);
        expect(screen.getByText('🥇 : Track 1')).toBeInTheDocument();
        // silver
        render(<TrackItem track={baseTrack(1)} index={1} />);
        expect(screen.getByText('🥈 : Track 2')).toBeInTheDocument();
        // bronze
        render(<TrackItem track={baseTrack(2)} index={2} />);
        expect(screen.getByText('🥉 : Track 3')).toBeInTheDocument();
        // numeric prefix for 4th
        render(<TrackItem track={baseTrack(3)} index={3} />);
        expect(screen.getByText('4 : Track 4')).toBeInTheDocument();
    });

});
