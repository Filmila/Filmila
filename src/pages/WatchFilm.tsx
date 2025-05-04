import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '../config/supabase';
import { Film } from '../types';

const WatchFilm = () => {
  const { id } = useParams();
  const [film, setFilm] = useState<Film | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFilm = async () => {
      const { data, error } = await supabase.from('films').select('*').eq('id', id).single();
      if (!error) setFilm(data);
      setLoading(false);
    };
    fetchFilm();
  }, [id]);

  if (loading) return <div className="text-center py-12">Loading...</div>;
  if (!film) return <div className="text-center py-12 text-red-600">Film not found.</div>;

  return (
    <div className="max-w-3xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">{film.title}</h1>
      <video src={film.video_url} controls className="w-full rounded" />
      <p className="mt-4">{film.description}</p>
    </div>
  );
};

export default WatchFilm; 