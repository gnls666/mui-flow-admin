# GitHub Push Network Workaround

## Problem

In this environment, normal HTTPS `git push` to GitHub can fail even when `gh api` works.

Observed failures:

```text
fatal: unable to access 'https://github.com/gnls666/mui-flow-admin.git/': Error in the HTTP2 framing layer
fatal: unable to access 'https://github.com/gnls666/mui-flow-admin.git/': Failed to connect to github.com port 443 after 75002 ms: Couldn't connect to server
```

Retrying with HTTP/1.1 can still fail:

```bash
git -c http.version=HTTP/1.1 push -u origin main
```

## Working Fallback

When `git push` fails but `gh api` works, publish the commit through GitHub's Git Data API:

1. Ensure the GitHub repo exists.
2. If the repo is completely empty, create a temporary bootstrap file through the Contents API so Git Data endpoints become usable.
3. Create one Git blob per local tracked file.
4. Create a Git tree from those blobs.
5. Create a Git commit from that tree.
6. Point `refs/heads/main` at the created commit.
7. Fetch `origin/main`.
8. If local and remote trees match, align the local branch to `origin/main`.

## Verification

After the API fallback:

```bash
git fetch origin main --depth=1
git rev-parse HEAD^{tree} origin/main^{tree}
git status -sb
```

The two tree SHAs must match. If commit SHAs differ but tree SHAs match, the source content is identical; GitHub may have normalized commit metadata during API commit creation.

## Notes

- Prefer normal `git push` first when the network allows it.
- Use the API fallback only for GitHub HTTPS transport failures.
- Do not skip tree verification.
- Keep `project.bundle.mjs` regenerated after documentation or source changes, because it is the single-file source archive.
