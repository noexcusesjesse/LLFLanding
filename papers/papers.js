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
    slug: 'losing-weight-vs-losing-fat',
    title: 'Losing Weight vs. Losing Fat',
    summary: 'Losing weight isn\'t the same as losing fat. This fact-checked paper by Jesse Collins explains why the scale can mislead you, how strength training, protein, and sleep help protect your muscle, and gives 9 popular claims a straight verdict, backed by 40 public sources. Plain English, a home-gear starter week, and a simple tracking checklist.',
    date: '2026-10-09',
    pdf: 'papers/losing-weight-vs-losing-fat.pdf',
    cover: 'papers/losing-weight-vs-losing-fat-cover.png'
  },
  {
    slug: 'added-sugar-fact-check',
    title: 'Added Sugar: The Fact-Check',
    summary: 'The average U.S. adult eats about 17 teaspoons of added sugar a day, and sugary drinks are the #1 source. Added Sugar: The Fact-Check explains what counts as added sugar, how to read the new label in 30 seconds, what the 2025–2030 Dietary Guidelines say, and gives 12 popular sugar claims a straight verdict, all backed by 41 public sources. Plain English, no hype, and practical swaps for real families.',
    date: '2026-10-06',
    pdf: 'papers/added-sugar-fact-check.pdf',
    cover: 'papers/added-sugar-fact-check-cover.png'
  }
];
