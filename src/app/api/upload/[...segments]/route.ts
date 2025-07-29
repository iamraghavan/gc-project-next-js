
import { NextResponse, type NextRequest } from "next/server";
import { uploadFile } from "@/services/github";

export async function POST(
  request: NextRequest,
  { params }: { params: { segments: string[] } }
) {
  try {
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

    const [user, repo, ...pathParts] = segments;
    const repoFullName = `${user}/${repo}`;
    const path = pathParts.join("/");
    const fileContent = await request.text();

    if (!path) {
        return NextResponse.json(
            { error: "File path cannot be empty." },
            { status: 400 }
        );
    }
    
    if (!fileContent) {
        return NextResponse.json(
            { error: "Request body cannot be empty. Please provide the file content." },
            { status: 400 }
        );
    }
    
    // Convert the raw content to base64, as required by the GitHub API
    const contentAsBase64 = Buffer.from(fileContent).toString('base64');
    
    await uploadFile(repoFullName, path, contentAsBase64);

    return NextResponse.json(
      {
        message: "File uploaded successfully.",
        repo: repoFullName,
        path: path,
        url: `https://github.com/${repoFullName}/blob/main/${path}`,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("API Upload Error:", error);
    return NextResponse.json(
      {
        error: "Failed to upload file.",
        details: error.message || "An unknown error occurred.",
      },
      { status: 500 }
    );
  }
}
