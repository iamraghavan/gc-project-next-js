"use client"

import * as React from "react"
import { FileBrowser, type FileItem } from "@/components/file-browser"
import { FileDetails } from "@/components/file-details"
import RepoSwitcher from "@/components/repo-switcher"
import { Button } from "@/components/ui/button"
import { Upload, FolderPlus, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"


const mockFiles: FileItem[] = [
  { id: "1", name: "Project Documents", type: "folder", size: "3.2 GB", lastModified: "2 hours ago", tags: [] },
  { id: "2", name: "logo-design.png", type: "image", size: "1.2 MB", lastModified: "5 hours ago", tags: ["design", "logo"] },
  { id: "3", name: "roadmap.pdf", type: "pdf", size: "5.6 MB", lastModified: "1 day ago", tags: ["planning", "docs"] },
  { id: "4", name: "README.md", type: "markdown", size: "12 KB", lastModified: "3 days ago", tags: ["docs"] },
  { id: "5", name: "website-backup.zip", type: "archive", size: "256 MB", lastModified: "1 week ago", tags: ["backup"] },
  { id: "6", name: "notes.txt", type: "file", size: "5 KB", lastModified: "2 weeks ago", tags: [] },
  { id: "7", name: "landing-page.jpg", type: "image", size: "4.8 MB", lastModified: "1 month ago", tags: ["website", "design"] },
]


export default function FilesPage() {
  const [selectedFile, setSelectedFile] = React.useState<FileItem | null>(mockFiles[1])
  const [isUploading, setIsUploading] = React.useState(false);
  const [uploadProgress, setUploadProgress] = React.useState(0);

  const handleUpload = () => {
    setIsUploading(true);
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setUploadProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        setTimeout(() => {
            setIsUploading(false);
            setUploadProgress(0);
        }, 1000)
      }
    }, 200);
  }

  return (
    <main className="flex-1 flex flex-col p-4 gap-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <RepoSwitcher />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem><BreadcrumbLink href="/">root</BreadcrumbLink></BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem><BreadcrumbLink href="/docs">documents</BreadcrumbLink></BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem><BreadcrumbLink href="/docs/project">project</BreadcrumbLink></BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <div className="flex items-center gap-2">
            <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search files..." className="pl-8 sm:w-[250px]" />
            </div>
          <Button variant="outline"><FolderPlus className="mr-2 h-4 w-4" /> New Folder</Button>
          <Dialog>
            <DialogTrigger asChild>
                <Button><Upload className="mr-2 h-4 w-4" /> Upload</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Upload Files</DialogTitle>
                    <DialogDescription>Drag and drop files here or click to browse. Files will be uploaded to the current repository.</DialogDescription>
                </DialogHeader>
                {!isUploading ? (
                    <div className="h-48 border-2 border-dashed rounded-lg flex items-center justify-center text-muted-foreground cursor-pointer">
                        <p>Drag 'n' drop some files here, or click to select files</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        <p>Uploading...</p>
                        <Progress value={uploadProgress} />
                        <p className="text-sm text-muted-foreground text-center">{uploadProgress}%</p>
                    </div>
                )}
                <DialogFooter>
                    <Button variant="outline">Cancel</Button>
                    <Button onClick={handleUpload} disabled={isUploading}>Upload</Button>
                </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1">
        <div className="lg:col-span-2">
          <FileBrowser files={mockFiles} selectedFile={selectedFile} onFileSelect={setSelectedFile} />
        </div>
        <div className="lg:col-span-1">
          <FileDetails file={selectedFile} />
        </div>
      </div>
    </main>
  )
}
