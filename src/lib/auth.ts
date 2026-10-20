/** Pipeline runs cost money, so they require `Authorization: Bearer $CRON_SECRET` (Vercel Cron sends this automatically). */
export function authorized(req: Request) {
  const secret = process.env.CRON_SECRET;
  return Boolean(secret) && req.headers.get("authorization") === `Bearer ${secret}`;
}
