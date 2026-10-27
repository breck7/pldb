# Consolidation review and handover

This branch merges the organization repository into the original repository; it does not transfer ownership or change either live server.

## Compared histories

- Original: `breck7/pldb`, `9108e8f682454c815c1a57159dfd59034e5e55bd`.
- Organization: `Programming-Language-DataBase/pldb`, `22cf13b127a581c6d0a25c59f93301a39c99cf7e`.
- Before merging: 33 commits unique to the original and 131 unique to the organization. Equivalent cherry-picked changes exist in both histories, so these are not counts of distinct features.

## Resolution decisions

- Preserve both Git histories with a merge commit; do not squash this consolidation.
- Retain all source concept records and creator additions from both parents.
- Keep upstream's pinned Scroll 180.0.1 / SDK 108.0.0 dependencies and its `scroll` package import. Adapt the organization's ordered build and Windows compatibility patches to that package location. Both dependencies require Node 24, so CI and documented prerequisites use Node 24.
- Keep the organization's bootstrap fallback, feature generation, rankings, ANTLR references, news collection, and production deployment/rollback scripts.
- Preserve upstream's GitHub-based contribution links rather than the unavailable ScrollHub edit endpoint; point them at the canonical organization repository. Use HTTPS canonical URLs in all shared page settings.
- Keep the human-facing Markdown README alongside the upstream introduction in `readme.scroll`.
- Retain the Pages workflow only for `breck7/pldb` before transfer. It stops publishing automatically once the repository belongs to the organization. Domain/DNS changes remain a separate maintainer task.
- Do not replace historical commit or attribution links merely because they refer to the original owner.

## Workflow behavior

| Context | Build/tests | PR artifact | Release | DigitalOcean deploy | Pages deploy | DBLP commits |
|---|---|---|---|---|---|---|
| Pull request to either repository | Yes | Yes | No | No | No | No |
| Original `breck7/pldb` main | Yes | No | No | No | Yes on push/manual Pages run | No |
| Organization main after transfer | Yes | No | Yes | Only with `PLDB_DEPLOY_ENABLED=true` | No | On scheduled/manual DBLP run |
| Other fork main | Yes | No | No | No | No | No |

Manual build dispatch is available. Release/deploy steps also require `refs/heads/main`, so a manual run on another branch cannot publish production.

## Validation commands

Use Node 24 or later and Python 3 with Bash available:

```bash
npm install
npm run build
node code/test_consolidation.js
python3 code/test_deploy_release.py
npm test
```

The consolidation check compares every source concept ID with the generated JSON and HTML files and checks representative records from both repositories, search, exports, canonical URLs, and contribution links. Deployment tests mock external services and check staging and rollback; they do not deploy to the live server.

## Maintainer handover checklist

1. Review this PR, the combined build artifact, and any validation limitations. Do not squash the merge history.
2. Agree on the archival organization, the role/redirect of `pldb.io`, and a coordinated transfer window with Breck.
3. Freeze merges briefly, fetch any intervening work, and merge only after review.
4. Pause existing production schedules (including server cron) and save the currently deployed artifact for rollback.
5. Move the existing organization fork to the archival organization. Disable its workflows and remove its production credentials; retain its issues and PR history.
6. Breck transfers the original repository into the now-vacant organization. Ken currently has WRITE access on the original, not ADMIN.
7. Verify teams, protections, Actions permissions, and Pages/domain configuration. Configure the three production SSH secrets on the transferred repository.
8. Set the repository Actions variable `PLDB_DEPLOY_ENABLED` to `true` only when ready to deploy from the transferred repository. Set it to `false` or remove it to disable automatic SSH deployment.
9. Run Build and Release manually on main. Verify the deployed commit, local port 3000 health, HTTPS, and reconciled records before resuming schedules.
10. Update migration notices and important archive links. The two repositories' issue/PR numbers cannot be combined automatically.

Secrets belong in GitHub Actions, and TLS private keys remain on the server. They do not belong in the repository. Existing HTTPS systemd/Nginx configuration is outside the deployed site directory and must remain intact.
