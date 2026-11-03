# Blocks Logic config

## `tmdb-proxy.json` — the TMDB proxy (slug `tmdb`)

The site reads all film data through this proxy, which is Public so logged-out
visitors can browse.

**Temporary workaround, live config differs from this file.** This file
references the token as `{{$VAR.TMDB_READ_TOKEN}}` (the secret store), which is
the intended setup. In this project, Blocks refuses to resolve that secret for
the proxy and for functions (`VariableResolutionFailed` /
`NOT_IN_ACCESS_LIST`, checked 2026-11-03, also with the secret's access list
cleared). A Blocks function holding the token hit the same refusal and was
removed. The live proxy therefore carries the token typed into its
`Authorization` header, readable by project admins.

When Blocks fixes secret resolution, re-apply this file unchanged:

```bash
blocks logic proxy update <proxyId> --file blocks/logic/tmdb-proxy.json --dry-run --json
```

Never commit a version of this file with the real token in it.
