"use client"

import Image from "next/image"
import * as React from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { FileItem } from "./file-browser"
import { Copy, QrCode, File as FileIcon } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "./ui/input"
import { Repository } from "@/services/github"
import { useToast } from "@/hooks/use-toast"
import { Button } from "./ui/button"

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
  const jsDelivrUrl = `https://cdn.jsdelivr.net/gh/${repo.full_name}@main/${file.path}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(rawUrl)}`;

  const handleCopy = (url: string, message: string) => {
    navigator.clipboard.writeText(url);
    toast({
      title: "Copied to clipboard!",
      description: message,
    })
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
            <h3 className="text-sm font-medium text-muted-foreground mb-2">GitHub CDN Link</h3>
            <div className="flex items-center gap-2">
              <Input readOnly value={rawUrl} className="bg-secondary"/>
              <Button variant="outline" size="icon" onClick={() => handleCopy(rawUrl, "The GitHub CDN link has been copied.")}><Copy className="h-4 w-4" /></Button>
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
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Public Access CDN Link (jsDelivr)</h3>
            <div className="flex items-center gap-2">
              <Input readOnly value={jsDelivrUrl} className="bg-secondary"/>
              <Button variant="outline" size="icon" onClick={() => handleCopy(jsDelivrUrl, "The jsDelivr CDN link has been copied.")}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">A fast, public CDN link provided by jsDelivr.</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
