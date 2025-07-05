<script lang="ts">
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<div class="flex flex-col justify-center gap-3">
	<h1 class="text-center text-4xl font-bold">{data.user.displayUsername}</h1>
	<a class="btn btn-accent" href="/auth/update-username">Update Username</a>
	<a class="btn btn-warning" href="/auth/signout">Sign Out</a>
</div>
