<script lang="ts">
	import { Home, User } from '@lucide/svelte';
	import Podium from '../icons/Podium.svelte';
	import { type ActiveTab } from './dock';
	import { goto } from '$app/navigation';

	let { active = 'Feed' } = $props<{ active: ActiveTab }>();

	function dockClickHandler(target: string) {
		return () => {
			goto(target);
		};
	}
</script>

<div
	class="dock fixed top-9/10 left-1/2 w-fit -translate-x-1/2 rounded-2xl border-1 border-gray-200 drop-shadow-md"
>
	<button
		class="mt-5 mr-7 mb-5 ml-7"
		class:dock-active={active == 'Feed'}
		onclick={dockClickHandler('/app/feed')}
	>
		<Home />
		<span class="dock-label" class:dock-active={active == 'Feed'}>Feed</span>
	</button>

	<button
		class="mt-5 mr-7 mb-5 ml-7"
		class:dock-active={active == 'Leaderboard'}
		onclick={dockClickHandler('/app/leaderboard')}
	>
		<Podium />
		<span class="dock-label">Leaderboard</span>
	</button>

	<button
		class="mt-5 mr-7 mb-5 ml-7"
		class:dock-active={active == 'Profile'}
		onclick={dockClickHandler('/app/profile')}
	>
		<User />
		<span class="dock-label" class:dock-active={active == 'Profile'}>Profile</span>
	</button>
</div>
