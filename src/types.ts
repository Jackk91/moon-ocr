export interface UserInfo {
  email: string
  name: string
  picture: string
}

export interface UploadResult {
  fileId: string
  webViewLink: string
  fileName: string
}

export interface ApiUploadResponse {
  success: boolean
  files: UploadResult[]
  existing?: string[]
  notebookId: string
  error?: string
}

export interface MeResponse {
  user: UserInfo | null
}
