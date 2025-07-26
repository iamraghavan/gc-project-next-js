'use server';

import { db } from '@/lib/firebase';
import { doc, setDoc, getDoc } from "firebase/firestore"; 
import { logActivity } from './logging';


export interface Repository {
    id: number;
    name: string;
    full_name: string;
    private: boolean;
    html_url: string;
    description: string | null;
    size: number; // in KB
    default_branch: string;
}

export interface FileItem {
    name: string;
    path: string;
    sha: string;
    size: number;
    type: 'file' | 'dir';
    html_url: string;
    download_url: string | null;
    content?: string; // base64 encoded
}


const GITHUB_TOKEN = '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';
const GITHUB_API_URL = 'https://api.github.com';

async function githubApi(endpoint: string, options: RequestInit = {}) {
  const url = `${GITHUB_API_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github.v3+json',
      'X-GitHub-Api-Version': '2022-11-28'
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || `GitHub API request failed: ${response.statusText}`);
  }

  // Handle cases where response might be empty
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch(e) {
    // If parsing fails, it might be a non-JSON response (e.g. from a delete)
    return null;
  }
}

export async function getRepositories(): Promise<Repository[]> {
    try {
        return await githubApi('/user/repos?sort=updated&per_page=100');
    } catch (error) {
        console.error("Error fetching repositories:", error);
        return [];
    }
}

export async function getRepoDetails(repoFullName: string): Promise<Repository> {
    try {
        return await githubApi(`/repos/${repoFullName}`);
    } catch (error) {
        console.error("Error fetching repository details:", error);
        throw error;
    }
}

export async function createRepository(name: string): Promise<Repository> {
    try {
        const newRepo = await githubApi('/user/repos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name,
                private: true,
                auto_init: true,
                description: "Created with GitDrive"
            }),
        });
        
        await logActivity('create_repo', { repoFullName: newRepo.full_name, path: newRepo.name });
        
        // Add a README to avoid empty repo issues
        await githubApi(`/repos/${newRepo.full_name}/contents/README.md`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: 'Initial commit',
                content: btoa('# GitDrive Repository\n\nThis repository was created by GitDrive.')
            })
        });

        return newRepo;
    } catch (error) {
        console.error("Error creating repository:", error);
        throw error;
    }
}

export async function getRepoContents(params: { repoFullName: string; path?: string }): Promise<FileItem[]> {
    const { repoFullName, path = '' } = params;
    try {
        const contents = await githubApi(`/repos/${repoFullName}/contents/${path}`);
        return contents || [];
    } catch (error) {
        console.error(`Error fetching contents for ${repoFullName} at path ${path}:`, error);
        return [];
    }
}

export async function getFileContent(repoFullName: string, path: string): Promise<FileItem> {
    try {
        return await githubApi(`/repos/${repoFullName}/contents/${path}`);
    } catch (error) {
        console.error(`Error fetching file content for ${path}:`, error);
        throw error;
    }
}

export async function createFolder(repoFullName: string, path: string): Promise<void> {
    const filePath = `${path}/.gitkeep`;
    await githubApi(`/repos/${repoFullName}/contents/${filePath}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            message: `Create folder: ${path}`,
            content: '' // empty content for .gitkeep
        })
    });
    await logActivity('create_folder', { repoFullName, path });
}

export async function uploadFile(repoFullName: string, path: string, content: string): Promise<void> {
    await githubApi(`/repos/${repoFullName}/contents/${path}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            message: `Upload file: ${path}`,
            content: content,
        })
    });
    await logActivity('upload', { repoFullName, path });
}

export async function deleteItem(repoFullName: string, path: string, sha: string, isFolder: boolean): Promise<void> {
    if (isFolder) {
        // GitHub API doesn't support direct folder deletion.
        // It requires deleting each file individually.
        // A more robust solution for large folders would be to use the Git Trees API,
        // but for simplicity here we delete one by one.
        const contents = await getRepoContents({ repoFullName, path });
        for (const item of contents) {
            await deleteItem(repoFullName, item.path, item.sha, item.type === 'dir');
        }
        // After deleting all contents, the folder implicitly no longer exists.
        await logActivity('delete', { repoFullName, path });
        return;
    }

    await githubApi(`/repos/${repoFullName}/contents/${path}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            message: `Delete file: ${path}`,
            sha,
        }),
    });
    await logActivity('delete', { repoFullName, path });
}


export async function moveOrRenameItem(
  repoFullName: string,
  oldPath: string,
  newPath: string
): Promise<void> {
  // This approach is complex with the REST API. It involves creating a new blob, tree, and commit.
  // This is a simplified version that reads the content and creates a new file, then deletes the old one.
  // This is not atomic and can be slow for large files.
  
  const fileData = await getFileContent(repoFullName, oldPath);

  if (!fileData.content) {
    throw new Error("Could not retrieve file content to move.");
  }

  // Create the new file
  await uploadFile(repoFullName, newPath, fileData.content);

  // Delete the old file
  await deleteItem(repoFullName, oldPath, fileData.sha, false);


  await logActivity('move', { repoFullName, path: newPath, oldPath: oldPath });
}

export async function duplicateItem(repoFullName: string, path: string): Promise<void> {
    const fileData = await getFileContent(repoFullName, path);
    const pathParts = path.split('/');
    const originalName = pathParts.pop()!;
    const directory = pathParts.join('/');

    const nameParts = originalName.split('.');
    const ext = nameParts.length > 1 ? `.${nameParts.pop()}` : '';
    const baseName = nameParts.join('.');
    
    const newName = `${baseName} (copy)${ext}`;
    const newPath = directory ? `${directory}/${newName}` : newName;
    
    if (!fileData.content) {
        throw new Error("Cannot duplicate file without content.");
    }
    
    await uploadFile(repoFullName, newPath, fileData.content);
    await logActivity('duplicate', { repoFullName, path: newPath, originalPath: path });
}


export async function saveFileMetadata(repoFullName: string, filePath: string, metadata: any) {
    try {
        const docId = `${repoFullName}:${filePath}`.replace(/[\/.]/g, '_');
        const docRef = doc(db, "fileMetadata", docId);
        await setDoc(docRef, metadata, { merge: true });
        
        if (metadata.expiration !== undefined) {
             await logActivity('set_expiration', { repoFullName, path: filePath, expiration: metadata.expiration });
        }
        if (metadata.favorite !== undefined) {
            await logActivity('favorite', { repoFullName, path: filePath, isFavorite: metadata.favorite });
        }

    } catch (error) {
        console.error("Error saving file metadata:", error);
        throw error;
    }
}

export async function getFileMetadata(repoFullName: string, filePath: string): Promise<{ expiration?: string | null; favorite?: boolean } | null> {
    try {
        const docId = `${repoFullName}:${filePath}`.replace(/[\/.]/g, '_');
        const docRef = doc(db, "fileMetadata", docId);
        const docSnap = await getDoc(docRef);
        return docSnap.exists() ? docSnap.data() : null;
    } catch (error) {
        console.error("Error getting file metadata:", error);
        return null;
    }
}

export async function toggleFavorite(repoFullName: string, filePath: string): Promise<void> {
    const metadata = await getFileMetadata(repoFullName, filePath);
    await saveFileMetadata(repoFullName, filePath, { favorite: !metadata?.favorite });
}
