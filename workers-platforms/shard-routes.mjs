export const shardCount = 989;
export const shardTag = "tabor-language-catalog-v54";

export const shardId = (index) => "language-shard-" + String(index).padStart(4, "0");

export function isShardId(id) {
  const match = /^language-shard-(\d{4})$/.exec(id);
  return match !== null && Number(match[1]) >= 1 && Number(match[1]) <= shardCount;
}
