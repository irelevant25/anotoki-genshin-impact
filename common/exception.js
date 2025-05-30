const EXCEPTION_COMPONENT = {
    VUE_COMPONENT: {
        template: html`
            <div class="row">
                <div class="col-12">
                    <h1 class="my-5">{{ title }}</h1>
                </div>
            </div>
        `,

        data() {
            return {
                title: document.title || 'Error',
            };
        },

        watch: {
            title(newValue) {
                document.title = newValue;
            },
        },

        mounted() {
            // Set up a MutationObserver to watch for document.title changes
            this.titleObserver = new MutationObserver(() => {
                this.title = document.title;
            });

            this.titleObserver.observe(document.querySelector('title'), {
                childList: true,
                characterData: true,
                subtree: true,
            });
        },

        beforeDestroy() {
            // Clean up the observer when the component is destroyed
            if (this.titleObserver) {
                this.titleObserver.disconnect();
            }
        },
    },

    onShow() {
        document.querySelector('#exception').classList.remove('d-none');
    },

    onHide() {
        document.querySelector('#exception').classList.add('d-none');
    },
};

document.addEventListener('DOMContentLoaded', () => {
    const quiz = Vue.createApp({
        components: {
            'base-component': createComponent(EXCEPTION_COMPONENT.VUE_COMPONENT, {}),
        },
        template: html` <base-component></base-component> `,
    });
    quiz.mount('#exception');
});
