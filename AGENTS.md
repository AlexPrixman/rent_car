# Repository workflow

Before merging any pull request into the default branch, run the tests and production build appropriate to the change, review the complete diff, and verify CI passes for the exact current PR head. Resolve failures before merging. Do not skip browser, API, database, or container checks when the change affects those paths.
