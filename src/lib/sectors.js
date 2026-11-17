// Sector choices for fund holdings, grouped for the <select> in Manage Holdings.
// Existing names are kept as-is so holdings already saved keep their sector.

export const SECTOR_GROUPS = [
  { label: 'Financial Services', sectors: [
    'Banking & Finance', 'Insurance', 'Non-Banking Financial (NBFC)', 'Financial Services',
    'Capital Markets & Exchanges', 'Asset Management',
  ] },
  { label: 'Technology & Telecom', sectors: [
    'Information Technology', 'Telecommunication', 'Media & Entertainment',
    'Internet & Digital Platforms', 'Electronics Manufacturing (EMS)', 'Semiconductors',
  ] },
  { label: 'Energy & Utilities', sectors: [
    'Energy & Power', 'Renewable Energy', 'Power Transmission & Distribution', 'Oil & Gas',
    'Gas Distribution', 'Water Treatment & Utilities',
  ] },
  { label: 'Industrials', sectors: [
    'Capital Goods & Engineering', 'Electrical Equipment', 'Cables & Wires',
    'Industrial Machinery', 'Defence & Aerospace', 'Railways', 'Shipbuilding & Marine',
  ] },
  { label: 'Infrastructure & Materials', sectors: [
    'Infrastructure & Construction', 'Cement & Building Materials',
    'Building Products (Pipes, Tiles, Sanitaryware)', 'Metals & Mining', 'Steel', 'Paper & Packaging',
  ] },
  { label: 'Chemicals', sectors: [
    'Chemicals & Fertilizers', 'Specialty Chemicals', 'Agrochemicals', 'Paints & Coatings',
    'Plastics & Polymers',
  ] },
  { label: 'Consumer & Retail', sectors: [
    'Consumer Goods (FMCG)', 'Food Processing', 'Beverages', 'Personal Care',
    'Consumer Durables', 'Retail & E-Commerce', 'Textiles & Apparel', 'Footwear & Accessories',
    'Jewellery', 'Hotels, Restaurants & Tourism',
  ] },
  { label: 'Healthcare & Life Sciences', sectors: [
    'Healthcare & Pharma', 'Pharma API & CDMO', 'Hospitals & Diagnostics', 'Medical Devices',
  ] },
  { label: 'Auto & Transport', sectors: [
    'Automobile', 'Commercial Vehicles', 'Two & Three Wheelers', 'Auto Components',
    'Tyres & Rubber', 'Logistics & Shipping', 'Aviation & Airports',
  ] },
  { label: 'Real Assets & Agriculture', sectors: [
    'Real Estate', 'Agriculture & Allied', 'Sugar',
  ] },
  { label: 'Services', sectors: [
    'Education', 'Staffing & Business Services',
  ] },
  { label: 'Other', sectors: [
    'ETF / Index Fund', 'Others / Cash',
  ] },
];

export function SectorOptions() {
  return SECTOR_GROUPS.map(group => (
    <optgroup key={group.label} label={group.label}>
      {group.sectors.map(sector => <option key={sector}>{sector}</option>)}
    </optgroup>
  ));
}
