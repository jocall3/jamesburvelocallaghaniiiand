
import React from 'react';
import { Box, Typography, Card, CardContent, Divider } from '@mui/material';
import { ExternalCorporateActionEventType1Code } from './iso20022';

interface EventNotificationCardProps {
  event: {
    corporateActionEventType?: ExternalCorporateActionEventType1Code;
    // Add other relevant properties from the data source here,
    // for example:
    //  eventDescription?: string;
    //  recordDate?: string;
    //  paymentDate?: string;
  };
}

const EventNotificationCard: React.FC<EventNotificationCardProps> = ({ event }) => {
  const { corporateActionEventType } = event;

  // Function to get the description based on the code (assuming it's a string)
  const getEventDescription = (code?: ExternalCorporateActionEventType1Code): string => {
    if (!code) {
      return "Unknown Event";
    }

    switch (code) {
      case 'ACTV':
        return "Trading in the security has commenced or security has been re-activated.";
      case 'ATTI':
        return "Combination of different security types to create a unit.";
      case 'BRUP':
        return "Bankruptcy.";
      case 'DFLT':
        return "Failure by the company to perform obligations.";
      case 'BONU':
        return "Bonus or capitalisation issue.";
      case 'EXRI':
        return "Call or exercise on nil paid securities.";
      case 'CAPD':
        return "Cash distribution from the capital account.";
      case 'CAPG':
        return "Capital gains distributions.";
      case 'CAPI':
        return "Increase of the current principal of a debt instrument.";
      case 'DRCA':
        return "Distribution to shareholders of cash.";
      case 'DVCA':
        return "Cash dividend.";
      case 'CHAN':
        return "Information regarding a change.";
      case 'COOP':
        return "Company option.";
      case 'CLSA':
        return "Class action.";
      case 'CONS':
        return "Consent";
      case 'CONV':
        return "Conversion of securities.";
      case 'CREV':
        return "Occurrence of credit derivative.";
      case 'DECR':
        return "Reduction of face value.";
      case 'DETI':
        return "Separation of components.";
      case 'DSCL':
        return "Disclosure requirement for holders.";
      case 'DVOP':
        return "Dividend with choice of benefit.";
      case 'DRIP':
        return "Dividend reinvestment plan.";
      case 'DRAW':
        return "Securities are redeemed in part before the scheduled final maturity date.";
      case 'DTCH':
        return "Action by a party wishing to acquire a security.";
      case 'EXOF':
        return "Exchange offer.";
      case 'REDM':
        return "Redemption.";
      case 'MCAL':
        return "Redemption before final maturity.";
      case 'INCR':
        return "Increase in face value.";
      case 'PPMT':
        return "Instalment payment.";
      case 'INTR':
        return "Interest payment.";
      case 'RHDI':
        return "Distribution of intermediate securities.";
      case 'LIQU':
        return "Distribution of cash, assets or both.";
      case 'EXTM':
        return "Extension of maturity.";
      case 'MRGR':
        return "Merger.";
      case 'NOOF':
        return "Offers that are not supervised.";
      case 'CERT':
        return "Certification requirement.";
      case 'ODLT':
        return "Odd-lot sale or purchase.";
      case 'OTHR':
        return "Other event.";
      case 'PARI':
        return "Pari passu or assimilation.";
      case 'PCAL':
        return "Partial call.";
      case 'PRED':
        return "Securities are redeemed in part.";
      case 'PINK':
        return "Interest payment in any kind except cash.";
      case 'PLAC':
        return "Change in state of incorporation.";
      case 'PDEF':
        return "Defeasance.";
      case 'PRIO':
        return "Priority offer.";
      case 'BPUT':
        return "Early redemption at the election of the holder.";
      case 'REDO':
        return "Restate of unit.";
      case 'REMK':
        return "Remarketed preferred equities/bonds";
      case 'BIDS':
        return "Repurchase offer.";
      case 'SPLR':
        return "Stock split.";
      case 'RHTS':
        return "Rights offering.";
      case 'DVSC':
        return "Dividend paid in scrip.";
      case 'SHPR':
        return "Shares premium reserve.";
      case 'SMAL':
        return "Smallest negotiable unit.";
      case 'SOFF':
        return "Distribution of securities by another company.";
      case 'DVSE':
        return "Dividend paid in equities.";
      case 'SPLF':
        return "Stock split with reduced value.";
      case 'TREC':
        return "Tax reclaim activities.";
      case 'TEND':
        return "Tender offer.";
      case 'DLST':
        return "Delisting of security.";
      case 'SUSP':
        return "Trading suspension.";
      case 'EXWA':
        return "Option exercise.";
      case 'WTRC':
        return "Withholding tax reduction.";
      case 'WRTH':
        return "Booking out of valueless securities.";
      case 'ACCU':
        return "Funds related event in which the income is retained within the fund.";
      case 'INFO':
        return "Information provided by the issuer having no accounting/financial impact on the holder.";
      case 'TNDP':
        return "Taxable component on non-distributed proceeds.";

      default:
        return "Unknown Event";
    }
  };

  return (
    <Card sx={{ mb: 2, border: '1px solid #e0e0e0' }}>
      <CardContent>
        <Typography variant="h6" component="div" sx={{ mb: 1 }}>
          {getEventDescription(corporateActionEventType)}
        </Typography>
        <Divider sx={{ my: 1 }} />
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          {corporateActionEventType && (
            <Typography variant="body2">
              Event Code: {corporateActionEventType}
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default EventNotificationCard;
