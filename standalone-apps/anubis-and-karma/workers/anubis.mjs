import { entry, release } from './shared.mjs';

export default entry('anubis', {
  ...release.entries[0],
  role: 'Anubis weighs the record of the deed.',
  detail: 'In the story, the scales hold an incident open until the evidence can be seen. That keeps an incomplete record from becoming a verdict.',
});
