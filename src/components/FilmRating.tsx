import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ratingService } from '../services/ratingService';
import StarRating from './StarRating';
import { useTranslation } from 'react-i18next';

interface FilmRatingProps {
  filmId: string;
  averageRating: number;
  onRatingChange?: () => void;
}

const FilmRating: React.FC<FilmRatingProps> = ({
  filmId,
  averageRating,
  onRatingChange
}) => {
  const { isAuthenticated } = useAuth();
  const { t } = useTranslation();
  const [userRating, setUserRating] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadUserRating = async () => {
      if (isAuthenticated) {
        try {
          const rating = await ratingService.getUserRating(filmId);
          setUserRating(rating);
        } catch (error) {
          console.error('Error loading user rating:', error);
        }
      }
    };

    loadUserRating();
  }, [filmId, isAuthenticated]);

  const handleRatingChange = async (rating: number) => {
    if (!isAuthenticated) {
      // You might want to show a login prompt here
      return;
    }

    setIsLoading(true);
    try {
      await ratingService.rateFilm(filmId, rating);
      setUserRating(rating);
      if (onRatingChange) {
        onRatingChange();
      }
    } catch (error) {
      console.error('Error rating film:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <StarRating
          rating={averageRating}
          readonly
          size="lg"
        />
      </div>
      <div className="flex flex-col gap-1 mt-1">
        {isAuthenticated && (
          <>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                {t('your_rating')}: {userRating ? `${userRating}/5` : t('rate_this_film')}
              </span>
              <StarRating
                rating={userRating || 0}
                onRatingChange={userRating ? undefined : handleRatingChange}
                readonly={!!userRating}
                size="md"
              />
            </div>
          </>
        )}
        <span className="text-sm text-gray-500">
          {t('average_rating')}: {averageRating.toFixed(1)}
        </span>
      </div>
      {isLoading && (
        <div className="text-sm text-gray-500">
          {t('saving_rating')}...
        </div>
      )}
    </div>
  );
};

export default FilmRating; 