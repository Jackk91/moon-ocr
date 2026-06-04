import { Hono } from "hono"
import { handle } from "hono/cloudflare-pages"
import { getCookie, setCookie, deleteCookie } from "hono/cookie"
import { SignJWT, jwtVerify } from "jose"

// ============================================================
// Types
// ============================================================

interface Env {
  OAUTH_KV: KVNamespace
  GOOGLE_CLIENT_ID: string
  GOOGLE_CLIENT_SECRET: string
  JWT_SECRET: string
  OAUTH_REDIRECT: string
  NOTEBOOK_DRIVE_ID: string
}

interface SessionPayload {
  email: string
  name: string
  picture: string
  accessToken: string
  refreshToken?: string
}

interface TokenResponse {
  access_token: string
  refresh_token?: string
  id_token: string
  expires_in: number
}

// ============================================================
// PKCE helpers
// ============================================================

function base64url(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "")
}

function randomBytes(n: number): Uint8Array {
  const buf = new Uint8Array(n)
  crypto.getRandomValues(buf)
  return buf
}

async function sha256base64url(input: string): Promise<string> {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input))
  return base64url(new Uint8Array(hash))
}

// ============================================================
// Drive API helpers (fetch-based, no googleapis)
// ============================================================

const DRIVE_API = "https://www.googleapis.com/drive/v3"
const DRIVE_UPLOAD = "https://www.googleapis.com/upload/drive/v3/files"

async function ensureFolder(accessToken: string): Promise<string> {
  const searchRes = await fetch(
    `${DRIVE_API}/files?q=name%3D%27OCR_Uploads%27%20and%20mimeType%3D%27application%2Fvnd.google-apps.folder%27%20and%20trashed%3Dfalse&fields=files(id)`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )
  const searchData = (await searchRes.json()) as any
  if (searchData.files?.length) return searchData.files[0].id

  const createRes = await fetch(`${DRIVE_API}/files`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: "OCR_Uploads",
      mimeType: "application/vnd.google-apps.folder",
    }),
  })
  const folder = (await createRes.json()) as any
  return folder.id
}

async function uploadToDrive(
  accessToken: string,
  folderId: string,
  fileName: string,
  fileBuffer: ArrayBuffer,
  mimeType: string,
): Promise<{ fileId: string; webViewLink: string }> {
  const boundary = `boundary_${crypto.randomUUID()}`
  const metadata = JSON.stringify({ name: fileName, parents: [folderId] })
  const encoder = new TextEncoder()
  const crlf = encoder.encode("\r\n")

  const head1 = encoder.encode(`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n`)
  const metaBytes = encoder.encode(metadata)
  const head2 = encoder.encode(`\r\n--${boundary}\r\nContent-Type: ${mimeType}\r\n\r\n`)
  const fileBytes = new Uint8Array(fileBuffer)
  const tail = encoder.encode(`\r\n--${boundary}--\r\n`)

  const totalLen = head1.byteLength + metaBytes.byteLength + head2.byteLength + fileBytes.byteLength + tail.byteLength
  const body = new Uint8Array(totalLen)
  let off = 0
  body.set(head1, off); off += head1.byteLength
  body.set(metaBytes, off); off += metaBytes.byteLength
  body.set(head2, off); off += head2.byteLength
  body.set(fileBytes, off); off += fileBytes.byteLength
  body.set(tail, off)

  const res = await fetch(`${DRIVE_UPLOAD}?uploadType=multipart&fields=id,webViewLink`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": `multipart/related; boundary=${boundary}`,
    },
    body,
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Drive upload failed (${res.status}): ${err}`)
  }

  const result = (await res.json()) as any
  return { fileId: result.id, webViewLink: result.webViewLink }
}

// ============================================================
// Hono app
// ============================================================

const app = new Hono<{ Bindings: Env }>().basePath("/api")

// --- GET /api/auth/google - redirect to Google OAuth with PKCE ---
app.get("/auth/google", async (c) => {
  const state = base64url(randomBytes(32))
  const codeVerifier = base64url(randomBytes(43))
  const codeChallenge = await sha256base64url(codeVerifier)

  await c.env.OAUTH_KV.put(state, codeVerifier, { expirationTtl: 300 })

  const params = new URLSearchParams({
    client_id: c.env.GOOGLE_CLIENT_ID,
    redirect_uri: c.env.OAUTH_REDIRECT,
    response_type: "code",
    scope: "openid email profile https://www.googleapis.com/auth/drive.file",
    code_challenge_method: "S256",
    code_challenge: codeChallenge,
    state,
    access_type: "offline",
    prompt: "consent",
  })

  return c.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`)
})

// --- GET /api/auth/callback - exchange code for tokens, set session cookie ---
app.get("/auth/callback", async (c) => {
  const code = c.req.query("code")
  const state = c.req.query("state")
  const error = c.req.query("error")

  if (error) return c.redirect(`${c.env.OAUTH_REDIRECT.replace("/api/auth/callback", "")}?error=${error}`)
  if (!code || !state) return c.text("Missing code or state", 400)

  const codeVerifier = await c.env.OAUTH_KV.get(state)
  if (!codeVerifier) return c.text("Invalid or expired state", 400)

  await c.env.OAUTH_KV.delete(state)

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: c.env.GOOGLE_CLIENT_ID,
      client_secret: c.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: c.env.OAUTH_REDIRECT,
      grant_type: "authorization_code",
      code_verifier: codeVerifier,
    }),
  })

  if (!tokenRes.ok) {
    const err = await tokenRes.text()
    console.error("Token exchange failed:", err)
    return c.text("Token exchange failed", 400)
  }

  const tokens = (await tokenRes.json()) as TokenResponse

  // Decode id_token JWT to get user info
  const idPayload = JSON.parse(atob(tokens.id_token.split(".")[1]))

  const sessionPayload: SessionPayload = {
    email: idPayload.email,
    name: idPayload.name,
    picture: idPayload.picture,
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
  }

  const sessionToken = await new SignJWT(sessionPayload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(new TextEncoder().encode(c.env.JWT_SECRET))

  setCookie(c, "session", sessionToken, {
    httpOnly: true,
    secure: true,
    sameSite: "Lax",
    path: "/",
    maxAge: 604800,
  })

  const origin = new URL(c.env.OAUTH_REDIRECT).origin
  return c.redirect(origin)
})

// --- GET /api/auth/me - return current user info ---
app.get("/auth/me", async (c) => {
  const token = getCookie(c, "session")
  if (!token) return c.json({ user: null })

  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(c.env.JWT_SECRET))
    const session = payload as unknown as SessionPayload
    return c.json({
      user: { email: session.email, name: session.name, picture: session.picture },
    })
  } catch {
    return c.json({ user: null })
  }
})

// --- POST /api/auth/logout - clear session ---
app.post("/auth/logout", (c) => {
  deleteCookie(c, "session")
  return c.json({ success: true })
})

// --- helper: check if file exists on Drive ---
async function fileExistsOnDrive(
  accessToken: string,
  folderId: string,
  fileName: string,
): Promise<boolean> {
  const q = encodeURIComponent(`name='${fileName.replace(/'/g, "\\'")}' and '${folderId}' in parents and trashed=false`)
  const res = await fetch(`${DRIVE_API}/files?q=${q}&fields=files(id)`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  const data = (await res.json()) as any
  return data.files?.length > 0
}

// --- POST /api/upload - upload files to Google Drive (có check trùng) ---
app.post("/upload", async (c) => {
  const token = getCookie(c, "session")
  if (!token) return c.json({ success: false, error: "Unauthorized" }, 401)

  let session: SessionPayload
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(c.env.JWT_SECRET))
    session = payload as unknown as SessionPayload
  } catch {
    return c.json({ success: false, error: "Invalid session" }, 401)
  }

  const formData = await c.req.formData()
  const fileEntries = formData.getAll("files") as File[]
  if (!fileEntries.length) {
    return c.json({ success: false, error: "No files provided" }, 400)
  }

  let folderId: string
  try {
    folderId = await ensureFolder(session.accessToken)
  } catch (err: any) {
    return c.json({ success: false, error: `Folder error: ${err.message}` }, 500)
  }

  const results: { fileId: string; webViewLink: string; fileName: string }[] = []
  const existing: string[] = []

  for (const file of fileEntries) {
    try {
      const exists = await fileExistsOnDrive(session.accessToken, folderId, file.name)
      if (exists) {
        existing.push(file.name)
        continue
      }
      const buf = await file.arrayBuffer()
      const driveResult = await uploadToDrive(
        session.accessToken,
        folderId,
        file.name,
        buf,
        file.type || "application/octet-stream",
      )
      results.push({ ...driveResult, fileName: file.name })
    } catch (err: any) {
      console.error(`Upload error for ${file.name}:`, err)
      return c.json({ success: false, error: `Failed to upload ${file.name}: ${err.message}` }, 500)
    }
  }

  return c.json({ success: true, files: results, existing: existing.length ? existing : undefined, notebookId: c.env.NOTEBOOK_DRIVE_ID })
})

// --- POST /api/reupload - upload files đã tồn tại (bỏ qua check) ---
app.post("/reupload", async (c) => {
  const token = getCookie(c, "session")
  if (!token) return c.json({ success: false, error: "Unauthorized" }, 401)

  let session: SessionPayload
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(c.env.JWT_SECRET))
    session = payload as unknown as SessionPayload
  } catch {
    return c.json({ success: false, error: "Invalid session" }, 401)
  }

  const formData = await c.req.formData()
  const fileEntries = formData.getAll("files") as File[]
  if (!fileEntries.length) {
    return c.json({ success: false, error: "No files provided" }, 400)
  }

  let folderId: string
  try {
    folderId = await ensureFolder(session.accessToken)
  } catch (err: any) {
    return c.json({ success: false, error: `Folder error: ${err.message}` }, 500)
  }

  const results: { fileId: string; webViewLink: string; fileName: string }[] = []

  for (const file of fileEntries) {
    try {
      const buf = await file.arrayBuffer()
      const driveResult = await uploadToDrive(
        session.accessToken,
        folderId,
        file.name,
        buf,
        file.type || "application/octet-stream",
      )
      results.push({ ...driveResult, fileName: file.name })
    } catch (err: any) {
      console.error(`Reupload error for ${file.name}:`, err)
      return c.json({ success: false, error: `Failed to reupload ${file.name}: ${err.message}` }, 500)
    }
  }

  return c.json({ success: true, files: results, notebookId: c.env.NOTEBOOK_DRIVE_ID })
})

export const onRequest = handle(app)
