document.addEventListener('DOMContentLoaded', () => {
    // Create particles
    const particlesContainer = document.getElementById('particles');
    const particleCount = 20;

    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.classList.add('particle');

        // Random position
        const posX = Math.random() * 300;
        const posY = Math.random() * 300;

        // Random delay
        const delay = Math.random() * 3;

        // Random x-distance for movement
        const xDistance = (Math.random() - 0.5) * 100;

        particle.style.left = posX + 'px';
        particle.style.top = posY + 'px';
        particle.style.animationDelay = delay + 's';
        particle.style.setProperty('--x-distance', xDistance + 'px');

        particlesContainer.appendChild(particle);
    }
});