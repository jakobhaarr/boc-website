/**
 * Steps a list of problems takes to present (ProblemBuild): one for the
 * overview, then three per problem (the problem alone, its solution, back to
 * the overview). A plain module so the server page can call it.
 */
export const problemBuildSteps = (count: number) => 1 + 3 * count;
