# Email templates

Branded Supabase Auth emails, sent from
`Galaxy500Universe <no-reply@galaxy500universe.com>` through Resend.

Supabase doesn't read these files; they are the source copies. To change an
email, edit the file here, then paste it into **Supabase → Authentication →
Emails → Templates**, on the matching tab. Set the subject to the one listed
below and save.

| Supabase tab | File | Subject |
|---|---|---|
| Confirm signup | `confirm-signup.html` | Confirm your Galaxy500Universe account |
| Invite user | `invite-user.html` | You're invited to Galaxy500Universe |
| Magic link | `magic-link.html` | Your Galaxy500Universe sign-in link |
| Change email address | `change-email.html` | Confirm your new Galaxy500Universe email |
| Reset password | `reset-password.html` | Reset your Galaxy500Universe password |
| Reauthentication | `reauthentication.html` | Your Galaxy500Universe verification code |

The `{{ .ConfirmationURL }}`, `{{ .Email }}`, `{{ .NewEmail }}`, and
`{{ .Token }}` placeholders are filled in by Supabase. The layout uses tables
and inline styles so it renders in Gmail, Outlook, and Apple Mail.

To copy a template on a Mac:

```sh
pbcopy < supabase/email-templates/confirm-signup.html
```
