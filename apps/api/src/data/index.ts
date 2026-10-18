import payload from './clients.json' with { type: 'json' };

// Typed as unknown on purpose: the server validates it against the contract
// at startup, and the API serves it without reshaping it.
export const clients: unknown = payload;
