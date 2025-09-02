import PaperTemp1 from './PaperTemp1';
import PaperTemp2 from './PaperTemp2';
import PaperTemp3 from './PaperTemp3';

export const paperTemplates = [
  {
    id: 'paper-temp1',
    name: 'Traditional Academic',
    description: 'Classic exam paper format with formal layout',
    component: PaperTemp1,
    preview: '/api/placeholder/300/200' // You can add preview images later
  },
  {
    id: 'paper-temp2',
    name: 'Modern Blue',
    description: 'Contemporary design with blue gradient header',
    component: PaperTemp2,
    preview: '/api/placeholder/300/200'
  },
  {
    id: 'paper-temp3',
    name: 'Minimalist',
    description: 'Clean and simple layout with elegant typography',
    component: PaperTemp3,
    preview: '/api/placeholder/300/200'
  }
];

export { PaperTemp1, PaperTemp2, PaperTemp3 };
