import { useCallback, useState, useRef, DragEvent, ChangeEvent } from "react"
import type { UserInfo, ApiUploadResponse } from "../types"
import { uploadFiles, reuploadFiles, logout } from "../lib/api"

interface Props {
  user: UserInfo
  onLogout: () => void
}

interface FilePreview {
  id: string
  file: File
  previewUrl: string
}

function fileKey(f: { name: string; size: number }) {
  return `${f.name}::${f.size}`
}

export default function UploadPage({ user, onLogout }: Props) {
  const [files, setFiles] = useState<FilePreview[]>([])
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<ApiUploadResponse | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [existingDismissed, setExistingDismissed] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const addFiles = useCallback((list: FileList | File[]) => {
    const valid = Array.from(list).filter((f) =>
      ["image/png", "image/jpeg", "image/webp", "image/jpg"].includes(f.type),
    )
    setFiles((prev) => {
      const currentKeys = new Set(prev.map((x) => fileKey(x.file)))
      const skipped: string[] = []
      const newItems: FilePreview[] = valid
        .filter((f) => {
          if (currentKeys.has(fileKey(f))) {
            skipped.push(f.name)
            return false
          }
          return true
        })
        .map((f) => ({
          id: crypto.randomUUID(),
          file: f,
          previewUrl: URL.createObjectURL(f),
        }))
      if (skipped.length) {
        alert(`Đã bỏ qua ${skipped.length} file đã có trong danh sách:\n${skipped.join("\n")}`)
      }
      return [...prev, ...newItems]
    })
  }, [])

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => {
      const found = prev.find((x) => x.id === id)
      if (found) URL.revokeObjectURL(found.previewUrl)
      return prev.filter((x) => x.id !== id)
    })
  }, [])

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      setDragOver(false)
      if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files)
    },
    [addFiles],
  )

  const handleFiles = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      if (e.target.files?.length) addFiles(e.target.files)
    },
    [addFiles],
  )

  const handleUpload = async () => {
    if (!files.length) return
    setUploading(true)
    setResult(null)
    setExistingDismissed(false)
    const fileList = files.map((f) => f.file)
    try {
      const data = await uploadFiles(fileList)
      setResult(data)
      // notebookId always provided from server env
      if (data.success) {
        files.forEach((f) => {
          URL.revokeObjectURL(f.previewUrl)
        })
        setFiles([])
      }
    } catch {
      setResult({ success: false, files: [], error: "Lỗi kết nối máy chủ" })
    } finally {
      setUploading(false)
    }
  }

  const handleReupload = async () => {
    if (!result || !result.existing?.length) return
    const fileList = files
      .filter((f) => (result.existing || []).includes(f.file.name))
      .map((f) => f.file)
    if (!fileList.length) {
      setResult(null)
      return
    }
    setUploading(true)
    setResult(null)
    setExistingDismissed(false)
    try {
      const data = await reuploadFiles(fileList)
      setResult(data)
      if (data.success) {
        files.forEach((f) => {
          URL.revokeObjectURL(f.previewUrl)
        })
        setFiles([])
      }
    } catch {
      setResult({ success: false, files: [], error: "Lỗi kết nối máy chủ" })
    } finally {
      setUploading(false)
    }
  }

  const handleLogout = async () => {
    await logout()
    onLogout()
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="flex-1 p-4 sm:p-6">
        <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-3 flex items-center justify-between rounded-xl bg-white p-3 shadow-sm sm:mb-8 sm:p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white">
              MO
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-800">Moon OCR</h1>
              <p className="text-xs text-gray-400">Upload tài liệu lên Drive</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-gray-500 sm:block">{user.email}</span>
            {user.picture && (
              <img src={user.picture} alt="" className="h-8 w-8 rounded-full ring-2 ring-blue-100" />
            )}
            <button
              onClick={handleLogout}
              className="rounded-lg px-3 py-1.5 text-sm text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
            >
              Thoát
            </button>
          </div>
        </div>

        {/* Drop zone */}
        <div
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onClick={() => inputRef.current?.click()}
          className={`cursor-pointer rounded-xl border-2 border-dashed p-4 sm:p-12 text-center transition-all ${
            dragOver
              ? "scale-[1.01] border-blue-500 bg-blue-50 shadow-lg"
              : "border-gray-300 bg-white hover:border-blue-400 hover:bg-blue-50/50"
          }`}
        >
          <input ref={inputRef} type="file" multiple accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleFiles} />
          <svg
            className={`mx-auto mb-4 h-14 w-14 transition-colors ${dragOver ? "text-blue-500" : "text-gray-300"}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M7 16a4 4 0 0 1-.88-7.903A5 5 0 1 1 15.9 6h.1a5 5 0 0 1 1 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <p className="text-gray-600">
            <span className="font-semibold text-blue-600">Nhấp để chọn</span> hoặc kéo thả ảnh vào đây
          </p>
          <p className="mt-1 text-sm text-gray-400">Hỗ trợ PNG, JPG, WebP</p>
        </div>

        {/* File list */}
        {files.length > 0 && (
          <div className="mt-6 space-y-4">
            <p className="text-sm font-medium text-gray-600">
              Đã chọn <span className="font-bold text-blue-600">{files.length}</span> tệp
            </p>
            <div className="grid grid-cols-2 gap-2 sm:gap-3 sm:grid-cols-3 md:grid-cols-4">
              {files.map((f) => (
                <div key={f.id} className="group relative overflow-hidden rounded-lg border bg-white shadow-sm transition hover:shadow-md">
                  <img src={f.previewUrl} alt={f.file.name} className="h-32 w-full object-cover" />
                  <div className="truncate px-2 py-1.5 text-xs text-gray-600">{f.file.name}</div>
                  <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/40 to-transparent p-2 opacity-0 transition group-hover:opacity-100">
                    <span className="text-[10px] text-white">{(f.file.size / 1024 / 1024).toFixed(1)} MB</span>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); removeFile(f.id) }}
                    className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs text-white shadow transition hover:bg-red-600 opacity-0 group-hover:opacity-100"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 sm:px-6 sm:py-3.5 sm:text-base"
            >
              {uploading ? (
                <>
                  <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Đang tải lên Google Drive...
                </>
              ) : (
                <>
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  Tải lên Google Drive
                </>
              )}
            </button>
          </div>
        )}

        {/* Result */}
        {result && (
          <div className={`mt-6 rounded-xl border p-3 sm:p-5 shadow-sm ${
            result.existing?.length ? "border-amber-200 bg-amber-50" :
            result.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"
          }`}>
            {/* Tiêu đề */}
            <div className="flex items-center gap-3">
              {result.success && !result.existing?.length ? (
                <svg className="h-6 w-6 flex-shrink-0 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : result.existing?.length ? (
                <svg className="h-6 w-6 flex-shrink-0 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              ) : (
                <svg className="h-6 w-6 flex-shrink-0 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              <div>
                <p className={`font-medium ${
                  result.existing?.length ? "text-amber-700" :
                  result.success ? "text-green-700" : "text-red-700"
                }`}>
                  {result.existing?.length
                    ? `Đã tải lên ${result.files.length} tệp`
                    : result.success
                      ? `Đã tải lên ${result.files.length} tệp thành công!`
                      : result.error}
                </p>
              </div>
            </div>

            {/* Danh sách file đã upload */}
            {result.files.length > 0 && (
              <ul className="mt-3 space-y-1.5 border-t border-green-200 pt-3">
                {result.files.map((f) => (
                  <li key={f.fileId} className="text-sm">
                    <a href={f.webViewLink} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 text-blue-600 transition hover:text-blue-800">
                      <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      {f.fileName}
                    </a>
                  </li>
                ))}
              </ul>
            )}

            {/* File đã tồn tại */}
            {result.existing && result.existing.length > 0 && !existingDismissed && (
              <div className="mt-3 border-t border-amber-200 pt-3">
                <p className="flex items-center gap-2 text-sm font-medium text-amber-700">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" />
                  </svg>
                  {result.existing.length} file đã tồn tại trên Drive
                </p>
                <ul className="mt-1.5 space-y-1">
                  {result.existing.map((name) => (
                    <li key={name} className="flex items-center gap-2 text-sm text-amber-600">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                      {name}
                    </li>
                  ))}
                </ul>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    onClick={handleReupload}
                    disabled={uploading}
                    className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-amber-700 disabled:opacity-50"
                  >
                    {uploading ? "Đang tải..." : "Upload lại các file này"}
                  </button>
                  <button
                    onClick={() => setExistingDismissed(true)}
                    className="rounded-lg border border-amber-300 bg-white px-4 py-2 text-sm font-medium text-amber-700 transition hover:bg-amber-50"
                  >
                    Bỏ qua
                  </button>
                </div>
              </div>
            )}

            {/* Hướng dẫn OCR */}
            {(result.files.length > 0 || existingDismissed) && (
              <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
                <h3 className="flex items-center gap-2 font-semibold text-blue-800">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  Hướng dẫn trích xuất văn bản (OCR)
                </h3>
                <a
                    href={`https://colab.research.google.com/drive/${result.notebookId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-blue-700 sm:w-auto"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M10.9 2.1a2.1 2.1 0 012.2 0l7.5 4.3c.7.4 1.1 1.1 1.1 1.9v7.4c0 .8-.4 1.5-1.1 1.9l-7.5 4.3c-.7.4-1.5.4-2.2 0l-7.5-4.3c-.7-.4-1.1-1.1-1.1-1.9V8.3c0-.8.4-1.5 1.1-1.9l7.5-4.3zM12 4.5L6.5 7.5 12 10.5l5.5-3L12 4.5zM6.5 16.5l4.5 2.6v-5.8l-4.5-2.6v5.8zm7 2.6l4.5-2.6v-5.8l-4.5 2.6v5.8z"/>
                    </svg>
                    Mở trong Google Colab
                  </a>
                <ol className="mt-3 space-y-2 text-sm text-blue-900 list-decimal list-inside" start={2}>
                  <li>
                    Chạy lần lượt từng cell bằng <strong>Shift+Enter</strong>
                  </li>
                  <li>
                    Vào Google Drive → <code className="rounded bg-blue-100 px-1 py-0.5">MyDrive/OCR_Uploads/</code> → xem file <code className="rounded bg-blue-100 px-1 py-0.5">.docx</code> hoặc <code className="rounded bg-blue-100 px-1 py-0.5">.txt</code>
                  </li>
                </ol>
              </div>
            )}
          </div>
        )}
        </div>
      </div>
      <footer className="mt-auto border-t border-gray-200 px-4 pt-4 pb-3 text-center text-[10px] text-gray-500 sm:pt-6 sm:pb-4 sm:text-xs">
        <p className="mx-auto max-w-2xl px-2 leading-5 sm:leading-relaxed sm:px-0">
          Trang web được tạo ra vì mục đích phi thương mại. Nhằm bảo vệ sự riêng tư của mỗi người, các dữ liệu người dùng chỉ được cung cấp để xử lý tại phiên làm việc, hoàn toàn không được lưu vào cơ sở dữ liệu tại bất kỳ nơi nào thuộc hệ thống này.
        </p>
        <p className="mt-3 flex flex-wrap items-center justify-center gap-x-1">
          <a href="https://moon.io.vn" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700">moon.io.vn</a>
          <span>&nbsp;·&nbsp;</span>
          <a href="https://aff.moon.io.vn" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700">aff.moon.io.vn</a>
        </p>
        <p className="mt-1">made with <span className="text-red-500">&hearts;</span> by Bát man</p>
      </footer>
    </div>
  )
}
