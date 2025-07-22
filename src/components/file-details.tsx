"use client"

import Image from "next/image"
import * as React from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { FileItem } from "./file-browser"
import { Copy, Download, QrCode, X, File as FileIcon } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "./ui/input"
import { Repository, saveFileMetadata } from "@/services/github"
import { useToast } from "@/hooks/use-toast"

function FilePreview({ file, repo }: { file: FileItem, repo: Repository | null }) {
  const rawUrl = repo ? `https://raw.githubusercontent.com/${repo.full_name}/main/${file.path}` : ''

  if (file.type === "image") {
     return <Image src={rawUrl} alt={`Preview of ${file.name}`} width={600} height={400} className="rounded-lg object-cover" data-ai-hint={`photo ${file.name}`} />
  }

  return (
    <div className="flex h-[400px] flex-col items-center justify-center rounded-lg bg-secondary/50">
        <FileIcon className="w-16 h-16 text-muted-foreground" />
        <p className="text-lg font-medium mt-4">{file.name}</p>
        <p className="text-sm text-muted-foreground">{file.size}</p>
    </div>
  )
}

export function FileDetails({ file, repo }: { file: FileItem | null, repo: Repository | null }) {
  const { toast } = useToast();
  
  if (!file || !repo) {
    return (
      <Card className="h-full flex items-center justify-center">
        <CardContent className="text-center">
          <p className="text-muted-foreground">Select a file to see details</p>
        </CardContent>
      </Card>
    )
  }
  
  const rawUrl = `https://raw.githubusercontent.com/${repo.full_name}/main/${file.path}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(rawUrl)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(rawUrl);
    toast({
      title: "Copied to clipboard!",
      description: "The public CDN link has been copied.",
    })
  }
  
  const handleSetExpiration = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      const expirationDate = formData.get('expirationDate') as string;

      try {
          await saveFileMetadata(repo.full_name, file.path, { expiration: expirationDate || null });
          toast({
              title: "Success",
              description: "File expiration has been set.",
          });
      } catch (error) {
          toast({
              title: "Error",
              description: "Failed to set file expiration.",
              variant: "destructive"
          });
      }
  }


  return (
    <Card className="h-full overflow-auto">
      <CardHeader>
        <FilePreview file={file} repo={repo} />
        <CardTitle className="pt-4">{file.name}</CardTitle>
        <CardDescription>
          {file.type.charAt(0).toUpperCase() + file.type.slice(1)} - {file.size}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Public CDN Link</h3>
            <div className="flex items-center gap-2">
              <Input readOnly value={rawUrl} className="bg-secondary"/>
              <Button variant="outline" size="icon" onClick={handleCopy}><Copy className="h-4 w-4" /></Button>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="icon"><QrCode className="h-4 w-4" /></Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-xs">
                  <DialogHeader>
                    <DialogTitle>QR Code for {file.name}</DialogTitle>
                  </DialogHeader>
                  <div className="flex items-center justify-center p-4">
                     {qrUrl && <Image src={qrUrl} width={150} height={150} alt="QR Code" />}
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {file.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="flex items-center gap-1 pr-1">
                  {tag}
                  <button className="rounded-full hover:bg-muted p-0.5"><X className="h-3 w-3" /></button>
                </Badge>
              ))}
               <Input placeholder="Add tag..." className="h-8 w-auto flex-1 min-w-[100px]" />
            </div>
          </div>
          
           <form onSubmit={handleSetExpiration}>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">File Expiration</h3>
            <div className="flex items-center gap-2">
                <Input type="date" name="expirationDate" className="w-auto" />
                <Button variant="outline" type="submit">Set Expiration</Button>
            </div>
             <p className="text-xs text-muted-foreground mt-2">Leave blank for no expiration.</p>
          </form>
        </div>
      </CardContent>
    </Card>
  )
}
