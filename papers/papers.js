/*
 * LoadLine Fitness — Papers list.
 * Used by papers.html (the card grid) and paper.html (the read-online viewer).
 *
 * HOW TO ADD A PAPER
 *   1. Drop the files in this folder (papers/):
 *        papers/<slug>.pdf          the paper
 *        papers/<slug>-cover.png    cover thumbnail (portrait, about 850 x 1100)
 *   2. Copy one block below, paste it at the TOP of the list (newest first),
 *      and fill in the fields. The slug must be lowercase letters, numbers,
 *      and dashes only. It becomes the read-online link: paper.html?p=<slug>
 *   3. Remove "comingSoon: true" (or set it to false) once the PDF is live.
 *
 *   {
 *     slug: 'my-new-paper',
 *     title: 'My New Paper: The Fact-Check',
 *     summary: 'Two or three plain-English sentences about what the paper covers.',
 *     date: '2026-11-01',                       // YYYY-MM-DD, shown as "November 2026"
 *     pdf: 'papers/my-new-paper.pdf',
 *     cover: 'papers/my-new-paper-cover.png',
 *     comingSoon: false
 *   },
 */
window.LOADLINE_PAPERS = [
  {
    // TODO: Placeholder card. The added sugar paper is still being written.
    // TODO: Confirm the final title (working title below) and the summary.
    // TODO: Drop in papers/added-sugar-fact-check.pdf and
    //       papers/added-sugar-fact-check-cover.png, set the real publish
    //       date, then remove "comingSoon: true".
    slug: 'added-sugar-fact-check',
    title: 'Added Sugar: The Fact-Check',
    summary: 'How much added sugar Americans really eat, where it hides, and what the research says it does to your body. Plain-English answers to the most common myths, backed by official guidelines and real studies, plus simple swaps you can start today.',
    date: '2026-10-06',
    pdf: 'papers/added-sugar-fact-check.pdf',
    cover: 'papers/added-sugar-fact-check-cover.png',
    comingSoon: true
  }
];
