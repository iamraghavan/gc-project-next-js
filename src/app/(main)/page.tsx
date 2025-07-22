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
import { type Repository } from "@/services/github"


export default function FilesPage() {
  const [selectedFile, setSelectedFile] = React.useState<FileItem | null>(null)
  const [isUploading, setIsUploading] = React.useState(false);
  const [uploadProgress, setUploadProgress] = React.useState(0);
  const [files, setFiles] = React.useState<FileItem[]>([])
  const [selectedRepo, setSelectedRepo] = React.useState<Repository | null>(null)

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
          <RepoSwitcher onRepoChange={setSelectedRepo} />
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
          <FileBrowser files={files} selectedFile={selectedFile} onFileSelect={setSelectedFile} />
        </div>
        <div className="lg:col-span-1">
          <FileDetails file={selectedFile} repo={selectedRepo} />
        </div>
      </div>
    </main>
  )
}
