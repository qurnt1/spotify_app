import '../PageLayout.css';
import '../../styles/PlaylistDetailPage.css';

export default function PlaylistPage() {
  return (
    <section
      className="playlist-detail-container page-container"
      aria-labelledby="playlist-detail-title"
      role="region"
    >
      <h1
        id="playlist-detail-title"
        className="playlist-detail-title page-title"
      >
        Playlist Page
      </h1>
    </section>
  );
}
