import { useState } from 'react'
import { useScrolled } from '../hooks/useScrolled'
import { useAuth } from '../context/AuthContext'

export default function Nav({ onOpenAuth }) {
  const scrolled = useScrolled(40)
  const [menuOpen, setMenuOpen] = useState(false)
  const { user, signOut } = useAuth()

  const closeMenu = () => setMenuOpen(false)

  return (
    <>
      <nav className={scrolled ? 'scrolled' : ''}>
        <a className="nav-logo wm" href="#top">
          <b>PRO</b>CESS
        </a>
        <div className="nav-menu">
          <a href="#lecture">강의</a>
          <a href="#studio">스튜디오</a>
          <a href="#app">앱</a>
        </div>
        <div className="nav-right">
          {user ? (
            <button className="nav-login" onClick={signOut}>
              로그아웃
            </button>
          ) : (
            <button className="nav-login" onClick={onOpenAuth}>
              로그인
            </button>
          )}
          <a className="btn btn-primary" href="course.html">
            강의 신청
          </a>
          <button
            className="nav-burger"
            aria-label="메뉴"
            onClick={() => setMenuOpen(true)}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </nav>

      {menuOpen && (
        <div className="mobile-menu">
          <button
            className="mm-close"
            aria-label="닫기"
            onClick={closeMenu}
          >
            ×
          </button>
          <a href="#lecture" onClick={closeMenu}>
            강의
          </a>
          <a href="#studio" onClick={closeMenu}>
            스튜디오
          </a>
          <a href="#app" onClick={closeMenu}>
            앱
          </a>
          {user ? (
            <button
              onClick={() => {
                signOut()
                closeMenu()
              }}
            >
              로그아웃
            </button>
          ) : (
            <button
              onClick={() => {
                onOpenAuth()
                closeMenu()
              }}
            >
              로그인
            </button>
          )}
        </div>
      )}
    </>
  )
}
