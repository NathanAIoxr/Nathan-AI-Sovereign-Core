import { drain } from "./queue.mjs";

const event = { schema:1, purpose:"drain-sovereign-ledger" };

// The message carries no user data. D1 owns job state, lease tokens and budgets.
export function wake(env,delaySeconds) {
  return env.DISPATCH_QUEUE.send(event,{delaySeconds});
}

export async function consume(env) {
  // Worker plan D1 limits allow bounded slices per invocation.
  const processed = await drain(env,4);
  if (processed>0) await wake(env,10);
  return processed;
}
