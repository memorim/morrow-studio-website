# Notification delivery verification — 2026-11-09

GitHub Actions secrets `MORROW_DATABASE_URL` and `MORROW_NTFY_TOPIC` are configured.
Values are intentionally excluded from this document. The destination is the owner's
existing Nestly subscription; notifications retain the Morrow Studio title.

Run: https://github.com/memorim/morrow-studio-website/actions/runs/42628055785

The workflow completed successfully. Its batch reported attempted=1, delivered=1,
failed=0. PostgreSQL recorded delivery at 2026-11-09T13:44:18.374Z, with one attempt
and no last error, for synthetic inquiry `2465c873-ed65-4b90-b66a-d1267a28c76a`.
The inquiry is explicitly marked technical, uses verification.invalid, and requires
no contact or owner action. Existing inquiries were not modified.

This proves queue-to-ntfy acceptance through the GitHub worker. Receipt on the
owner's physical device remains unconfirmed. Notification content contains only
the project title and inquiry UUID, not contact details or message text.

The workflow now runs every 15 minutes to leave an idle interval for Neon Free's
five-minute scale-to-zero timeout. GitHub schedules may be delayed; this is not
an exact delivery deadline. Other application traffic can keep the database awake.
No paid Render worker was provisioned. Live verification above used manual dispatch
before the cadence change; the new cadence has not yet been observed firing.

Reference: https://neon.com/docs/introduction/scale-to-zero
