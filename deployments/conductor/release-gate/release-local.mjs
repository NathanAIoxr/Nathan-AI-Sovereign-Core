import { protectRelease } from './crosshair.mjs';
import { discard } from './policy.mjs';

const [output, intendedId] = process.argv.slice(2);
try {
  const result = output && intendedId
    ? await protectRelease(output, intendedId, process.stdin)
    : discard('expected_output_path_and_destination');
  console.log(JSON.stringify(result));
  if (result.bit !== 1) process.exitCode = 1;
} catch {
  console.log(JSON.stringify(discard('release_io_failed')));
  process.exitCode = 1;
}
