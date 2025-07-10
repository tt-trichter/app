# Event Handling & SSE Implementation

This document outlines the improved event handling and Server-Sent Events (SSE) implementation that follows Svelte 5 best practices.

## Architecture Overview

The system consists of several key components:

### 1. Enhanced Event System (`events.ts`)

- **Type-safe event emitter** with proper TypeScript support
- **Error handling** for event emission
- **Structured logging** for debugging
- **Memory leak prevention** with max listeners limit

### 2. SSE Connection Composable (`useSSEConnection.svelte.ts`)

- **Reusable composable** following Svelte 5 patterns
- **Automatic reconnection** with exponential backoff
- **Connection state management** with reactive state
- **Proper cleanup** with `onDestroy`
- **Error handling** and recovery

### 3. Enhanced Runs Store (`runs-v2.svelte.ts`)

- **Svelte 5 runes** for reactive state management
- **Clean separation** of concerns
- **Type-safe event handling**
- **Connection state integration**

### 4. Connection Status Component (`ConnectionStatus.svelte`)

- **Visual indicators** for connection state
- **Manual reconnection** capability
- **Accessible design** with proper ARIA labels

## Key Improvements

### ✅ **Svelte 5 Best Practices**

1. **Runes Usage**: Proper use of `$state` for reactive state
2. **Type Safety**: Full TypeScript support throughout
3. **Composables**: Reusable logic with `useSSEConnection`
4. **Lifecycle Management**: Proper cleanup with `onDestroy`
5. **Error Boundaries**: Comprehensive error handling

### ✅ **Enhanced Reliability**

1. **Automatic Reconnection**: Exponential backoff strategy
2. **Connection State Tracking**: Real-time connection status
3. **Error Recovery**: Graceful handling of network issues
4. **Memory Management**: Proper cleanup and listener limits

### ✅ **Developer Experience**

1. **Type Safety**: Compile-time error checking
2. **Debugging**: Structured logging throughout
3. **Modularity**: Clean separation of concerns
4. **Reusability**: Composable pattern for SSE connections

## Usage Examples

### Basic Store Usage

```typescript
import { runsStoreV2 } from '$lib/stores/runs-v2.svelte';

// Initialize with server data
await runsStoreV2.initializeOrLoad(initialRuns);

// Access reactive state
$: totalRuns = runsStoreV2.totalRuns;
$: isConnected = runsStoreV2.isConnected;
$: connectionState = runsStoreV2.connectionState;

// Manual reconnection
if (!runsStoreV2.isConnected) {
	runsStoreV2.reconnect();
}
```

### Custom SSE Connection

```typescript
import { useSSEConnection } from '$lib/composables/useSSEConnection.svelte';

const connection = useSSEConnection({
	url: '/api/v1/custom/sse',
	maxReconnectAttempts: 3,
	reconnectBaseDelay: 2000
});

// Add event handlers
connection.addEventHandler('custom-event', (data) => {
	console.log('Received:', data);
});

// Start connection
connection.connect();
```

### Connection Status Display

```svelte
<script>
	import ConnectionStatus from '$lib/components/ConnectionStatus.svelte';
</script>

<!-- Simple indicator -->
<ConnectionStatus />

<!-- With status text -->
<ConnectionStatus showText={true} />
```

## Migration Guide

### From Current Implementation

1. **Replace imports**:

   ```typescript
   // Old
   import { runsStore } from '$lib/stores/runs.svelte';

   // New
   import { runsStoreV2 } from '$lib/stores/runs-v2.svelte';
   ```

2. **Update event emitters**:

   ```typescript
   // Old
   import { resultEmitter } from '$lib/server/events-old';

   // New
   import { resultEmitter } from '$lib/server/events';
   ```

3. **Add connection status**:
   ```svelte
   <!-- Add to your layout -->
   <ConnectionStatus />
   ```

### Key Changes

- **Store API**: Mostly unchanged, but with better connection state
- **Event Typing**: More type-safe event handling
- **Error Handling**: Improved error recovery and logging
- **Performance**: Better memory management and cleanup

## Configuration

### Environment Variables

```bash
# SSE Configuration (optional)
SSE_MAX_RECONNECT_ATTEMPTS=5
SSE_RECONNECT_BASE_DELAY=1000
SSE_MAX_RECONNECT_DELAY=30000
```

### Event Configuration

```typescript
// Customize event emitter
resultEmitter.setMaxListeners(100); // Adjust as needed
```

## Monitoring & Debugging

### Connection State Monitoring

```typescript
// Track connection issues
$effect(() => {
	if (runsStoreV2.connectionState === 'error') {
		console.error('SSE connection failed');
		// Add analytics/monitoring here
	}
});
```

### Event Debugging

```typescript
// Enable debug logging
import { logger } from '$lib/logger';
logger.level = 'debug'; // Show all events
```

## Testing

### Unit Tests

```typescript
import { describe, it, expect } from 'vitest';
import { RunsStoreV2 } from '$lib/stores/runs-v2.svelte';

describe('RunsStoreV2', () => {
	it('should handle run updates correctly', () => {
		const store = new RunsStoreV2();
		// Test implementation
	});
});
```

### Integration Tests

```typescript
// Test SSE connection
import { useSSEConnection } from '$lib/composables/useSSEConnection.svelte';

// Mock SSE and test reconnection logic
```

## Performance Considerations

1. **Connection Pooling**: SSE connections are reused
2. **Event Debouncing**: Rapid events are handled efficiently
3. **Memory Management**: Proper cleanup prevents leaks
4. **Lazy Loading**: Connections established only when needed

## Security Considerations

1. **Authentication**: SSE endpoints use same auth as REST APIs
2. **Rate Limiting**: Built-in reconnection limits prevent DoS
3. **Data Validation**: All event payloads are type-checked
4. **Error Sanitization**: Sensitive data not exposed in errors
