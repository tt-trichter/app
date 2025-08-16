import { browser } from '$app/environment';

interface PWAState {
	needsUpdate: boolean;
	isOffline: boolean;
	showUpdatePrompt: boolean;
}

const initialState: PWAState = {
	needsUpdate: false,
	isOffline: false,
	showUpdatePrompt: false
};

export const pwaState = $state<PWAState>(initialState);

class PWAManager {
	private registration: ServiceWorkerRegistration | null = null;

	constructor() {
		if (browser) {
			this.initialize();
		}
	}

	private async initialize() {
		// Listen for online/offline status
		window.addEventListener('online', () => {
			pwaState.isOffline = false;
		});

		window.addEventListener('offline', () => {
			pwaState.isOffline = true;
		});

		// Set initial offline status
		pwaState.isOffline = !navigator.onLine;

		// Check for service worker updates
		if ('serviceWorker' in navigator) {
			try {
				this.registration = await navigator.serviceWorker.ready;
				this.checkForUpdates();

				// Check for updates every 60 seconds
				setInterval(() => {
					this.checkForUpdates();
				}, 60000);
			} catch (error) {
				console.error('Service worker registration failed:', error);
			}
		}
	}

	showUpdatePrompt() {
		pwaState.showUpdatePrompt = true;
	}

	hideUpdatePrompt() {
		pwaState.showUpdatePrompt = false;
	}

	async updateApp(): Promise<void> {
		if (!this.registration || !this.registration.waiting) {
			return;
		}

		// Tell the waiting service worker to activate
		this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });

		// Reload the page to load the new version
		window.location.reload();
	}

	private async checkForUpdates() {
		if (!this.registration) {
			return;
		}

		try {
			await this.registration.update();

			if (this.registration.waiting) {
				pwaState.needsUpdate = true;
			}
		} catch (error) {
			console.error('Failed to check for updates:', error);
		}
	}
}

export const pwaManager = new PWAManager();
