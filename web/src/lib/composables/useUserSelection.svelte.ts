interface UserSelectionUser {
	id: string;
	name: string;
	username: string;
	displayUsername: string;
}

export function useUserSelection() {
	const selectedUsers = $state<Record<string, UserSelectionUser | null>>({});

	function handleUserSelect(runId: string, user: UserSelectionUser) {
		selectedUsers[runId] = user;
	}

	function getSelectedUser(runId: string): UserSelectionUser | null {
		return selectedUsers[runId] || null;
	}

	function clearSelection(runId: string): void {
		delete selectedUsers[runId];
	}

	function clearAllSelections(): void {
		Object.keys(selectedUsers).forEach((key) => delete selectedUsers[key]);
	}

	return {
		get selectedUsers() {
			return selectedUsers;
		},
		handleUserSelect,
		getSelectedUser,
		clearSelection,
		clearAllSelections
	};
}
