interface PromotionProps {
  variant?: "sidebar" | "inline"
}

export default function Promotion({ variant = "sidebar" }: PromotionProps) {
  if (variant === "inline") {
    return (
      <div className="mx-auto max-w-md mt-6">
        <div className="rounded-xl border border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white p-0.5 shadow-sm">
              <img src="/promotion-logo.svg" alt="Logo" className="h-full w-full object-contain" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold text-gray-800">
              Nhận hoàn tiền khi mua hàng online <br />Shopee &amp; Lazada
              </h3>
              <p className="mt-0.5 text-xs text-gray-500">
                Tạo link, mua hàng và nhận hoàn tiền nhanh chóng.
              </p>
              <p className="mt-0.5 text-xs text-orange-600 font-medium">
                Giảm giá nhiều hơn, tiết kiệm hơn.
              </p>
            </div>
            <a
              href="https://aff.moon.io.vn"
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 rounded-lg bg-gradient-to-r from-orange-600 to-amber-600 px-3 py-1.5 text-xs font-semibold text-white shadow transition hover:from-orange-700 hover:to-amber-700"
            >
              Nhận ngay
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-3xl mt-6">
      <div className="rounded-xl border border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50 p-4 shadow-sm">
        <div className="sm:flex sm:items-center sm:gap-4">
          <div className="hidden sm:flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-white p-1 shadow-sm">
            <img src="/promotion-logo.svg" alt="Logo" className="h-full w-full object-contain" />
          </div>
          <div className="flex sm:hidden h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white p-0.5 shadow-sm">
            <img src="/promotion-logo.svg" alt="Logo" className="h-full w-full object-contain" />
          </div>
          <div className="mt-2 sm:mt-0 min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-gray-800">
              Nhận hoàn tiền khi mua hàng online <br />Shopee &amp; Lazada
            </h3>
            <p className="mt-0.5 text-xs text-gray-500">
              Tạo link, mua hàng và nhận hoàn tiền nhanh chóng.
            </p>
            <p className="mt-0.5 text-xs text-orange-600 font-medium">
              Giảm giá nhiều hơn, tiết kiệm hơn.
            </p>
          </div>
          <a
            href="https://aff.moon.io.vn"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 sm:mt-0 inline-flex w-full sm:w-auto items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-orange-600 to-amber-600 px-4 py-2 text-xs font-semibold text-white shadow transition hover:from-orange-700 hover:to-amber-700 hover:shadow-md"
          >
            Nhận ngay
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  )
}
