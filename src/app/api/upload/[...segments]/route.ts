
import { NextResponse, type NextRequest } from "next/server";
import { uploadFile, deleteItem, getFileContent } from "@/services/github";
import { validateApiKey } from "@/services/apiKeys";

function generateUrls(repoFullName: string, path: string) {
    const encodedPath = path.split('/').map(segment => encodeURIComponent(segment)).join('/');
    return {
        github_url: `https://github.com/${repoFullName}/blob/main/${path}`,
        raw_url: `https://raw.githubusercontent.com/${repoFullName}/main/${path}`,
        jsdelivr_url: `https://cdn.jsdelivr.net/gh/${repoFullName}@main/${path}`
    };
}


async function handleRequest(request: NextRequest, { params }: { params: { segments: string[] } }) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized: Missing or invalid API key." }, { status: 401 });
    }
    const apiKey = authHeader.split(" ")[1];

    const isValid = await validateApiKey(apiKey);
    if (!isValid) {
      return NextResponse.json({ error: "Unauthorized: Invalid API key." }, { status: 401 });
    }

    const { segments } = params;
    if (segments.length < 3) {
      return NextResponse.json(
        {
          error:
            "Invalid URL format. Expected /api/upload/{user}/{repo}/{path...}",
        },
        { status: 400 }
      );
    }
    
    const [owner, repo, ...pathParts] = segments;
    const repoFullName = `${owner}/${repo}`;
    const path = pathParts.join("/");

     if (!path) {
        return NextResponse.json(
            { error: "File path cannot be empty." },
            { status: 400 }
        );
    }
    
    return { repoFullName, path };

  } catch (error: any) {
    console.error("API Authorization Error:", error);
    return NextResponse.json(
      {
        error: "An internal server error occurred during authorization.",
        details: error.message || "An unknown error occurred.",
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { segments: string[] } }
) {
    const authResult = await handleRequest(request, { params });
    if (authResult instanceof NextResponse) return authResult;
    const { repoFullName, path } = authResult;

    try {
        const fileContent = await request.text();
        if (!fileContent) {
            return NextResponse.json(
                { error: "Request body cannot be empty. Please provide the file content." },
                { status: 400 }
            );
        }
        
        const contentAsBase64 = Buffer.from(fileContent).toString('base64');
        
        const fileExists = await getFileContent(repoFullName, path).then(res => res.sha).catch(() => null);
        const message = fileExists ? `Update file via API: ${path}` : `Create file via API: ${path}`;
        const status = fileExists ? 200 : 201;

        await uploadFile(repoFullName, path, contentAsBase64, message);

        return NextResponse.json(
          {
            message: `File ${fileExists ? 'updated' : 'created'} successfully.`,
            repo: repoFullName,
            path: path,
            links: generateUrls(repoFullName, path)
          },
          { status }
        );
    } catch (error: any) {
        console.error("API POST Error:", error);
        return NextResponse.json(
        {
            error: "Failed to upload file.",
            details: error.message || "An unknown error occurred.",
        },
        { status: 500 }
        );
    }
}


export async function GET(
  request: NextRequest,
  { params }: { params: { segments: string[] } }
) {
    const authResult = await handleRequest(request, { params });
    if (authResult instanceof NextResponse) return authResult;
    const { repoFullName, path } = authResult;
    
    try {
        const fileData = await getFileContent(repoFullName, path);
        
        if (!fileData || !fileData.content) {
            return NextResponse.json({ error: "File not found or content is empty." }, { status: 404 });
        }

        const decodedContent = Buffer.from(fileData.content, 'base64').toString('utf-8');

        return NextResponse.json({
            message: "File content retrieved successfully.",
            repo: repoFullName,
            path: path,
            size: fileData.size,
            sha: fileData.sha,
            content: decodedContent,
            links: generateUrls(repoFullName, path)
        });

    } catch (error: any) {
         console.error("API GET Error:", error);
        if (error.message.includes("Not Found")) {
            return NextResponse.json({ error: "File not found." }, { status: 404 });
        }
        return NextResponse.json(
            {
                error: "Failed to retrieve file.",
                details: error.message || "An unknown error occurred.",
            },
            { status: 500 }
        );
    }
}


export async function DELETE(
  request: NextRequest,
  { params }: { params: { segments: string[] } }
) {
    const authResult = await handleRequest(request, { params });
    if (authResult instanceof NextResponse) return authResult;
    const { repoFullName, path } = authResult;

    try {
        const fileData = await getFileContent(repoFullName, path).catch(() => null);

        if (!fileData) {
            return NextResponse.json({ error: "File not found. Nothing to delete." }, { status: 404 });
        }

        await deleteItem(repoFullName, path, fileData.sha, false);

        return NextResponse.json(
          {
            message: "File deleted successfully.",
            repo: repoFullName,
            path: path,
          },
          { status: 200 }
        );

    } catch (error: any) {
        console.error("API DELETE Error:", error);
        return NextResponse.json(
        {
            error: "Failed to delete file.",
            details: error.message || "An unknown error occurred.",
        },
        { status: 500 }
        );
    }
}
