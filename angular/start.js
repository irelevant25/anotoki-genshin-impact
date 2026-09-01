import { execSync } from 'child_process';
import packageJson from './package.json' with { type: 'json' };

// Read the current Node.js version from nvm
function getCurrentNodeVersion () {
    try {
        const currentVersion = execSync('node -v', { encoding: 'utf-8' }).trim();
        return currentVersion;
    } catch (error) {
        console.error('Error fetching current Node.js version:', error);
        process.exit(1);
    }
}

// Read the required Node.js version from package.json
function getRequiredNodeVersion () {
    try {
        return packageJson.engines.node;
    } catch (error) {
        console.error('Error reading package.json:', error);
        process.exit(1);
    }
}

// Switch Node.js version using nvm
function switchNodeVersion (version) {
    try {
        execSync(`nvm use ${version}`, { stdio: 'inherit' });
    } catch (error) {
        console.error(`Error switching to Node.js version ${version}:`, error);
        process.exit(1);
    }
}

/**
 * Rebuilds src/app/api from the backend before the dev server comes up.
 *
 * The client is generated from the API's own route table, so a route added in
 * PHP is callable from TypeScript without anyone remembering to run anything.
 * Nothing here touches a database - the spec is read from index.php's route
 * collector and from the schema files as text.
 *
 * Deliberately not fatal. The generated client is committed, so a checkout with
 * no PHP on PATH still starts; it just serves what is already there. Failing
 * here would mean a broken PHP install stops the front end from running at all,
 * which is the wrong trade for a convenience.
 */
function regenerateApiClient () {
    const steps = [
        ['reading the API', 'php ../php/generate-api-spec.php'],
        ['writing the client', 'node generate-api.mjs'],
    ];

    for (const [label, command] of steps) {
        try {
            execSync(command, { stdio: 'inherit' });
        } catch (error) {
            console.warn(`\nSkipped ${label}: ${error.message.split('\n')[0]}`);
            console.warn('Starting with the committed API client instead. Run `npm run api` once this is fixed.\n');
            return;
        }
    }
}

const currentVersion = getCurrentNodeVersion();
const requiredVersion = getRequiredNodeVersion();

console.log('currentVersion: ', currentVersion);
console.log('requiredVersion: ', requiredVersion);

// Compare versions and switch if necessary
if (currentVersion === `v${requiredVersion}` || currentVersion === `${requiredVersion}`) {
    console.log(`Node.js version is already set to ${currentVersion}`);
} else {
    console.log(`Switching to Node.js version ${requiredVersion}`);
    switchNodeVersion(requiredVersion);
}

regenerateApiClient();
