import scannerBeepUrl from '../assets/sounds/store-scanner-beep.mp3'

/** Retail scanner beep when a product is added to the POS bill. */
export function playPosAddSound() {
  if (typeof window === 'undefined') return

  const audio = new Audio(scannerBeepUrl)
  audio.volume = 0.75
  audio.play().catch(() => {})
}
