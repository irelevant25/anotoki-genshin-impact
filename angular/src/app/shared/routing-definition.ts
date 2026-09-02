import { AlfRoutingMap, AlfRoutingNode } from "./routing.map";

export const ROUTE_MAP_DATA: AlfRoutingNode = {
  title: 'root',
  path: '',

  // Every quiz can come up as a daily, so all six have a path here. The two
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
    }
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

  // Where the two emailed links land. Not in the menu because nobody navigates
  // to them - they are arrived at from a mail client, with a token attached.
  // The paths are half of a contract: config/mail.php builds the links out of
  // its base_url and these, so renaming one here breaks every message already
  // sent.
  confirmEmail: {
    title: 'Confirm email',
    path: 'confirm-email',
    notInMenu: true,
  },

  resetPassword: {
    title: 'Reset password',
    path: 'reset-password',
    notInMenu: true,
  }
};

export const ROUTE_MAP = new AlfRoutingMap(ROUTE_MAP_DATA);