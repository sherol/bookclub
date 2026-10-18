// The squirrel from design/logo.svg, drawn from the letters b·o·o·k·c·l·u·b.
export function Logo({ size = 44 }: { size?: number }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="135 35 420 380">
      <defs>
        <linearGradient id="lgTail" x1="0%" y1="100%" x2="50%" y2="0%">
          <stop offset="0%" stopColor="#E65100" />
          <stop offset="50%" stopColor="#FF7A00" />
          <stop offset="100%" stopColor="#FFA726" />
        </linearGradient>
        <linearGradient id="lgGold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFE082" />
          <stop offset="50%" stopColor="#FFB300" />
          <stop offset="100%" stopColor="#FF8F00" />
        </linearGradient>
        <linearGradient id="lgBody" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF8A65" />
          <stop offset="100%" stopColor="#D84315" />
        </linearGradient>
      </defs>
      <path d="M 285 365 C 210 365, 145 285, 150 195 C 155 105, 225 50, 310 50 C 385 50, 420 95, 410 155 C 400 215, 345 240, 290 235 C 245 230, 220 195, 230 160 C 240 125, 275 110, 305 125 C 330 138, 335 170, 310 185 C 295 195, 275 185, 275 175" fill="none" stroke="url(#lgTail)" strokeWidth="32" strokeLinecap="round" strokeLinejoin="round"/> <path d="M 320 250 C 320 330, 335 375, 385 375 C 430 375, 440 335, 440 270" fill="none" stroke="url(#lgBody)" strokeWidth="26" strokeLinecap="round"/> <path d="M 275 390 L 375 390 C 410 390, 410 345, 375 345 C 345 345, 340 365, 340 390" fill="none" stroke="url(#lgTail)" strokeWidth="18" strokeLinecap="round"/> <line x1="450" y1="265" x2="450" y2="390" stroke="url(#lgBody)" strokeWidth="22" strokeLinecap="round"/> <path d="M 505 235 C 460 220, 440 240, 445 265 C 450 288, 480 295, 508 280" fill="none" stroke="url(#lgGold)" strokeWidth="18" strokeLinecap="round"/> <circle cx="530" cy="260" r="22" fill="none" stroke="url(#lgGold)" strokeWidth="14"/> <circle cx="465" cy="155" r="38" fill="none" stroke="url(#lgTail)" strokeWidth="24"/> <circle cx="478" cy="150" r="5" fill="#FFE082"/> <path d="M 432 90 L 432 185" stroke="url(#lgGold)" strokeWidth="16" strokeLinecap="round"/> <path d="M 432 140 L 472 82" stroke="url(#lgGold)" strokeWidth="16" strokeLinecap="round"/> <path d="M 432 145 L 515 168" stroke="url(#lgGold)" strokeWidth="15" strokeLinecap="round"/>
    </svg>
  )
}
