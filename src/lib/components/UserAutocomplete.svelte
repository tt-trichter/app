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
	let inputRect = $state<DOMRect | null>(null);

	let debounceTimer: ReturnType<typeof setTimeout>;

	// Update input position when suggestions are shown or loading
	function updateInputRect() {
		if (inputElement && (showSuggestions || loading)) {
			inputRect = inputElement.getBoundingClientRect();
		}
	}

	// Watch for changes that might affect positioning
	$effect(() => {
		if (showSuggestions || loading) {
			updateInputRect();
		}
	});

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
				suggestions = await response.json();
				logger.info('Fetched users:', suggestions);
				showSuggestions = suggestions.length > 0;
				selectedIndex = -1;
			}
		} catch (error) {
			console.error('Error fetching users:', error);
			suggestions = [];
			showSuggestions = false;
		}
		loading = false;
	}, 300);

	function handleInput() {
		debouncedSearch(inputValue);
	}

	function handleKeydown(event: KeyboardEvent) {
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

	function selectUser(user: User) {
		inputValue = user.displayUsername;
		showSuggestions = false;
		selectedIndex = -1;
		onSelect(user);
	}

	function scrollToSelected() {
		if (selectedIndex >= 0 && suggestionsElement) {
			const selectedElement = suggestionsElement.children[selectedIndex] as HTMLElement;
			if (selectedElement) {
				selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
			}
		}
	}

	function handleBlur() {
		// Delay hiding suggestions to allow for click events
		setTimeout(() => {
			showSuggestions = false;
			selectedIndex = -1;
		}, 200);
	}

	function handleFocus() {
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

	{#if (showSuggestions && inputRect) || (loading && inputRect)}
		<div
			bind:this={suggestionsElement}
			class="bg-base-100 border-base-300 fixed z-[9999] max-h-48 overflow-y-auto rounded-lg border shadow-lg"
			style="left: {inputRect?.left}px; top: {inputRect?.bottom +
				window.scrollY}px; width: {inputRect?.width}px;"
		>
			{#if loading}
				<div class="flex items-center justify-center p-4">
					<span class="loading loading-spinner loading-sm"></span>
					<span class="ml-2 text-sm">Searching...</span>
				</div>
			{:else}
				{#each suggestions as user, index (user.id)}
					<button
						type="button"
						class="hover:bg-base-200 border-base-200 w-full cursor-pointer border-b px-4 py-2 text-left last:border-b-0 {index ===
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
			{/if}
		</div>
	{/if}
</div>
