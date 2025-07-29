
"use client"

import * as React from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Code, Copy, Server } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"

export default function ApiPage() {
  const { toast } = useToast()
  const [baseUrl, setBaseUrl] = React.useState("")

  React.useEffect(() => {
    // This ensures window is defined, avoiding SSR issues.
    setBaseUrl(window.location.origin)
  }, [])

  const exampleUrl = `${baseUrl}/api/upload/{YOUR_GITHUB_USER}/{YOUR_REPO_NAME}/path/to/your/file.txt`
  const curlCommand = `curl -X POST "${exampleUrl}" \\
     -H "Content-Type: text/plain" \\
     --data-binary "@/path/to/your/local/file.txt"`

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied to clipboard!",
    })
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">API Access</h2>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Server className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle>File Upload API Endpoint</CardTitle>
              <CardDescription>
                Use this endpoint to upload files directly to your GitHub
                repositories.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <h3 className="font-semibold">Endpoint URL</h3>
            <div className="flex items-center gap-2 font-mono text-sm p-3 bg-secondary rounded-md">
              <span className="flex-1 break-all">
                POST {baseUrl}/api/upload/&#123;user&#125;/&#123;repo&#125;/&#123;path&#125;
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleCopy(exampleUrl)}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Replace &#123;user&#125;, &#123;repo&#125;, and &#123;path&#125; with your GitHub username,
              repository name, and the desired file path.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">Request Body</h3>
            <p className="text-sm">
              The body of the POST request should contain the **raw content** of the
              file you want to upload.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">Example Usage (cURL)</h3>
            <p className="text-sm pb-2">
              Here is an example of how to upload a local text file using cURL:
            </p>
            <div className="flex items-center gap-2 font-mono text-sm p-3 bg-secondary rounded-md">
              <pre className="flex-1 break-all overflow-auto">
                <code>{curlCommand}</code>
              </pre>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleCopy(curlCommand)}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="pt-4">
             <h3 className="font-semibold">Security</h3>
            <p className="text-sm text-muted-foreground">
                This API endpoint uses the globally configured GitHub Personal Access Token from this application's environment for authentication. No additional authorization headers are required from the client.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
