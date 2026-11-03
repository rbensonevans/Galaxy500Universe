# Backups

`.github/workflows/backup.yml` makes an encrypted backup every night at 07:17
UTC (and whenever you run it by hand):

1. **Database:** `pg_dump` of the `public` (app data), `auth` (accounts and
   sign-in identities), and `storage` (file records) schemas.
2. **Images:** a copy of the `post-images` and `message-images` buckets, once
   the storage secrets below are set.
3. **Restore test:** the dump is restored into a scratch Postgres 17 and the
   row counts (accounts, profiles, posts, messages, wallets, ledger, files)
   and total wallet balance must match the live database. If they don't, the
   run fails and GitHub emails you.
4. **Encryption:** everything is packed into
   `galaxy500universe-YYYY-MM-DD.tar.gz.gpg`, encrypted (AES-256) with
   `BACKUP_PASSPHRASE`, and kept as a workflow artifact for **90 days**.

The repository is public: anyone signed in to GitHub can download the
artifacts, so they are only ever stored encrypted. **Without the passphrase
the backups can't be opened — keep it in a password manager.**

## Repository secrets

GitHub → repository → **Settings → Secrets and variables → Actions → New
repository secret**:

| Secret | Value |
|---|---|
| `SUPABASE_DB_URL` | Supabase → **Connect** → **Session pooler** connection string, with the database password filled in |
| `BACKUP_PASSPHRASE` | A long random passphrase (also saved in your password manager) |
| `SUPABASE_S3_ACCESS_KEY_ID` | Optional, for images: Supabase → Storage → **S3 Configuration** → new access key |
| `SUPABASE_S3_SECRET_ACCESS_KEY` | Optional, the secret for that key |
| `SUPABASE_S3_REGION` | Optional, the region shown on the S3 Configuration page |

## Run a backup now

GitHub → **Actions** → **Database backup** → **Run workflow**. The finished
run lists the encrypted file under **Artifacts**.

## Open a backup

Download the artifact (a `.zip` containing the `.gpg` file), then:

```sh
brew install gnupg          # once
unzip galaxy500universe-YYYY-MM-DD.zip
gpg --decrypt galaxy500universe-YYYY-MM-DD.tar.gz.gpg | tar -xz
```

This gives `database.dump` (Postgres custom format), `counts.txt` (row counts
at backup time), and `images/` (if image backup is on).

## Restore into a new Supabase project

1. Create a new Supabase project and run `supabase/SETUP.sql` in its SQL
   Editor (tables, functions, policies, buckets, the grants job).
2. Empty the rows SETUP.sql seeds (system accounts, reserve wallet) so the
   backup's rows can take their place, then load the data:

   ```sh
   pg_restore --data-only --no-owner --no-privileges \
     --schema=auth --schema=public --schema=storage \
     --dbname "<new project's session pooler URL>" database.dump
   ```

3. Upload `images/post-images` and `images/message-images` to the matching
   buckets (Supabase S3 API: `aws s3 sync … --endpoint-url
   https://<ref>.supabase.co/storage/v1/s3`).
4. Point Vercel's `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   at the new project, redo Auth settings (URL configuration, providers,
   SMTP, email templates), and redeploy.

GitHub turns off scheduled workflows in a public repository after 60 days
with no commits; if that happens, re-enable it on the Actions page.
