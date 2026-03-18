'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator
} from '@/components/ui/dropdown-menu'
import { FileText, User, LogOut, CreditCard, ChevronDown, FolderOpen } from 'lucide-react'

interface NavbarProps {
  user: any
  credits?: number
}

export function Navbar({ user, credits = 0 }: NavbarProps) {
  const router = useRouter()
  const supabase = createClient()

  return (
    <header className="border-b bg-card shrink-0">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => router.push(user ? '/dashboard' : '/')}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <FileText className="h-5 w-5 text-primary" />
          <span className="font-semibold text-foreground">Resume Builder</span>
        </button>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <span className="text-sm px-3 py-1 bg-primary/10 text-primary rounded-full font-medium">
                {credits} credits
              </span>

              <ThemeToggle />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <div className="h-6 w-6 rounded-full bg-primary/15 flex items-center justify-center">
                      <User className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <span className="hidden sm:inline max-w-[120px] truncate text-xs">
                      {user.email?.split('@')[0]}
                    </span>
                    <ChevronDown className="h-3 w-3 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span className="text-sm">{user.email?.split('@')[0]}</span>
                      <span className="text-xs font-normal text-muted-foreground truncate">{user.email}</span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />

                  <DropdownMenuItem onClick={() => router.push('/profile')}>
                    <FolderOpen className="text-muted-foreground" />
                    Portfolio
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/account')}>
                    <User className="text-muted-foreground" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/settings')}>
                    <CreditCard className="text-muted-foreground" />
                    <div className="flex-1 flex items-center justify-between">
                      <span>Buy Credits</span>
                      <span className="text-xs text-primary font-medium">{credits} left</span>
                    </div>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    onClick={async () => { await supabase.auth.signOut(); router.push('/') }}
                    className="text-destructive focus:text-destructive"
                  >
                    <LogOut />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <ThemeToggle />
              <Button variant="ghost" size="sm" onClick={() => router.push('/signin')}>Sign In</Button>
              <Button size="sm" onClick={() => router.push('/signup')}>Get Started</Button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
