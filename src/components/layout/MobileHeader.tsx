'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Menu, X } from 'lucide-react'
import { Sidebar } from './Sidebar'

interface MobileHeaderProps {
  signOutAction: () => Promise<void>
}

export function MobileHeader({ signOutAction }: MobileHeaderProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <>
      {/* Slim top bar — D-12: visible below 1024px */}
      <header className="flex lg:hidden items-center justify-between h-12 px-4 bg-velocity-black">
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          className="text-velocity-white p-1 rounded-md hover:bg-[rgba(242,242,242,0.06)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-velocity-lime"
          aria-label="Abrir menu de navegacao"
        >
          <Menu size={24} />
        </button>

        <Image
          src="/logo/velocity-icon.svg"
          alt="Velocity"
          width={32}
          height={32}
        />

        {/* Spacer to center logo */}
        <div className="w-8" aria-hidden="true" />
      </header>

      {/* Overlay sidebar — D-12 */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-velocity-black-deep/80"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />

          {/* Sidebar panel */}
          <div className="fixed inset-y-0 left-0 w-60 animate-slide-in">
            <div className="relative h-full">
              {/* Close button */}
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                className="absolute top-4 right-4 text-velocity-white p-1 rounded-md hover:bg-[rgba(242,242,242,0.06)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-velocity-lime z-10"
                aria-label="Fechar menu de navegacao"
              >
                <X size={20} />
              </button>

              <Sidebar signOutAction={signOutAction} />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
