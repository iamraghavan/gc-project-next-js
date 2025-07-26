"use client"

import * as React from "react"
import {
  File as FileIcon,
  FileArchive,
  FileText,
  Folder,
  ImageIcon,
  MoreVertical,
  Star,
  Trash2,
  Edit,
  Move,
  Copy,
  Loader,
} from "lucide-react"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "./ui/button"
import { Skeleton } from "./ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Input } from "./ui/input"
import { useToast } from "@/hooks/use-toast"
import { Repository, deleteItem, moveOrRenameItem, duplicateItem, toggleFavorite, getFileMetadata } from "@/services/github"

export type FileItem = {
  id: string
  name: string
  type: "folder" | "image" | "pdf" | "markdown" | "archive" | "file"
  size: string
  lastModified: string
  tags: string[]
  path: string
  sha: string;
  isFavorite?: boolean;
}

const fileIcons = {
  folder: <Folder className="h-5 w-5" />,
  image: <ImageIcon className="h-5 w-5" />,
  pdf: <FileText className="h-5 w-5 text-destructive" />,
  markdown: <FileText className="h-5 w-5" />,
  archive: <FileArchive className="h-5 w-5" />,
  file: <FileIcon className="h-5 w-5" />,
}

function ActionDialog({
  isOpen,
  onOpenChange,
  title,
  description,
  inputLabel,
  initialValue,
  onAction,
  actionLabel,
}: {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  inputLabel: string
  initialValue: string
  onAction: (value: string) => Promise<void>
  actionLabel: string
}) {
  const [value, setValue] = React.useState(initialValue)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  React.useEffect(() => {
    if (isOpen) {
      setValue(initialValue)
    }
  }, [isOpen, initialValue])

  const handleSubmit = async () => {
    setIsSubmitting(true)
    await onAction(value)
    setIsSubmitting(false)
    onOpenChange(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-2">
          <label htmlFor="name" className="text-sm font-medium">
            {inputLabel}
          </label>
          <Input id="name" value={value} onChange={(e) => setValue(e.target.value)} />
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting && <Loader className="mr-2 h-4 w-4 animate-spin" />}
            {actionLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function FileBrowser({
  files,
  selectedFile,
  onFileSelect,
  isLoading = false,
  repo,
  onRefresh,
  currentPath,
}: {
  files: FileItem[]
  selectedFile: FileItem | null
  onFileSelect: (file: FileItem | null) => void
  isLoading?: boolean
  repo: Repository | null
  onRefresh: () => void
  currentPath: string[]
}) {
  const { toast } = useToast()
  const [actionFile, setActionFile] = React.useState<FileItem | null>(null)
  const [isRenameOpen, setIsRenameOpen] = React.useState(false)
  const [isMoveOpen, setIsMoveOpen] = React.useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false)

  const handleRowClick = (file: FileItem) => {
    onFileSelect(file)
  }
  
  const handleAction = (
    e: React.MouseEvent,
    file: FileItem,
    action: "rename" | "move" | "delete" | "duplicate" | "favorite"
  ) => {
    e.stopPropagation()
    setActionFile(file)
    if (action === "rename") setIsRenameOpen(true)
    if (action === "move") setIsMoveOpen(true)
    if (action === "delete") setIsDeleteOpen(true)
    if (action === "duplicate") handleDuplicate(file)
    if (action === "favorite") handleToggleFavorite(file)
  }

  const handleRename = async (newName: string) => {
    if (!repo || !actionFile) return
    const newPath = [...currentPath, newName].join('/')
    try {
      await moveOrRenameItem(repo.full_name, actionFile.path, newPath)
      toast({ title: "Renamed successfully" })
      onRefresh()
    } catch (error) {
      toast({ title: "Rename failed", description: (error as Error).message, variant: "destructive" })
    }
  }

  const handleMove = async (newPath: string) => {
    if (!repo || !actionFile) return
    try {
      await moveOrRenameItem(repo.full_name, actionFile.path, newPath)
      toast({ title: "Moved successfully" })
      onRefresh()
    } catch (error) {
      toast({ title: "Move failed", description: (error as Error).message, variant: "destructive" })
    }
  }

  const handleDelete = async () => {
    if (!repo || !actionFile) return
    try {
      await deleteItem(repo.full_name, actionFile.path, actionFile.sha, actionFile.type === 'folder')
      toast({ title: "Deleted successfully" })
      if (selectedFile?.id === actionFile.id) {
        onFileSelect(null)
      }
      onRefresh()
    } catch (error) {
      toast({ title: "Delete failed", description: (error as Error).message, variant: "destructive" })
    }
    setIsDeleteOpen(false)
  }

  const handleDuplicate = async (file: FileItem) => {
      if (!repo) return;
      try {
          await duplicateItem(repo.full_name, file.path);
          toast({ title: "Duplicated successfully" });
          onRefresh();
      } catch (error) {
          toast({ title: "Duplicate failed", description: (error as Error).message, variant: "destructive" });
      }
  }

  const handleToggleFavorite = async (file: FileItem) => {
      if (!repo) return;
      try {
          await toggleFavorite(repo.full_name, file.path);
          toast({ title: file.isFavorite ? "Removed from favorites" : "Added to favorites" });
          onRefresh();
      } catch (error) {
          toast({ title: "Failed to update favorites", description: (error as Error).message, variant: "destructive" });
      }
  }

  return (
    <>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox />
              </TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Last Modified</TableHead>
              <TableHead>Tags</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Skeleton className="h-4 w-4" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-[200px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-[80px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-[120px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-[150px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-4" />
                  </TableCell>
                </TableRow>
              ))}
            {!isLoading && files.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No files or folders in this directory.
                </TableCell>
              </TableRow>
            )}
            {!isLoading &&
              files.map((file) => (
                <TableRow
                  key={file.id}
                  className="cursor-pointer"
                  data-selected={selectedFile?.id === file.id}
                  onClick={() => handleRowClick(file)}
                >
                  <TableCell>
                    <Checkbox checked={selectedFile?.id === file.id} />
                  </TableCell>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {fileIcons[file.type as keyof typeof fileIcons] || fileIcons["file"]}
                      <span>{file.name}</span>
                       {file.isFavorite && <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />}
                    </div>
                  </TableCell>
                  <TableCell>{file.size}</TableCell>
                  <TableCell>{file.lastModified}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {file.tags.map((tag) => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenuItem onSelect={(e) => handleAction(e, file, "rename")}>
                          <Edit className="mr-2 h-4 w-4" />
                          Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={(e) => handleAction(e, file, "duplicate")}>
                          <Copy className="mr-2 h-4 w-4" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={(e) => handleAction(e, file, "move")}>
                          <Move className="mr-2 h-4 w-4" />
                          Move
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={(e) => handleAction(e, file, "favorite")}>
                          <Star className="mr-2 h-4 w-4" />
                          {file.isFavorite ? "Remove from favorites" : "Add to favorites"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onSelect={(e) => handleAction(e, file, "delete")}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>

      {actionFile && (
        <>
          <ActionDialog
            isOpen={isRenameOpen}
            onOpenChange={setIsRenameOpen}
            title={`Rename ${actionFile.name}`}
            description="Enter the new name for the item."
            inputLabel="New Name"
            initialValue={actionFile.name}
            onAction={handleRename}
            actionLabel="Rename"
          />
          <ActionDialog
            isOpen={isMoveOpen}
            onOpenChange={setIsMoveOpen}
            title={`Move ${actionFile.name}`}
            description="Enter the new path for the item (e.g., 'documents/new-folder'). Paths are relative to the repository root."
            inputLabel="New Path"
            initialValue={actionFile.path}
            onAction={handleMove}
            actionLabel="Move"
          />
           <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Are you sure you want to delete?</DialogTitle>
                    <DialogDescription>
                        This will permanently delete "{actionFile.name}". This action cannot be undone.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button variant="destructive" onClick={handleDelete}>Delete</Button>
                </DialogFooter>
            </DialogContent>
           </Dialog>
        </>
      )}
    </>
  )
}
