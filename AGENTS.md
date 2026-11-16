<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

- Offers data flows through one react-query key ["offers"] plus a single realtime subscription in AppShell; every page derives metrics from it so all views refresh together.
- No auth by design: the offers table and offer-pdfs private bucket allow anon access; PDFs are opened via short-lived signed URLs.

- Normalize legacy statuses and battery identifiers at the shared offers read boundary; old clients and stored model lines remain compatible without destructive rewrites.
- Keep dashboard selection separate from historical aggregation: filter offer dates by the selected current ISO week, month or year before latest-created exact-name project selection; default to year. Unnamed legacy records use their own IDs to avoid accidental collapsing, and historical analytics includes every offer.
- Compute country/customer distributions and country/region counts in pure shared helpers using exact stored strings and explicit missing-value groups; this keeps charts consistent without geographic normalization or new dependencies.
