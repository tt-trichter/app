<script lang="ts">
	import { logger } from '$lib/logger';

	interface User {
		id: string;
		name: string;
		username: string;
		displayUsername: string;
	}

	interface AutocompleteProps {
		placeholder?: string;
		onSelect: (user: User) => void;
		required?: boolean;
		name?: string;
	}

	let {
		placeholder = 'Search users...',
		onSelect,
		required = false,
		name = 'user-search'
	}: AutocompleteProps = $props();

	let inputValue = $state('');
	let suggestions: User[] = $state([]);
	let showSuggestions = $state(false);
	let selectedIndex = $state(-1);
	let loading = $state(false);
	let inputElement: HTMLInputElement;
	let suggestionsElement = $state<HTMLElement>();

	let debounceTimer: ReturnType<typeof setTimeout>;

	function debounce(func: (query: string) => Promise<void>, delay: number) {
		return (query: string) => {
			clearTimeout(debounceTimer);
			debounceTimer = setTimeout(() => func(query), delay);
		};
	}

	const debouncedSearch = debounce(async (query: string) => {
		if (query.length < 2) {
			suggestions = [];
			showSuggestions = false;
			return;
		}

		loading = true;
		try {
			const response = await fetch(
				`/api/v1/users/search?name=${encodeURIComponent(query)}&limit=5`
			);
			if (response.ok) {
				const data: User[] = await response.json();
				suggestions = data;
				logger.info('Fetched users:', suggestions);
				showSuggestions = suggestions.length > 0;
				selectedIndex = -1;
			} else {
				logger.warn('Failed to fetch users:', response.status);
				suggestions = [];
				showSuggestions = false;
			}
		} catch (error) {
			logger.error('Error fetching users:', error);
			suggestions = [];
			showSuggestions = false;
		}
		loading = false;
	}, 300);

	function handleInput(): void {
		debouncedSearch(inputValue);
	}

	function handleKeydown(event: KeyboardEvent): void {
		if (!showSuggestions) return;

		switch (event.key) {
			case 'ArrowDown':
				event.preventDefault();
				selectedIndex = Math.min(selectedIndex + 1, suggestions.length - 1);
				scrollToSelected();
				break;
			case 'ArrowUp':
				event.preventDefault();
				selectedIndex = Math.max(selectedIndex - 1, -1);
				scrollToSelected();
				break;
			case 'Enter':
				event.preventDefault();
				if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
					selectUser(suggestions[selectedIndex]);
				}
				break;
			case 'Escape':
				showSuggestions = false;
				selectedIndex = -1;
				inputElement.blur();
				break;
		}
	}

	function selectUser(user: User): void {
		inputValue = user.displayUsername;
		showSuggestions = false;
		selectedIndex = -1;
		onSelect(user);
	}

	function scrollToSelected(): void {
		if (selectedIndex >= 0 && suggestionsElement) {
			const selectedElement = suggestionsElement.children[selectedIndex] as HTMLElement;
			if (selectedElement) {
				selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
			}
		}
	}

	function handleBlur(): void {
		// Delay hiding suggestions to allow for click events
		setTimeout(() => {
			showSuggestions = false;
			selectedIndex = -1;
		}, 200);
	}

	function handleFocus(): void {
		if (inputValue.length >= 2 && suggestions.length > 0) {
			showSuggestions = true;
		}
	}
</script>

<div class="relative">
	<div class="input input-ghost p-0.5 focus:border-0">
		<input
			bind:this={inputElement}
			bind:value={inputValue}
			type="text"
			{placeholder}
			{name}
			{required}
			autocomplete="off"
			class="w-full bg-transparent outline-none"
			oninput={handleInput}
			onkeydown={handleKeydown}
			onblur={handleBlur}
			onfocus={handleFocus}
		/>
	</div>

	{#if showSuggestions || loading}
		<div
			bind:this={suggestionsElement}
			class="border-base-300 bg-base-100 absolute top-full right-0 left-0 z-[9999] mt-1 max-h-48 overflow-y-auto rounded-lg border shadow-lg"
		>
			{#if loading}
				<div class="flex items-center justify-center p-4">
					<span class="loading loading-spinner loading-sm"></span>
					<span class="ml-2 text-sm">Searching...</span>
				</div>
			{:else if suggestions.length > 0}
				{#each suggestions as user, index (user.id)}
					<button
						type="button"
						class="border-base-200 hover:bg-base-200 w-full cursor-pointer border-b px-4 py-2 text-left last:border-b-0 {index ===
						selectedIndex
							? 'bg-base-200'
							: ''}"
						onclick={() => selectUser(user)}
					>
						<div class="flex flex-col">
							<span class="font-medium">{user.displayUsername}</span>
							{#if user.name !== user.displayUsername}
								<span class="text-base-content/70 text-sm">{user.name}</span>
							{/if}
						</div>
					</button>
				{/each}
			{:else}
				<div class="text-base-content/60 p-4 text-center text-sm">No users found</div>
			{/if}
		</div>
	{/if}
</div>
