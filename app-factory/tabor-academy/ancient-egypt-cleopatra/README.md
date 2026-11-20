# Tabor Academy · Ancient Egypt and Cleopatra VII

[Open the lesson](https://tabor-bridge.nathantaboract.workers.dev/tabor-academy/order/ancient-egypt-cleopatra/) · [Read the original text](https://tabor-bridge.nathantaboract.workers.dev/tabor-academy/order/ancient-egypt-cleopatra/source.txt)

The Academy keeps the submitted UTF-8 text in `source.txt` and serves it through the Library’s existing `academy_history_sources` archive under `ancient-egypt-cleopatra`. The source endpoint checks its SHA-256 before serving. The learning activity and references are in `lesson.html`.

The existing `tabor-academy` dispatch worker uses `addEgyptCleopatraLesson(workerSource, lessonHtml)` from `add-lesson.mjs` to install the lesson and links from The Law of Order and The Time of Peace. Publish through the existing Worker’s content-only operation, retaining the Library binding. Verify both the lesson and the verbatim source route after publishing.
