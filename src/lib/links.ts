/**
 * Links to the original Bus Stop Antigua site (busstopanu.com), which has been
 * the reference for Antigua's public bus network since 2014. Everything here
 * opens in a new tab so the modern app stays in place.
 */
export const OLD_SITE_URL = 'http://busstopanu.com/';

export interface LegacyLink {
  label: string;
  href: string;
  description: string;
}

export const LEGACY_LINKS: LegacyLink[] = [
  {
    label: 'Bus Routes',
    href: 'http://busstopanu.com/busroutes/busroutes.html',
    description: 'The original route-by-route listing',
  },
  {
    label: 'Bus Stops',
    href: 'http://busstopanu.com/BusStops/BusStops.html',
    description: 'Every stop former riders used',
  },
  {
    label: "St. John's Map",
    href: 'http://busstopanu.com/stjohns/stjohnsmap.html',
    description: 'Downtown terminal and east/west stations',
  },
  {
    label: 'Beaches',
    href: 'http://busstopanu.com/busto/beach.html',
    description: 'Which bus reaches which beach',
  },
  {
    label: 'Hotels',
    href: 'http://busstopanu.com/busto/hotel.html',
    description: 'Buses serving the main hotels',
  },
  {
    label: 'Sites & Attractions',
    href: 'http://busstopanu.com/busto/sites.html',
    description: 'Buses to the island’s landmarks',
  },
  {
    label: 'FAQ',
    href: 'http://busstopanu.com/faq/faq.html',
    description: 'How the buses and fares work',
  },
  {
    label: 'About',
    href: 'http://busstopanu.com/About/About.html',
    description: 'About the original service',
  },
  {
    label: 'Contact',
    href: 'http://busstopanu.com/Contact/Contact.html',
    description: 'Reach the original team',
  },
  {
    label: 'Taxis',
    href: 'http://busstopanu.com/alt/taxi.html',
    description: 'Taxi alternatives',
  },
  {
    label: 'Car Rentals',
    href: 'http://busstopanu.com/alt/carrent.html',
    description: 'Car rental alternatives',
  },
  {
    label: 'Blog',
    href: 'http://www.busstopanu.blogspot.com',
    description: 'Updates from the old blog',
  },
];

export const LEGACY_SOCIAL: { label: string; href: string }[] = [
  { label: 'Facebook', href: 'http://www.facebook.com/BusStopAnu' },
  { label: 'Twitter / X', href: 'http://www.twitter.com/busstopanu' },
];
