// Header-level noindex for pages that must stay out of search. Mount only on
// the paths that need it (currently /eating-window); R.U.C.K. stays indexable.
export function noindexHeader(req, res, next) {
  res.set('X-Robots-Tag', 'noindex, nofollow');
  next();
}
