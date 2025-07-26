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
}

export interface FileItem {
    name: string;
    path: string;
    sha: string;
    size: number;
    type: 'file' | 'dir';
    html_url: string;
    download_url: string | null;
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
        const contents = await getRepoContents({ repoFullName, path });
        for (const item of contents) {
            await deleteItem(repoFullName, item.path, item.sha, item.type === 'dir');
        }
    }

    await githubApi(`/repos/${repoFullName}/contents/${path}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            message: `Delete ${isFolder ? 'folder' : 'file'}: ${path}`,
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
  
  // 1. Get the current branch
  const repo = await githubApi(`/repos/${repoFullName}`);
  const branch = repo.default_branch;

  // 2. Get the last commit SHA of the branch
  const refData = await githubApi(`/repos/${repoFullName}/git/ref/heads/${branch}`);
  const lastCommitSha = refData.object.sha;
  
  // 3. Get the tree of the last commit
  const commitData = await githubApi(`/repos/${repoFullName}/git/commits/${lastCommitSha}`);
  const treeSha = commitData.tree.sha;

  // 4. Create a new tree for the move/rename
  const { tree } = await githubApi(`/repos/${repoFullName}/git/trees/${treeSha}?recursive=1`);
  
  const newTree = tree.map((item: any) => {
    if (item.path === oldPath) {
      return { ...item, path: newPath };
    }
    if (item.path.startsWith(`${oldPath}/`)) {
       return { ...item, path: item.path.replace(oldPath, newPath) };
    }
    return item;
  }).map(({ url, sha, ...rest }: any) => ({ ...rest, sha: sha as string | null }));


  const newTreeData = await githubApi(`/repos/${repoFullName}/git/trees`, {
      method: 'POST',
      body: JSON.stringify({
          base_tree: treeSha,
          tree: newTree
      })
  });
  
  // 5. Create a new commit with the new tree
  const newCommit = await githubApi(`/repos/${repoFullName}/git/commits`, {
      method: 'POST',
      body: JSON.stringify({
          message: `Move/rename ${oldPath} to ${newPath}`,
          tree: newTreeData.sha,
          parents: [lastCommitSha]
      })
  });

  // 6. Update the branch reference to point to the new commit
  await githubApi(`/repos/${repoFullName}/git/refs/heads/${branch}`, {
      method: 'PATCH',
      body: JSON.stringify({
          sha: newCommit.sha
      })
  });

  await logActivity('move', { repoFullName, path: newPath, oldPath: oldPath });
}


export async function saveFileMetadata(repoFullName: string, filePath: string, metadata: { expiration: string | null }) {
    try {
        const docId = `${repoFullName}:${filePath}`.replace(/\//g, '_');
        const docRef = doc(db, "fileMetadata", docId);
        await setDoc(docRef, metadata, { merge: true });
        await logActivity('set_expiration', { repoFullName, path: filePath, expiration: metadata.expiration });
    } catch (error) {
        console.error("Error saving file metadata:", error);
        throw error;
    }
}

export async function getFileMetadata(repoFullName: string, filePath: string) {
    try {
        const docId = `${repoFullName}:${filePath}`.replace(/\//g, '_');
        const docRef = doc(db, "fileMetadata", docId);
        const docSnap = await getDoc(docRef);
        return docSnap.exists() ? docSnap.data() : null;
    } catch (error) {
        console.error("Error getting file metadata:", error);
        return null;
    }
}
