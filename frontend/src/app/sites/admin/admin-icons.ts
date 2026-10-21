import type { IconSet } from '@anotoki/lib/ui/config';
import { circle, rect } from '@anotoki/lib/ui/icon';
import { iconArrowUp, iconLaptop } from '@anotoki/lib/ui/icons';

/**
 * The admin panel's icons - its navigation's, its forms' tabs' and the dashboard's content tiles' (the API names those
 * 'icon-swords', the dashboard reads it 'admin-swords') -, registered with the kit's icons (`AnotokiIcons.register()`,
 * by the panel's frame) so the kit's pieces can draw them: the Lucide drawings the panel drew as masks
 * (`local-lib/icons.scss`, which keeps only the masks a page still draws), as the kit takes an icon - the `d` of each
 * path on its 24-unit grid. Named `admin-*`, so none of them redraws a kit icon of the same name (the kit's own
 * `shield`); the tabs take the kit's own `info`, `user` and `sparkle` besides. Lazy, with the panel: no first load
 * carries them.
 */
export const ADMIN_ICONS: IconSet = {
  'admin-gauge': ['M3.3 19a10 10 0 1 1 17.4 0', 'm12 14 4-4', circle(12, 15, 1.5)],
  'admin-swords': ['M3 3v5l9 9 3-3-9-9z', 'M21 3v5l-9 9-3-3 9-9z', 'm6.5 17.5-3.5 3.5', 'm17.5 17.5 3.5 3.5'],
  'admin-skull': ['M12 2a8 8 0 0 0-8 8c0 2.6 1.2 4.7 3 6v3a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-3c1.8-1.3 3-3.4 3-6a8 8 0 0 0-8-8z', circle(9, 11, 1.5), circle(15, 11, 1.5), 'M10 20v-3', 'M14 20v-3'],
  'admin-boxes': [rect(3, 3, 7, 7, 1), rect(14, 3, 7, 7, 1), rect(3, 14, 7, 7, 1), rect(14, 14, 7, 7, 1)],
  'admin-ring': [circle(12, 15, 6), 'M12 3 15.5 8h-7z'],
  'admin-sword': ['M14.5 17.5 3 6V3h3l11.5 11.5', 'm13 19 6-6', 'm16 16 4 4'],
  'admin-utensils': ['M3 2v7a3 3 0 0 0 3 3 3 3 0 0 0 3-3V2', 'M6 12v10', 'M18 22V2', 'M18 2a3 3 0 0 1 3 3v6a3 3 0 0 1-3 3'],
  'admin-scroll': ['M15 12h-5', 'M15 8h-5', 'M19 17V5a2 2 0 0 0-2-2H4', 'M8 21h12a2 2 0 0 0 2-2v-1a1 1 0 0 0-1-1H11a1 1 0 0 0-1 1v1a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v2a1 1 0 0 0 1 1h3'],
  'admin-image': [rect(3, 3, 18, 18, 2), circle(9, 9, 2), 'm21 15-3-3-9 9'],
  'admin-folder': ['M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z'],
  'admin-layers': [
    'm12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z',
    'm22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65',
    'm22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65',
  ],
  'admin-heart': ['M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7z'],
  'admin-star': ['M12 3 14.35 9.26 21.04 9.56 15.8 13.74 17.58 20.19 12 16.5 6.42 20.19 8.2 13.74 2.96 9.56 9.65 9.26Z'],
  'admin-globe': [circle(12, 12, 10), 'M2 12h20', 'M12 2a15 15 0 0 1 4 10 15 15 0 0 1-4 10 15 15 0 0 1-4-10 15 15 0 0 1 4-10z'],
  'admin-tag': ['M12 2H2v10l9.3 9.3a1 1 0 0 0 1.4 0l8.6-8.6a1 1 0 0 0 0-1.4z', circle(7, 7, 1.5)],
  'admin-dungeon': ['M3 21V9l4-3 5 3 5-3 4 3v12z', 'M10 21v-6a2 2 0 1 1 4 0v6', 'M3 21h18'],
  'admin-flame': ['M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.4-.5-2-1-3-1.1-2.1-.2-4 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.2.4-2.3 1-3a2.5 2.5 0 0 0 2.5 2.5z'],
  'admin-user-group': ['M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2', circle(9, 7, 4), 'M22 21v-2a4 4 0 0 0-3-3.87', 'M16 3.13a4 4 0 0 1 0 7.75'],
  'admin-chart': ['M3 3v16a2 2 0 0 0 2 2h16', 'M18 17V9', 'M13 17V5', 'M8 17v-3'],
  'admin-wind': ['M3 8h12a3 3 0 1 0-3-3', 'M3 12h16a3 3 0 1 1-3 3', 'M3 16h9'],
  'admin-shield': [
    'M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z',
    'M12 8v4',
    'M12 16h.01',
  ],
  'admin-circle-dot': [circle(12, 12, 10), circle(12, 12, 3)],
  'admin-gem': ['M6 3h12l4 6-10 12L2 9z', 'M2 9h20', 'm12 21-4-12 3-6', 'm12 21 4-12-3-6'],
  'admin-puzzle': ['M4 4h5a2 2 0 1 1 4 0h5v5a2 2 0 1 0 0 4v5h-5a2 2 0 1 0-4 0H4v-5a2 2 0 1 1 0-4z'],
  'admin-list': ['M8 6h13', 'M8 12h13', 'M8 18h13', circle(4, 6, 1), circle(4, 12, 1), circle(4, 18, 1)],
  // Lucide's open book: the site's own book (a filled drawing) is no line icon.
  'admin-book': ['M12 7v14', 'M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z'],
  'admin-settings': ['M20 7h-9', 'M14 17H5', circle(17, 17, 3), circle(7, 7, 3)],
  // The quizzes' three levels: three bars, each taller (Lucide's signal, three of its bars).
  'admin-levels': ['M6 20v-4', 'M12 20v-9', 'M18 20V6'],
  'admin-user-check': ['M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2', circle(9, 7, 4), 'M16 11 18 13 22 9'],
  'admin-mail': [rect(2, 4, 20, 16, 2), 'm22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7'],
  'admin-history': ['M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8', 'M3 3v5h5', 'M12 7v5l4 2'],
  'admin-triangle-alert': ['m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3', 'M12 9v4', 'M12 17h.01'],
  // The family's laptop: the site's own computer (a filled drawing) is no line icon.
  'admin-computer': iconLaptop,
  'admin-database': ['M3 5a9 3 0 1 0 18 0a9 3 0 1 0 -18 0', 'M3 5v14a9 3 0 0 0 18 0V5', 'M3 12a9 3 0 0 0 18 0'],
  'admin-download': ['M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4', 'M7 10 12 15 17 10', 'M12 15V3'],
  // The forms' tabs: the voice overs, the ascensions, a cost (Lucide's mic and coins; the family's arrow).
  'admin-mic': ['M12 19v3', 'M19 10v2a7 7 0 0 1-14 0v-2', rect(9, 2, 6, 13, 3)],
  'admin-arrow-up': iconArrowUp,
  'admin-coins': [circle(8, 8, 6), 'M18.09 10.37A6 6 0 1 1 10.34 18', 'M7 6h1v4', 'm16.71 13.88.7.71-2.82 2.82'],
};
