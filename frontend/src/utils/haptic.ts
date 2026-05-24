export function hapticLight() {
  if (navigator.vibrate) navigator.vibrate(5)
}

export function hapticMedium() {
  if (navigator.vibrate) navigator.vibrate(15)
}

export function hapticHeavy() {
  if (navigator.vibrate) navigator.vibrate(30)
}

export function hapticSelection() {
  if (navigator.vibrate) navigator.vibrate(10)
}
