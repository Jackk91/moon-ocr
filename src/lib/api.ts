import type { MeResponse, ApiUploadResponse } from "../types"

export async function fetchUser(): Promise<MeResponse> {
  const res = await fetch("/api/auth/me")
  return res.json()
}

export async function logout(): Promise<void> {
  await fetch("/api/auth/logout", { method: "POST" })
}

export async function uploadFiles(files: File[]): Promise<ApiUploadResponse> {
  const formData = new FormData()
  files.forEach((f) => formData.append("files", f))

  const res = await fetch("/api/upload", { method: "POST", body: formData })
  return res.json()
}

export async function reuploadFiles(files: File[]): Promise<ApiUploadResponse> {
  const formData = new FormData()
  files.forEach((f) => formData.append("files", f))

  const res = await fetch("/api/reupload", { method: "POST", body: formData })
  return res.json()
}
