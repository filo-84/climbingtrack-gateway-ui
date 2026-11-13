import { useEffect, useState, type ReactNode } from 'react'
import QRCode from 'qrcode'
import logo from '../assets/logo.svg'

const IOS_STORE_URL = 'https://apps.apple.com/de/app/climbingtrack/id6780679492'
const ANDROID_STORE_URL = 'https://play.google.com/store/apps/details?id=de.filo.climbingtrack'

const qrOptions = {
  type: 'svg' as const,
  margin: 2,
  errorCorrectionLevel: 'M' as const,
  color: { dark: '#16141c', light: '#ffffff' },
}

type StoreCodes = {
  ios: string
  android: string
}

let storedCodes: StoreCodes | null = null

export function InstallScreen({ stale }: { stale: boolean }) {
  const [codes, setCodes] = useState<StoreCodes | null>(storedCodes)

  useEffect(() => {
    if (storedCodes) {
      setCodes(storedCodes)
      return
    }
    let cancelled = false
    void Promise.all([
      QRCode.toString(IOS_STORE_URL, qrOptions),
      QRCode.toString(ANDROID_STORE_URL, qrOptions),
    ]).then(([ios, android]) => {
      const next = { ios: svgMarkup(ios), android: svgMarkup(android) }
      storedCodes = next
      if (!cancelled) {
        setCodes(next)
      }
    })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="install">
      <div className="install-stores">
        <StoreCard
          qrLabel="QR-Code für den App Store"
          markup={codes?.ios}
          badge={<AppStoreBadge />}
        />
        <div className="install-mark">
          <img className="install-logo" src={logo} alt="" />
          <h1>ClimbingTrack</h1>
          <p>App installieren</p>
          {stale ? <p className="stale">Die letzte Liste bleibt stehen.</p> : null}
        </div>
        <StoreCard
          qrLabel="QR-Code für Google Play"
          markup={codes?.android}
          badge={<PlayStoreBadge />}
        />
      </div>
    </div>
  )
}

function StoreCard({
  qrLabel,
  markup,
  badge,
}: {
  qrLabel: string
  markup: string | undefined
  badge: ReactNode
}) {
  return (
    <section className="store">
      {markup ? (
        <div className="qr" role="img" aria-label={qrLabel} dangerouslySetInnerHTML={{ __html: markup }} />
      ) : (
        <div className="qr qr-waiting" aria-hidden="true" />
      )}
      {badge}
    </section>
  )
}

function AppStoreBadge() {
  return (
    <a className="store-badge" href={IOS_STORE_URL} tabIndex={-1}>
      <svg className="store-logo" viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="currentColor"
          d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"
        />
      </svg>
      <span className="store-badge-text">
        <span className="store-badge-kicker">Laden im</span>
        <span className="store-badge-name">App Store</span>
      </span>
    </a>
  )
}

function PlayStoreBadge() {
  return (
    <a className="store-badge" href={ANDROID_STORE_URL} tabIndex={-1}>
      <svg className="store-logo" viewBox="0 0 24 24" aria-hidden="true">
        <path fill="#34A853" d="M3.2 20.6 13.4 12 3.2 3.4v17.2z" />
        <path fill="#4285F4" d="M16.7 14.6 13.4 12l3.3-2.6 3.2 1.8c.7.4.7 1.4 0 1.8l-3.2 1.6z" />
        <path fill="#FBBC04" d="M3.2 20.6c.3.5.9.7 1.4.4l9.4-5.4-3.2-3.2-7.6 8.2z" />
        <path fill="#EA4335" d="M4.6 3c-.5-.3-1.1-.1-1.4.4l7.6 8.2 3.2-3.2L4.6 3z" />
      </svg>
      <span className="store-badge-text">
        <span className="store-badge-kicker">Jetzt bei</span>
        <span className="store-badge-name">Google Play</span>
      </span>
    </a>
  )
}

function svgMarkup(svg: string): string {
  return svg.replace(/^<\?xml[^>]*>\s*/i, '')
}
