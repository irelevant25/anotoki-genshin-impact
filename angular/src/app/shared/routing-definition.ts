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
  }
};

export const ROUTE_MAP = new AlfRoutingMap(ROUTE_MAP_DATA);