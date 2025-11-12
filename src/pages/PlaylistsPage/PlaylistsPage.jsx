// src/pages/PlaylistsPage.jsx
import { useState, useEffect } from 'react';
import { buildTitle } from '../../constants/appMeta.js';
import { useRequireToken } from '../../hooks/useRequireToken.js';
import PlayListItem from '../../components/PlayListItem/PlayListItem.jsx';
import { fetchUserPlaylists } from '../../api/spotify-me.js';
import { handleTokenError } from '../../utils/handleTokenError.js';
import './PlaylistsPage.css';
import '../PageLayout.css';
import { useNavigate } from 'react-router-dom';

/**
 * Number of playlists to fetch
 */
export const limit = 10;

/**
 * Playlists Page
 * @returns {JSX.Element}
 */
export default function PlaylistsPage() {
  const navigate = useNavigate();

  const [playlists, setPlaylists] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { token } = useRequireToken();

  useEffect(() => { document.title = buildTitle('Playlists'); }, []);

  useEffect(() => {
    if (!token) return;
    fetchUserPlaylists(token, limit)
      .then(res => {
        if (res?.error) {
          if (handleTokenError(res.error, navigate)) return;
          setError(res.error);
        }
        const items = res?.data?.items ?? [];
        const total = res?.data?.total ?? items.length;
        setPlaylists(items);
        setTotalCount(total);
      })
      .catch(err => { setError(err.message); })
      .finally(() => { setLoading(false); });
  }, [token, navigate]);

  return (
    <section className="playlists-container page-container" aria-labelledby="playlists-title">
      <h1 id="playlists-title" className="playlists-title page-title">Your Playlists</h1>
      <h2 className="playlists-count">
        {totalCount} playlist{totalCount !== 1 ? 's' : ''}
      </h2>
      {loading && <output className="playlists-loading" data-testid="loading-indicator">Loading playlists…</output>}
      {error && !loading && <div className="playlists-error" role="alert">{error}</div>}
      {!loading && !error && (
        <ol className="playlists-list">
          {playlists.slice(0, limit).map((playlist, index) => (
            <PlayListItem key={playlist.id} playlist={playlist} index={index} />
          ))}
        </ol>
      )}
    </section>
  );
}
