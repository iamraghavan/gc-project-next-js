
"use client"

import * as React from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Server, KeyRound, PlusCircle, Trash2, Eye, EyeOff } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import RepoSwitcher from "@/components/repo-switcher"
import { type Repository } from "@/services/github"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { generateApiKey, getApiKeys, revokeApiKey, type ApiKey } from "@/services/apiKeys"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { format } from "date-fns"
import { auth } from "@/lib/firebase"
import { Copy } from "lucide-react"


export default function ApiPage() {
  const { toast } = useToast()
  const [baseUrl, setBaseUrl] = React.useState("")
  const [selectedRepo, setSelectedRepo] = React.useState<Repository | null>(null)
  const [path, setPath] = React.useState("path/to/your/file.txt")

  const [keys, setKeys] = React.useState<ApiKey[]>([])
  const [isLoadingKeys, setIsLoadingKeys] = React.useState(true)
  const [isGenerating, setIsGenerating] = React.useState(false)
  const [visibleKey, setVisibleKey] = React.useState<string | null>(null)

  const fetchKeys = React.useCallback(async () => {
    setIsLoadingKeys(true);
    try {
      const user = auth.currentUser;
      if (!user) {
          setKeys([]);
          return;
      }
      const userKeys = await getApiKeys()
      setKeys(userKeys)
    } catch (error) {
      toast({ title: "Error fetching API keys", description: (error as Error).message, variant: "destructive"})
    } finally {
      setIsLoadingKeys(false)
    }
  }, [toast])

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      setBaseUrl(window.location.origin)
    }
    
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (user) {
        fetchKeys();
      } else {
        setKeys([]);
        setIsLoadingKeys(false);
      }
    });
    
    return () => unsubscribe();
  }, [fetchKeys])


  const handleGenerateKey = async () => {
    setIsGenerating(true)
    try {
        await generateApiKey();
        toast({ title: "API Key Generated", description: "Your new key is now available."});
        await fetchKeys(); 
    } catch (error) {
        toast({ title: "Failed to generate key", description: (error as Error).message, variant: "destructive"})
    } finally {
        setIsGenerating(false)
    }
  }
  
  const handleRevokeKey = async (keyId: string) => {
    try {
        await revokeApiKey(keyId);
        toast({ title: "API Key Revoked", description: "The key has been successfully deleted."});
        await fetchKeys();
    } catch (error) {
        toast({ title: "Failed to revoke key", description: (error as Error).message, variant: "destructive"})
    }
  }

  const exampleUrl = `${baseUrl}/api/upload/${selectedRepo?.full_name || '{OWNER}/{REPO}'}/${path}`
  const curlCommand = `curl -X POST "${exampleUrl}" \\
     -H "Authorization: Bearer {YOUR_API_KEY}" \\
     -H "Content-Type: text/plain" \\
     --data-binary "@/path/to/your/local/file.txt"`

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied to clipboard!",
    })
  }

  const toggleVisibility = (keyId: string) => {
    if (visibleKey === keyId) {
        setVisibleKey(null)
    } else {
        setVisibleKey(keyId)
    }
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">API Access</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
            <CardHeader>
                <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                    <Server className="h-6 w-6 text-primary" />
                </div>
                <div>
                    <CardTitle>File Upload Endpoint</CardTitle>
                    <CardDescription>
                    Build your API endpoint to upload files.
                    </CardDescription>
                </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="repo-switcher">1. Select Repository</Label>
                    <RepoSwitcher onRepoChange={setSelectedRepo} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="path">2. Define File Path</Label>
                    <Input id="path" value={path} onChange={(e) => setPath(e.target.value)} />
                </div>

                <div className="space-y-2">
                    <h3 className="font-semibold">Your Generated Endpoint URL</h3>
                    <div className="flex items-center gap-2 font-mono text-sm p-3 bg-secondary rounded-md">
                    <span className="flex-1 break-all">
                        POST {exampleUrl}
                    </span>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleCopy(exampleUrl)}
                    >
                        <Copy className="h-4 w-4" />
                    </Button>
                    </div>
                </div>

                <div className="space-y-2">
                    <h3 className="font-semibold">Example Usage (cURL)</h3>
                    <div className="relative font-mono text-sm p-3 bg-secondary rounded-md">
                    <pre className="flex-1 break-all overflow-auto pr-10">
                        <code>{curlCommand}</code>
                    </pre>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={() => handleCopy(curlCommand)}
                    >
                        <Copy className="h-4 w-4" />
                    </Button>
                    </div>
                </div>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                    <KeyRound className="h-6 w-6 text-primary" />
                </div>
                <div>
                    <CardTitle>API Keys</CardTitle>
                    <CardDescription>
                        Manage API keys to use with the upload endpoint.
                    </CardDescription>
                </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                 <Button onClick={handleGenerateKey} disabled={isGenerating}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    {isGenerating ? "Generating..." : "Generate New Key"}
                 </Button>

                <div className="border rounded-lg">
                 <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead>Key</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoadingKeys ? (
                            Array.from({length: 2}).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-4 w-3/4" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                    <TableCell className="text-right"><Skeleton className="h-8 w-8 inline-block" /></TableCell>
                                </TableRow>
                            ))
                        ) : keys.map(key => (
                            <TableRow key={key.id}>
                                <TableCell className="font-mono">
                                    <div className="flex items-center gap-2">
                                        <span>{visibleKey === key.id ? key.key : `${key.key.substring(0, 8)}...`}</span>
                                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => toggleVisibility(key.id)}>
                                            {visibleKey === key.id ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </Button>
                                    </div>
                                </TableCell>
                                <TableCell>{format(new Date(key.createdAt.seconds * 1000), 'PPP')}</TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleRevokeKey(key.id)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                         {!isLoadingKeys && keys.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center h-24">No API keys found.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  )
}
