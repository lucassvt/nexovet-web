export default function WhatsAppFab() {
  const phone = "5493812391001"
  const msg = encodeURIComponent("Hola! Tengo una consulta sobre mi mascota / pedido")
  return (
    <a
      href={`https://wa.me/${phone}?text=${msg}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contactar por WhatsApp"
      className="fixed bottom-5 right-5 md:bottom-8 md:right-8 z-50 w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center shadow-2xl transition-transform hover:scale-110 active:scale-95"
      style={{ background: "#25D366" }}
    >
      <svg viewBox="0 0 24 24" className="w-7 h-7 md:w-9 md:h-9" fill="#fff">
        <path d="M20.52 3.48A11.94 11.94 0 0 0 12 0C5.37 0 .02 5.35.02 11.97c0 2.11.55 4.16 1.6 5.97L0 24l6.17-1.61a11.96 11.96 0 0 0 5.83 1.49h.01c6.62 0 11.97-5.35 11.97-11.97 0-3.2-1.25-6.21-3.46-8.43zM12 21.82h-.01a9.93 9.93 0 0 1-5.06-1.38l-.36-.21-3.66.96.98-3.56-.24-.37a9.9 9.9 0 0 1-1.52-5.29c0-5.48 4.47-9.95 9.97-9.95 2.66 0 5.16 1.04 7.04 2.92a9.88 9.88 0 0 1 2.91 7.04c0 5.48-4.47 9.84-9.95 9.84zm5.47-7.41c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.48-1.76-1.66-2.06-.17-.3-.02-.46.13-.61.13-.13.3-.35.44-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51l-.57-.01c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.88 1.22 3.08.15.2 2.1 3.2 5.1 4.49.71.31 1.27.49 1.7.63.71.23 1.36.2 1.87.12.57-.08 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.07-.12-.27-.2-.57-.35z"/>
      </svg>
    </a>
  )
}
