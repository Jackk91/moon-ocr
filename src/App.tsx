import { useEffect, useState } from "react"
import type { UserInfo } from "./types"
import { fetchUser } from "./lib/api"
import LoginPage from "./components/LoginPage"
import UploadPage from "./components/UploadPage"

type State = { tag: "loading" } | { tag: "login" } | { tag: "upload"; user: UserInfo }

export default function App() {
  const [state, setState] = useState<State>({ tag: "loading" })

  useEffect(() => {
    fetchUser()
      .then((res) => {
        if (res.user) setState({ tag: "upload", user: res.user })
        else setState({ tag: "login" })
      })
      .catch(() => setState({ tag: "login" }))
  }, [])

  if (state.tag === "loading") {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50">
        <p className="text-gray-400">Đang tải...</p>
      </div>
    )
  }

  if (state.tag === "login") return <LoginPage onLogin={() => setState({ tag: "loading" })} />

  return (
    <UploadPage
      user={state.user}
      onLogout={() => setState({ tag: "login" })}
    />
  )
}
