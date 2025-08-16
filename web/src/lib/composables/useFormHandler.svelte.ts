import { toast } from '$lib/stores/toast.svelte.js';
import type { ActionResult } from '@sveltejs/kit';

// Define proper types for form results
interface FormActionData extends Record<string, unknown> {
	success?: boolean;
	error?: string;
	message?: string;
}

interface EnhanceCallbacks {
	cancel: () => void;
}

interface SubmitCallbacks {
	result: ActionResult<FormActionData>;
	update: () => void;
}

export function useFormHandler() {
	let lastFormResult = $state<FormActionData | null>(null);
	const pendingDeletions = $state(new Set<string>());

	// Handle form result changes
	function handleFormResult(rawForm: FormActionData | null) {
		const form = $state(rawForm);
		if (form && form !== lastFormResult) {
			lastFormResult = rawForm;

			if (form.success) {
				toast.success(form.message || 'Operation completed successfully');
			} else if (form.error) {
				toast.error(form.error);
			}
		}
	}

	// Create enhanced submit handler for forms
	function createEnhancedSubmit(actionName: string, runId?: string) {
		return ({ cancel }: EnhanceCallbacks) => {
			if (actionName === 'deleteRun' && runId) {
				if (pendingDeletions.has(runId)) {
					cancel();
					return;
				}
				pendingDeletions.add(runId);
			}

			return async ({ result, update }: SubmitCallbacks) => {
				if (actionName === 'deleteRun' && runId) {
					pendingDeletions.delete(runId);
				}

				if (result.type === 'success' && result.data) {
					lastFormResult = result.data;

					if (result.data.success) {
						toast.success(result.data.message || 'Operation completed successfully');
					} else if (result.data.error) {
						toast.error(result.data.error);
					}
				}

				await update();
			};
		};
	}

	return {
		get pendingDeletions() {
			return pendingDeletions;
		},
		handleFormResult,
		createEnhancedSubmit
	};
}
