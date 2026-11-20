# Nathan Tabor Holiday & Spirit Conductor queue

[Original collection notes](../../../../app-factory/make-a-snow-globe/public/holiday-universe.txt)

Each entry has its own project brief, Git branch named zone/<id>, and private Cloudflare Workers for Platforms namespace named <id>-holding. The existing Conductor Zone TIME workflow reconciles the managed staging resources and verifies their identities. The workflow prepares rehearsal environments, and each project brief specifies its next deliverable and acceptance check.

Read [build-queue.json](build-queue.json) for the queue. Continue from any existing source paths listed in a project's app.json. Make project changes in its own branch. Verify the result against that brief. Preserve the two existing Snow Globes production apps and document any new public launch when it occurs.
