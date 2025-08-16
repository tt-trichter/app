<script lang="ts">
	interface FormFieldProps {
		label: string;
		name: string;
		type?: string;
		placeholder?: string;
		required?: boolean;
		disabled?: boolean;
		value?: string;
		checked?: boolean;
		options?: Array<{ value: string; label: string }>;
		helpText?: string;
		errorText?: string;
		class?: string;
		id?: string;
		children?: import('svelte').Snippet;
	}

	let {
		label,
		name,
		type = 'text',
		placeholder = '',
		required = false,
		disabled = false,
		value = $bindable(''),
		checked = $bindable(false),
		options = [],
		helpText = '',
		errorText = '',
		class: customClass = '',
		id,
		children
	}: FormFieldProps = $props();

	let fieldId = id || `field-${name}`;
	let helpTextId = helpText ? `${fieldId}-help` : undefined;
	let errorTextId = errorText ? `${fieldId}-error` : undefined;

	// Build aria-describedby attribute
	let ariaDescribedBy = $derived(() => {
		if (helpText && errorText) {
			return `${helpTextId} ${errorTextId}`;
		} else if (helpText) {
			return helpTextId;
		} else if (errorText) {
			return errorTextId;
		}
		return '';
	});
</script>

<div class="form-control {customClass}">
	<label class="label" for={fieldId}>
		<span class="label-text">{label}</span>
		{#if required}
			<span class="label-text text-error" aria-label="required">*</span>
		{/if}
	</label>

	{#if children}
		{@render children()}
	{:else if type === 'select' && options.length > 0}
		<select
			id={fieldId}
			{name}
			bind:value
			class="select select-bordered {errorText ? 'select-error' : ''}"
			{required}
			{disabled}
			aria-describedby={ariaDescribedBy() || undefined}
			aria-invalid={errorText ? 'true' : 'false'}
		>
			{#each options as option (option.value)}
				<option value={option.value}>{option.label}</option>
			{/each}
		</select>
	{:else if type === 'textarea'}
		<textarea
			id={fieldId}
			{name}
			bind:value
			{placeholder}
			class="textarea textarea-bordered {errorText ? 'textarea-error' : ''}"
			{required}
			{disabled}
			aria-describedby={ariaDescribedBy() || undefined}
			aria-invalid={errorText ? 'true' : 'false'}
		></textarea>
	{:else if type === 'checkbox'}
		<input
			id={fieldId}
			{name}
			type="checkbox"
			bind:checked
			class="checkbox {errorText ? 'checkbox-error' : ''}"
			{required}
			{disabled}
			aria-describedby={ariaDescribedBy() || undefined}
			aria-invalid={errorText ? 'true' : 'false'}
		/>
	{:else}
		<input
			id={fieldId}
			{name}
			{type}
			bind:value
			{placeholder}
			class="input input-bordered {errorText ? 'input-error' : ''}"
			{required}
			{disabled}
			aria-describedby={ariaDescribedBy() || undefined}
			aria-invalid={errorText ? 'true' : 'false'}
		/>
	{/if}

	{#if helpText}
		<div class="label">
			<span id={helpTextId} class="label-text-alt text-base-content/70">{helpText}</span>
		</div>
	{/if}

	{#if errorText}
		<div class="label">
			<span id={errorTextId} class="label-text-alt text-error" role="alert">{errorText}</span>
		</div>
	{/if}
</div>
