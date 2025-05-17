const SITES_TOP_DATABASE_WISHES_COMPONENT = {
    VUE_COMPONENT: {
        template: html` <!-- TODO --> `,

        data() {
            return {};
        },
    },

    onShow() {
        document.querySelector(`#${DATABASE.wishes.id}`).classList.remove('d-none');
    },

    onHide() {
        document.querySelector(`#${DATABASE.wishes.id}`).classList.add('d-none');
    },
};

document.addEventListener('DOMContentLoaded', () => {
    const database = Vue.createApp({
        components: {
            'base-component': createComponent(SITES_TOP_DATABASE_WISHES_COMPONENT.VUE_COMPONENT, {}),
        },
        template: html` <base-component></base-component> `,
    });
    database.mount(`#${MENU_ITEMS_TOP.database.id} #${DATABASE.wishes.id}`);
});
