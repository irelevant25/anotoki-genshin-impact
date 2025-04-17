// (() => {
//     'use strict';

//     let container;

//     function initializeMenu() {
//         // Generate menu items
//         Object.values(MENU_ITEMS_BOTTOM).forEach((menuItem) => {
//             container.innerHTML += `
//                 <div id="${menuItem.id}" class="item" data-bs-toggle="modal" data-bs-target="#${menuItem.id}-modal">
//                     ${menuItem.title}
//                 </div>
//             `;
//         });
//     }

//     document.addEventListener('DOMContentLoaded', () => {
//         container = document.querySelector('#bottom-menu');
//         initializeMenu();
//     });
// })();

const BOTTOM_MENU = Vue.createApp({
    template: `
        <div v-for="menuItem in menuItems" :id="menuItem.id" class="item" @click="redirect(menuItem)">
            <div v-if="!menuItem.icon" data-bs-toggle="modal" :data-bs-target="'#' + menuItem.id + '-modal'">{{ menuItem.title }}</div>
            <div v-else v-html="menuItem.icon"></div>
        </div>
    `,

    data() {
        return {
            menuItems: Object.values(MENU_ITEMS_BOTTOM),
        };
    },

    methods: {
        redirect(menuItem) {
            if (!menuItem.url) return;
            window.open(menuItem.url, '_blank');
        },
    },
});

document.addEventListener('DOMContentLoaded', () => {
    BOTTOM_MENU.mount('#bottom-menu');
});
