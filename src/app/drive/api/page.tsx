
"use client"

import * as React from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Server, KeyRound, Copy, Eye, EyeOff, FileText, FileUp, Pencil, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import RepoSwitcher from "@/components/repo-switcher"
import { type Repository } from "@/services/github"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function ApiPage() {
  const { toast } = useToast()
  const [baseUrl, setBaseUrl] = React.useState("")
  const [selectedRepo, setSelectedRepo] = React.useState<Repository | null>(null)
  const [path, setPath] = React.useState("path/to/your/file.txt")
  const [apiKey, setApiKey] = React.useState("bumblebees-bxkl50bygE4hB4YntB6hvoJ9a6eoa")
  const [isKeyVisible, setIsKeyVisible] = React.useState(false)

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      setBaseUrl(window.location.origin)
    }
  }, [])
  
  const handleCopy = (text: string, message: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: message,
    })
  }

  const endpointUrl = `${baseUrl}/api/upload/${selectedRepo?.full_name || '{OWNER}/{REPO}'}/${path}`
  
  const getCommand = `curl "${endpointUrl}" \\
     -H "Authorization: Bearer ${apiKey}"`

  const postCommand = `curl -X POST "${endpointUrl}" \\
     -H "Authorization: Bearer ${apiKey}" \\
     -H "Content-Type: text/plain" \\
     --data-binary "@/path/to/your/local/file.txt"`
  
  const putCommand = `curl -X PUT "${endpointUrl}" \\
     -H "Authorization: Bearer ${apiKey}" \\
     -H "Content-Type: text/plain" \\
     --data-binary "@/path/to/your/local/file.txt"`

  const deleteCommand = `curl -X DELETE "${endpointUrl}" \\
     -H "Authorization: Bearer ${apiKey}"`


  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">API Access</h2>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <KeyRound className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle>Your API Key</CardTitle>
              <CardDescription>
                Use this key to authenticate your API requests. Keep it secure.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
           <div className="flex items-center gap-2">
              <Input readOnly value={isKeyVisible ? apiKey : "************************************************************"} className="font-mono"/>
              <Button variant="outline" size="icon" onClick={() => setIsKeyVisible(!isKeyVisible)}>
                {isKeyVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              <Button variant="outline" size="icon" onClick={() => handleCopy(apiKey, "API Key copied to clipboard!")}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
        </CardContent>
      </Card>


      <Card>
          <CardHeader>
              <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                  <Server className="h-6 w-6 text-primary" />
              </div>
              <div>
                  <CardTitle>API Endpoint Documentation</CardTitle>
                  <CardDescription>
                  Use the following endpoints to interact with your files.
                  </CardDescription>
              </div>
              </div>
          </CardHeader>
          <CardContent className="space-y-6">
              <div className="space-y-2">
                  <Label htmlFor="repo-switcher">1. Select a Repository</Label>
                  <RepoSwitcher onRepoChange={setSelectedRepo} />
              </div>
              <div className="space-y-2">
                  <Label htmlFor="path">2. Define a Target File Path</Label>
                  <Input id="path" value={path} onChange={(e) => setPath(e.target.value)} />
              </div>
              <p className="text-sm text-muted-foreground pt-4">Your base endpoint URL is: <code className="font-mono bg-secondary p-1 rounded-md">{`${baseUrl}/api/upload/${selectedRepo?.full_name || '{OWNER}/{REPO}'}/{YOUR_FILE_PATH}`}</code></p>
              
              <Tabs defaultValue="post" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="post"><FileUp className="mr-2" />Create</TabsTrigger>
                    <TabsTrigger value="get"><FileText className="mr-2"/>Read</TabsTrigger>
                    <TabsTrigger value="put"><Pencil className="mr-2"/>Update</TabsTrigger>
                    <TabsTrigger value="delete"><Trash2 className="mr-2"/>Delete</TabsTrigger>
                </TabsList>
                
                <TabsContent value="post">
                    <div className="space-y-2 mt-4">
                        <h3 className="font-semibold">Create a new file (POST)</h3>
                        <p className="text-sm text-muted-foreground">Creates a new file at the specified path. If the file exists, it will be overwritten.</p>
                        <div className="relative font-mono text-sm p-3 bg-secondary rounded-md">
                            <pre className="flex-1 break-all overflow-auto pr-10"><code>{postCommand}</code></pre>
                            <Button variant="ghost" size="icon" className="absolute top-2 right-2" onClick={() => handleCopy(postCommand, "cURL command copied!")}><Copy className="h-4 w-4" /></Button>
                        </div>
                    </div>
                </TabsContent>

                 <TabsContent value="get">
                    <div className="space-y-2 mt-4">
                        <h3 className="font-semibold">Read file content (GET)</h3>
                        <p className="text-sm text-muted-foreground">Retrieves the content of a file at the specified path. Note: Currently, our API endpoint is designed for uploads (POST). A dedicated GET endpoint would be structured like this.</p>
                        <div className="relative font-mono text-sm p-3 bg-secondary rounded-md">
                            <pre className="flex-1 break-all overflow-auto pr-10"><code>{getCommand}</code></pre>
                             <Button variant="ghost" size="icon" className="absolute top-2 right-2" onClick={() => handleCopy(getCommand, "cURL command copied!")}><Copy className="h-4 w-4" /></Button>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="put">
                    <div className="space-y-2 mt-4">
                        <h3 className="font-semibold">Update a file (PUT)</h3>
                        <p className="text-sm text-muted-foreground">Updates an existing file. For the GitHub API, this is the same as creating a file, as it overwrites the content.</p>
                        <div className="relative font-mono text-sm p-3 bg-secondary rounded-md">
                            <pre className="flex-1 break-all overflow-auto pr-10"><code>{putCommand}</code></pre>
                            <Button variant="ghost" size="icon" className="absolute top-2 right-2" onClick={() => handleCopy(putCommand, "cURL command copied!")}><Copy className="h-4 w-4" /></Button>
                        </div>
                    </div>
                </TabsContent>

                 <TabsContent value="delete">
                    <div className="space-y-2 mt-4">
                        <h3 className="font-semibold">Delete a file (DELETE)</h3>
                        <p className="text-sm text-muted-foreground">Deletes a file at the specified path. Note: This requires a dedicated DELETE endpoint which is not yet implemented in the template.</p>
                        <div className="relative font-mono text-sm p-3 bg-secondary rounded-md">
                            <pre className="flex-1 break-all overflow-auto pr-10"><code>{deleteCommand}</code></pre>
                            <Button variant="ghost" size="icon" className="absolute top-2 right-2" onClick={() => handleCopy(deleteCommand, "cURL command copied!")}><Copy className="h-4 w-4" /></Button>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
          </CardContent>
      </Card>
    </div>
  )
}
