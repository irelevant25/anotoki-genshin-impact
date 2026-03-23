const LoadingSpinner = {
    props: {
        isLoading: Boolean,
    },
    template: html`
        <div class="loading" :class="['d-flex align-items-center loader', {'d-none': !isLoading}]">
            <div class="loading-container">
                <div class="teleport-waypoint">
                    <div class="waypoint-outer"></div>
                    <div class="waypoint-inner"></div>
                    <div class="waypoint-star">
                        <div class="star-point"></div>
                        <div class="star-point"></div>
                        <div class="star-point"></div>
                        <div class="star-point"></div>
                        <div class="star-point"></div>
                    </div>
                </div>

                <div class="element-symbols">
                    <div class="element"></div>
                    <div class="element"></div>
                    <div class="element"></div>
                    <div class="element"></div>
                    <div class="element"></div>
                    <div class="element"></div>
                    <div class="element"></div>
                </div>

                <div class="particles" id="particles">
                    <div
                        v-for="particle in particles"
                        class="particle"
                        :style="{ left: particle.left + 'px', top: particle.top + 'px', animationDelay: particle.animationDelay + 's', '--x-distance': particle.xDistance + 'px' }"
                    ></div>
                </div>

                <div class="progress-bar">
                    <div class="progress-fill"></div>
                </div>

                <div class="loading-text">TEYVAT AWAITS</div>
            </div>
        </div>
    `,

    data() {
        return {
            particles: [],
        };
    },

    mounted() {
        // Create particles
        const particleCount = 20;

        for (let i = 0; i < particleCount; i++) {
            // Random position
            const posX = Math.random() * 300;
            const posY = Math.random() * 300;

            // Random delay
            const delay = Math.random() * 3;

            // Random x-distance for movement
            const xDistance = (Math.random() - 0.5) * 100;

            this.particles.push({ left: posX, top: posY, animationDelay: delay, xDistance });
        }
    },
};
