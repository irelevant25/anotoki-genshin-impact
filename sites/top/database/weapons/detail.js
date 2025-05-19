const SITES_TOP_DATABASE_WEAPONS_DETAIL_COMPONENT = {
    VUE_COMPONENT: {
        template: html` <!-- TODO --> `,

        data() {
            return {};
        },
    },

    onShow() {
        document.querySelector(`#${DATABASE.weapons.id}-detail`).classList.remove('d-none');
    },

    onHide() {
        document.querySelector(`#${DATABASE.weapons.id}-detail`).classList.add('d-none');
    },
};

document.addEventListener('DOMContentLoaded', () => {
    const database = Vue.createApp({
        components: {
            'base-component': createComponent(SITES_TOP_DATABASE_WEAPONS_DETAIL_COMPONENT.VUE_COMPONENT, {}),
        },
        template: html` <base-component></base-component> `,
    });
    database.mount(`#${DATABASE.weapons.id}-detail`);
});
