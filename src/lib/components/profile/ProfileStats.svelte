<script lang="ts">
	import { TrendingUp } from 'lucide-svelte';

	interface Props {
		stats: {
			personalBest: number;
			totalLiters: number;
			totalRuns: number;
			averageRate: number;
		};
	}

	let { stats }: Props = $props();

	const formatNumber = (num: number) => {
		return num > 0 ? num.toFixed(2) : '--';
	};
</script>

<div class="card bg-base-100 shadow-lg md:col-span-2">
	<div class="card-body">
		<h2 class="card-title">
			<TrendingUp size={20} />
			Statistics
		</h2>
		<div class="stats stats-vertical sm:stats-horizontal bg-base-200 w-full">
			<div class="stat">
				<div class="stat-title">Personal Best</div>
				<div class="stat-value text-primary">{formatNumber(stats.personalBest)}</div>
				<div class="stat-desc">{stats.personalBest > 0 ? 'L/min' : 'No runs yet'}</div>
			</div>
			<div class="stat">
				<div class="stat-title">Total Liters</div>
				<div class="stat-value text-secondary">{formatNumber(stats.totalLiters)}</div>
				<div class="stat-desc">{stats.totalRuns} total runs</div>
			</div>
			<div class="stat">
				<div class="stat-title">Average Rate</div>
				<div class="stat-value text-accent">{formatNumber(stats.averageRate)}</div>
				<div class="stat-desc">{stats.averageRate > 0 ? 'L/min' : 'No data'}</div>
			</div>
		</div>
	</div>
</div>
