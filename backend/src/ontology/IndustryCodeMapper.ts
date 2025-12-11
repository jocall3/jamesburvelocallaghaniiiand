import { Injectable } from '@nestjs/common';

@Injectable()
export class IndustryCodeMapper {
  private readonly naicsToEntityTypeMap: { [key: string]: string } = {
    '11': 'Agriculture, Forestry, Fishing and Hunting',
    '21': 'Mining, Quarrying, and Oil and Gas Extraction',
    '22': 'Utilities',
    '23': 'Construction',
    '31-33': 'Manufacturing',
    '44-45': 'Retail Trade',
    '48-49': 'Transportation and Warehousing',
    '51': 'Information',
    '52': 'Finance and Insurance',
    '53': 'Real Estate and Rental and Leasing',
    '54': 'Professional, Scientific, and Technical Services',
    '55': 'Management of Companies and Enterprises',
    '56': 'Administrative and Support and Waste Management and Remediation Services',
    '61': 'Educational Services',
    '62': 'Health Care and Social Assistance',
    '71': 'Arts, Entertainment, and Recreation',
    '72': 'Accommodation and Food Services',
    '81': 'Other Services (except Public Administration)',
    '92': 'Public Administration',
  };

  private readonly sicToEntityTypeMap: { [key: string]: string } = {
    '01': 'Agricultural Production - Crops',
    '07': 'Agricultural Services',
    '08': 'Forestry',
    '09': 'Fishing, Hunting and Trapping',
    '10': 'Metal Mining',
    '12': 'Coal Mining',
    '13': 'Oil and Gas Extraction',
    '14': 'Nonmetallic Minerals Services',
    '15': 'Building Construction - General Contractors and Operative Builders',
    '16': 'Heavy Construction - Other than Buildings',
    '17': 'Construction - Special Trade Contractors',
    '20': 'Food and Kindred Products',
    '21': 'Tobacco Products',
    '22': 'Textile Mill Products',
    '23': 'Apparel and Other Finished Products Made from Fabrics and Similar Materials',
    '24': 'Lumber and Wood Products',
    '25': 'Furniture and Fixtures',
    '26': 'Paper and Allied Products',
    '27': 'Printing, Publishing, and Allied Industries',
    '28': 'Chemicals and Allied Products',
    '29': 'Petroleum Refining and Related Industries',
    '30': 'Rubber and Miscellaneous Plastics Products',
    '31': 'Leather Tanning and Products',
    '32': 'Stone, Clay, and Glass Products',
    '33': 'Primary Metal Industries',
    '34': 'Fabricated Metal Products, Except Machinery and Transportation Equipment',
    '35': 'Industrial and Commercial Machinery and Computer Equipment',
    '36': 'Electronic and Other Electrical Equipment and Components, Except Computer Equipment',
    '37': 'Transportation Equipment',
    '38': 'Measuring, Analyzing, and Controlling Instruments; Photographic, Medical and Optical Goods; Watches and Clocks',
    '39': 'Miscellaneous Manufacturing Industries',
    '40': 'Railroad Transportation',
    '41': 'Local and Interurban Passenger Transit',
    '42': 'Trucking and Warehousing',
    '43': 'Postal Service',
    '44': 'Water Transportation',
    '45': 'Transportation by Air',
    '46': 'Pipelines, Except Natural Gas',
    '47': 'Transportation Services',
    '48': 'Communications',
    '49': 'Electric, Gas, and Sanitary Services',
    '50': 'Wholesale Trade - Durable Goods',
    '51': 'Wholesale Trade - Nondurable Goods',
    '52': 'Building Materials, Hardware, Garden Supply, and Mobile Home Dealers',
    '53': 'General Merchandise Stores',
    '54': 'Food Stores',
    '55': 'Automotive Dealers and Gasoline Service Stations',
    '56': 'Apparel and Accessory Stores',
    '57': 'Home Furniture, Furnishings, and Equipment Stores',
    '58': 'Eating and Drinking Places',
    '59': 'Miscellaneous Retail',
    '60': 'Depository Institutions',
    '61': 'Nondepository Credit Institutions',
    '62': 'Security and Commodity Brokers, Dealers, Exchanges, and Services',
    '63': 'Insurance Carriers',
    '64': 'Insurance Agents, Brokers, and Service',
    '65': 'Real Estate',
    '67': 'Holding and Other Investment Offices',
    '70': 'Hotels and Other Lodging Places',
    '72': 'Personal Services',
    '73': 'Business Services',
    '75': 'Automotive Repair, Services, and Parking',
    '76': 'Miscellaneous Repair Services',
    '78': 'Motion Picture Production and Distribution',
    '79': 'Amusement and Recreational Services',
    '80': 'Health Services',
    '81': 'Legal Services',
    '82': 'Educational Services',
    '83': 'Social Services',
    '84': 'Museums, Art Galleries, and Botanical and Zoological Gardens',
    '86': 'Membership Organizations',
    '87': 'Engineering, Accounting, Research, Management, and Related Services',
    '88': 'Private Households',
    '89': 'Services, Not Elsewhere Classified',
    '91': 'Executive, Legislative, and General Government, except Public Finance',
    '92': 'Public Administration and National Defense',
    '93': 'Public Finance, Taxation, and Monetary Policy',
    '94': 'Administration of Human Resource Programs',
    '95': 'Administration of Environmental Programs',
    '96': 'Administration of Housing, Urban Development, and Community Development Programs',
    '97': 'National Security and International Affairs',
    '99': 'Nonclassifiable Establishments',
  };

  /**
   * Maps a given industry code (NAICS or SIC) to a general entity type.
   *
   * @param code The industry code (e.g., '31-33' for NAICS, '20' for SIC).
   * @returns The corresponding entity type as a string, or null if the code is not recognized.
   */
  mapIndustryCodeToEntityType(code: string): string | null {
    if (!code) {
      return null;
    }

    // Try matching as NAICS code (handles ranges like "31-33")
    if (this.naicsToEntityTypeMap[code]) {
      return this.naicsToEntityTypeMap[code];
    }

    // Try matching as SIC code (handles two-digit codes)
    if (this.sicToEntityTypeMap[code]) {
      return this.sicToEntityTypeMap[code];
    }

    // Fallback for potential variations or if a more specific mapping is needed
    // For example, if you have a larger dataset, you might want to parse the code
    // and check for prefixes or specific ranges.
    // For now, we'll just return null if no direct match is found.

    return null;
  }
}
