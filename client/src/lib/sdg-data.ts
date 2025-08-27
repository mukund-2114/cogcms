export interface SDGData {
  id: string;
  number: number;
  title: string;
  description: string;
  color: string;
  icon: string;
}

export const SDG_DATA: SDGData[] = [
  {
    id: '1',
    number: 1,
    title: 'No Poverty',
    description: 'End poverty in all its forms everywhere',
    color: 'bg-red-600',
    icon: 'fas fa-hand-holding-heart'
  },
  {
    id: '2',
    number: 2,
    title: 'Zero Hunger',
    description: 'End hunger, achieve food security and improved nutrition',
    color: 'bg-yellow-600',
    icon: 'fas fa-seedling'
  },
  {
    id: '3',
    number: 3,
    title: 'Good Health and Well-being',
    description: 'Ensure healthy lives and promote well-being for all',
    color: 'bg-green-600',
    icon: 'fas fa-heartbeat'
  },
  {
    id: '4',
    number: 4,
    title: 'Quality Education',
    description: 'Ensure inclusive and equitable quality education',
    color: 'bg-red-700',
    icon: 'fas fa-graduation-cap'
  },
  {
    id: '5',
    number: 5,
    title: 'Gender Equality',
    description: 'Achieve gender equality and empower all women and girls',
    color: 'bg-orange-600',
    icon: 'fas fa-venus'
  },
  {
    id: '6',
    number: 6,
    title: 'Clean Water and Sanitation',
    description: 'Ensure availability and sustainable management of water',
    color: 'bg-blue-400',
    icon: 'fas fa-tint'
  },
  {
    id: '7',
    number: 7,
    title: 'Affordable and Clean Energy',
    description: 'Ensure access to affordable, reliable, sustainable energy',
    color: 'bg-yellow-500',
    icon: 'fas fa-bolt'
  },
  {
    id: '8',
    number: 8,
    title: 'Decent Work and Economic Growth',
    description: 'Promote sustained, inclusive economic growth',
    color: 'bg-red-800',
    icon: 'fas fa-briefcase'
  },
  {
    id: '9',
    number: 9,
    title: 'Industry, Innovation and Infrastructure',
    description: 'Build resilient infrastructure, promote innovation',
    color: 'bg-orange-700',
    icon: 'fas fa-industry'
  },
  {
    id: '10',
    number: 10,
    title: 'Reduced Inequalities',
    description: 'Reduce inequality within and among countries',
    color: 'bg-pink-600',
    icon: 'fas fa-balance-scale'
  },
  {
    id: '11',
    number: 11,
    title: 'Sustainable Cities and Communities',
    description: 'Make cities and human settlements inclusive and sustainable',
    color: 'bg-yellow-700',
    icon: 'fas fa-city'
  },
  {
    id: '12',
    number: 12,
    title: 'Responsible Consumption and Production',
    description: 'Ensure sustainable consumption and production patterns',
    color: 'bg-yellow-800',
    icon: 'fas fa-recycle'
  },
  {
    id: '13',
    number: 13,
    title: 'Climate Action',
    description: 'Take urgent action to combat climate change',
    color: 'bg-green-700',
    icon: 'fas fa-leaf'
  },
  {
    id: '14',
    number: 14,
    title: 'Life Below Water',
    description: 'Conserve and sustainably use the oceans and marine resources',
    color: 'bg-blue-600',
    icon: 'fas fa-fish'
  },
  {
    id: '15',
    number: 15,
    title: 'Life on Land',
    description: 'Protect, restore and promote sustainable use of ecosystems',
    color: 'bg-green-800',
    icon: 'fas fa-tree'
  },
  {
    id: '16',
    number: 16,
    title: 'Peace, Justice and Strong Institutions',
    description: 'Promote peaceful and inclusive societies',
    color: 'bg-blue-800',
    icon: 'fas fa-gavel'
  },
  {
    id: '17',
    number: 17,
    title: 'Partnerships for the Goals',
    description: 'Strengthen the means of implementation and revitalize partnerships',
    color: 'bg-blue-900',
    icon: 'fas fa-handshake'
  }
];

export function getSDGById(id: string): SDGData | undefined {
  return SDG_DATA.find(sdg => sdg.id === id);
}

export function getSDGByNumber(number: number): SDGData | undefined {
  return SDG_DATA.find(sdg => sdg.number === number);
}
