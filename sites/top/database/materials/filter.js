const SITES_TOP_DATABASE_MATERIALS_FILTER_COMPONENT = {
    VUE_COMPONENT: {
        template: html` <!-- TODO --> `,

        data() {
            return {};
        },
    },

    onShow() {
        document.querySelector(`#${DATABASE.materials.id}-filter`).classList.remove('d-none');
    },

    onHide() {
        document.querySelector(`#${DATABASE.materials.id}-filter`).classList.add('d-none');
    },
};

document.addEventListener('DOMContentLoaded', () => {
    const database = Vue.createApp({
        components: {
            'base-component': createComponent(SITES_TOP_DATABASE_MATERIALS_FILTER_COMPONENT.VUE_COMPONENT, {}),
        },
        template: html` <base-component></base-component> `,
    });
    database.mount(`#${DATABASE.materials.id}-filter`);
});
