import React from 'react';
import { Badge } from 'antd';

interface RiskMetricsBadgeProps {
  duration?: number;
  creditRating?: string; // Assuming credit rating is a string (e.g., AAA, BBB, etc.)
}

const RiskMetricsBadge: React.FC<RiskMetricsBadgeProps> = ({ duration, creditRating }) => {
  let riskLevel: 'low' | 'medium' | 'high' | 'veryHigh' | 'unknown' = 'unknown';
  let badgeStatus: 'success' | 'processing' | 'warning' | 'error' | 'default' = 'default';

  // Risk assessment based on duration and credit rating (simplified example)
  if (duration === undefined || creditRating === undefined) {
    riskLevel = 'unknown';
    badgeStatus = 'default';
  }
   else {
    const numericRating = convertCreditRatingToNumeric(creditRating);

    if (duration < 3 && numericRating >= 1) { // AAA, AA, A, BBB
      riskLevel = 'low';
      badgeStatus = 'success';
    } else if (duration < 5 && numericRating >= 1) {
      riskLevel = 'medium';
      badgeStatus = 'success';
    }
     else if (duration < 7 && numericRating >= 1){
      riskLevel = 'medium';
      badgeStatus = 'success';
    }
     else if (duration < 3 && numericRating < 1){ //BB, B
        riskLevel = 'medium';
        badgeStatus = 'warning';
    }
    else if (duration < 5 && numericRating < 1) {
      riskLevel = 'high';
      badgeStatus = 'warning';
    } else if (duration < 7 && numericRating < 1) {
      riskLevel = 'veryHigh';
      badgeStatus = 'error';
    }
    else if (duration >= 7 && numericRating >= 1){
        riskLevel = 'high';
        badgeStatus = 'warning';
    }
    else {
      riskLevel = 'veryHigh';
      badgeStatus = 'error';
    }
  }

  const badgeColorMap: { [key: string]: string } = {
    low: 'green',
    medium: 'gold',
    high: 'orange',
    veryHigh: 'red',
    unknown: 'gray',
  };

  const badgeTextMap: { [key: string]: string } = {
    low: 'Low Risk',
    medium: 'Medium Risk',
    high: 'High Risk',
    veryHigh: 'Very High Risk',
    unknown: 'Unknown Risk',
  };
    
  function convertCreditRatingToNumeric(rating: string): number {
    const ratingMap: { [key: string]: number } = {
      'AAA': 1,
      'AA': 1,
      'A': 1,
      'BBB': 1,
      'BB': 0,
      'B': 0,
      'CCC': 0,
      'CC': 0,
      'C': 0,
      'D': 0,
    };
    const ratingUpper = rating.toUpperCase().replace(/[^A-Z]/g, '');
    return ratingMap[ratingUpper] ?? -1;
  }
  return (
    <Badge
      status={badgeStatus}
      text={badgeTextMap[riskLevel]}
    />
  );
};

export default RiskMetricsBadge;