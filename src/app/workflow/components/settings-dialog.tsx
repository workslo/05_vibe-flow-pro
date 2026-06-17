'use client';

import { Moon, Settings2, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import React, { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

function SettingsItem({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-row items-center justify-between rounded-lg border p-4 mb-2">
      <div className="space-y-0.5">
        <span className="text-base font-bold">{title}</span>
        <p>{description}.</p>
      </div>
      {children}
    </div>
  );
}

export function SettingsDialog() {
  const { setTheme } = useTheme();
  const [isSettingsOpen, setSettingsOpen] = useState(false);

  return (
    <Dialog open={isSettingsOpen} onOpenChange={setSettingsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="w-full border-sidebar-border bg-sidebar-accent text-sidebar-accent-foreground hover:bg-sidebar-accent/80 hover:text-sidebar-accent-foreground"
        >
          <Settings2 className="w-4 h-4 shrink-0" />
          <span>Settings</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="mb-2">Vibe Flow Pro settings</DialogTitle>
        </DialogHeader>

        <SettingsItem
          title="Color mode"
          description="Choose the theme used by the workflow console."
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <Sun className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
                <Moon className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
                <span className="sr-only">Toggle theme</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTheme('light')}>
                Light
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('dark')}>
                Dark
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('system')}>
                System
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SettingsItem>
      </DialogContent>
    </Dialog>
  );
}
