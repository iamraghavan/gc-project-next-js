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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { createRepository, getRepositories, type Repository } from "@/services/github"


type PopoverTriggerProps = React.ComponentPropsWithoutRef<typeof PopoverTrigger>

interface RepoSwitcherProps extends PopoverTriggerProps {}

export default function RepoSwitcher({ className }: RepoSwitcherProps) {
  const [open, setOpen] = React.useState(false)
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false)
  const [selectedRepo, setSelectedRepo] = React.useState<Repository | null>(null)
  const [repositories, setRepositories] = React.useState<Repository[]>([])
  const [newRepoName, setNewRepoName] = React.useState("")
  const { toast } = useToast()

  React.useEffect(() => {
    getRepositories().then(repos => {
      setRepositories(repos)
      if (repos.length > 0) {
        setSelectedRepo(repos.find(r => r.name === 'gitdrive-data') || repos[0])
      }
    })
  }, [])
  
  const handleCreateRepository = async () => {
    if (!newRepoName) {
      toast({
        title: "Error",
        description: "Repository name cannot be empty.",
        variant: "destructive",
      })
      return
    }

    try {
      const newRepo = await createRepository(newRepoName)
      setRepositories(prev => [...prev, newRepo])
      setSelectedRepo(newRepo)
      setCreateDialogOpen(false)
      setNewRepoName("")
      toast({
        title: "Success",
        description: `Repository "${newRepoName}" created successfully.`,
      })
    } catch (error) {
      toast({
        title: "Error creating repository",
        description: (error as Error).message,
        variant: "destructive",
      })
    }
  }

  return (
    <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-label="Select a repository"
            className={cn("w-[250px] justify-between", className)}
          >
            {selectedRepo ? (
              <>
                <GitDriveLogo className="mr-2 h-5 w-5" />
                {selectedRepo.name}
              </>
            ) : (
              "Select a repository"
            )}
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
                    key={repo.id}
                    value={repo.name}
                    onSelect={() => {
                      setSelectedRepo(repo)
                      setOpen(false)
                    }}
                  >
                    <GitDriveLogo className="mr-2 h-5 w-5" />
                    {repo.name}
                    <Check
                      className={cn(
                        "ml-auto h-4 w-4",
                        selectedRepo?.id === repo.id
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
                 <DialogTrigger asChild>
                  <CommandItem
                    onSelect={() => {
                      setOpen(false)
                      setCreateDialogOpen(true)
                    }}
                  >
                    <PlusCircle className="mr-2 h-5 w-5" />
                    Create Repository
                  </CommandItem>
                </DialogTrigger>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Repository</DialogTitle>
          <DialogDescription>
            Enter a name for your new repository. This will be created on your GitHub account.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Input
            placeholder="my-new-repository"
            value={newRepoName}
            onChange={(e) => setNewRepoName(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateRepository}>Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
