# LINE notifications for payment reviews

When a customer successfully uploads a payment slip, POLREADY sends a private
LINE message to every registered administrator. The message contains only the
plan, amount, submission time, and a link to the payment-review page. It does
not include the payer's name, phone number, or payment-slip image.

## One-time setup

1. Create a LINE Official Account and enable the Messaging API.
2. In the deployment environment, set the following **server-only** variables:

   ```text
   LINE_CHANNEL_ACCESS_TOKEN=<Channel access token>
   LINE_CHANNEL_SECRET=<Channel secret>
   LINE_ADMIN_SETUP_TOKEN=<a long random secret>
   APP_URL=https://your-production-domain.example
   ```

3. In the LINE Developers console, enable webhooks and set the webhook URL to:

   ```text
   https://your-production-domain.example/api/webhooks/line
   ```

4. Apply `supabase/migrations/20260805_line_admin_notifications.sql`.
5. On each administrator's phone, add the Official Account as a friend and send:

   ```text
   /subscribe <LINE_ADMIN_SETUP_TOKEN>
   ```

   The account replies with a confirmation. To stop its alerts, send
   `/unsubscribe <LINE_ADMIN_SETUP_TOKEN>`.
6. Sign in as an admin, open `/admin/payments`, and choose **ทดสอบแจ้งเตือน LINE**.

Only requests with a valid LINE signature can change the recipient list. Do not
publish `LINE_ADMIN_SETUP_TOKEN`, `LINE_CHANNEL_SECRET`, or the channel token.

## Local outgoing test before deployment

LINE cannot call a `localhost` webhook, but the outbound mobile notification can
be tested before deployment. Set `LINE_CHANNEL_ACCESS_TOKEN` and
`LINE_ADMIN_USER_IDS` in `.env.local`, where `LINE_ADMIN_USER_IDS` is a
comma-separated list of administrator LINE user IDs. Restart the local server,
sign in as an admin, and use **ทดสอบแจ้งเตือน LINE** on `/admin/payments`.

`LINE_ADMIN_USER_IDS` is only a controlled fallback for testing or recovery. In
production, the normal recipient list is created by the verified `/subscribe`
webhook flow above.
