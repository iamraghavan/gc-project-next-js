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
  DialogClose,
} from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { type Repository, getRepoContents, createFolder, uploadFile } from "@/services/github"
import { formatDistanceToNow } from "date-fns"
import { useToast } from "@/hooks/use-toast"

export default function FilesPage() {
  const [selectedFile, setSelectedFile] = React.useState<FileItem | null>(null)
  const [isUploading, setIsUploading] = React.useState(false);
  const [uploadProgress, setUploadProgress] = React.useState(0);
  const [files, setFiles] = React.useState<FileItem[]>([])
  const [selectedRepo, setSelectedRepo] = React.useState<Repository | null>(null)
  const [path, setPath] = React.useState<string[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  
  const [newFolderName, setNewFolderName] = React.useState("");
  const [isCreateFolderOpen, setIsCreateFolderOpen] = React.useState(false);
  
  const [filesToUpload, setFilesToUpload] = React.useState<File[]>([]);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = React.useState(false);
  
  const { toast } = useToast();

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const fetchFiles = React.useCallback(() => {
     if (selectedRepo) {
      setIsLoading(true);
      getRepoContents({ repoFullName: selectedRepo.full_name, path: path.join('/') })
        .then(contents => {
            const mappedFiles: FileItem[] = contents.map((item: any) => ({
                id: item.sha,
                name: item.name,
                type: item.type === 'dir' ? 'folder' : 'file',
                size: item.size ? `${(item.size / 1024).toFixed(2)} KB` : '-',
                lastModified: formatDistanceToNow(new Date(), { addSuffix: true }), // This is a placeholder
                tags: [],
                path: item.path,
                sha: item.sha,
            }));
            setFiles(mappedFiles);
        })
        .finally(() => setIsLoading(false));
    }
  }, [selectedRepo, path]);


  React.useEffect(() => {
    fetchFiles();
  }, [fetchFiles])

  const handleUpload = async () => {
    if (!selectedRepo || filesToUpload.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);

    for (let i = 0; i < filesToUpload.length; i++) {
        const file = filesToUpload[i];
        const filePath = [...path, file.name].join('/');
        
        try {
            const content = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = () => resolve((reader.result as string).split(',')[1]);
                reader.onerror = error => reject(error);
            });

            await uploadFile(selectedRepo.full_name, filePath, content);
            setUploadProgress(((i + 1) / filesToUpload.length) * 100);
            
             toast({
              title: "File Uploaded",
              description: `${file.name} has been uploaded successfully.`,
            })

        } catch (error) {
            toast({
                title: "Upload Failed",
                description: `Failed to upload ${file.name}.`,
                variant: "destructive"
            });
        }
    }
    
    setIsUploading(false);
    setFilesToUpload([]);
    setIsUploadDialogOpen(false);
    fetchFiles(); // Refresh file list
  };
  
  const handleCreateFolder = async () => {
    if (!selectedRepo || !newFolderName) return;

    try {
      const folderPath = [...path, newFolderName].join('/');
      await createFolder(selectedRepo.full_name, folderPath);
      toast({
        title: 'Folder Created',
        description: `Folder "${newFolderName}" created successfully.`,
      });
      setNewFolderName('');
      setIsCreateFolderOpen(false);
      fetchFiles(); // Refresh file list
    } catch (error) {
      toast({
        title: 'Error Creating Folder',
        description: (error as Error).message,
        variant: 'destructive',
      });
    }
  };


  const handleFileSelect = (file: FileItem | null) => {
    if (file && file.type === 'folder') {
        setPath([...path, file.name]);
        setSelectedFile(null);
    } else {
        setSelectedFile(file)
    }
  }

  const handleBreadcrumbClick = (index: number) => {
    setPath(path.slice(0, index + 1));
  };


  return (
    <main className="flex-1 flex flex-col p-4 gap-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <RepoSwitcher onRepoChange={setSelectedRepo} />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="#" onClick={() => setPath([])}>
                  root
                </BreadcrumbLink>
              </BreadcrumbItem>
              {path.map((item, index) => (
                <React.Fragment key={index}>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbLink href="#" onClick={() => handleBreadcrumbClick(index)}>
                      {item}
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                </React.Fragment>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <div className="flex items-center gap-2">
            <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search files..." className="pl-8 sm:w-[250px]" />
            </div>
          <Dialog open={isCreateFolderOpen} onOpenChange={setIsCreateFolderOpen}>
            <DialogTrigger asChild>
              <Button variant="outline"><FolderPlus className="mr-2 h-4 w-4" /> New Folder</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Folder</DialogTitle>
                <DialogDescription>Enter a name for the new folder.</DialogDescription>
              </DialogHeader>
              <Input 
                placeholder="Folder name" 
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
              />
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button onClick={handleCreateFolder}>Create</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
            <DialogTrigger asChild>
                <Button onClick={() => setIsUploadDialogOpen(true)}><Upload className="mr-2 h-4 w-4" /> Upload</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Upload Files</DialogTitle>
                    <DialogDescription>Drag and drop files here or click to browse. Files will be uploaded to the current repository.</DialogDescription>
                </DialogHeader>
                {!isUploading ? (
                  <>
                    <div 
                      className="h-48 border-2 border-dashed rounded-lg flex items-center justify-center text-muted-foreground cursor-pointer"
                      onClick={() => fileInputRef.current?.click()}
                    >
                        <p>Drag 'n' drop files here, or click to select</p>
                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            className="hidden"
                            onChange={(e) => setFilesToUpload(Array.from(e.target.files || []))}
                        />
                    </div>
                    {filesToUpload.length > 0 && (
                        <div className="mt-4">
                            <h4 className="font-semibold">Selected files:</h4>
                            <ul className="text-sm list-disc pl-5">
                                {filesToUpload.map(f => <li key={f.name}>{f.name}</li>)}
                            </ul>
                        </div>
                    )}
                  </>
                ) : (
                    <div className="space-y-2">
                        <p>Uploading...</p>
                        <Progress value={uploadProgress} />
                        <p className="text-sm text-muted-foreground text-center">{uploadProgress.toFixed(0)}%</p>
                    </div>
                )}
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleUpload} disabled={isUploading || filesToUpload.length === 0}>
                      {isUploading ? 'Uploading...' : 'Upload'}
                    </Button>
                </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1">
        <div className="lg:col-span-2">
          <FileBrowser 
            files={files} 
            selectedFile={selectedFile} 
            onFileSelect={handleFileSelect} 
            isLoading={isLoading}
            repo={selectedRepo}
            onRefresh={fetchFiles}
            currentPath={path}
          />
        </div>
        <div className="lg:col-span-1">
          <FileDetails file={selectedFile} repo={selectedRepo} />
        </div>
      </div>
    </main>
  )
}
