import React, { useState, useEffect } from 'react';
import { FaStar } from 'react-icons/fa';

interface StarRatingProps {
  rating: number;
  onRatingChange?: (rating: number) => void;
  readonly?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const StarRating: React.FC<StarRatingProps> = ({
  rating,
  onRatingChange,
  readonly = false,
  size = 'md'
}) => {
  const [hoverRating, setHoverRating] = useState(0);
  const [currentRating, setCurrentRating] = useState(rating);

  useEffect(() => {
    setCurrentRating(rating);
  }, [rating]);

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const handleMouseEnter = (index: number) => {
    if (!readonly) {
      setHoverRating(index);
    }
  };

  const handleMouseLeave = () => {
    if (!readonly) {
      setHoverRating(0);
    }
  };

  const handleClick = (index: number) => {
    if (!readonly && onRatingChange) {
      setCurrentRating(index);
      onRatingChange(index);
    }
  };

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((index) => (
        <FaStar
          key={index}
          className={`${sizeClasses[size]} cursor-pointer transition-colors duration-200 ${
            readonly ? 'cursor-default' : 'cursor-pointer'
          }`}
          color={
            index <= (hoverRating || currentRating)
              ? '#9333EA' // Purple color matching the site theme
              : '#E5E7EB' // Light gray for unselected stars
          }
          onMouseEnter={() => handleMouseEnter(index)}
          onMouseLeave={handleMouseLeave}
          onClick={() => handleClick(index)}
        />
      ))}
      {!readonly && (
        <span className="text-sm text-gray-500 ml-2">
          {hoverRating || currentRating}/5
        </span>
      )}
    </div>
  );
};

export default StarRating; 