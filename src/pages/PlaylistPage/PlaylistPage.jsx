import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { buildTitle } from '../../constants/appMeta.js';
import { useRequireToken } from '../../hooks/useRequireToken.js';
import { fetchPlaylistById } from '../../api/spotify-playlists.js';
import { handleTokenError } from '../../utils/handleTokenError.js';
import TrackItem from '../../components/TrackItem/TrackItem.jsx';
import '../PageLayout.css';
import '../../styles/PlaylistDetailPage.css';

export default function PlaylistPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useRequireToken();

  const [playlist, setPlaylist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // titre générique au chargement
  useEffect(() => {
    document.title = buildTitle('Playlist');
  }, []);

  useEffect(() => {
    if (!token || !id) return;

    fetchPlaylistById(token, id)
      .then((res) => {
        if (res.error) {
          // gestion expiration token / redirection
          if (handleTokenError(res.error, navigate)) {
            return;
          }
          setError(res.error);
          setLoading(false);
          return;
        }

        setPlaylist(res.data);
        setLoading(false);

        if (res.data?.name) {
          document.title = buildTitle(res.data.name);
        }
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [token, id, navigate]);

  const tracks =
    playlist?.tracks?.items
      ?.map((item) => item.track)
      .filter(Boolean) ?? [];

  const headingText = playlist?.name ?? 'Playlist';

  return (
    <section
      className="playlist-detail-container page-container"
      aria-labelledby="playlist-detail-title"
    >
      <header className="playlist-detail-header">
        {playlist?.images?.[0]?.url && (
          <img
            src={playlist.images[0].url}
            alt={playlist.name || 'Playlist cover'}
            className="playlist-detail-cover"
          />
        )}
        <div className="playlist-detail-main">
          <h1
            id="playlist-detail-title"
            className="playlist-detail-title page-title"
          >
            {headingText}
          </h1>
          {playlist?.description && (
            <p className="playlist-detail-description">
              {playlist.description}
            </p>
          )}
          {playlist?.owner?.display_name && (
            <p className="playlist-detail-owner">
              By {playlist.owner.display_name}
            </p>
          )}
          {playlist?.external_urls?.spotify && (
            <a
              href={playlist.external_urls.spotify}
              target="_blank"
              rel="noopener noreferrer"
              className="playlist-detail-open-btn"
            >
              Open in Spotify
            </a>
          )}
        </div>
      </header>

      {loading && (
        <output
          className="playlist-detail-loading"
          data-testid="loading-indicator"
        >
          Loading playlist…
        </output>
      )}

      {error && !loading && (
        <div className="playlist-detail-error" role="alert">
          {error}
        </div>
      )}

      {!loading && !error && (
        <>
          {tracks.length === 0 ? (
            <p className="playlist-detail-empty">
              This playlist is empty.
            </p>
          ) : (
            <>
              <h2 className="playlist-detail-tracks-title">
                Tracks ({tracks.length})
              </h2>
              <ol className="playlist-detail-tracks-list">
                {tracks.map((track, index) => (
                  <TrackItem
                    key={track.id}
                    track={track}
                    index={index}
                  />
                ))}
              </ol>
            </>
          )}
        </>
      )}
    </section>
  );
}
