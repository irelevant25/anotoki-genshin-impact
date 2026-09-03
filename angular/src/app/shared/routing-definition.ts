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
  },

  // The way in while the usual way in is shut. Not in the menu and not linked
  // from anywhere: while maintenance mode or the sign-in switch is on, the
  // ordinary sign-in button is off the page, and this is where it still is.
  // Nothing is granted by knowing the path - the API refuses everybody but an
  // admin - so it is a place to put the button rather than a secret.
  staff: {
    title: 'Staff sign-in',
    path: 'staff',
    notInMenu: true,
  }
};

export const ROUTE_MAP = new AlfRoutingMap(ROUTE_MAP_DATA);

/**
 * The staff path on its own, for the two things that compare against a URL
 * rather than navigate to it.
 */
export const STAFF_PATH: string = ROUTE_MAP_DATA['staff'].path;

/**
 * The sections of the site an admin can switch off.
 *
 * The top-level entries that appear in the menu, which is exactly the set that
 * makes sense to remove: switching off `confirm-email` would break the links
 * already sitting in people's inboxes, and switching off a single quiz is a
 * question for the quiz table rather than for this.
 *
 * Kept here rather than in the admin form so that the list an admin is offered
 * and the list the router honours are the same list.
 */
export const SWITCHABLE_SECTIONS: readonly string[] = Object.entries(ROUTE_MAP_DATA)
  .filter(([, node]) => node && typeof node === 'object' && 'path' in node && !(node as AlfRoutingNode).notInMenu)
  .map(([key]) => key);