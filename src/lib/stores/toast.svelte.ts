import { logger } from 'better-auth';

export type ToastType = 'success' | 'error' | 'info' | 'warning' | 'loading';

export interface Toast {
	id: string;
	type: ToastType;
	message: string;
	duration?: number;
	dismissible?: boolean;
}

interface ToastStore {
	toasts: Toast[];
	add: (toast: Omit<Toast, 'id'>) => string;
	remove: (id: string) => void;
	clear: () => void;
	hasDuplicateMessage: (message: string, type: ToastType) => boolean;
}

let toastCounter = 0;

function createToastStore(): ToastStore {
	let toasts = $state<Toast[]>([]);

	function generateId(): string {
		return `toast-${++toastCounter}-${Date.now()}`;
	}

	function add(toast: Omit<Toast, 'id'>): string {
		// Check for duplicate messages of the same type within recent timeframe
		const duplicateExists = toasts.some(
			(existingToast) =>
				existingToast.message === toast.message && existingToast.type === toast.type
		);

		// If duplicate exists, don't add a new toast
		if (duplicateExists) {
			// Return the ID of the existing toast
			const existingToast = toasts.find(
				(t) => t.message === toast.message && t.type === toast.type
			);
			return existingToast?.id || '';
		}

		const id = generateId();
		const newToast: Toast = {
			id,
			dismissible: true,
			duration: toast.type === 'loading' ? 0 : 5000, // Loading toasts don't auto-dismiss
			...toast
		};

		// Create new array instead of mutating
		toasts = [...toasts, newToast];

		// Auto-dismiss after duration (if duration > 0)
		if (newToast.duration && newToast.duration > 0) {
			setTimeout(() => {
				remove(id);
			}, newToast.duration);
		}

		return id;
	}

	function remove(id: string): void {
		toasts = toasts.filter((toast) => toast.id !== id);
	}

	function hasDuplicateMessage(message: string, type: ToastType): boolean {
		return toasts.some((toast) => toast.message === message && toast.type === type);
	}

	function clear(): void {
		toasts = [];
	}

	return {
		get toasts() {
			return toasts;
		},
		add,
		remove,
		clear,
		hasDuplicateMessage
	};
}

export const toastStore = createToastStore();

// Convenience functions for different toast types
export const toast = {
	success: (message: string, options?: Partial<Omit<Toast, 'id' | 'type' | 'message'>>) =>
		toastStore.add({ type: 'success', message, ...options }),

	error: (message: string, options?: Partial<Omit<Toast, 'id' | 'type' | 'message'>>) =>
		toastStore.add({ type: 'error', message, ...options }),

	info: (message: string, options?: Partial<Omit<Toast, 'id' | 'type' | 'message'>>) =>
		toastStore.add({ type: 'info', message, ...options }),

	warning: (message: string, options?: Partial<Omit<Toast, 'id' | 'type' | 'message'>>) =>
		toastStore.add({ type: 'warning', message, ...options }),

	loading: (message: string, options?: Partial<Omit<Toast, 'id' | 'type' | 'message'>>) =>
		toastStore.add({ type: 'loading', message, ...options }),

	dismiss: (id: string) => toastStore.remove(id),

	clear: () => toastStore.clear()
};
