
import React, { useState } from 'react';
import Select from 'react-select';

interface OptionType {
  value: string;
  label: string;
}

interface StructuredPurposeInputProps {
  onChange: (value: string | null) => void;
  value: string | null;
}

const purposeCodes: OptionType[] = [
  { value: "BONU", label: "BONU - Transaction is the payment of a bonus." },
  { value: "CASH", label: "CASH - Transaction is a general cash management instruction." },
  { value: "CBLK", label: "CBLK - A service that is settling money for a bulk of card transactions." },
  { value: "CCRD", label: "CCRD - Transaction is related to a payment of credit card." },
  { value: "CORT", label: "CORT - Transaction is related to settlement of a trade." },
  { value: "DCRD", label: "DCRD - Transaction is related to a payment of debit card." },
  { value: "DIVI", label: "DIVI - Transaction is the payment of dividends." },
  { value: "DVPM", label: "DVPM - Code used to pre-advise the account servicer." },
  { value: "EPAY", label: "EPAY - Transaction is related to ePayment." },
  { value: "FCIN", label: "FCIN - Transaction is related to the payment of a fee and interest." },
  { value: "FCOL", label: "FCOL - A service that is settling card transaction related fees." },
  { value: "GP2P", label: "GP2P - General Person-to-Person Payment." },
  { value: "GOVT", label: "GOVT - Transaction is a payment to or from a government department." },
  { value: "HEDG", label: "HEDG - Transaction is related to the payment of a hedging operation." },
  { value: "ICCP", label: "ICCP - Transaction is reimbursement of credit card payment." },
  { value: "IDCP", label: "IDCP - Transaction is reimbursement of debit card payment." },
  { value: "INTC", label: "INTC - Transaction is an intra-company payment." },
  { value: "INTE", label: "INTE - Transaction is the payment of interest." },
  { value: "LBOX", label: "LBOX - Transaction is related to identify cash handling." },
  { value: "LOAN", label: "LOAN - Transaction is related to the transfer of a loan." },
  { value: "MP2B", label: "MP2B - Mobile P2B Payment" },
  { value: "MP2P", label: "MP2P - Mobile P2P Payment" },
  { value: "OTHR", label: "OTHR - Other payment purpose." },
  { value: "PENS", label: "PENS - Transaction is the payment of pension." },
  { value: "RPRE", label: "RPRE - Collection used to re-present previously reversed direct debit transactions." },
  { value: "RRCT", label: "RRCT - Transaction is related to a reimbursement for commercial reasons." },
  { value: "RVPM", label: "RVPM - Code used to pre-advise the account servicer of a forthcoming receive against payment instruction." },
  { value: "SALA", label: "SALA - Transaction is the payment of salaries." },
  { value: "SECU", label: "SECU - Transaction is the payment of securities." },
  { value: "SSBE", label: "SSBE - Transaction is a social security benefit." },
  { value: "SUPP", label: "SUPP - Transaction is related to a payment to a supplier." },
  { value: "TAXS", label: "TAXS - Transaction is the payment of taxes." },
  { value: "TRAD", label: "TRAD - Transaction is related to the payment of a trade finance transaction." },
  { value: "TREA", label: "TREA - Transaction is related to treasury operations." },
  { value: "VATX", label: "VATX - Transaction is the payment of value added tax." },
  { value: "WHLD", label: "WHLD - Transaction is the payment of withholding tax." },
  { value: "SWEP", label: "SWEP - Transaction relates to a cash management instruction, requesting a sweep." },
  { value: "TOPG", label: "TOPG - Transaction relates to a cash management instruction, requesting to top the account." },
  { value: "ZABA", label: "ZABA - Transaction relates to a cash management instruction, requesting to zero balance the account." },
    { value: "VOST", label: "VOST - Transaction to be processed as a domestic payment instruction originated from a foreign bank." },
  { value: "FCDT", label: "FCDT - Foreign Currency Transaction that is processed between two domestic financial institutions." },
  { value: "CIPC", label: "CIPC - Transaction is a direct debit for a cash order of notes and/or coins." },
  { value: "CONC", label: "CONC - Transaction is a direct debit for a cash order of notes and/or coins." },
  { value: "CGWV", label: "CGWV - Transaction is a payment towards a Party for the collection of cash by the Cash in Transit company." },
  { value: "SAVG", label: "SAVG - Transfer to / from savings or to retirement account." },
  { value: "CTDF", label: "CTDF - Cross border transaction initiated by US natural person that is subject to compliance with Dodd Frank 1073." },
];

const StructuredPurposeInput: React.FC<StructuredPurposeInputProps> = ({ onChange, value }) => {
  const [selectedOption, setSelectedOption] = useState<OptionType | null>(
    value ? purposeCodes.find((option) => option.value === value) || null : null
  );

  const handleChange = (option: OptionType | null) => {
    setSelectedOption(option);
    onChange(option ? option.value : null);
  };

  return (
    <div>
      <Select
        value={selectedOption}
        onChange={handleChange}
        options={purposeCodes}
        isClearable
        placeholder="Select Purpose Code"
      />
    </div>
  );
};

export default StructuredPurposeInput;
