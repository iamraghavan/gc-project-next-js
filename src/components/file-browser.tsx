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

export type FileItem = {
  id: string
  name: string
  type: "folder" | "image" | "pdf" | "markdown" | "archive" | "file"
  size: string
  lastModified: string
  tags: string[]
  path: string
}

const fileIcons = {
  folder: <Folder className="h-5 w-5" />,
  image: <ImageIcon className="h-5 w-5" />,
  pdf: <FileText className="h-5 w-5 text-destructive" />,
  markdown: <FileText className="h-5 w-5" />,
  archive: <FileArchive className="h-5 w-5" />,
  file: <FileIcon className="h-5 w-5" />,
}

export function FileBrowser({
  files,
  selectedFile,
  onFileSelect,
}: {
  files: FileItem[]
  selectedFile: FileItem | null
  onFileSelect: (file: FileItem | null) => void
}) {
  return (
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
          {files.map((file) => (
            <TableRow
              key={file.id}
              className="cursor-pointer"
              data-selected={selectedFile?.id === file.id}
              onClick={() => onFileSelect(file)}
            >
              <TableCell>
                <Checkbox checked={selectedFile?.id === file.id} />
              </TableCell>
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  {fileIcons[file.type]}
                  <span>{file.name}</span>
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
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Edit className="mr-2 h-4 w-4" />
                      Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Copy className="mr-2 h-4 w-4" />
                      Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                       <Move className="mr-2 h-4 w-4" />
                       Move
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Star className="mr-2 h-4 w-4" />
                      Add to favorites
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive">
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
  )
}
