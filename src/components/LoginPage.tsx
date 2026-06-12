interface LoginPageProps {
  onLogin: () => void
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const handleLogin = () => {
    window.location.href = "/api/auth/google"
    onLogin()
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="flex flex-1 items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-6 sm:p-8 shadow-lg text-center space-y-6">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-xl border-2 border-gray-800">
          <img src="/logo-m.svg" alt="Moon OCR" className="h-10 w-10" />
        </div>
        <h1 className="text-3xl font-bold text-gray-800">Moon OCR</h1>
        <p className="text-gray-500">
          Đăng nhập bằng Google để tải tài liệu lên Drive và trích xuất văn bản
        </p>
        <button
          onClick={handleLogin}
          className="inline-flex w-full items-center justify-center gap-3 rounded-lg border border-gray-200 bg-white px-6 py-3 font-medium text-gray-700 shadow-sm transition hover:shadow-md"
        >
          <svg className="h-5 w-5" viewBox="0 0 48 48">
            <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3c-1.7 4.1-5.6 7-10.3 7A11.3 11.3 0 0 1 13.8 24a11.3 11.3 0 0 1 11.2-11.3c2.9 0 5.5 1.1 7.5 2.8l5.7-5.7A19.8 19.8 0 0 0 24 4C13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.2-2.7-.4-3.9z" />
            <path fill="#FF3D00" d="m6.3 14.7 6.6 4.9A11.3 11.3 0 0 1 24 12.7c2.9 0 5.5 1.1 7.5 2.8l5.7-5.7A19.8 19.8 0 0 0 24 4C16.5 4 9.9 8.4 6.3 14.7z" />
            <path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.9 13.5-5.1l-6.2-5.3A11.2 11.2 0 0 1 24 35.3c-4.7 0-8.7-2.9-10.3-7l-6.6 5.1C10.9 39.6 17 44 24 44z" />
            <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3a11.4 11.4 0 0 1-3.8 5.1l6.2 5.3a20 20 0 0 0 5.9-14.4c0-1.3-.2-2.7-.4-3.9z" />
          </svg>
          Đăng nhập với Google
        </button>
        <p className="text-xs text-gray-400">
          Ứng dụng chỉ yêu cầu quyền truy cập vào file do ứng dụng tạo ra
        </p>

        </div>
      </div>
      <footer className="border-t border-gray-200 px-4 pt-4 pb-3 text-center text-[10px] text-gray-500 sm:pt-6 sm:pb-4 sm:text-xs">
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
