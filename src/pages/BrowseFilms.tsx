import { useEffect, useState } from 'react';
import { supabase } from '../config/supabase';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/navigation';
import { Navigation } from 'swiper/modules';
import { useNavigate } from 'react-router-dom';

interface Film {
  id: string;
  title: string;
  description: string;
  duration: number;
  genre: string;
  thumbnail_url: string;
  created_at: string;
  average_rating?: number;
}

const GENRES = ['Action', 'Drama', 'Comedy'];

const BrowseFilms = () => {
  const [featured, setFeatured] = useState<Film | null>(null);
  const [recent, setRecent] = useState<Film[]>([]);
  const [topRated, setTopRated] = useState<Film[]>([]);
  const [genreSections, setGenreSections] = useState<Record<string, Film[]>>({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFilms = async () => {
      setLoading(true);
      // Fetch all films
      const { data: films, error } = await supabase
        .from('films')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) return setLoading(false);
      if (!films) return setLoading(false);

      // Featured: pick a random film
      setFeatured(films[Math.floor(Math.random() * films.length)] || null);
      // Recently Added
      setRecent(films.slice(0, 12));
      // Top Rated (simulate by sorting by average_rating if available)
      setTopRated(
        [...films]
          .filter(f => typeof f.average_rating === 'number')
          .sort((a, b) => (b.average_rating || 0) - (a.average_rating || 0))
          .slice(0, 12)
      );
      // Genre sections
      const genreMap: Record<string, Film[]> = {};
      GENRES.forEach(genre => {
        genreMap[genre] = films.filter(f => f.genre === genre).slice(0, 12);
      });
      setGenreSections(genreMap);
      setLoading(false);
    };
    fetchFilms();
  }, []);

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Featured Banner */}
      {featured && (
        <div
          className="relative h-[400px] flex items-end bg-cover bg-center mb-10"
          style={{ backgroundImage: `url(${featured.thumbnail_url})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
          <div className="relative z-10 p-8 max-w-2xl">
            <h1 className="text-4xl font-bold text-white mb-2 drop-shadow-lg">{featured.title}</h1>
            <p className="text-lg text-gray-200 mb-4 line-clamp-3">{featured.description}</p>
            <div className="flex items-center gap-4 mb-4">
              <span className="text-white font-semibold">{featured.duration} min</span>
              <span className="text-indigo-300 bg-indigo-900/60 px-2 py-1 rounded text-xs">{featured.genre}</span>
            </div>
            <button
              className="bg-indigo-600 text-white px-6 py-2 rounded-md font-semibold hover:bg-indigo-700 shadow-lg"
              onClick={() => navigate(`/watch/${featured.id}`)}
            >
              Watch Now
            </button>
          </div>
        </div>
      )}

      {/* Recently Added */}
      <SectionCarousel title="Recently Added" films={recent} navigate={navigate} />
      {/* Top Rated */}
      <SectionCarousel title="Top Rated" films={topRated} navigate={navigate} />
      {/* Genre Sections */}
      {GENRES.map(genre => (
        <SectionCarousel key={genre} title={genre} films={genreSections[genre] || []} navigate={navigate} />
      ))}
    </div>
  );
};

function SectionCarousel({ title, films, navigate }: { title: string; films: Film[]; navigate: any }) {
  if (!films || films.length === 0) return null;
  return (
    <div className="mb-10 px-6">
      <h2 className="text-2xl font-bold mb-4">{title}</h2>
      <Swiper
        modules={[Navigation]}
        navigation
        spaceBetween={16}
        slidesPerView={4}
        breakpoints={{
          320: { slidesPerView: 1.2 },
          640: { slidesPerView: 2.2 },
          1024: { slidesPerView: 4 },
        }}
        className="pb-6"
      >
        {films.map(film => (
          <SwiperSlide key={film.id}>
            <div className="bg-white rounded-lg shadow hover:shadow-lg transition overflow-hidden flex flex-col h-full">
              <img
                src={film.thumbnail_url}
                alt={film.title}
                className="h-48 w-full object-cover"
              />
              <div className="p-4 flex-1 flex flex-col">
                <h3 className="font-semibold text-lg mb-1 line-clamp-1">{film.title}</h3>
                <p className="text-gray-500 text-sm mb-2 line-clamp-2">{film.description}</p>
                <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                  <span>{film.duration} min</span>
                  <span>•</span>
                  <span>{film.genre}</span>
                </div>
                <button
                  className="mt-auto bg-indigo-600 text-white px-4 py-1 rounded hover:bg-indigo-700"
                  onClick={() => navigate(`/watch/${film.id}`)}
                >
                  Watch
                </button>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}

export default BrowseFilms; 