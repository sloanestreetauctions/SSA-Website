/**
 * Where the editing screen is allowed to run.
 *
 *  - On your own computer (npm run dev): always, saving straight into the project files.
 *  - On a live site: only once GitHub storage is configured, so every edit needs a
 *    GitHub sign-in and is saved as a version. Without it the editor is switched off,
 *    so a public site can never be edited by an anonymous visitor.
 */
export const editorUsesGitHub = Boolean(process.env.NEXT_PUBLIC_KEYSTATIC_GITHUB_REPO);
export const editorAvailable = process.env.NODE_ENV !== "production" || editorUsesGitHub;
