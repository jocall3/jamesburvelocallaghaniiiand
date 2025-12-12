import React from 'react';
import styled from 'styled-components';

interface CreditRatingBadgeProps {
  rating: string | null | undefined;
}

const RatingBadge = styled.span<{ ratingColor: string }>`
  display: inline-block;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  color: white;
  background-color: ${(props) => props.ratingColor};
`;

const CreditRatingBadge: React.FC<CreditRatingBadgeProps> = ({ rating }) => {

  const getRatingColor = (rating: string | null | undefined): string => {
    if (!rating) {
      return '#808080'; // Grey for no rating
    }

    const ratingUpper = rating.toUpperCase();

    if (ratingUpper.startsWith('AAA')) {
      return '#28a745'; // Green
    } else if (ratingUpper.startsWith('AA')) {
      return '#17a2b8'; // Teal
    } else if (ratingUpper.startsWith('A')) {
      return '#007bff'; // Blue
    } else if (ratingUpper.startsWith('BBB')) {
      return '#ffc107'; // Yellow/Amber
    } else if (ratingUpper.startsWith('BB')) {
      return '#fd7e14'; // Orange
    } else if (ratingUpper.startsWith('B')) {
      return '#dc3545'; // Red
    } else {
      return '#6c757d'; // Light Grey for default/unknown
    }
  };

  const ratingColor = getRatingColor(rating);

  return <RatingBadge ratingColor={ratingColor}>{rating || 'N/A'}</RatingBadge>;
};

export default CreditRatingBadge;