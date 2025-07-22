"use client"

import Image from "next/image"
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
import { Separator } from "@/components/ui/separator"
import type { FileItem } from "./file-browser"
import { Copy, Download, QrCode, X } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "./ui/input"
import { Textarea } from "./ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"

const fileTypePlaceholders: Record<FileItem["type"], string> = {
  image: "https://placehold.co/600x400.png",
  pdf: "https://placehold.co/600x400.png",
  markdown: "https://placehold.co/600x400.png",
  archive: "https://placehold.co/600x400.png",
  folder: "https://placehold.co/600x400.png",
  file: "https://placehold.co/600x400.png",
}
const fileTypeHints: Record<FileItem["type"], string> = {
  image: "abstract",
  pdf: "document",
  markdown: "text editor",
  archive: "zip file",
  folder: "folder icon",
  file: "file icon",
}


function FilePreview({ file }: { file: FileItem }) {
  const src = file.type === "image" ? `https://placehold.co/600x400.png` : fileTypePlaceholders[file.type]
  const hint = file.type === "image" ? `photo ${file.name}` : fileTypeHints[file.type]
  
  if (file.type === "image") {
     return <Image src={src} alt={`Preview of ${file.name}`} width={600} height={400} className="rounded-lg object-cover" data-ai-hint={hint} />
  }

  if (file.type === 'pdf') {
      return (
          <div className="flex h-[400px] flex-col items-center justify-center rounded-lg bg-secondary">
              <p className="text-lg font-medium">PDF Preview</p>
              <p className="text-sm text-muted-foreground">PDF preview is not available.</p>
              <Button variant="outline" className="mt-4"><Download className="mr-2 h-4 w-4"/>Download PDF</Button>
          </div>
      )
  }

  return <Image src={src} alt={`Preview of ${file.name}`} width={600} height={400} className="rounded-lg object-cover" data-ai-hint={hint} />
}


export function FileDetails({ file }: { file: FileItem | null }) {
  if (!file) {
    return (
      <Card className="h-full flex items-center justify-center">
        <CardContent className="text-center">
          <p className="text-muted-foreground">Select a file to see details</p>
        </CardContent>
      </Card>
    )
  }
  
  const rawUrl = `https://raw.githubusercontent.com/user/repo/main/${file.name}`
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(rawUrl)}`;


  return (
    <Card className="h-full overflow-auto">
      <CardHeader>
        <FilePreview file={file} />
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
              <Button variant="outline" size="icon"><Copy className="h-4 w-4" /></Button>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="icon"><QrCode className="h-4 w-4" /></Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-xs">
                  <DialogHeader>
                    <DialogTitle>QR Code for {file.name}</DialogTitle>
                  </DialogHeader>
                  <div className="flex items-center justify-center p-4">
                     <Image src={qrUrl} width={150} height={150} alt="QR Code" />
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
          
           <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">File Expiration</h3>
            <div className="flex items-center gap-2">
                <Input type="date" className="w-auto" />
                <Button variant="outline">Set Expiration</Button>
            </div>
             <p className="text-xs text-muted-foreground mt-2">Leave blank for no expiration.</p>
          </div>

          <Separator />
          
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Comments</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Avatar className="h-8 w-8 border">
                    <AvatarImage src="https://placehold.co/40x40.png" data-ai-hint="person avatar" />
                    <AvatarFallback>JD</AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <p className="font-medium text-sm">Jane Doe</p>
                  <p className="text-sm text-muted-foreground">This looks great! Just one minor tweak suggestion.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Avatar className="h-8 w-8 border">
                    <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
                    <AvatarFallback>CN</AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-2">
                    <Textarea placeholder="Add a comment..." />
                    <Button>Post Comment</Button>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Version History</h3>
            <ul className="space-y-3">
              <li className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="text-sm">
                        <p className="font-medium">Updated to v3</p>
                        <p className="text-muted-foreground text-xs">user123 pushed a commit</p>
                    </div>
                </div>
                <span className="text-xs text-muted-foreground">3 hours ago</span>
              </li>
               <li className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="text-sm">
                        <p className="font-medium">Fixed typo</p>
                        <p className="text-muted-foreground text-xs">user123 pushed a commit</p>
                    </div>
                </div>
                <span className="text-xs text-muted-foreground">1 day ago</span>
              </li>
               <li className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="text-sm">
                        <p className="font-medium">Initial upload</p>
                        <p className="text-muted-foreground text-xs">you pushed a commit</p>
                    </div>
                </div>
                <span className="text-xs text-muted-foreground">5 days ago</span>
              </li>
            </ul>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="outline" className="w-full">
            <Download className="mr-2 h-4 w-4" /> Download File
        </Button>
      </CardFooter>
    </Card>
  )
}
