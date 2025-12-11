```typescript
import React, { useState, useMemo } from 'react';
import {
  Container,
  Typography,
  Paper,
  Grid,
  TextField,
  Slider,
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
  OutlinedInput,
  InputLabel,
  FormControl,
  Button,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TableSortLabel,
  Link,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { format } from 'date-fns';

// --- MOCK DATA ---
// A more comprehensive mock data set to represent a real-world scenario.

interface Bond {
  id: string;
  isin: string;
  issuer: string;
  country: string;
  sector: 'Sovereign' | 'Corporate' | 'Municipal';
  maturityDate: Date;
  coupon: number;
  yieldToMaturity: number;
  price: number;
  currency: 'USD' | 'EUR' | 'GBP';
  rating: {
    sp: 'AAA' | 'AA+' | 'AA' | 'A+' | 'A' | 'BBB+' | 'BBB' | 'BB' | 'B' | 'CCC';
    moodys: string;
    fitch: string;
  };
}

const mockBonds: Bond[] = [
  // USA Sovereigns
  { id: '1', isin: 'US912828U414', issuer: 'USA', country: 'USA', sector: 'Sovereign', maturityDate: new Date('2033-05-15'), coupon: 3.375, yieldToMaturity: 3.85, price: 96.5, currency: 'USD', rating: { sp: 'AA+', moodys: 'Aaa', fitch: 'AA+' } },
  { id: '2', isin: 'US912810SF54', issuer: 'USA', country: 'USA', sector: 'Sovereign', maturityDate: new Date('2053-05-15'), coupon: 3.625, yieldToMaturity: 4.12, price: 92.3, currency: 'USD', rating: { sp: 'AA+', moodys: 'Aaa', fitch: 'AA+' } },
  { id: '3', isin: 'US912796P781', issuer: 'USA', country: 'USA', sector: 'Sovereign', maturityDate: new Date('2024-12-21'), coupon: 0, yieldToMaturity: 5.10, price: 98.2, currency: 'USD', rating: { sp: 'AA+', moodys: 'Aaa', fitch: 'AA+' } },
  // Corporate Bonds
  { id: '4', isin: 'US037833BY81', issuer: 'Apple Inc.', country: 'USA', sector: 'Corporate', maturityDate: new Date('2046-05-06'), coupon: 3.850, yieldToMaturity: 4.55, price: 91.8, currency: 'USD', rating: { sp: 'AA+', moodys: 'Aaa', fitch: 'AA+' } },
  { id: '5', isin: 'US594918BT09', issuer: 'Microsoft Corp.', country: 'USA', sector: 'Corporate', maturityDate: new Date('2027-02-12'), coupon: 2.400, yieldToMaturity: 4.20, price: 98.9, currency: 'USD', rating: { sp: 'AAA', moodys: 'Aaa', fitch: 'AAA' } },
  { id: '6', isin: 'US023135AV51', issuer: 'Amazon.com, Inc.', country: 'USA', sector: 'Corporate', maturityDate: new Date('2030-08-22'), coupon: 2.500, yieldToMaturity: 4.78, price: 94.5, currency: 'USD', rating: { sp: 'AA', moodys: 'A1', fitch: 'AA-' } },
  // International Bonds
  { id: '7', isin: 'DE0001102424', issuer: 'Germany', country: 'Germany', sector: 'Sovereign', maturityDate: new Date('2027-08-15'), coupon: 0.00, yieldToMaturity: 2.85, price: 96.1, currency: 'EUR', rating: { sp: 'AAA', moodys: 'Aaa', fitch: 'AAA' } },
  { id: '8', isin: 'GB00BDRHNP05', issuer: 'United Kingdom', country: 'UK', sector: 'Sovereign', maturityDate: new Date('2049-07-22'), coupon: 1.625, yieldToMaturity: 4.30, price: 75.4, currency: 'GBP', rating: { sp: 'AA', moodys: 'Aa3', fitch: 'AA-' } },
  { id: '9', isin: 'FR0013333333', issuer: 'France', country: 'France', sector: 'Sovereign', maturityDate: new Date('2035-11-25'), coupon: 1.75, yieldToMaturity: 3.15, price: 90.2, currency: 'EUR', rating: { sp: 'AA', moodys: 'Aa2', fitch: 'AA-' } },
  { id: '10', isin: 'US17275RBD33', issuer: 'Citigroup Inc.', country: 'USA', sector: 'Corporate', maturityDate: new Date('2029-05-24'), coupon: 4.450, yieldToMaturity: 5.80, price: 92.6, currency: 'USD', rating: { sp: 'A', moodys: 'A3', fitch: 'A' } },
  { id: '11', isin: 'US92343VBG84', issuer: 'Verizon Communications', country: 'USA', sector: 'Corporate', maturityDate: new Date('2051-03-22'), coupon: 3.875, yieldToMaturity: 6.20, price: 79.1, currency: 'USD', rating: { sp: 'BBB+', moodys: 'Baa1', fitch: 'A-' } },
];


// --- Types ---

type Order = 'asc' | 'desc';

interface HeadCell {
  id: keyof Bond;
  label: string;
  numeric: boolean;
}

const headCells: readonly HeadCell[] = [
  { id: 'issuer', numeric: false, label: 'Issuer' },
  { id: 'isin', numeric: false, label: 'ISIN' },
  { id: 'sector', numeric: false, label: 'Sector' },
  { id: 'maturityDate', numeric: false, label: 'Maturity' },
  { id: 'coupon', numeric: true, label: 'Coupon (%)' },
  { id: 'yieldToMaturity', numeric: true, label: 'Yield (%)' },
  { id: 'price', numeric: true, label: 'Price' },
  { id: 'rating', numeric: false, label: 'S&P Rating' },
];

const RATING_LEVELS = ['AAA', 'AA+', 'AA', 'A+', 'A', 'BBB+', 'BBB', 'BB', 'B', 'CCC'];
const SECTORS = ['Sovereign', 'Corporate', 'Municipal'];
const COUNTRIES = ['USA', 'Germany', 'UK', 'France'];

// --- Utility for Sorting ---

function descendingComparator<T>(a: T, b: T, orderBy: keyof T) {
  if (b[orderBy] < a[orderBy]) {
    return -1;
  }
  if (b[orderBy] > a[orderBy]) {
    return 1;
  }
  return 0;
}

function getComparator<Key extends keyof any>(
  order: Order,
  orderBy: Key,
): (
  a: { [key in Key]: number | string | Date | object },
  b: { [key in Key]: number | string | Date | object },
) => number {
  return order === 'desc'
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}


// --- Main Component ---

export default function BondScreenerView() {
  const [filters, setFilters] = useState({
    issuer: '',
    yieldRange: [0, 10],
    maturityDate: [null, null] as [Date | null, Date | null],
    ratings: [] as string[],
    sectors: [] as string[],
    countries: [] as string[],
  });

  const [order, setOrder] = useState<Order>('asc');
  const [orderBy, setOrderBy] = useState<keyof Bond>('issuer');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const handleFilterChange = (name: string, value: any) => {
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const resetFilters = () => {
    setFilters({
      issuer: '',
      yieldRange: [0, 10],
      maturityDate: [null, null],
      ratings: [],
      sectors: [],
      countries: [],
    });
  };

  const filteredBonds = useMemo(() => {
    return mockBonds.filter(bond => {
      // Issuer filter
      if (filters.issuer && !bond.issuer.toLowerCase().includes(filters.issuer.toLowerCase())) {
        return false;
      }
      // Yield filter
      if (bond.yieldToMaturity < filters.yieldRange[0] || bond.yieldToMaturity > filters.yieldRange[1]) {
        return false;
      }
      // Maturity Date filter
      if (filters.maturityDate[0] && bond.maturityDate < filters.maturityDate[0]) {
        return false;
      }
      if (filters.maturityDate[1] && bond.maturityDate > filters.maturityDate[1]) {
        return false;
      }
      // Rating filter
      if (filters.ratings.length > 0 && !filters.ratings.includes(bond.rating.sp)) {
        return false;
      }
       // Sector filter
      if (filters.sectors.length > 0 && !filters.sectors.includes(bond.sector)) {
        return false;
      }
       // Country filter
      if (filters.countries.length > 0 && !filters.countries.includes(bond.country)) {
        return false;
      }
      return true;
    });
  }, [filters]);

  const sortedBonds = useMemo(() => {
    const comparator = getComparator(order, orderBy);
    // Special handling for rating object
    if (orderBy === 'rating') {
        return [...filteredBonds].sort((a,b) => {
            const ratingA = RATING_LEVELS.indexOf(a.rating.sp);
            const ratingB = RATING_LEVELS.indexOf(b.rating.sp);
            return order === 'asc' ? ratingA - ratingB : ratingB - ratingA;
        });
    }
    return [...filteredBonds].sort(comparator);
  }, [filteredBonds, order, orderBy]);

  const handleRequestSort = (property: keyof Bond) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const visibleRows = sortedBonds.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage,
  );

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Bond Screener
        </Typography>

        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">Filter Criteria</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Paper sx={{ p: 3, mb: 3 }}>
              <Grid container spacing={3} alignItems="center">
                {/* Issuer Search */}
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    label="Issuer Name"
                    variant="outlined"
                    value={filters.issuer}
                    onChange={(e) => handleFilterChange('issuer', e.target.value)}
                  />
                </Grid>

                {/* Country Filter */}
                <Grid item xs={12} sm={6} md={3}>
                   <FormControl fullWidth>
                    <InputLabel>Country</InputLabel>
                    <Select
                      multiple
                      value={filters.countries}
                      onChange={(e) => handleFilterChange('countries', e.target.value)}
                      input={<OutlinedInput label="Country" />}
                      renderValue={(selected) => (selected as string[]).join(', ')}
                    >
                      {COUNTRIES.map((country) => (
                        <MenuItem key={country} value={country}>
                          <Checkbox checked={filters.countries.indexOf(country) > -1} />
                          <ListItemText primary={country} />
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                {/* Sector Filter */}
                <Grid item xs={12} sm={6} md={3}>
                   <FormControl fullWidth>
                    <InputLabel>Sector</InputLabel>
                    <Select
                      multiple
                      value={filters.sectors}
                      onChange={(e) => handleFilterChange('sectors', e.target.value)}
                      input={<OutlinedInput label="Sector" />}
                      renderValue={(selected) => (selected as string[]).join(', ')}
                    >
                      {SECTORS.map((sector) => (
                        <MenuItem key={sector} value={sector}>
                          <Checkbox checked={filters.sectors.indexOf(sector) > -1} />
                          <ListItemText primary={sector} />
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                {/* S&P Rating Filter */}
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>S&P Rating</InputLabel>
                    <Select
                      multiple
                      value={filters.ratings}
                      onChange={(e) => handleFilterChange('ratings', e.target.value)}
                      input={<OutlinedInput label="S&P Rating" />}
                      renderValue={(selected) => (selected as string[]).join(', ')}
                    >
                      {RATING_LEVELS.map((rating) => (
                        <MenuItem key={rating} value={rating}>
                          <Checkbox checked={filters.ratings.indexOf(rating) > -1} />
                          <ListItemText primary={rating} />
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                {/* Yield to Maturity Range */}
                <Grid item xs={12} md={6}>
                  <Typography gutterBottom>
                    Yield to Maturity (%): {filters.yieldRange[0]} - {filters.yieldRange[1]}
                  </Typography>
                  <Slider
                    value={filters.yieldRange}
                    onChange={(e, newValue) => handleFilterChange('yieldRange', newValue)}
                    valueLabelDisplay="auto"
                    min={0}
                    max={10}
                    step={0.1}
                  />
                </Grid>

                {/* Maturity Date Range */}
                <Grid item xs={12} sm={6} md={3}>
                  <DatePicker
                    label="Maturity From"
                    value={filters.maturityDate[0]}
                    onChange={(date) => handleFilterChange('maturityDate', [date, filters.maturityDate[1]])}
                    renderInput={(params) => <TextField {...params} fullWidth />}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <DatePicker
                    label="Maturity To"
                    value={filters.maturityDate[1]}
                    onChange={(date) => handleFilterChange('maturityDate', [filters.maturityDate[0], date])}
                    renderInput={(params) => <TextField {...params} fullWidth />}
                  />
                </Grid>
                
                <Grid item xs={12} container justifyContent="flex-end" spacing={2}>
                    <Grid item>
                        <Button variant="outlined" onClick={resetFilters}>
                        Reset Filters
                        </Button>
                    </Grid>
                </Grid>

              </Grid>
            </Paper>
          </AccordionDetails>
        </Accordion>

        <Paper sx={{ width: '100%', mb: 2 }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  {headCells.map((headCell) => (
                    <TableCell
                      key={headCell.id}
                      align={headCell.numeric ? 'right' : 'left'}
                      sortDirection={orderBy === headCell.id ? order : false}
                    >
                      <TableSortLabel
                        active={orderBy === headCell.id}
                        direction={orderBy === headCell.id ? order : 'asc'}
                        onClick={() => handleRequestSort(headCell.id)}
                      >
                        {headCell.label}
                      </TableSortLabel>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {visibleRows.map((bond) => (
                  <TableRow hover key={bond.id}>
                    <TableCell>
                      <Link href="#" underline="hover">{bond.issuer}</Link>
                    </TableCell>
                    <TableCell>{bond.isin}</TableCell>
                    <TableCell>{bond.sector}</TableCell>
                    <TableCell>{format(bond.maturityDate, 'yyyy-MM-dd')}</TableCell>
                    <TableCell align="right">{bond.coupon.toFixed(3)}</TableCell>
                    <TableCell align="right">{bond.yieldToMaturity.toFixed(2)}</TableCell>
                    <TableCell align="right">{bond.price.toFixed(2)}</TableCell>
                    <TableCell>{bond.rating.sp}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredBonds.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Paper>
      </Container>
    </LocalizationProvider>
  );
}
```