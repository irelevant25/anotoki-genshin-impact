/** A wallpaper the site can be read over: its name (shown as it is - a place or a character), its thumbnail and the picture. */
export interface Wallpaper {
  name: string;
  preview: string;
  wallpaper: string;
}

/**
 * The wallpapers on offer, the first the one a browser that never chose sees.
 * Chosen in the wallpapers' window (SiteBackgroundsModalComponent), opened
 * from the account panel; the choice is this browser's (StorageKeys.BACKGROUND),
 * never the account's.
 */
export const WALLPAPERS: readonly Wallpaper[] = [
  {
    name: 'Fontaine',
    preview: 'assets/backgrounds/Fontaine - preview.avif',
    wallpaper: 'assets/backgrounds/Fontaine.avif',
  },
  {
    name: 'Liyue',
    preview: 'assets/backgrounds/Liyue - preview.avif',
    wallpaper: 'assets/backgrounds/Liyue.avif',
  },
  {
    name: 'Arlecchino',
    preview: 'assets/backgrounds/Arlecchino - preview.avif',
    wallpaper: 'assets/backgrounds/Arlecchino.avif',
  },
  {
    name: 'Arlecchino',
    preview: 'assets/backgrounds/Arlecchino2 - preview.avif',
    wallpaper: 'assets/backgrounds/Arlecchino2.avif',
  },
  {
    name: 'Furina',
    preview: 'assets/backgrounds/Furina - preview.avif',
    wallpaper: 'assets/backgrounds/Furina.avif',
  },
  {
    name: 'Kamisato Ayaka',
    preview: 'assets/backgrounds/Kamisato Ayaka - preview.avif',
    wallpaper: 'assets/backgrounds/Kamisato Ayaka.avif',
  },
  {
    name: 'Kirara',
    preview: 'assets/backgrounds/Kirara - preview.avif',
    wallpaper: 'assets/backgrounds/Kirara.avif',
  },
  {
    name: 'Raiden Shogun',
    preview: 'assets/backgrounds/Raiden Shogun - preview.avif',
    wallpaper: 'assets/backgrounds/Raiden Shogun.avif',
  },
  {
    name: 'Sayu',
    preview: 'assets/backgrounds/Sayu - preview.avif',
    wallpaper: 'assets/backgrounds/Sayu.avif',
  },
  {
    name: 'Xiangling',
    preview: 'assets/backgrounds/Xiangling - preview.avif',
    wallpaper: 'assets/backgrounds/Xiangling.avif',
  },
  {
    name: 'Yae Miko',
    preview: 'assets/backgrounds/Yae Miko - preview.avif',
    wallpaper: 'assets/backgrounds/Yae Miko.avif',
  },
  {
    name: 'Zhongli',
    preview: 'assets/backgrounds/Zhongli - preview.avif',
    wallpaper: 'assets/backgrounds/Zhongli.avif',
  },
];

/**
 * The name of the wallpaper a browser keeps (the picture's address, as the
 * wallpapers' window stores it): the first one's while it keeps none - what
 * the page shows then - and, for an address no longer on offer, its file's
 * name, which is what the page still shows.
 */
export function wallpaperName(saved: string | null): string {
  if (!saved) {
    return WALLPAPERS[0].name;
  }
  return WALLPAPERS.find((item) => item.wallpaper === saved)?.name ?? (saved.split('/').pop() ?? saved).replace(/\.[^.]+$/, '');
}
