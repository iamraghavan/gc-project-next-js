"use client"

import * as React from "react"
import { ChevronsUpDown, Check, PlusCircle } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { GitDriveLogo } from "./icons"

const repositories = [
  {
    value: "personal-website",
    label: "Personal Website",
  },
  {
    value: "project-assets",
    label: "Project Assets",
  },
  {
    value: "backup-storage",
    label: "Backup Storage",
  },
]

type PopoverTriggerProps = React.ComponentPropsWithoutRef<typeof PopoverTrigger>

interface RepoSwitcherProps extends PopoverTriggerProps {}

export default function RepoSwitcher({ className }: RepoSwitcherProps) {
  const [open, setOpen] = React.useState(false)
  const [selectedRepo, setSelectedRepo] = React.useState<string>("project-assets")

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label="Select a repository"
          className={cn("w-[250px] justify-between", className)}
        >
          <GitDriveLogo className="mr-2 h-5 w-5" />
          {repositories.find((repo) => repo.value === selectedRepo)?.label}
          <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[250px] p-0">
        <Command>
          <CommandList>
            <CommandInput placeholder="Search repository..." />
            <CommandEmpty>No repository found.</CommandEmpty>
            <CommandGroup>
              {repositories.map((repo) => (
                <CommandItem
                  key={repo.value}
                  onSelect={(currentValue) => {
                    setSelectedRepo(currentValue === selectedRepo ? "" : currentValue)
                    setOpen(false)
                  }}
                >
                  <GitDriveLogo className="mr-2 h-5 w-5" />
                  {repo.label}
                  <Check
                    className={cn(
                      "ml-auto h-4 w-4",
                      selectedRepo === repo.value
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
          <CommandSeparator />
          <CommandList>
            <CommandGroup>
              <CommandItem
                onSelect={() => {
                  setOpen(false)
                }}
              >
                <PlusCircle className="mr-2 h-5 w-5" />
                Create Repository
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
