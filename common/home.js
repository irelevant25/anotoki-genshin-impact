const HOME_COMPONENT = {
    VUE_COMPONENT: {
        template: html``,

        data() {
            return {};
        },
    },

    onShow() {
        // ...
    },

    onHide() {
        // ...
    },
};

document.addEventListener('DOMContentLoaded', () => {
    const quiz = Vue.createApp({
        components: {
            'base-component': createComponent(HOME_COMPONENT.VUE_COMPONENT, {}),
        },
        template: html` <base-component></base-component> `,
    });
    quiz.mount('#home');
});
