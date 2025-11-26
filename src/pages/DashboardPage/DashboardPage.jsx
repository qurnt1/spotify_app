// src/pages/DashboardPage/DashboardPage.jsx

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchUserTopArtists, fetchUserTopTracks } from '../../api/spotify-me.js';
import SimpleCard from '../../components/SimpleCard/SimpleCard.jsx';
import { KEY_ACCESS_TOKEN } from '../../constants/storageKeys.js';
import { buildTitle } from '../../constants/appMeta.js';
import '../../styles/DashboardPage.css';

const DashboardPage = () => {
  const [topArtist, setTopArtist] = useState(null);
  const [topTrack, setTopTrack] = useState(null);

  const [artistError, setArtistError] = useState(null);
  const [trackError, setTrackError] = useState(null);

  const [loadingArtists, setLoadingArtists] = useState(true);
  const [loadingTracks, setLoadingTracks] = useState(true);

  const navigate = useNavigate();

  // Met à jour le titre de la page
  useEffect(() => {
    document.title = buildTitle('Dashboard');
  }, []);

  useEffect(() => {
    const token = window.localStorage.getItem(KEY_ACCESS_TOKEN);

    // Si pas de token, on redirige vers /login
    if (!token) {
      navigate('/login');
      return;
    }

    let isCancelled = false;

    const loadTopArtist = async () => {
      setLoadingArtists(true);
      try {
        const { data, error } = await fetchUserTopArtists(token, 1);

        if (isCancelled) return;

        if (error) {
          if (error === 'The access token expired') {
            navigate('/login');
            return;
          }
          setArtistError(error);
          return;
        }

        if (data?.items?.length) {
          setTopArtist(data.items[0]);
          // Pour debug manuel éventuel
          // eslint-disable-next-line no-console
          console.log('Top artist:', data.items[0]);
        }
      } catch (err) {
        if (isCancelled) return;
        setArtistError(err.message || 'Unknown error');
      } finally {
        if (!isCancelled) {
          setLoadingArtists(false);
        }
      }
    };

    const loadTopTrack = async () => {
      setLoadingTracks(true);
      try {
        const { data, error } = await fetchUserTopTracks(token, 1);

        if (isCancelled) return;

        if (error) {
          if (error === 'The access token expired') {
            navigate('/login');
            return;
          }
          setTrackError(error);
          return;
        }

        if (data?.items?.length) {
          setTopTrack(data.items[0]);
          // eslint-disable-next-line no-console
          console.log('Top track:', data.items[0]);
        }
      } catch (err) {
        if (isCancelled) return;
        setTrackError(err.message || 'Unknown error');
      } finally {
        if (!isCancelled) {
          setLoadingTracks(false);
        }
      }
    };

    loadTopArtist();
    loadTopTrack();

    return () => {
      isCancelled = true;
    };
  }, [navigate]);

  const renderArtistSection = () => {
    if (loadingArtists) {
      return (
        <p
          data-testid="loading-artists-indicator"
          className="dashboard-loading"
        >
          Loading artists...
        </p>
      );
    }

    if (artistError) {
      return (
        <p
          data-testid="error-artists-indicator"
          className="dashboard-error"
        >
          {artistError}
        </p>
      );
    }

    if (!topArtist) {
      return <p>No top artist found.</p>;
    }

    const genresText = topArtist.genres?.length
      ? topArtist.genres.join(', ')
      : '';

    return (
      <div className="card">
        <h2>Top artist</h2>
        <SimpleCard
          imageUrl={topArtist.images?.[0]?.url}
          title={topArtist.name}
          subtitle={genresText}
          link={topArtist.external_urls?.spotify}
        />
      </div>
    );
  };

  const renderTrackSection = () => {
    if (loadingTracks) {
      return (
        <p
          data-testid="loading-tracks-indicator"
          className="dashboard-loading"
        >
          Loading tracks...
        </p>
      );
    }

    if (trackError) {
      return (
        <p
          data-testid="error-tracks-indicator"
          className="dashboard-error"
        >
          {trackError}
        </p>
      );
    }

    if (!topTrack) {
      return <p>No top track found.</p>;
    }

    const artistNames = topTrack.artists?.map((artist) => artist.name).join(', ');
    const albumName = topTrack.album?.name;
    const subtitleParts = [artistNames, albumName].filter(Boolean);
    const subtitle = subtitleParts.join(' • ');

    return (
      <div className="card">
        <h2>Top track</h2>
        <SimpleCard
          imageUrl={topTrack.album?.images?.[0]?.url}
          title={topTrack.name}
          subtitle={subtitle}
          link={topTrack.external_urls?.spotify}
        />
      </div>
    );
  };

  return (
    <main className="page-container dashboard-container">
      <header>
        <h1>Dashboard</h1>
        <p className="dashboard-subtitle">Your top artist and track</p>
      </header>

      <section className="dashboard-content">
        {renderArtistSection()}
        {renderTrackSection()}
      </section>
    </main>
  );
};

export default DashboardPage;
