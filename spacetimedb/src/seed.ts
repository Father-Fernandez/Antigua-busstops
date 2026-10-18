// Seed data for the Antigua bus network, derived from busstopanu.com.
//
// STOP COORDINATES: sourced from OpenStreetMap Nominatim, GeoNames (AG dump),
// and Photon. 83 of 87 stops resolved; the remaining four small hamlets
// (Bathlodge, Blackout, Briggins, Carty's Hill) are absent from every source and
// seed with lat/lng 0 until coordinates are added. Clarkes Hill, Crabbe Hill,
// Free Trade Zone, Hattan, Horsford Hill, Longfords and Upper Fort Road are
// best-effort placements, not survey-grade.
//
// ROUTE DATA: the site publishes route numbers, fares (adult/child/night), and
// terminus. Fare values are in cents (t.u16) to avoid floating-point money.
// Full stop sequences live in an embedded Google My Maps and are not in the
// page source, so only the documented/known stops are seeded here.

export interface SeedStop {
  name: string;
  lat: number;
  lng: number;
}

export interface SeedRoute {
  number: string;
  name: string;
  terminus: 'East' | 'West';
  color: string;
  description: string;
  stops: string[];
  stopFares?: { stop: string; adult: number; child: number; night: number }[];
}

export const STOPS: SeedStop[] = [
  { name: 'Airport Road', lat: 17.1355, lng: -61.7939 },
  { name: 'All Saints', lat: 17.065969, lng: -61.795141 },
  { name: 'Barnes Hill', lat: 17.142611, lng: -61.809502 },
  { name: 'Bathlodge', lat: 0, lng: 0 },
  { name: 'Belmont', lat: 17.09964, lng: -61.82612 },
  { name: 'Bendals', lat: 17.070117, lng: -61.837142 },
  { name: 'Bethesda', lat: 17.045241, lng: -61.750529 },
  { name: 'Blackout', lat: 0, lng: 0 },
  { name: 'Bolans', lat: 17.066722, lng: -61.876855 },
  { name: 'Branns', lat: 17.10366, lng: -61.83612 },
  { name: 'Briggins', lat: 0, lng: 0 },
  { name: 'Buckleys', lat: 17.069774, lng: -61.812448 },
  { name: 'Carlisle', lat: 17.015556, lng: -61.832334 },
  { name: "Carty's Hill", lat: 0, lng: 0 },
  { name: 'Cashew Hill', lat: 17.09368, lng: -61.85932 },
  { name: 'Cassada Gardens', lat: 17.131245, lng: -61.811859 },
  { name: 'Cedar Grove', lat: 17.161943, lng: -61.821512 },
  { name: 'Cedar Hill', lat: 17.143769, lng: -61.823484 },
  { name: 'Cedar Valley Gardens', lat: 17.141334, lng: -61.815906 },
  { name: 'Clare Hall', lat: 17.11667, lng: -61.81667 },
  { name: 'Clarkes Hill', lat: 17.083, lng: -61.809 },
  { name: 'Cobbs Cross', lat: 17.024766, lng: -61.766549 },
  { name: 'Collins', lat: 17.074652, lng: -61.734923 },
  { name: 'Coolidge', lat: 17.147269, lng: -61.80002 },
  { name: 'Crabbe Hill', lat: 17.03437, lng: -61.89114 },
  { name: 'Creekside', lat: 17.07902, lng: -61.85646 },
  { name: 'Diamonds', lat: 17.07759, lng: -61.76047 },
  { name: 'Dickenson', lat: 17.12579, lng: -61.842355 },
  { name: 'Ebenezer', lat: 17.079304, lng: -61.85715 },
  { name: 'Emanuel', lat: 17.07217, lng: -61.83731 },
  { name: 'English Harbour', lat: 17.008874, lng: -61.763644 },
  { name: 'Falmouth', lat: 17.023296, lng: -61.773345 },
  { name: 'Fitches Creek', lat: 17.127102, lng: -61.792947 },
  { name: 'Five Islands', lat: 17.11803, lng: -61.883688 },
  { name: 'Free Trade Zone', lat: 17.145, lng: -61.795 },
  { name: 'Freemans Village', lat: 17.079394, lng: -61.788815 },
  { name: 'Freetown', lat: 17.046663, lng: -61.703116 },
  { name: 'Friars Hill Road', lat: 17.155782, lng: -61.828656 },
  { name: 'Gambles Terrace', lat: 17.12843, lng: -61.84205 },
  { name: 'Glanvilles', lat: 17.086085, lng: -61.724214 },
  { name: 'Golden Grove', lat: 17.10326, lng: -61.846086 },
  { name: 'Grays Farm', lat: 17.11096, lng: -61.84769 },
  { name: 'Green Bay', lat: 17.119911, lng: -61.850572 },
  { name: 'Gunthorpes', lat: 17.108922, lng: -61.801007 },
  { name: 'Hattan', lat: 17.11654, lng: -61.85302 },
  { name: 'Herberts', lat: 17.093951, lng: -61.816113 },
  { name: 'Hodges Bay', lat: 17.166828, lng: -61.809204 },
  { name: 'Horsford Hill', lat: 17.03, lng: -61.788 },
  { name: 'Jennings', lat: 17.077288, lng: -61.868333 },
  { name: 'John Hughes', lat: 17.043652, lng: -61.821694 },
  { name: 'Johnsons Point', lat: 17.027346, lng: -61.886297 },
  { name: 'Jolly Harbour', lat: 17.064854, lng: -61.885912 },
  { name: 'Jonas Road', lat: 17.076299, lng: -61.783251 },
  { name: 'Liberta', lat: 17.038757, lng: -61.79511 },
  { name: 'Lightfoot', lat: 17.099078, lng: -61.803668 },
  { name: 'Longfords', lat: 17.1592, lng: -61.8264 },
  { name: 'Lyons', lat: 17.063871, lng: -61.73453 },
  { name: 'Marble Hill', lat: 17.146858, lng: -61.838925 },
  { name: 'Nelsons Dockyard', lat: 17.008295, lng: -61.764904 },
  { name: 'New Winthorpes', lat: 17.14718, lng: -61.812673 },
  { name: 'Newfield', lat: 17.055858, lng: -61.726308 },
  { name: 'Nut Grove', lat: 17.10572, lng: -61.84458 },
  { name: 'Old Road', lat: 17.016599, lng: -61.840223 },
  { name: 'Old Sugar Factory', lat: 17.108641, lng: -61.79886 },
  { name: 'Pares', lat: 17.08516, lng: -61.754179 },
  { name: 'Parham', lat: 17.108432, lng: -61.768262 },
  { name: 'Paynters', lat: 17.116282, lng: -61.796454 },
  { name: 'Piccadilly', lat: 17.025893, lng: -61.755648 },
  { name: 'Pigotts', lat: 17.12236, lng: -61.805608 },
  { name: 'Pot Works Dam', lat: 17.062085, lng: -61.75991 },
  { name: 'Potters', lat: 17.114501, lng: -61.819982 },
  { name: 'Sandals Resort', lat: 17.157198, lng: -61.847971 },
  { name: 'Sawcolts', lat: 17.048933, lng: -61.819143 },
  { name: 'Sea View Farm', lat: 17.090013, lng: -61.803582 },
  { name: 'Seatons', lat: 17.093961, lng: -61.724352 },
  { name: 'St. Johns', lat: 17.118457, lng: -61.844851 },
  { name: "St. Johnson's Village", lat: 17.11861, lng: -61.827 },
  { name: 'St. Phillips', lat: 17.04628, lng: -61.72373 },
  { name: 'Sutherlands', lat: 17.11241, lng: -61.88007 },
  { name: 'Swetes', lat: 17.051394, lng: -61.803968 },
  { name: 'Tyrells', lat: 17.044422, lng: -61.793583 },
  { name: 'Upper Fort Road', lat: 17.125, lng: -61.84 },
  { name: 'Urlings', lat: 17.028349, lng: -61.876195 },
  { name: 'Vernons', lat: 17.09192, lng: -61.77132 },
  { name: 'Villa', lat: 17.131116, lng: -61.848248 },
  { name: 'Willikies', lat: 17.085593, lng: -61.707906 },
  { name: 'Yorks', lat: 17.139977, lng: -61.848902 },
];

// Routes scraped from busstopanu.com (23 routes across East & West stations).
// Each route lists the ordered stops from St. John's to its destination; `fare`
// is the terminus fare (adult/child/night) in cents.
export const ROUTES: SeedRoute[] = [
  {
    number: '10',
    name: 'Bendals',
    terminus: 'West',
    color: '#d32630',
    description: "St John's To Bendals",
    stops: ['St. Johns', 'Bendals'],
    stopFares: [
      { stop: 'Bendals', adult: 250, child: 200, night: 400 },
    ],
  },
  {
    number: '12',
    name: "Freeman's Village",
    terminus: 'West',
    color: '#407fc9',
    description: "St John's To Freeman's Village",
    stops: ['St. Johns', 'Belmont', 'Clarkes Hill', 'Sea View Farm', 'Freemans Village'],
    stopFares: [
      { stop: 'Belmont', adult: 225, child: 175, night: 375 },
      { stop: 'Clarkes Hill', adult: 250, child: 200, night: 400 },
      { stop: 'Sea View Farm', adult: 275, child: 200, night: 425 },
      { stop: 'Freemans Village', adult: 275, child: 200, night: 425 },
    ],
  },
  {
    number: '13',
    name: 'John Hughes',
    terminus: 'West',
    color: '#1e3956',
    description: "St John's To John Hughes",
    stops: ['St. Johns', 'Belmont', 'Buckleys', 'Swetes', 'John Hughes'],
    stopFares: [
      { stop: 'Belmont', adult: 225, child: 175, night: 375 },
      { stop: 'Buckleys', adult: 275, child: 200, night: 425 },
      { stop: 'Swetes', adult: 275, child: 200, night: 425 },
      { stop: 'John Hughes', adult: 325, child: 275, night: 475 },
    ],
  },
  {
    number: '15',
    name: 'Horsford Hill',
    terminus: 'West',
    color: '#b01d26',
    description: "St John's To Horsford Hill",
    stops: ['St. Johns', 'Belmont', 'Clarkes Hill', 'All Saints', 'Liberta', 'Horsford Hill'],
    stopFares: [
      { stop: 'Belmont', adult: 225, child: 175, night: 375 },
      { stop: 'Clarkes Hill', adult: 250, child: 200, night: 400 },
      { stop: 'All Saints', adult: 275, child: 200, night: 425 },
      { stop: 'Liberta', adult: 300, child: 225, night: 450 },
      { stop: 'Horsford Hill', adult: 300, child: 225, night: 450 },
    ],
  },
  {
    number: '17',
    name: 'English Harbour',
    terminus: 'West',
    color: '#2a5382',
    description: "St John's To English Habour",
    stops: ['St. Johns', 'Belmont', 'Clarkes Hill', 'All Saints', 'Liberta', 'Falmouth', 'Cobbs Cross', 'English Harbour'],
    stopFares: [
      { stop: 'Belmont', adult: 225, child: 175, night: 375 },
      { stop: 'Clarkes Hill', adult: 250, child: 200, night: 400 },
      { stop: 'All Saints', adult: 275, child: 200, night: 425 },
      { stop: 'Liberta', adult: 300, child: 225, night: 450 },
      { stop: 'Falmouth', adult: 350, child: 275, night: 500 },
      { stop: 'Cobbs Cross', adult: 350, child: 275, night: 500 },
      { stop: 'English Harbour', adult: 375, child: 275, night: 525 },
    ],
  },
  {
    number: '20',
    name: 'Bolans',
    terminus: 'West',
    color: '#8f1820',
    description: "St John's To Bolans",
    stops: ['St. Johns', 'Golden Grove', 'Ebenezer', 'Jennings', 'Bolans'],
    stopFares: [
      { stop: 'Golden Grove', adult: 225, child: 175, night: 375 },
      { stop: 'Ebenezer', adult: 250, child: 200, night: 400 },
      { stop: 'Jennings', adult: 250, child: 200, night: 400 },
      { stop: 'Bolans', adult: 275, child: 200, night: 425 },
    ],
  },
  {
    number: '22',
    name: 'Old Road',
    terminus: 'West',
    color: '#33679f',
    description: "St John's To Old Road",
    stops: ['St. Johns', 'Golden Grove', 'Ebenezer', 'Jennings', 'Bolans', 'Crabbe Hill', 'Johnsons Point', 'Urlings', 'Old Road'],
    stopFares: [
      { stop: 'Golden Grove', adult: 225, child: 175, night: 375 },
      { stop: 'Ebenezer', adult: 250, child: 200, night: 400 },
      { stop: 'Jennings', adult: 250, child: 200, night: 400 },
      { stop: 'Bolans', adult: 275, child: 200, night: 425 },
      { stop: 'Crabbe Hill', adult: 300, child: 225, night: 450 },
      { stop: 'Johnsons Point', adult: 300, child: 225, night: 450 },
      { stop: 'Urlings', adult: 325, child: 250, night: 475 },
      { stop: 'Old Road', adult: 375, child: 275, night: 525 },
    ],
  },
  {
    number: '29B',
    name: 'Potters/Herberts',
    terminus: 'West',
    color: '#5b95d3',
    description: "St John's To Herberts",
    stops: ['St. Johns', 'Belmont', 'Herberts'],
    stopFares: [
      { stop: 'Belmont', adult: 225, child: 175, night: 375 },
      { stop: 'Herberts', adult: 275, child: 200, night: 425 },
    ],
  },
  {
    number: '30',
    name: 'Potters',
    terminus: 'East',
    color: '#0f766e',
    description: "St John's To Potters",
    stops: ['St. Johns', "St. Johnson's Village", 'Potters'],
    stopFares: [
      { stop: "St. Johnson's Village", adult: 225, child: 175, night: 375 },
      { stop: 'Potters', adult: 225, child: 175, night: 375 },
    ],
  },
  {
    number: '31',
    name: 'Parham',
    terminus: 'East',
    color: '#7c3aed',
    description: "St John's To Parham",
    stops: ['St. Johns', "St. Johnson's Village", 'Potters', 'Paynters', 'Cedar Hill', 'Vernons', 'Parham'],
    stopFares: [
      { stop: "St. Johnson's Village", adult: 225, child: 175, night: 375 },
      { stop: 'Potters', adult: 225, child: 175, night: 375 },
      { stop: 'Paynters', adult: 250, child: 200, night: 400 },
      { stop: 'Cedar Hill', adult: 275, child: 225, night: 425 },
      { stop: 'Vernons', adult: 275, child: 225, night: 425 },
      { stop: 'Parham', adult: 300, child: 225, night: 450 },
    ],
  },
  {
    number: '32',
    name: 'Sea View Farm',
    terminus: 'East',
    color: '#d32630',
    description: "St John's To Sea View Farm",
    stops: ['St. Johns', "St. Johnson's Village", 'Potters', 'Paynters', 'Old Sugar Factory', 'Gunthorpes', 'Lightfoot', 'Sea View Farm'],
    stopFares: [
      { stop: "St. Johnson's Village", adult: 225, child: 175, night: 375 },
      { stop: 'Potters', adult: 225, child: 175, night: 375 },
      { stop: 'Paynters', adult: 250, child: 200, night: 400 },
      { stop: 'Old Sugar Factory', adult: 250, child: 200, night: 400 },
      { stop: 'Gunthorpes', adult: 250, child: 200, night: 400 },
      { stop: 'Lightfoot', adult: 250, child: 200, night: 400 },
      { stop: 'Sea View Farm', adult: 275, child: 200, night: 425 },
    ],
  },
  {
    number: '33',
    name: 'Willikies',
    terminus: 'East',
    color: '#407fc9',
    description: "St John's To Willikies",
    stops: ['St. Johns', "St. Johnson's Village", 'Potters', 'Paynters', 'Old Sugar Factory', 'Cedar Hill', 'Vernons', 'Pares', 'Glanvilles', 'Seatons', 'Willikies'],
    stopFares: [
      { stop: "St. Johnson's Village", adult: 225, child: 175, night: 375 },
      { stop: 'Potters', adult: 225, child: 175, night: 375 },
      { stop: 'Paynters', adult: 250, child: 200, night: 400 },
      { stop: 'Old Sugar Factory', adult: 250, child: 200, night: 400 },
      { stop: 'Cedar Hill', adult: 250, child: 200, night: 400 },
      { stop: 'Vernons', adult: 275, child: 200, night: 425 },
      { stop: 'Pares', adult: 300, child: 225, night: 450 },
      { stop: 'Glanvilles', adult: 300, child: 225, night: 450 },
      { stop: 'Seatons', adult: 300, child: 225, night: 450 },
      { stop: 'Willikies', adult: 325, child: 250, night: 475 },
    ],
  },
  {
    number: '34',
    name: 'Bethesda',
    terminus: 'East',
    color: '#1e3956',
    description: "St John's To Bethesda",
    stops: ['St. Johns', "St. Johnson's Village", 'Potters', 'Paynters', 'Old Sugar Factory', 'Cedar Hill', 'Vernons', 'Pares', 'Collins', 'Bethesda'],
    stopFares: [
      { stop: "St. Johnson's Village", adult: 225, child: 175, night: 375 },
      { stop: 'Potters', adult: 225, child: 175, night: 375 },
      { stop: 'Paynters', adult: 250, child: 200, night: 400 },
      { stop: 'Old Sugar Factory', adult: 250, child: 200, night: 400 },
      { stop: 'Cedar Hill', adult: 250, child: 200, night: 400 },
      { stop: 'Vernons', adult: 275, child: 200, night: 425 },
      { stop: 'Pares', adult: 300, child: 225, night: 450 },
      { stop: 'Collins', adult: 325, child: 250, night: 475 },
      { stop: 'Bethesda', adult: 325, child: 250, night: 475 },
    ],
  },
  {
    number: '35',
    name: 'Freetown',
    terminus: 'East',
    color: '#b01d26',
    description: "St John's To Freetown",
    stops: ['St. Johns', "St. Johnson's Village", 'Potters', 'Paynters', 'Old Sugar Factory', 'Cedar Hill', 'Vernons', 'Diamonds', 'Blackout', 'Pot Works Dam', 'Collins', 'Lyons', 'Newfield', 'St. Phillips', 'Freetown'],
    stopFares: [
      { stop: "St. Johnson's Village", adult: 225, child: 175, night: 375 },
      { stop: 'Potters', adult: 225, child: 175, night: 375 },
      { stop: 'Paynters', adult: 250, child: 200, night: 400 },
      { stop: 'Old Sugar Factory', adult: 250, child: 200, night: 400 },
      { stop: 'Cedar Hill', adult: 250, child: 200, night: 400 },
      { stop: 'Vernons', adult: 275, child: 200, night: 425 },
      { stop: 'Diamonds', adult: 300, child: 225, night: 450 },
      { stop: 'Blackout', adult: 300, child: 225, night: 450 },
      { stop: 'Pot Works Dam', adult: 300, child: 225, night: 450 },
      { stop: 'Collins', adult: 325, child: 250, night: 475 },
      { stop: 'Lyons', adult: 325, child: 250, night: 475 },
      { stop: 'Newfield', adult: 325, child: 250, night: 475 },
      { stop: 'St. Phillips', adult: 325, child: 250, night: 475 },
      { stop: 'Freetown', adult: 375, child: 275, night: 525 },
    ],
  },
  {
    number: '40',
    name: 'Pigotts',
    terminus: 'East',
    color: '#2a5382',
    description: "St John's To Pigotts",
    stops: ['St. Johns', "St. Johnson's Village", 'Pigotts'],
    stopFares: [
      { stop: "St. Johnson's Village", adult: 225, child: 175, night: 375 },
      { stop: 'Pigotts', adult: 250, child: 200, night: 400 },
    ],
  },
  {
    number: '40B',
    name: 'Fitches Creek',
    terminus: 'East',
    color: '#8f1820',
    description: "St John's To Fitches Creek",
    stops: ['St. Johns', "St. Johnson's Village", 'Pigotts', 'Fitches Creek'],
    stopFares: [
      { stop: "St. Johnson's Village", adult: 225, child: 175, night: 375 },
      { stop: 'Pigotts', adult: 250, child: 200, night: 400 },
      { stop: 'Fitches Creek', adult: 250, child: 200, night: 400 },
    ],
  },
  {
    number: '41B',
    name: 'Cedar Valley Gardens',
    terminus: 'East',
    color: '#33679f',
    description: "St John's To Cedar Valley Gardens",
    stops: ['St. Johns', 'New Winthorpes', 'Barnes Hill', 'Cedar Valley Gardens'],
    stopFares: [
      { stop: 'New Winthorpes', adult: 250, child: 200, night: 400 },
      { stop: 'Barnes Hill', adult: 250, child: 200, night: 400 },
      { stop: 'Cedar Valley Gardens', adult: 250, child: 200, night: 400 },
    ],
  },
  {
    number: '42',
    name: 'Liat Hangar/Free Trade Zone',
    terminus: 'West',
    color: '#5b95d3',
    description: "St John's To LIAT Hangar/Free Trade Zone",
    stops: ['St. Johns', 'Airport Road', 'Coolidge', 'Free Trade Zone'],
    stopFares: [
      { stop: 'Airport Road', adult: 225, child: 175, night: 375 },
      { stop: 'Coolidge', adult: 250, child: 200, night: 400 },
      { stop: 'Free Trade Zone', adult: 250, child: 200, night: 400 },
    ],
  },
  {
    number: '45',
    name: 'Woods Mall',
    terminus: 'West',
    color: '#0f766e',
    description: "St John's To Woods Mall",
    stops: ['St. Johns', 'Friars Hill Road'],
    stopFares: [
      { stop: 'Friars Hill Road', adult: 225, child: 175, night: 375 },
    ],
  },
  {
    number: '50',
    name: 'Yorks',
    terminus: 'West',
    color: '#7c3aed',
    description: "St John's To Marble Hill",
    stops: ['St. Johns', 'Yorks', 'Sandals Resort', 'Marble Hill'],
    stopFares: [
      { stop: 'Yorks', adult: 225, child: 175, night: 375 },
      { stop: 'Sandals Resort', adult: 300, child: 225, night: 450 },
      { stop: 'Marble Hill', adult: 300, child: 225, night: 450 },
    ],
  },
  {
    number: '55',
    name: 'Hodges Bay',
    terminus: 'East',
    color: '#d32630',
    description: "St John's To Hodges Bay",
    stops: ['St. Johns', 'Friars Hill Road', 'Longfords', 'Cedar Grove', 'Hodges Bay'],
    stopFares: [
      { stop: 'Friars Hill Road', adult: 225, child: 175, night: 375 },
      { stop: 'Longfords', adult: 250, child: 200, night: 400 },
      { stop: 'Cedar Grove', adult: 250, child: 200, night: 400 },
      { stop: 'Hodges Bay', adult: 250, child: 200, night: 400 },
    ],
  },
  {
    number: '60',
    name: "Bruce's Night Club",
    terminus: 'East',
    color: '#407fc9',
    description: "St John's To Bruce's Night Club",
    stops: ['St. Johns', 'Grays Farm', 'Green Bay', 'Hattan'],
    stopFares: [
      { stop: 'Grays Farm', adult: 225, child: 175, night: 375 },
      { stop: 'Green Bay', adult: 225, child: 175, night: 375 },
      { stop: 'Hattan', adult: 225, child: 175, night: 375 },
    ],
  },
  {
    number: '61',
    name: 'Five Islands',
    terminus: 'West',
    color: '#1e3956',
    description: "St John's To Five Islands",
    stops: ['St. Johns', 'Grays Farm', 'Green Bay', 'Five Islands'],
    stopFares: [
      { stop: 'Grays Farm', adult: 225, child: 175, night: 375 },
      { stop: 'Green Bay', adult: 225, child: 175, night: 375 },
      { stop: 'Five Islands', adult: 250, child: 200, night: 400 },
    ],
  },
];


// Tourist destinations, each tied to its nearest seeded bus stop so the planner
// can route to them. Coordinates are approximate; `nearestStop` is a best-effort
// match against the stops the seeded routes actually serve.
export type PlaceCategory = 'beach' | 'site' | 'village';

export interface SeedPlace {
  name: string;
  category: PlaceCategory;
  lat: number;
  lng: number;
  description: string;
  nearestStop: string;
}

export const PLACES: SeedPlace[] = [
  // Beaches
  { name: 'Dickenson Bay', category: 'beach', lat: 17.159, lng: -61.8456, description: "Antigua's liveliest beach strip, lined with resorts, bars and watersports.", nearestStop: 'Sandals Resort' },
  { name: 'Runaway Bay', category: 'beach', lat: 17.163, lng: -61.842, description: 'Calm north-coast bay beside Dickenson Bay, good for swimming.', nearestStop: 'Sandals Resort' },
  { name: 'Pigeon Point Beach', category: 'beach', lat: 17.166, lng: -61.834, description: 'Sheltered north-coast beach with picnic spots and calm water.', nearestStop: 'Hodges Bay' },
  { name: 'Fort James Beach', category: 'beach', lat: 17.135, lng: -61.858, description: "Historic beach beside Fort James, minutes from St. John's.", nearestStop: 'Green Bay' },
  { name: 'Deep Bay Beach', category: 'beach', lat: 17.137, lng: -61.878, description: 'Quiet horseshoe bay with a shipwreck to snorkel.', nearestStop: 'Five Islands' },
  { name: 'Hawksbill Beach', category: 'beach', lat: 17.144, lng: -61.887, description: 'Secluded bay with four crescent beaches.', nearestStop: 'Five Islands' },
  { name: 'Jolly Beach', category: 'beach', lat: 17.094, lng: -61.886, description: 'Long white-sand beach on the west coast, popular with visitors.', nearestStop: 'Jennings' },
  { name: 'Darkwood Beach', category: 'beach', lat: 17.066, lng: -61.895, description: 'Wide west-coast beach with views across to Montserrat.', nearestStop: 'Bolans' },
  { name: 'Ffryes Beach', category: 'beach', lat: 17.055, lng: -61.897, description: 'Golden-sand west-coast beach with a relaxed beach bar.', nearestStop: 'Bolans' },
  { name: 'Valley Church Beach', category: 'beach', lat: 17.062, lng: -61.886, description: 'Calm, family-friendly west-coast beach.', nearestStop: 'Bolans' },
  { name: 'Turners Beach', category: 'beach', lat: 17.075, lng: -61.905, description: 'Quiet west-coast beach, a local favourite.', nearestStop: 'Bolans' },
  { name: 'Crab Hill Beach', category: 'beach', lat: 17.043, lng: -61.89, description: 'South-west beach near Johnsons Point with a mellow vibe.', nearestStop: 'Crabbe Hill' },
  { name: 'Long Bay', category: 'beach', lat: 17.093, lng: -61.7, description: 'Long east-coast beach by Willikies, good for a breezy walk.', nearestStop: 'Willikies' },
  { name: 'Galleon Beach', category: 'beach', lat: 17.006, lng: -61.762, description: "Beach below Nelson's Dockyard in English Harbour.", nearestStop: 'English Harbour' },
  { name: 'Rendezvous Bay', category: 'beach', lat: 17.108, lng: -61.895, description: 'Remote bay best reached on foot from Five Islands.', nearestStop: 'Five Islands' },

  // Sites & attractions
  { name: "Nelson's Dockyard", category: 'site', lat: 17.008, lng: -61.764, description: 'Restored Georgian naval dockyard and a UNESCO World Heritage Site.', nearestStop: 'English Harbour' },
  { name: 'Shirley Heights', category: 'site', lat: 17.003, lng: -61.764, description: 'Hilltop lookout over English Harbour, famous for its Sunday sunset party.', nearestStop: 'English Harbour' },
  { name: "Devil's Bridge", category: 'site', lat: 17.111, lng: -61.7, description: 'Natural limestone arch carved by the Atlantic, near Willikies.', nearestStop: 'Willikies' },
  { name: "Betty's Hope", category: 'site', lat: 17.0627, lng: -61.7662, description: 'Restored 1650s sugar plantation and its twin windmills.', nearestStop: 'Pares' },
  { name: 'Fig Tree Drive', category: 'site', lat: 17.036, lng: -61.809, description: "Scenic rainforest road through the island's interior.", nearestStop: 'Swetes' },
  { name: 'Mount Obama (Boggy Peak)', category: 'site', lat: 17.056, lng: -61.805, description: "Antigua's highest point, with island-wide views.", nearestStop: 'Swetes' },
  { name: 'Cathedral of St. John the Divine', category: 'site', lat: 17.118, lng: -61.846, description: "Twin-towered Anglican cathedral in central St. John's.", nearestStop: 'St. Johns' },
  { name: 'Museum of Antigua & Barbuda', category: 'site', lat: 17.121, lng: -61.844, description: "Island history and heritage in the old St. John's courthouse.", nearestStop: 'St. Johns' },
  { name: 'Fort Barrington', category: 'site', lat: 17.129, lng: -61.858, description: "18th-century fort on Goat Hill guarding St. John's harbour.", nearestStop: 'St. Johns' },
  { name: 'Public Market', category: 'site', lat: 17.119, lng: -61.843, description: "Bustling market hall in downtown St. John's.", nearestStop: 'St. Johns' },
];
