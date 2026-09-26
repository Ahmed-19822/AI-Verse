// Lightweight toast notification system
let toastContainer = null

function getContainer() {
  if (toastContainer) return toastContainer
  toastContainer = document.createElement('div')
  toastContainer.style.cssText = `
    position: fixed; top: 20px; right: 20px; z-index: 9999;
    display: flex; flex-direction: column; gap: 8px;
    pointer-events: none;
  `
  document.body.appendChild(toastContainer)
  return toastContainer
}

function show(message, type = 'info') {
  const container = getContainer()
  const toast = document.createElement('div')
  const colors = { success: '#00F0D8', error: '#FF3CAC', info: '#7C5CFF' }
  toast.style.cssText = `
    background: rgba(18,12,36,0.95); border: 1px solid ${colors[type]}40;
    color: #ECE9FF; padding: 12px 16px; border-radius: 12px;
    font-size: 14px; font-family: 'General Sans', sans-serif;
    box-shadow: 0 0 20px ${colors[type]}30;
    pointer-events: all; opacity: 0; transform: translateX(20px);
    transition: all 0.3s ease; max-width: 300px;
    border-left: 3px solid ${colors[type]};
  `
  toast.textContent = message
  container.appendChild(toast)
  setTimeout(() => { toast.style.opacity = '1'; toast.style.transform = 'translateX(0)' }, 10)
  setTimeout(() => {
    toast.style.opacity = '0'; toast.style.transform = 'translateX(20px)'
    setTimeout(() => toast.remove(), 300)
  }, 3500)
}

export const toast = {
  success: (msg) => show(msg, 'success'),
  error: (msg) => show(msg, 'error'),
  info: (msg) => show(msg, 'info'),
}
