import { AlfRoutingMap, AlfRoutingNode } from './routing.map';

export const ROUTE_MAP_DATA: AlfRoutingNode = {
  title: 'root',
  path: '',

  // Every quiz can come up as a daily, so all eight have a path here. The two
  // that were here before were a stub, and one of them was spelled 'mismach'.
  daily: {
    title: 'Daily',
    path: 'daily',

    banners: {
      title: 'Banners',
      path: 'banners',
      notInMenu: true,
    },

    pixelate: {
      title: 'Pixelate',
      path: 'pixelate',
      notInMenu: true,
    },

    mismatch: {
      title: 'Mismatch',
      path: 'mismatch',
      notInMenu: true,
    },

    music: {
      title: 'Music',
      path: 'music',
      notInMenu: true,
    },

    dish: {
      title: 'Dish',
      path: 'dish',
      notInMenu: true,
    },

    voice: {
      title: 'Voice',
      path: 'voice',
      notInMenu: true,
    },

    splash: {
      title: 'Splash',
      path: 'splash',
      notInMenu: true,
    },

    constellation: {
      title: 'Constellation',
      path: 'constellation',
      notInMenu: true,
    },
  },

  quizzes: {
    title: 'Quizzes',
    path: 'quizzes',

    banners: {
      title: 'Banners',
      path: 'banners',
      notInMenu: true,
    },

    pixelate: {
      title: 'Pixelate',
      path: 'pixelate',
      notInMenu: true,
    },

    mismatch: {
      title: 'Mismatch',
      path: 'mismatch',
      notInMenu: true,
    },

    music: {
      title: 'Music',
      path: 'music',
      notInMenu: true,
    },

    dish: {
      title: 'Dish',
      path: 'dish',
      notInMenu: true,
    },

    voice: {
      title: 'Voice',
      path: 'voice',
      notInMenu: true,
    },

    splash: {
      title: 'Splash',
      path: 'splash',
      notInMenu: true,
    },

    constellation: {
      title: 'Constellation',
      path: 'constellation',
      notInMenu: true,
    },
  },

  games: {
    title: 'Games',
    path: 'games',

    tournament: {
      title: 'Tournament',
      path: 'tournament',
      notInMenu: true,
    },

    minesweeper: {
      title: 'Minesweeper',
      path: 'minesweeper',
      notInMenu: true,
    },

    recipes: {
      title: 'Recipe Master',
      path: 'recipes',
      notInMenu: true,
    },

    pexeso: {
      title: 'Pexeso',
      path: 'pexeso',
      notInMenu: true,
    },
  },

  database: {
    title: 'Database',
    path: 'database',

    characters: {
      title: 'Characters',
      path: 'characters',
      notInMenu: true,
    },

    materials: {
      title: 'Materials',
      path: 'materials',
      notInMenu: true,
    },

    weapons: {
      title: 'Weapons',
      path: 'weapons',
      notInMenu: true,
    },

    artifacts: {
      title: 'Artifacts',
      path: 'artifacts',
      notInMenu: true,
    },

    foods: {
      title: 'Food',
      path: 'foods',
      notInMenu: true,
    },

    banners: {
      title: 'Banners',
      path: 'banners',
      notInMenu: true,
    },
  },

  // The header has linked to this since the menu was written; until now there
  // was no route behind it.
  profile: {
    title: 'Profile',
    path: 'profile',
  },

  // Where the anotoki IAM sends the browser back after signing in. The path is
  // half of a contract: the IAM has `{origin}/auth/callback` registered as this
  // site's redirect URI, byte for byte, and will send nobody anywhere else - so
  // renaming it here means changing the client registration there too (and the
  // sign-in's `redirectPath`, shared/site-auth.ts: the library's default is this
  // one). Normally never drawn: the library's AnotokiAuth.init() finishes the
  // sign-in and puts the reader back where they were before the router looks.
  authCallback: {
    title: 'Signing in',
    path: 'auth/callback',
    notInMenu: true,
  },

  // The way in while the usual way in is shut. Not in the menu and not linked
  // from anywhere: while maintenance mode is on, the site - account button and
  // all - is replaced by the closed sign, and this is where a sign-in button
  // still is. Nothing is granted by knowing the path - the API refuses
  // everybody but an admin - so it is a place to put the button rather than a
  // secret.
  staff: {
    title: 'Staff sign-in',
    path: 'staff',
    notInMenu: true,
  },
};

export const ROUTE_MAP = new AlfRoutingMap(ROUTE_MAP_DATA);

/**
 * The staff path on its own, for what names it rather than navigating to it:
 * the closed sign's one door (shared/site-status.ts's staffRoute).
 */
export const STAFF_PATH: string = ROUTE_MAP_DATA['staff'].path;

/** The sign-in callback as an absolute path, for the pages that look for it (the redirect URI is the library's same default). */
export const AUTH_CALLBACK_PATH = `/${ROUTE_MAP_DATA['authCallback'].path}`;
