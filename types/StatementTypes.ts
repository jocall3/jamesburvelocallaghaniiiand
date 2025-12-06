
export interface StatementLine {
    BookgDt: string;
    ValDt: string;
    Amt: number;
    CdtDbtInd: 'CRDT' | 'DBIT';
    Sts: { Cd: string };
    BkTxCd: { Prtry: { Domn: string; Fmly: string; SubFmly: string } };
    Purp: { Cd: string };
    RmtInf: { Ustrd: string };
    NtryRef: string;
    AddtlNtryInf: string;
    value?: { Ccy: string; Value: number };
}
      