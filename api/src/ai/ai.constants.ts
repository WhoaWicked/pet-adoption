// Injection token for the AiClient, same style as PG_POOL. Code depends on the
// AiClient interface, so tests can swap in a fake with overrideProvider(AI_CLIENT).
export const AI_CLIENT = 'AI_CLIENT';

// Ceilings for a summary returned by the model. parseSummary rejects anything
// larger, so a runaway or manipulated response cannot flood the owner's screen.
export const MAX_OVERVIEW_LENGTH = 600;
export const MAX_LIST_ITEMS = 5;
export const MAX_ITEM_LENGTH = 200;
