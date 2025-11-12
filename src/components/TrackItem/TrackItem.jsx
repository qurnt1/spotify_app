import './TrackItem.css';
import '../ListItem.css';

/**
 * Displays a single track item with its details.
 * @param {*} track  
 * @returns JSX.Element
 */
export default function TrackItem({ track, index }) {
  const getPrefix = (i) => {
    if (typeof i !== 'number') return '';
    if (i === 0) return '🥇 : ';
    if (i === 1) return '🥈 : ';
    if (i === 2) return '🥉 : ';
    if (i > 2) return `${i + 1} : `;
    return '';
  };

  return (
  <li className="list-item track-item" data-testid={`track-item-${track.id}`}>
      <img
        src={track.album.images[2]?.url || track.album.images[0]?.url}
        alt="cover"
        className="track-cover"
      />
      <div className="track-details">
        <div className="track-details-header">
          <div className="track-title">{`${getPrefix(index)}${track.name}`}</div>
          <div className="track-artists">{track.artists.map(a => a.name).join(', ')}</div>
        </div>
        <div className="track-album">{track.album.name}</div>
        <div className="track-popularity">Popularity: {track.popularity}</div>
      </div>
      <a
        href={track.external_urls.spotify}
        target="_blank"
        rel="noopener noreferrer"
        className="track-link"
      >
        Open
      </a>
    </li>
  );
}
