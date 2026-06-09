# Next.js 16 API Notes (installed: next@16.2.7)

Extracted verbatim from the bundled docs in `node_modules/next/dist/docs/`.
These are the CURRENT conventions — they differ from older Next.js. Don't trust training-data memory.

---

## 1. `params` / `searchParams` are async (Promise) — REQUIRED

Next.js 15 made Request APIs async with a temporary sync fallback. **Next.js 16 fully removed
synchronous access** — `params`, `searchParams`, `cookies`, `headers`, `draftMode` can ONLY be
awaited. (`version-16.md` "Async Request APIs (Breaking change)".)

Page reading a dynamic segment, e.g. `app/clans/[clanId]/page.tsx`:

```tsx
export default async function Page({
  params,
}: {
  params: Promise<{ clanId: string }>
}) {
  const { clanId } = await params
  return <div>Clan: {clanId}</div>
}
```

- `searchParams` is likewise `Promise<{ [key: string]: string | string[] | undefined }>` and is a
  prop on **pages only** — **layouts do NOT receive `searchParams`**.
- Layouts DO receive async `params`.
- In a **Client Component** page, unwrap with React's `use()`: `const { clanId } = use(params)`.
- Optional helper types: `PageProps<'/clans/[clanId]'>`, `LayoutProps<'/...'>`,
  `RouteContext<'/...'>`. Run `npx next typegen` to generate them.

---

## 2. `cookies()` from `next/headers` is async

```tsx
import { cookies } from 'next/headers'

// Read (Server Component or Server Action)
const cookieStore = await cookies()
const theme = cookieStore.get('theme')?.value

// Set httpOnly — only allowed inside a Server Action or Route Handler
cookieStore.set({ name: 'session', value: token, httpOnly: true, path: '/' })
// or: cookieStore.set('session', token, { httpOnly: true, secure: true })

// Delete
cookieStore.delete('session')
```

- **Reading** works in Server Components. **Setting / deleting** is NOT allowed during Server
  Component render — must be done in a Server Action or Route Handler (response headers).
- Setting/deleting a cookie in a Server Action re-renders the current page + layouts automatically.

---

## 3. Server Actions (`'use server'`)

A Server Function is an async function marked with `'use server'`. Used in a form/`formAction`
context it's a "Server Action". Invoked via POST.

**Inline (in a Server Component):**
```tsx
export default async function Page() {
  async function createPost(formData: FormData) {
    'use server'
    // mutate...
  }
  return <form action={createPost}>...</form>
}
```

**Separate file** (REQUIRED to call from a Client Component) — directive at top of file:
```tsx
// app/actions.ts
'use server'
export async function createPost(formData: FormData) { /* ... */ }
```
```tsx
// client component
'use client'
import { createPost } from '@/app/actions'
export function Button() {
  return <button formAction={createPost}>Create</button>
}
```

- You **cannot define** a Server Function inside a Client Component, only import one.
- Form usage auto-passes `FormData`: `<form action={createPost}>`.
- With `useActionState`, the action signature gains a leading state arg:
  `createUser(prevState, formData)`.
- Pass extra args with `.bind(null, id)`.
- **Always authenticate/authorize inside every Server Function** — they're reachable via direct POST.

**`redirect()` — from `next/navigation`, and it must be OUTSIDE try/catch:**
```tsx
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function createPost(formData: FormData) {
  // mutate...
  revalidatePath('/posts')
  redirect('/posts')   // throws a control-flow exception; nothing after runs
}
```
`redirect` throws a framework-handled exception, so a surrounding `try/catch` would swallow it.
Call it after any cleanup and after revalidation.

---

## 4. `revalidatePath` after a mutation

```tsx
import { revalidatePath } from 'next/cache'

export async function createPost(formData: FormData) {
  'use server'
  // mutate...
  revalidatePath('/posts')
}
```
- Also available: `revalidateTag(tag, profile)` — in v16 `revalidateTag` **now requires a second
  `cacheLife` profile argument**; the single-arg form is deprecated (TS error).
- `refresh()` (from `next/cache`) refreshes the client router but does NOT revalidate tagged data.

---

## 5. Caching defaults (what you actually need to know)

- **Caching is opt-in.** The aggressive default fetch/route caching of older Next is gone. By
  default data is NOT cached.
- New model = **Cache Components**, enabled with `cacheComponents: true` in `next.config.ts`.
  When ON, the default render mode is **Partial Prerendering (PPR)**.
- The old `dynamicIO` flag is now this `cacheComponents` option.
- To cache, add the **`'use cache'`** directive at the top of an async function / component / file,
  optionally with `cacheLife('hours')` and `cacheTag('posts')` (both now **stable**, no `unstable_`
  prefix).
- For fresh-per-request data: do NOT use `'use cache'`; wrap the component in `<Suspense>`. With
  Cache Components, uncached data accessed outside `<Suspense>` is a build/dev error.
- Prefer `connection()` (from `next/server`) over `export const dynamic = 'force-dynamic'` to force
  dynamic rendering — it semantically ties to the incoming request. `force-dynamic` is the old way.
- If NOT using Cache Components, the older "Caching and Revalidating (Previous Model)" rules apply.

---

## 6. Postgres / node-runtime client gotchas

- Server Actions and Route Handlers run on the server, so a `pg`/node Postgres client is fine there.
  The docs don't require `export const runtime = 'nodejs'` for a Server Action — node is the default
  server runtime. Only set `export const runtime = 'edge'` if you explicitly want edge (a node pg
  driver won't work there).
- A query against a real Postgres server is **async/network I/O = runtime data**. Under Cache
  Components it must be either wrapped in `<Suspense>`, marked `'use cache'`, or deferred with
  `connection()`. Otherwise you get the "Uncached data accessed outside of `<Suspense>`" error.
- Note: the docs call out that **synchronous** embedded DBs (`better-sqlite3`, `node:sqlite`)
  complete during prerender; for per-request data from a sync source call `connection()` first.
  This does NOT apply to networked Postgres (already async).
- Instead of `dynamic = 'force-dynamic'` to keep a DB-backed route dynamic, prefer `await connection()`
  at the top of the Server Component, or just rely on Suspense boundaries.

---

## Other v16 breaking changes worth knowing
- **Node.js 20.9+** required (Node 18 dropped).
- **Turbopack is the default** for `next dev` and `next build`. A custom `webpack` config will make
  `next build` FAIL.
- `useSearchParams` (client hook) is unchanged: returns read-only `URLSearchParams`, must be wrapped
  in `<Suspense>` on prerendered routes or the build fails.
