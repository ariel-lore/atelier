# Atelier

Bart Matero’s personal site. Friends and family visit his page. Public posts are on the grid for anyone. Exclusive posts and stories are returned only when the signed-in viewer is in the circle that post was shared with.

The look follows a light, phone-shaped layout: profile, story rings, a 3-column grid, post detail, a story viewer, and messages. There is no Meta branding.

## Run locally

Requirements: Node.js 20 or newer.

```bash
npm install
# Prisma reads DATABASE_URL from a local .env. Create one only if you do not already have it:
#   cp -n .env.example .env
npx prisma migrate dev
npm run seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

`.env` stays on your machine. The repo does not include it, and these steps do not overwrite an existing file.

`npm run seed` resets the demo database and copies the photos in `seed-media/` into `uploads/`. Those files are fixed Picsum images (saved in the repo) so a Quick Tunnel demo does not depend on the network. Re-run the seed any time you want a clean slate. Private and circle photos are still served only through `/api/media`, not from `public/`.

## Demo accounts

| Who | Email | Password | What they can see |
| --- | --- | --- | --- |
| Bart (owner) | `bart@atelier.local` | `bart-atelier` | Everything, including “Only me” |
| Alex Chen | `alex@atelier.local` | `member-atelier` | Public posts, plus the Family circle |
| Sam Rivera | `sam@atelier.local` | `member-atelier` | Public posts, plus Close Friends |
| Jordan Lee | `jordan@atelier.local` | `member-atelier` | Public posts only. Instagram check is waiting for Bart |

Logged out, the grid is the public posts only: a full 3-column set of real photos, plus story highlights (Studio, Coast, Desk, Market, Type). A direct link to the Family post (“Peaches”), the Close Friends post (“Draft notes”), the Only me post (“kitchen table”), or any of their image URLs returns 404 for the wrong viewer. Sam never receives Family posts. Alex never receives Close Friends posts.

About 130 extra people follow Bart so the follower count looks lived-in. They are not login accounts. Sign in only with the four accounts above.

The profile bio is “Designing Meridian”, Vancouver, and `meridian.studio`. Live stories (Studio, Walk, Coast, plus Coffee for Family, Notes for Close Friends, and Draft for Bart only) expire 24 hours after the seed run. Highlights stay on the profile.

Bart’s following **list** is private (the count is public). `GET /api/profile/lists?kind=following` returns 403 for anyone who is not Bart.

## Environment

Settings live in a local `.env`, which is gitignored. If you do not have one yet, copy `.env.example`. Seed and sign-in fall back to the demo accounts above when `OWNER_*` and `MEMBER_PASSWORD` are unset. In production, set `AUTH_SECRET` to a long random string (the app refuses to boot without it).

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Prisma connection string. Default `file:./dev.db` (SQLite, stored in `prisma/`). |
| `AUTH_SECRET` | Pepper for session-token hashes. Replace this anywhere but your laptop. |
| `OWNER_EMAIL` | Seeded owner email. |
| `OWNER_PASSWORD` | Seeded owner password. |
| `OWNER_NAME` | Display name. Default `Bart Matero`. |
| `OWNER_HANDLE` | Handle without `@`. Default `bart`. |
| `MEMBER_PASSWORD` | Shared password for Alex, Sam, and Jordan. |
| `UPLOAD_DIR` | Optional. Defaults to `./uploads`. |

## What the first version includes

- Owner profile laid out like a light photo app: avatar with a story ring, counts beside it, bio, highlights, and a tight 3-column grid
- Home feed with a stories tray and post chrome (like, comment, share, save, caption “more”, timestamp)
- Sign up and sign in (email + password, httpOnly session cookie)
- Roles: `OWNER` and `MEMBER`
- Circles: create, rename, delete, and assign verified people
- New post or 24-hour story with audience **Public**, **one or more circles**, or **Only me**
- Multi-photo posts (preview, then edit or delete) and multi-frame stories with an in-app viewer
- Feed, profile, post, and media routes that filter on the server
- Instagram verification: an emoji sentence, a link to check, and a manual confirm for Bart
- Messages between verified members, and an Instagram link when someone is not verified yet
- Profile fields you can turn off independently (follower count, following count, each list)

## Privacy model

Audience is stored on each post and story:

- `PUBLIC` — anyone, including logged-out visitors
- `CIRCLES` — the owner, the author, or a viewer who belongs to at least one selected circle
- `PRIVATE` — the owner and the author (“Only me”)

Filtering happens in Prisma queries and again before a response is built (`src/lib/privacy.ts`, `src/lib/queries.ts`). HTML and JSON only include items that pass. Image files live outside `public/` and are streamed only after the same check:

- `/api/media/posts/[id]` — cover photo (also used for older posts that have a single file)
- `/api/media/posts/[id]/images/[imageId]` — each extra photo on a post
- `/api/media/stories/[id]` — story cover
- `/api/media/stories/[id]/frames/[frameId]` — each story frame

Unauthorized and missing ids both return 404, so a guessed link does not confirm that a private post or story exists. A private story frame uses the parent story’s audience and expiry; it is not a separate public file.

## Owner posts and stories

Only the owner (Bart) can publish. Open **New** in the bottom bar.

**Posts**

1. Choose **Post**, then add one or more photos from the camera roll (up to 10). The first photo is the cover on the grid.
2. Write a caption and pick an audience: **Public**, one or more **circles**, or **Only me**.
3. **Preview** walks the photos and shows the audience. Nothing is stored until **Publish post**.
4. On your own post, **Edit** changes the caption, audience, and photos (remove some, add more). **Delete** removes the post and its files.

**Stories**

1. Choose **Story**, add one or more frames the same way, and give the ring a short label.
2. Audience works the same as posts. Stories expire 24 hours after they are created; every frame in that story expires together.
3. The viewer shows a progress bar per frame, advances on its own, and accepts a tap on the left or right (or the arrow keys). **Close** returns to the profile. When the last frame ends, the viewer closes.

A member in the wrong circle, or anyone logged out, does not receive the post, the story, or any of their image URLs.

Profile lists are a separate check. A private list is omitted from the profile payload; the list endpoint returns 403 and no names.

Pages send `Cache-Control: private, no-store` so a signed-in response is not stored by a shared cache.

## Instagram verification

1. The member enters their Instagram username.
2. Atelier generates a phrase such as `quiet peaches 🍑 waiting 🌙 beside the studio before coffee`. It is a normal-looking caption with a large combination space, not a raw token.
3. They place that exact phrase in a bio, post, or story, then paste the `https://www.instagram.com/...` link.
4. Atelier requests that URL and looks for the phrase. Redirects are only followed when they stay on `instagram.com`.
5. Instagram often answers with a login wall, so the phrase will not be in the HTML. The request stays **pending**. Bart opens the link, confirms the phrase is really there, and marks the account verified.
6. After that, Bart can add them to a circle. Messaging on Atelier is limited to verified members. Anyone who only has Instagram gets a link to their profile instead of an in-app thread.

### How a later automatic check would work

Keep the same phrase and the same “does this text contain the code?” step. Replace the HTML fetch with one of these, in order of reliability:

- **Instagram Graph API** (preferred). The site owner connects a professional account or asks the member to sign in with Instagram. Read the caption of the media id in the URL, or the biography field, and compare it to the stored phrase. This is authenticated and does not depend on scraping.
- **oEmbed** for public posts (`https://graph.facebook.com/v19.0/instagram_oembed`), which sometimes returns a caption for public media when the app has an app token. Still subject to Meta’s app review.
- **The current HTML fetch**, only as a hint. Treat a hit as enough to verify. Treat a miss or a block as “needs the owner,” which is what v1 does.

Do not verify from a client-side screenshot alone without the owner looking, and do not trust a URL outside `instagram.com`.

## Deploy notes

SQLite and the local `uploads/` folder are for a single machine. They are a poor fit for serverless hosts: the filesystem is ephemeral and multiple instances will not share the file.

For a small VPS or a Docker box:

1. Set a long `AUTH_SECRET`.
2. Keep SQLite on a persistent disk, or switch the datasource in `prisma/schema.prisma` from `sqlite` to `postgresql`, point `DATABASE_URL` at Postgres, and run `npx prisma migrate deploy`.
3. Put `uploads/` on a persistent volume. To move media to S3-compatible storage, replace `saveObject` / `readObject` in `src/lib/storage.ts`. Keep serving bytes through the auth-gated media routes — do not make the bucket public.
4. Run `npm run build` and `npm start`.
5. Put the app behind HTTPS so the session cookie can be marked `Secure` (that happens automatically when `NODE_ENV=production`).

To use a different owner email or password, set `OWNER_EMAIL` and `OWNER_PASSWORD` in your local `.env` and run `npm run seed` again. Seed deletes the demo users and posts first. It does not rewrite `.env`.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Next.js dev server |
| `npm run build` / `npm start` | Production build and server |
| `npm run seed` | Reset and load Bart, circles, posts, stories, and demo members |
| `npm test` | Audience rules and emoji-phrase checks |
| `npx prisma migrate dev` | Apply schema changes to the local database |
| `npx prisma studio` | Browse the database |

## Project map

- `prisma/schema.prisma` — users, sessions, circles, posts (with `PostImage` rows), stories (with `StoryFrame` rows), highlights, verification, messages
- `seed-media/` — the demo photos copied into `uploads/` by `npm run seed`
- `src/lib/privacy.ts` — who can see a post, story, or profile field
- `src/app/api/**` — auth, feed, profile, media, circles, verification, messages
- `src/app/(main)/**` — the phone-shaped UI
- `uploads/` — image files (gitignored; seed recreates the demo set)
